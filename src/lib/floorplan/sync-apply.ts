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

export type FloorSyncStatus = {
  /** Xaritadagi band qilinadigan stollar soni (21) */
  mapTables: number;
  /** To'g'ri bog'langan kodlar: faol zaldagi faol stol, kerakli zalda, o'rinlar soni mos */
  linked: number;
  /** Bazada faol stoli (faol zalda) yo'q kodlar */
  missing: string[];
  /** Sinxronlashda nofaol qilinadigan faol stollar: xaritada yo'q yoki bitta kodning takrori */
  extraActive: number;
  needsSync: boolean;
};

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
function pickPrimary(cands: DbTable[], zoneId: string): DbTable {
  return [...cands].sort((a, b) =>
    Number(b.zoneId === zoneId) - Number(a.zoneId === zoneId) ||
    Number(b.isActive) - Number(a.isActive) ||
    (b._count.reservations + b._count.orders) - (a._count.reservations + a._count.orders) ||
    a.createdAt.getTime() - b.createdAt.getTime()
  )[0];
}

function tableChanged(t: DbTable, p: PlannedTable, zoneId: string): boolean {
  return (
    t.zoneId !== zoneId || t.seats !== p.seats || t.shape !== p.shape || t.isVip !== p.isVip ||
    !t.isActive || t.minSeats > p.seats ||
    !same(t.posX, p.posX) || !same(t.posY, p.posY) || !same(t.width, p.width) || !same(t.height, p.height)
  );
}

export async function applyFloorSync(db: PrismaClient): Promise<FloorSyncResult> {
  return db.$transaction(
    async (tx: Tx) => {
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
      for (const t of all) byNumber.set(t.number, [...(byNumber.get(t.number) ?? []), t]);

      const keepIds = new Set<string>();
      for (const { zoneId, table: p } of planned) {
        const cands = byNumber.get(p.code) ?? [];
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
        const t = pickPrimary(cands, zoneId);
        keepIds.add(t.id);
        if (tableChanged(t, p, zoneId)) {
          await tx.table.update({
            where: { id: t.id },
            data: {
              zoneId, seats: p.seats, shape: p.shape, isVip: p.isVip, isActive: true,
              minSeats: Math.min(t.minSeats, p.seats), ...pos,
            },
          });
          res.updated++;
        }
      }

      // ---- 3. Qolgan faol stollar (xaritada yo'q yoki takroriy) → nofaol (o'chirilmaydi) ----
      const stale = all.filter((t) => t.isActive && !keepIds.has(t.id)).map((t) => t.id);
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
    select: { number: true, seats: true, zone: { select: { name: true, isActive: true } } },
  });

  const liveCodes = new Set<string>();
  const linkedCodes = new Set<string>();
  const perCode = new Map<string, number>();
  let notOnMap = 0;

  for (const t of tables) {
    const m = index.get(t.number);
    if (!m) {
      notOnMap++;
      continue;
    }
    perCode.set(t.number, (perCode.get(t.number) ?? 0) + 1);
    if (!t.zone.isActive) continue;
    liveCodes.add(t.number);
    if (t.seats === m.seats && zoneUzName(t.zone.name) === m.zoneUz.trim()) linkedCodes.add(t.number);
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
    needsSync: linkedCodes.size < index.size || extraActive > 0,
  };
}
