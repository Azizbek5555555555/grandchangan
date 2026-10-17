import "server-only";
import type { InventoryCategory, Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { t as tr } from "../utils";
import { restaurantDay, restaurantDateTime } from "../time";
import { computeStock, computeZones, countLineDiff, movementLoss, seatTotals, setTotals, type ZoneInput } from "./calc";
import type {
  InventoryCountSummary,
  InventoryDraftCount,
  InventoryItemOption,
  InventoryItemRow,
  InventoryMovementRow,
  InventoryOverview,
  InventoryStaffOption,
} from "./types";

/**
 * Inventar uchun o'qish funksiyalari (faqat server: sahifalar va dashboard).
 * Natijalar klient komponentlarga to'g'ridan-to'g'ri beriladi: Decimal -> number, Date -> ISO satr.
 */

const num = (v: Prisma.Decimal | null | undefined): number | null => (v == null ? null : Number(v));
const userName = (u: { name: string | null; phone: string } | null): string | null => (u ? u.name || u.phone : null);

/** Joriy oy boshi — restoran vaqti (Toshkent) bo'yicha, server mintaqasiga bog'liq emas */
function monthStart(): Date {
  return restaurantDateTime(`${restaurantDay().slice(0, 7)}-01`, "00:00");
}

/** Faol buyumlar + faol zonalardagi faol stollar asosida qoldiq hisobi */
async function loadStock(locale: string) {
  const [rows, zones] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.zone.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        tables: { where: { isActive: true }, select: { id: true, number: true, seats: true } },
      },
    }),
  ]);

  const zoneInputs: ZoneInput[] = zones.map((z) => ({ id: z.id, name: tr(z.name, locale), tables: z.tables }));
  const allTables = zoneInputs.flatMap((z) => z.tables);

  const items: InventoryItemRow[] = computeStock(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      quantity: r.quantity,
      perSeat: r.perSeat,
      perTable: r.perTable,
      minReserve: r.minReserve,
      unitPrice: num(r.unitPrice),
      sortOrder: r.sortOrder,
    })),
    allTables
  );

  return { items, zoneInputs, allTables };
}

/** Joriy oy yo'qotishlari: LOSS + manfiy COUNT_ADJUST, narx — snapshot, bo'lmasa buyum narxi */
async function loadMonthLoss(): Promise<{ monthLoss: number; monthLossPieces: number }> {
  const moves = await prisma.inventoryMovement.findMany({
    where: {
      createdAt: { gte: monthStart() },
      OR: [{ type: "LOSS" }, { type: "COUNT_ADJUST", delta: { lt: 0 } }],
    },
    select: { delta: true, unitPrice: true, item: { select: { unitPrice: true } } },
  });
  let monthLoss = 0;
  let monthLossPieces = 0;
  for (const m of moves) {
    if (m.delta >= 0) continue;
    monthLossPieces += -m.delta;
    monthLoss += movementLoss(m.delta, num(m.unitPrice) ?? num(m.item.unitPrice));
  }
  return { monthLoss, monthLossPieces };
}

const movementInclude = {
  item: { select: { name: true, category: true, unitPrice: true } },
  createdBy: { select: { name: true, phone: true } },
  responsible: { select: { name: true, phone: true } },
} satisfies Prisma.InventoryMovementInclude;

type MovementWithRefs = Prisma.InventoryMovementGetPayload<{ include: typeof movementInclude }>;

function toMovementRow(m: MovementWithRefs): InventoryMovementRow {
  const unitPrice = num(m.unitPrice) ?? num(m.item.unitPrice);
  const isLoss = m.type === "LOSS" || (m.type === "COUNT_ADJUST" && m.delta < 0);
  return {
    id: m.id,
    createdAt: m.createdAt.toISOString(),
    itemId: m.itemId,
    itemName: m.item.name,
    category: m.item.category,
    type: m.type,
    delta: m.delta,
    quantityAfter: m.quantityAfter,
    reason: m.reason,
    note: m.note,
    unitPrice,
    lossAmount: isLoss ? movementLoss(m.delta, unitPrice) : 0,
    createdByName: userName(m.createdBy),
    responsibleName: userName(m.responsible),
    countId: m.countId,
  };
}

/** Kategoriya tartibi (Postgres enum tartibi bilan bir xil) — count qatorlarini saralash uchun */
const CATEGORY_ORDER: Record<InventoryCategory, number> = {
  CUTLERY: 0, TABLEWARE: 1, TEA: 2, GLASSWARE: 3, TABLE_ACCESSORY: 4, TEXTILE: 5, KITCHEN: 6, OTHER: 7,
};

type ItemSortable = { category: InventoryCategory; sortOrder: number; name: string };
function compareItems(a: ItemSortable, b: ItemSortable): number {
  return (
    CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category] ||
    a.sortOrder - b.sortOrder ||
    a.name.localeCompare(b.name)
  );
}

/**
 * Inventar sahifasi (boshqaruv) uchun hamma ma'lumot bitta chaqiruvda.
 * locale — zona nomlarini tarjima qilish uchun.
 */
export async function getInventoryOverview(locale: string): Promise<InventoryOverview> {
  const [{ items, zoneInputs, allTables }, loss, movements, draftRow, completed, staffRows, anyItem] = await Promise.all([
    loadStock(locale),
    loadMonthLoss(),
    prisma.inventoryMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: movementInclude,
    }),
    prisma.inventoryCount.findFirst({
      where: { status: "DRAFT" },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { name: true, phone: true } },
        lines: {
          include: {
            item: { select: { name: true, category: true, sortOrder: true, quantity: true, unitPrice: true } },
          },
        },
      },
    }),
    prisma.inventoryCount.findMany({
      where: { status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 10,
      include: {
        createdBy: { select: { name: true, phone: true } },
        lines: { include: { item: { select: { name: true, category: true, sortOrder: true, unitPrice: true } } } },
        movements: { select: { itemId: true, unitPrice: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: { not: "CUSTOMER" }, isBlocked: false },
      orderBy: [{ name: "asc" }],
      select: { id: true, name: true, phone: true, role: true },
    }),
    prisma.inventoryItem.findFirst({ select: { id: true } }),
  ]);

  const { tableCount, seatCount } = seatTotals(allTables);

  // Ochiq inventarizatsiya: "kutilgan" — buyumning hozirgi soni (yakunlashda aynan shu ishlatiladi)
  const draft: InventoryDraftCount | null = draftRow
    ? {
        id: draftRow.id,
        createdAt: draftRow.createdAt.toISOString(),
        note: draftRow.note,
        createdByName: userName(draftRow.createdBy),
        lines: [...draftRow.lines]
          .sort((a, b) => compareItems(a.item, b.item))
          .map((l) => ({
            itemId: l.itemId,
            name: l.item.name,
            category: l.item.category,
            expected: l.item.quantity,
            counted: l.counted,
            unitPrice: num(l.item.unitPrice),
          })),
      }
    : null;

  // Yakunlangan inventarizatsiyalar: farqlar va kamomad summasi (narx — COUNT_ADJUST snapshot'i)
  const counts: InventoryCountSummary[] = completed.map((c) => {
    const priceByItem = new Map(c.movements.map((m) => [m.itemId, num(m.unitPrice)]));
    let countedCount = 0;
    let shortagePieces = 0;
    let shortageSum = 0;
    let surplusPieces = 0;
    const lines: InventoryCountSummary["lines"] = [];
    for (const l of [...c.lines].sort((a, b) => compareItems(a.item, b.item))) {
      if (l.counted === null) continue;
      countedCount++;
      const price = priceByItem.get(l.itemId) ?? num(l.item.unitPrice);
      const d = countLineDiff(l.expected, l.counted, price);
      if (!d.diff) continue;
      shortagePieces += d.shortage;
      surplusPieces += d.surplus;
      shortageSum += d.shortageSum;
      lines.push({
        itemId: l.itemId,
        name: l.item.name,
        expected: l.expected,
        counted: l.counted,
        diff: d.diff,
        amount: d.shortageSum,
      });
    }
    return {
      id: c.id,
      createdAt: c.createdAt.toISOString(),
      completedAt: c.completedAt?.toISOString() ?? null,
      createdByName: userName(c.createdBy),
      note: c.note,
      lineCount: c.lines.length,
      countedCount,
      diffCount: lines.length,
      shortagePieces,
      shortageSum,
      surplusPieces,
      lines,
    };
  });

  const staff: InventoryStaffOption[] = staffRows.map((u) => ({ id: u.id, name: u.name || u.phone, role: u.role }));

  return {
    items,
    zones: computeZones(items, zoneInputs),
    totals: { itemCount: items.length, tableCount, seatCount, onTables: setTotals(items, allTables) },
    monthLoss: loss.monthLoss,
    monthLossPieces: loss.monthLossPieces,
    lowCount: items.filter((i) => i.status !== "OK").length,
    lastCountAt: counts[0]?.completedAt ?? null,
    movements: movements.map(toMovementRow),
    draft,
    counts,
    staff,
    canAddStarter: !anyItem,
  };
}

/**
 * Dashboard kartalari uchun. Eslatma: chaqiruvchi try/catch'da o'rashi kerak —
 * inventar jadvallari bazada hali bo'lmasa (db push qilinmagan) xato otadi.
 */
export async function getInventoryDashboardStats(): Promise<{ lowCount: number; monthLoss: number }> {
  const [{ items }, { monthLoss }] = await Promise.all([loadStock("uz"), loadMonthLoss()]);
  return { lowCount: items.filter((i) => i.status !== "OK").length, monthLoss };
}

/** Xodimning (WAITER/KITCHEN) o'zi kiritgan oxirgi 10 ta yo'qotish xabari */
export async function getMyLossReports(userId: string): Promise<InventoryMovementRow[]> {
  const rows = await prisma.inventoryMovement.findMany({
    where: { type: "LOSS", createdById: userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: movementInclude,
  });
  return rows.map(toMovementRow);
}

/** Yo'qotish formasidagi buyumlar ro'yxati (faol buyumlar, qoldiq jadvali tartibida) */
export async function getInventoryItemOptions(): Promise<InventoryItemOption[]> {
  return prisma.inventoryItem.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, category: true, quantity: true },
  });
}
