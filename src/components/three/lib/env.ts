// Brauzer imkoniyatlari (faqat klientda chaqiriladi)

let webgl: boolean | null = null;

/** WebGL2 bormi (three r163+ faqat WebGL2). Natija keshlanadi, sinov konteksti darhol bo'shatiladi */
export function supportsWebGL(): boolean {
  if (webgl !== null) return webgl;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    webgl = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
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
