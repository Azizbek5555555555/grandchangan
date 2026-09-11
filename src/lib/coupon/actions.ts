"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { ensureAdmin } from "../auth/guard";
import type { DiscountType } from "@prisma/client";

export async function saveCoupon(input: {
  id?: string; code: string; type: DiscountType; value: number;
  minOrder?: number | null; usageLimit?: number | null; validTo?: string | null; isActive?: boolean;
}) {
  await ensureAdmin();
  const data = {
    code: input.code.toUpperCase(), type: input.type, value: input.value,
    minOrder: input.minOrder ?? null, usageLimit: input.usageLimit ?? null,
    validTo: input.validTo ? new Date(input.validTo) : null, isActive: input.isActive ?? true,
  };
  if (input.id) await prisma.coupon.update({ where: { id: input.id }, data });
  else await prisma.coupon.create({ data });
  revalidatePath("/[locale]/admin/promotions", "page");
  return { ok: true };
}
export async function toggleCoupon(id: string, isActive: boolean) {
  await ensureAdmin();
  await prisma.coupon.update({ where: { id }, data: { isActive } });
  revalidatePath("/[locale]/admin/promotions", "page");
  return { ok: true };
}
export async function deleteCoupon(id: string) {
  await ensureAdmin();
  await prisma.coupon.delete({ where: { id } });
  revalidatePath("/[locale]/admin/promotions", "page");
  return { ok: true };
}
