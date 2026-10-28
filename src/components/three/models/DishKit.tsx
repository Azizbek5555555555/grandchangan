"use client";

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Kind, Tint } from "@/lib/menu/recipe-types";
import { mergeGeometries, noise3, roundedRadius, tube } from "../lib/geometry";
import { rng } from "../lib/motion";
import { beefTexture, chokTexture } from "../lib/textures";
import { P } from "../palette";
import { dumplingGeometry, doughMaterial } from "./Dumpling";
import { beefSlice, chili, chokLeaf, cilantro, peppercorn, scallionRing, sesame, starAnise } from "./Ingredients";

/* Qatlamli sahna masalliqlari: har tur — geometriya (bir nechta variant) + material + joylashuv qoidasi.
   Hammasi protsedural, rang — palette.ts (tint). Bo'laklar InstancedMesh bilan chiziladi (ExplodedDishScene). */

export type Part = { geos: THREE.BufferGeometry[]; mat: THREE.Material };

export type Placement =
  | "scatter" // yuzaga sochiladi
  | "pile" // markazda uyum
  | "ring" // aylana bo'ylab (taxtada — qatorlar)
  | "rows" // parallel qatorlar (kabob)
  | "stack" // ustma-ust (blinchik, tilimlar)
  | "center" // bitta, markazda
  | "float" // suyuqlik yuzasida
  | "volume" // stakan ichida (muz)
  | "rim" // stakan labida (limon)
  | "lean" // stakanga suyalgan (naycha)
  | "beside"; // idish yonida (shisha)

export type KindDef = {
  place: Placement;
  /** [kompyuter, telefon] */
  count: [number, number];
  scale: [number, number];
  /** tasodifiy qiyalik (radian) */
  tilt: number;
  /** bo'lak markazining yuzadan balandligi */
  lift: number;
  /** yuza radiusining qancha qismiga yoyiladi */
  spread: number;
  /** taxminiy balandlik (kamera va nomlar uchun) */
  h: number;
  /** bo'laklar orasidagi eng kichik masofa */
  gap?: number;
  build: (mobile: boolean, tint: THREE.Color | null, key: Tint | undefined) => Part[];
};

/* ---------------- Yordamchilar ---------------- */

const col = (k: Tint) => new THREE.Color(P[k]);
const pick = (tint: THREE.Color | null, k: Tint) => (tint ? tint.clone() : col(k));

function glossy(color: THREE.ColorRepresentation, rough = 0.32, coat = 0.8) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: rough, clearcoat: coat, clearcoatRoughness: 0.15 });
}
function matte(color: THREE.ColorRepresentation, rough = 0.68) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough });
}
function vcMat(rough = 0.4, coat = 0.6, side: THREE.Side = THREE.FrontSide) {
  return new THREE.MeshPhysicalMaterial({ color: "#ffffff", vertexColors: true, roughness: rough, clearcoat: coat, clearcoatRoughness: 0.18, side });
}

/** Markazdan tashqariga shovqin bilan siljitish (bo'laklarga tabiiy notekislik) */
function bump(g: THREE.BufferGeometry, amp: number, freq: number, seed = 0) {
  const p = g.getAttribute("position") as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const len = v.length() || 1;
    const n = noise3(v.x * freq + seed, v.y * freq - seed, v.z * freq + seed * 0.5);
    v.multiplyScalar(1 + (n * amp) / len);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/** Har cho'qqiga rang (pozitsiyaga qarab) */
function paintBy(g: THREE.BufferGeometry, fn: (v: THREE.Vector3) => THREE.Color) {
  const p = g.getAttribute("position") as THREE.BufferAttribute;
  const arr = new Float32Array(p.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const c = fn(v);
    arr.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return g;
}

const lighten = (c: THREE.Color, k: number) => c.clone().lerp(new THREE.Color(1, 1, 1), k);
const darken = (c: THREE.Color, k: number) => c.clone().multiplyScalar(1 - k);

function sphere(r: number, mobile: boolean, sx = 1, sy = 1, sz = 1) {
  const g = new THREE.SphereGeometry(r, mobile ? 14 : 22, mobile ? 10 : 16);
  g.scale(sx, sy, sz);
  return g;
}

/** Egri chiziq bo'ylab naycha (lag'mon, loviya, somoncha) */
function bentTube(len: number, r: number, bend: number, mobile: boolean, seed: number, shape?: (t: number, a: number) => number) {
  const rr = rng(seed);
  const pts = Array.from({ length: 5 }, (_, i) => {
    const t = i / 4 - 0.5;
    return new THREE.Vector3(t * len, Math.sin(t * Math.PI) * bend * (0.5 + rr()), (rr() - 0.5) * bend * 0.6);
  });
  return tube(new THREE.CatmullRomCurve3(pts), { segments: mobile ? 10 : 18, radial: mobile ? 5 : 7, radius: roundedRadius(r, 0.06), shape });
}

/**
 * Yassi silindr (kesim) — lathe bilan, qopqoqlarida radial halqalar bor (CylinderGeometry qopqog'i faqat markaz+chet,
 * radial rang chizilmaydi). stops — 0..1 radius ulushlari.
 */
function radialDisc(r: number, h: number, seg: number, stops = [0.25, 0.4, 0.55, 0.7, 0.85, 0.92, 0.97]) {
  const y = h / 2;
  const pts: THREE.Vector2[] = [new THREE.Vector2(0, -y)];
  stops.forEach((k) => pts.push(new THREE.Vector2(r * k, -y)));
  pts.push(new THREE.Vector2(r, -y), new THREE.Vector2(r, -y), new THREE.Vector2(r, y), new THREE.Vector2(r, y));
  [...stops].reverse().forEach((k) => pts.push(new THREE.Vector2(r * k, y)));
  pts.push(new THREE.Vector2(0, y));
  const g = new THREE.LatheGeometry(pts, seg);
  g.computeVertexNormals();
  return g;
}

/* ---------------- Masalliqlar ---------------- */

const D = (d: Partial<KindDef> & Pick<KindDef, "build">): KindDef => ({
  place: "scatter", count: [10, 7], scale: [0.85, 1.15], tilt: 0.5, lift: 0.04, spread: 0.85, h: 0.25, ...d,
});

const KINDS: Partial<Record<Kind, KindDef>> = {
  /* ---- go'sht va parranda ---- */
  beef: D({
    count: [8, 6], tilt: 0.18, lift: 0.04, h: 0.2, gap: 0.3,
    build: (m, tint) => {
      const map = beefTexture(m ? 256 : 512);
      const mat = new THREE.MeshPhysicalMaterial({ map, color: tint ?? "#ffffff", roughness: 0.48, clearcoat: 0.45, clearcoatRoughness: 0.3 });
      return [{ geos: [0, 1, 2, 3].map((i) => beefSlice(31 + i * 7, m)), mat }];
    },
  }),
  chunk: D({
    count: [12, 8], h: 0.32, gap: 0.24,
    build: (m, tint) => [{
      geos: [0, 1, 2].map((k) => bump(new RoundedBoxGeometry(0.27 - k * 0.03, 0.2, 0.24 + k * 0.02, m ? 2 : 3, 0.06), 0.022, 9, k * 3.1)),
      mat: glossy(pick(tint, "chickenFried"), 0.38, 0.6),
    }],
  }),
  meatball: D({
    count: [9, 7], h: 0.36, gap: 0.3, tilt: 3,
    build: (m, tint) => [{ geos: [0, 1].map((k) => bump(sphere(0.17, m), 0.014, 16, k * 2)), mat: glossy(pick(tint, "glazeBrown"), 0.28, 1) }],
  }),
  rib: D({
    count: [8, 6], h: 0.3, gap: 0.3, tilt: 0.25,
    build: (m, tint) => [
      { geos: [0, 1].map((k) => bump(new RoundedBoxGeometry(0.34, 0.17, 0.22, 2, 0.06), 0.02, 8, k)), mat: glossy(pick(tint, "glazeBrown"), 0.36, 0.7) },
      { geos: [0, 1].map(() => new THREE.CylinderGeometry(0.035, 0.03, 0.62, 8).rotateZ(Math.PI / 2).translate(0.06, 0.02, 0)), mat: matte(P.bone, 0.5) },
    ],
  }),
  skewer: D({
    place: "rows", count: [5, 4], h: 0.3, tilt: 0.05, lift: 0.11, scale: [1.3, 1.3],
    build: (m, tint) => {
      const meat = [0, 1].map((k) => {
        const pieces = [-0.56, -0.28, 0, 0.28, 0.56].map((x, i) =>
          bump(new RoundedBoxGeometry(0.22, 0.17, 0.19, 2, 0.05), 0.025, 10, i + k * 5).translate(x, 0, 0));
        const g = mergeGeometries(pieces);
        pieces.forEach((p) => p.dispose());
        const base = pick(tint, "lamb");
        const rr = rng(9 + k);
        // ziravor (zira, qalampir) dog'lari
        return paintBy(g, () => (rr() > 0.86 ? col("chiliDeep") : rr() > 0.8 ? col("anise") : base));
      });
      return [
        { geos: meat, mat: vcMat(0.45, 0.4) },
        { geos: [new THREE.CylinderGeometry(0.014, 0.014, 1.9, 6).rotateZ(Math.PI / 2)], mat: matte(P.bamboo, 0.6) },
      ];
    },
  }),
  roast: D({
    place: "center", count: [1, 1], h: 0.9, tilt: 0, lift: 0.36, scale: [1.4, 1.4],
    build: (m, tint) => {
      const body = sphere(0.5, m, 1.45, 0.62, 0.85);
      const p = body.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        // oldi (bo'yin tomoni) torayadi, orqasi to'mtoq
        const k = x > 0.3 ? 1 - (x - 0.3) * 0.55 : 1;
        p.setY(i, p.getY(i) * k);
        p.setZ(i, p.getZ(i) * k);
      }
      body.computeVertexNormals();
      const legs = [-1, 1].map((s) => new THREE.CapsuleGeometry(0.11, 0.3, 4, 10).rotateZ(-1.1).translate(-0.45, -0.05, s * 0.3));
      const g = mergeGeometries([body, ...legs]);
      [body, ...legs].forEach((x) => x.dispose());
      const base = pick(tint, "duckSkin");
      paintBy(g, (v) => (v.y > 0.12 ? darken(base, 0.18 + noise3(v.x * 9, v.y * 9, v.z * 9) * 0.08) : base));
      return [{ geos: [g], mat: vcMat(0.22, 1) }];
    },
  }),
  fish: D({
    place: "center", count: [1, 1], h: 0.5, tilt: 0, lift: 0.2, scale: [1.35, 1.35],
    build: (m, tint) => {
      // yonboshlab yotgan baliq: profil XZ tekisligida (+z — orqa suzgich tomoni), qalinligi — Y
      const body = new THREE.SphereGeometry(1, m ? 32 : 48, m ? 14 : 20);
      const p = body.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        const u = (x + 1) / 2; // 0 — dum, 1 — bosh
        const prof = Math.pow(Math.sin(Math.PI * (0.06 + 0.9 * u)), 0.65) * (u < 0.15 ? 0.35 + 0.65 * (u / 0.15) : 1);
        p.setXYZ(i, x, p.getY(i) * 0.17 * prof, p.getZ(i) * 0.38 * prof + 0.03 * Math.sin(u * Math.PI));
      }
      body.computeVertexNormals();
      const base = pick(tint, "fishGold");
      const back = darken(base, 0.32);
      const belly = lighten(base, 0.4);
      paintBy(body, (v) => {
        const u = (v.x + 1) / 2;
        const c = belly.clone().lerp(back, THREE.MathUtils.smoothstep(v.z, -0.2, 0.25));
        // jabra chizig'i va tangacha naqshi
        if (Math.abs(u - 0.8) < 0.012 && v.y > 0) return darken(c, 0.35);
        return c.multiplyScalar(0.94 + 0.08 * Math.sin(v.x * 40 + Math.sin(v.z * 30) * 2));
      });
      const tailShape = new THREE.Shape();
      tailShape.moveTo(-0.92, 0);
      tailShape.lineTo(-1.42, 0.38);
      tailShape.quadraticCurveTo(-1.24, 0, -1.42, -0.38);
      tailShape.closePath();
      const finShape = new THREE.Shape();
      finShape.moveTo(-0.55, 0.26);
      finShape.quadraticCurveTo(-0.15, 0.56, 0.32, 0.33);
      finShape.lineTo(0.3, 0.28);
      finShape.closePath();
      const tail = new THREE.ShapeGeometry(tailShape, 8).rotateX(-Math.PI / 2).scale(1, 1, -1);
      const fin = new THREE.ShapeGeometry(finShape, 8).rotateX(-Math.PI / 2).scale(1, 1, -1);
      const fins = mergeGeometries([tail, fin]);
      [tail, fin].forEach((x) => x.dispose());
      const eyeWhite = new THREE.TorusGeometry(0.05, 0.018, 8, 18).rotateX(Math.PI / 2).translate(0.8, 0.075, 0.07);
      const eye = new THREE.SphereGeometry(0.045, 12, 8).scale(1, 0.6, 1).translate(0.8, 0.072, 0.07);
      return [
        { geos: [body], mat: vcMat(0.22, 1) },
        { geos: [fins], mat: new THREE.MeshPhysicalMaterial({ color: back, roughness: 0.35, clearcoat: 0.8, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }) },
        { geos: [eyeWhite], mat: glossy(P.cream, 0.2, 1) },
        { geos: [eye], mat: glossy(P.night, 0.1, 1) },
      ];
    },
  }),
  shrimp: D({
    count: [7, 5], h: 0.24, tilt: 0.3, lift: 0.07, gap: 0.3,
    build: (m, tint) => {
      const geos = [0, 1].map((k) => {
        const pts = Array.from({ length: 9 }, (_, i) => {
          const a = Math.PI * (0.15 + (i / 8) * 1.25 + k * 0.05);
          return new THREE.Vector3(Math.cos(a) * 0.15, Math.sin(i / 8 * Math.PI) * 0.02, Math.sin(a) * 0.15);
        });
        const body = tube(new THREE.CatmullRomCurve3(pts), {
          segments: m ? 16 : 26, radial: m ? 7 : 10,
          radius: (t) => (0.03 + 0.032 * Math.pow(1 - t, 0.7)) * Math.min(1, t * 12 + 0.25) * (1 + 0.08 * Math.sin(t * 40)),
        });
        const tail = new THREE.ConeGeometry(0.05, 0.1, 8).scale(1.4, 1, 0.35).rotateZ(Math.PI / 2).translate(pts[8].x - 0.04, pts[8].y, pts[8].z + 0.04);
        const g = mergeGeometries([body, tail]);
        body.dispose();
        tail.dispose();
        const base = pick(tint, "shrimp");
        const flesh = col("shrimpFlesh");
        return paintBy(g, (v) => {
          const inner = Math.hypot(v.x, v.z) < 0.14;
          return (inner ? flesh.clone().lerp(base, 0.35) : base.clone()).multiplyScalar(0.9 + 0.12 * Math.sin(Math.atan2(v.z, v.x) * 14));
        });
      });
      return [{ geos, mat: vcMat(0.3, 0.9) }];
    },
  }),
  squid: D({
    count: [10, 7], h: 0.2, tilt: 0.5, gap: 0.22,
    build: (m, tint) => [{ geos: [0, 1].map((k) => bump(sphere(0.1, m, 0.85, 0.8, 1.6), 0.01, 12, k)), mat: glossy(pick(tint, "squid"), 0.25, 1) }],
  }),
  shell: D({
    place: "ring", count: [6, 5], h: 0.26, tilt: 0.05, lift: 0.05, scale: [1.3, 1.3],
    build: (m, tint) => {
      const s = new THREE.SphereGeometry(0.32, m ? 24 : 36, 6, 0, Math.PI * 2, 0, 0.62);
      const p = s.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const a = Math.atan2(p.getZ(i), p.getX(i));
        const r = Math.hypot(p.getX(i), p.getZ(i));
        p.setY(i, (0.32 - p.getY(i)) * 0.6 + Math.abs(Math.sin(a * 9)) * 0.018 * (r / 0.2));
      }
      s.computeVertexNormals();
      return [
        { geos: [s], mat: new THREE.MeshPhysicalMaterial({ color: pick(tint, "scallopShell"), roughness: 0.5, clearcoat: 0.4, side: THREE.DoubleSide }) },
        { geos: [new THREE.CylinderGeometry(0.11, 0.12, 0.07, 18).translate(0, 0.05, 0)], mat: glossy(P.scallopMeat, 0.3, 0.8) },
      ];
    },
  }),
  abalone: D({
    place: "ring", count: [5, 4], h: 0.22, tilt: 0.1, lift: 0.06,
    build: (m, tint) => [{ geos: [bump(sphere(0.2, m, 1, 0.45, 0.72), 0.012, 14, 1)], mat: glossy(pick(tint, "abalone"), 0.22, 1) }],
  }),
  seaCucumber: D({
    count: [4, 3], h: 0.22, tilt: 0.1, lift: 0.07, gap: 0.45,
    build: (m, tint) => [{
      geos: [0, 1].map((k) => bentTube(0.7, 0.085, 0.08, m, 21 + k, (t, a) => 1 + 0.22 * Math.max(0, noise3(t * 30 + k, a * 3, 1)))),
      mat: glossy(pick(tint, "seaCucumber"), 0.3, 1),
    }],
  }),

  /* ---- tuxum, tofu, xamir ---- */
  egg: D({
    count: [12, 8], h: 0.22, gap: 0.2,
    build: (m, tint) => {
      const base = pick(tint, "egg");
      return [{
        geos: [0, 1, 2].map((k) => paintBy(bump(sphere(0.13, m, 1.1, 0.55, 0.9), 0.04, 14, k * 1.7), (v) =>
          noise3(v.x * 20 + k, v.y * 20, v.z * 20) > 0.35 ? col("eggWhite") : base)),
        mat: vcMat(0.5, 0.3),
      }];
    },
  }),
  tofu: D({
    count: [14, 10], h: 0.24, tilt: 0.25, gap: 0.23,
    build: (m, tint) => [{ geos: [bump(new RoundedBoxGeometry(0.21, 0.19, 0.21, 2, 0.02), 0.004, 20)], mat: new THREE.MeshPhysicalMaterial({ color: pick(tint, "tofu"), roughness: 0.55, sheen: 0.4, sheenColor: new THREE.Color(P.white) }) }],
  }),
  dumpling: D({
    place: "ring", count: [7, 6], h: 0.4, tilt: 0.06, lift: 0.0, scale: [0.5, 0.5],
    build: (m, tint) => {
      const mat = doughMaterial();
      if (tint) mat.color = tint;
      return [{ geos: [dumplingGeometry(m, 18)], mat }];
    },
  }),
  bread: D({
    place: "pile", count: [5, 4], h: 0.42, tilt: 0.25, lift: 0.14, gap: 0.42,
    build: (m, tint) => {
      const base = pick(tint, "bread");
      return [{
        geos: [0, 1].map((k) => paintBy(bump(new RoundedBoxGeometry(0.56, 0.3, 0.36, m ? 2 : 3, 0.12), 0.02, 6, k), (v) => (v.y > 0.06 ? darken(base, 0.12) : lighten(base, 0.3)))),
        mat: vcMat(0.55, 0.3),
      }];
    },
  }),
  pancake: D({
    place: "stack", count: [4, 3], h: 0.2, tilt: 0.04, lift: 0.03, scale: [1, 1],
    build: (m, tint) => {
      const base = pick(tint, "pancake");
      const g = new THREE.CylinderGeometry(0.6, 0.6, 0.035, m ? 36 : 56, 1);
      const p = g.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + noise3(p.getX(i) * 4, 0, p.getZ(i) * 4) * 0.012);
      g.computeVertexNormals();
      paintBy(g, (v) => (noise3(v.x * 14, 1, v.z * 14) > 0.55 ? darken(base, 0.28) : base));
      return [{ geos: [g], mat: vcMat(0.6, 0.15) }];
    },
  }),
  sushi: D({
    place: "ring", count: [8, 8], h: 0.3, tilt: 0, lift: 0.14, scale: [1.25, 1.25],
    build: (m, tint) => {
      const g = radialDisc(0.2, 0.22, m ? 20 : 28, [0.12, 0.3, 0.34, 0.4, 0.6, 0.8, 0.88, 0.9]);
      const nori = col("nori");
      const rice = col("sushiRice");
      const fill = pick(tint, "salmon");
      paintBy(g, (v) => {
        const r = Math.hypot(v.x, v.z);
        if (Math.abs(v.y) < 0.105 || r > 0.181) return nori;
        if (r < 0.075) return v.x > 0.035 ? col("avocado") : fill;
        return rice.clone().multiplyScalar(0.94 + 0.06 * noise3(v.x * 60, v.y, v.z * 60));
      });
      return [{ geos: [g], mat: vcMat(0.55, 0.25) }];
    },
  }),
  sushiTop: D({
    place: "ring", count: [8, 8], h: 0.15, tilt: 0, lift: 0.285, scale: [1.25, 1.25],
    build: (m, tint) => {
      const base = pick(tint, "salmon");
      const g = bump(new THREE.SphereGeometry(0.2, m ? 16 : 24, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.42, 1), 0.01, 18, 4);
      paintBy(g, (v) => (noise3(v.x * 30, v.y * 30, v.z * 30) > 0.45 ? darken(base, 0.35) : base));
      return [{ geos: [g], mat: vcMat(0.35, 0.7) }];
    },
  }),
  caviar: D({
    place: "pile", count: [70, 40], h: 0.14, tilt: 3, lift: 0.26, spread: 0.7, scale: [0.9, 1.1], gap: 0.04,
    build: (m, tint) => [{ geos: [new THREE.SphereGeometry(0.03, 8, 6)], mat: new THREE.MeshPhysicalMaterial({ color: pick(tint, "caviar"), roughness: 0.08, clearcoat: 1, transmission: m ? 0 : 0.3, thickness: 0.05 }) }],
  }),

  /* ---- sabzavot ---- */
  strips: D({
    place: "pile", count: [46, 26], h: 0.26, tilt: 0.4, lift: 0.06, gap: 0.05,
    build: (m, tint) => [{ geos: [0, 1, 2].map((k) => bentTube(0.5, 0.019, 0.05, m, 3 + k)), mat: glossy(pick(tint, "potato"), 0.4, 0.5) }],
  }),
  beans: D({
    place: "pile", count: [16, 10], h: 0.26, tilt: 0.3, lift: 0.07, gap: 0.08,
    build: (m, tint) => [{
      geos: [0, 1, 2].map((k) => bentTube(0.85, 0.045, 0.1, m, 11 + k, (t, a) => 1 + 0.07 * Math.sin(t * 50 + a))),
      mat: glossy(pick(tint, "greenBean"), 0.35, 0.8),
    }],
  }),
  eggplant: D({
    count: [10, 7], h: 0.22, gap: 0.26,
    build: (m, tint) => {
      const skin = col("eggplantSkin");
      const flesh = pick(tint, "eggplantFlesh");
      return [{ geos: [0, 1].map((k) => paintBy(bump(new RoundedBoxGeometry(0.38, 0.15, 0.15, 2, 0.04), 0.01, 10, k), (v) => (v.y > 0.045 ? skin : flesh))), mat: vcMat(0.3, 0.9) }];
    },
  }),
  cucumber: D({
    count: [12, 8], h: 0.12, tilt: 0.35, gap: 0.22,
    build: (m, tint) => {
      const skin = pick(tint, "cucumber");
      const flesh = lighten(skin, 0.62);
      const g = paintBy(radialDisc(0.13, 0.035, m ? 18 : 26), (v) => {
        const r = Math.hypot(v.x, v.z);
        return r > 0.118 ? skin : r < 0.05 ? lighten(skin, 0.45) : flesh;
      });
      return [{ geos: [g], mat: vcMat(0.35, 0.6) }];
    },
  }),
  slice: D({
    count: [12, 8], h: 0.12, tilt: 0.35, gap: 0.22,
    build: (m, tint) => {
      const base = pick(tint, "potato");
      const g = paintBy(radialDisc(0.14, 0.03, m ? 18 : 26), (v) => (Math.hypot(v.x, v.z) > 0.125 ? darken(base, 0.18) : base));
      return [{ geos: [g], mat: vcMat(0.4, 0.5) }];
    },
  }),
  tomato: D({
    count: [9, 6], h: 0.28, tilt: 0.4, gap: 0.26, lift: 0.1,
    build: (m, tint) => [
      { geos: [bump(sphere(0.12, m), 0.004, 10)], mat: glossy(pick(tint, "tomato"), 0.15, 1) },
      { geos: [cilantro().scale(0.75, 1, 0.75).translate(0, 0.118, 0)], mat: matte(P.chiliStem, 0.5) },
    ],
  }),
  wedge: D({
    count: [8, 6], h: 0.24, tilt: 0.3, gap: 0.3, lift: 0.06,
    build: (m, tint, key) => {
      const L = Math.PI / 2.6;
      const s = new THREE.SphereGeometry(0.2, m ? 10 : 14, m ? 8 : 12, 0, L);
      const c1 = new THREE.CircleGeometry(0.2, 10, -Math.PI / 2, Math.PI).rotateY(Math.PI);
      const c2 = c1.clone().rotateY(L);
      const g = mergeGeometries([s, c1, c2]);
      [s, c1, c2].forEach((x) => x.dispose());
      const flesh = pick(tint, "tomato");
      const skin = key === "watermelon" ? col("cucumber") : darken(flesh, 0.25);
      paintBy(g, (v) => (v.length() > 0.188 ? skin : key === "watermelon" && v.length() > 0.16 ? col("cabbage") : lighten(flesh, 0.12)));
      return [{ geos: [g], mat: vcMat(0.25, 0.9, THREE.DoubleSide) }];
    },
  }),
  leaf: D({
    count: [6, 4], h: 0.3, tilt: 0.2, lift: 0.06, scale: [0.55, 0.8], gap: 0.35,
    build: (m, tint) => {
      const geo = chokLeaf(m ? 8 : 12, m ? 18 : 26).rotateX(-Math.PI / 2 + 0.3);
      if (tint) return [{ geos: [geo], mat: new THREE.MeshPhysicalMaterial({ color: tint, side: THREE.DoubleSide, roughness: 0.42, clearcoat: 0.4 }) }];
      const map = chokTexture(m ? 128 : 256, m ? 256 : 512);
      return [{ geos: [geo], mat: new THREE.MeshPhysicalMaterial({ map, side: THREE.DoubleSide, roughness: 0.42, clearcoat: 0.4 }) }];
    },
  }),
  mushroom: D({
    count: [8, 6], h: 0.24, tilt: 0.45, gap: 0.26, lift: 0.07,
    build: (m, tint) => {
      const cap = new THREE.SphereGeometry(0.15, m ? 14 : 20, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.55, 1);
      const under = new THREE.CircleGeometry(0.15, m ? 14 : 20).rotateX(Math.PI / 2);
      const stem = new THREE.CylinderGeometry(0.035, 0.045, 0.12, 10).translate(0, -0.06, 0);
      const g = mergeGeometries([cap, under, stem]);
      [cap, under, stem].forEach((x) => x.dispose());
      const base = pick(tint, "mushroom");
      paintBy(g, (v) => (v.y > 0.004 ? (Math.abs(Math.sin(Math.atan2(v.z, v.x) * 3)) > 0.95 ? lighten(base, 0.4) : base) : col("tofu")));
      return [{ geos: [g], mat: vcMat(0.35, 0.7) }];
    },
  }),
  onion: D({
    count: [10, 6], h: 0.16, tilt: 0.6, gap: 0.2,
    build: (m, tint) => [{ geos: [0, 1].map((k) => new THREE.TorusGeometry(0.14 - k * 0.03, 0.016, 6, m ? 14 : 20, Math.PI * (1 + k * 0.3))), mat: glossy(pick(tint, "onionRed"), 0.3, 0.6) }],
  }),
  dice: D({
    place: "pile", count: [30, 18], h: 0.12, tilt: 3, lift: 0.05, gap: 0.08,
    build: (m, tint) => [{ geos: [0, 1].map((k) => bump(new RoundedBoxGeometry(0.075, 0.07, 0.075, 1, 0.015), 0.006, 30, k)), mat: glossy(pick(tint, "carrot"), 0.4, 0.5) }],
  }),
  pea: D({
    place: "pile", count: [30, 18], h: 0.12, tilt: 3, lift: 0.05, gap: 0.08,
    build: (m, tint) => [{ geos: [bump(new THREE.SphereGeometry(0.048, 12, 9), 0.003, 40)], mat: glossy(pick(tint, "pea"), 0.3, 0.7) }],
  }),
  nut: D({
    place: "pile", count: [34, 20], h: 0.14, tilt: 3, lift: 0.05, gap: 0.08,
    build: (m, tint) => {
      const g = new THREE.CapsuleGeometry(0.045, 0.06, 4, 10).rotateZ(Math.PI / 2);
      const p = g.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const k = 1 - 0.14 * Math.cos(p.getX(i) * 40);
        p.setY(i, p.getY(i) * k);
        p.setZ(i, p.getZ(i) * k);
      }
      g.computeVertexNormals();
      return [{ geos: [g], mat: glossy(pick(tint, "peanut"), 0.3, 0.8) }];
    },
  }),
  cashew: D({
    place: "pile", count: [22, 14], h: 0.14, tilt: 3, lift: 0.05, gap: 0.12,
    build: (m, tint) => [{ geos: [new THREE.TorusGeometry(0.07, 0.036, 8, 14, Math.PI * 0.95)], mat: glossy(pick(tint, "cashew"), 0.35, 0.6) }],
  }),

  /* ---- ziravor va ko'kat ---- */
  chili: D({
    count: [10, 7], h: 0.24, tilt: 1.2, lift: 0.06, scale: [0.5, 0.65], gap: 0.12,
    build: (m, tint) => {
      const a = chili(m, 1);
      const b = chili(m, -0.6);
      return [
        { geos: [a.body, b.body], mat: glossy(pick(tint, "chiliRed"), 0.2, 1) },
        { geos: [a.green, b.green], mat: matte(P.chiliStem, 0.55) },
      ];
    },
  }),
  scallion: D({
    count: [26, 16], h: 0.1, tilt: 0.5, lift: 0.04, gap: 0.06,
    build: (m) => [{ geos: [scallionRing(m)], mat: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.2 }) }],
  }),
  sesame: D({
    count: [40, 20], h: 0.06, tilt: 0.3, lift: 0.05, scale: [1, 1], gap: 0.02,
    build: (_m, tint) => [{ geos: [sesame()], mat: matte(pick(tint, "sesame"), 0.5) }],
  }),
  herb: D({
    count: [12, 8], h: 0.1, tilt: 0.45, lift: 0.06, scale: [1, 1.6], gap: 0.1,
    build: (_m, tint) => [{ geos: [cilantro()], mat: new THREE.MeshPhysicalMaterial({ color: pick(tint, "cilantro"), side: THREE.DoubleSide, roughness: 0.45, clearcoat: 0.3 }) }],
  }),
  anise: D({
    count: [3, 2], h: 0.12, tilt: 0.3, lift: 0.05, scale: [0.5, 0.6], gap: 0.4,
    build: (m) => {
      const a = starAnise(m);
      return [
        { geos: [a.pods], mat: matte(P.anise, 0.78) },
        { geos: [a.seeds], mat: glossy(P.aniseSeed, 0.25, 0.8) },
      ];
    },
  }),
  pepper: D({
    count: [24, 14], h: 0.08, tilt: 3, lift: 0.05, gap: 0.05,
    build: (_m, tint) => [{ geos: [peppercorn()], mat: matte(pick(tint, "pepper"), 0.62) }],
  }),

  /* ---- ichimliklar ---- */
  ice: D({
    place: "volume", count: [6, 5], h: 0.3, tilt: 3, lift: 0.1, scale: [0.85, 1.1], gap: 0.22,
    build: (m) => [{
      geos: [0, 1].map((k) => bump(new RoundedBoxGeometry(0.24, 0.22, 0.24, 2, 0.035), 0.008, 12, k)),
      mat: new THREE.MeshPhysicalMaterial({
        color: P.ice, roughness: 0.12, transmission: m ? 0 : 1, thickness: 0.3, ior: 1.31, transparent: true, opacity: m ? 0.55 : 1, clearcoat: 1,
      }),
    }],
  }),
  citrus: D({
    place: "rim", count: [1, 1], h: 0.6, tilt: 0, lift: 0, scale: [1.6, 1.6],
    build: (m, tint) => {
      const rind = pick(tint, "lemon");
      const flesh = lighten(rind, 0.25);
      const g = paintBy(radialDisc(0.22, 0.04, m ? 28 : 40, [0.08, 0.1, 0.3, 0.5, 0.7, 0.84, 0.86, 0.93, 0.95]), (v) => {
        const r = Math.hypot(v.x, v.z);
        if (r > 0.205) return darken(rind, 0.12);
        if (r > 0.188 || r < 0.02) return col("vanilla");
        const a = (Math.atan2(v.z, v.x) / (Math.PI * 2)) * 10;
        return Math.abs(a - Math.round(a)) < 0.06 ? col("vanilla") : flesh;
      });
      return [{ geos: [g], mat: vcMat(0.3, 0.8) }];
    },
  }),
  berry: D({
    place: "float", count: [3, 3], h: 0.28, tilt: 0.6, lift: 0.08, scale: [1, 1.1], gap: 0.25,
    build: (m, tint) => {
      const pts: [number, number][] = [[0, -0.13], [0.05, -0.1], [0.095, -0.03], [0.105, 0.04], [0.08, 0.09], [0, 0.1]];
      const g = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), m ? 14 : 20);
      g.computeVertexNormals();
      const base = pick(tint, "strawberry");
      paintBy(g, (v) => (noise3(v.x * 90, v.y * 90, v.z * 90) > 0.72 ? col("pepperYellow") : base));
      return [
        { geos: [g], mat: vcMat(0.2, 1) },
        { geos: [cilantro().scale(1.2, 1, 1.2).translate(0, 0.1, 0)], mat: matte(P.mint, 0.5) },
      ];
    },
  }),
  straw: D({
    place: "lean", count: [1, 1], h: 0.6, tilt: 0, lift: 0, scale: [1, 1],
    build: (m, tint) => [{
      geos: [tube(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1.7, 0), new THREE.Vector3(0.05, 1.86, 0), new THREE.Vector3(0.24, 1.98, 0)]), { segments: 30, radial: 10, radius: () => 0.032 })],
      mat: glossy(pick(tint, "strawRed"), 0.3, 0.6),
    }],
  }),
  bottle: D({
    place: "beside", count: [1, 1], h: 2.3, tilt: 0, lift: 0, scale: [1, 1],
    build: (m, tint) => {
      const prof: [number, number][] = [[0, 0], [0.34, 0], [0.38, 0.04], [0.39, 1.25], [0.33, 1.5], [0.16, 1.76], [0.13, 2.05], [0.15, 2.08], [0.15, 2.14], [0, 2.14]];
      const body = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), m ? 32 : 48);
      body.computeVertexNormals();
      const base = pick(tint, "bottleClear");
      const label = paintBy(new THREE.CylinderGeometry(0.395, 0.395, 0.52, m ? 32 : 48, 1, true).translate(0, 0.72, 0), (v) =>
        v.y > 0.92 || v.y < 0.52 ? col("labelRed") : Math.abs(v.y - 0.72) < 0.03 ? col("labelGold") : col("labelCream"));
      return [
        { geos: [body], mat: new THREE.MeshPhysicalMaterial({ color: base, roughness: 0.08, transmission: m ? 0 : 0.55, thickness: 0.6, transparent: true, opacity: m ? 0.88 : 1, clearcoat: 1, ior: 1.5 }) },
        { geos: [label], mat: vcMat(0.45, 0.4, THREE.DoubleSide) },
        { geos: [new THREE.CylinderGeometry(0.16, 0.16, 0.1, 20).translate(0, 2.17, 0)], mat: new THREE.MeshStandardMaterial({ color: P.gold, roughness: 0.3, metalness: 0.85 }) },
      ];
    },
  }),
  can: D({
    place: "beside", count: [1, 1], h: 1.25, tilt: 0, lift: 0, scale: [1, 1],
    build: (m, tint) => {
      const prof: [number, number][] = [[0, 0.02], [0.28, 0], [0.33, 0.06], [0.33, 1.1], [0.27, 1.2], [0.26, 1.23], [0, 1.22]];
      const g = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), m ? 32 : 48);
      g.computeVertexNormals();
      const base = pick(tint, "can");
      paintBy(g, (v) => (v.y > 0.45 && v.y < 0.75 ? col("labelRed") : v.y > 1.12 || v.y < 0.06 ? col("glass") : base));
      return [{ geos: [g], mat: new THREE.MeshPhysicalMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.25, metalness: 0.75, clearcoat: 1 }) }];
    },
  }),
  cream: D({
    place: "float", count: [1, 1], h: 0.4, tilt: 0, lift: 0, scale: [1, 1], spread: 0,
    build: (m, tint) => {
      const pts: THREE.Vector2[] = [];
      for (let i = 0; i <= 18; i++) {
        const t = i / 18;
        pts.push(new THREE.Vector2(0.5 * Math.cos(t * Math.PI * 0.5) * (1 + 0.04 * Math.sin(t * 30)), 0.42 * Math.sin(t * Math.PI * 0.5)));
      }
      const g = new THREE.LatheGeometry(pts, m ? 28 : 44);
      const p = g.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const a = Math.atan2(p.getZ(i), p.getX(i));
        p.setY(i, p.getY(i) + Math.sin(a * 6 + p.getY(i) * 20) * 0.015);
      }
      g.computeVertexNormals();
      return [{ geos: [g], mat: new THREE.MeshPhysicalMaterial({ color: pick(tint, "vanilla"), roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color(P.white) }) }];
    },
  }),
};

export const kindDef = (k: Kind) => KINDS[k];

/* ---------------- Joylashuv ---------------- */

export type Region = {
  rx: number;
  rz: number;
  rect: boolean;
  /** (x, z) → yuza balandligi */
  surf: (x: number, z: number) => number;
  fillY: number;
  top: number;
  half: number;
  innerAt?: (y: number) => number;
};

/** Qatlam bo'laklarining matritsalari (idish koordinatasida) */
export function placeKind(def: KindDef, R: Region, n: number, seed: number, k: number): THREE.Matrix4[] {
  const r = rng(seed);
  const out: THREE.Matrix4[] = [];
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  const s = new THREE.Vector3();
  const add = (x: number, y: number, z: number, rx: number, ry: number, rz: number, sc: number) => {
    e.set(rx, ry, rz);
    q.setFromEuler(e);
    v.set(x, y, z);
    s.setScalar(sc);
    out.push(new THREE.Matrix4().compose(v, q, s));
  };
  const sc = () => def.scale[0] + r() * (def.scale[1] - def.scale[0]);
  const tilt = () => (r() - 0.5) * 2 * def.tilt;
  // har keyingi qatlam biroz balandroq (yig'iq holatda bir-biriga kirmasin)
  const layerLift = k * 0.03;
  // stakan/piyolaga xos joylashuvlar boshqa idishda — oddiy sochish
  const place = !R.innerAt && ["volume", "rim", "lean", "float"].includes(def.place) ? "scatter" : def.place;

  switch (place) {
    case "center": {
      add(0, R.surf(0, 0) + def.lift + layerLift, 0, 0, 0.35, 0, sc());
      break;
    }
    case "stack": {
      for (let i = 0; i < n; i++) add((r() - 0.5) * 0.12, R.surf(0, 0) + def.lift + i * 0.045 + layerLift, (r() - 0.5) * 0.12, tilt(), i * 0.7, tilt(), sc());
      break;
    }
    case "rows": {
      for (let i = 0; i < n; i++) {
        const z = (i / Math.max(1, n - 1) - 0.5) * R.rz * 1.5;
        add((r() - 0.5) * 0.15, R.surf(0, z) + def.lift + layerLift, z, 0, (r() - 0.5) * 0.12, r() * Math.PI, sc());
      }
      break;
    }
    case "ring": {
      if (R.rect) {
        const cols = Math.ceil(Math.sqrt(n * (R.rx / R.rz)));
        const rows = Math.ceil(n / cols);
        for (let i = 0; i < n; i++) {
          const cx = ((i % cols) + 0.5) / cols - 0.5;
          const cz = (Math.floor(i / cols) + 0.5) / rows - 0.5;
          add(cx * R.rx * 1.6, R.surf(0, 0) + def.lift + layerLift, cz * R.rz * 1.5, 0, 0, 0, sc());
        }
      } else {
        const center = n >= 7;
        const ringN = center ? n - 1 : n;
        if (center) add(0, R.surf(0, 0) + def.lift + layerLift, 0, 0, 0, 0, sc());
        for (let i = 0; i < ringN; i++) {
          const a = (i / ringN) * Math.PI * 2 + 0.3;
          const x = Math.cos(a) * R.rx * 0.6;
          const z = Math.sin(a) * R.rz * 0.6;
          add(x, R.surf(x, z) + def.lift + layerLift, z, tilt(), -a + Math.PI / 2, tilt(), sc());
        }
      }
      break;
    }
    case "volume": {
      const inner = R.innerAt ?? (() => R.rx);
      for (let i = 0; i < n; i++) {
        const y = 0.38 + ((i + r() * 0.5) / n) * (R.fillY - 0.48);
        const a = r() * Math.PI * 2;
        const d = r() * Math.max(0, inner(y) - 0.2);
        add(Math.cos(a) * d, y, Math.sin(a) * d, r() * 3, r() * 3, r() * 3, sc());
      }
      break;
    }
    case "float": {
      const inner = R.innerAt ? R.innerAt(R.fillY) : R.rx;
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2;
        const d = n === 1 ? 0 : (0.3 + r() * 0.5) * inner;
        add(Math.cos(a) * d, R.fillY + def.lift, Math.sin(a) * d, tilt(), r() * Math.PI * 2, tilt(), sc());
      }
      break;
    }
    case "rim": {
      // tilim stakan labiga kiydirilgan: markazi labdan biroz tashqarida, kameraga qaragan
      const x = (R.innerAt ? R.innerAt(R.top) : R.rx) + 0.12;
      add(x, R.top - 0.02, 0.05, Math.PI / 2 - 0.15, 0, 0.3, sc());
      break;
    }
    case "lean": {
      add(-0.14, 0.2, 0.08, 0.12, 0.4, 0.2, sc());
      break;
    }
    case "beside": {
      add(R.half + 0.62, 0, -0.25, 0, 0.5, 0, sc());
      break;
    }
    default: {
      // scatter / pile — tasodifiy, bir-biridan uzoqroq nuqtalar
      const pile = place === "pile";
      const gap = def.gap ?? 0.18;
      const pts: [number, number][] = [];
      let guard = 0;
      while (pts.length < n && guard++ < n * 60) {
        let x: number;
        let z: number;
        if (R.rect) {
          x = (r() - 0.5) * 2 * R.rx * def.spread;
          z = (r() - 0.5) * 2 * R.rz * def.spread;
        } else {
          const a = r() * Math.PI * 2;
          const d = Math.pow(r(), pile ? 0.75 : 0.5) * def.spread;
          x = Math.cos(a) * d * R.rx;
          z = Math.sin(a) * d * R.rz;
        }
        const relax = guard > n * 30 ? 0.5 : 1;
        if (pts.some(([px, pz]) => Math.hypot(px - x, pz - z) < gap * relax)) continue;
        pts.push([x, z]);
        const rr = Math.min(1, Math.hypot(x / R.rx, z / R.rz));
        const heap = pile ? (1 - rr) * 0.22 * r() : 0;
        add(x, R.surf(x, z) + def.lift + heap + layerLift, z, tilt(), r() * Math.PI * 2, tilt(), sc());
      }
    }
  }
  return out;
}

/** Qatlam nomi balandligi va qatlamning eng yuqori nuqtasi (kamera uchun) */
export function kindExtent(def: KindDef, R: Region): { label: number; top: number } {
  const place = !R.innerAt && ["volume", "rim", "lean", "float"].includes(def.place) ? "scatter" : def.place;
  switch (place) {
    case "volume":
      return { label: R.fillY * 0.6, top: R.fillY };
    case "rim":
      return { label: R.top, top: R.top + 0.25 };
    case "lean":
      return { label: R.top + 0.25, top: 2.1 };
    case "beside":
      return { label: def.h * 0.5, top: def.h };
    case "float":
      return { label: R.fillY + def.h * 0.4, top: R.fillY + def.h };
    default: {
      const base = R.surf(0, 0) + def.lift;
      return { label: base + def.h * 0.25, top: base + def.h };
    }
  }
}
