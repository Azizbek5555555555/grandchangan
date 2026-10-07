"use server";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@prisma/client";
import { prisma } from "../prisma";
import { ensureAdmin } from "../auth/guard";

// Rol darajasi: faqat o'zidan past darajadagi foydalanuvchini bloklash mumkin
const RANK: Record<UserRole, number> = {
  CUSTOMER: 0, WAITER: 1, KITCHEN: 1, MANAGER: 2, ADMIN: 3, SUPERADMIN: 4,
};

export async function toggleBlock(id: string, isBlocked: boolean) {
  const me = await ensureAdmin();
  if (id === me.id) return { ok: false, error: "O'zingizni bloklay olmaysiz" };
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) return { ok: false, error: "Foydalanuvchi topilmadi" };
  if (RANK[target.role] >= RANK[me.role]) {
    return { ok: false, error: "Bu foydalanuvchini bloklashga ruxsatingiz yo'q" };
  }
  await prisma.user.update({ where: { id }, data: { isBlocked } });
  revalidatePath("/[locale]/admin/customers", "page");
  return { ok: true };
}
