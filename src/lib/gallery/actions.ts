"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { ensureAdmin } from "../auth/guard";

export async function addImage(url: string, category?: string) {
  await ensureAdmin();
  await prisma.galleryImage.create({ data: { url, category: category || null } });
  revalidatePath("/[locale]/admin/gallery", "page");
  revalidatePath("/[locale]/gallery", "page");
  return { ok: true };
}
export async function deleteImage(id: string) {
  await ensureAdmin();
  await prisma.galleryImage.delete({ where: { id } });
  revalidatePath("/[locale]/admin/gallery", "page");
  revalidatePath("/[locale]/gallery", "page");
  return { ok: true };
}
