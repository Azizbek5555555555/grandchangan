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

// ---------- Sana yozuvlari (brauzer ICU'sida o'zbekcha oy nomlari yo'q: Chrome "M10 20" chiqaradi) ----------
const UZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const UZ_WEEKDAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"]; // dushanbadan

/** "2026-10-20" → "20-oktabr" / "20 октября" / "October 20" */
export function formatDayMonth(dateStr: string, locale: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  if (locale === "uz") return `${d}-${UZ_MONTHS[m - 1]}`;
  try {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(Date.UTC(y, m - 1, d, 12));
  } catch {
    return dateStr;
  }
}

/** Kalendar sarlavhasi: "Oktabr 2026" / "октябрь 2026 г." (month0 — 0..11) */
export function formatMonthYear(year: number, month0: number, locale: string): string {
  if (locale === "uz") return `${UZ_MONTHS[month0][0].toUpperCase()}${UZ_MONTHS[month0].slice(1)} ${year}`;
  const s = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(Date.UTC(year, month0, 15));
  // Faqat birinchi harf katta ("октябрь 2026 г." → "Октябрь 2026 г.")
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Hafta kunining qisqa nomi, dushanbadan boshlab (i: 0 = dushanba) */
export function weekdayShort(i: number, locale: string): string {
  if (locale === "uz") return UZ_WEEKDAYS[i];
  return new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(Date.UTC(2024, 0, 1 + i, 12));
}
