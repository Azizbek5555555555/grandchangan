"use server";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { ensureAdmin } from "../auth/guard";

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
      const openTime = h.openTime || "11:00";
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
