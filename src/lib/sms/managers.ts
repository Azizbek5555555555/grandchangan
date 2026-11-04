import "server-only";
import { prisma } from "../prisma";
import { parseUzPhone } from "../phone";
import { sendSms, type SmsResult } from "./eskiz";

/** Menejer telefonlari: Admin → Sozlamalar → "Yangi bron SMS'i" + Railway'dagi BOOKING_SMS_PHONES (vergul bilan) */
export async function managerPhones(): Promise<string[]> {
  const general = await prisma.siteSetting.findUnique({ where: { key: "general" } }).catch(() => null);
  const raw = (general?.value as { bookingPhones?: unknown } | null)?.bookingPhones;
  const list = [...(Array.isArray(raw) ? raw : []), ...(process.env.BOOKING_SMS_PHONES || "").split(",")];
  return [...new Set(list.map((p) => parseUzPhone(String(p))).filter((p): p is string => !!p))].slice(0, 5);
}

/** SMS natijasini jurnalga yozish (Admin → Sozlamalar → "Oxirgi SMS'lar") */
export async function logSms(target: string, template: string, message: string, result: SmsResult): Promise<void> {
  await prisma.notificationLog
    .create({ data: { channel: "sms", target, template, payload: { message }, status: result.ok ? (result.dev ? "DEV" : "SENT") : "FAILED", error: result.error ?? null } })
    .catch(() => null);
}

/** SMS yuborish + jurnalga yozish (xato otmaydi) */
export async function sendSmsLogged(phone: string, message: string, template: string): Promise<SmsResult> {
  const result = await sendSms(phone, message);
  await logSms(phone.replace(/\D/g, ""), template, message, result);
  return result;
}

/**
 * Menejer(lar)ga SMS. Har yuborish NotificationLog'ga yoziladi (SMS kelmasa — Eskiz xatosi shu yerda).
 * Hech qachon xato otmaydi: bron baribir saqlanadi.
 */
export async function notifyManagersSms(message: string, template = "booking-manager"): Promise<{ phone: string; result: SmsResult }[]> {
  const out: { phone: string; result: SmsResult }[] = [];
  try {
    for (const to of await managerPhones()) {
      out.push({ phone: to, result: await sendSmsLogged(to, message, template) });
    }
  } catch (err) {
    console.error("[SMS] menejerga yuborilmadi:", err);
  }
  return out;
}
