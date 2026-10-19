/**
 * Restoranning 2D rejasi (Aziz yuborgan "RESTORAN REJASI" rasmi asosida, koordinatalar o'sha
 * rasm piksellarida: 1536×1024). Xarita admin inventarida va keyin mijozlar saytida ishlatiladi.
 *
 * Tuzatish (Aziz): rasmdagi qizil joydagi hojatxonalar yashil joyga ko'chirildi, qizil joy — yo'lak.
 * Shu sababli katta zaldagi stollar biroz o'ngga surilgan.
 *
 * Eslatma: reja 100% aniq emas — xonalardagi o'rinlar soni keyin inventar bilan birga to'g'rilanadi.
 * Faqat ma'lumot (React yo'q) — server va klientda ishlatsa bo'ladi.
 */

export type Rect = { x: number; y: number; w: number; h: number };

/** Stol atrofidagi stullar: to'rtburchak stolda har tomonda nechta */
export type ChairSides = { top: number; right: number; bottom: number; left: number };

export type FloorTable = {
  id: string;
  shape: "round" | "rect" | "booth" | "bar";
  /** Markaz */
  cx: number;
  cy: number;
  /** round: r ishlatiladi; rect/booth/bar: w×h */
  r?: number;
  w?: number;
  h?: number;
  seats: number;
  /** rect stol uchun stullar joylashuvi (bo'lmasa — seats bo'yicha avtomatik) */
  chairs?: ChairSides;
};

export type RoomKind =
  | "vip" | "hall" | "room" | "booth" | "private"
  | "bar" | "kitchen" | "wc" | "reception" | "entrance" | "corridor";

export type Decor =
  | { type: "rect"; x: number; y: number; w: number; h: number; rx?: number }
  | { type: "arrow"; x: number; y: number }
  | { type: "wc"; x: number; y: number };

export type FloorRoom = {
  id: string;
  kind: RoomKind;
  /** VIP 1, Xona 2, Kabina 3 — nomdagi raqam */
  num?: number;
  rect: Rect;
  /** Yozuv joyi (bo'lmasa — xona markazi) */
  label?: { x: number; y: number };
  /** Xaritada yoziladigan qisqa yozuv (bo'lmasa — xona nomi) */
  short?: string;
  tables: FloorTable[];
  decor?: Decor[];
  /** Mijoz band qila oladimi (keyingi bosqich — saytdagi xarita uchun) */
  bookable: boolean;
};

/** Faqat ovqatlanish joylari (stol jihozlari shu yerda hisoblanadi) */
export const DINING_KINDS: RoomKind[] = ["vip", "hall", "room", "booth", "private"];

/** Xarita ko'rinadigan maydon (rasmdagi bino atrofi) */
export const VIEWBOX: Rect = { x: 40, y: 60, w: 1450, h: 880 };
/** Bino tashqi devori */
export const BUILDING: Rect = { x: 150, y: 120, w: 1315, h: 800 };

const round = (id: string, cx: number, cy: number, r: number, seats: number): FloorTable =>
  ({ id, shape: "round", cx, cy, r, seats });

const rect = (id: string, cx: number, cy: number, w: number, h: number, chairs: ChairSides): FloorTable =>
  ({ id, shape: "rect", cx, cy, w, h, chairs, seats: chairs.top + chairs.right + chairs.bottom + chairs.left });

// Katta zal: 2 qator × 4 ta dumaloq stol (6 kishilik) + uzun stol (14 kishilik)
const HALL_COLS = [590, 710, 830, 950];
const HALL_ROWS = [445, 585];
const hallTables: FloorTable[] = [
  ...HALL_ROWS.flatMap((cy, r) => HALL_COLS.map((cx, c) => round(`hall-${r * 4 + c + 1}`, cx, cy, 38, 6))),
  rect("hall-long", 1092, 537, 48, 205, { top: 1, right: 6, bottom: 1, left: 6 }),
];

// Kabinachalar: 6 ta kabina, har birida 2 ta o'rindiq (yuqori va pastki) — 4 kishilik
const BOOTH_W = 68;
const booths: FloorRoom[] = Array.from({ length: 6 }, (_, i) => {
  const x = 750 + i * 76;
  return {
    id: `booth-${i + 1}`,
    kind: "booth" as const,
    num: i + 1,
    rect: { x, y: 778, w: BOOTH_W, h: 130 },
    short: String(i + 1),
    tables: [{ id: `booth-${i + 1}-t`, shape: "booth" as const, cx: x + BOOTH_W / 2, cy: 843, w: BOOTH_W - 16, h: 40, seats: 4 }],
    bookable: true,
  };
});

export const ROOMS: FloorRoom[] = [
  // ---- Yuqori qator: 3 ta VIP + oshxona ----
  { id: "vip-1", kind: "vip", num: 1, rect: { x: 160, y: 128, w: 272, h: 200 }, label: { x: 297, y: 230 },
    tables: [round("vip-1-t", 297, 230, 58, 8)], bookable: true },
  { id: "vip-2", kind: "vip", num: 2, rect: { x: 445, y: 128, w: 185, h: 200 }, label: { x: 537, y: 228 },
    tables: [round("vip-2-t", 537, 228, 46, 8)], bookable: true },
  { id: "vip-3", kind: "vip", num: 3, rect: { x: 640, y: 128, w: 225, h: 200 }, label: { x: 752, y: 228 },
    tables: [round("vip-3-t", 752, 228, 48, 8)], bookable: true },
  { id: "kitchen", kind: "kitchen", rect: { x: 878, y: 128, w: 578, h: 200 }, label: { x: 1167, y: 230 },
    tables: [], bookable: false,
    decor: [
      { type: "rect", x: 945, y: 140, w: 60, h: 42, rx: 3 }, { type: "rect", x: 1035, y: 140, w: 50, h: 42, rx: 3 },
      { type: "rect", x: 1090, y: 140, w: 52, h: 42, rx: 3 }, { type: "rect", x: 1150, y: 140, w: 140, h: 42, rx: 3 },
      { type: "rect", x: 1300, y: 140, w: 140, h: 30, rx: 3 }, { type: "rect", x: 888, y: 205, w: 30, h: 75, rx: 3 },
      { type: "rect", x: 965, y: 300, w: 400, h: 20, rx: 3 }, { type: "rect", x: 1410, y: 228, w: 32, h: 92, rx: 3 },
    ] },

  // ---- Chap ustun: 2 ta VIP (to'rtburchak stol) + bar ----
  { id: "vip-4", kind: "vip", num: 4, rect: { x: 160, y: 345, w: 172, h: 180 }, label: { x: 247, y: 440 },
    tables: [rect("vip-4-t", 247, 440, 64, 105, { top: 1, right: 2, bottom: 1, left: 2 })], bookable: true },
  { id: "vip-5", kind: "vip", num: 5, rect: { x: 160, y: 542, w: 172, h: 182 }, label: { x: 247, y: 636 },
    tables: [rect("vip-5-t", 247, 636, 64, 105, { top: 1, right: 2, bottom: 1, left: 2 })], bookable: true },
  { id: "bar", kind: "bar", rect: { x: 160, y: 745, w: 280, h: 170 }, label: { x: 297, y: 832 },
    tables: [{ id: "bar-t", shape: "bar", cx: 297, cy: 824, w: 210, h: 46, seats: 5 }], bookable: false,
    decor: [
      { type: "rect", x: 240, y: 765, w: 36, h: 18, rx: 2 }, { type: "rect", x: 298, y: 765, w: 36, h: 18, rx: 2 },
      { type: "rect", x: 356, y: 765, w: 36, h: 18, rx: 2 },
    ] },

  // ---- Qizil joy (rasmda) — endi yo'lak ----
  { id: "corridor", kind: "corridor", rect: { x: 336, y: 345, w: 88, h: 380 }, tables: [], bookable: false },
  // ---- Yashil joy (rasmda) — hojatxonalar shu yerga ko'chirildi ----
  { id: "wc-1", kind: "wc", num: 1, rect: { x: 428, y: 345, w: 80, h: 160 }, label: { x: 468, y: 458 }, short: "WC", tables: [], bookable: false,
    decor: [{ type: "wc", x: 468, y: 410 }] },
  { id: "wc-2", kind: "wc", num: 2, rect: { x: 428, y: 510, w: 80, h: 165 }, label: { x: 468, y: 626 }, short: "WC", tables: [], bookable: false,
    decor: [{ type: "wc", x: 468, y: 578 }] },

  // ---- Katta zal ----
  { id: "hall", kind: "hall", rect: { x: 512, y: 345, w: 720, h: 345 }, label: { x: 830, y: 652 },
    tables: hallTables, bookable: true,
    decor: [{ type: "rect", x: 1185, y: 405, w: 40, h: 68, rx: 2 }, { type: "rect", x: 1185, y: 545, w: 40, h: 68, rx: 2 }] },

  // ---- O'ng tomon: 2 ta xona (stollar keyin belgilanadi) ----
  { id: "room-1", kind: "room", num: 1, rect: { x: 1245, y: 345, w: 210, h: 155 }, tables: [], bookable: true,
    decor: [{ type: "rect", x: 1422, y: 392, w: 20, h: 88, rx: 4 }] },
  { id: "room-2", kind: "room", num: 2, rect: { x: 1245, y: 515, w: 210, h: 172 }, tables: [], bookable: true,
    decor: [{ type: "rect", x: 1422, y: 568, w: 20, h: 88, rx: 4 }] },

  // ---- Pastki qator ----
  { id: "reception", kind: "reception", rect: { x: 480, y: 700, w: 185, h: 95 }, label: { x: 572, y: 765 },
    tables: [], bookable: false, decor: [{ type: "rect", x: 498, y: 732, w: 150, h: 22, rx: 3 }] },
  { id: "entrance", kind: "entrance", rect: { x: 455, y: 832, w: 205, h: 86 }, label: { x: 557, y: 893 },
    tables: [], bookable: false, decor: [{ type: "arrow", x: 557, y: 858 }] },
  ...booths,
  { id: "private", kind: "private", rect: { x: 1243, y: 792, w: 212, h: 123 }, label: { x: 1345, y: 852 },
    tables: [rect("private-t", 1345, 852, 112, 46, { top: 2, right: 1, bottom: 2, left: 1 })], bookable: true },

  // ---- Bino tashqarisidagi hojatxonalar (rasmda ham bor) ----
  { id: "wc-3", kind: "wc", num: 3, rect: { x: 66, y: 126, w: 84, h: 86 }, label: { x: 108, y: 146 }, short: "WC", tables: [], bookable: false,
    decor: [{ type: "wc", x: 108, y: 186 }] },
  { id: "wc-4", kind: "wc", num: 4, rect: { x: 440, y: 80, w: 140, h: 38 }, short: "WC", tables: [], bookable: false },
];

/** Kabinachalar guruhi ramkasi (bitta umumiy yozuv bilan) */
export const BOOTH_GROUP: Rect = { x: 737, y: 745, w: 475, h: 172 };

export function roomSeats(room: FloorRoom): { tables: number; seats: number } {
  return { tables: room.tables.length, seats: room.tables.reduce((s, t) => s + t.seats, 0) };
}

export function isDining(room: FloorRoom): boolean {
  return DINING_KINDS.includes(room.kind);
}

/** Butun xarita bo'yicha (faqat ovqatlanish joylari, bar hisobga olinmaydi) */
export function floorTotals(rooms: FloorRoom[] = ROOMS): { tables: number; seats: number } {
  return rooms.filter(isDining).reduce(
    (acc, r) => {
      const s = roomSeats(r);
      return { tables: acc.tables + s.tables, seats: acc.seats + s.seats };
    },
    { tables: 0, seats: 0 }
  );
}
