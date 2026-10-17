"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { Prisma, type InventoryCategory, type InventoryLossReason, type User } from "@prisma/client";
import { prisma } from "../prisma";
import { ensureSection } from "../auth/guard";
import { MANAGEMENT } from "../auth/permissions";
import { rateLimit, HOUR } from "../security/rate-limit";
import { STARTER_ITEMS } from "./starter";
import { INVENTORY_CATEGORIES, INVENTORY_LIMITS as L, LOSS_REASONS, type InvResult } from "./types";

/**
 * Inventar server action'lari.
 *   MANAGER/ADMIN/SUPERADMIN — buyumlar, kirim, inventarizatsiya, yo'qotish (hammasi)
 *   WAITER/KITCHEN           — faqat reportLoss (mas'ul — o'zi)
 * Barcha xatolar { ok: false, error } ko'rinishida, matn "Inventory" namespace'idan.
 * Son va harakat (movement) doim bitta tranzaksiyada yoziladi — hisob buzilmasligi uchun.
 */

type Tr = (key: string, values?: Record<string, string | number>) => string;
type Tx = Prisma.TransactionClient;
type Ctx = { user: User; t: Tr; isManager: boolean };

/** Kutilgan xato: tranzaksiya ichidan otiladi (rollback), keyin tarjima qilingan matnga aylanadi */
class InvError extends Error {
  constructor(public key: string, public values?: Record<string, string | number>) {
    super(key);
  }
}

// ---------- yordamchilar ----------

/** Ruxsat: bo'limga kirish + (manage bo'lsa) faqat boshqaruv rollari */
async function access(manage: boolean): Promise<Ctx | { error: string }> {
  const t: Tr = await getTranslations("Inventory");
  let user: User;
  try {
    user = await ensureSection("inventory");
  } catch {
    return { error: t("errForbidden") };
  }
  const isManager = MANAGEMENT.includes(user.role);
  if (manage && !isManager) return { error: t("errForbidden") };
  return { user, t, isManager };
}

function revalidateInventory() {
  revalidatePath("/[locale]/admin/inventory", "page");
  revalidatePath("/[locale]/admin/dashboard", "page");
}

/** Amalni bajarish: kutilgan xatolarni matnga aylantirish, kutilmaganini log qilish */
async function run<T extends object>(t: Tr, fn: () => Promise<T>): Promise<InvResult<T>> {
  try {
    const result = await fn();
    revalidateInventory();
    return { ...result, ok: true as const };
  } catch (e) {
    if (e instanceof InvError) return { ok: false, error: t(e.key, e.values) };
    console.error("[inventory]", e);
    return { ok: false, error: t("errGeneric") };
  }
}

const fail = (error: string) => ({ ok: false as const, error });

function isInt(v: unknown, min: number, max: number): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
}

function isId(v: unknown): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= 64;
}

/** Nom: bo'shliqlar tozalanadi, 1..80 belgi; noto'g'ri bo'lsa null */
function cleanName(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/\s+/g, " ");
  return s.length >= 1 && s.length <= L.nameMax ? s : null;
}

function cleanNote(v: unknown): string | null {
  if (typeof v !== "string") return null;
  return v.trim().slice(0, L.noteMax) || null;
}

/** Narx: bo'sh -> null (narxsiz), noto'g'ri -> undefined, aks holda 2 xonagacha yaxlitlangan son */
function cleanPrice(v: unknown): number | null | undefined {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > L.maxPrice) return undefined;
  return Math.round(v * 100) / 100;
}

/** Buyum qatorlarini tranzaksiya oxirigacha qulflash (id tartibida — deadlock bo'lmasligi uchun) */
async function lockItems(tx: Tx, ids: string[]) {
  const sorted = [...new Set(ids)].sort();
  if (!sorted.length) return;
  await tx.$queryRaw`SELECT id FROM "InventoryItem" WHERE id IN (${Prisma.join(sorted)}) ORDER BY id FOR UPDATE`;
}

/** Inventarizatsiya qatorini qulflab, holatini qaytaradi (yo'q bo'lsa null) */
async function lockCount(tx: Tx, countId: string): Promise<string | null> {
  const rows = await tx.$queryRaw<{ status: string }[]>`
    SELECT status::text AS status FROM "InventoryCount" WHERE id = ${countId} FOR UPDATE`;
  return rows[0]?.status ?? null;
}

/** Bir vaqtda ikkita bir xil amal (ikki marta bosish) bo'lmasligi uchun tranzaksiya qulfi */
async function advisoryLock(tx: Tx, key: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
}

/** Ochiq inventarizatsiyaga keyin qo'shilgan faol buyumlar uchun qator qo'shish */
async function syncDraftLines(tx: Tx, countId?: string) {
  const draftId =
    countId ?? (await tx.inventoryCount.findFirst({ where: { status: "DRAFT" }, select: { id: true } }))?.id;
  if (!draftId) return;
  const missing = await tx.inventoryItem.findMany({
    where: { isActive: true, countLines: { none: { countId: draftId } } },
    select: { id: true, quantity: true },
  });
  if (missing.length) {
    await tx.inventoryCountLine.createMany({
      data: missing.map((i) => ({ countId: draftId, itemId: i.id, expected: i.quantity })),
      skipDuplicates: true,
    });
  }
}

type CountLineInput = { itemId: string; counted: number | null };

/** Sanalgan sonlarni tekshirish; noto'g'ri bo'lsa null */
function cleanCountLines(lines: unknown): CountLineInput[] | null {
  if (!Array.isArray(lines) || lines.length > 5000) return null;
  const byItem = new Map<string, number | null>();
  for (const l of lines as Partial<CountLineInput>[]) {
    if (!l || !isId(l.itemId)) return null;
    const counted = l.counted ?? null;
    if (counted !== null && !isInt(counted, 0, L.maxQty)) return null;
    byItem.set(l.itemId, counted);
  }
  return [...byItem].map(([itemId, counted]) => ({ itemId, counted }));
}

/** Yakunlash oynasida foydalanuvchi ko'rgan qator: kutilgan (hisobdagi) son va sanalgan son */
type SeenLineInput = { itemId: string; expected: number; counted: number | null };

/** Klient ko'rgan holatni tekshirish; noto'g'ri bo'lsa null */
function cleanSeenLines(lines: unknown): Map<string, SeenLineInput> | null {
  if (!Array.isArray(lines) || lines.length > 5000) return null;
  const byItem = new Map<string, SeenLineInput>();
  for (const l of lines as Partial<SeenLineInput>[]) {
    if (!l || !isId(l.itemId) || !isInt(l.expected, 0, L.maxQty)) return null;
    const counted = l.counted ?? null;
    if (counted !== null && !isInt(counted, 0, L.maxQty)) return null;
    byItem.set(l.itemId, { itemId: l.itemId, expected: l.expected, counted });
  }
  return byItem;
}

/** Sanalgan sonlarni yozish: bir xil qiymatlilar bitta so'rovda */
async function applyCountLines(tx: Tx, countId: string, lines: CountLineInput[]) {
  const groups = new Map<number | null, string[]>();
  for (const l of lines) groups.set(l.counted, [...(groups.get(l.counted) ?? []), l.itemId]);
  for (const [counted, itemIds] of groups) {
    await tx.inventoryCountLine.updateMany({ where: { countId, itemId: { in: itemIds } }, data: { counted } });
  }
}

// ---------- BUYUMLAR ----------

/**
 * Buyum qo'shish yoki tahrirlash.
 * Yangi: quantity > 0 bo'lsa CORRECTION harakati ("Boshlang'ich son") yoziladi.
 * Tahrir: quantity berilib, hozirgisidan farq qilsa — qo'lda tuzatish (CORRECTION, delta bilan).
 */
export async function saveInventoryItem(input: {
  id?: string;
  name: string;
  category: InventoryCategory;
  perSeat: number;
  perTable: number;
  minReserve: number;
  unitPrice: number | null;
  quantity?: number;
}): Promise<InvResult<{ id: string }>> {
  const ctx = await access(true);
  if ("error" in ctx) return fail(ctx.error);
  const { t, user } = ctx;

  const name = cleanName(input?.name);
  if (!name) return fail(t("errName"));
  if (!(INVENTORY_CATEGORIES as readonly string[]).includes(input.category)) return fail(t("errCategory"));
  const { perSeat, perTable, minReserve } = input;
  if (![perSeat, perTable, minReserve].every((n) => isInt(n, 0, L.maxQty))) return fail(t("errNumber"));
  const quantity = input.quantity ?? null;
  if (quantity !== null && !isInt(quantity, 0, L.maxQty)) return fail(t("errNumber"));
  const unitPrice = cleanPrice(input.unitPrice);
  if (unitPrice === undefined) return fail(t("errPrice"));
  if (input.id !== undefined && !isId(input.id)) return fail(t("errNotFound"));

  const data = { name, category: input.category, perSeat, perTable, minReserve, unitPrice };

  return run(t, async () => {
    const id = input.id;
    if (!id) {
      const newId = await prisma.$transaction(async (tx) => {
        const qty = quantity ?? 0;
        // Guruh oxiriga qo'yiladi
        const last = await tx.inventoryItem.aggregate({ _max: { sortOrder: true }, where: { category: input.category } });
        const item = await tx.inventoryItem.create({
          data: { ...data, quantity: qty, sortOrder: (last._max.sortOrder ?? 0) + 10 },
        });
        if (qty > 0) {
          await tx.inventoryMovement.create({
            data: {
              itemId: item.id, type: "CORRECTION", delta: qty, quantityAfter: qty,
              note: "Boshlang'ich son", unitPrice, createdById: user.id,
            },
          });
        }
        await syncDraftLines(tx);
        return item.id;
      });
      return { id: newId };
    }

    await prisma.$transaction(async (tx) => {
      await lockItems(tx, [id]);
      // Arxivdagi buyum tahrirlanmaydi (UI'da ko'rinmaydi, to'g'ridan-to'g'ri chaqiruv ham rad etiladi)
      const cur = await tx.inventoryItem.findFirst({ where: { id, isActive: true }, select: { quantity: true } });
      if (!cur) throw new InvError("errNotFound");
      const changeQty = quantity !== null && quantity !== cur.quantity;
      await tx.inventoryItem.update({ where: { id }, data: { ...data, ...(changeQty ? { quantity } : {}) } });
      if (changeQty) {
        await tx.inventoryMovement.create({
          data: {
            itemId: id, type: "CORRECTION", delta: quantity - cur.quantity, quantityAfter: quantity,
            unitPrice, createdById: user.id,
          },
        });
      }
    });
    return { id };
  });
}

/**
 * Buyumni o'chirish: tarixi (harakat yoki inventarizatsiya qatori) bo'lmasa — butunlay,
 * aks holda arxivlanadi (isActive=false), tarix va hisobotlar saqlanadi.
 */
export async function deleteInventoryItem(id: string): Promise<InvResult<{ archived: boolean }>> {
  const ctx = await access(true);
  if ("error" in ctx) return fail(ctx.error);
  const { t } = ctx;
  if (!isId(id)) return fail(t("errNotFound"));

  return run(t, async () => {
    const archived = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id }, select: { id: true } });
      if (!item) throw new InvError("errNotFound");
      // Ochiq inventarizatsiyadagi qatori tarix emas — olib tashlanadi
      await tx.inventoryCountLine.deleteMany({ where: { itemId: id, count: { status: "DRAFT" } } });
      const moves = await tx.inventoryMovement.count({ where: { itemId: id } });
      const lines = await tx.inventoryCountLine.count({ where: { itemId: id } });
      if (moves === 0 && lines === 0) {
        await tx.inventoryItem.delete({ where: { id } });
        return false;
      }
      await tx.inventoryItem.update({ where: { id }, data: { isActive: false } });
      return true;
    });
    return { archived };
  });
}

/** Tayyor ro'yxatni (~20 buyum, 0 dona) qo'shish — faqat bazada umuman buyum bo'lmasa */
export async function addStarterInventory(): Promise<InvResult<{ created: number }>> {
  const ctx = await access(true);
  if ("error" in ctx) return fail(ctx.error);
  const { t } = ctx;

  return run(t, async () => {
    const created = await prisma.$transaction(async (tx) => {
      await advisoryLock(tx, "inventory-starter");
      if ((await tx.inventoryItem.count()) > 0) throw new InvError("errStarterExists");
      const r = await tx.inventoryItem.createMany({ data: STARTER_ITEMS.map((s) => ({ ...s, quantity: 0 })) });
      await syncDraftLines(tx);
      return r.count;
    });
    return { created };
  });
}

// ---------- KIRIM / YO'QOTISH ----------

/** Kirim (sotib olindi): son oshadi, PURCHASE harakati. Narx berilsa buyum narxi ham yangilanadi. */
export async function recordPurchase(input: {
  itemId: string;
  quantity: number;
  unitPrice?: number | null;
  note?: string;
}): Promise<InvResult<{ quantity: number }>> {
  const ctx = await access(true);
  if ("error" in ctx) return fail(ctx.error);
  const { t, user } = ctx;

  if (!isId(input?.itemId)) return fail(t("errNotFound"));
  if (!isInt(input.quantity, 1, L.maxMove)) return fail(t("errQuantity"));
  const price = cleanPrice(input.unitPrice);
  if (price === undefined) return fail(t("errPrice"));
  const note = cleanNote(input.note);
  const qty = input.quantity;

  return run(t, async () => {
    const quantity = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findFirst({
        where: { id: input.itemId, isActive: true },
        select: { id: true, unitPrice: true },
      });
      if (!item) throw new InvError("errNotFound");
      const updated = await tx.inventoryItem.update({
        where: { id: item.id },
        data: { quantity: { increment: qty }, ...(price !== null ? { unitPrice: price } : {}) },
        select: { quantity: true },
      });
      if (updated.quantity > L.maxQty) throw new InvError("errMaxStock", { max: L.maxQty });
      await tx.inventoryMovement.create({
        data: {
          itemId: item.id, type: "PURCHASE", delta: qty, quantityAfter: updated.quantity,
          note, unitPrice: price ?? item.unitPrice, createdById: user.id,
        },
      });
      return updated.quantity;
    });
    return { quantity };
  });
}

/**
 * Sindi / yo'qoldi xabari. Boshqaruv mas'ulni tanlay oladi (ixtiyoriy);
 * WAITER/KITCHEN uchun mas'ul doim o'zi. Son manfiy bo'lib qolmaydi.
 */
export async function reportLoss(input: {
  itemId: string;
  quantity: number;
  reason: InventoryLossReason;
  note?: string;
  responsibleId?: string | null;
}): Promise<InvResult<{ quantity: number }>> {
  const ctx = await access(false);
  if ("error" in ctx) return fail(ctx.error);
  const { t, user, isManager } = ctx;

  if (!isId(input?.itemId)) return fail(t("errNotFound"));
  if (!isInt(input.quantity, 1, L.maxMove)) return fail(t("errQuantity"));
  if (!(LOSS_REASONS as readonly string[]).includes(input.reason)) return fail(t("errReason"));
  const note = cleanNote(input.note);
  const qty = input.quantity;

  let responsibleId: string | null = null;
  if (!isManager) {
    responsibleId = user.id;
  } else if (input.responsibleId) {
    if (!isId(input.responsibleId)) return fail(t("errResponsible"));
    const r = await prisma.user.findUnique({
      where: { id: input.responsibleId },
      select: { role: true, isBlocked: true },
    });
    // Mas'ul — faqat faol (bloklanmagan) xodim: tanlash ro'yxatidagi bilan bir xil shart
    if (!r || r.role === "CUSTOMER" || r.isBlocked) return fail(t("errResponsible"));
    responsibleId = input.responsibleId;
  }

  if (!rateLimit(`inv-loss:${user.id}`, 60, HOUR)) return fail(t("errTooMany"));

  return run(t, async () => {
    const quantity = await prisma.$transaction(async (tx) => {
      // Shartli kamaytirish: parallel xabarlar ham sonni manfiy qila olmaydi
      const res = await tx.inventoryItem.updateMany({
        where: { id: input.itemId, isActive: true, quantity: { gte: qty } },
        data: { quantity: { decrement: qty } },
      });
      if (res.count === 0) {
        const cur = await tx.inventoryItem.findFirst({
          where: { id: input.itemId, isActive: true },
          select: { quantity: true },
        });
        if (!cur) throw new InvError("errNotFound");
        throw new InvError("errNotEnough", { current: cur.quantity });
      }
      const item = await tx.inventoryItem.findUniqueOrThrow({
        where: { id: input.itemId },
        select: { quantity: true, unitPrice: true },
      });
      await tx.inventoryMovement.create({
        data: {
          itemId: input.itemId, type: "LOSS", delta: -qty, quantityAfter: item.quantity,
          reason: input.reason, note, unitPrice: item.unitPrice,
          createdById: user.id, responsibleId,
        },
      });
      return item.quantity;
    });
    return { quantity };
  });
}

// ---------- INVENTARIZATSIYA (sanash) ----------

/** Sanashni boshlash: ochiq (DRAFT) bo'lsa o'shani qaytaradi, aks holda har bir faol buyumga qator bilan yangisi */
export async function startInventoryCount(): Promise<InvResult<{ id: string; reused: boolean }>> {
  const ctx = await access(true);
  if ("error" in ctx) return fail(ctx.error);
  const { t, user } = ctx;

  return run(t, async () =>
    prisma.$transaction(async (tx) => {
      await advisoryLock(tx, "inventory-count");
      const draft = await tx.inventoryCount.findFirst({ where: { status: "DRAFT" }, select: { id: true } });
      if (draft) {
        await syncDraftLines(tx, draft.id);
        return { id: draft.id, reused: true };
      }
      const items = await tx.inventoryItem.findMany({ where: { isActive: true }, select: { id: true, quantity: true } });
      if (!items.length) throw new InvError("errNoItems");
      const count = await tx.inventoryCount.create({
        data: {
          createdById: user.id,
          lines: { createMany: { data: items.map((i) => ({ itemId: i.id, expected: i.quantity })) } },
        },
        select: { id: true },
      });
      return { id: count.id, reused: false };
    })
  );
}

/** Sanalgan sonlarni saqlash (faqat DRAFT). counted: null — hali sanalmagan. */
export async function saveInventoryCount(
  countId: string,
  lines: { itemId: string; counted: number | null }[]
): Promise<InvResult> {
  const ctx = await access(true);
  if ("error" in ctx) return fail(ctx.error);
  const { t } = ctx;
  if (!isId(countId)) return fail(t("errCountNotFound"));
  const clean = cleanCountLines(lines);
  if (!clean) return fail(t("errCounted"));

  return run(t, async () => {
    await prisma.$transaction(async (tx) => {
      const status = await lockCount(tx, countId);
      if (!status) throw new InvError("errCountNotFound");
      if (status !== "DRAFT") throw new InvError("errCountClosed");
      await applyCountLines(tx, countId, clean);
    });
    return {};
  });
}

/**
 * Inventarizatsiyani yakunlash (faqat DRAFT). lines berilsa — avval ular saqlanadi
 * (faqat o'zgargan qatorlar yuboriladi, boshqa qurilmadan saqlanganlar ustidan yozilmaydi).
 * Sanalgan har bir qator uchun: "kutilgan" = buyumning HOZIRGI soni (yakunlash payti),
 * farq bo'lsa buyum soni sanalganiga tenglanadi va COUNT_ADJUST harakati yoziladi.
 *
 * seen — tasdiqlash oynasida foydalanuvchi ko'rgan holat (har bir qator: kutilgan va sanalgan son).
 * Sahifa ochilgandan keyin hisob o'zgargan bo'lsa (kirim, yo'qotish yoki boshqa qurilmadan sanash),
 * yakunlash rad etiladi (errCountStale) — foydalanuvchi yangilangan farqlarni ko'rib, qayta tasdiqlaydi.
 * Shunda ko'rsatilgan farq va qo'llanadigan farq doim bir xil bo'ladi.
 */
export async function completeInventoryCount(
  countId: string,
  lines?: { itemId: string; counted: number | null }[],
  seen?: { itemId: string; expected: number; counted: number | null }[]
): Promise<InvResult<{ adjusted: number; shortagePieces: number; shortageSum: number; surplusPieces: number }>> {
  const ctx = await access(true);
  if ("error" in ctx) return fail(ctx.error);
  const { t, user } = ctx;
  if (!isId(countId)) return fail(t("errCountNotFound"));
  const clean = lines === undefined ? [] : cleanCountLines(lines);
  if (!clean) return fail(t("errCounted"));
  const seenById = seen === undefined ? null : cleanSeenLines(seen);
  if (seen !== undefined && !seenById) return fail(t("errCounted"));

  return run(t, async () =>
    prisma.$transaction(
      async (tx) => {
        const status = await lockCount(tx, countId);
        if (!status) throw new InvError("errCountNotFound");
        if (status !== "DRAFT") throw new InvError("errCountClosed");
        if (clean.length) await applyCountLines(tx, countId, clean);

        const allLines = await tx.inventoryCountLine.findMany({
          where: { countId },
          select: { id: true, itemId: true, counted: true },
        });
        if (seenById) {
          // Bazadagi sanalgan sonlar foydalanuvchi ko'rgani bilan bir xil bo'lishi kerak
          const inDb = new Set(allLines.map((l) => l.itemId));
          const countedDiffers = allLines.some((l) => (seenById.get(l.itemId)?.counted ?? null) !== l.counted);
          const seenMissing = [...seenById.values()].some((s) => s.counted !== null && !inDb.has(s.itemId));
          if (countedDiffers || seenMissing) throw new InvError("errCountStale");
        }
        const countLines = allLines.filter((l) => l.counted !== null);
        if (!countLines.length) throw new InvError("errCountEmpty");

        const ids = countLines.map((l) => l.itemId);
        await lockItems(tx, ids);
        const items = await tx.inventoryItem.findMany({
          where: { id: { in: ids } },
          select: { id: true, quantity: true, unitPrice: true },
        });
        const byId = new Map(items.map((i) => [i.id, i]));
        // Hisobdagi son foydalanuvchi ko'rgan "kutilgan"dan farq qilsa — ko'rsatilgan farq eskirgan
        if (seenById && countLines.some((l) => seenById.get(l.itemId)?.expected !== byId.get(l.itemId)?.quantity)) {
          throw new InvError("errCountStale");
        }

        let shortagePieces = 0;
        let shortageSum = 0;
        let surplusPieces = 0;
        const moves: Prisma.InventoryMovementCreateManyInput[] = [];
        for (const l of countLines) {
          const item = byId.get(l.itemId);
          if (!item || l.counted === null) continue;
          const counted = l.counted;
          // Hisobot yakunlash paytidagi holatni ko'rsatishi uchun
          await tx.inventoryCountLine.update({ where: { id: l.id }, data: { expected: item.quantity } });
          if (counted === item.quantity) continue;
          const delta = counted - item.quantity;
          await tx.inventoryItem.update({ where: { id: item.id }, data: { quantity: counted } });
          moves.push({
            itemId: item.id, type: "COUNT_ADJUST", delta, quantityAfter: counted,
            countId, unitPrice: item.unitPrice, createdById: user.id,
          });
          if (delta < 0) {
            shortagePieces += -delta;
            shortageSum += -delta * Number(item.unitPrice ?? 0);
          } else {
            surplusPieces += delta;
          }
        }
        if (moves.length) await tx.inventoryMovement.createMany({ data: moves });
        await tx.inventoryCount.update({
          where: { id: countId },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
        return { adjusted: moves.length, shortagePieces, shortageSum, surplusPieces };
      },
      { timeout: 30000, maxWait: 10000 }
    )
  );
}

/** Ochiq inventarizatsiyani bekor qilish (o'chiriladi, sonlar o'zgarmaydi) */
export async function cancelInventoryCount(countId: string): Promise<InvResult> {
  const ctx = await access(true);
  if ("error" in ctx) return fail(ctx.error);
  const { t } = ctx;
  if (!isId(countId)) return fail(t("errCountNotFound"));

  return run(t, async () => {
    const r = await prisma.inventoryCount.deleteMany({ where: { id: countId, status: "DRAFT" } });
    if (r.count === 0) {
      const exists = await prisma.inventoryCount.findUnique({ where: { id: countId }, select: { id: true } });
      throw new InvError(exists ? "errCountClosed" : "errCountNotFound");
    }
    return {};
  });
}
