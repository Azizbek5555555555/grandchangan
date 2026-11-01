"use server";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { ensureAdmin } from "../auth/guard";
import { eskizStatus } from "../sms/eskiz";
import { managerPhones, notifyManagersSms } from "../sms/managers";
import { restaurantDay } from "../time";

export async function saveSetting(key: string, value: Record<string, unknown>) {
  await ensureAdmin();
  const json = value as Prisma.InputJsonObject;
  await prisma.siteSetting.upsert({
    where: { key },
    update: { value: json },
    create: { key, value: json },
  });
  revalidatePath("/[locale]/admin/settings", "page");
  revalidatePath("/[locale]", "page");
  return { ok: true };
}

export async function saveWorkingHours(hours: { dayOfWeek: number; openTime: string | null; closeTime: string | null; isClosed: boolean }[]) {
  await ensureAdmin();
  await prisma.$transaction(
    hours.map((h) => {
      // Schema'da openTime/closeTime majburiy — bo'sh kelsa standart vaqt qo'yiladi
      const openTime = h.openTime || "10:00";
      const closeTime = h.closeTime || "23:00";
      return prisma.workingHour.upsert({
        where: { dayOfWeek: h.dayOfWeek },
        update: { openTime, closeTime, isClosed: h.isClosed },
        create: { dayOfWeek: h.dayOfWeek, openTime, closeTime, isClosed: h.isClosed },
      });
    })
  );
  revalidatePath("/[locale]/admin/settings", "page");
  return { ok: true };
}

/**
 * SMS tekshiruvi (Admin → Sozlamalar): Eskiz ulanganmi, kirish va balans; ulangan bo'lsa — menejer raqam(lar)iga
 * sinov SMS (yangi bron shabloni bilan — Eskiz faqat tasdiqlangan shablonni yuboradi). Natija NotificationLog'da ham.
 */
export async function smsCheck() {
  await ensureAdmin();
  const status = await eskizStatus();
  const phones = await managerPhones();
  let results: { phone: string; ok: boolean; error?: string }[] = [];
  if (status.auth && phones.length) {
    const sent = await notifyManagersSms(
      `GrandChangan: yangi bron GC-TEST. ${restaurantDay()} 19:00, 2 kishi, stol 1. Sinov xabari +${phones[0]}`,
      "sms-test"
    );
    results = sent.map((s) => ({ phone: s.phone, ok: s.result.ok, error: s.result.error }));
  }
  return { ...status, phones, results };
}
