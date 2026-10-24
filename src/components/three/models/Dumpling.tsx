"use client";

import * as THREE from "three";
import { fixLatheSeam, resample, splinePoints } from "../lib/geometry";
import { P } from "../palette";

/* Xiaolongbao: lathe profil (ostida sho'rva og'irligidan kengaygan) + yuqoriga burama burmalar
   va tepada tugun. Bitta geometriya — barcha chuchvaralar ulashadi */

export function dumplingGeometry(mobile: boolean, pleats = 18) {
  const prof = splinePoints(
    [
      [0, 0],
      [0.62, 0.0],
      [0.9, 0.04],
      [1.0, 0.15],
      [0.99, 0.29],
      [0.9, 0.45],
      [0.72, 0.6],
      [0.5, 0.73],
      [0.3, 0.83],
      [0.17, 0.9],
      [0.12, 0.95],
      [0.15, 1.0],
      [0.12, 1.06],
      [0.05, 1.09],
      [0, 1.095],
    ],
    160,
  );
  const N = mobile ? 40 : 56;
  const { points } = resample(prof, N);
  const segs = pleats * (mobile ? 4 : 5);
  const g = new THREE.LatheGeometry(points, segs);
  const p = g.getAttribute("position") as THREE.BufferAttribute;
  const col = new Float32Array(p.count * 3);
  const warm = new THREE.Color(P.doughWarm);
  const pale = new THREE.Color(P.dough);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const h = y / 1.095;
    const r = Math.hypot(x, z);
    const th = Math.atan2(x, z);
    // burmalar: o'rtadan tepaga kuchayadi, tugun oldida yig'iladi, burama
    const amp = 0.085 * THREE.MathUtils.smoothstep(h, 0.28, 0.78) * (1 - THREE.MathUtils.smoothstep(h, 0.86, 0.95));
    const twist = 1.25 * THREE.MathUtils.smoothstep(h, 0.25, 0.95);
    const wave = Math.cos(pleats * (th + twist));
    const ridge = Math.pow(0.5 + 0.5 * wave, 2.2) * 1.6 - 0.45;
    // tugun — tartibsizroq
    const knot = h > 0.88 ? 1 + 0.12 * Math.sin(th * 5 + h * 20) : 1;
    const rr = r * (1 + amp * ridge) * knot;
    const k = r > 1e-6 ? rr / r : 1;
    p.setXYZ(i, x * k, y + (h > 0.3 && h < 0.9 ? ridge * amp * 0.12 : 0), z * k);
    // ostki qismi biroz iliqroq (ichidagi sho'rva ko'rinadi)
    c.copy(warm).lerp(pale, THREE.MathUtils.smoothstep(h, 0.05, 0.45));
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  fixLatheSeam(g, segs, N);
  return g;
}

export function doughMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    vertexColors: true,
    roughness: 0.4,
    metalness: 0,
    sheen: 0.7,
    sheenColor: new THREE.Color(P.white),
    sheenRoughness: 0.45,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18,
    emissive: new THREE.Color(P.doughWarm),
    emissiveIntensity: 0.06,
  });
}
