"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { clamp01, easeOutCubic, rng } from "../lib/motion";
import type { FoodKit } from "./Ingredients";

/* Kosa atrofida uchib yurgan masalliqlar: kirishda tashqaridan uchib keladi, keyin suzadi/aylanadi,
   scroll bo'yicha tashqariga tarqalib, yuqoriga ko'tariladi */

export type FlyMotion = { t: number; age: number; p: number };

type Kind = "chiliA" | "chiliB" | "chiliO" | "anise" | "ring" | "leaf" | "cilantro";
type V3 = [number, number, number];
type Item = { kind: Kind; pos: V3; s: number; rot: V3; spin: V3; bob: number; ph: number; delay: number; mobile?: boolean };

const ITEMS: Item[] = [
  { kind: "chiliA", pos: [-2.3, 1.25, 0.2], s: 1.15, rot: [0.3, 0.4, -2.2], spin: [0.2, 0.5, 0.1], bob: 0.09, ph: 0, delay: 0.05, mobile: true },
  { kind: "chiliO", pos: [2.45, -0.15, 0.55], s: 1.0, rot: [0.2, -0.6, 0.9], spin: [0.15, -0.4, 0.2], bob: 0.1, ph: 1.7, delay: 0.12, mobile: true },
  { kind: "chiliB", pos: [-1.75, -1.25, 1.15], s: 0.8, rot: [1.1, 0.2, 2.6], spin: [0.3, 0.2, -0.2], bob: 0.08, ph: 3.1, delay: 0.2, mobile: true },
  { kind: "chiliA", pos: [0.9, 2.45, -1.7], s: 0.7, rot: [0.4, 1.2, -0.6], spin: [-0.2, 0.4, 0.3], bob: 0.07, ph: 4.2, delay: 0.28 },
  { kind: "anise", pos: [-2.5, -0.1, -0.55], s: 1.15, rot: [1.0, 0.3, 0.4], spin: [0.1, 0.35, 0.05], bob: 0.08, ph: 0.9, delay: 0.1, mobile: true },
  { kind: "anise", pos: [1.85, -1.3, 1.25], s: 0.95, rot: [-0.9, 0.5, 0.3], spin: [-0.1, -0.3, 0.1], bob: 0.09, ph: 2.4, delay: 0.18, mobile: true },
  { kind: "anise", pos: [-1.0, 2.35, -1.0], s: 0.7, rot: [0.6, 0, -0.5], spin: [0.2, 0.3, 0], bob: 0.06, ph: 5.0, delay: 0.32 },
  { kind: "ring", pos: [-1.3, 2.0, 0.65], s: 1.5, rot: [1.2, 0.2, 0.5], spin: [0.5, 0.3, 0.2], bob: 0.1, ph: 0.4, delay: 0.15, mobile: true },
  { kind: "ring", pos: [2.7, 1.05, -0.4], s: 1.3, rot: [0.4, 0.9, 1.1], spin: [0.4, -0.3, 0.3], bob: 0.08, ph: 1.2, delay: 0.22, mobile: true },
  { kind: "ring", pos: [-2.75, 0.6, 0.95], s: 1.2, rot: [2.0, 0.1, 0.3], spin: [-0.3, 0.4, 0.2], bob: 0.09, ph: 2.2, delay: 0.26 },
  { kind: "ring", pos: [1.05, -1.65, 1.55], s: 1.35, rot: [0.9, 0.4, -0.7], spin: [0.3, 0.5, -0.2], bob: 0.07, ph: 3.3, delay: 0.3, mobile: true },
  { kind: "ring", pos: [-0.5, -1.7, 1.45], s: 1.1, rot: [1.4, 0.8, 0.2], spin: [-0.4, 0.2, 0.3], bob: 0.08, ph: 4.4, delay: 0.34 },
  { kind: "ring", pos: [2.15, 2.15, -1.1], s: 1.0, rot: [0.3, 0.2, 1.5], spin: [0.2, 0.4, 0.4], bob: 0.06, ph: 5.5, delay: 0.38 },
  { kind: "ring", pos: [-2.05, -0.8, -1.3], s: 1.0, rot: [0.8, 1.4, 0.2], spin: [0.3, -0.2, 0.3], bob: 0.07, ph: 0.8, delay: 0.4 },
  { kind: "leaf", pos: [-2.0, 2.1, -0.6], s: 0.95, rot: [0.35, -0.5, 0.75], spin: [0.08, 0.12, 0.06], bob: 0.1, ph: 1.9, delay: 0.08, mobile: true },
  { kind: "cilantro", pos: [1.5, 1.7, 0.95], s: 1.7, rot: [1.1, 0.4, 0.3], spin: [0.4, 0.6, 0.2], bob: 0.08, ph: 2.9, delay: 0.24, mobile: true },
  { kind: "cilantro", pos: [-0.45, 2.65, 0.4], s: 1.5, rot: [0.6, 1.2, -0.4], spin: [-0.3, 0.5, 0.3], bob: 0.07, ph: 3.9, delay: 0.36 },
];

/** Kirishda qayerdan uchib keladi: pozitsiya yo'nalishida uzoqdan */
function fromPos(p: V3): THREE.Vector3 {
  const v = new THREE.Vector3(...p);
  const d = v.clone().setY(v.y * 0.6).normalize();
  return v.addScaledVector(d, 4.5).add(new THREE.Vector3(0, -0.8, 1.5));
}

type Speck = { pos: THREE.Vector3; from: THREE.Vector3; rot: THREE.Euler; spin: THREE.Vector3; s: number; ph: number; delay: number };

function specks(count: number, seed: number, minR: number): Speck[] {
  const r = rng(seed);
  const out: Speck[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 40) {
    const x = (r() - 0.5) * 5.8;
    const y = -1.7 + r() * 4.4;
    const z = -1.6 + r() * 3.4;
    // kosa ichiga va palochka/tutam oldiga tushmasin
    if (Math.hypot(x, z) < minR && y < 0.7 && y > -1.3) continue;
    if (Math.abs(x - 0.3) < 0.55 && y > 0.1 && y < 1.4 && z > -0.2) continue;
    const pos = new THREE.Vector3(x, y, z);
    out.push({
      pos,
      from: fromPos([x, y, z]),
      rot: new THREE.Euler(r() * 6, r() * 6, r() * 6),
      spin: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(2),
      s: 0.8 + r() * 0.6,
      ph: r() * Math.PI * 2,
      delay: 0.1 + r() * 0.45,
    });
  }
  return out;
}

const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();
const tmpV = new THREE.Vector3();
const tmpS = new THREE.Vector3();

/** Kompozitsiya zichligi (kosa atrofida qanchalik yaqin) */
const SPREAD = 0.86;

/** Pozitsiya: kirish (from → pos), suzish (bob + sekin orbita), scroll (tarqalish + ko'tarilish) */
function place(out: THREE.Vector3, pos: THREE.Vector3, from: THREE.Vector3, e: number, m: FlyMotion, bob: number, ph: number) {
  const orbit = Math.sin(m.t * 0.18 + ph) * 0.09;
  const c = Math.cos(orbit);
  const s = Math.sin(orbit);
  const spread = SPREAD * (1 + m.p * 0.85);
  const bx = (pos.x * c - pos.z * s) * spread;
  const bz = (pos.x * s + pos.z * c) * spread;
  const by = pos.y * SPREAD * (1 + m.p * 0.3) + m.p * 1.9 + Math.sin(m.t * 0.9 + ph) * bob;
  out.set(from.x + (bx - from.x) * e, from.y + (by - from.y) * e, from.z + (bz - from.z) * e);
  return out;
}

export default function FlyingIngredients({
  kit,
  mobile,
  motion,
}: {
  kit: FoodKit;
  mobile: boolean;
  motion: RefObject<FlyMotion>;
}) {
  const items = useMemo(() => ITEMS.filter((i) => !mobile || i.mobile), [mobile]);
  const froms = useMemo(() => items.map((i) => fromPos(i.pos)), [items]);
  const bases = useMemo(() => items.map((i) => new THREE.Vector3(...i.pos)), [items]);
  const refs = useRef<(THREE.Group | null)[]>([]);

  const sesame = useMemo(() => specks(mobile ? 18 : 36, 77, 1.7), [mobile]);
  const pepper = useMemo(() => specks(mobile ? 6 : 11, 88, 1.75), [mobile]);
  const sesRef = useRef<THREE.InstancedMesh>(null);
  const pepRef = useRef<THREE.InstancedMesh>(null);

  useFrame(() => {
    const m = motion.current;
    if (!m) return;
    items.forEach((it, i) => {
      const g = refs.current[i];
      if (!g) return;
      const e = easeOutCubic(clamp01((m.age - it.delay) / 1.35));
      place(g.position, bases[i], froms[i], e, m, it.bob, it.ph);
      const k = m.t * 0.35 + (1 - e) * 5 + m.p * 2.4;
      g.rotation.set(it.rot[0] + it.spin[0] * k, it.rot[1] + it.spin[1] * k, it.rot[2] + it.spin[2] * k);
      g.scale.setScalar(it.s * (0.35 + 0.65 * e));
    });
    const inst = (mesh: THREE.InstancedMesh | null, list: Speck[], size: number) => {
      if (!mesh) return;
      list.forEach((sp, i) => {
        const e = easeOutCubic(clamp01((m.age - sp.delay) / 1.5));
        place(tmpV, sp.pos, sp.from, e, m, 0.06, sp.ph);
        const k = m.t * 0.6 + (1 - e) * 6 + m.p * 3;
        tmpE.set(sp.rot.x + sp.spin.x * k, sp.rot.y + sp.spin.y * k, sp.rot.z + sp.spin.z * k);
        tmpQ.setFromEuler(tmpE);
        tmpS.setScalar(sp.s * size * (0.3 + 0.7 * e));
        tmpM.compose(tmpV, tmpQ, tmpS);
        mesh.setMatrixAt(i, tmpM);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    inst(sesRef.current, sesame, 1.25);
    inst(pepRef.current, pepper, 1.05);
  });

  const body = (it: Item) => {
    switch (it.kind) {
      case "chiliA":
        return (
          <group position={[0, 0.42, 0]}>
            <mesh geometry={kit.geo.chiliA} material={kit.mat.chiliRed} />
            <mesh geometry={kit.geo.chiliAGreen} material={kit.mat.stem} />
          </group>
        );
      case "chiliB":
        return (
          <group position={[0, 0.42, 0]}>
            <mesh geometry={kit.geo.chiliB} material={kit.mat.chiliDeep} />
            <mesh geometry={kit.geo.chiliBGreen} material={kit.mat.stem} />
          </group>
        );
      case "chiliO":
        return (
          <group position={[0, 0.42, 0]}>
            <mesh geometry={kit.geo.chiliB} material={kit.mat.chiliOrange} />
            <mesh geometry={kit.geo.chiliBGreen} material={kit.mat.stem} />
          </group>
        );
      case "anise":
        return (
          <>
            <mesh geometry={kit.geo.anise} material={kit.mat.anise} />
            <mesh geometry={kit.geo.aniseSeeds} material={kit.mat.aniseSeed} />
          </>
        );
      case "ring":
        return <mesh geometry={kit.geo.ring} material={kit.mat.ring} />;
      case "leaf":
        return <mesh geometry={kit.geo.leaf} material={kit.mat.leaf} position={[0, -0.5, 0]} />;
      case "cilantro":
        return <mesh geometry={kit.geo.cilantro} material={kit.mat.cilantro} />;
    }
  };

  return (
    <group>
      {items.map((it, i) => (
        <group
          key={i}
          ref={(g) => {
            refs.current[i] = g;
          }}
        >
          {body(it)}
        </group>
      ))}
      <instancedMesh ref={sesRef} args={[kit.geo.sesame, kit.mat.sesame, sesame.length]} frustumCulled={false} />
      <instancedMesh ref={pepRef} args={[kit.geo.pepper, kit.mat.pepper, pepper.length]} frustumCulled={false} />
    </group>
  );
}
