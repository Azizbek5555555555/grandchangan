/**
 * Restoran aloqa ma'lumotlarining zaxira qiymatlari (Aziz, 2026-10-25). Asosiy manba — admin → Sozlamalar
 * (siteSetting "general".phones, workingHour); bazada bo'lmasa shu qiymatlar ko'rsatiladi.
 */
export const DEFAULT_PHONE = "+998 77 507 06 43";

/** siteSetting "general" qiymatidan telefonlar ro'yxati (bo'sh bo'lsa — zaxira raqam) */
export function phonesOf(general: Record<string, unknown> | null | undefined): string[] {
  const list = Array.isArray(general?.phones) ? (general.phones as unknown[]).map((p) => String(p ?? "").trim()).filter(Boolean) : [];
  return list.length ? list : [DEFAULT_PHONE];
}

/** Asosiy telefon */
export function phoneOf(general: Record<string, unknown> | null | undefined): string {
  return phonesOf(general)[0];
}
