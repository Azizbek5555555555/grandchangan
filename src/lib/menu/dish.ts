import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Taom sahifasi (/menu/[slug]) uchun ma'lumot. Har so'rovda bazadan (sahifa dinamik — build paytida baza yo'q).
 * cache — generateMetadata va sahifa bitta so'rovda bazaga ikki marta bormasin.
 */

export const getDish = cache(async (slug: string) => {
  const item = await prisma.menuItem.findUnique({ where: { slug }, include: { category: true } });
  if (!item || !item.isAvailable) return null;
  return item;
});

/** Menyudagi barcha mavjud taomlar (qisqa) — kategoriya, keyin taom tartibida (oldingi/keyingi va o'xshash taomlar uchun) */
export const getMenuOrder = cache(async () => {
  const rows = await prisma.menuItem.findMany({
    where: { isAvailable: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true, slug: true, name: true, description: true, imageUrl: true, categoryId: true, price: true, discountPrice: true,
      spicyLevel: true, isVegetarian: true, isHalal: true, isNew: true, isFeatured: true, weightGrams: true, prepTimeMin: true,
      category: { select: { sortOrder: true, isActive: true, name: true } },
    },
  });
  return rows
    .filter((r) => r.category.isActive)
    .sort((a, b) => a.category.sortOrder - b.category.sortOrder);
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
