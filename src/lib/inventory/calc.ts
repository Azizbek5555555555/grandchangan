/**
 * Inventar hisob-kitobi — toza funksiyalar (bazaga murojaat yo'q).
 * Server (queries.ts) ham, klient (inventarizatsiya formasidagi jonli farq) ham ishlatadi.
 *
 * Asosiy g'oya: restoran bo'yicha faqat JAMI son saqlanadi. Har bir stolda nechta turishi
 * normadan hisoblanadi: stoldagi son = perSeat × o'rinlar + perTable.
 */
import type { StockStatus, TableSetLine, ZoneSet } from "./types";

/** Norma uchun kerakli maydonlar */
export type NormItem = { id: string; name: string; perSeat: number; perTable: number };
/** Qoldiq hisobi uchun kerakli maydonlar */
export type StockInput = NormItem & { quantity: number; minReserve: number };
/** Stol: faqat o'rinlar soni kerak */
export type SeatTable = { seats: number };
/** Zona kirishi (nomi allaqachon tarjima qilingan) */
export type ZoneInput = { id: string; name: string; tables: { id: string; number: string; seats: number }[] };

/** Bitta stolga normaga ko'ra kerak bo'ladigan son */
export function tableQty(item: Pick<NormItem, "perSeat" | "perTable">, seats: number): number {
  return Math.max(0, item.perSeat * Math.max(0, seats) + item.perTable);
}

/** Stollar va o'rinlar soni */
export function seatTotals(tables: SeatTable[]): { tableCount: number; seatCount: number } {
  return {
    tableCount: tables.length,
    seatCount: tables.reduce((s, tb) => s + Math.max(0, tb.seats), 0),
  };
}

/** Bir nechta stol uchun jami (perSeat × jami o'rin + perTable × stollar soni) */
export function qtyForTables(item: Pick<NormItem, "perSeat" | "perTable">, tables: SeatTable[]): number {
  const { tableCount, seatCount } = seatTotals(tables);
  return Math.max(0, item.perSeat * seatCount + item.perTable * tableCount);
}

/** Holat: zaxira manfiy — SHORT, minimaldan kam — LOW, aks holda OK */
export function stockStatus(reserve: number, minReserve: number): StockStatus {
  if (reserve < 0) return "SHORT";
  if (reserve < minReserve) return "LOW";
  return "OK";
}

/** Har bir buyum uchun: stollarda, zaxirada, holat */
export function computeStock<T extends StockInput>(
  items: T[],
  tables: SeatTable[]
): (T & { onTables: number; reserve: number; status: StockStatus })[] {
  return items.map((it) => {
    const onTables = qtyForTables(it, tables);
    const reserve = it.quantity - onTables;
    return { ...it, onTables, reserve, status: stockStatus(reserve, it.minReserve) };
  });
}

/** Bitta stol to'plami: normasi 0 dan katta buyumlar (masalan "Piyola ×4") */
export function tableSet(items: NormItem[], seats: number): TableSetLine[] {
  const out: TableSetLine[] = [];
  for (const it of items) {
    const qty = tableQty(it, seats);
    if (qty > 0) out.push({ itemId: it.id, name: it.name, qty });
  }
  return out;
}

/**
 * Berilgan stollar (har birining o'rinlar soni) uchun normaga ko'ra kerakli buyumlar — buyum
 * obyekti bilan birga (holatini ko'rsatish uchun). Bitta stol uchun: normLines(items, [seats]).
 * Ko'pi tepada, teng bo'lsa — nomi bo'yicha.
 */
export function normLines<T extends Pick<NormItem, "name" | "perSeat" | "perTable">>(
  items: T[],
  seatsList: number[]
): { item: T; qty: number }[] {
  return items
    .filter((i) => i.perSeat > 0 || i.perTable > 0)
    .map((item) => ({ item, qty: seatsList.reduce((s, seats) => s + tableQty(item, seats), 0) }))
    .filter((l) => l.qty > 0)
    .sort((a, b) => b.qty - a.qty || a.item.name.localeCompare(b.item.name));
}

/** Stollar guruhi bo'yicha jami to'plam (zona yoki butun restoran) */
export function setTotals(items: NormItem[], tables: SeatTable[]): TableSetLine[] {
  const out: TableSetLine[] = [];
  for (const it of items) {
    const qty = qtyForTables(it, tables);
    if (qty > 0) out.push({ itemId: it.id, name: it.name, qty });
  }
  return out;
}

/** Stol raqamlarini tabiiy tartibda solishtirish: "2" < "10", "A2" < "A10" */
export function compareTableNumber(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

/** Zonalar (xonalar) bo'yicha: har bir stol to'plami va zona jami. Bo'sh zonalar tashlab ketiladi. */
export function computeZones(items: NormItem[], zones: ZoneInput[]): ZoneSet[] {
  return zones
    .filter((z) => z.tables.length > 0)
    .map((z) => {
      const tables = [...z.tables].sort((a, b) => compareTableNumber(a.number, b.number));
      const { tableCount, seatCount } = seatTotals(tables);
      return {
        id: z.id,
        name: z.name,
        tableCount,
        seatCount,
        tables: tables.map((tb) => ({ id: tb.id, number: tb.number, seats: tb.seats, items: tableSet(items, tb.seats) })),
        totals: setTotals(items, tables),
      };
    });
}

/**
 * Inventarizatsiya qatori farqi. counted = null bo'lsa — sanalmagan (farq yo'q).
 * diff = counted - expected; kamomad (diff < 0) narx bo'yicha so'mga aylantiriladi.
 */
export function countLineDiff(
  expected: number,
  counted: number | null,
  unitPrice: number | null
): { diff: number | null; shortage: number; surplus: number; shortageSum: number } {
  if (counted === null) return { diff: null, shortage: 0, surplus: 0, shortageSum: 0 };
  const diff = counted - expected;
  const shortage = diff < 0 ? -diff : 0;
  return { diff, shortage, surplus: diff > 0 ? diff : 0, shortageSum: shortage * (unitPrice ?? 0) };
}

/** Harakat zarari: faqat chiqim (delta < 0) bo'lsa, -delta × narx */
export function movementLoss(delta: number, unitPrice: number | null): number {
  return delta < 0 ? -delta * (unitPrice ?? 0) : 0;
}
