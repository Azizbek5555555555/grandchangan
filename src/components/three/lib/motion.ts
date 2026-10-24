// Animatsiya yordamchilari: easing, scroll progress, deterministik tasodif

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeOutQuart = (t: number) => 1 - Math.pow(1 - clamp01(t), 4);
export const easeInOutCubic = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOutBack = (t: number, s = 1.4) => {
  const x = clamp01(t) - 1;
  return x * x * ((s + 1) * x + s) + 1;
};

/** Hero uchun: 0 — konteyner markazi viewport markazida yoki pastroqda, 1 — konteyner yuqoridan to'liq chiqib ketdi */
export function exitProgress(el: HTMLElement): number {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  const center = r.top + r.height / 2;
  return clamp01((vh / 2 - center) / (vh / 2 + r.height / 2));
}

/**
 * Kirish progressi: 0 — konteyner tepasi viewport'ning `from` qismida (masalan 0.9 = pastda),
 * 1 — konteyner markazi viewport'ning `to` qismiga yetdi (0.5 = markaz).
 */
export function enterProgress(el: HTMLElement, from = 0.92, to = 0.5): number {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  const startTop = vh * from;
  const endTop = vh * to - r.height / 2;
  if (startTop - endTop <= 1) return r.top < endTop ? 1 : 0;
  return clamp01((startTop - r.top) / (startTop - endTop));
}

/** Deterministik tasodif (mulberry32) — har render bir xil kompozitsiya */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
