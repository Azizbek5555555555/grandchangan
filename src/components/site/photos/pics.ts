import { GALLERY, PHOTOS, type Photo, type PhotoKind, type PhotoName } from "@/lib/photos";

/**
 * Sayt bo'limlari uchun rasm "kartochkasi" (serializatsiya qilinadi — server → klient).
 * Haqiqiy rasmlar (src/lib/photos.ts) va bazadagi/taom rasmlari (faqat src) bir xil shaklda.
 */
export type Pic = {
  /** Katta o'lcham (yoki bazadagi rasm URL'i) */
  src: string;
  /** O'rta o'lcham — telefon va kartalar uchun */
  md?: string;
  w?: number;
  h?: number;
  /** object-position — rasmning muhim joyi (stol, qandil, peshtoq) kesilmasin */
  pos?: string;
  kind?: PhotoKind;
  name?: PhotoName;
};

/**
 * Har rasmning "muhim nuqtasi" (object-position) — rasmlarni bittalab ko'rib belgilangan.
 * Odatiy holat: rasm boshqa nisbatli ramkaga (vertikal panel, kvadrat, doira) kesilganda ham
 * asosiy obyekt ko'rinib tursin. Joyiga qarab pic(name, pos) bilan almashtiriladi.
 */
const FOCUS: Record<PhotoName, string> = {
  extFacade: "40% 55%",
  extGate: "50% 55%",
  extStreet: "60% 50%",
  // pastki chapda qurilish qoldiqlari bor — vertikal ramkada yuqori qism (yozuv + eshik)
  extDoorTall: "50% 4%",
  hallUmbrellas: "55% 60%",
  hallBarView: "38% 60%",
  hallPartitions: "62% 50%",
  hallLattice: "62% 50%",
  hallLongTable: "38% 60%",
  hallWide: "50% 60%",
  hallRoundTable: "50% 62%",
  hallRoundTable2: "50% 65%",
  hallLongTable2: "55% 60%",
  hallRedChairs: "52% 55%",
  hallRedChairsTall: "40% 60%",
  vipGrand: "50% 55%",
  vipGrandTall: "85% 50%",
  vipGrand2: "60% 55%",
  vipTableTop: "42% 45%",
  vipTableTop2: "50% 45%",
  vipLounge: "38% 55%",
  vipChandelier: "55% 60%",
  vipRoom: "50% 60%",
  vipTable: "50% 60%",
  vipTable2: "50% 62%",
  vipDoorwayTall: "45% 60%",
  vipSignTall: "30% 50%",
  boothRoundWindow: "55% 50%",
  boothTall: "50% 55%",
  boothWindow: "50% 62%",
  boothSofa: "42% 55%",
  boothWindow2: "50% 62%",
  privateRoom: "62% 65%",
  bar: "45% 50%",
  stageTall: "50% 30%",
  decorSideboard: "45% 45%",
  decorTeapots: "55% 40%",
  decorShelf: "50% 50%",
  decorFan: "50% 65%",
  corridorTall: "50% 60%",
  tablewareDrawer: "50% 50%",
  tablewareCabinet: "50% 50%",
  tablewareCutlery: "50% 50%",
  tablewarePlates: "50% 50%",
};

/** Rasm izohi (Gallery2.<kalit>) va bezak ieroglifi — mazmuniga qarab */
export type CapKey =
  | "capHall" | "capUmbrellas" | "capLattice" | "capLongTable" | "capRoundTable" | "capVipGrand" | "capVipTable"
  | "capVip" | "capVipDoor" | "capMoonWindow" | "capBooth" | "capPrivate" | "capBar" | "capStage" | "capDecor"
  | "capShelf" | "capCorridor" | "capFacade" | "capGate" | "capTableware";

const CAPTION: Record<PhotoName, CapKey> = {
  extFacade: "capFacade",
  extGate: "capGate",
  extStreet: "capFacade",
  extDoorTall: "capGate",
  hallUmbrellas: "capUmbrellas",
  hallBarView: "capHall",
  hallPartitions: "capLattice",
  hallLattice: "capLattice",
  hallLongTable: "capLongTable",
  hallWide: "capHall",
  hallRoundTable: "capRoundTable",
  hallRoundTable2: "capRoundTable",
  hallLongTable2: "capLongTable",
  hallRedChairs: "capRoundTable",
  hallRedChairsTall: "capHall",
  vipGrand: "capVipGrand",
  vipGrandTall: "capVipGrand",
  vipGrand2: "capVipGrand",
  vipTableTop: "capVipTable",
  vipTableTop2: "capVipTable",
  vipLounge: "capVip",
  vipChandelier: "capVip",
  vipRoom: "capVip",
  vipTable: "capVip",
  vipTable2: "capVip",
  vipDoorwayTall: "capVipDoor",
  vipSignTall: "capVipDoor",
  boothRoundWindow: "capMoonWindow",
  boothTall: "capBooth",
  boothWindow: "capBooth",
  boothSofa: "capBooth",
  boothWindow2: "capBooth",
  privateRoom: "capPrivate",
  bar: "capBar",
  stageTall: "capStage",
  decorSideboard: "capDecor",
  decorTeapots: "capDecor",
  decorShelf: "capShelf",
  decorFan: "capDecor",
  corridorTall: "capCorridor",
  tablewareDrawer: "capTableware",
  tablewareCabinet: "capTableware",
  tablewareCutlery: "capTableware",
  tablewarePlates: "capTableware",
};

const GLYPH: Record<CapKey, string> = {
  capHall: "厅",
  capUmbrellas: "伞",
  capLattice: "格",
  capLongTable: "宴",
  capRoundTable: "圆",
  capVipGrand: "贵",
  capVipTable: "席",
  capVip: "雅",
  capVipDoor: "门",
  capMoonWindow: "月",
  capBooth: "窗",
  capPrivate: "静",
  capBar: "吧",
  capStage: "台",
  capDecor: "古",
  capShelf: "藏",
  capCorridor: "廊",
  capFacade: "长安",
  capGate: "门",
  capTableware: "器",
};

const NAME_BY_SRC = new Map<string, PhotoName>(
  (Object.keys(PHOTOS) as PhotoName[]).map((n) => [PHOTOS[n].src, n])
);

/** Haqiqiy rasm nomi (PHOTOS kaliti) → Pic. pos berilsa — shu joy uchun maxsus kesim */
export function pic(name: PhotoName, pos?: string): Pic {
  const p: Photo = PHOTOS[name];
  return { src: p.src, md: p.md, w: p.w, h: p.h, kind: p.kind, name, pos: pos ?? FOCUS[name] };
}

/** Photo obyektidan (masalan GALLERY ro'yxati) */
export function picOf(p: Photo): Pic {
  const name = NAME_BY_SRC.get(p.src);
  return name ? pic(name) : { src: p.src, md: p.md, w: p.w, h: p.h, kind: p.kind };
}

/** Bazadagi rasm / taom rasmi (bitta o'lcham) */
export function urlPic(url: string | null | undefined): Pic | null {
  return url ? { src: url } : null;
}

/** md o'lchamining kengligi (fayllar: ≥1350px → yarmi, kichiklari → 3/4) */
function mdWidth(w: number) {
  return w >= 1350 ? Math.round(w / 2) : Math.round(w * 0.75);
}

/** srcSet: md + katta (telefon/kartada md yuklanadi) */
export function srcSetOf(p: Pic): string | undefined {
  if (!p.md || !p.w) return undefined;
  return `${p.md} ${mdWidth(p.w)}w, ${p.src} ${p.w}w`;
}

export function captionKeyOf(p: Pic): CapKey | null {
  return p.name ? CAPTION[p.name] : null;
}

export function picGlyph(p: Pic, fallback = "长安"): string {
  const k = captionKeyOf(p);
  return k ? GLYPH[k] : fallback;
}

/** Galereya (to'liq ro'yxat) — saralangan tartibda */
export const GALLERY_PICS: Pic[] = GALLERY.map(picOf);
