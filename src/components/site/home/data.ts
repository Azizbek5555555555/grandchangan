import { t, type Localized } from "@/lib/utils";
import type { HomeDish } from "./types";

/** Faqat haqiqiy rasm manzili (yuklangan fayl, loyihadagi /photos/ yoki tashqi URL) */
export const usable = (u?: string | null) => (u && (u.startsWith("/uploads") || u.startsWith("/photos/") || u.startsWith("http")) ? u : null);

const SPICY: Record<string, number> = { NONE: 0, MILD: 1, MEDIUM: 2, HOT: 3, EXTRA_HOT: 4 };
export const SPICY_KEYS = ["", "MILD", "MEDIUM", "HOT", "EXTRA_HOT"] as const;

/** Json maydondan aynan xitoycha qiymat (boshqa tilga qaytmaydi) */
export function zhOf(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const zh = cnShort((value as Localized).zh ?? "");
  return zh || null;
}

/** Bezak uchun xitoycha nom: qavs ichidagi porsiya/o'lcham olib tashlanadi — "北京烤鸭（整只 / 半只）" → "北京烤鸭" */
export function cnShort(s: string): string {
  return s.replace(/\s*[（(][^）)]*[）)]/g, "").trim();
}

/** Zaxira belgi: kategoriya xitoycha nomining birinchi ieroglifi (面, 点, 汤 …), bo'lmasa 菜 */
export function glyphOf(catName: unknown): string {
  const zh = zhOf(catName);
  const ch = zh ? Array.from(zh).find((c) => /\p{Script=Han}/u.test(c)) : undefined;
  return ch ?? "菜";
}

type DbDish = {
  id: string;
  slug: string;
  name: unknown;
  description: unknown;
  price: unknown;
  discountPrice: unknown;
  imageUrl: string | null;
  spicyLevel: string;
  isVegetarian: boolean;
  isHalal: boolean;
  weightGrams: number | null;
  prepTimeMin: number | null;
  categoryId: string;
  category: { name: unknown };
};

/** Bazadagi taom -> bosh sahifa kartasi ma'lumoti */
export function toDish(it: DbDish, locale: string): HomeDish {
  const price = Number(it.price);
  const disc = it.discountPrice != null ? Number(it.discountPrice) : null;
  const hasDisc = disc != null && disc > 0 && disc < price;
  return {
    id: it.id,
    slug: it.slug,
    name: t(it.name, locale),
    zh: locale === "zh" ? null : zhOf(it.name),
    desc: t(it.description, locale),
    price: hasDisc ? (disc as number) : price,
    oldPrice: hasDisc ? price : null,
    img: usable(it.imageUrl),
    spicy: SPICY[it.spicyLevel] ?? 0,
    veg: it.isVegetarian,
    halal: it.isHalal,
    grams: it.weightGrams,
    mins: it.prepTimeMin,
    catId: it.categoryId,
    catName: t(it.category.name, locale),
    glyph: glyphOf(it.category.name),
  };
}

/** Prisma select — toDish uchun kerakli maydonlar */
export const DISH_SELECT = {
  id: true,
  slug: true,
  name: true,
  description: true,
  price: true,
  discountPrice: true,
  imageUrl: true,
  spicyLevel: true,
  isVegetarian: true,
  isHalal: true,
  weightGrams: true,
  prepTimeMin: true,
  categoryId: true,
  category: { select: { name: true } },
} as const;

/**
 * Hero sarlavhasini 2–3 qatorga bo'lish (banner sarlavhasi uchun).
 * "GrandChangan" -> ["Grand", "Changan"]; ko'p so'zli matn — teng qatorlarga; xitoycha — ikkiga.
 */
export function splitHeadline(text: string): string[] {
  const s = text.trim();
  if (!s) return [];
  const words = s.split(/\s+/);
  if (words.length === 1) {
    if (/\p{Script=Han}/u.test(s)) {
      const chars = Array.from(s);
      if (chars.length < 4) return [s];
      const mid = Math.ceil(chars.length / 2);
      return [chars.slice(0, mid).join(""), chars.slice(mid).join("")];
    }
    const camel = s.split(/(?<=[a-zа-я])(?=[A-ZА-Я])/);
    return camel.length > 1 && camel.length <= 3 ? camel : [s];
  }
  if (words.length === 2) return words;
  // 3+ so'z: 3 qatorga yaqin teng taqsimlash (belgilar soni bo'yicha)
  const lines = Math.min(3, words.length);
  const target = s.length / lines;
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && next.length > target * 1.15 && out.length < lines - 1) {
      out.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) out.push(cur);
  return out;
}
