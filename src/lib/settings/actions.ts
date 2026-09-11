"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { ensureAdmin } from "../auth/guard";

export async function saveSetting(key: string, value: Record<string, unknown>) {
  await ensureAdmin();
  await prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  revalidatePath("/[locale]/admin/settings", "page");
  revalidatePath("/[locale]", "page");
  return { ok: true };
}

export async function saveWorkingHours(hours: { dayOfWeek: number; openTime: string | null; closeTime: string | null; isClosed: boolean }[]) {
  await ensureAdmin();
  await prisma.$transaction(
    hours.map((h) =>
      prisma.workingHour.upsert({
        where: { dayOfWeek: h.dayOfWeek },
        update: { openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed },
        create: { dayOfWeek: h.dayOfWeek, openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed },
      })
    )
  );
  revalidatePath("/[locale]/admin/settings", "page");
  return { ok: true };
}
