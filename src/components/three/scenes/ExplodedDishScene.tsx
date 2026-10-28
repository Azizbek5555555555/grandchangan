"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Kind, SceneLayer, SceneRecipe, Tint } from "@/lib/menu/recipe-types";
import BlobShadow from "../lib/BlobShadow";
import { useDisposable } from "../lib/dispose";
import { clamp01, enterProgress, labelSchedule, rng, smooth } from "../lib/motion";
import SceneCanvas from "../lib/SceneCanvas";
import StudioLights from "../lib/StudioLights";
import { noiseTexture } from "../lib/textures";
import type { SceneProps } from "../lib/types";
import { useFitCamera } from "../lib/useFitCamera";
import Bowl, { BOWL, innerRadiusAt } from "../models/Bowl";
import BowlToppings, { type ToppingPart } from "../models/BowlToppings";
import { kindDef, kindExtent, partsBounds, placeKind, type KindDef, type Region } from "../models/DishKit";
import { useOptionalFoodKit, type FoodKit } from "../models/Ingredients";
import Noodles, { type NoodleLayout } from "../models/Noodles";
import VesselModel, { surfaceY, vesselKey, vesselSpec, type VesselSpec } from "../models/Vessels";
import { P } from "../palette";

/* Umumiy "exploded" sahna: har qanday taom retsepti (idish + 2–5 qatlam) scroll'da qatlamlarga ajraladi,
   har qatlam yonida chiziq va nom. Bosh sahifadagi lag'mon ham shu sahna (bowl* qatlamlari — asl modellar).
   Progress — [data-explode-track] bo'limi scroll'idan (sticky bo'lim), topilmasa konteyner ko'rinishidan. */

const VIEW_DIR: [number, number, number] = [0, 0.42, 1];

/** Kamera kadri: nishon balandligi, kadr kengligi (kompyuter / telefon), balandligi, yig'iq holatdagi ko'tarilish */
export type ExplodeView = { target: number; fitW: number; fitWm: number; fitH: number; lift: number };

export type ExplodedDishProps = SceneProps & { recipe: SceneRecipe; labels: string[]; view?: ExplodeView };

function sectionProgress(el: HTMLElement): number {
  const sec = el.closest<HTMLElement>("[data-explode-track]");
  if (!sec) return smooth(enterProgress(el, 0.9, 0.5));
  const r = sec.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  const travel = Math.max(1, r.height - vh);
  // bo'lim yopishgan paytdagi scroll ulushi: 10%..80% oralig'ida to'liq ajraladi
  return smooth(clamp01((-r.top / travel - 0.1) / 0.7));
}

/* ---------------- Yuzalar: sho'rva/qayla, suyuqlik, guruch ---------------- */

/** Qayla/sho'rva yuzasi: chetga qarab quyuqlashadi, moy tomchilari va mayda ziravor dog'lari (protsedural) */
function liquidTexture(tint: Tint, size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const base = new THREE.Color(P[tint]);
  const css = (k: THREE.Color, a = 1) => `rgba(${Math.round(k.r * 255)},${Math.round(k.g * 255)},${Math.round(k.b * 255)},${a})`;
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.05, size / 2, size / 2, size / 2);
  g.addColorStop(0, css(base.clone().lerp(new THREE.Color(1, 1, 1), 0.1)));
  g.addColorStop(0.75, css(base));
  g.addColorStop(1, css(base.clone().multiplyScalar(0.62)));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const r = rng(5);
  const oil = base.clone().lerp(new THREE.Color(P.oil), 0.55);
  for (let i = 0; i < 70; i++) {
    const rad = (2 + r() * r() * 16) * (size / 512);
    ctx.fillStyle = css(oil, 0.35 + r() * 0.3);
    ctx.beginPath();
    ctx.ellipse(r() * size, r() * size, rad, rad * (0.7 + r() * 0.3), r() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  const fleck = base.clone().multiplyScalar(0.45);
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = css(fleck, 0.5);
    ctx.fillRect(r() * size, r() * size, 1.5 * (size / 512), 1.5 * (size / 512));
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Disc({ r, y, tint, mobile, sx = 1, sz = 1 }: { r: number; y: number; tint: Tint; mobile: boolean; sx?: number; sz?: number }) {
  const res = useDisposable(() => {
    // yupqa silindr — chetida qalinligi ko'rinadi
    const geo = new THREE.CylinderGeometry(r, r * 0.97, 0.03, mobile ? 56 : 96, 1);
    const map = liquidTexture(tint, mobile ? 256 : 512);
    const ripple = noiseTexture(256, 5, 4, 1.2, 17);
    ripple.repeat.set(3, 3);
    const mat = new THREE.MeshPhysicalMaterial({ map, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04, bumpMap: ripple, bumpScale: 0.1 });
    return { geo, map, ripple, mat };
  }, [r, tint, mobile]);
  return <mesh geometry={res.geo} material={res.mat} position={[0, y - 0.012, 0]} scale={[sx, 1, sz]} />;
}

function Liquid({ spec, tint, mobile }: { spec: VesselSpec; tint: Tint; mobile: boolean }) {
  const res = useDisposable(() => {
    const inner = spec.innerAt ?? (() => spec.fillR);
    // stakan tubi 0.16 da, piyola tubi 0.1 da
    const y0 = spec.top > 1 ? 0.17 : 0.11;
    const pts: THREE.Vector2[] = [new THREE.Vector2(0, y0)];
    for (let i = 0; i <= 14; i++) {
      const y = y0 + (i / 14) * (spec.fillY - y0);
      pts.push(new THREE.Vector2(inner(y) - 0.012, y));
    }
    pts.push(new THREE.Vector2(0, spec.fillY));
    const geo = new THREE.LatheGeometry(pts, mobile ? 36 : 64);
    geo.computeVertexNormals();
    const mat = new THREE.MeshPhysicalMaterial({
      // transmission o'rniga oddiy shaffoflik — har kadr qo'shimcha render o'tishi va og'ir shader yo'q
      color: P[tint], roughness: 0.1, clearcoat: 1, transparent: true, opacity: 0.95,
    });
    return { geo, mat };
  }, [spec, tint, mobile]);
  return <mesh geometry={res.geo} material={res.mat} renderOrder={1} />;
}

function Rice({ spec, region, tint, mobile }: { spec: VesselSpec; region: Region; tint: Tint; mobile: boolean }) {
  const rd = Math.min(spec.rx, spec.rz) * 0.82;
  const h = Math.min(0.55, rd * 0.5);
  const res = useDisposable(() => {
    const domeGeo = new THREE.SphereGeometry(rd, mobile ? 28 : 44, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, (h - 0.02) / rd, 1);
    const color = new THREE.Color(P[tint]);
    const domeMat = new THREE.MeshStandardMaterial({ color: color.clone().multiplyScalar(0.9), roughness: 0.75 });
    const grainGeo = new THREE.CapsuleGeometry(0.017, 0.042, 2, 6);
    const grainMat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.45, sheen: 0.5, sheenColor: new THREE.Color(P.white) });
    return { domeGeo, domeMat, grainGeo, grainMat };
  }, [rd, h, tint, mobile]);
  const n = mobile ? 220 : 560;
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const r = rng(77);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const v = new THREE.Vector3();
    const s = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * rd * 0.98;
      const y = h * Math.sqrt(Math.max(0, 1 - (d / rd) ** 2));
      e.set(r() * 3, r() * 3, r() * 3);
      q.setFromEuler(e);
      v.set(Math.cos(a) * d, region.fillY + 0.02 + y, Math.sin(a) * d);
      m.compose(v, q, s);
      ref.current?.setMatrixAt(i, m);
    }
    if (ref.current) {
      ref.current.instanceMatrix.needsUpdate = true;
      ref.current.computeBoundingSphere();
    }
  }, [n, rd, h, region.fillY]);
  return (
    <group>
      <mesh geometry={res.domeGeo} material={res.domeMat} position={[0, region.fillY + 0.02, 0]} />
      <instancedMesh ref={ref} args={[res.grainGeo, res.grainMat, n]} />
    </group>
  );
}

/* ---------------- Bo'laklar (InstancedMesh) ---------------- */

function Inst({ geo, mat, list }: { geo: THREE.BufferGeometry; mat: THREE.Material; list: THREE.Matrix4[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const im = ref.current;
    if (!im) return;
    list.forEach((m, i) => im.setMatrixAt(i, m));
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
  }, [list]);
  if (!list.length) return null;
  return <instancedMesh ref={ref} args={[geo, mat, list.length]} />;
}

function Pieces({ kind, def, region, n, seed, k, tint, mobile }: { kind: Kind; def: KindDef; region: Region; n: number; seed: number; k: number; tint?: Tint; mobile: boolean }) {
  const res = useDisposable(() => {
    const parts = def.build(mobile, tint ? new THREE.Color(P[tint]) : null, tint);
    // disposeDeep chuqurligi cheklangan — geometriya, material va teksturalar tekis ro'yxatda (unmount'da bo'shatiladi)
    const geos = parts.flatMap((p) => p.geos);
    const mats = parts.map((p) => p.mat);
    const maps = parts.map((p) => (p.mat as THREE.MeshStandardMaterial).map).filter(Boolean);
    return { parts, geos, mats, maps };
  }, [kind, mobile, tint]);
  const mats = useMemo(() => placeKind(def, region, n, seed, k, partsBounds(res.parts)), [def, region, n, seed, k, res]);
  return (
    <group>
      {res.parts.map((p, pi) =>
        p.geos.map((g, vi) => (
          <Inst key={`${pi}-${vi}`} geo={g} mat={p.mat} list={mats.filter((_, i) => i % p.geos.length === vi)} />
        )),
      )}
    </group>
  );
}

/* ---------------- Qatlam ---------------- */

type Ctx = {
  recipe: SceneRecipe;
  spec: VesselSpec;
  region: Region;
  mobile: boolean;
  /** Faqat bowl* qatlamlari bo'lsa (bosh sahifa lag'moni) */
  kit: FoodKit | null;
  layout: NoodleLayout;
  timeRef: React.RefObject<{ t: number; lift: number }>;
};

function KindNode({ kind, tint, count, k, seed, c }: { kind: Kind; tint?: Tint; count?: number; k: number; seed: number; c: Ctx }) {
  const { spec, region, mobile, kit, layout, timeRef, recipe } = c;
  const toppings = (parts: ToppingPart[]) => (kit ? <BowlToppings kit={kit} layout={layout} mobile={mobile} parts={parts} /> : null);
  switch (kind) {
    case "bowlBroth":
      return <Bowl mobile={mobile} part="broth" />;
    case "bowlNoodles":
      return <Noodles layout={layout} mobile={mobile} timeRef={timeRef} nestOnly />;
    case "bowlBeef":
      return toppings(["beef"]);
    case "bowlGreens":
      return toppings(["chok", "leaves"]);
    case "bowlGarnish":
      if (!kit) return null;
      return (
        <>
          {toppings(["rings", "seeds"])}
          <group position={[-0.25, 1.05, 0.35]} rotation={[0.2, 0.6, 0.1]} scale={0.55}>
            <mesh geometry={kit.geo.chiliA} material={kit.mat.chiliRed} />
            <mesh geometry={kit.geo.chiliAGreen} material={kit.mat.stem} />
          </group>
          <group position={[0.45, 1.05, -0.2]} rotation={[0.1, 2.2, -0.15]} scale={0.5}>
            <mesh geometry={kit.geo.anise} material={kit.mat.anise} />
            <mesh geometry={kit.geo.aniseSeeds} material={kit.mat.aniseSeed} />
          </group>
        </>
      );
    case "broth":
      if (vesselKey(recipe.vessel) === "bowl" && !tint) return <Bowl mobile={mobile} part="broth" />;
      return <Disc r={spec.fillR} y={spec.fillY} tint={tint ?? "brothClear"} mobile={mobile} />;
    case "sauce":
      return <Disc r={1} y={spec.fillY + 0.006} sx={spec.rx * 0.74} sz={spec.rz * 0.74} tint={tint ?? "sauceBrown"} mobile={mobile} />;
    case "liquid":
      return <Liquid spec={spec} tint={tint ?? "water"} mobile={mobile} />;
    case "rice":
      return <Rice spec={spec} region={region} tint={tint ?? "rice"} mobile={mobile} />;
    case "noodles":
      return <Noodles layout={layout} mobile={mobile} timeRef={timeRef} nestOnly tint={tint ? P[tint] : undefined} />;
    default: {
      const def = kindDef(kind);
      if (!def) return null;
      const n = count ?? def.count[mobile ? 1 : 0];
      return <Pieces kind={kind} def={def} region={region} n={n} seed={seed} k={k} tint={tint} mobile={mobile} />;
    }
  }
}

/** Qatlam nomi balandligi va eng yuqori nuqtasi */
function extentOf(kind: Kind | "vessel", spec: VesselSpec, region: Region): { label: number; top: number } {
  switch (kind) {
    case "vessel":
      return { label: spec.labelY, top: spec.top };
    case "bowlBroth":
      return { label: BOWL.brothY, top: BOWL.brothY };
    case "bowlNoodles":
      return { label: 0.95, top: 1.05 };
    case "bowlBeef":
    case "bowlGreens":
    case "bowlGarnish":
      return { label: 1.0, top: 1.15 };
    case "broth":
    case "sauce":
      return { label: spec.fillY, top: spec.fillY + 0.02 };
    case "liquid":
      return { label: spec.fillY * 0.6, top: spec.fillY };
    case "rice":
      return { label: spec.fillY + 0.2, top: spec.fillY + 0.5 };
    case "noodles":
      return { label: spec.fillY + 0.14, top: spec.fillY + 0.28 };
    default: {
      const def = kindDef(kind);
      return def ? kindExtent(def, region) : { label: spec.fillY, top: spec.fillY };
    }
  }
}

const BASE_KINDS: Kind[] = ["noodles", "rice", "bowlNoodles"];

function ExplodedContent({ reduced, mobile, trackRef, recipe, labels, view }: Pick<ExplodedDishProps, "reduced" | "mobile" | "trackRef" | "recipe" | "labels" | "view">) {
  const spec = vesselSpec(recipe.vessel);
  // Lag'mon/guruch bo'lmasa (sho'rva, qovurma) — tepalik pastroq: bo'laklar suyuqlik yuzasiga yaqin
  const heap = recipe.layers.some((l) => BASE_KINDS.includes(l.kind as Kind) || l.with?.some((w) => BASE_KINDS.includes(w.kind)));
  const region = useMemo<Region>(() => {
    const s = { ...spec, mound: spec.mound * (heap ? 1 : 0.35) };
    return { rx: spec.rx, rz: spec.rz, rect: spec.shape === "rect", surf: (x, z) => surfaceY(s, x, z), fillY: spec.fillY, top: spec.top, half: spec.half, innerAt: spec.innerAt };
  }, [spec, heap]);

  // Lag'mon kosasining asl bezaklari faqat kerak bo'lsa quriladi (boshqa taomlarda ortiqcha ish yo'q)
  const needsKit = recipe.layers.some((l) => l.kind === "bowlBeef" || l.kind === "bowlGreens" || l.kind === "bowlGarnish");
  const kit = useOptionalFoodKit(needsKit, mobile);
  const layout = useMemo<NoodleLayout>(
    () => ({
      brothY: spec.fillY,
      radius: vesselKey(recipe.vessel) === "bowl" ? innerRadiusAt(BOWL.brothY) : spec.fillR * 0.92,
      tip: new THREE.Vector3(0.3, 1.9, 0.3),
      axis: new THREE.Vector3(1, 0, 0),
      base: new THREE.Vector3(0.2, 0, 0.2),
    }),
    [spec, recipe.vessel],
  );
  const timeRef = useRef({ t: 0, lift: 0 });
  const ctx: Ctx = { recipe, spec, region, mobile, kit, layout, timeRef };

  const layers = recipe.layers;
  const N = layers.length;
  const ext = layers.map((l) => {
    const e = [extentOf(l.kind, spec, region), ...(l.with ?? []).map((w) => extentOf(w.kind, spec, region))];
    return { label: e[0].label, top: Math.max(...e.map((x) => x.top)) };
  });
  // Qatlamlar kam yoki yassi bo'lsa — oraliq kattaroq: ajralgan ustun kadrni to'ldiradi (bosh sahifa lag'moni — asl 0.78)
  const gap = view ? spec.gap : THREE.MathUtils.clamp((4.6 - ext[N - 1].top) / Math.max(1, N - 1), spec.gap, 1.4);
  const H = Math.max(...ext.map((e, i) => i * gap + e.top));
  const hasBeside = layers.some((l) => l.kind === "bottle" || l.kind === "can");
  const v: ExplodeView = view ?? {
    target: H * 0.48,
    // stakan yonidagi shisha/banka ham kadrga sig'sin
    fitW: THREE.MathUtils.clamp(spec.half * 2 + 3, 5, 6.8) + (hasBeside ? 1.6 : 0),
    fitWm: Math.max(4.2, spec.half * 2 + 1.4),
    fitH: H + 1.5,
    lift: H * 0.357,
  };
  const target = useMemo<[number, number, number]>(() => [0, v.target, 0], [v.target]);
  useFitCamera(target, VIEW_DIR, mobile ? v.fitWm : v.fitW, v.fitH);

  const shiftX = 1.3 - Math.max(0, spec.half - 1.64) * 0.6;
  const sched = labelSchedule(N);
  const stack = useRef<THREE.Group>(null);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const labelEls = useRef<(HTMLDivElement | null)[]>([]);
  const prog = useRef(reduced ? 1 : 0);

  useFrame((state, dt) => {
    const t = reduced ? 1 : state.clock.elapsedTime;
    timeRef.current.t = t;
    const goal = reduced || !trackRef.current ? 1 : sectionProgress(trackRef.current);
    prog.current = THREE.MathUtils.damp(prog.current, goal, 6, Math.min(dt, 0.1));
    const p = prog.current;
    // yig'iq holatda idish kadr markazida, ajralganda butun ustun ko'rinadi
    if (stack.current) {
      stack.current.position.set(mobile ? 0 : shiftX, (1 - p) * v.lift, 0);
      stack.current.rotation.y = Math.sin(t * 0.3) * 0.12 + p * 0.35;
    }
    groups.current.forEach((g, i) => {
      if (!g) return;
      const local = smooth(clamp01(p * 1.25 - i * 0.04));
      g.position.y = local * gap * i + Math.sin(t * 0.9 + i) * 0.025 * local;
      g.rotation.set(local * 0.1, local * i * 0.12, 0);
    });
    labelEls.current.forEach((el, i) => {
      if (!el) return;
      const li = N - 1 - i; // label i (yuqoridan) → qatlam (pastdan)
      const a = clamp01((p - sched.start - li * sched.step) / sched.fade);
      el.style.opacity = String(a);
      el.style.transform = `translate(-100%, -50%) translateX(${(1 - a) * -14}px)`;
    });
  });

  // Keng idish (baliq lagani) — ustun chaproqqa, nomlar idish chetiga kirib turadi (canvas chetida kesilmasin)
  const labelX = -(Math.min(spec.half, 1.75) + 0.17);
  return (
    <>
      <StudioLights variant="night" keyIntensity={2.4} />
      <BlobShadow color={P.shadowNight} opacity={0.6} position={[0, -0.02, 0]} scale={[spec.half * 2.86, spec.half * 1.35]} />
      <group ref={stack}>
        {layers.map((L: SceneLayer, i) => {
          const label = labels[N - 1 - i];
          return (
            <group key={i} ref={(el) => { groups.current[i] = el; }}>
              <group rotation-y={spec.yaw ?? 0}>
                {L.kind === "vessel" ? (
                  <VesselModel vessel={recipe.vessel} mobile={mobile} tint={recipe.vesselTint} />
                ) : (
                  <>
                    <KindNode kind={L.kind} tint={L.tint} count={L.count} k={i - 1} seed={11 + i * 17} c={ctx} />
                    {L.with?.map((w, j) => <KindNode key={j} kind={w.kind} tint={w.tint} count={w.count} k={i - 1} seed={53 + i * 17 + j * 7} c={ctx} />)}
                  </>
                )}
              </group>
              {/* Telefonda nomlar sahna ostidagi ro'yxatda — bu yerda chizilmaydi */}
              {label && !mobile && (
                <Html position={[labelX, ext[i].label, 0]} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
                  <div
                    ref={(el) => { labelEls.current[N - 1 - i] = el; }}
                    className="flex items-center gap-3 whitespace-nowrap"
                    style={{ transform: "translate(-100%, -50%)", opacity: reduced ? 1 : 0 }}
                  >
                    {/* Bosh sahifa lag'moni — asl ko'rinish; taom sahifalarida nom o'z kengligida (w-max), faqat 11.5rem dan uzuni 2 qatorga o'tadi */}
                    <span
                      className={
                        view
                          ? "max-w-[8.5rem] whitespace-normal text-right font-display text-[13px] italic leading-tight text-brand-cream sm:max-w-none sm:whitespace-nowrap sm:text-lg"
                          : "w-max max-w-[8.5rem] whitespace-normal text-right font-display text-[13px] italic leading-tight text-brand-cream sm:max-w-[11.5rem] sm:text-[17px]"
                      }
                    >
                      {label}
                    </span>
                    <span className={view ? "h-px w-8 bg-brand-gold/70 sm:w-16" : "h-px w-8 shrink-0 bg-brand-gold/70 sm:w-10"} />
                    <span className="size-1.5 rounded-full bg-saffron" />
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </group>
    </>
  );
}

export default function ExplodedDishScene(props: ExplodedDishProps) {
  return (
    <SceneCanvas {...props} camera={{ fov: 30, position: [0, 4, 10], near: 0.1, far: 80 }}>
      <ExplodedContent reduced={props.reduced} mobile={props.mobile} trackRef={props.trackRef} recipe={props.recipe} labels={props.labels} view={props.view} />
    </SceneCanvas>
  );
}
