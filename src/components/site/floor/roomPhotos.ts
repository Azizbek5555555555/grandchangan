import { PHOTOS, ROOM_PHOTOS, type Photo } from "@/lib/photos";
import type { FloorRoom, FloorTable, RoomKind } from "@/lib/floorplan/layout";

/**
 * Xarita xonasi/stoli → restoranning haqiqiy rasmlari (faqat ma'lumot, React yo'q).
 * Asosiy ro'yxat — ROOM_PHOTOS (lib/photos.ts); har xona uchun "bosh" rasm shu yerda tanlanadi,
 * qolganlari galereyada (kichik rasmchalar). Rasmi yo'q xonalar (Xona 1/2, oshxona…) — bo'sh ro'yxat,
 * ko'rinishda ieroglifli zaxira panel chiqadi.
 */

/** Har bir xona turi uchun xitoycha bezak belgisi (rasm yo'q bo'lsa zaxira panelda ham) */
export const ROOM_GLYPH: Record<RoomKind, string> = {
  vip: "雅", hall: "厅", booth: "座", private: "独", room: "房",
  bar: "酒", kitchen: "厨", wc: "洗", reception: "迎", entrance: "门", corridor: "廊",
};

/** Zallar ro'yxati (MAP_ZONES.key) uchun muqova rasm */
export const ZONE_COVER: Record<string, Photo> = {
  vip: PHOTOS.vipGrand,
  hall: PHOTOS.hallUmbrellas,
  booth: PHOTOS.boothRoundWindow,
  private: PHOTOS.privateRoom,
};

// VIP xonalar: katta (12–13 o'rinli) xonalarga — katta stolli rasmlar, 10 o'rinlilarga — kichikroq xona
const VIP_LEAD: Record<number, Photo> = {
  1: PHOTOS.vipGrand,
  2: PHOTOS.vipTableTop,
  3: PHOTOS.vipLounge,
  4: PHOTOS.vipChandelier,
  5: PHOTOS.vipTable,
};

// Kabinalar (deraza yonida) — har biriga boshqa rakurs
const BOOTH_LEAD: Record<number, Photo> = {
  1: PHOTOS.boothWindow,
  2: PHOTOS.boothWindow2,
  3: PHOTOS.boothSofa,
  4: PHOTOS.boothWindow,
  5: PHOTOS.boothRoundWindow,
};

/** Katta zal: stol turiga mos rasm (dumaloq / uzun / kichik to'rtburchak) */
function hallLead(table: FloorTable | null): Photo {
  if (!table) return PHOTOS.hallUmbrellas;
  if (table.shape === "round") return PHOTOS.hallRoundTable;
  return table.seats >= 10 ? PHOTOS.hallLongTable2 : PHOTOS.hallLongTable;
}

const uniq = (list: Photo[]) => list.filter((p, i) => list.findIndex((q) => q.src === p.src) === i);

/** Xona (va tanlangan stol) uchun rasmlar: birinchisi — bosh rasm */
export function roomPhotos(room: FloorRoom, table: FloorTable | null = null): Photo[] {
  switch (room.kind) {
    case "vip":
      return uniq([VIP_LEAD[room.num ?? 0] ?? ROOM_PHOTOS.vip[0], ...ROOM_PHOTOS.vip]);
    case "hall":
      return uniq([hallLead(table), ...ROOM_PHOTOS.hall]);
    case "booth":
      return uniq([BOOTH_LEAD[room.num ?? 0] ?? ROOM_PHOTOS.booth[0], ...ROOM_PHOTOS.booth, PHOTOS.boothWindow2]);
    case "private":
      return ROOM_PHOTOS.private;
    case "bar":
      return [PHOTOS.bar];
    default:
      return [];
  }
}

/**
 * Kesilganda muhim joy (stol, qandil) ko'rinib tursin: object-position.
 * Ro'yxatda yo'q rasm — markaz bo'yicha.
 */
const FOCUS: Record<string, string> = {
  [PHOTOS.vipGrand.src]: "object-[50%_62%]",
  [PHOTOS.vipChandelier.src]: "object-[45%_70%]",
  [PHOTOS.vipLounge.src]: "object-[40%_60%]",
  [PHOTOS.vipTable.src]: "object-[50%_70%]",
  [PHOTOS.privateRoom.src]: "object-[50%_70%]",
  [PHOTOS.hallUmbrellas.src]: "object-[60%_55%]",
  [PHOTOS.hallRoundTable.src]: "object-[50%_60%]",
  [PHOTOS.boothRoundWindow.src]: "object-[50%_55%]",
};
export const photoFocus = (p: Photo) => FOCUS[p.src] ?? "object-center";

/** md o'lchamining kengligi (srcSet uchun): md — uzun tomoni max(960, asl/2) px gacha kichraytirilgan */
export function mdWidth(p: Photo): number {
  const long = Math.max(p.w, p.h);
  const mdLong = Math.min(long, Math.max(960, long / 2));
  return Math.round((p.w * mdLong) / long);
}
