import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export { mergeGeometries };

/* ---------------- Profil (LatheGeometry uchun) ---------------- */

/** Siniq chiziqni yoy uzunligi bo'yicha teng `count` nuqtaga qayta taqsimlaydi (v-UV teng bo'ladi) */
export function resample(pts: THREE.Vector2[], count: number) {
  const acc: number[] = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const total = acc[acc.length - 1];
  const out: THREE.Vector2[] = [];
  let k = 1;
  for (let i = 0; i < count; i++) {
    const s = (i / (count - 1)) * total;
    while (k < acc.length - 1 && acc[k] < s) k++;
    const s0 = acc[k - 1];
    const s1 = acc[k];
    const f = s1 - s0 > 1e-9 ? (s - s0) / (s1 - s0) : 0;
    out.push(new THREE.Vector2().lerpVectors(pts[k - 1], pts[k], f));
  }
  return { points: out, acc, total };
}

/** Silliq egri chiziqdan zich nuqtalar (Vector2 CatmullRom) */
export function splinePoints(ctrl: [number, number][], n: number): THREE.Vector2[] {
  const curve = new THREE.SplineCurve(ctrl.map(([x, y]) => new THREE.Vector2(x, y)));
  return curve.getPoints(n);
}

/** Yoy (aylana bo'lagi) nuqtalari */
export function arcPoints(cx: number, cy: number, r: number, a0: number, a1: number, n: number): THREE.Vector2[] {
  const out: THREE.Vector2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push(new THREE.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
  }
  return out;
}

/** Lathe tikuvidagi (u=0 va u=1) normallarni o'rtachalash — deformatsiyadan keyin chiziq ko'rinmasin */
export function fixLatheSeam(geo: THREE.BufferGeometry, segments: number, profileCount: number) {
  const n = geo.getAttribute("normal") as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let j = 0; j < profileCount; j++) {
    const a = j;
    const b = segments * profileCount + j;
    v.set(n.getX(a) + n.getX(b), n.getY(a) + n.getY(b), n.getZ(a) + n.getZ(b)).normalize();
    n.setXYZ(a, v.x, v.y, v.z);
    n.setXYZ(b, v.x, v.y, v.z);
  }
  n.needsUpdate = true;
}

/* ---------------- Naycha (lag'mon, qalampir, popuk) ---------------- */

export type TubeOptions = {
  segments: number;
  radial: number;
  /** t (0..1) bo'yicha radius */
  radius: (t: number) => number;
  /** halqa bo'yicha radial deformatsiya: (t, burchak) => ko'paytuvchi */
  shape?: (t: number, angle: number) => number;
  /** qo'shimcha har-cho'qqi atributlari */
  attrs?: { name: string; size: number; fn: (t: number, p: THREE.Vector3) => number[] }[];
};

/** O'zgaruvchan radiusli naycha (uchlari yopiq bo'lishi uchun radius → 0) */
export function tube(curve: THREE.Curve<THREE.Vector3>, o: TubeOptions): THREE.BufferGeometry {
  const { segments, radial } = o;
  const frames = curve.computeFrenetFrames(segments, false);
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const extra: number[][] = (o.attrs ?? []).map(() => []);
  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    curve.getPointAt(t, P);
    const r = o.radius(t);
    const fn = frames.normals[i];
    const fb = frames.binormals[i];
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const s = Math.sin(a);
      const c = -Math.cos(a);
      N.set(c * fn.x + s * fb.x, c * fn.y + s * fb.y, c * fn.z + s * fb.z);
      const rr = r * (o.shape ? o.shape(t, a) : 1);
      pos.push(P.x + rr * N.x, P.y + rr * N.y, P.z + rr * N.z);
      nor.push(N.x, N.y, N.z);
      uv.push(t, j / radial);
      o.attrs?.forEach((at, k) => extra[k].push(...at.fn(t, P)));
    }
  }
  const idx: number[] = [];
  for (let i = 1; i <= segments; i++) {
    for (let j = 1; j <= radial; j++) {
      const a = (radial + 1) * (i - 1) + (j - 1);
      const b = (radial + 1) * i + (j - 1);
      const c = (radial + 1) * i + j;
      const d = (radial + 1) * (i - 1) + j;
      idx.push(a, b, d, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  o.attrs?.forEach((at, k) => g.setAttribute(at.name, new THREE.Float32BufferAttribute(extra[k], at.size)));
  g.setIndex(idx);
  return g;
}

/** Uchlari yumaloq naycha radiusi (uchlarida 0 ga) */
export function roundedRadius(r: number, cap = 0.04) {
  return (t: number) => {
    const e = Math.min(t, 1 - t);
    return e >= cap ? r : r * Math.sqrt(Math.max(0, 1 - Math.pow(1 - e / cap, 2)));
  };
}

/** Geometriyaga bir xil rang atributi (merge uchun vertex color) */
export function paint(geo: THREE.BufferGeometry, color: THREE.ColorRepresentation, jitter = 0, rand?: () => number) {
  const c = new THREE.Color(color);
  const n = geo.getAttribute("position").count;
  const arr = new Float32Array(n * 3);
  const k = jitter && rand ? 1 + (rand() - 0.5) * jitter : 1;
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r * k;
    arr[i * 3 + 1] = c.g * k;
    arr[i * 3 + 2] = c.b * k;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return geo;
}

/** Oddiy 3D qiymat-shovqin (deformatsiya uchun) */
export function noise3(x: number, y: number, z: number): number {
  return (
    Math.sin(x * 1.7 + Math.sin(y * 2.3 + z * 1.1)) * 0.5 +
    Math.sin(y * 2.9 + Math.sin(z * 1.9 + x * 0.7)) * 0.3 +
    Math.sin(z * 3.7 + Math.sin(x * 2.1 + y * 1.3)) * 0.2
  );
}
