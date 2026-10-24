import * as THREE from "three";
import { P } from "../palette";
import { rng } from "./motion";

/* Protsedural CanvasTexture'lar — tarmoqdan hech narsa yuklanmaydi */

type Ctx = CanvasRenderingContext2D;

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2d context yo'q");
  return { c, ctx };
}

type TexOpts = { srgb?: boolean; repeat?: boolean; aniso?: number };

function toTexture(c: HTMLCanvasElement, o: TexOpts = {}) {
  const t = new THREE.CanvasTexture(c);
  if (o.srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
  if (o.repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = o.aniso ?? 8;
  t.needsUpdate = true;
  return t;
}

function rgba(hex: string, a: number) {
  const c = new THREE.Color(hex);
  return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`;
}

/** Plitka qilinadigan qiymat-shovqin (0..1) */
function valueNoise(w: number, h: number, cells: number, octaves: number, seed: number): Float32Array {
  const r = rng(seed);
  const out = new Float32Array(w * h);
  let amp = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    const g = cells * Math.pow(2, o);
    const grid = new Float32Array(g * g);
    for (let i = 0; i < grid.length; i++) grid[i] = r();
    for (let y = 0; y < h; y++) {
      const fy = (y / h) * g;
      const y0 = Math.floor(fy);
      const ty = fy - y0;
      const sy = ty * ty * (3 - 2 * ty);
      const ya = y0 % g;
      const yb = (y0 + 1) % g;
      for (let x = 0; x < w; x++) {
        const fx = (x / w) * g;
        const x0 = Math.floor(fx);
        const tx = fx - x0;
        const sx = tx * tx * (3 - 2 * tx);
        const xa = x0 % g;
        const xb = (x0 + 1) % g;
        const a = grid[ya * g + xa] + (grid[ya * g + xb] - grid[ya * g + xa]) * sx;
        const b = grid[yb * g + xa] + (grid[yb * g + xb] - grid[yb * g + xa]) * sx;
        out[y * w + x] += (a + (b - a) * sy) * amp;
      }
    }
    norm += amp;
    amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= norm;
  return out;
}

/** Kulrang shovqin — bump/roughness uchun (linear) */
export function noiseTexture(size = 256, cells = 6, octaves = 4, contrast = 1.4, seed = 7) {
  const { c, ctx } = canvas(size, size);
  const n = valueNoise(size, size, cells, octaves, seed);
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < n.length; i++) {
    const v = Math.max(0, Math.min(255, (0.5 + (n[i] - 0.5) * contrast) * 255));
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(c, { srgb: false, repeat: true });
}

/** Yumshoq dumaloq nuqta (soya, nur, uchqun) — qiymat R/G kanalida (alphaMap uchun), qora fonda */
export function softDotTexture(size = 128, falloff = 1) {
  const { c, ctx } = canvas(size, size);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgb(255,255,255)");
  g.addColorStop(0.35 * falloff, "rgb(140,140,140)");
  g.addColorStop(0.7, "rgb(30,30,30)");
  g.addColorStop(1, "rgb(0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return toTexture(c, { srgb: false, aniso: 1 });
}

/** Bug' bulutchasi — shovqinli yumshoq dog' (qiymat R kanalida) */
export function steamTexture(size = 256, seed = 3) {
  const { c, ctx } = canvas(size, size);
  const n = valueNoise(size, size, 4, 4, seed);
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x / size) * 2 - 1;
      const dy = (y / size) * 2 - 1;
      const d = Math.sqrt(dx * dx + dy * dy);
      const fall = Math.max(0, 1 - d);
      const k = fall * fall * (3 - 2 * fall);
      const v = n[y * size + x];
      const a = Math.max(0, k * (0.35 + v * 1.1) - 0.08);
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.min(255, a * 255);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(c, { srgb: false, aniso: 1 });
}

/* ---------------- Kosa naqshi ---------------- */

export type BowlTexSpec = {
  total: number; // profil umumiy yoy uzunligi
  apex: number; // labning eng yuqori nuqtasi (yoy uzunligi)
  footTop: number; // tagcha tugab devor boshlanadigan joy
  bandRadius: number; // naqsh lentasi radiusi (plitka soni uchun)
  w: number;
  h: number;
};

/** Huiwen (回纹) plitka — 10x10 birlik, chiziq qalinligi 1 */
function fretTile(ctx: Ctx, x: number, y: number, w: number, h: number) {
  const sx = w / 10;
  const sy = h / 10;
  const p = (u: number, v: number): [number, number] => [x + u * sx, y + v * sy];
  ctx.beginPath();
  const pts: [number, number][] = [
    [1.5, 9.3],
    [1.5, 2.3],
    [8.5, 2.3],
    [8.5, 7.6],
    [3.6, 7.6],
    [3.6, 4.4],
    [6.4, 4.4],
    [6.4, 5.9],
  ];
  pts.forEach(([u, v], i) => {
    const [px, py] = p(u, v);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
}

/** Spiral (bulut jingalagi) */
function spiral(ctx: Ctx, cx: number, cy: number, r: number, turns: number, dir: 1 | -1, start = 0) {
  ctx.beginPath();
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = start + dir * t * turns * Math.PI * 2;
    const rr = r * (1 - t * 0.82);
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

/** Xiangyun (祥云) bulut naqshi */
function cloud(ctx: Ctx, cx: number, cy: number, s: number, flip: boolean) {
  const f = flip ? -1 : 1;
  // oltin silueti
  ctx.fillStyle = rgba(P.goldLight, 0.55);
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.5, 0, Math.PI * 2);
  ctx.arc(cx - f * s * 0.62, cy + s * 0.18, s * 0.34, 0, Math.PI * 2);
  ctx.arc(cx + f * s * 0.6, cy + s * 0.22, s * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = P.glazeRed;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = s * 0.075;
  spiral(ctx, cx, cy, s * 0.48, 1.6, flip ? -1 : 1, Math.PI * 0.5);
  spiral(ctx, cx - f * s * 0.62, cy + s * 0.18, s * 0.32, 1.3, flip ? 1 : -1, Math.PI * 0.2);
  spiral(ctx, cx + f * s * 0.6, cy + s * 0.22, s * 0.28, 1.3, flip ? -1 : 1, Math.PI);
  // dumcha
  ctx.beginPath();
  ctx.moveTo(cx + f * s * 0.85, cy + s * 0.42);
  ctx.bezierCurveTo(cx + f * s * 1.3, cy + s * 0.55, cx + f * s * 1.6, cy + s * 0.2, cx + f * s * 2.0, cy + s * 0.32);
  ctx.stroke();
}

export function bowlTexture(spec: BowlTexSpec) {
  const { w, h, total, apex, footTop } = spec;
  const { c, ctx } = canvas(w, h);
  const Y = (s: number) => (1 - s / total) * h;

  // sir (glazur) — yengil iliq gradient
  const g = ctx.createLinearGradient(0, Y(footTop), 0, Y(apex));
  g.addColorStop(0, P.glazeWarm);
  g.addColorStop(0.35, P.glaze);
  g.addColorStop(1, P.glaze);
  ctx.fillStyle = P.glaze;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = g;
  ctx.fillRect(0, Y(apex), w, Y(footTop) - Y(apex));
  // tagcha — sirlanmagan iliqroq
  ctx.fillStyle = P.glazeWarm;
  ctx.fillRect(0, Y(footTop), w, h - Y(footTop));

  // chinni dog'chalari
  const r = rng(11);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = rgba(P.glazeSpeck, 0.08 + r() * 0.12);
    ctx.beginPath();
    ctx.arc(r() * w, r() * h, 0.4 + r() * 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  const band = (s0: number, s1: number, color: string) => {
    ctx.fillStyle = color;
    const y0 = Y(Math.max(s0, s1));
    const y1 = Y(Math.min(s0, s1));
    ctx.fillRect(0, y0, w, y1 - y0);
  };

  // qizil lab
  band(apex - 0.05, apex + 0.04, P.glazeRed);
  // ichki ingichka chiziqlar
  band(apex + 0.075, apex + 0.085, P.glazeRed);
  band(apex + 0.1, apex + 0.104, P.glazeRed);

  // huiwen lentasi (tashqi)
  const fTop = apex - 0.1;
  const fBot = apex - 0.27;
  band(fTop, fTop - 0.012, P.glazeRed);
  band(fBot + 0.012, fBot, P.glazeRed);
  const bandH = fTop - fBot - 0.04;
  const tiles = Math.max(8, Math.round((Math.PI * 2 * spec.bandRadius) / bandH));
  const tw = w / tiles;
  const y0 = Y(fTop - 0.02);
  const y1 = Y(fBot + 0.02);
  ctx.strokeStyle = P.glazeRed;
  ctx.lineWidth = Math.max(1.5, (y1 - y0) * 0.1);
  ctx.lineCap = "square";
  ctx.lineJoin = "miter";
  for (let i = 0; i < tiles; i++) fretTile(ctx, i * tw, y0, tw, y1 - y0);

  // bulutlar (pastroq)
  const cy = Y(apex - 0.5);
  const cs = Math.abs(Y(apex - 0.62) - Y(apex - 0.38)) * 0.75;
  const clouds = 7;
  for (let i = 0; i < clouds; i++) {
    const cx = (i + 0.5) * (w / clouds);
    cloud(ctx, cx, cy + (i % 2 ? cs * 0.18 : -cs * 0.12), cs, i % 2 === 1);
    // tikuv chizig'ida uzilmasin — chetdagilarni takrorlash
    if (cx < cs * 2) cloud(ctx, cx + w, cy, cs, i % 2 === 1);
    if (cx > w - cs * 2) cloud(ctx, cx - w, cy, cs, i % 2 === 1);
  }

  // tagcha ustidagi qo'sh chiziq
  band(footTop + 0.1, footTop + 0.112, P.glazeRed);
  band(footTop + 0.135, footTop + 0.155, P.glazeRed);

  return toTexture(c);
}

/* ---------------- Sho'rva yuzasi ---------------- */

export function brothTexture(size = 1024) {
  const { c, ctx } = canvas(size, size);
  const m = size / 2;
  const g = ctx.createRadialGradient(m, m, 0, m, m, m);
  g.addColorStop(0, P.brothLight);
  g.addColorStop(0.55, P.broth);
  g.addColorStop(0.9, P.brothDeep);
  g.addColorStop(1, P.brothDeep);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const r = rng(5);
  const k = size / 1024;

  // qalampir moyi dog'lari
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * m * 0.92;
    const x = m + Math.cos(a) * d;
    const y = m + Math.sin(a) * d;
    const rad = (30 + r() * 80) * k;
    const gg = ctx.createRadialGradient(x, y, 0, x, y, rad);
    gg.addColorStop(0, rgba(P.chiliOil, 0.75));
    gg.addColorStop(0.6, rgba(P.chiliOil, 0.35));
    gg.addColorStop(1, rgba(P.chiliOil, 0));
    ctx.fillStyle = gg;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // moy tomchilari
  for (let i = 0; i < 260; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * m * 0.95;
    const x = m + Math.cos(a) * d;
    const y = m + Math.sin(a) * d;
    const rad = (2 + Math.pow(r(), 2.2) * 18) * k;
    ctx.fillStyle = rgba(P.oil, 0.28);
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rgba("#ffe0a8", 0.45);
    ctx.lineWidth = Math.max(1, rad * 0.18);
    ctx.stroke();
  }
  // qalampir bo'lakchalari
  for (let i = 0; i < 140; i++) {
    const x = m + (r() - 0.5) * size * 0.9;
    const y = m + (r() - 0.5) * size * 0.9;
    const s = (3 + r() * 6) * k;
    ctx.fillStyle = r() > 0.3 ? P.chiliFlake : P.chiliOil;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + s, y + s * (r() - 0.5));
    ctx.lineTo(x + s * r(), y + s);
    ctx.closePath();
    ctx.fill();
  }
  // kunjut
  for (let i = 0; i < 40; i++) {
    const x = m + (r() - 0.5) * size * 0.85;
    const y = m + (r() - 0.5) * size * 0.85;
    ctx.fillStyle = P.sesame;
    ctx.beginPath();
    ctx.ellipse(x, y, 5 * k, 2.6 * k, r() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  return toTexture(c);
}

/* ---------------- Mol go'shti bo'lagi ---------------- */

export function beefTexture(size = 512) {
  const { c, ctx } = canvas(size, size);
  ctx.fillStyle = P.beef;
  ctx.fillRect(0, 0, size, size);
  const r = rng(21);
  // tolalar
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate(-0.35);
  for (let i = 0; i < 220; i++) {
    const y = (r() - 0.5) * size * 1.5;
    ctx.strokeStyle = r() > 0.5 ? rgba(P.beefDark, 0.12 + r() * 0.18) : rgba("#a85a3c", 0.1 + r() * 0.15);
    ctx.lineWidth = 1 + r() * 3;
    ctx.beginPath();
    ctx.moveTo(-size, y);
    for (let x = -size; x <= size; x += 40) ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 4);
    ctx.stroke();
  }
  // yog'/payli chiziqlar
  for (let i = 0; i < 3; i++) {
    const y = (r() - 0.5) * size * 0.8;
    ctx.strokeStyle = rgba(P.beefFat, 0.55);
    ctx.lineWidth = 6 + r() * 10;
    ctx.beginPath();
    ctx.moveTo(-size, y);
    for (let x = -size; x <= size; x += 30) ctx.lineTo(x, y + Math.sin(x * 0.012 + i * 2) * 18);
    ctx.stroke();
  }
  ctx.restore();
  // qovurilgan chetlar
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size * 0.56);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, rgba(P.beefDark, 0.85));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return toTexture(c);
}

/* ---------------- Bok-choy bargi (u — eni, v — uzunligi) ---------------- */

export function chokTexture(w = 256, h = 512) {
  const { c, ctx } = canvas(w, h);
  const Y = (v: number) => (1 - v) * h;
  // band (oq-yashil) → barg (yashil)
  const g = ctx.createLinearGradient(0, Y(0), 0, Y(1));
  g.addColorStop(0, P.chokStem);
  g.addColorStop(0.36, P.chokStem);
  g.addColorStop(0.46, P.chokStemDeep);
  g.addColorStop(0.55, P.chokLeaf);
  g.addColorStop(1, P.chokLeaf);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // chetlari to'qroq
  const e = ctx.createLinearGradient(0, 0, w, 0);
  e.addColorStop(0, rgba(P.chokLeafDeep, 0.55));
  e.addColorStop(0.25, rgba(P.chokLeafDeep, 0));
  e.addColorStop(0.75, rgba(P.chokLeafDeep, 0));
  e.addColorStop(1, rgba(P.chokLeafDeep, 0.55));
  ctx.fillStyle = e;
  ctx.fillRect(0, Y(1), w, Y(0.45) - Y(1));
  const r = rng(9);
  // band tolalari
  for (let i = 0; i < 40; i++) {
    const x = w * (0.15 + r() * 0.7);
    ctx.strokeStyle = rgba("#ffffff", 0.18);
    ctx.lineWidth = 1 + r() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, Y(0));
    ctx.lineTo(x + (r() - 0.5) * 8, Y(0.45));
    ctx.stroke();
  }
  // markaziy tomir va yon tomirlar
  ctx.strokeStyle = rgba(P.chokStem, 0.85);
  ctx.lineWidth = w * 0.06;
  ctx.beginPath();
  ctx.moveTo(w / 2, Y(0.4));
  ctx.lineTo(w / 2, Y(0.97));
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = rgba(P.chokStemDeep, 0.6);
  for (let i = 0; i < 9; i++) {
    const v = 0.5 + i * 0.052;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(w / 2, Y(v));
      ctx.quadraticCurveTo(w / 2 + s * w * 0.2, Y(v + 0.03), w / 2 + s * w * 0.44, Y(v + 0.08));
      ctx.stroke();
    }
  }
  return toTexture(c);
}

/* ---------------- Bambuk ---------------- */

/** Bug'latgich devori — gorizontal tola, tugunlar, rattan bog'ich */
export function bambooWallTexture(w = 1024, h = 256) {
  const { c, ctx } = canvas(w, h);
  ctx.fillStyle = P.bamboo;
  ctx.fillRect(0, 0, w, h);
  const r = rng(31);
  for (let i = 0; i < 260; i++) {
    const y = r() * h;
    ctx.strokeStyle = r() > 0.5 ? rgba(P.bambooDark, 0.08 + r() * 0.2) : rgba(P.bambooLight, 0.12 + r() * 0.25);
    ctx.lineWidth = 0.6 + r() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y + (r() - 0.5) * 3);
    ctx.stroke();
  }
  // tugunlar
  for (let i = 0; i < 9; i++) {
    const x = r() * w;
    const y = r() * h;
    ctx.fillStyle = rgba(P.bambooDark, 0.35);
    ctx.beginPath();
    ctx.ellipse(x, y, 18 + r() * 20, 2 + r() * 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // tikuv joyi (vertikal ustma-ust)
  const sx = w * 0.12;
  ctx.fillStyle = rgba(P.bambooDark, 0.4);
  ctx.fillRect(sx, 0, 3, h);
  for (let y = 10; y < h; y += 26) {
    ctx.fillStyle = P.rattan;
    ctx.fillRect(sx - 9, y, 20, 9);
    ctx.fillStyle = rgba("#000000", 0.18);
    ctx.fillRect(sx - 9, y + 7, 20, 2);
  }
  return toTexture(c, { repeat: true });
}

/** Chekka halqa (rim band) — och bambuk, chetlari to'q, rattan o'ramalar */
export function bambooBandTexture(w = 1024, h = 64) {
  const { c, ctx } = canvas(w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, P.bambooDark);
  g.addColorStop(0.18, P.bambooLight);
  g.addColorStop(0.6, P.bamboo);
  g.addColorStop(1, P.bambooDark);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const r = rng(41);
  for (let i = 0; i < 70; i++) {
    const y = r() * h;
    ctx.strokeStyle = rgba(P.bambooDark, 0.15 + r() * 0.2);
    ctx.lineWidth = 0.6 + r();
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  // rattan bog'ichlar (diagonal)
  const lashes = 6;
  for (let k = 0; k < lashes; k++) {
    const x0 = (k + 0.3) * (w / lashes);
    for (let i = 0; i < 9; i++) {
      const x = x0 + i * 5;
      ctx.strokeStyle = P.rattan;
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 10, h);
      ctx.stroke();
      ctx.strokeStyle = rgba("#000000", 0.2);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 2, 0);
      ctx.lineTo(x + 12, h);
      ctx.stroke();
    }
  }
  return toTexture(c, { repeat: true });
}

/** Qopqoq ustidagi to'qima (oddiy to'quv, yassi bambuk tasmalar) */
export function weaveTexture(size = 512, cells = 16) {
  const { c, ctx } = canvas(size, size);
  ctx.fillStyle = P.bambooGap;
  ctx.fillRect(0, 0, size, size);
  const cs = size / cells;
  const gap = cs * 0.08;
  const r = rng(51);
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      const x = i * cs;
      const y = j * cs;
      const horiz = (i + j) % 2 === 0;
      const tone = 0.9 + r() * 0.2;
      const base = new THREE.Color(P.bamboo).multiplyScalar(tone);
      const hi = new THREE.Color(P.bambooLight).multiplyScalar(tone);
      const lo = new THREE.Color(P.bambooDark).multiplyScalar(tone);
      const gr = horiz
        ? ctx.createLinearGradient(0, y, 0, y + cs)
        : ctx.createLinearGradient(x, 0, x + cs, 0);
      gr.addColorStop(0, `#${lo.getHexString()}`);
      gr.addColorStop(0.3, `#${hi.getHexString()}`);
      gr.addColorStop(0.7, `#${base.getHexString()}`);
      gr.addColorStop(1, `#${lo.getHexString()}`);
      ctx.fillStyle = gr;
      if (horiz) ctx.fillRect(x - gap * 0.5, y + gap, cs + gap, cs - gap * 2);
      else ctx.fillRect(x + gap, y - gap * 0.5, cs - gap * 2, cs + gap);
      // ustidan o'tish soyasi
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      if (horiz) {
        ctx.fillRect(x - gap * 0.5, y + gap, cs * 0.1, cs - gap * 2);
        ctx.fillRect(x + cs * 0.9 + gap * 0.5, y + gap, cs * 0.1, cs - gap * 2);
      } else {
        ctx.fillRect(x + gap, y - gap * 0.5, cs - gap * 2, cs * 0.1);
        ctx.fillRect(x + gap, y + cs * 0.9 + gap * 0.5, cs - gap * 2, cs * 0.1);
      }
    }
  }
  return toTexture(c, { repeat: true });
}

/** Ichki taglik — parallel bambuk reykalar */
export function slatsTexture(size = 512, slats = 14) {
  const { c, ctx } = canvas(size, size);
  ctx.fillStyle = P.bambooGap;
  ctx.fillRect(0, 0, size, size);
  const sw = size / slats;
  const r = rng(61);
  for (let i = 0; i < slats; i++) {
    const x = i * sw + sw * 0.1;
    const g = ctx.createLinearGradient(x, 0, x + sw * 0.8, 0);
    g.addColorStop(0, P.bambooDark);
    g.addColorStop(0.35, P.bambooLight);
    g.addColorStop(1, P.bamboo);
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, sw * 0.8, size);
    for (let k = 0; k < 8; k++) {
      ctx.strokeStyle = rgba(P.bambooDark, 0.15 + r() * 0.2);
      ctx.lineWidth = 1;
      const xx = x + r() * sw * 0.8;
      ctx.beginPath();
      ctx.moveTo(xx, 0);
      ctx.lineTo(xx, size);
      ctx.stroke();
    }
  }
  return toTexture(c, { repeat: true });
}

/* ---------------- Fonar ---------------- */

/** Fonar ipak qobig'i: rang xaritasi + ichki nur (emissive) xaritasi */
export function lanternTextures(ribs: number, w = 1024, h = 512) {
  const col = canvas(w, h);
  const emi = canvas(w, h);
  const a = col.ctx;
  const e = emi.ctx;
  const Y = (v: number) => (1 - v) * h;

  // rang: qizil ipak
  a.fillStyle = P.lanternRed;
  a.fillRect(0, 0, w, h);
  const vg = a.createLinearGradient(0, 0, 0, h);
  vg.addColorStop(0, rgba(P.lanternDeep, 0.7));
  vg.addColorStop(0.25, rgba(P.lanternDeep, 0));
  vg.addColorStop(0.75, rgba(P.lanternDeep, 0));
  vg.addColorStop(1, rgba(P.lanternDeep, 0.7));
  a.fillStyle = vg;
  a.fillRect(0, 0, w, h);

  // nur: o'rtada yorqin, uchlarda xira
  const eg = e.createLinearGradient(0, 0, 0, h);
  eg.addColorStop(0, "#1a0805");
  eg.addColorStop(0.22, "#7a3418");
  eg.addColorStop(0.5, "#ffd9b0");
  eg.addColorStop(0.78, "#7a3418");
  eg.addColorStop(1, "#1a0805");
  e.fillStyle = eg;
  e.fillRect(0, 0, w, h);

  // qovurg'alar
  const rw = w / ribs;
  for (let i = 0; i < ribs; i++) {
    const x = i * rw;
    const gr = a.createLinearGradient(x - rw * 0.5, 0, x + rw * 0.5, 0);
    gr.addColorStop(0, "rgba(0,0,0,0)");
    gr.addColorStop(0.5, rgba(P.lanternDeep, 0.55));
    gr.addColorStop(1, "rgba(0,0,0,0)");
    a.fillStyle = gr;
    a.fillRect(x - rw * 0.5, 0, rw, h);
    if (i === 0) a.fillRect(w - rw * 0.5, 0, rw, h);
    const er = e.createLinearGradient(x - rw * 0.5, 0, x + rw * 0.5, 0);
    er.addColorStop(0, "rgba(0,0,0,0)");
    er.addColorStop(0.5, "rgba(20,4,0,0.75)");
    er.addColorStop(1, "rgba(0,0,0,0)");
    e.fillStyle = er;
    e.fillRect(x - rw * 0.5, 0, rw, h);
    if (i === 0) e.fillRect(w - rw * 0.5, 0, rw, h);
  }

  // ipak tolasi
  const r = rng(71);
  for (let i = 0; i < 500; i++) {
    const y = r() * h;
    a.strokeStyle = rgba("#ff6a5a", 0.04 + r() * 0.05);
    a.lineWidth = 1;
    a.beginPath();
    a.moveTo(0, y);
    a.lineTo(w, y);
    a.stroke();
  }

  // oltin lentalar (yuqori va past)
  const goldBand = (v0: number, v1: number) => {
    a.fillStyle = P.gold;
    a.fillRect(0, Y(v1), w, Y(v0) - Y(v1));
    e.fillStyle = "#000000";
    e.fillRect(0, Y(v1), w, Y(v0) - Y(v1));
  };
  goldBand(0.13, 0.145);
  goldBand(0.165, 0.172);
  goldBand(0.855, 0.87);
  goldBand(0.828, 0.835);

  // o'rtadagi oltin medalyonlar (har 2-qovurg'a orasida bulutcha)
  const medals = Math.max(2, Math.round(ribs / 4));
  for (let i = 0; i < medals; i++) {
    const cx = (i + 0.5) * (w / medals);
    const cy = Y(0.5);
    const s = h * 0.11;
    for (const ctx of [a, e]) {
      ctx.save();
      ctx.strokeStyle = ctx === a ? P.goldLight : "rgba(0,0,0,0.85)";
      ctx.lineWidth = s * 0.09;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(cx, cy, s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = s * 0.07;
      spiral(ctx, cx - s * 0.32, cy + s * 0.05, s * 0.36, 1.2, 1, Math.PI);
      spiral(ctx, cx + s * 0.32, cy + s * 0.05, s * 0.36, 1.2, -1, 0);
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.62, cy - s * 0.35);
      ctx.quadraticCurveTo(cx, cy - s * 0.8, cx + s * 0.62, cy - s * 0.35);
      ctx.stroke();
      ctx.restore();
    }
  }

  return {
    map: toTexture(col.c, { repeat: true }),
    emissive: toTexture(emi.c, { repeat: true }),
  };
}
