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
  const p = restaurantParts(d);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Restoran vaqtidagi raqamli qismlar (en-US formatToParts — Node va brauzerda barqaror) */
function restaurantParts(d: Date): Record<string, string> {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: RESTAURANT_TZ,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value])
  );
}

/** "YYYY-MM-DD" ga n kun qo'shish (manfiy ham bo'ladi) */
export function addDays(dateStr: string, n: number): string {
  return new Date(calendarDate(dateStr).getTime() + n * 86400000).toISOString().slice(0, 10);
}

/**
 * Sana/vaqtni restoran vaqtida chiqarish: "08.10.2026 20:00".
 * toLocaleString("uz-UZ") ishlatilmaydi — Node va brauzer uz formatini turlicha chiqaradi
 * ("08/10, 20:00" va "10-08 20:00"), bu hydration xatosiga va chalkash sanaga olib kelardi.
 * Raqamlar en-US formatToParts'dan olinadi (barqaror) va qo'lda yig'iladi.
 */
export function formatRestaurant(
  d: Date | string,
  { year = true, time = true }: { year?: boolean; time?: boolean } = {}
): string {
  const parts = restaurantParts(new Date(d));
  const date = `${parts.day}.${parts.month}${year ? `.${parts.year}` : ""}`;
  return time ? `${date} ${parts.hour}:${parts.minute}` : date;
}
