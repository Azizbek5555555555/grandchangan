// Brauzer imkoniyatlari (faqat klientda chaqiriladi)

let webgl: boolean | null = null;

/**
 * WebGL2 API bormi (three r163+ faqat WebGL2). Sinov konteksti ochilmaydi — u sekin qurilmalarda birinchi
 * 3D'ni sezilarli kechiktirardi; GPU haqiqatda ishlamasa Canvas xatosi Lazy3D'dagi SceneBoundary'da ushlanadi.
 */
export function supportsWebGL(): boolean {
  if (webgl !== null) return webgl;
  webgl = typeof window !== "undefined" && typeof window.WebGL2RenderingContext !== "undefined";
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
