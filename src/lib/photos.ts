/**
 * Restoranning haqiqiy rasmlari (Aziz, 2026-10-25) — public/photos/*.webp. Yagona manba: sahifalar rasmni
 * shu yerdan oladi. Har rasmning 2 o'lchami bor: src (1920–2400px, keng bloklar/hero) va md (960–1200px, kartalar).
 * Tashqi rasmlar Real-ESRGAN x4 bilan kattalashtirilgan. alt matni — messages "Photos.<kind>" kaliti.
 */

export type PhotoKind = "exterior" | "hall" | "vip" | "booth" | "private" | "bar" | "stage" | "decor" | "tableware";

export type Photo = {
  /** Katta (1920–2400px) */
  src: string;
  /** O'rta (960–1200px) */
  md: string;
  w: number;
  h: number;
  kind: PhotoKind;
};

const p = (name: string, w: number, h: number, kind: PhotoKind): Photo => ({
  src: `/photos/${name}.webp`,
  md: `/photos/${name}-md.webp`,
  w,
  h,
  kind,
});

export const PHOTOS = {
  extFacade: p("ext-facade", 2400, 1800, "exterior"),
  extGate: p("ext-gate", 2400, 1350, "exterior"),
  extStreet: p("ext-street", 2400, 1800, "exterior"),
  extDoorTall: p("ext-door-tall", 1350, 2400, "exterior"),
  hallUmbrellas: p("hall-umbrellas", 1920, 1440, "hall"),
  hallBarView: p("hall-bar-view", 1920, 1440, "hall"),
  hallPartitions: p("hall-partitions", 1920, 1440, "hall"),
  hallLattice: p("hall-lattice", 1920, 1440, "hall"),
  hallLongTable: p("hall-long-table", 1920, 1440, "hall"),
  hallWide: p("hall-wide", 1920, 1440, "hall"),
  hallRoundTable: p("hall-round-table", 1920, 1440, "hall"),
  hallRoundTable2: p("hall-round-table-2", 1920, 1440, "hall"),
  hallLongTable2: p("hall-long-table-2", 1920, 1440, "hall"),
  hallRedChairs: p("hall-red-chairs", 1920, 1440, "hall"),
  hallRedChairsTall: p("hall-red-chairs-tall", 720, 1280, "hall"),
  vipGrand: p("vip-grand", 1920, 1440, "vip"),
  vipGrandTall: p("vip-grand-tall", 1440, 1920, "vip"),
  vipGrand2: p("vip-grand-2", 1920, 1440, "vip"),
  vipTableTop: p("vip-table-top", 1920, 1440, "vip"),
  vipTableTop2: p("vip-table-top-2", 1920, 1440, "vip"),
  vipLounge: p("vip-lounge", 1920, 1440, "vip"),
  vipChandelier: p("vip-chandelier", 1920, 1440, "vip"),
  vipRoom: p("vip-room", 1920, 1440, "vip"),
  vipTable: p("vip-table", 1920, 1440, "vip"),
  vipTable2: p("vip-table-2", 1920, 1440, "vip"),
  vipDoorwayTall: p("vip-doorway-tall", 1440, 1920, "vip"),
  vipSignTall: p("vip-sign-tall", 1440, 1920, "vip"),
  boothRoundWindow: p("booth-round-window", 1280, 960, "booth"),
  boothTall: p("booth-tall", 1440, 1920, "booth"),
  boothWindow: p("booth-window", 1920, 1440, "booth"),
  boothSofa: p("booth-sofa", 1920, 1440, "booth"),
  boothWindow2: p("booth-window-2", 1920, 1440, "booth"),
  privateRoom: p("private-room", 1920, 1440, "private"),
  bar: p("bar", 1920, 1440, "bar"),
  stageTall: p("stage-tall", 720, 1280, "stage"),
  decorSideboard: p("decor-sideboard", 1920, 1440, "decor"),
  decorTeapots: p("decor-teapots", 1920, 1440, "decor"),
  decorShelf: p("decor-shelf", 1920, 1440, "decor"),
  decorFan: p("decor-fan", 1920, 1440, "decor"),
  corridorTall: p("corridor-tall", 1440, 1920, "decor"),
  tablewareDrawer: p("tableware-drawer", 1920, 1440, "tableware"),
  tablewareCabinet: p("tableware-cabinet", 1920, 1440, "tableware"),
  tablewareCutlery: p("tableware-cutlery", 1920, 1440, "tableware"),
  tablewarePlates: p("tableware-plates", 1920, 1440, "tableware"),
} as const satisfies Record<string, Photo>;

export type PhotoName = keyof typeof PHOTOS;

/** Bosh sahifa hero'si — restoran tashqaridan (almashinuvchi slaydlar) */
export const EXTERIOR: Photo[] = [PHOTOS.extFacade, PHOTOS.extGate, PHOTOS.extStreet, PHOTOS.extDoorTall];

/** Galereya uchun saralangan tartib (eng chiroylilari oldinda; tableware — faqat admin/inventar uchun) */
export const GALLERY: Photo[] = [
  PHOTOS.hallUmbrellas, PHOTOS.vipGrand, PHOTOS.boothRoundWindow, PHOTOS.hallRoundTable, PHOTOS.vipTableTop,
  PHOTOS.boothWindow, PHOTOS.hallPartitions, PHOTOS.vipLounge, PHOTOS.bar, PHOTOS.hallBarView, PHOTOS.privateRoom,
  PHOTOS.vipGrand2, PHOTOS.hallLongTable, PHOTOS.boothSofa, PHOTOS.decorSideboard, PHOTOS.vipChandelier,
  PHOTOS.hallRoundTable2, PHOTOS.decorShelf, PHOTOS.boothWindow2, PHOTOS.vipTableTop2, PHOTOS.hallRedChairs,
  PHOTOS.decorTeapots, PHOTOS.vipTable, PHOTOS.hallLattice, PHOTOS.hallWide, PHOTOS.extFacade, PHOTOS.extGate,
  PHOTOS.vipGrandTall, PHOTOS.boothTall, PHOTOS.stageTall, PHOTOS.vipSignTall, PHOTOS.corridorTall,
];

/** Zal xaritasidagi xona turlari uchun rasm (FloorMap ROOMS[].kind bilan mos) */
export const ROOM_PHOTOS: Record<"vip" | "hall" | "booth" | "private", Photo[]> = {
  vip: [PHOTOS.vipGrand, PHOTOS.vipTableTop, PHOTOS.vipLounge, PHOTOS.vipChandelier],
  hall: [PHOTOS.hallUmbrellas, PHOTOS.hallRoundTable, PHOTOS.hallLongTable, PHOTOS.hallPartitions],
  booth: [PHOTOS.boothWindow, PHOTOS.boothRoundWindow, PHOTOS.boothSofa],
  private: [PHOTOS.privateRoom],
};
