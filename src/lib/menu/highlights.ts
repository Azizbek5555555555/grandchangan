/**
 * Saytda ajratib ko'rsatiladigan taomlar (mijoz talabi, 2026-10-28: ishtahani ochadigan go'shtli taomlar —
 * Pekincha o'rdak, kaboblar va h.k.). Tartib muhim: birinchi 3 tasi — bosh sahifadagi "Har tarelkada" va menyudagi
 * "Oshpaz tanlovi", 6 tasi — "Mashhur taomlar" taxtasi, hammasi — menyuda "Tavsiya" belgisi.
 * Ro'yxatdagi taomlar bazada bo'lmasa (o'chirilgan) — admin'dagi TOP belgisi (isFeatured) ishlaydi.
 */
export const HIGHLIGHTS = [
  "beijing-roast-duck",
  "xinjiang-lamb-skewers",
  "sweet-sour-meatballs",
  "shuizhu-beef",
  "crispy-sweet-sour-chicken",
  "beef-brisket-chickpea-tomato",
];

/** Ajratilgan taomlar: ro'yxatdagilar (ro'yxat tartibida), ular bo'lmasa — TOP belgili taomlar (berilgan tartibda) */
export function pickHighlights<T extends { slug: string; isFeatured?: boolean | null }>(items: T[], limit = HIGHLIGHTS.length): T[] {
  const listed = HIGHLIGHTS.map((s) => items.find((i) => i.slug === s)).filter((x): x is T => !!x);
  return (listed.length ? listed : items.filter((i) => i.isFeatured)).slice(0, limit);
}
