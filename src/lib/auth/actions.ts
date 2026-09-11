"use server";

import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { createOtp, verifyOtp } from "./otp";
import { createSession, destroySession } from "./session";
import { sendSms } from "../sms/eskiz";
import { normalizePhone } from "../utils";
import { ADMIN_ROLES } from "./guard";
import type { UserRole } from "@prisma/client";

type Result = { ok: boolean; error?: string };

/** Mijoz: telefonga OTP kod yuborish */
export async function requestOtpAction(phoneRaw: string): Promise<Result> {
  const phone = normalizePhone(phoneRaw);
  if (phone.length < 12) return { ok: false, error: "Telefon raqam noto'g'ri" };
  const code = await createOtp(phone, "login");
  await sendSms(phone, `GrandChangan. Tasdiqlash kodi: ${code}`);
  return { ok: true };
}

/** Mijoz: OTP kodni tekshirish va kirish (mavjud bo'lmasa yaratish) */
export async function verifyOtpAction(
  phoneRaw: string,
  name: string,
  code: string
): Promise<Result> {
  const phone = normalizePhone(phoneRaw);
  const valid = await verifyOtp(phone, code, "login");
  if (!valid) return { ok: false, error: "Kod noto'g'ri yoki muddati o'tgan" };

  const user = await prisma.user.upsert({
    where: { phone },
    update: { phoneVerified: true, ...(name ? { name } : {}) },
    create: { phone, name: name || null, phoneVerified: true, role: "CUSTOMER" },
  });

  await createSession({ userId: user.id, role: user.role, phone: user.phone });
  return { ok: true };
}

/** Admin/xodim: email + parol orqali kirish */
export async function adminLoginAction(
  email: string,
  password: string
): Promise<Result> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return { ok: false, error: "Login yoki parol noto'g'ri" };
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return { ok: false, error: "Login yoki parol noto'g'ri" };
  if (!ADMIN_ROLES.includes(user.role as UserRole)) {
    return { ok: false, error: "Ruxsat yo'q" };
  }
  if (user.isBlocked) return { ok: false, error: "Hisob bloklangan" };

  await createSession({ userId: user.id, role: user.role, phone: user.phone });
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
}
