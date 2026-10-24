"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { rng } from "../lib/motion";
import type { FoodKit } from "./Ingredients";
import { moundY, type NoodleLayout } from "./Noodles";

/* Kosadagi bezaklar: mol go'shti bo'laklari, bok-choy, ko'k piyoz halqalari, kashnich, kunjut.
   Kosa koordinatasida (kosa bilan birga aylanadi). Statik — matritsalar bir marta yoziladi */

type Layout = Pick<NoodleLayout, "brothY" | "radius">;

const BEEF: { x: number; z: number; yaw: number; tilt: number }[] = [
  { x: -0.52, z: -0.38, yaw: 0.5, tilt: 0.12 },
  { x: -0.2, z: -0.6, yaw: 0.95, tilt: 0.1 },
  { x: -0.72, z: 0.02, yaw: 0.15, tilt: 0.16 },
  { x: -0.32, z: -0.12, yaw: 0.7, tilt: 0.05 },
];

const CHOK: { x: number; z: number; yaw: number; lift: number; s: number }[] = [
  { x: 0.98, z: -0.12, yaw: Math.PI * 0.5 + 0.25, lift: 0.32, s: 0.82 },
  { x: 0.82, z: -0.6, yaw: Math.PI * 0.68, lift: 0.36, s: 0.74 },
];

function scatter(count: number, seed: number, L: Layout, avoid: (x: number, z: number) => boolean) {
  const r = rng(seed);
  const out: { x: number; z: number; y: number; r: number }[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 50) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * L.radius * 0.85;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (avoid(x, z)) continue;
    out.push({ x, z, y: moundY(x, z, L), r: r() });
  }
  return out;
}

export type ToppingPart = "beef" | "chok" | "rings" | "leaves" | "seeds";
const ALL_PARTS: ToppingPart[] = ["beef", "chok", "rings", "leaves", "seeds"];

export default function BowlToppings({
  kit,
  layout,
  mobile,
  parts = ALL_PARTS,
}: {
  kit: FoodKit;
  layout: Layout;
  mobile: boolean;
  /** Qaysi bezaklar chiziladi (qatlamli ko'rinishda har qatlam alohida) */
  parts?: ToppingPart[];
}) {
  const has = (k: ToppingPart) => parts.includes(k);
  const onBeef = (x: number, z: number) => x < -0.05 && z < 0.25 && Math.hypot(x + 0.45, z + 0.3) < 0.55;
  const rings = useMemo(() => scatter(mobile ? 18 : 30, 5, layout, onBeef), [layout, mobile]);
  const leaves = useMemo(() => scatter(mobile ? 7 : 12, 9, layout, (x, z) => x > 0.55), [layout, mobile]);
  const seeds = useMemo(() => scatter(mobile ? 16 : 34, 13, layout, () => false), [layout, mobile]);

  const ringRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const seedRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const v = new THREE.Vector3();
    const s = new THREE.Vector3();
    const r = rng(42);
    const beefTop = (x: number, z: number) => (onBeef(x, z) ? 0.06 : 0);
    rings.forEach((p, i) => {
      e.set((r() - 0.5) * 0.9, r() * Math.PI, (r() - 0.5) * 0.9);
      q.setFromEuler(e);
      v.set(p.x, p.y + 0.03, p.z);
      s.setScalar(0.85 + p.r * 0.4);
      m.compose(v, q, s);
      ringRef.current?.setMatrixAt(i, m);
    });
    leaves.forEach((p, i) => {
      e.set((r() - 0.5) * 0.5, r() * Math.PI * 2, (r() - 0.5) * 0.5);
      q.setFromEuler(e);
      v.set(p.x, p.y + 0.045 + beefTop(p.x, p.z), p.z);
      s.setScalar(0.9 + p.r * 0.5);
      m.compose(v, q, s);
      leafRef.current?.setMatrixAt(i, m);
    });
    seeds.forEach((p, i) => {
      e.set((r() - 0.5) * 0.4, r() * Math.PI * 2, (r() - 0.5) * 0.4);
      q.setFromEuler(e);
      v.set(p.x, p.y + 0.04 + beefTop(p.x, p.z), p.z);
      s.setScalar(1);
      m.compose(v, q, s);
      seedRef.current?.setMatrixAt(i, m);
    });
    [ringRef, leafRef, seedRef].forEach((ref) => {
      if (ref.current) {
        ref.current.instanceMatrix.needsUpdate = true;
        ref.current.computeBoundingSphere();
      }
    });
  }, [rings, leaves, seeds]);

  return (
    <group>
      {has("beef") && BEEF.map((b, i) => (
        <mesh
          key={`b${i}`}
          geometry={kit.geo.beef[i % kit.geo.beef.length]}
          material={kit.mat.beef}
          position={[b.x, moundY(b.x, b.z, layout) + 0.03 + i * 0.012, b.z]}
          rotation={[b.tilt, b.yaw, b.tilt * 0.5]}
        />
      ))}
      {has("chok") && CHOK.map((c, i) => (
        <group key={`c${i}`} position={[c.x, layout.brothY + 0.06, c.z]} rotation={[0, c.yaw, 0]}>
          {/* barg uzunligi -z bo'ylab markazga qarab, uchi yuqoriga egilgan */}
          <mesh geometry={kit.geo.leaf} material={kit.mat.leaf} rotation={[-Math.PI / 2 + c.lift, 0, 0]} scale={c.s} />
        </group>
      ))}
      <instancedMesh ref={ringRef} args={[kit.geo.ring, kit.mat.ring, rings.length]} visible={has("rings")} />
      <instancedMesh ref={leafRef} args={[kit.geo.cilantro, kit.mat.cilantro, leaves.length]} visible={has("leaves")} />
      <instancedMesh ref={seedRef} args={[kit.geo.sesame, kit.mat.sesame, seeds.length]} visible={has("seeds")} />
    </group>
  );
}
