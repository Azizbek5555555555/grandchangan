"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { prisma } from "../prisma";
import { ensureRoles } from "../auth/guard";
import { applyFloorSync, FutureBookingsError, type FloorSyncResult, type FutureBooking } from "./sync-apply";

export type SyncTablesResult =
  | ({ ok: true } & FloorSyncResult)
  | { ok: false; error: string; bookings?: FutureBooking[] };

/**
 * "Xaritadan stollarni yaratish / yangilash" — xaritadagi zallar va stollarni bazaga yozadi
 * (qoidalar: ./sync-apply.ts). Faqat ADMIN/SUPERADMIN. Xatoni otmaydi — { ok: false, error } qaytaradi.
 */
export async function syncTablesFromMap(force = false): Promise<SyncTablesResult> {
  const t = await getTranslations("FloorSync");
  try {
    await ensureRoles(["ADMIN", "SUPERADMIN"]);
  } catch {
    return { ok: false, error: t("errForbidden") };
  }

  try {
    const result = await applyFloorSync(prisma, { force: force === true });
    // Stollar ko'rinadigan barcha sahifalar yangilansin
    revalidatePath("/[locale]/admin/tables", "page");
    revalidatePath("/[locale]/admin/inventory", "page");
    revalidatePath("/[locale]/reservation", "page");
    revalidatePath("/[locale]", "page");
    return { ok: true, ...result };
  } catch (e) {
    // Kelajakdagi bronlar bor — hech narsa o'zgarmadi, admin avval ularni hal qilsin (yoki majburan davom etsin)
    if (e instanceof FutureBookingsError) {
      return { ok: false, error: t("errFutureBookings", { count: e.bookings.length }), bookings: e.bookings };
    }
    console.error("[floor-sync] xaritadan stollarni yozib bo'lmadi", e);
    return { ok: false, error: t("errFailed") };
  }
}
