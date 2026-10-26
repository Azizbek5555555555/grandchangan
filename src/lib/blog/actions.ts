"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { ensureAdmin } from "../auth/guard";
import { slugify } from "../slug";
import { SAMPLE_POSTS } from "./sample-posts";
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

/**
 * Test postlar o'rniga restoran haqidagi 3 ta postni qo'yish (sample-posts.ts): boshqa postlar o'chiriladi,
 * restoran postlari e'lon qilingan holda yaratiladi. Uchala post allaqachon bo'lsa — hech narsa qilmaydi
 * (keyin yozilgan haqiqiy postlar tasodifan o'chib ketmasin; admin'da tugma ham ko'rinmaydi).
 */
export async function importRestaurantPosts(): Promise<{ ok: true; removed: number; created: number }> {
  await ensureAdmin();
  const slugs = SAMPLE_POSTS.map((p) => p.slug);
  const existing = new Set((await prisma.blogPost.findMany({ where: { slug: { in: slugs } }, select: { slug: true } })).map((x) => x.slug));
  if (existing.size === slugs.length) return { ok: true, removed: 0, created: 0 };
  const { count: removed } = await prisma.blogPost.deleteMany({ where: { slug: { notIn: slugs } } });
  let created = 0;
  const now = Date.now();
  for (const [i, p] of SAMPLE_POSTS.entries()) {
    if (existing.has(p.slug)) continue;
    await prisma.blogPost.create({
      data: {
        slug: p.slug, title: p.title, excerpt: p.excerpt, content: p.content, coverImage: p.cover, tags: p.tags,
        status: "PUBLISHED", publishedAt: new Date(now - i * 60_000), // ro'yxatda shu tartibda chiqsin
      },
    });
    created++;
  }
  revalidatePath("/[locale]/admin/blog", "page");
  revalidatePath("/[locale]/blog", "page");
  revalidatePath("/[locale]/blog/[slug]", "page");
  return { ok: true, removed, created };
}
