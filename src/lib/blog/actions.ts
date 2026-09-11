"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { ensureAdmin } from "../auth/guard";
import { slugify } from "../slug";
import type { PostStatus } from "@prisma/client";

type Localized = Record<string, string>;

export async function savePost(input: {
  id?: string; title: Localized; excerpt?: Localized; content: Localized;
  coverImage?: string | null; status?: PostStatus;
}) {
  await ensureAdmin();
  const base = (input.title.uz || input.title.en || "post").toString();
  const data = {
    title: input.title, excerpt: input.excerpt ?? undefined, content: input.content,
    coverImage: input.coverImage ?? null, status: input.status ?? "DRAFT",
    publishedAt: input.status === "PUBLISHED" ? new Date() : null,
  };
  if (input.id) {
    await prisma.blogPost.update({ where: { id: input.id }, data });
  } else {
    let slug = slugify(base); let i = 1;
    while (await prisma.blogPost.findUnique({ where: { slug } })) slug = `${slugify(base)}-${i++}`;
    await prisma.blogPost.create({ data: { ...data, slug } });
  }
  revalidatePath("/[locale]/admin/blog", "page");
  revalidatePath("/[locale]/blog", "page");
  return { ok: true };
}
export async function togglePublish(id: string, publish: boolean) {
  await ensureAdmin();
  await prisma.blogPost.update({ where: { id }, data: { status: publish ? "PUBLISHED" : "DRAFT", publishedAt: publish ? new Date() : null } });
  revalidatePath("/[locale]/admin/blog", "page");
  revalidatePath("/[locale]/blog", "page");
  return { ok: true };
}
export async function deletePost(id: string) {
  await ensureAdmin();
  await prisma.blogPost.delete({ where: { id } });
  revalidatePath("/[locale]/admin/blog", "page");
  revalidatePath("/[locale]/blog", "page");
  return { ok: true };
}
