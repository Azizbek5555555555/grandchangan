/**
 * Bir martalik ko'chirish: lokal public/uploads dagi rasmlarni Supabase Storage'ga yuklab,
 * bazadagi "/uploads/..." havolalarini Supabase URL'iga almashtiradi.
 *
 * Rasmlar faylda — ya'ni ular qaysi kompyuterdan admin orqali yuklangan bo'lsa, o'sha yerda
 * ishga tushiring. .env da DATABASE_URL, SUPABASE_URL, SUPABASE_SECRET_KEY bo'lishi kerak.
 *
 *   npm run uploads:migrate            -> faqat ko'rsatadi (hech narsa o'zgarmaydi)
 *   npm run uploads:migrate -- --apply -> haqiqatan yuklaydi va bazani yangilaydi
 */
import { readFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { isStorageConfigured, sniffImageType, uploadToStorage } from "../src/lib/storage/supabase";

try { process.loadEnvFile(".env"); } catch { /* .env bo'lmasa — muhit o'zgaruvchilaridan */ }

const APPLY = process.argv.includes("--apply");
const prisma = new PrismaClient();
const isLocal = (u: string | null | undefined): u is string => !!u && u.startsWith("/uploads/");

const cache = new Map<string, string | null>(); // lokal url -> supabase url (null = topilmadi)
const missing = new Set<string>();

async function migrateUrl(u: string): Promise<string | null> {
  if (cache.has(u)) return cache.get(u)!;
  const file = path.join(process.cwd(), "public", u);
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await readFile(file));
  } catch {
    missing.add(u);
    cache.set(u, null);
    return null;
  }
  const type = sniffImageType(bytes) || "application/octet-stream";
  const target = `migrated/${path.basename(u)}`;
  const url = APPLY ? await uploadToStorage(target, bytes, type, { upsert: true }) : `(supabase)/${target}`;
  cache.set(u, url);
  return url;
}

async function mapList(list: string[]): Promise<string[] | null> {
  if (!list.some(isLocal)) return null;
  const out: string[] = [];
  for (const u of list) out.push(isLocal(u) ? (await migrateUrl(u)) ?? u : u);
  return out;
}

type Row = Record<string, unknown> & { id: string };
async function single(label: string, rows: Row[], fields: string[], update: (id: string, data: Record<string, string>) => Promise<unknown>) {
  let n = 0;
  for (const r of rows) {
    const data: Record<string, string> = {};
    for (const f of fields) {
      const v = r[f] as string | null;
      if (isLocal(v)) {
        const nu = await migrateUrl(v);
        if (nu) data[f] = nu;
      }
    }
    if (Object.keys(data).length) {
      n++;
      if (APPLY) await update(r.id, data);
    }
  }
  console.log(`  ${label}: ${n} ta yozuv`);
}

async function main() {
  if (APPLY && !isStorageConfigured()) {
    console.error("✖ .env da SUPABASE_URL va SUPABASE_SECRET_KEY yo'q");
    process.exitCode = 1;
    return;
  }
  console.log(APPLY ? "▶ Ko'chirish (bazaga yoziladi)..." : "▶ Sinov rejimi (hech narsa o'zgarmaydi). Bajarish uchun: --apply");

  await single("Taomlar (rasm)", await prisma.menuItem.findMany({ select: { id: true, imageUrl: true } }), ["imageUrl"],
    (id, data) => prisma.menuItem.update({ where: { id }, data }));
  await single("Kategoriyalar", await prisma.menuCategory.findMany({ select: { id: true, imageUrl: true, iconUrl: true } }), ["imageUrl", "iconUrl"],
    (id, data) => prisma.menuCategory.update({ where: { id }, data }));
  await single("Zallar", await prisma.zone.findMany({ select: { id: true, imageUrl: true, mapBgUrl: true } }), ["imageUrl", "mapBgUrl"],
    (id, data) => prisma.zone.update({ where: { id }, data }));
  await single("Bannerlar", await prisma.banner.findMany({ select: { id: true, imageUrl: true, mobileImageUrl: true } }), ["imageUrl", "mobileImageUrl"],
    (id, data) => prisma.banner.update({ where: { id }, data }));
  await single("Blog", await prisma.blogPost.findMany({ select: { id: true, coverImage: true } }), ["coverImage"],
    (id, data) => prisma.blogPost.update({ where: { id }, data }));
  await single("Galereya", await prisma.galleryImage.findMany({ select: { id: true, url: true } }), ["url"],
    (id, data) => prisma.galleryImage.update({ where: { id }, data }));
  await single("Foydalanuvchi avatar", await prisma.user.findMany({ select: { id: true, avatarUrl: true } }), ["avatarUrl"],
    (id, data) => prisma.user.update({ where: { id }, data }));

  let lists = 0;
  for (const it of await prisma.menuItem.findMany({ select: { id: true, gallery: true } })) {
    const g = await mapList(it.gallery);
    if (g) { lists++; if (APPLY) await prisma.menuItem.update({ where: { id: it.id }, data: { gallery: g } }); }
  }
  for (const rv of await prisma.review.findMany({ select: { id: true, images: true } })) {
    const g = await mapList(rv.images);
    if (g) { lists++; if (APPLY) await prisma.review.update({ where: { id: rv.id }, data: { images: g } }); }
  }
  console.log(`  Taom galereyasi / sharh rasmlari: ${lists} ta yozuv`);

  const found = [...cache.values()].filter(Boolean).length;
  console.log(`\n${APPLY ? "✔ Yuklandi" : "Yuklanadi"}: ${found} ta fayl`);
  if (missing.size) {
    console.log(`⚠ Kompyuterda topilmadi (${missing.size} ta) — bu rasmlarni admin paneldan qayta yuklang:`);
    for (const m of missing) console.log("   " + m);
  }
}

main()
  // process.exit() emas: Windows'da Prisma/fetch yopilayotganda "UV_HANDLE_CLOSING" bilan yiqiladi
  .catch((e) => { console.error(e instanceof Error ? e.message : e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
