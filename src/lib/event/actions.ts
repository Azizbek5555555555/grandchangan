"use server";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { prisma } from "../prisma";
import { ensureAdmin } from "../auth/guard";
import { normalizePhone } from "../utils";
import { notifyTelegram, escapeHtml } from "../telegram/notify";
import { rateLimit, clientIp, HOUR } from "../security/rate-limit";

export async function submitInquiry(input: {
  name: string; phone: string; eventType: string; guestCount: number; preferredDate?: string; message?: string;
}) {
  const e = await getTranslations("Errors");
  const name = (input.name || "").trim().slice(0, 80);
  const phone = normalizePhone(input.phone || "");
  const eventType = (input.eventType || "").trim().slice(0, 60);
  const guestCount = Number(input.guestCount);
  if (!name) return { ok: false, error: e("nameRequired") };
  if (phone.length < 12) return { ok: false, error: e("phoneInvalid") };
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 2000) return { ok: false, error: e("guestsInvalid") };
  const preferredDate = input.preferredDate && /^\d{4}-\d{2}-\d{2}$/.test(input.preferredDate) ? new Date(`${input.preferredDate}T00:00:00Z`) : null;
  if (!rateLimit(`event-ip:${await clientIp()}`, 5, HOUR)) return { ok: false, error: e("tooMany") };
  await prisma.eventInquiry.create({
    data: {
      name, phone, eventType, guestCount, preferredDate,
      message: input.message?.trim().slice(0, 1000) || null, status: "NEW",
    },
  });
  await notifyTelegram(`🎉 Tadbir so'rovi: ${escapeHtml(name)} (${phone})\nTuri: ${escapeHtml(eventType)}, ${guestCount} kishi`);
  revalidatePath("/[locale]/admin/events", "page");
  return { ok: true };
}
export async function updateInquiryStatus(id: string, status: string) {
  await ensureAdmin();
  await prisma.eventInquiry.update({ where: { id }, data: { status } });
  revalidatePath("/[locale]/admin/events", "page");
  return { ok: true };
}
export async function deleteInquiry(id: string) {
  await ensureAdmin();
  await prisma.eventInquiry.delete({ where: { id } });
  revalidatePath("/[locale]/admin/events", "page");
  return { ok: true };
}
