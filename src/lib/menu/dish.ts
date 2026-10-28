import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Taom sahifasi (/menu/[slug]) uchun ma'lumot. Har so'rovda bazadan (sahifa dinamik — build paytida baza yo'q).
 * cache — generateMetadata va sahifa bitta so'rovda bazaga ikki marta bormasin.
 */

export const getDish = cache(async (slug: string) => {
  const item = await prisma.menuItem.findUnique({ where: { slug }, include: { category: true } });
  // Admin kategoriyani o'chirsa — menyudagi kabi taom sahifasi ham yashiriladi
  if (!item || !item.isAvailable || !item.category.isActive) return null;
  return item;
});

/** Menyudagi barcha mavjud taomlar (qisqa) — kategoriya, keyin taom tartibida (oldingi/keyingi va o'xshash taomlar uchun) */
export const getMenuOrder = cache(async () => {
  const rows = await prisma.menuItem.findMany({
    where: { isAvailable: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true, slug: true, name: true, description: true, imageUrl: true, categoryId: true, price: true, discountPrice: true,
      spicyLevel: true, isVegetarian: true, isHalal: true, isNew: true, isFeatured: true, weightGrams: true, prepTimeMin: true,
      category: { select: { sortOrder: true, isActive: true, name: true } },
    },
  });
  return rows
    .filter((r) => r.category.isActive)
    // barqaror tartib: kategoriya tartibi (teng bo'lsa — kategoriya id), ichida taom tartibi (so'rovdagi kabi)
    .sort((a, b) => a.category.sortOrder - b.category.sortOrder || (a.categoryId < b.categoryId ? -1 : a.categoryId > b.categoryId ? 1 : 0));
});

export type MenuOrderItem = Awaited<ReturnType<typeof getMenuOrder>>[number];

/** URL'dagi slug (kodlangan bo'lishi mumkin) → toza slug */
export function cleanSlug(raw: string) {
  try {
    return decodeURIComponent(raw).trim().toLowerCase();
  } catch {
    return raw.trim().toLowerCase();
  }
}
