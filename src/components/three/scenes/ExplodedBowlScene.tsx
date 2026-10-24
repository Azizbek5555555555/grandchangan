"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import BlobShadow from "../lib/BlobShadow";
import { clamp01, enterProgress, smooth } from "../lib/motion";
import SceneCanvas from "../lib/SceneCanvas";
import StudioLights from "../lib/StudioLights";
import type { SceneProps } from "../lib/types";
import { useFitCamera } from "../lib/useFitCamera";
import Bowl, { BOWL, innerRadiusAt } from "../models/Bowl";
import BowlToppings, { type ToppingPart } from "../models/BowlToppings";
import { useFoodKit } from "../models/Ingredients";
import Noodles, { type NoodleLayout } from "../models/Noodles";
import { P } from "../palette";

/* "Exploded" ko'rinish: lag'mon kosasi qatlamlarga ajraladi (kosa → sho'rva → lag'mon → go'sht →
   ko'katlar → ziravorlar), har qatlam yonida chiziq va nom. Progress — [data-explode-track] bo'limi
   scroll'idan (sticky bo'lim), topilmasa konteyner ko'rinishidan */

const GAP = 0.78;
const TARGET: [number, number, number] = [0, 2.35, 0];
const VIEW_DIR: [number, number, number] = [0, 0.42, 1];

type Layer = { key: string; y: number; node: (kit: ReturnType<typeof useFoodKit>) => React.ReactNode };

export type ExplodedSceneProps = SceneProps & { labels: string[] };

function sectionProgress(el: HTMLElement): number {
  const sec = el.closest<HTMLElement>("[data-explode-track]");
  if (!sec) return smooth(enterProgress(el, 0.9, 0.5));
  const r = sec.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  const travel = Math.max(1, r.height - vh);
  // bo'lim yopishgan paytdagi scroll ulushi: 10%..80% oralig'ida to'liq ajraladi
  return smooth(clamp01((-r.top / travel - 0.1) / 0.7));
}

function ExplodedContent({ reduced, mobile, trackRef, labels }: Pick<ExplodedSceneProps, "reduced" | "mobile" | "trackRef" | "labels">) {
  useFitCamera(TARGET, VIEW_DIR, mobile ? 4.2 : 6.6, 6.6);
  const kit = useFoodKit(mobile);
  const layout = useMemo<NoodleLayout>(
    () => ({
      brothY: BOWL.brothY,
      radius: innerRadiusAt(BOWL.brothY),
      tip: new THREE.Vector3(0.3, 1.9, 0.3),
      axis: new THREE.Vector3(1, 0, 0),
      base: new THREE.Vector3(0.2, 0, 0.2),
    }),
    [],
  );
  const timeRef = useRef({ t: 0, lift: 0 });
  const toppings = (parts: ToppingPart[]) => <BowlToppings kit={kit} layout={layout} mobile={mobile} parts={parts} />;

  // pastdan yuqoriga; label'lar yuqoridan pastga beriladi
  const layers: Layer[] = [
    { key: "bowl", y: 0.55, node: () => <Bowl mobile={mobile} part="bowl" /> },
    { key: "broth", y: BOWL.brothY, node: () => <Bowl mobile={mobile} part="broth" /> },
    { key: "noodles", y: 0.95, node: () => <Noodles layout={layout} mobile={mobile} timeRef={timeRef} nestOnly /> },
    { key: "beef", y: 1.0, node: () => toppings(["beef"]) },
    { key: "greens", y: 1.0, node: () => toppings(["chok", "leaves"]) },
    {
      key: "garnish",
      y: 1.0,
      node: (k) => (
        <>
          {toppings(["rings", "seeds"])}
          <group position={[-0.25, 1.05, 0.35]} rotation={[0.2, 0.6, 0.1]} scale={0.55}>
            <mesh geometry={k.geo.chiliA} material={k.mat.chiliRed} />
            <mesh geometry={k.geo.chiliAGreen} material={k.mat.stem} />
          </group>
          <group position={[0.45, 1.05, -0.2]} rotation={[0.1, 2.2, -0.15]} scale={0.5}>
            <mesh geometry={k.geo.anise} material={k.mat.anise} />
            <mesh geometry={k.geo.aniseSeeds} material={k.mat.aniseSeed} />
          </group>
        </>
      ),
    },
  ];

  const stack = useRef<THREE.Group>(null);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const labelEls = useRef<(HTMLDivElement | null)[]>([]);
  const prog = useRef(reduced ? 1 : 0);

  useFrame((state, dt) => {
    const t = reduced ? 1 : state.clock.elapsedTime;
    timeRef.current.t = t;
    const target = reduced || !trackRef.current ? 1 : sectionProgress(trackRef.current);
    prog.current = THREE.MathUtils.damp(prog.current, target, 6, Math.min(dt, 0.1));
    const p = prog.current;
    // yig'iq holatda kosa kadr markazida, ajralganda butun ustun ko'rinadi
    if (stack.current) {
      stack.current.position.set(mobile ? 0 : 1.3, (1 - p) * 1.75, 0);
      stack.current.rotation.y = Math.sin(t * 0.3) * 0.12 + p * 0.35;
    }
    groups.current.forEach((g, i) => {
      if (!g) return;
      const local = smooth(clamp01(p * 1.25 - i * 0.04));
      g.position.y = local * GAP * i + Math.sin(t * 0.9 + i) * 0.025 * local;
      g.rotation.set(local * 0.1, local * i * 0.12, 0);
    });
    labelEls.current.forEach((el, i) => {
      if (!el) return;
      const li = layers.length - 1 - i; // label i → qatlam (yuqoridan)
      const a = clamp01((p - 0.25 - li * 0.05) / 0.3);
      el.style.opacity = String(a);
      el.style.transform = `translate(-100%, -50%) translateX(${(1 - a) * -14}px)`;
    });
  });

  return (
    <>
      <StudioLights variant="night" keyIntensity={2.4} />
      <BlobShadow color={P.shadowNight} opacity={0.6} position={[0, -0.02, 0]} scale={[3.8, 1.8]} />
      <group ref={stack}>
        {layers.map((L, i) => {
          const label = labels[layers.length - 1 - i];
          return (
            <group key={L.key} ref={(el) => { groups.current[i] = el; }}>
              {L.node(kit)}
              {/* Telefonda nomlar sahna ostidagi ro'yxatda (ExplodeSection) — bu yerda chizilmaydi */}
              {label && !mobile && (
                <Html position={[-1.5, L.y, 0]} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
                  <div
                    ref={(el) => { labelEls.current[layers.length - 1 - i] = el; }}
                    className="flex items-center gap-3 whitespace-nowrap opacity-0"
                    style={{ transform: "translate(-100%, -50%)" }}
                  >
                    <span className="max-w-[8.5rem] whitespace-normal text-right font-display text-[13px] italic leading-tight text-brand-cream sm:max-w-none sm:whitespace-nowrap sm:text-lg">{label}</span>
                    <span className="h-px w-8 bg-brand-gold/70 sm:w-16" />
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

export default function ExplodedBowlScene(props: ExplodedSceneProps) {
  return (
    <SceneCanvas {...props} camera={{ fov: 30, position: [0, 4, 10], near: 0.1, far: 80 }}>
      <ExplodedContent reduced={props.reduced} mobile={props.mobile} trackRef={props.trackRef} labels={props.labels} />
    </SceneCanvas>
  );
}
