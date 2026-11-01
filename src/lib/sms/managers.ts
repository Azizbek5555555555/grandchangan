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

/**
 * Menejer(lar)ga SMS. Har yuborish NotificationLog'ga yoziladi (SMS kelmasa — Eskiz xatosi shu yerda).
 * Hech qachon xato otmaydi: bron baribir saqlanadi.
 */
export async function notifyManagersSms(message: string, template = "booking-manager"): Promise<{ phone: string; result: SmsResult }[]> {
  const out: { phone: string; result: SmsResult }[] = [];
  try {
    for (const to of await managerPhones()) {
      const result = await sendSms(to, message);
      out.push({ phone: to, result });
      await prisma.notificationLog
        .create({ data: { channel: "sms", target: to, template, payload: { message }, status: result.ok ? (result.dev ? "DEV" : "SENT") : "FAILED", error: result.error ?? null } })
        .catch(() => null);
    }
  } catch (err) {
    console.error("[SMS] menejerga yuborilmadi:", err);
  }
  return out;
}
