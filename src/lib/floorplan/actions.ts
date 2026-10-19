"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { prisma } from "../prisma";
import { ensureRoles } from "../auth/guard";
import { applyFloorSync, type FloorSyncResult } from "./sync-apply";

export type SyncTablesResult = ({ ok: true } & FloorSyncResult) | { ok: false; error: string };

/**
 * "Xaritadan stollarni yaratish / yangilash" — xaritadagi zallar va stollarni bazaga yozadi
 * (qoidalar: ./sync-apply.ts). Faqat ADMIN/SUPERADMIN. Xatoni otmaydi — { ok: false, error } qaytaradi.
 */
export async function syncTablesFromMap(): Promise<SyncTablesResult> {
  const t = await getTranslations("FloorSync");
  try {
    await ensureRoles(["ADMIN", "SUPERADMIN"]);
  } catch {
    return { ok: false, error: t("errForbidden") };
  }

  try {
    const result = await applyFloorSync(prisma);
    // Stollar ko'rinadigan barcha sahifalar yangilansin
    revalidatePath("/[locale]/admin/tables", "page");
    revalidatePath("/[locale]/admin/inventory", "page");
    revalidatePath("/[locale]/reservation", "page");
    revalidatePath("/[locale]", "page");
    return { ok: true, ...result };
  } catch (e) {
    console.error("[floor-sync] xaritadan stollarni yozib bo'lmadi", e);
    return { ok: false, error: t("errFailed") };
  }
}
