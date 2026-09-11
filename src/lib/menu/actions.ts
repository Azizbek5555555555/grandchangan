"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { ensureAdmin } from "../auth/guard";
import { slugify } from "../slug";
import type { SpicyLevel } from "@prisma/client";

type Localized = Record<string, string>;

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
  const data = {
    name: input.name,
    description: input.description ?? undefined,
    imageUrl: input.imageUrl ?? undefined,
    sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive ?? true,
  };
  if (input.id) {
    await prisma.menuCategory.update({ where: { id: input.id }, data });
  } else {
    await prisma.menuCategory.create({ data: { ...data, slug: await uniqueSlug("menuCategory", base) } });
  }
  revalidateMenu();
  return { ok: true };
}

export async function deleteCategory(id: string) {
  await ensureAdmin();
  const count = await prisma.menuItem.count({ where: { categoryId: id } });
  if (count > 0) return { ok: false, error: "Bu kategoriyada taomlar bor. Avval ularni ko'chiring." };
  await prisma.menuCategory.delete({ where: { id } });
  revalidateMenu();
  return { ok: true };
}

export async function saveItem(input: {
  id?: string;
  categoryId: string;
  name: Localized;
  description?: Localized;
  price: number;
  discountPrice?: number | null;
  imageUrl?: string | null;
  spicyLevel?: SpicyLevel;
  isVegetarian?: boolean;
  isHalal?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  isAvailable?: boolean;
  weightGrams?: number | null;
  sortOrder?: number;
}) {
  await ensureAdmin();
  const base = (input.name.uz || input.name.en || "taom").toString();
  const data = {
    categoryId: input.categoryId,
    name: input.name,
    description: input.description ?? undefined,
    price: input.price,
    discountPrice: input.discountPrice ?? null,
    imageUrl: input.imageUrl ?? undefined,
    spicyLevel: input.spicyLevel ?? "NONE",
    isVegetarian: input.isVegetarian ?? false,
    isHalal: input.isHalal ?? true,
    isFeatured: input.isFeatured ?? false,
    isNew: input.isNew ?? false,
    isAvailable: input.isAvailable ?? true,
    weightGrams: input.weightGrams ?? null,
    sortOrder: input.sortOrder ?? 0,
  };
  if (input.id) {
    await prisma.menuItem.update({ where: { id: input.id }, data });
  } else {
    await prisma.menuItem.create({ data: { ...data, slug: await uniqueSlug("menuItem", base) } });
  }
  revalidateMenu();
  return { ok: true };
}

export async function toggleItemAvailability(id: string, isAvailable: boolean) {
  await ensureAdmin();
  await prisma.menuItem.update({ where: { id }, data: { isAvailable } });
  revalidateMenu();
  return { ok: true };
}

export async function deleteItem(id: string) {
  await ensureAdmin();
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
