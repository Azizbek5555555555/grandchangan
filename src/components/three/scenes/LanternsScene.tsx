"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import SceneCanvas from "../lib/SceneCanvas";
import StudioLights from "../lib/StudioLights";
import type { SceneProps } from "../lib/types";
import { useFitCamera } from "../lib/useFitCamera";
import { Lantern, useLanternKit } from "../models/Lantern";
import { P } from "../palette";

/* Suzib yuruvchi qizil fonarlar: har biri o'z fazasida chayqaladi, sekin aylanadi, ichidagi nur miltillaydi */

const TARGET: [number, number, number] = [0, 0, 0];
const VIEW_DIR: [number, number, number] = [0, 0.08, 1];

// [x, y, z, o'lcham, faza]
const SPOTS: [number, number, number, number, number][] = [
  [-1.75, 0.55, -0.6, 0.85, 0.3],
  [0, 0.85, 0.2, 1.05, 1.7],
  [1.8, 0.35, -0.9, 0.8, 3.1],
  [-0.85, -1.05, 0.7, 0.6, 4.4],
  [1.05, -0.95, 0.5, 0.58, 5.6],
];

function LanternsContent({ reduced, mobile }: Pick<SceneProps, "reduced" | "mobile">) {
  useFitCamera(TARGET, VIEW_DIR, 5.4, 4.6);
  const kit = useLanternKit(mobile);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const spots = mobile ? SPOTS.slice(0, 3) : SPOTS;

  useFrame((state) => {
    const t = reduced ? 1.5 : state.clock.elapsedTime;
    spots.forEach((s, i) => {
      const g = groups.current[i];
      if (!g) return;
      const ph = s[4];
      g.position.set(s[0] + Math.sin(t * 0.35 + ph) * 0.05, s[1] + Math.sin(t * 0.7 + ph) * 0.08, s[2]);
      g.rotation.set(Math.sin(t * 0.5 + ph) * 0.03, t * 0.18 + ph, Math.sin(t * 0.62 + ph) * 0.07);
    });
    // ichki nur — yengil miltillash
    kit.bodyMat.emissiveIntensity = 1.15 + (reduced ? 0 : Math.sin(t * 6.3) * Math.sin(t * 2.7) * 0.12);
  });

  return (
    <>
      <StudioLights variant="night" keyIntensity={1.2} />
      <pointLight position={[0, 0.85, 1.2]} intensity={3} distance={6} color={P.lanternHalo} />
      <pointLight position={[-1.6, -0.6, 1.2]} intensity={3} distance={5} color={P.lanternGlow} />
      {spots.map((s, i) => (
        <group key={i} ref={(el) => { groups.current[i] = el; }} scale={s[3]}>
          <Lantern kit={kit} />
        </group>
      ))}
    </>
  );
}

export default function LanternsScene(props: SceneProps) {
  return (
    <SceneCanvas {...props} camera={{ fov: 30, position: [0, 0, 9], near: 0.1, far: 60 }}>
      <LanternsContent reduced={props.reduced} mobile={props.mobile} />
    </SceneCanvas>
  );
}
