// Brauzer imkoniyatlari (faqat klientda chaqiriladi)

let webgl: boolean | null = null;

/**
 * WebGL2 haqiqatda ishlaydimi (three r163+ faqat WebGL2). Natija keshlanadi (sessiyada bir marta).
 * Faqat API borligini tekshirish yetmaydi: GPU o'chirilgan qurilmada Canvas ushlanmaydigan xato otardi.
 * Sinov konteksti majburan yo'q qilinmaydi (loseContext sinxron — sekin qurilmalarda sahifani soniyalab qotiradi),
 * 1×1 canvas bilan birga GC'da bo'shaydi.
 */
export function supportsWebGL(): boolean {
  if (webgl !== null) return webgl;
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    webgl = !!c.getContext("webgl2");
  } catch {
    webgl = false;
  }
  return webgl;
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function isMobileViewport(): boolean {
  return window.innerWidth < 768;
}
