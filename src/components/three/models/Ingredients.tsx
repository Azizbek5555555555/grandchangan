"use client";

import * as THREE from "three";
import { useDisposable } from "../lib/dispose";
import { mergeGeometries, noise3, roundedRadius, tube } from "../lib/geometry";
import { rng } from "../lib/motion";
import { beefTexture, chokTexture, noiseTexture } from "../lib/textures";
import { P } from "../palette";

/* Masalliqlar geometriyasi va materiallari (qalampir, yulduz-anis, ko'k piyoz halqasi, kunjut,
   Sichuan qalampiri, bok-choy bargi, kashnich, mol go'shti bo'lagi). Hammasi protsedural. */

/* ---------- Qalampir: o'zgaruvchan radiusli egilgan naycha + yashil kosacha va band ---------- */
export function chili(mobile: boolean, bend = 1) {
  const R = 0.085;
  const curve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.05 * bend, -0.18, 0.02),
      new THREE.Vector3(0.1 * bend, -0.42, 0.03),
      new THREE.Vector3(0.07 * bend, -0.66, 0.02),
      new THREE.Vector3(-0.03 * bend, -0.85, 0),
    ],
    false,
    "centripetal",
  );
  const body = tube(curve, {
    segments: mobile ? 28 : 40,
    radial: mobile ? 10 : 14,
    radius: (t) => {
      const shoulder = 0.72 + 0.28 * Math.sin(Math.min(1, t / 0.12) * Math.PI * 0.5);
      return R * shoulder * Math.pow(1 - t, 0.7);
    },
    shape: (t, a) => 1 + 0.06 * Math.sin(a * 3 + t * 5) * Math.min(1, t * 3),
  });
  // kosacha (calyx) — yassilangan qalpoq, chetlari to'lqinli
  const calyx = new THREE.SphereGeometry(R * 0.95, 16, 6, 0, Math.PI * 2, 0, Math.PI * 0.62);
  const cp = calyx.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < cp.count; i++) {
    const x = cp.getX(i);
    const z = cp.getZ(i);
    const a = Math.atan2(z, x);
    const y = cp.getY(i);
    cp.setY(i, y * 0.5 - 0.012 + (y < R * 0.3 ? Math.sin(a * 5) * 0.012 : 0));
  }
  calyx.computeVertexNormals();
  const stem = tube(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.02, 0),
      new THREE.Vector3(0, 0.1, 0),
      new THREE.Vector3(0.03, 0.17, 0.01),
      new THREE.Vector3(0.08, 0.2, 0.02),
    ]),
    { segments: 10, radial: 6, radius: roundedRadius(0.017, 0.08) },
  );
  const green = mergeGeometries([calyx, stem]);
  calyx.dispose();
  stem.dispose();
  return { body, green };
}

/* ---------- Yulduz-anis: 8 ta qayiqsimon meva bargi + urug'lar ---------- */
export function starAnise(mobile: boolean) {
  const L = 0.42;
  const pods: THREE.BufferGeometry[] = [];
  const seeds: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 8; k++) {
    const g = new THREE.SphereGeometry(1, mobile ? 12 : 18, mobile ? 8 : 10);
    const p = g.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      const u = (x + 1) / 2; // 0 — markaz, 1 — uchi
      const pinch = 1 - Math.pow(Math.max(0, (u - 0.55) / 0.45), 1.6) * 0.75;
      let yy = y * 0.15 * pinch;
      const zz = z * 0.12 * pinch * (0.75 + 0.25 * Math.sin(u * Math.PI));
      // ustidagi chok (ochilgan joy)
      if (y > 0.55 && u > 0.2 && u < 0.85) yy -= (y - 0.55) * 0.12;
      yy += Math.pow(u, 3) * 0.06 + noise3(x * 4 + k, y * 4, z * 4) * 0.008;
      p.setXYZ(i, 0.04 + u * L, yy, zz);
    }
    g.computeVertexNormals();
    g.rotateY((k / 8) * Math.PI * 2);
    pods.push(g);
    const s = new THREE.SphereGeometry(1, 10, 6);
    s.scale(0.065, 0.04, 0.04);
    s.translate(0.04 + L * 0.5, 0.1, 0);
    s.rotateY((k / 8) * Math.PI * 2);
    seeds.push(s);
  }
  const hub = new THREE.SphereGeometry(0.075, 12, 8);
  hub.scale(1, 0.75, 1);
  pods.push(hub);
  const podGeo = mergeGeometries(pods);
  const seedGeo = mergeGeometries(seeds);
  [...pods, ...seeds].forEach((g) => g.dispose());
  return { pods: podGeo, seeds: seedGeo };
}

/* ---------- Ko'k piyoz halqasi: kesimli lathe halqa, ichi och, tashqi to'q yashil ---------- */
export function scallionRing(mobile: boolean) {
  const ri = 0.075;
  const ro = 0.093;
  const h = 0.045;
  const c = 0.004;
  const pts = [
    new THREE.Vector2(ri + c, -h / 2),
    new THREE.Vector2(ro - c, -h / 2),
    new THREE.Vector2(ro, -h / 2 + c),
    new THREE.Vector2(ro, h / 2 - c),
    new THREE.Vector2(ro - c, h / 2),
    new THREE.Vector2(ri + c, h / 2),
    new THREE.Vector2(ri, h / 2 - c),
    new THREE.Vector2(ri, -h / 2 + c),
    new THREE.Vector2(ri + c, -h / 2),
  ];
  const g = new THREE.LatheGeometry(pts, mobile ? 14 : 22);
  const p = g.getAttribute("position") as THREE.BufferAttribute;
  const col = new Float32Array(p.count * 3);
  const a = new THREE.Color(P.scallionLight);
  const b = new THREE.Color(P.scallion);
  const tmp = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const r = Math.hypot(p.getX(i), p.getZ(i));
    const f = THREE.MathUtils.smoothstep((r - ri) / (ro - ri), 0.45, 0.95);
    tmp.copy(a).lerp(b, f);
    col.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

/* ---------- Kunjut urug'i ---------- */
export function sesame() {
  const g = new THREE.SphereGeometry(1, 8, 6);
  const p = g.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const k = x > 0 ? 1 - x * 0.45 : 1;
    p.setXYZ(i, x * 0.03, p.getY(i) * 0.009 * k, p.getZ(i) * 0.018 * k);
  }
  g.computeVertexNormals();
  return g;
}

/* ---------- Sichuan qalampiri — g'adir-budur sharcha ---------- */
export function peppercorn() {
  const g = new THREE.SphereGeometry(0.042, 12, 9);
  const p = g.getAttribute("position") as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = noise3(v.x * 90, v.y * 90, v.z * 90);
    const split = Math.abs(v.x) < 0.006 && v.y > 0 ? 0.82 : 1;
    v.multiplyScalar((1 + n * 0.12) * split);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/* ---------- Bok-choy bargi: parametrik to'r (u — eni, v — uzunligi), kosachasimon, chetlari burmali ---------- */
export function chokLeaf(nu: number, nv: number, L = 1) {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= nv; j++) {
    const v = j / nv;
    const stalk = (0.075 + 0.045 * v) * (1 - THREE.MathUtils.smoothstep(v, 0.75, 1));
    const blade = 0.34 * Math.pow(Math.sin(Math.PI * THREE.MathUtils.clamp((v - 0.32) / 0.68, 0, 1)), 0.85);
    const w = stalk + blade;
    for (let i = 0; i <= nu; i++) {
      const u = (i / nu) * 2 - 1;
      const isBlade = THREE.MathUtils.smoothstep(v, 0.35, 0.55);
      const cup = -(0.07 - 0.03 * isBlade) * (1 - u * u);
      const ruffle = 0.03 * Math.sin(v * 30 + u * 2) * Math.pow(Math.abs(u), 2.5) * isBlade;
      const curl = 0.16 * v * v;
      pos.push(u * w, v * L, cup + ruffle + curl);
      uv.push(u * 0.5 + 0.5, v);
    }
  }
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i;
      const b = a + nu + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* ---------- Kashnich bargi: uch bo'lakli yelpig'ich ---------- */
export function cilantro() {
  const M = 42;
  const pos: number[] = [0, 0.012, 0];
  const idx: number[] = [];
  for (let m = 0; m <= M; m++) {
    const a = (m / M) * Math.PI * 2;
    const r = 0.075 * (0.7 + 0.3 * Math.abs(Math.cos(1.5 * a))) * (1 + 0.09 * Math.cos(9 * a));
    pos.push(Math.cos(a) * r, -Math.pow(r / 0.075, 2) * 0.012, Math.sin(a) * r);
    if (m > 0) idx.push(0, m + 1, m);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* ---------- Mol go'shti bo'lagi: noto'g'ri ellips plastinka (ichki to'r bilan — egish mumkin) ---------- */
export function beefSlice(seed: number, mobile: boolean) {
  const r = rng(seed);
  const K = mobile ? 4 : 6;
  const M = mobile ? 20 : 30;
  const rx = 0.34;
  const rz = 0.21;
  const th = 0.026;
  const wob = Array.from({ length: 5 }, () => [r() * 0.07, r() * Math.PI * 2] as const);
  const boundary = (a: number) => {
    let k = 1;
    wob.forEach(([amp, ph], i) => (k += amp * Math.sin(a * (i + 2) + ph)));
    return [Math.cos(a) * rx * k, Math.sin(a) * rz * k] as const;
  };
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const push = (x: number, y: number, z: number) => {
    pos.push(x, y, z);
    uv.push(x / (rx * 2.4) + 0.5, z / (rx * 2.4) + 0.5);
    return pos.length / 3 - 1;
  };
  const layer = (y: number, flip: boolean) => {
    const c = push(0, y, 0);
    const rings: number[][] = [];
    for (let k = 1; k <= K; k++) {
      const row: number[] = [];
      for (let m = 0; m < M; m++) {
        const [bx, bz] = boundary((m / M) * Math.PI * 2);
        const f = k / K;
        row.push(push(bx * f, y, bz * f));
      }
      rings.push(row);
    }
    const tri = (a: number, b: number, d: number) => (flip ? idx.push(a, d, b) : idx.push(a, b, d));
    for (let m = 0; m < M; m++) tri(c, rings[0][(m + 1) % M], rings[0][m]);
    for (let k = 1; k < K; k++) {
      for (let m = 0; m < M; m++) {
        const a = rings[k - 1][m];
        const b = rings[k - 1][(m + 1) % M];
        const cc = rings[k][m];
        const d = rings[k][(m + 1) % M];
        tri(a, b, cc);
        tri(b, d, cc);
      }
    }
    return rings[K - 1];
  };
  const top = layer(th / 2, false);
  const bot = layer(-th / 2, true);
  for (let m = 0; m < M; m++) {
    const a = top[m];
    const b = top[(m + 1) % M];
    const c = bot[m];
    const d = bot[(m + 1) % M];
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  // tepalikka yotishi uchun egish
  const p = g.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / rx;
    const z = p.getZ(i) / rz;
    p.setY(i, p.getY(i) - 0.07 * x * x - 0.03 * z * z + 0.012 * Math.sin(x * 5 + seed));
  }
  g.computeVertexNormals();
  return g;
}

/** Barcha masalliq geometriyalari + materiallari (bitta joyda, unmount'da bo'shatiladi) */
export function useFoodKit(mobile: boolean) {
  return useDisposable(() => buildFoodKit(mobile), [mobile]);
}

/** Faqat kerak bo'lsa quriladi (qatlamli sahnada — lag'mon kosasi qatlamlari bo'lsagina) */
export function useOptionalFoodKit(enabled: boolean, mobile: boolean) {
  return useDisposable(() => (enabled ? buildFoodKit(mobile) : null), [enabled, mobile]);
}

function buildFoodKit(mobile: boolean) {
  const chiliA = chili(mobile, 1);
  const chiliB = chili(mobile, -0.6);
  const anise = starAnise(mobile);
  const aniseBump = noiseTexture(128, 8, 3, 1.6, 23);
  const chokMap = chokTexture(mobile ? 128 : 256, mobile ? 256 : 512);
  const beefMap = beefTexture(mobile ? 256 : 512);
  const geo = {
    chiliA: chiliA.body,
    chiliAGreen: chiliA.green,
    chiliB: chiliB.body,
    chiliBGreen: chiliB.green,
    anise: anise.pods,
    aniseSeeds: anise.seeds,
    ring: scallionRing(mobile),
    sesame: sesame(),
    pepper: peppercorn(),
    leaf: chokLeaf(mobile ? 8 : 12, mobile ? 18 : 26),
    cilantro: cilantro(),
    beef: [0, 1, 2, 3].map((i) => beefSlice(31 + i * 7, mobile)),
  };
  const glossy = (color: string) =>
    new THREE.MeshPhysicalMaterial({ color, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06 });
  const mat = {
    chiliRed: glossy(P.chiliRed),
    chiliDeep: glossy(P.chiliDeep),
    chiliOrange: glossy(P.chiliOrange),
    stem: new THREE.MeshStandardMaterial({ color: P.chiliStem, roughness: 0.55 }),
    anise: new THREE.MeshStandardMaterial({ color: P.anise, roughness: 0.78, bumpMap: aniseBump, bumpScale: 3 }),
    aniseSeed: new THREE.MeshPhysicalMaterial({ color: P.aniseSeed, roughness: 0.25, clearcoat: 0.8 }),
    ring: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.2 }),
    sesame: new THREE.MeshStandardMaterial({ color: P.sesame, roughness: 0.5 }),
    pepper: new THREE.MeshStandardMaterial({ color: P.pepper, roughness: 0.62 }),
    leaf: new THREE.MeshPhysicalMaterial({
      map: chokMap,
      side: THREE.DoubleSide,
      roughness: 0.42,
      clearcoat: 0.4,
      clearcoatRoughness: 0.25,
    }),
    cilantro: new THREE.MeshPhysicalMaterial({
      color: P.cilantro,
      side: THREE.DoubleSide,
      roughness: 0.45,
      clearcoat: 0.3,
    }),
    beef: new THREE.MeshPhysicalMaterial({ map: beefMap, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.3 }),
  };
  return { geo, mat, tex: { aniseBump, chokMap, beefMap } };
}

export type FoodKit = ReturnType<typeof buildFoodKit>;
