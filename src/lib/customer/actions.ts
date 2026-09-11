"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { ensureAdmin } from "../auth/guard";

export async function toggleBlock(id: string, isBlocked: boolean) {
  await ensureAdmin();
  await prisma.user.update({ where: { id }, data: { isBlocked } });
  revalidatePath("/[locale]/admin/customers", "page");
  return { ok: true };
}
