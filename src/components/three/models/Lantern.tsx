"use client";

import * as THREE from "three";
import { useDisposable } from "../lib/dispose";
import { mergeGeometries, paint } from "../lib/geometry";
import { rng } from "../lib/motion";
import { lanternTextures } from "../lib/textures";
import { P } from "../palette";

/* Xitoy fonari: qovurg'ali ipak qobiq (lathe + qovurg'a siljishi), oltin qalpoqlar, ip va popuk.
   Barcha fonarlar bitta geometriya/material to'plamini ulashadi */

const RIBS = 14;
export const LANTERN = { bodyH: 1.7, capY: 0.86, string: 1.6 };

function bodyGeometry(mobile: boolean) {
  const pts: THREE.Vector2[] = [];
  const n = mobile ? 28 : 40;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const y = -0.85 + t * 1.7;
    const r = Math.max(0.3, 0.98 * Math.sqrt(Math.max(0, 1 - Math.pow(y / 0.92, 2))));
    pts.push(new THREE.Vector2(r, y));
  }
  const g = new THREE.LatheGeometry(pts, RIBS * (mobile ? 4 : 6));
  const p = g.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    const th = Math.atan2(x, z);
    // qovurg'alar orasida ipak biroz ichkariga botadi
    const k = 1 - 0.045 * Math.pow(0.5 + 0.5 * Math.cos(RIBS * th), 3);
    p.setX(i, x * k);
    p.setZ(i, z * k);
  }
  g.computeVertexNormals();
  return g;
}

function tasselGeometry(mobile: boolean) {
  const r = rng(11);
  const parts: THREE.BufferGeometry[] = [];
  const n = mobile ? 14 : 24;
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d = r() * 0.07;
    const len = 0.55 + r() * 0.12;
    const c = new THREE.CylinderGeometry(0.009, 0.006, len, 4);
    c.translate(Math.cos(a) * d, -len / 2, Math.sin(a) * d);
    parts.push(paint(c, P.tassel, 0.12, r));
  }
  const g = mergeGeometries(parts);
  parts.forEach((x) => x.dispose());
  return g;
}

export function useLanternKit(mobile: boolean) {
  return useDisposable(() => {
    const tex = lanternTextures(RIBS, mobile ? 512 : 1024, mobile ? 256 : 512);
    const body = bodyGeometry(mobile);
    const bodyMat = new THREE.MeshStandardMaterial({
      map: tex.map,
      emissiveMap: tex.emissive,
      emissive: new THREE.Color(P.white),
      emissiveIntensity: 1.2,
      roughness: 0.55,
      side: THREE.DoubleSide,
    });
    const cap = new THREE.CylinderGeometry(0.3, 0.36, 0.14, 32);
    const gold = new THREE.MeshStandardMaterial({ color: P.gold, metalness: 0.85, roughness: 0.3 });
    const string = new THREE.CylinderGeometry(0.012, 0.012, LANTERN.string, 6);
    string.translate(0, LANTERN.string / 2, 0);
    const stringMat = new THREE.MeshStandardMaterial({ color: P.lanternDeep, roughness: 0.7 });
    const bead = new THREE.SphereGeometry(0.065, 16, 12);
    const tassel = tasselGeometry(mobile);
    const tasselMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 });
    return { tex, body, bodyMat, cap, gold, string, stringMat, bead, tassel, tasselMat };
  }, [mobile]);
}

export type LanternKit = ReturnType<typeof useLanternKit>;

/** Bitta fonar; pivot — ipning tepasi emas, qobiq markazi (sahna ipni yuqoriga cho'zadi) */
export function Lantern({ kit }: { kit: LanternKit }) {
  return (
    <group>
      <mesh geometry={kit.string} material={kit.stringMat} position={[0, LANTERN.capY + 0.07, 0]} />
      <mesh geometry={kit.cap} material={kit.gold} position={[0, LANTERN.capY, 0]} />
      <mesh geometry={kit.body} material={kit.bodyMat} />
      <mesh geometry={kit.cap} material={kit.gold} position={[0, -LANTERN.capY, 0]} rotation={[Math.PI, 0, 0]} />
      <mesh geometry={kit.bead} material={kit.gold} position={[0, -LANTERN.capY - 0.14, 0]} />
      <mesh geometry={kit.tassel} material={kit.tasselMat} position={[0, -LANTERN.capY - 0.18, 0]} />
    </group>
  );
}
