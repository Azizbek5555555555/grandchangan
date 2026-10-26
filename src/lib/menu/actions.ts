"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { ensureAdmin } from "../auth/guard";
import { slugify } from "../slug";
import type { SpicyLevel } from "@prisma/client";
import { LEGACY_SAMPLE_CATEGORY, LEGACY_SAMPLE_SLUGS, SAMPLE_CATEGORIES, SAMPLE_DISHES, sampleImage } from "./sample-dishes";

type Localized = Record<string, string>;

/**
 * Xato kodlari — klient (MenuManager) ularni joriy tilda ko'rsatadi (AdminMenu.err.*).
 * "use server" faylidan faqat tip eksport qilinadi (runtime kod emas).
 */
export type MenuActionError = "CATEGORY_HAS_ITEMS" | "ITEM_IN_ORDERS" | "PRICE_NEGATIVE" | "PRICE_INVALID";
export type MenuActionResult = { ok: true } | { ok: false; error: MenuActionError };

/** Decimal(12, 2) chegarasi */
const MAX_PRICE = 9_999_999_999;

/**
 * Narx: bo'sh yoki son emas → 0 ("narx ko'rsatilmaydi" — saytda hasPrice() yashiradi),
 * manfiy yoki juda katta → xato kodi.
 */
function normalizePrice(value: unknown): number | MenuActionError {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(String(value).replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return "PRICE_NEGATIVE";
  if (n > MAX_PRICE) return "PRICE_INVALID";
  return Math.round(n * 100) / 100;
}

/**
 * Chegirma narxi faqat asosiy narx bor (> 0) va chegirma undan kichik (> 0) bo'lsa saqlanadi,
 * aks holda null. undefined (berilmagan) — tahrirda o'zgarmaydi, lekin narx 0 bo'lsa baribir tozalanadi.
 */
function normalizeDiscount(value: unknown, price: number): number | null | undefined {
  if (value === undefined) return price > 0 ? undefined : null;
  if (value === null || value === "" || price <= 0) return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0 || n >= price) return null;
  return Math.round(n * 100) / 100;
}

function revalidateMenu() {
  revalidatePath("/[locale]/admin/menu", "page");
  revalidatePath("/[locale]/menu", "page");
}

export async function saveCategory(input: {
  id?: string;
  name: Localized;
  description?: Localized;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}) {
  await ensureAdmin();
  const base = (input.name.uz || input.name.en || "kategoriya").toString();
  // Berilmagan maydonlar undefined qoladi: tahrirda o'zgarmaydi, yangi yozuvda schema default'i olinadi
  const data = {
    name: input.name,
    description: input.description,
    imageUrl: input.imageUrl,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
  };
  if (input.id) {
    await prisma.menuCategory.update({ where: { id: input.id }, data });
  } else {
    await prisma.menuCategory.create({ data: { ...data, slug: await uniqueSlug("menuCategory", base) } });
  }
  revalidateMenu();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<MenuActionResult> {
  await ensureAdmin();
  const count = await prisma.menuItem.count({ where: { categoryId: id } });
  if (count > 0) return { ok: false, error: "CATEGORY_HAS_ITEMS" };
  await prisma.menuCategory.delete({ where: { id } });
  revalidateMenu();
  return { ok: true };
}

export async function saveItem(input: {
  id?: string;
  categoryId: string;
  name: Localized;
  description?: Localized;
  /** bo'sh/null/NaN — 0 (narx ko'rsatilmaydi) */
  price?: number | string | null;
  discountPrice?: number | string | null;
  imageUrl?: string | null;
  spicyLevel?: SpicyLevel;
  isVegetarian?: boolean;
  isHalal?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  isAvailable?: boolean;
  weightGrams?: number | null;
  sortOrder?: number;
}): Promise<MenuActionResult> {
  await ensureAdmin();
  const price = normalizePrice(input.price);
  if (typeof price === "string") return { ok: false, error: price };
  const discountPrice = normalizeDiscount(input.discountPrice, price);
  const base = (input.name.uz || input.name.en || "taom").toString();
  // Berilmagan maydonlar undefined qoladi: tahrirda o'zgarmaydi (masalan yashirilgan taom
  // yashirinligicha qoladi), yangi yozuvda schema default'i olinadi. null — maydonni tozalaydi.
  const data = {
    categoryId: input.categoryId,
    name: input.name,
    description: input.description,
    price,
    discountPrice,
    imageUrl: input.imageUrl,
    spicyLevel: input.spicyLevel,
    isVegetarian: input.isVegetarian,
    isHalal: input.isHalal,
    isFeatured: input.isFeatured,
    isNew: input.isNew,
    isAvailable: input.isAvailable,
    weightGrams: input.weightGrams,
    sortOrder: input.sortOrder,
  };
  if (input.id) {
    await prisma.menuItem.update({ where: { id: input.id }, data });
  } else {
    await prisma.menuItem.create({ data: { ...data, slug: await uniqueSlug("menuItem", base) } });
  }
  revalidateMenu();
  return { ok: true };
}

export async function toggleItemAvailability(id: string, isAvailable: boolean): Promise<MenuActionResult> {
  await ensureAdmin();
  await prisma.menuItem.update({ where: { id }, data: { isAvailable } });
  revalidateMenu();
  return { ok: true };
}

export async function deleteItem(id: string): Promise<MenuActionResult> {
  await ensureAdmin();
  const used = await prisma.orderItem.count({ where: { menuItemId: id } });
  if (used > 0) return { ok: false, error: "ITEM_IN_ORDERS" };
  await prisma.menuItem.delete({ where: { id } });
  revalidateMenu();
  return { ok: true };
}

async function uniqueSlug(model: "menuCategory" | "menuItem", base: string): Promise<string> {
  let slug = slugify(base);
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists =
      model === "menuCategory"
        ? await prisma.menuCategory.findUnique({ where: { slug } })
        : await prisma.menuItem.findUnique({ where: { slug } });
    if (!exists) return slug;
    slug = `${slugify(base)}-${i++}`;
  }
}

/**
 * Clopos eksportidan tanlangan 15 ta namuna taomni qo'shish (sample-dishes.ts). Idempotent: kategoriya slug yoki
 * o'zbekcha nomi bo'yicha topiladi (yo'q bo'lsa yaratiladi), taom slug bo'yicha — bor taom qayta yaratilmaydi va
 * o'zgartirilmaydi (admin tahrirlari saqlanadi). Oldingi namuna ro'yxatidan qolgan taomlar (LEGACY_SAMPLE_SLUGS)
 * yangi taomlarga aylantiriladi, bo'sh qolgan "signature" kategoriyasi o'chiriladi. Narx qo'yilmaydi.
 */
export async function importSampleDishes(): Promise<{ ok: true; created: number; skipped: number }> {
  await ensureAdmin();
  const all = await prisma.menuCategory.findMany({ select: { id: true, slug: true, name: true, sortOrder: true } });
  const maxOrder = all.reduce((m, c) => Math.max(m, c.sortOrder), 0);
  const catId: Record<string, string> = {};
  let order = maxOrder;
  for (const c of SAMPLE_CATEGORIES) {
    const found =
      all.find((x) => x.slug === c.slug) ??
      all.find((x) => ((x.name as Localized | null)?.uz ?? "").trim().toLowerCase() === c.name.uz.toLowerCase());
    if (found) {
      catId[c.slug] = found.id;
      continue;
    }
    const created = await prisma.menuCategory.create({
      data: { slug: c.slug, name: c.name, sortOrder: ++order, isActive: true },
    });
    catId[c.slug] = created.id;
  }

  const slugs = [...SAMPLE_DISHES.map((d) => d.slug), ...LEGACY_SAMPLE_SLUGS];
  const found = new Map(
    (await prisma.menuItem.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } })).map((x) => [x.slug, x.id])
  );
  let created = 0;
  for (const [i, d] of SAMPLE_DISHES.entries()) {
    // Bor taom (admin tahrirlagan bo'lishi mumkin) o'zgarmaydi
    if (found.has(d.slug)) continue;
    const data = {
      slug: d.slug,
      categoryId: catId[d.cat],
      name: d.name,
      description: d.description,
      price: 0, // narx yo'q — saytda ko'rinmaydi
      discountPrice: null,
      imageUrl: sampleImage(d.slug),
      spicyLevel: d.spicy,
      isVegetarian: d.veg ?? false,
      isHalal: true,
      isFeatured: d.featured ?? false,
      isAvailable: true,
      sortOrder: i,
    };
    // Oldingi namuna taomi bo'lsa — shu yozuv yangisiga aylanadi (id saqlanadi)
    const legacyId = found.get(LEGACY_SAMPLE_SLUGS[i]);
    if (legacyId) await prisma.menuItem.update({ where: { id: legacyId }, data });
    else await prisma.menuItem.create({ data });
    created++;
  }
  await prisma.menuCategory.deleteMany({ where: { slug: LEGACY_SAMPLE_CATEGORY, items: { none: {} } } });
  return { ok: true, created, skipped: SAMPLE_DISHES.length - created };
}
