"use client";

import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import * as THREE from "three";
import { useDisposable } from "../lib/dispose";
import { mergeGeometries, paint, roundedRadius, tube } from "../lib/geometry";
import { rng } from "../lib/motion";
import { P } from "../palette";

/* Qo'lda cho'zilgan lag'mon: kosadagi "uya" (ko'p to'lqinli naychalar) +
   palochkalar ko'targan, osilib tebranayotgan tutam (vertex shader'da tebranish) */

const NOODLE_R = 0.036;

export type NoodleLayout = {
  brothY: number;
  /** sho'rva sathidagi ichki radius */
  radius: number;
  /** palochkalar qisgan nuqta (kosa koordinatasida) */
  tip: THREE.Vector3;
  /** palochka o'qi (gorizontal) */
  axis: THREE.Vector3;
  /** tutam kosaga tushadigan joy */
  base: THREE.Vector3;
};

/** Uya tepaligi: markazda baland, devor yonida sho'rvaga yaqin */
export function moundY(x: number, z: number, L: Pick<NoodleLayout, "brothY" | "radius">) {
  const rr = Math.min(1, Math.hypot(x, z) / L.radius);
  return L.brothY + 0.03 + 0.21 * Math.pow(1 - rr * rr, 1.1);
}

function nestCurves(count: number, L: NoodleLayout, seed: number) {
  const r = rng(seed);
  const R = L.radius;
  const curves: THREE.CatmullRomCurve3[] = [];
  for (let k = 0; k < count; k++) {
    // uya: asosan konsentrik spiral yoylar (silliq, uzun), radius sekin "suzadi"
    const dir = r() > 0.25 ? 1 : -1;
    const a0 = r() * Math.PI * 2;
    const sweep = (2.2 + r() * 2.2) * dir;
    const r0 = 0.12 + Math.pow(r(), 0.8) * R * 0.78;
    const drift = (r() - 0.5) * 0.5;
    const wobA = 0.04 + r() * 0.06;
    const wobF = 2 + r() * 3;
    const ph = r() * 6;
    const n = 14;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const a = a0 + sweep * u;
      const rad = THREE.MathUtils.clamp(r0 + drift * u + Math.sin(u * wobF * Math.PI + ph) * wobA, 0.05, R * 0.9);
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad;
      // uchlari sho'rvaga botadi, o'rtasida yuzada biroz to'lqinlanadi
      const edge = Math.min(u, 1 - u);
      const sink = edge < 0.12 ? (1 - edge / 0.12) * (moundY(x, z, L) - L.brothY + 0.05) : 0;
      const y = moundY(x, z, L) + Math.sin(u * 7 + ph) * 0.018 - sink;
      pts.push(new THREE.Vector3(x, y, z));
    }
    curves.push(new THREE.CatmullRomCurve3(pts, false, "centripetal"));
  }
  return curves;
}

function liftedCurves(count: number, L: NoodleLayout, seed: number) {
  const r = rng(seed);
  const up = new THREE.Vector3(0, 1, 0);
  const n = new THREE.Vector3().crossVectors(L.axis, up).normalize().negate(); // kameraga tomon
  const curves: THREE.CatmullRomCurve3[] = [];
  for (let k = 0; k < count; k++) {
    const s = (r() - 0.5) * 0.24;
    const B = L.tip.clone().addScaledVector(L.axis, s);
    const tail = 0.12 + r() * 0.38;
    const A = B.clone()
      .addScaledVector(n, -0.075 - r() * 0.03)
      .addScaledVector(up, -tail)
      .addScaledVector(L.axis, (r() - 0.5) * 0.08);
    const A2 = B.clone().addScaledVector(n, -0.06).addScaledVector(up, -0.05);
    const C0 = B.clone().addScaledVector(n, 0.06).addScaledVector(up, -0.06);
    // kosaga tushish joyi
    const ang = r() * Math.PI * 2;
    const rad = Math.sqrt(r()) * 0.32;
    const D = L.base.clone().add(new THREE.Vector3(Math.cos(ang) * rad, 0, Math.sin(ang) * rad));
    D.y = moundY(D.x, D.z, L) + 0.01;
    const outDir = new THREE.Vector3(Math.cos(ang + 1), 0, Math.sin(ang + 1));
    const E = D.clone().addScaledVector(outDir, 0.25 + r() * 0.2);
    E.y = L.brothY - 0.05;
    const side = new THREE.Vector3(r() - 0.5, 0, r() - 0.5).normalize();
    const bulge = 0.05 + r() * 0.1;
    const phase = r() * Math.PI * 2;
    const mids: THREE.Vector3[] = [];
    for (const u of [0.18, 0.4, 0.62, 0.84]) {
      const p = new THREE.Vector3().lerpVectors(C0, D, u);
      p.addScaledVector(side, Math.sin(u * Math.PI) * bulge);
      p.addScaledVector(n, Math.sin(u * Math.PI) * 0.06);
      p.x += Math.sin(u * 9 + phase) * 0.022;
      p.z += Math.cos(u * 7 + phase) * 0.022;
      mids.push(p);
    }
    curves.push(new THREE.CatmullRomCurve3([A, A2, B, C0, ...mids, D, E], false, "centripetal"));
  }
  return curves;
}

const swayVert = /* glsl */ `
  #include <common>
  attribute vec3 aSway;
  uniform float uTime;
  uniform float uLift;
`;
const swayBegin = /* glsl */ `
  #include <begin_vertex>
  float sw = aSway.x;
  transformed.x += sin(uTime * 1.3 + aSway.z) * 0.05 * sw;
  transformed.z += cos(uTime * 1.05 + aSway.z * 1.7) * 0.04 * sw;
  transformed.y += uLift * aSway.y - 0.015 * sw * (0.5 + 0.5 * sin(uTime * 1.3 + aSway.z));
`;

export default function Noodles({
  layout,
  mobile,
  timeRef,
  nestOnly = false,
}: {
  layout: NoodleLayout;
  mobile: boolean;
  /** true — faqat kosadagi uya (palochka ko'targan tutamsiz) */
  nestOnly?: boolean;
  /** {t, lift} — sahna har kadr yangilaydi */
  timeRef: RefObject<{ t: number; lift: number }>;
}) {
  const res = useDisposable(() => {
    const r = rng(3);
    const shade = new THREE.Color(P.noodle);
    const nestN = mobile ? 22 : 34;
    const liftN = mobile ? 12 : 18;
    const nest = nestCurves(nestN, layout, 101).map((c) =>
      paint(
        tube(c, { segments: mobile ? 36 : 52, radial: 5, radius: roundedRadius(NOODLE_R, 0.015) }),
        shade.clone().multiplyScalar(0.9 + r() * 0.16),
      ),
    );
    const nestGeo = mergeGeometries(nest);
    nest.forEach((g) => g.dispose());

    const span = layout.tip.y - layout.brothY;
    const lifted = liftedCurves(liftN, layout, 202).map((c) => {
      const phase = r() * Math.PI * 2;
      return paint(
        tube(c, {
          segments: mobile ? 40 : 56,
          radial: 5,
          radius: roundedRadius(NOODLE_R * 0.92, 0.03),
          attrs: [
            {
              name: "aSway",
              size: 3,
              fn: (_t, p) => {
                const h = THREE.MathUtils.clamp((p.y - layout.brothY) / span, 0, 1);
                const sway = Math.pow(Math.sin(Math.PI * Math.min(h, 0.97)), 1.1);
                const lift = THREE.MathUtils.smoothstep(h, 0.08, 0.92);
                return [sway, lift, phase];
              },
            },
          ],
        }),
        shade.clone().multiplyScalar(0.94 + r() * 0.1),
      );
    });
    const liftGeo = mergeGeometries(lifted);
    lifted.forEach((g) => g.dispose());

    const matProps: THREE.MeshPhysicalMaterialParameters = {
      color: "#ffffff",
      vertexColors: true,
      roughness: 0.36,
      metalness: 0,
      clearcoat: 0.55,
      clearcoatRoughness: 0.22,
      sheen: 0.4,
      sheenColor: new THREE.Color(P.noodle),
      sheenRoughness: 0.5,
    };
    const nestMat = new THREE.MeshPhysicalMaterial(matProps);
    const liftMat = new THREE.MeshPhysicalMaterial(matProps);
    const uniforms = { uTime: { value: 0 }, uLift: { value: 0 } };
    liftMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.uniforms.uLift = uniforms.uLift;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", swayVert)
        .replace("#include <begin_vertex>", swayBegin);
    };
    liftMat.customProgramCacheKey = () => "noodle-sway";
    return { nestGeo, liftGeo, nestMat, liftMat, uniforms };
  }, [mobile, layout]);

  useFrame(() => {
    const v = timeRef.current;
    if (!v) return;
    res.uniforms.uTime.value = v.t;
    res.uniforms.uLift.value = v.lift;
  });

  return (
    <group>
      <mesh geometry={res.nestGeo} material={res.nestMat} />
      {!nestOnly && <mesh geometry={res.liftGeo} material={res.liftMat} frustumCulled={false} />}
    </group>
  );
}
