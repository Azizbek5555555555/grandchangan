"use client";

import * as THREE from "three";
import { useDisposable } from "../lib/dispose";
import { mergeGeometries } from "../lib/geometry";
import { P } from "../palette";

/* Qora laklangan palochkalar, oltin halqalar bilan. Uchi (0,0,0) da, +Y bo'ylab dastagi */

export type StickPose = { tip: THREE.Vector3; dir: THREE.Vector3 };

export default function Chopsticks({ poses, length = 2.5 }: { poses: StickPose[]; length?: number }) {
  const res = useDisposable(() => {
    const body = new THREE.CylinderGeometry(0.042, 0.017, length, 20, 1);
    body.translate(0, length / 2, 0);
    // uchidagi yumaloq
    const tipCap = new THREE.SphereGeometry(0.017, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const top = new THREE.SphereGeometry(0.042, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, length, 0);
    const stick = mergeGeometries([body, tipCap, top]);
    [body, tipCap, top].forEach((g) => g.dispose());
    const rAt = (y: number) => 0.017 + (0.042 - 0.017) * (y / length) + 0.0035;
    const bands = mergeGeometries(
      [0.7, 0.74, 0.97].map((f, i) =>
        new THREE.CylinderGeometry(rAt(f * length), rAt(f * length), i === 2 ? 0.05 : 0.022, 24, 1).translate(0, f * length, 0),
      ),
    );
    const lacquer = new THREE.MeshPhysicalMaterial({
      color: P.lacquer,
      roughness: 0.28,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
    });
    const gold = new THREE.MeshPhysicalMaterial({ color: P.gold, roughness: 0.25, metalness: 1, envMapIntensity: 1.4 });
    return { stick, bands, lacquer, gold };
  }, [length]);

  return (
    <group>
      {poses.map((p, i) => {
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.dir.clone().normalize());
        return (
          <group key={i} position={p.tip} quaternion={q}>
            <mesh geometry={res.stick} material={res.lacquer} />
            <mesh geometry={res.bands} material={res.gold} />
          </group>
        );
      })}
    </group>
  );
}
