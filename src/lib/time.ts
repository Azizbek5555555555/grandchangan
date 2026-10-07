/**
 * Restoran vaqti. Samarqand = Toshkent mintaqasi (UTC+5, yozgi vaqt yo'q).
 * Server (Railway) UTC'da ishlaydi, shuning uchun sana/vaqtni serverning lokal
 * mintaqasida o'qish yoki chiqarish mumkin emas — hammasi shu yerdagi funksiyalar orqali.
 */
export const RESTAURANT_TZ = "Asia/Tashkent";
const RESTAURANT_OFFSET = "+05:00";

/** "2026-10-07" + "19:00" -> restoran vaqti bo'yicha aniq lahza */
export function restaurantDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00${RESTAURANT_OFFSET}`);
}

/** @db.Date ustuni uchun kalendar sanasi (UTC yarim tun) */
export function calendarDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}

/** Berilgan lahza restoran vaqtida qaysi kun: "YYYY-MM-DD" */
export function restaurantDay(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: RESTAURANT_TZ }).format(d);
}

/** "YYYY-MM-DD" ga n kun qo'shish (manfiy ham bo'ladi) */
export function addDays(dateStr: string, n: number): string {
  return new Date(calendarDate(dateStr).getTime() + n * 86400000).toISOString().slice(0, 10);
}

/** Sana/vaqtni restoran vaqtida chiqarish (server yoki brauzer mintaqasidan qat'i nazar) */
export function formatRestaurant(
  d: Date | string,
  opts: Intl.DateTimeFormatOptions = {},
  locale = "uz-UZ"
): string {
  return new Date(d).toLocaleString(locale, { ...opts, timeZone: RESTAURANT_TZ });
}
