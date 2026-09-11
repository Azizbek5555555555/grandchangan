"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { ensureAdmin } from "../auth/guard";
import { normalizePhone } from "../utils";
import { notifyTelegram } from "../telegram/notify";

export async function submitInquiry(input: {
  name: string; phone: string; eventType: string; guestCount: number; preferredDate?: string; message?: string;
}) {
  await prisma.eventInquiry.create({
    data: {
      name: input.name, phone: normalizePhone(input.phone), eventType: input.eventType,
      guestCount: input.guestCount, preferredDate: input.preferredDate ? new Date(input.preferredDate) : null,
      message: input.message || null, status: "NEW",
    },
  });
  await notifyTelegram(`🎉 Tadbir so'rovi: ${input.name} (${input.phone})\nTuri: ${input.eventType}, ${input.guestCount} kishi`);
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
