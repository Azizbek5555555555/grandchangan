"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import BlobShadow from "../lib/BlobShadow";
import { useDisposable } from "../lib/dispose";
import { enterProgress, smooth } from "../lib/motion";
import SceneCanvas from "../lib/SceneCanvas";
import SoftParticles, { type SoftParticlesHandle } from "../lib/SoftParticles";
import StudioLights from "../lib/StudioLights";
import type { SceneProps } from "../lib/types";
import { useFitCamera } from "../lib/useFitCamera";
import { STEAMER, SteamerBasket, SteamerLid } from "../models/Steamer";
import { P } from "../palette";

/* Dim sum: bambuk bug'latgich. Bo'lim ko'rinishga kirganda qopqoq ko'tarilib ochiladi (scroll bilan),
   ichidan bug' chiqadi, savat sekin aylanadi */

const TARGET: [number, number, number] = [0, 1.0, 0];
const VIEW_DIR: [number, number, number] = [0, 0.62, 1];

function DimSumContent({ reduced, mobile, trackRef }: Pick<SceneProps, "reduced" | "mobile" | "trackRef">) {
  useFitCamera(TARGET, VIEW_DIR, 5.2, 4.9);
  const rig = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const steam = useRef<SoftParticlesHandle>({ opacity: 0 });
  const open = useRef(reduced ? 1 : 0);
  const plate = useDisposable(() => {
    const geo = new THREE.CylinderGeometry(2.05, 1.9, 0.1, mobile ? 48 : 72);
    const mat = new THREE.MeshPhysicalMaterial({ color: P.plate, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2 });
    return { geo, mat };
  }, [mobile]);

  useFrame((state, dt) => {
    const t = reduced ? 2 : state.clock.elapsedTime;
    const target = reduced || !trackRef.current ? 1 : smooth(enterProgress(trackRef.current, 0.95, 0.42));
    open.current = THREE.MathUtils.damp(open.current, target, 4, Math.min(dt, 0.1));
    const o = open.current;
    if (rig.current) rig.current.rotation.y = Math.sin(t * 0.22) * 0.25 + 0.3;
    if (lid.current) {
      // qopqoq: ko'tariladi, orqaga suriladi va egiladi; ochiq holatda yengil suzadi
      lid.current.position.set(-0.35 * o, STEAMER.h + STEAMER.lidH / 2 + o * 1.35 + Math.sin(t * 1.1) * 0.04 * o, -0.55 * o);
      lid.current.rotation.set(-0.62 * o, 0, 0.18 * o);
    }
    steam.current.opacity = o;
  });

  return (
    <>
      <StudioLights variant="wine" />
      <BlobShadow color={P.shadowWine} opacity={0.55} position={[0, -0.06, 0]} scale={[5.2, 3.6]} />
      <group ref={rig}>
        <mesh geometry={plate.geo} material={plate.mat} position={[0, -0.02, 0]} />
        <group position={[0, 0.03, 0]}>
          <SteamerBasket mobile={mobile} />
          <SteamerLid ref={lid} mobile={mobile} />
        </group>
        <SoftParticles
          position={[0, 0.55, 0]}
          count={mobile ? 7 : 12}
          radius={0.9}
          height={2.6}
          size={1.1}
          speed={0.09}
          spread={0.7}
          color={P.steam}
          opacity={0.16}
          control={steam}
          frozenTime={reduced ? 3.4 : null}
          seed={5}
        />
      </group>
    </>
  );
}

export default function DimSumScene(props: SceneProps) {
  return (
    <SceneCanvas {...props} camera={{ fov: 30, position: [0, 3, 8], near: 0.1, far: 60 }}>
      <DimSumContent reduced={props.reduced} mobile={props.mobile} trackRef={props.trackRef} />
    </SceneCanvas>
  );
}
