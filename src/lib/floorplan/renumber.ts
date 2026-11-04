import type { Prisma, PrismaClient } from "@prisma/client";

/**
 * Bazadagi stol raqamlarini yangi raqamlashga o'tkazish (2026-11-04, Aziz): xitoy an'anasida 4 ishlatilmaydi,
 * VIP xonalar raqami qayta qo'yildi. Raqam JOYIDA almashtiriladi (stol id'si o'zgarmaydi) — shu sababli
 * bronlar o'sha jismoniy stolda qoladi. Kalit — eski raqam, qiymat — yangi raqam.
 */
export const RENUMBER: Record<string, string> = {
  "VIP-1": "VIP-3", "VIP-3": "VIP-1", "VIP-4": "VIP-5", "VIP-5": "VIP-6",
  "Z-4": "Z-5", "Z-5": "Z-6", "Z-6": "Z-7", "Z-7": "Z-8", "Z-8": "Z-9", "Z-9": "Z-10", "Z-10": "Z-11", "Z-11": "Z-12",
  "K-4": "K-5", "K-5": "K-6",
};

/** Faqat eski raqamlashda bor kodlar (yangisida 4 yo'q) */
const OLD_ONLY = ["VIP-4", "Z-4", "K-4"];
/** Bajarilganlik belgisi (SiteSetting) — bir marta o'tkazilgach, keyin qo'lda qo'shilgan "Z-4" ga tegilmaydi */
const MARK = "floor.renumber.no-four";

const norm = (s: string) => s.trim().toUpperCase();

/**
 * Bir martalik va idempotent (belgi SiteSetting'da). Faqat FAOL stollar ko'chiriladi; yangi raqam o'sha zalda
 * xaritada yo'q boshqa stolda (masalan, eski sxemadan qolgan nofaol "K-6") band bo'lsa — u "K-6~xxxxxx" deb
 * chetga olinadi. Ikki bosqichda (vaqtinchalik nom → yangi nom), chunki VIP-1 ↔ VIP-3 almashadi va
 * (zoneId, number) unikal. Qaytaradi: nomi o'zgargan stollar soni (0 — kerak emas edi).
 */
export async function renumberTables(tx: Prisma.TransactionClient): Promise<number> {
  if (await tx.siteSetting.findUnique({ where: { key: MARK }, select: { id: true } })) return 0;
  const all = await tx.table.findMany({ select: { id: true, zoneId: true, number: true, isActive: true } });
  const active = all.filter((t) => t.isActive);
  const done = () => tx.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
  // Eski raqamlash yo'q (yangi baza yoki allaqachon yangi raqamlar) — faqat belgi qo'yiladi
  if (!active.some((t) => OLD_ONLY.includes(norm(t.number)))) {
    if (all.length) await done();
    return 0;
  }

  const moves = active.filter((t) => RENUMBER[norm(t.number)]).map((t) => ({ id: t.id, to: RENUMBER[norm(t.number)], zoneId: t.zoneId }));
  const moving = new Set(moves.map((m) => m.id));
  const aside = all.filter((t) => !moving.has(t.id) && moves.some((m) => m.zoneId === t.zoneId && m.to === norm(t.number)));

  for (const t of aside) await tx.table.update({ where: { id: t.id }, data: { number: `${t.number}~${t.id.slice(-6)}` } });
  for (const m of moves) await tx.table.update({ where: { id: m.id }, data: { number: `~${m.id}` } });
  for (const m of moves) await tx.table.update({ where: { id: m.id }, data: { number: m.to } });
  await done();
  return moves.length + aside.length;
}

/** Server ishga tushganda (instrumentation) — o'z tranzaksiyasida, xarita sinxronlashi bilan bir qulf ostida */
export async function renumberTablesOnce(db: PrismaClient): Promise<number> {
  return db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('floor-sync'))`;
      return renumberTables(tx);
    },
    { maxWait: 10_000, timeout: 30_000 }
  );
}
