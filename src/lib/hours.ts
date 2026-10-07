/**
 * Ish vaqti (admin -> Sozlamalar -> Ish vaqti) asosida bron soatlarini hisoblash.
 * Server va brauzerda bir xil ishlaydi.
 */
export type DayHours = { dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean };

/** Bitta bron qancha davom etadi (stol shu vaqtga band bo'ladi) */
export const SLOT_MINUTES = 120;

/** Bazada yozuv bo'lmasa — har kuni 11:00–23:00 */
export const DEFAULT_HOURS: DayHours[] = Array.from({ length: 7 }, (_, d) => ({
  dayOfWeek: d, openTime: "11:00", closeTime: "23:00", isClosed: false,
}));

const toMin = (hm: string) => {
  const [h, m] = hm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
const toHM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** "YYYY-MM-DD" qaysi hafta kuni: 0 = yakshanba ... 6 = shanba (Sozlamalar bilan bir xil) */
export function dayOfWeekOf(dateStr: string): number {
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay();
}

export function hoursFor(hours: DayHours[], dayOfWeek: number): DayHours {
  return hours.find((h) => h.dayOfWeek === dayOfWeek) ?? DEFAULT_HOURS[dayOfWeek];
}

/**
 * Kun uchun bron boshlanish vaqtlari: ochilishdan boshlab har soatda, oxirgisi —
 * yopilishdan SLOT_MINUTES oldin (11:00–23:00 -> 11:00 ... 21:00). Yopiq kun — bo'sh ro'yxat.
 * Yarim tundan keyin yopilsa (masalan 02:00), bron faqat shu kun ichida (23:00 gacha) boshlanadi.
 */
export function slotsForDay(h: DayHours | undefined): string[] {
  if (!h || h.isClosed) return [];
  const open = toMin(h.openTime);
  let close = toMin(h.closeTime);
  if (close <= open) close += 24 * 60;
  const out: string[] = [];
  for (let t = open; t + SLOT_MINUTES <= close && t < 24 * 60; t += 60) out.push(toHM(t));
  return out;
}

/** Barcha kunlar ochiq va bir xil vaqtdami (footer'da "Har kuni" deb ko'rsatish uchun) */
export function sameEveryDay(hours: DayHours[]): DayHours | null {
  const all = Array.from({ length: 7 }, (_, d) => hoursFor(hours, d));
  const first = all[0];
  return all.every((h) => !h.isClosed && h.openTime === first.openTime && h.closeTime === first.closeTime) ? first : null;
}
