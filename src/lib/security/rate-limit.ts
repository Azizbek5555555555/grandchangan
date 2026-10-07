import "server-only";
import { headers } from "next/headers";

/**
 * Oddiy xotiradagi cheklagich (sliding window). Railway'da bitta instans ishlaydi — shu yetarli;
 * server qayta ishga tushsa hisob nolga tushadi (bu xavfsizlik uchun muammo emas).
 * Chegaralar ataylab keng: mehmonxona Wi-Fi'si yoki bitta gid bir nechta guruhga bron qilsa
 * ham to'sib qo'ymasligi kerak — maqsad faqat avtomatik hujum va spamni to'xtatish.
 */
const hits = new Map<string, number[]>();

/** Ruxsat bo'lsa true qaytaradi va urinishni hisoblaydi; chegara oshgan bo'lsa false. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (list.length >= limit) {
    hits.set(key, list);
    return false;
  }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 10000) sweep(now);
  return true;
}

/** Muvaffaqiyatli kirishdan keyin urinishlar hisobini tozalash */
export function clearLimit(key: string): void {
  hits.delete(key);
}

function sweep(now: number) {
  for (const [k, v] of hits) {
    if (!v.length || now - v[v.length - 1] > 24 * 60 * 60 * 1000) hits.delete(k);
  }
}

/**
 * Mijoz IP manzili. Railway edge X-Forwarded-For'ni o'zi yozadi (mijoz o'zgartira olmaydi),
 * birinchi qiymat — haqiqiy IP. Lokal dev'da header bo'lmasa "local".
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
export const TOO_MANY = "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring.";
