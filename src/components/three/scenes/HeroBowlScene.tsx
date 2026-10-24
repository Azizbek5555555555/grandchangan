"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import BlobShadow from "../lib/BlobShadow";
import { clamp01, easeOutBack, easeOutCubic, exitProgress } from "../lib/motion";
import SceneCanvas from "../lib/SceneCanvas";
import SoftParticles from "../lib/SoftParticles";
import StudioLights from "../lib/StudioLights";
import type { SceneProps } from "../lib/types";
import { useFitCamera } from "../lib/useFitCamera";
import Bowl, { BOWL, innerRadiusAt } from "../models/Bowl";
import BowlToppings from "../models/BowlToppings";
import Chopsticks, { type StickPose } from "../models/Chopsticks";
import FlyingIngredients, { type FlyMotion } from "../models/FlyingIngredients";
import { useFoodKit } from "../models/Ingredients";
import Noodles, { type NoodleLayout } from "../models/Noodles";
import { P } from "../palette";

/* Hero: lag'mon kosasi, palochkalar lag'monni ko'tarib turadi, atrofda masalliqlar uchadi.
   Kirish (~1.2s) → suzish/aylanish → scroll bo'yicha egilish va masalliqlar tarqalishi */

const TIP = new THREE.Vector3(0.34, 2.02, 0.32);
const DIR_UP = new THREE.Vector3(0.72, 0.64, -0.3).normalize();
const DIR_LO = new THREE.Vector3(0.76, 0.54, -0.37).normalize();
const AXIS = new THREE.Vector3(DIR_UP.x + DIR_LO.x, 0, DIR_UP.z + DIR_LO.z).normalize();
const GAP = 0.05; // palochka va lag'mon radiuslari yig'indisi

const TARGET: [number, number, number] = [0, 0.3, 0];
const VIEW_DIR: [number, number, number] = [0, 0.5, 1];

function HeroContent({ reduced, mobile, trackRef }: Pick<SceneProps, "reduced" | "mobile" | "trackRef">) {
  useFitCamera(TARGET, VIEW_DIR, 5.0, 4.3);
  const kit = useFoodKit(mobile);

  const layout = useMemo<NoodleLayout>(
    () => ({
      brothY: BOWL.brothY,
      radius: innerRadiusAt(BOWL.brothY),
      tip: TIP,
      axis: AXIS,
      base: new THREE.Vector3(0.24, 0, 0.2),
    }),
    [],
  );
  const poses = useMemo<StickPose[]>(
    () => [
      { tip: TIP.clone().add(new THREE.Vector3(0, GAP, 0)), dir: DIR_UP },
      { tip: TIP.clone().add(new THREE.Vector3(0.02, -GAP, 0.01)), dir: DIR_LO },
    ],
    [],
  );

  const rig = useRef<THREE.Group>(null);
  const sticks = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const start = useRef(-1);
  const prog = useRef(0);
  const motion = useRef<FlyMotion>({ t: 2.2, age: reduced ? 99 : 0, p: 0 });
  const noodleTime = useRef({ t: 2.2, lift: 0 });

  useFrame((state, dt) => {
    const now = state.clock.elapsedTime;
    if (start.current < 0) start.current = now;
    const age = reduced ? 99 : now - start.current;
    const t = reduced ? 2.2 : now;
    const target = reduced || !trackRef.current ? 0 : exitProgress(trackRef.current);
    prog.current = THREE.MathUtils.damp(prog.current, target, 5, Math.min(dt, 0.1));
    const p = prog.current;
    motion.current.t = t;
    motion.current.age = age;
    motion.current.p = p;

    const rise = easeOutCubic(clamp01(age / 1.2));
    const pop = easeOutBack(clamp01(age / 1.25), 1.15);
    const g = rig.current;
    if (g) {
      g.position.set(0, -0.32 - (1 - rise) * 1.6 + Math.sin(t * 0.8) * 0.045 - p * 0.45, 0);
      g.rotation.set(
        p * 0.5 + Math.sin(t * 0.6) * 0.012,
        Math.sin(t * 0.25) * 0.2 - (1 - rise) * 0.9 + p * 0.85,
        -p * 0.12 + Math.cos(t * 0.5) * 0.018,
      );
      g.scale.setScalar((0.62 + 0.38 * pop) * (1 - p * 0.1));
    }
    // palochkalar sekin ko'tarib-tushiradi, lag'mon tutami ergashadi
    const lift = Math.sin(t * 0.9) * 0.05 + 0.02;
    if (sticks.current) sticks.current.position.y = lift;
    noodleTime.current.t = t;
    noodleTime.current.lift = lift;

    const sh = shadow.current;
    if (sh) {
      const m = sh.material as THREE.MeshBasicMaterial;
      m.opacity = 0.42 * rise * (1 - p * 0.7);
      const s = 1 - Math.sin(t * 0.8) * 0.03;
      sh.scale.set(3.6 * s, 1, 1.5 * s);
    }
  });

  return (
    <>
      <StudioLights variant="fire" />
      <BlobShadow ref={shadow} color={P.shadowFire} opacity={0.42} position={[0, -0.95, 0]} scale={[3.6, 1.5]} />
      <group ref={rig}>
        <group position={[0, -0.5, 0]}>
          <Bowl mobile={mobile} />
          <Noodles layout={layout} mobile={mobile} timeRef={noodleTime} />
          <BowlToppings kit={kit} layout={layout} mobile={mobile} />
          <group ref={sticks}>
            <Chopsticks poses={poses} length={2.5} />
          </group>
          <SoftParticles
            position={[0, 1.0, 0]}
            count={mobile ? 5 : 8}
            radius={0.6}
            height={1.6}
            size={0.7}
            speed={0.08}
            spread={0.5}
            color={P.steam}
            opacity={0.07}
            frozenTime={reduced ? 3.1 : null}
            seed={2}
          />
        </group>
      </group>
      <FlyingIngredients kit={kit} mobile={mobile} motion={motion} />
    </>
  );
}

export default function HeroBowlScene(props: SceneProps) {
  return (
    <SceneCanvas {...props} camera={{ fov: 30, position: [0, 3, 8], near: 0.1, far: 60 }}>
      <HeroContent reduced={props.reduced} mobile={props.mobile} trackRef={props.trackRef} />
    </SceneCanvas>
  );
}
