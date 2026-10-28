"use client";

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Tint, Vessel } from "@/lib/menu/recipe-types";
import { useDisposable } from "../lib/dispose";
import { noiseTexture } from "../lib/textures";
import { P } from "../palette";
import Bowl, { BOWL, innerRadiusAt } from "./Bowl";
import { SteamerBasket } from "./Steamer";

/* Qatlamli sahna idishlari: chinni kosa (lag'mon kosasi), chuqur va yassi tarelka, baliq patnisi, sopol xumcha,
   tosh hovoncha, bambuk savat, yog'och taxta, stakan, choy piyolasi. Har biri uchun "spec" — masalliqlar qayerga
   joylashadi (yuza balandligi, radius, shakl) va kamera/nomlar uchun o'lchamlar. */

export type VesselSpec = {
  /** Masalliqlar yotadigan yuza (sho'rva/qayla sathi) */
  fillY: number;
  /** Yuza radiusi (oval/to'rtburchakda — x va z yarim o'lchami) */
  rx: number;
  rz: number;
  shape: "round" | "rect";
  /** Markazdagi tepalik balandligi */
  mound: number;
  /** Idish balandligi (kamera uchun) */
  top: number;
  /** Eng keng yarim kenglik (nomlar va kamera uchun) */
  half: number;
  /** Idish nomining balandligi */
  labelY: number;
  /** Qatlamlar orasidagi masofa ajralganda */
  gap: number;
  /** Sho'rva/qayla yuzasi radiusi (fillY balandligida) */
  fillR: number;
  /** Idishni burish: ajralgan holatda (ustun +0.35 rad buriladi) uzun baliq lagani yon tomoni bilan ko'rinsin */
  yaw?: number;
  /** Ichimlik idishi: suyuqlik profili (y → ichki radius) */
  innerAt?: (y: number) => number;
};

const glassInner = (y: number) => 0.505 + 0.095 * THREE.MathUtils.clamp((y - 0.16) / 1.54, 0, 1);
const cupInner = (y: number) => 0.3 + 0.36 * Math.sin(THREE.MathUtils.clamp((y - 0.1) / 0.55, 0, 1) * Math.PI * 0.5);

const BOWL_R = innerRadiusAt(BOWL.brothY);
const SPECS: Record<Exclude<Vessel, "bottle" | "skewers">, VesselSpec> = {
  bowl: { fillY: BOWL.brothY, rx: BOWL_R, rz: BOWL_R, shape: "round", mound: 0.21, top: 1.0, half: 1.33, labelY: 0.55, fillR: BOWL_R + 0.004, gap: 0.78 },
  deepPlate: { fillY: 0.16, rx: 1.12, rz: 1.12, shape: "round", mound: 0.3, top: 0.36, half: 1.58, labelY: 0.2, fillR: 1.02, gap: 0.72 },
  plate: { fillY: 0.08, rx: 1.15, rz: 1.15, shape: "round", mound: 0.3, top: 0.16, half: 1.64, labelY: 0.1, fillR: 1.08, gap: 0.7 },
  fishPlatter: { yaw: -0.3, fillY: 0.08, rx: 1.5, rz: 0.98, shape: "round", mound: 0.22, top: 0.16, half: 2.05, labelY: 0.1, fillR: 1.08, gap: 0.7 },
  clayPot: { fillY: 0.8, rx: 0.86, rz: 0.86, shape: "round", mound: 0.16, top: 1.06, half: 1.22, labelY: 0.5, fillR: 0.99, gap: 0.78 },
  mortar: { fillY: 0.56, rx: 0.86, rz: 0.86, shape: "round", mound: 0.22, top: 0.78, half: 1.3, labelY: 0.4, fillR: 0.99, gap: 0.76 },
  steamer: { fillY: 0.12, rx: 1.2, rz: 1.2, shape: "round", mound: 0.02, top: 0.62, half: 1.55, labelY: 0.32, fillR: 1.3, gap: 0.8 },
  board: { fillY: 0.16, rx: 1.25, rz: 0.72, shape: "rect", mound: 0.04, top: 0.16, half: 1.55, labelY: 0.08, fillR: 1.1, gap: 0.72 },
  glass: { fillY: 1.32, rx: 0.5, rz: 0.5, shape: "round", mound: 0, top: 1.72, half: 0.66, labelY: 0.6, fillR: glassInner(1.32), gap: 1.12, innerAt: glassInner },
  cup: { fillY: 0.6, rx: 0.56, rz: 0.56, shape: "round", mound: 0, top: 0.76, half: 1.08, labelY: 0.32, fillR: cupInner(0.6), gap: 0.86, innerAt: cupInner },
};

/** Sinonimlar: shisha ichimlik — stakan (shisha o'zi alohida qatlam), kabob — taxtada */
export const vesselKey = (v: Vessel) => (v === "bottle" ? "glass" : v === "skewers" ? "board" : v);
export const vesselSpec = (v: Vessel): VesselSpec => SPECS[vesselKey(v)];

/** Yuza balandligi (tepalik bilan) */
export function surfaceY(spec: VesselSpec, x: number, z: number) {
  if (spec.shape === "rect") return spec.fillY;
  const rr = Math.min(1, Math.hypot(x / spec.rx, z / spec.rz));
  return spec.fillY + 0.03 + spec.mound * Math.pow(1 - rr * rr, 1.1);
}

/* ---------- Geometriya yordamchilari ---------- */

function lathe(pts: [number, number][], seg: number) {
  const g = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
  g.computeVertexNormals();
  return g;
}

/** Bir nechta nazorat nuqtasidan silliq profil */
function smoothProfile(ctrl: [number, number][], n: number): [number, number][] {
  const c = new THREE.SplineCurve(ctrl.map(([x, y]) => new THREE.Vector2(x, y)));
  return c.getPoints(n).map((p) => [Math.max(0, p.x), p.y]);
}

function woodTexture(size: number) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size / 2;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0, P.wood);
  g.addColorStop(1, P.woodDark);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  // yillik halqalar — to'lqinli gorizontal chiziqlar
  for (let i = 0; i < 70; i++) {
    const y0 = (i / 70) * c.height;
    ctx.strokeStyle = `rgba(40,20,8,${0.08 + (i % 3) * 0.05})`;
    ctx.lineWidth = 1 + (i % 4);
    ctx.beginPath();
    for (let x = 0; x <= c.width; x += 16) ctx.lineTo(x, y0 + Math.sin(x * 0.012 + i) * 4 + Math.sin(x * 0.05 + i * 2) * 1.5);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* ---------- Idishlar ---------- */

function useVessel(kind: ReturnType<typeof vesselKey>, mobile: boolean, accent: string) {
  return useDisposable(() => {
    const seg = mobile ? 64 : 112;
    const glaze = new THREE.MeshPhysicalMaterial({ color: P.glaze, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 });
    const rim = new THREE.MeshPhysicalMaterial({ color: accent, roughness: 0.25, metalness: accent === P.gold ? 0.8 : 0, clearcoat: 1 });
    const gold = new THREE.MeshStandardMaterial({ color: P.gold, roughness: 0.3, metalness: 0.85 });
    const out: { geo: THREE.BufferGeometry; mat: THREE.Material; pos?: [number, number, number]; scale?: [number, number, number]; rot?: [number, number, number] }[] = [];
    const extra: (THREE.Texture | THREE.Material)[] = [glaze, rim, gold];
    const ring = (r: number, tube: number, y: number, mat: THREE.Material, sx = 1, sz = 1) =>
      out.push({ geo: new THREE.TorusGeometry(r, tube, 8, seg).rotateX(Math.PI / 2), mat, pos: [0, y, 0], scale: [sx, 1, sz] });

    if (kind === "deepPlate") {
      out.push({ geo: lathe(smoothProfile([[0, 0.03], [0.55, 0.03], [0.62, 0], [0.75, 0.02], [1.2, 0.17], [1.5, 0.32], [1.56, 0.35]], 40).concat([[1.52, 0.36], [1.4, 0.3], [1.1, 0.18], [0.6, 0.14], [0, 0.135]]), seg), mat: glaze });
      ring(1.545, 0.022, 0.352, rim);
      ring(1.22, 0.006, 0.215, gold);
    } else if (kind === "plate" || kind === "fishPlatter") {
      const sx = kind === "fishPlatter" ? 1.25 : 1;
      const sz = kind === "fishPlatter" ? 0.95 : 1;
      out.push({ geo: lathe([[0, 0.025], [0.7, 0.025], [0.76, 0], [0.86, 0.015], [1.3, 0.06], [1.55, 0.12], [1.64, 0.15], [1.6, 0.158], [1.42, 0.112], [1.08, 0.072], [0, 0.066]], seg), mat: glaze, scale: [sx, 1, sz] });
      ring(1.625, 0.016, 0.152, rim, sx, sz);
      ring(1.18, 0.005, 0.078, gold, sx, sz);
    } else if (kind === "clayPot") {
      const bump = noiseTexture(256, 10, 4, 1.4, 41);
      const clay = new THREE.MeshStandardMaterial({ color: P.clay, roughness: 0.82, bumpMap: bump, bumpScale: 2 });
      const glazeIn = new THREE.MeshPhysicalMaterial({ color: P.clayDark, roughness: 0.3, clearcoat: 0.8, side: THREE.BackSide });
      extra.push(bump, clay, glazeIn);
      const prof = smoothProfile([[0, 0.02], [0.62, 0.02], [0.92, 0.1], [1.16, 0.36], [1.2, 0.62], [1.08, 0.88], [1.0, 0.98], [1.04, 1.04]], 50);
      out.push({ geo: lathe(prof, seg), mat: clay });
      out.push({ geo: lathe(smoothProfile([[0, 0.12], [0.6, 0.14], [0.9, 0.3], [1.08, 0.62], [0.98, 0.9], [0.96, 1.02]], 40), seg), mat: glazeIn });
      ring(1.0, 0.045, 1.04, clay);
      // ikki quloqcha
      [-1, 1].forEach((s) => out.push({ geo: new THREE.TorusGeometry(0.16, 0.045, 8, 20, Math.PI), mat: clay, pos: [s * 1.18, 0.72, 0], rot: [0, s > 0 ? 0 : Math.PI, Math.PI / 2] }));
    } else if (kind === "mortar") {
      const bump = noiseTexture(256, 18, 4, 1.6, 77);
      const stone = new THREE.MeshStandardMaterial({ color: P.stone, roughness: 0.92, bumpMap: bump, bumpScale: 4 });
      extra.push(bump, stone);
      out.push({ geo: lathe(smoothProfile([[0, 0], [0.9, 0], [1.08, 0.12], [1.26, 0.46], [1.29, 0.72], [1.2, 0.79], [1.06, 0.76], [0.98, 0.5], [0.7, 0.3], [0, 0.26]], 60), seg), mat: stone });
    } else if (kind === "board") {
      const tex = woodTexture(mobile ? 512 : 1024);
      const wood = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
      extra.push(tex, wood);
      out.push({ geo: new RoundedBoxGeometry(3.1, 0.16, 1.9, 3, 0.05), mat: wood, pos: [0, 0.08, 0] });
      // taxta oyoqchalari
      [-1, 1].forEach((s) => out.push({ geo: new RoundedBoxGeometry(0.22, 0.1, 1.6, 2, 0.03), mat: wood, pos: [s * 1.2, -0.04, 0] }));
    } else if (kind === "glass") {
      // transmission yo'q (qo'shimcha render o'tishi) — oddiy shaffof shisha, muhit aksi bilan
      const glass = new THREE.MeshPhysicalMaterial({
        color: P.glass, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.3, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false,
      });
      extra.push(glass);
      const outer: [number, number][] = [[0, 0], [0.5, 0], [0.54, 0.03], [0.56, 0.14], [0.65, 1.7], [0.63, 1.72], [0.61, 1.7]];
      const inner: [number, number][] = [];
      for (let i = 0; i <= 12; i++) {
        const y = 1.7 - (i / 12) * 1.54;
        inner.push([glassInner(y), y]);
      }
      out.push({ geo: lathe([...outer, ...inner, [0, 0.16]], seg), mat: glass });
    } else if (kind === "cup") {
      const prof: [number, number][] = [[0, 0.06], [0.28, 0.06], [0.3, 0.04], [0.36, 0.08]];
      for (let i = 0; i <= 14; i++) {
        const y = 0.1 + (i / 14) * 0.62;
        prof.push([cupInner(y) + 0.045, y]);
      }
      prof.push([0.73, 0.75], [0.69, 0.76]);
      for (let i = 14; i >= 0; i--) {
        const y = 0.1 + (i / 14) * 0.62 + 0.03;
        prof.push([cupInner(y) + 0.005, y]);
      }
      prof.push([0, 0.12]);
      out.push({ geo: lathe(prof, seg), mat: glaze });
      out.push({ geo: lathe([[0, 0.02], [0.45, 0.02], [0.5, 0], [0.6, 0.015], [1.0, 0.06], [1.08, 0.09], [1.04, 0.1], [0.9, 0.072], [0.5, 0.05], [0, 0.048]], seg), mat: glaze });
      ring(0.71, 0.014, 0.755, rim);
      ring(1.06, 0.012, 0.094, rim);
      out.push({ geo: new THREE.TorusGeometry(0.17, 0.035, 10, 24, Math.PI * 1.25), mat: glaze, pos: [0.78, 0.42, 0], rot: [0, 0, -Math.PI * 0.62] });
    }
    return { out, extra };
  }, [kind, mobile, accent]);
}

/**
 * Idish modeli (pastki qatlam). bowl — bosh sahifa lag'mon kosasi (o'zgarishsiz), steamer — bo'sh bambuk savat.
 * accent — lab/hoshiya rangi (palette kaliti).
 */
export default function VesselModel({ vessel, mobile, tint }: { vessel: Vessel; mobile: boolean; tint?: Tint }) {
  const key = vesselKey(vessel);
  const accent = P[tint ?? "glazeRed"];
  const res = useVessel(key, mobile, accent);
  if (key === "bowl") return <Bowl mobile={mobile} part="bowl" />;
  if (key === "steamer") return <SteamerBasket mobile={mobile} empty />;
  return (
    <group>
      {res.out.map((m, i) => (
        <mesh key={i} geometry={m.geo} material={m.mat} position={m.pos} scale={m.scale} rotation={m.rot} renderOrder={key === "glass" ? 2 : 0} />
      ))}
    </group>
  );
}
