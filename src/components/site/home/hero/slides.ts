import { PHOTOS, type Photo } from "@/lib/photos";

/**
 * Hero slayd-shousi: restoranning tashqi rasmlari (lib/photos.ts → PHOTOS.ext*). Tartib — eng "xitoycha"
 * kadr (fonarli darvoza) birinchi: u telefonda ham, kompyuterda ham to'liq sig'adi (LCP rasmi).
 *
 * Kadrlash har rasm ochib ko'rilib tanlangan (peshtoq/yozuv kesilmasin):
 * - `pos` — Tailwind sinflari: --fx/--fy (object-position kabi, %). Telefonda rasm balandlik bo'yicha
 *   joylashadi va ortiqcha kengligi --fx bilan suriladi; kompyuterda (lg) asosan --fy ishlaydi.
 * - `desk` / `mob` — Ken Burns: transform-origin (muhim nuqta), masshtab (dan → gacha) va telefonda
 *   gorizontal panorama (--fx dan → gacha): keng peshtoq yozuvi telefonda kamera bilan "o'qiladi".
 */

export type SlideKey = "Gate" | "Facade" | "Street" | "Door";

export type Frame = {
  /** transform-origin (masalan "52% 22%") — kattalashish shu nuqtadan, oy-darvoza o'tishi markazi ham shu */
  origin: string;
  zoom: [number, number];
  /** Telefonda gorizontal panorama: --fx boshidan oxirigacha (boshlanishi `pos` dagi --fx bilan bir xil) */
  pan?: [number, number];
};

export type HeroSlide = {
  key: SlideKey;
  photo: Photo;
  /** HUD dagi kichik xitoycha nom */
  cn: string;
  /** O'ng chetdagi vertikal xitoycha yozuv (bezak) */
  verse: string;
  /** --fx/--fy sinflari (telefon va lg) */
  pos: string;
  desk: Frame;
  mob: Frame;
  /** Vertikal rasm: lg+ da to'liq ekranga cho'zilmaydi — "osma o'ram" ramkasida (telefonda — asosiy slayd) */
  tall?: boolean;
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    key: "Gate",
    photo: PHOTOS.extGate,
    cn: "牌楼",
    verse: "宾至如归",
    // Darvoza rasmning 48% ida: telefonda markazda, kompyuterda chap chetga yopishtirilib o'ngroqqa (matndan nari)
    pos: "[--fx:44] [--fy:30] lg:[--fx:0] lg:[--fy:30]",
    desk: { origin: "54% 22%", zoom: [1, 1.1] },
    mob: { origin: "50% 22%", zoom: [1, 1.08], pan: [44, 54] },
  },
  {
    key: "Facade",
    photo: PHOTOS.extFacade,
    cn: "外观",
    verse: "长安大饭店",
    // Diagonal "GRAND CHANG'AN RESTORANI" yozuvi tepada — kompyuterda rasm yuqoridan; telefonda chapdan o'ngga panorama
    pos: "[--fx:0] [--fy:0] lg:[--fx:50] lg:[--fy:0]",
    // Kompyuterda: chap-pastdan kattalashadi — yozuv yuqoriga va o'ngga (sarlavhadan nari) suriladi
    desk: { origin: "0% 100%", zoom: [1.08, 1.16] },
    mob: { origin: "50% 30%", zoom: [1, 1.04], pan: [0, 100] },
  },
  {
    key: "Street",
    photo: PHOTOS.extStreet,
    cn: "街景",
    verse: "丝路长安",
    // Yozuv (x 30–75%, y 35–45%) — kompyuterda pastroqdan kesib, yozuv matn ustida, tepada qolsin
    pos: "[--fx:46] [--fy:50] lg:[--fx:50] lg:[--fy:85]",
    desk: { origin: "55% 28%", zoom: [1.02, 1.12] },
    mob: { origin: "56% 38%", zoom: [1, 1.06], pan: [46, 64] },
  },
  {
    key: "Door",
    photo: PHOTOS.extDoorTall,
    cn: "大门",
    verse: "开门迎客",
    // Pastki chapda qurilish qoldiqlari — yuqori qism (长安大饭店 lavhasi + eshik) ko'rinadi
    pos: "[--fx:50] [--fy:16] lg:[--fx:50] lg:[--fy:22]",
    // Ramka 3:4 — kattalashish lavha va eshik tomon (tepadagi derazalar va pastdagi qoldiqlar chetga chiqadi)
    desk: { origin: "50% 46%", zoom: [1.1, 1.18] },
    mob: { origin: "50% 36%", zoom: [1, 1.08] },
    tall: true,
  },
];

/** srcSet: md (yarim o'lcham) + katta — telefonda md yuklanadi */
export function srcSetOf(p: Photo) {
  return `${p.md} ${Math.round(p.w / 2)}w, ${p.src} ${p.w}w`;
}
