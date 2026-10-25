import { getTranslations } from "next-intl/server";
import { captionKeyOf, type Pic } from "./pics";

/**
 * Rasm matnlari (server): alt — "Photos.<kind>" (tavsif), caption — "Gallery2.cap*" (qisqa izoh).
 * Izoh kaliti hali yo'q bo'lsa (tarjima birlashtirilmagan) — alt matni ishlatiladi.
 */
export async function photoText(locale: string) {
  const [gl, ph] = await Promise.all([
    getTranslations({ locale, namespace: "Gallery2" }),
    getTranslations({ locale, namespace: "Photos" }),
  ]);
  const alt = (p: Pic | null | undefined) => (p?.kind ? ph(p.kind) : "");
  const caption = (p: Pic) => {
    const k = captionKeyOf(p);
    return k && gl.has(k) ? gl(k) : alt(p);
  };
  return { alt, caption };
}
