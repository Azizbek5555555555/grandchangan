/**
 * Inventar — umumiy tiplar va konstantalar.
 * Toza modul: server va klient komponentlarda ham import qilsa bo'ladi
 * ("@prisma/client"dan faqat tiplar olinadi, runtime kod klient bundle'ga tushmaydi).
 */
import type {
  InventoryCategory,
  InventoryCountStatus,
  InventoryLossReason,
  InventoryMovementType,
  UserRole,
} from "@prisma/client";

export type { InventoryCategory, InventoryCountStatus, InventoryLossReason, InventoryMovementType };

/** Guruhlar (select va filtr uchun, ko'rsatish tartibi bilan) */
export const INVENTORY_CATEGORIES = [
  "CUTLERY",
  "TABLEWARE",
  "TEA",
  "GLASSWARE",
  "TABLE_ACCESSORY",
  "TEXTILE",
  "KITCHEN",
  "OTHER",
] as const satisfies readonly InventoryCategory[];

/** Yo'qotish sabablari */
export const LOSS_REASONS = ["BROKEN", "LOST", "WORN", "OTHER"] as const satisfies readonly InventoryLossReason[];

/** Harakat turlari */
export const MOVEMENT_TYPES = [
  "PURCHASE",
  "LOSS",
  "COUNT_ADJUST",
  "CORRECTION",
] as const satisfies readonly InventoryMovementType[];

/** Kiritiladigan qiymatlar chegaralari (server ham, forma ham shularni ishlatadi) */
export const INVENTORY_LIMITS = {
  /** jami son, norma (perSeat/perTable), minimal zaxira, sanalgan son: 0..maxQty */
  maxQty: 100000,
  /** kirim va yo'qotish miqdori: 1..maxMove */
  maxMove: 10000,
  /** narx (so'm): 0..maxPrice */
  maxPrice: 1_000_000_000,
  nameMax: 80,
  noteMax: 300,
} as const;

/** Server action natijasi: muvaffaqiyatda qo'shimcha maydonlar, xatoda tarjima qilingan matn */
export type InvResult<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

/** Qoldiq holati: OK — yetarli, LOW — zaxira minimaldan kam, SHORT — stollarga ham yetmaydi */
export type StockStatus = "OK" | "LOW" | "SHORT";

/** Bitta stol (yoki zona/umumiy) to'plamidagi bitta buyum */
export type TableSetLine = { itemId: string; name: string; qty: number };

/** Zona (xona) ichidagi bitta stol va undagi hisoblangan to'plam */
export type ZoneTableSet = { id: string; number: string; seats: number; items: TableSetLine[] };

/** Zona (xona): stollari, stol/o'rin soni va zona bo'yicha jami */
export type ZoneSet = {
  id: string;
  name: string;
  tableCount: number;
  seatCount: number;
  tables: ZoneTableSet[];
  totals: TableSetLine[];
};

/** Qoldiq jadvali qatori (Decimal -> number, sana -> ISO satr: klientga to'g'ridan-to'g'ri beriladi) */
export type InventoryItemRow = {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  perSeat: number;
  perTable: number;
  minReserve: number;
  unitPrice: number | null;
  sortOrder: number;
  /** norma × o'rinlar/stollar */
  onTables: number;
  /** quantity - onTables (manfiy bo'lishi mumkin) */
  reserve: number;
  status: StockStatus;
};

/** Tarix qatori */
export type InventoryMovementRow = {
  id: string;
  /** ISO satr — formatRestaurant() bilan chiqariladi */
  createdAt: string;
  itemId: string;
  itemName: string;
  category: InventoryCategory;
  type: InventoryMovementType;
  /** + kirim, - chiqim */
  delta: number;
  quantityAfter: number;
  reason: InventoryLossReason | null;
  note: string | null;
  /** hisobda ishlatilgan narx: harakatdagi snapshot, bo'lmasa buyumning hozirgi narxi */
  unitPrice: number | null;
  /** zarar summasi (so'm): faqat LOSS va manfiy COUNT_ADJUST uchun > 0, qolganlarida 0 */
  lossAmount: number;
  createdByName: string | null;
  responsibleName: string | null;
  countId: string | null;
};

/** Ochiq (DRAFT) inventarizatsiya qatori */
export type InventoryCountLineRow = {
  itemId: string;
  name: string;
  category: InventoryCategory;
  /** buyumning HOZIRGI soni — yakunlashda sanalgan son shu bilan solishtiriladi */
  expected: number;
  counted: number | null;
  unitPrice: number | null;
};

export type InventoryDraftCount = {
  id: string;
  createdAt: string;
  note: string | null;
  createdByName: string | null;
  lines: InventoryCountLineRow[];
};

/** Yakunlangan inventarizatsiyadagi farqi bor qator */
export type InventoryCountDiffLine = {
  itemId: string;
  name: string;
  expected: number;
  counted: number;
  /** counted - expected (manfiy = kamomad) */
  diff: number;
  /** kamomad summasi (so'm), ortiqcha bo'lsa 0 */
  amount: number;
};

export type InventoryCountSummary = {
  id: string;
  createdAt: string;
  completedAt: string | null;
  createdByName: string | null;
  note: string | null;
  /** jami qatorlar */
  lineCount: number;
  /** sanalgan qatorlar (counted != null) */
  countedCount: number;
  /** farqi bor qatorlar soni */
  diffCount: number;
  shortagePieces: number;
  shortageSum: number;
  surplusPieces: number;
  /** faqat farqi bor qatorlar */
  lines: InventoryCountDiffLine[];
};

export type InventoryStaffOption = { id: string; name: string; role: UserRole };

export type InventoryOverview = {
  items: InventoryItemRow[];
  zones: ZoneSet[];
  totals: {
    itemCount: number;
    tableCount: number;
    seatCount: number;
    /** barcha stollardagi jami (buyum bo'yicha) */
    onTables: TableSetLine[];
  };
  /** joriy oy (restoran vaqti) yo'qotish summasi, so'm */
  monthLoss: number;
  /** joriy oy yo'qotilgan dona */
  monthLossPieces: number;
  /** LOW yoki SHORT holatdagi buyumlar soni */
  lowCount: number;
  /** oxirgi yakunlangan inventarizatsiya sanasi (ISO) */
  lastCountAt: string | null;
  /** oxirgi 100 ta harakat */
  movements: InventoryMovementRow[];
  draft: InventoryDraftCount | null;
  /** oxirgi 10 ta yakunlangan inventarizatsiya */
  counts: InventoryCountSummary[];
  /** mas'ul tanlash uchun xodimlar (bloklanmagan, mijoz emas) */
  staff: InventoryStaffOption[];
  /** "Tayyor ro'yxat" faqat bazada umuman buyum bo'lmasa (arxivdagilar ham) qo'shiladi */
  canAddStarter: boolean;
};

/** Yo'qotish formasi uchun buyumlar ro'yxati */
export type InventoryItemOption = { id: string; name: string; category: InventoryCategory; quantity: number };
