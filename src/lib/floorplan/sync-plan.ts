/**
 * Xarita → baza (Zone/Table) sinxronlash rejasi. SOF funksiyalar: baza ham, React ham yo'q —
 * shuning uchun server, klient va tsx skriptda bir xil ishlaydi.
 *
 * Bog'lanish: Table.number === xaritadagi stol kodi (VIP-1, Z-3, K-2, A-1).
 * Zallar MAP_ZONES guruhlari bo'yicha (vip / hall / booth / private), bazada nomining
 * o'zbekchasi (name.uz) bo'yicha topiladi.
 *
 * Joylashuv: har guruh stollarining xaritadagi chegarasi (+ ~15px chekka) admin
 * FloorPlanEditor kanvasiga (odatda 1000×700) proporsiya saqlangan holda sig'diriladi va
 * markazlanadi. posX/posY — chap yuqori burchak, width/height — masshtablangan o'lcham (kamida 40).
 */
import type { TableShape } from "@prisma/client";
import { MAP_ZONES, bookableTables, type FloorRoom, type FloorTable, type Rect } from "./layout";

export type ZoneCanvas = { w: number; h: number };

/** Zone.mapWidth × Zone.mapHeight (schema'dagi default) */
export const DEFAULT_CANVAS: ZoneCanvas = { w: 1000, h: 700 };
/** Guruh chegarasiga qo'shiladigan chekka (xarita pikselida) */
export const SYNC_PADDING = 15;
/** Editorda stolning eng kichik o'lchami (px) */
export const MIN_TABLE_PX = 40;
/**
 * Eng katta kattalashtirish: bitta stolli guruh (masalan, "Alohida stol") butun kanvasni
 * egallab qolmasligi uchun.
 */
export const MAX_SCALE = 2.5;

export type MapZoneDef = (typeof MAP_ZONES)[number];
export type MapZoneKey = MapZoneDef["key"];
export type ZoneName = MapZoneDef["name"];

/** Bazaga yoziladigan bitta stol */
export type PlannedTable = {
  code: string;
  seats: number;
  shape: TableShape;
  isVip: boolean;
  posX: number;
  posY: number;
  width: number;
  height: number;
};

/** Bazaga yoziladigan bitta zal va uning stollari */
export type PlannedZone = {
  key: MapZoneKey;
  name: ZoneName;
  sortOrder: number;
  tables: PlannedTable[];
};

type MapItem = { table: FloorTable; room: FloorRoom };

/** Xaritadagi shakl → Prisma TableShape (bar band qilinmaydi → null) */
export function toTableShape(shape: FloorTable["shape"]): TableShape | null {
  switch (shape) {
    case "round": return "ROUND";
    case "rect": return "RECT";
    case "booth": return "BOOTH";
    default: return null;
  }
}

/** Stolning xaritadagi to'rtburchak chegarasi */
export function tableBox(t: FloorTable): Rect {
  if (t.shape === "round") {
    const r = t.r ?? 30;
    return { x: t.cx - r, y: t.cy - r, w: r * 2, h: r * 2 };
  }
  const w = t.w ?? 60;
  const h = t.h ?? 60;
  return { x: t.cx - w / 2, y: t.cy - h / 2, w, h };
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));

/**
 * Guruh stollarini kanvasga joylash: chegara (+chekka) proporsiya saqlangan holda
 * kanvasga sig'diriladi va markazlanadi. Stol markazi masshtab bo'yicha ko'chadi, o'lchami
 * kamida MIN_TABLE_PX bo'ladi va kanvasdan chiqib ketmaydi.
 */
export function layoutTables(items: MapItem[], canvas: ZoneCanvas = DEFAULT_CANVAS): PlannedTable[] {
  const usable = items.filter((it) => it.table.code && toTableShape(it.table.shape));
  if (usable.length === 0) return [];

  const boxes = usable.map((it) => tableBox(it.table));
  const minX = Math.min(...boxes.map((b) => b.x)) - SYNC_PADDING;
  const minY = Math.min(...boxes.map((b) => b.y)) - SYNC_PADDING;
  const maxX = Math.max(...boxes.map((b) => b.x + b.w)) + SYNC_PADDING;
  const maxY = Math.max(...boxes.map((b) => b.y + b.h)) + SYNC_PADDING;
  const bw = Math.max(1, maxX - minX);
  const bh = Math.max(1, maxY - minY);

  const scale = Math.min(canvas.w / bw, canvas.h / bh, MAX_SCALE);
  // Guruhni kanvas markaziga qo'yish
  const offX = (canvas.w - bw * scale) / 2;
  const offY = (canvas.h - bh * scale) / 2;

  return usable.map(({ table, room }, i) => {
    const b = boxes[i];
    const width = Math.max(MIN_TABLE_PX, Math.round(b.w * scale));
    const height = Math.max(MIN_TABLE_PX, Math.round(b.h * scale));
    const cx = offX + (b.x + b.w / 2 - minX) * scale;
    const cy = offY + (b.y + b.h / 2 - minY) * scale;
    return {
      code: table.code!,
      seats: table.seats,
      shape: toTableShape(table.shape)!,
      isVip: room.kind === "vip",
      posX: Math.round(clamp(cx - width / 2, 0, canvas.w - width)),
      posY: Math.round(clamp(cy - height / 2, 0, canvas.h - height)),
      width,
      height,
    };
  });
}

/** Bitta MAP_ZONES guruhi uchun reja (kanvas — shu zalning mapWidth×mapHeight) */
export function planZone(zone: MapZoneDef, canvas: ZoneCanvas = DEFAULT_CANVAS): PlannedZone {
  const items = bookableTables().filter(({ room }) => zone.kinds.includes(room.kind));
  return { key: zone.key, name: zone.name, sortOrder: zone.sortOrder, tables: layoutTables(items, canvas) };
}

/**
 * Butun xarita bo'yicha reja (MAP_ZONES tartibida). Bitta kod ikki marta uchrasa — xaritada
 * xato bor, sinxronlash to'xtatiladi.
 */
export function planFloorSync(canvasFor: (key: MapZoneKey) => ZoneCanvas = () => DEFAULT_CANVAS): PlannedZone[] {
  const plan = MAP_ZONES.map((z) => planZone(z, canvasFor(z.key)));
  const seen = new Set<string>();
  for (const z of plan) {
    for (const t of z.tables) {
      if (seen.has(t.code)) throw new Error(`Xaritada stol kodi takrorlangan: ${t.code}`);
      seen.add(t.code);
    }
  }
  return plan;
}

/** Xaritadagi barcha stol kodlari → kutilgan zal kaliti va o'rinlar soni */
export function mapTableIndex(): Map<string, { zoneKey: MapZoneKey; zoneUz: string; seats: number }> {
  const idx = new Map<string, { zoneKey: MapZoneKey; zoneUz: string; seats: number }>();
  for (const z of planFloorSync()) {
    for (const t of z.tables) idx.set(t.code, { zoneKey: z.key, zoneUz: z.name.uz, seats: t.seats });
  }
  return idx;
}

/** Zone.name (Json) dan o'zbekcha nom (taqqoslash uchun, bo'shliqlarsiz) */
export function zoneUzName(name: unknown): string {
  if (typeof name === "string") return name.trim();
  if (name && typeof name === "object" && !Array.isArray(name)) {
    const uz = (name as Record<string, unknown>).uz;
    if (typeof uz === "string") return uz.trim();
  }
  return "";
}

/**
 * Mavjud zal nomiga yetishmayotgan tillarni xaritadagidan qo'shish (bor tarjimalar o'zgarmaydi).
 * O'zgarish bo'lmasa — null.
 */
export function mergeZoneName(existing: unknown, map: ZoneName): ZoneName | null {
  const cur: Record<string, unknown> =
    existing && typeof existing === "object" && !Array.isArray(existing) ? (existing as Record<string, unknown>) : {};
  let changed = typeof existing !== "object" || existing === null || Array.isArray(existing);
  const out = { ...map };
  for (const lang of Object.keys(map) as (keyof ZoneName)[]) {
    const v = cur[lang];
    if (typeof v === "string" && v.trim()) out[lang] = v;
    else changed = true;
  }
  // Xaritada yo'q qo'shimcha kalitlar (agar bo'lsa) saqlanadi
  const merged = { ...cur, ...out } as ZoneName;
  return changed ? merged : null;
}
