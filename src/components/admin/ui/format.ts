import { RESTAURANT_TZ, formatDayMonth, restaurantDay } from "@/lib/time";

/**
 * Admin uchun sana/vaqt yozuvi joriy tilda, restoran vaqtida (Asia/Tashkent):
 *   uz "26-oktabr, 19:00" · ru "26 окт., 19:00" · en "Oct 26, 19:00" · zh "10月26日 19:00".
 * Sana va soat alohida formatlanib qo'lda ulanadi — Node va brauzer ICU'sidagi
 * "sana+vaqt" bog'lovchisi farqi hydration xatosiga olib kelmasin.
 */
export function fmtDate(
  d: Date | string,
  locale: string,
  { year = false, time = true, month = "short" }: { year?: boolean; time?: boolean; month?: "short" | "long" } = {}
): string {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  let day: string;
  if (locale === "uz") {
    const ymd = restaurantDay(date);
    day = formatDayMonth(ymd, "uz") + (year ? ` ${ymd.slice(0, 4)}` : "");
  } else {
    try {
      day = new Intl.DateTimeFormat(locale, {
        timeZone: RESTAURANT_TZ,
        day: "numeric",
        month,
        ...(year ? { year: "numeric" } : {}),
      }).format(date);
    } catch {
      day = restaurantDay(date);
    }
  }
  if (!time) return day;
  return `${day}${locale === "zh" ? " " : ", "}${fmtTime(date)}`;
}

/** Faqat soat: "19:05" (restoran vaqti) */
export function fmtTime(d: Date | string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: RESTAURANT_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(d));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("hour")}:${get("minute")}`;
}

/** Oddiy son: 12 345 (deterministik, formatMoney bilan bir xil ajratgich) */
export function fmtNumber(n: number): string {
  const r = Math.round(n);
  return (r < 0 ? "-" : "") + String(Math.abs(r)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
