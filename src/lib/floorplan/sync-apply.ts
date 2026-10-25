import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";
import { MAP_ZONES } from "./layout";
import {
  DEFAULT_CANVAS, mapTableIndex, mergeZoneName, planZone, zoneUzName, type PlannedTable,
} from "./sync-plan";

/**
 * Xaritadagi stollarni bazaga yozish (Zone/Table) va holatini tekshirish.
 * Bu yerda AUTH YO'Q — chaqiruvchi tekshiradi (server action: ./actions.ts). Prisma klienti
 * parametr sifatida beriladi, shuning uchun tsx skriptdan ham sinab ko'rsa bo'ladi.
 *
 * Qoidalar:
 *  - Zal name.uz bo'yicha topiladi; yo'q bo'lsa 4 tilda yaratiladi, bor bo'lsa faollashtiriladi
 *    va yetishmayotgan tillar to'ldiriladi.
 *  - Stol Table.number === kod bo'yicha (istalgan zaldan) topiladi va yangilanadi, yo'q bo'lsa yaratiladi.
 *  - Xaritada yo'q faol stollar faqat NOFAOL qilinadi (o'chirilmaydi — bron tarixi bor).
 *  - Xaritaga tegishli bo'lmagan va faol stoli qolmagan zallar nofaol qilinadi.
 *  - Takroriy ishga tushirish hech narsani o'zgartirmaydi (idempotent).
 */

export type FloorSyncResult = {
  /** Yangi yaratilgan stollar */
  created: number;
  /** Haqiqatan o'zgargan (zal, o'rin, shakl, joylashuv...) mavjud stollar */
  updated: number;
  /** Nofaol qilingan stollar (xaritada yo'q yoki takroriy) */
  deactivated: number;
  /** Yangi yaratilgan zallar */
  zonesCreated: number;
  /** Nofaol qilingan eski zallar (faol stoli qolmagan) */
  zonesDeactivated: number;
};

/** Nofaol qilinadigan stoldagi kelajakdagi faol bron (sinxronlashdan oldin admin hal qilishi kerak) */
export type FutureBooking = { code: string; startTime: string; table: string; guestName: string };

/** Sinxronlash to'xtatildi: nofaol bo'ladigan stollarda kelajakdagi bronlar bor (o'zgarish qilinmadi) */
export class FutureBookingsError extends Error {
  constructor(public bookings: FutureBooking[]) {
    super("future-bookings");
  }
}

export type FloorSyncStatus = {
  /** Xaritadagi band qilinadigan stollar soni (22) */
  mapTables: number;
  /** To'g'ri bog'langan kodlar: faol zaldagi faol stol, kerakli zalda, o'rinlar soni mos */
  linked: number;
  /** Bazada faol stoli (faol zalda) yo'q kodlar */
  missing: string[];
  /** Sinxronlashda nofaol qilinadigan faol stollar: xaritada yo'q yoki bitta kodning takrori */
  extraActive: number;
  /** Xaritada yo'q faol stollardagi kelajakdagi faol bronlar (sinxronlash ularni "egasiz" qoldiradi) */
  futureBookings: FutureBooking[];
  needsSync: boolean;
};

/** Kod solishtirish: "vip-2 " va "VIP-2" bir xil stol */
export const normCode = (s: string) => s.trim().toUpperCase();
const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "SEATED"] as const;

async function futureBookingsOn(db: Tx | PrismaClient, tableIds: string[]): Promise<FutureBooking[]> {
  if (!tableIds.length) return [];
  const rows = await db.reservation.findMany({
    where: { tableId: { in: tableIds }, status: { in: [...ACTIVE_STATUSES] }, startTime: { gt: new Date() } },
    orderBy: { startTime: "asc" },
    take: 50,
    select: { code: true, startTime: true, guestName: true, table: { select: { number: true } } },
  });
  return rows.map((r) => ({ code: r.code, startTime: r.startTime.toISOString(), table: r.table?.number ?? "—", guestName: r.guestName }));
}

type Tx = Prisma.TransactionClient;
type DbTable = {
  id: string; zoneId: string; number: string; seats: number; minSeats: number; shape: string;
  isVip: boolean; isActive: boolean; posX: number; posY: number; width: number; height: number;
  createdAt: Date; _count: { reservations: number; orders: number };
};

const TABLE_SELECT = {
  id: true, zoneId: true, number: true, seats: true, minSeats: true, shape: true, isVip: true,
  isActive: true, posX: true, posY: true, width: true, height: true, createdAt: true,
  _count: { select: { reservations: true, orders: true } },
} as const;

const same = (a: number, b: number) => Math.abs(a - b) < 0.01;

/**
 * Bitta kod uchun bazadagi bir nechta stol bo'lsa — qaysi birini xaritaga bog'lash:
 * avval kerakli zaldagisi (zal+raqam unikal — to'qnashuv bo'lmasin), keyin faoli,
 * keyin tarixi ko'pi, keyin eng eskisi.
 */
function pickPrimary(cands: DbTable[], zoneId: string, code: string): DbTable {
  const exactHere = (t: DbTable) => Number(t.zoneId === zoneId && t.number === code);
  return [...cands].sort((a, b) =>
    exactHere(b) - exactHere(a) ||
    Number(b.zoneId === zoneId) - Number(a.zoneId === zoneId) ||
    Number(b.isActive) - Number(a.isActive) ||
    (b._count.reservations + b._count.orders) - (a._count.reservations + a._count.orders) ||
    a.createdAt.getTime() - b.createdAt.getTime()
  )[0];
}

function tableChanged(t: DbTable, p: PlannedTable, zoneId: string): boolean {
  return (
    t.zoneId !== zoneId || t.number !== p.code || t.seats !== p.seats || t.shape !== p.shape || t.isVip !== p.isVip ||
    !t.isActive || t.minSeats > p.seats ||
    !same(t.posX, p.posX) || !same(t.posY, p.posY) || !same(t.width, p.width) || !same(t.height, p.height)
  );
}

/**
 * force=false (standart): xaritada yo'q stollarda kelajakdagi faol bronlar bo'lsa — hech narsa
 * o'zgartirilmaydi, FutureBookingsError otiladi (tranzaksiya bekor qilinadi). Aks holda o'sha
 * jismoniy stol xaritadagi yangi kod bilan ikkinchi marta sotilib qolishi mumkin.
 */
export async function applyFloorSync(db: PrismaClient, { force = false }: { force?: boolean } = {}): Promise<FloorSyncResult> {
  return db.$transaction(
    async (tx: Tx) => {
      // Bir vaqtda ikki admin bossa — ikkinchisi birinchisi tugashini kutadi (takroriy zallar bo'lmasin)
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('floor-sync'))`;
      const res: FloorSyncResult = { created: 0, updated: 0, deactivated: 0, zonesCreated: 0, zonesDeactivated: 0 };

      // ---- 1. Zallar ----
      const zones = await tx.zone.findMany({
        orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
        select: { id: true, name: true, isActive: true, mapWidth: true, mapHeight: true },
      });
      const mapZoneIds = new Set<string>();
      const planned: { zoneId: string; table: PlannedTable }[] = [];

      for (const def of MAP_ZONES) {
        // Bir xil nomli bir nechta zal bo'lsa — faoli, keyin eng eskisi
        let zone = zones.find((z) => !mapZoneIds.has(z.id) && zoneUzName(z.name) === def.name.uz.trim());
        if (!zone) {
          const created = await tx.zone.create({
            data: {
              name: def.name, sortOrder: def.sortOrder, isActive: true,
              mapWidth: DEFAULT_CANVAS.w, mapHeight: DEFAULT_CANVAS.h,
            },
            select: { id: true, name: true, isActive: true, mapWidth: true, mapHeight: true },
          });
          res.zonesCreated++;
          zone = created;
        } else {
          const name = mergeZoneName(zone.name, def.name);
          if (!zone.isActive || name) {
            await tx.zone.update({ where: { id: zone.id }, data: { isActive: true, ...(name ? { name } : {}) } });
          }
        }
        mapZoneIds.add(zone.id);
        // Joylashuv shu zal kanvasining haqiqiy o'lchamiga hisoblanadi
        const canvas = { w: zone.mapWidth || DEFAULT_CANVAS.w, h: zone.mapHeight || DEFAULT_CANVAS.h };
        for (const table of planZone(def, canvas).tables) planned.push({ zoneId: zone.id, table });
      }

      // ---- 2. Xaritadagi stollar: yangilash yoki yaratish ----
      const all = (await tx.table.findMany({ select: TABLE_SELECT })) as DbTable[];
      const byNumber = new Map<string, DbTable[]>();
      for (const t of all) byNumber.set(normCode(t.number), [...(byNumber.get(normCode(t.number)) ?? []), t]);

      const keepIds = new Set<string>();
      for (const { zoneId, table: p } of planned) {
        const cands = byNumber.get(normCode(p.code)) ?? [];
        const pos = { posX: p.posX, posY: p.posY, width: p.width, height: p.height };
        if (cands.length === 0) {
          const created = await tx.table.create({
            data: {
              zoneId, number: p.code, seats: p.seats, minSeats: Math.min(1, p.seats), shape: p.shape,
              isVip: p.isVip, isActive: true, ...pos,
            },
            select: { id: true },
          });
          keepIds.add(created.id);
          res.created++;
          continue;
        }
        const t = pickPrimary(cands, zoneId, p.code);
        keepIds.add(t.id);
        if (tableChanged(t, p, zoneId)) {
          await tx.table.update({
            where: { id: t.id },
            data: {
              zoneId, number: p.code, seats: p.seats, shape: p.shape, isVip: p.isVip, isActive: true,
              minSeats: Math.min(t.minSeats, p.seats), ...pos,
            },
          });
          res.updated++;
        }
      }

      // ---- 3. Qolgan faol stollar (xaritada yo'q yoki takroriy) → nofaol (o'chirilmaydi) ----
      const stale = all.filter((t) => t.isActive && !keepIds.has(t.id)).map((t) => t.id);
      if (!force) {
        const future = await futureBookingsOn(tx, stale);
        if (future.length) throw new FutureBookingsError(future);
      }
      if (stale.length) {
        const r = await tx.table.updateMany({ where: { id: { in: stale } }, data: { isActive: false } });
        res.deactivated = r.count;
      }

      // ---- 4. Faol stoli qolmagan eski zallar → nofaol ----
      const oldZones = await tx.zone.findMany({
        where: { isActive: true, id: { notIn: [...mapZoneIds] } },
        select: { id: true, _count: { select: { tables: { where: { isActive: true } } } } },
      });
      const emptyZones = oldZones.filter((z) => z._count.tables === 0).map((z) => z.id);
      if (emptyZones.length) {
        const r = await tx.zone.updateMany({ where: { id: { in: emptyZones } }, data: { isActive: false } });
        res.zonesDeactivated = r.count;
      }

      return res;
    },
    // Masofaviy bazada (Railway) ~30 so'rov — standart 5 soniya yetmasligi mumkin
    { maxWait: 10_000, timeout: 30_000 }
  );
}

/** Admin "Zallar va stollar" sahifasidagi karta uchun: baza xarita bilan qanchalik mos */
export async function getFloorSyncStatus(db: PrismaClient): Promise<FloorSyncStatus> {
  const index = mapTableIndex();
  const tables = await db.table.findMany({
    where: { isActive: true },
    select: { id: true, number: true, seats: true, zone: { select: { name: true, isActive: true } } },
  });
  const offMap: string[] = [];

  const liveCodes = new Set<string>();
  const linkedCodes = new Set<string>();
  const perCode = new Map<string, number>();
  let notOnMap = 0;

  for (const t of tables) {
    const code = normCode(t.number);
    const m = index.get(code);
    if (!m) {
      notOnMap++;
      offMap.push(t.id);
      continue;
    }
    perCode.set(code, (perCode.get(code) ?? 0) + 1);
    if (!t.zone.isActive) continue;
    liveCodes.add(code);
    if (t.number === code && t.seats === m.seats && zoneUzName(t.zone.name) === m.zoneUz.trim()) linkedCodes.add(code);
  }
  // Bitta kodga bir nechta faol stol — ortiqchalari sinxronlashda nofaol qilinadi
  const duplicates = [...perCode.values()].reduce((s, n) => s + Math.max(0, n - 1), 0);

  const missing = [...index.keys()].filter((code) => !liveCodes.has(code));
  const extraActive = notOnMap + duplicates;
  return {
    mapTables: index.size,
    linked: linkedCodes.size,
    missing,
    extraActive,
    futureBookings: await futureBookingsOn(db, offMap),
    needsSync: linkedCodes.size < index.size || extraActive > 0,
  };
}
