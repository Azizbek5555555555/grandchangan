"use server";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@prisma/client";
import { prisma } from "../prisma";
import { getTranslations } from "next-intl/server";
import { ensureAdmin } from "../auth/guard";

// Rol darajasi: faqat o'zidan past darajadagi foydalanuvchini bloklash mumkin
const RANK: Record<UserRole, number> = {
  CUSTOMER: 0, WAITER: 1, KITCHEN: 1, MANAGER: 2, ADMIN: 3, SUPERADMIN: 4,
};

export async function toggleBlock(id: string, isBlocked: boolean) {
  const me = await ensureAdmin();
  const ea = await getTranslations("AdminUi.errors");
  if (id === me.id) return { ok: false, error: ea("cannotBlockSelf") };
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) return { ok: false, error: ea("userNotFound") };
  if (RANK[target.role] >= RANK[me.role]) {
    return { ok: false, error: ea("noPermissionBlockUser") };
  }
  await prisma.user.update({ where: { id }, data: { isBlocked } });
  revalidatePath("/[locale]/admin/customers", "page");
  return { ok: true };
}
