import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Ko'p tilli JSON fielddan matn olish */
export type Localized = Partial<Record<"uz" | "ru" | "en" | "zh", string>>;

export function t(value: unknown, locale: string, fallback = "uz"): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  const obj = value as Localized;
  return obj[locale as keyof Localized] || obj[fallback as keyof Localized] || "";
}

/** Summani so'm formatida chiqarish */
export function formatMoney(value: number | string, currency = "so'm"): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "0 " + currency;
  // Deterministik formatlash (server va klient bir xil bo'lishi uchun — Intl locale
  // farqi hydration xatosiga sabab bo'lardi). Bo'shliq ajratgich.
  const rounded = Math.round(n);
  const grouped = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (rounded < 0 ? "-" : "") + grouped + " " + currency;
}

/** Kod generatsiya: GC-000123 */
export function genCode(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(6, "0")}`;
}

/** Telefon raqamini normallashtirish -> faqat raqamlar */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("998") ? digits : "998" + digits.replace(/^0+/, "");
}

/** Slug yasash (translit + tozalash) */
export function slugify(input: string): string {
  const map: Record<string, string> = {
    "'": "", "ʻ": "", "’": "",
    " ": "-", "_": "-",
  };
  const base = (input || "item")
    .toLowerCase()
    .replace(/[ʻ'’ _]/g, (m) => map[m] ?? "-")
    .replace(/[^a-z0-9\u4e00-\u9fff-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "item";
}
