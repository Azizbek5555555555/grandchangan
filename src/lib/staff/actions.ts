"use server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { Prisma, type UserRole } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { prisma } from "../prisma";
import { ensureSection } from "../auth/guard";
import { ROLE_RANK, STAFF_ROLE_LIST } from "../auth/permissions";
import { normalizePhone } from "../utils";

type Result = { ok: boolean; error?: string };

/**
 * Xodim qo'shish yoki tahrirlash (faqat ADMIN/SUPERADMIN).
 * Faqat o'zidan past darajadagi rolni berish va shunday xodimni tahrirlash mumkin.
 * Telefon mijoz sifatida allaqachon ro'yxatda bo'lsa — o'sha akkaunt xodimga aylantiriladi.
 */
export async function saveStaff(input: {
  id?: string; name: string; email: string; phone: string; role: UserRole; password?: string;
}): Promise<Result> {
  const me = await ensureSection("staff");
  const ea = await getTranslations("AdminUi.errors");
  const name = (input.name || "").trim().slice(0, 80);
  const email = (input.email || "").trim().toLowerCase();
  const phone = normalizePhone(input.phone || "");
  const password = input.password || "";

  if (!name) return { ok: false, error: ea("staffNameRequired") };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: ea("emailInvalid") };
  if (phone.length < 12) return { ok: false, error: ea("phoneInvalid") };
  if (!STAFF_ROLE_LIST.includes(input.role) || ROLE_RANK[input.role] >= ROLE_RANK[me.role]) {
    return { ok: false, error: ea("roleForbidden") };
  }
  if ((!input.id || password) && password.length < 8) {
    return { ok: false, error: ea("passwordTooShort") };
  }
  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

  try {
    if (input.id) {
      const target = await prisma.user.findUnique({ where: { id: input.id } });
      if (!target) return { ok: false, error: ea("staffNotFound") };
      if (target.id === me.id || ROLE_RANK[target.role] >= ROLE_RANK[me.role]) {
        return { ok: false, error: ea("noPermissionEditStaff") };
      }
      await prisma.user.update({
        where: { id: input.id },
        data: { name, email, phone, role: input.role, ...(passwordHash ? { passwordHash } : {}) },
      });
    } else {
      const existing = await prisma.user.findUnique({ where: { phone } });
      if (existing) {
        if (existing.role !== "CUSTOMER") return { ok: false, error: ea("staffPhoneExists") };
        // Mijoz akkauntini xodimga aylantirish (bronlari va tarixi saqlanadi)
        await prisma.user.update({
          where: { id: existing.id },
          data: { name, email, role: input.role, passwordHash, isBlocked: false },
        });
      } else {
        await prisma.user.create({
          data: { name, email, phone, role: input.role, passwordHash, phoneVerified: true },
        });
      }
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: ea("emailOrPhoneTaken") };
    }
    throw e;
  }
  revalidatePath("/[locale]/admin/staff", "page");
  return { ok: true };
}

/** Xodimni bloklash/ochish. O'zini va o'zidan yuqori/teng rolni bloklab bo'lmaydi. */
export async function setStaffBlocked(id: string, isBlocked: boolean): Promise<Result> {
  const me = await ensureSection("staff");
  const ea = await getTranslations("AdminUi.errors");
  if (id === me.id) return { ok: false, error: ea("cannotBlockSelf") };
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) return { ok: false, error: ea("staffNotFound") };
  if (ROLE_RANK[target.role] >= ROLE_RANK[me.role]) {
    return { ok: false, error: ea("noPermissionBlockStaff") };
  }
  await prisma.user.update({ where: { id }, data: { isBlocked } });
  revalidatePath("/[locale]/admin/staff", "page");
  return { ok: true };
}

/** Xodimni oddiy mijozga qaytarish (kirish huquqi olinadi, bron tarixi saqlanadi) */
export async function removeStaff(id: string): Promise<Result> {
  const me = await ensureSection("staff");
  const ea = await getTranslations("AdminUi.errors");
  if (id === me.id) return { ok: false, error: ea("cannotRemoveSelf") };
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) return { ok: false, error: ea("staffNotFound") };
  if (ROLE_RANK[target.role] >= ROLE_RANK[me.role]) {
    return { ok: false, error: ea("noPermissionRemoveStaff") };
  }
  await prisma.user.update({ where: { id }, data: { role: "CUSTOMER", passwordHash: null, email: null } });
  revalidatePath("/[locale]/admin/staff", "page");
  return { ok: true };
}
