"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { ensureAdmin } from "../auth/guard";
import type { BannerPosition } from "@prisma/client";

type Localized = Record<string, string>;

export async function saveBanner(input: {
  id?: string; title?: Localized; subtitle?: Localized; imageUrl: string;
  linkUrl?: string; position?: BannerPosition; sortOrder?: number; isActive?: boolean;
}) {
  await ensureAdmin();
  const data = {
    title: input.title ?? undefined, subtitle: input.subtitle ?? undefined,
    imageUrl: input.imageUrl, linkUrl: input.linkUrl || null,
    position: input.position ?? "HERO", sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive ?? true,
  };
  if (input.id) await prisma.banner.update({ where: { id: input.id }, data });
  else await prisma.banner.create({ data });
  revalidatePath("/[locale]/admin/banners", "page");
  revalidatePath("/[locale]", "page");
  return { ok: true };
}

export async function toggleBanner(id: string, isActive: boolean) {
  await ensureAdmin();
  await prisma.banner.update({ where: { id }, data: { isActive } });
  revalidatePath("/[locale]/admin/banners", "page");
  revalidatePath("/[locale]", "page");
  return { ok: true };
}

export async function deleteBanner(id: string) {
  await ensureAdmin();
  await prisma.banner.delete({ where: { id } });
  revalidatePath("/[locale]/admin/banners", "page");
  revalidatePath("/[locale]", "page");
  return { ok: true };
}
