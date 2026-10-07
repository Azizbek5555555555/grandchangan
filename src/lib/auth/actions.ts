"use server";

import bcrypt from "bcryptjs";
import { getTranslations } from "next-intl/server";
import { prisma } from "../prisma";
import { createOtp, verifyOtp, invalidateOtps } from "./otp";
import { createSession, destroySession } from "./session";
import { sendSms } from "../sms/eskiz";
import { normalizePhone } from "../utils";
import { STAFF_ROLES, ensureRoles } from "./guard";
import { rateLimit, clearLimit, clientIp, MINUTE, HOUR, TOO_MANY } from "../security/rate-limit";
import type { UserRole } from "@prisma/client";

type Result = { ok: boolean; error?: string };

// Foydalanuvchi topilmasa ham bcrypt ishlaydi — javob vaqtidan email mavjudligini bilib bo'lmasin
const DUMMY_HASH = "$2a$10$pEchvsPHKvqjNiJQ2zFh/OjilShzacn5L/bmzoLkpHHROaoq9iGae";

/** Mijoz: telefonga OTP kod yuborish */
export async function requestOtpAction(phoneRaw: string): Promise<Result> {
  const e = await getTranslations("Errors");
  const phone = normalizePhone(phoneRaw);
  if (phone.length < 12) return { ok: false, error: e("phoneInvalid") };
  // SMS bombardimon va pul isrofiga qarshi: raqamga 1 daqiqada 1 ta, 10 daqiqada 3 ta kod
  if (!rateLimit(`otp-cd:${phone}`, 1, MINUTE)) {
    return { ok: false, error: e("otpCooldown") };
  }
  if (!rateLimit(`otp-req:${phone}`, 3, 10 * MINUTE) || !rateLimit(`otp-ip:${await clientIp()}`, 15, HOUR)) {
    return { ok: false, error: e("tooMany") };
  }
  const code = await createOtp(phone, "login");
  const sent = await sendSms(phone, `GrandChangan. Tasdiqlash kodi: ${code}`);
  if (!sent.ok) return { ok: false, error: e("smsFailed") };
  return { ok: true };
}

/** Mijoz: OTP kodni tekshirish va kirish (mavjud bo'lmasa yaratish) */
export async function verifyOtpAction(
  phoneRaw: string,
  name: string,
  code: string
): Promise<Result> {
  const e = await getTranslations("Errors");
  const phone = normalizePhone(phoneRaw);
  const cleanCode = (code || "").trim();
  // Kodni terib topishga qarshi: 15 daqiqada 5 urinish, keyin faol kodlar bekor qilinadi
  if (!rateLimit(`otp-verify:${phone}`, 5, 15 * MINUTE)) {
    await invalidateOtps(phone, "login");
    return { ok: false, error: e("tooMany") };
  }
  const valid = /^\d{6}$/.test(cleanCode) && (await verifyOtp(phone, cleanCode, "login"));
  if (!valid) return { ok: false, error: e("codeInvalid") };
  clearLimit(`otp-verify:${phone}`);
  name = (name || "").trim().slice(0, 80);

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
  emailRaw: string,
  password: string
): Promise<Result> {
  const email = (emailRaw || "").trim().toLowerCase();
  // Parolni terib topishga qarshi: email uchun 15 daqiqada 5, IP uchun 20 urinish
  if (!rateLimit(`login:${email}`, 5, 15 * MINUTE) || !rateLimit(`login-ip:${await clientIp()}`, 20, 15 * MINUTE)) {
    return { ok: false, error: TOO_MANY };
  }
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  const match = await bcrypt.compare(password || "", user?.passwordHash || DUMMY_HASH);
  if (!user || !user.passwordHash || !match) {
    return { ok: false, error: "Login yoki parol noto'g'ri" };
  }
  clearLimit(`login:${email}`);
  if (!STAFF_ROLES.includes(user.role as UserRole)) {
    return { ok: false, error: "Ruxsat yo'q" };
  }
  if (user.isBlocked) return { ok: false, error: "Hisob bloklangan" };

  await createSession({ userId: user.id, role: user.role, phone: user.phone });
  return { ok: true };
}

/** Xodim: o'z parolini o'zgartirish (joriy parol talab qilinadi) */
export async function changeOwnPasswordAction(current: string, next: string): Promise<Result> {
  const me = await ensureRoles(STAFF_ROLES);
  if (!rateLimit(`pwd:${me.id}`, 5, 15 * MINUTE)) return { ok: false, error: TOO_MANY };
  if (!me.passwordHash || !(await bcrypt.compare(current || "", me.passwordHash))) {
    return { ok: false, error: "Joriy parol noto'g'ri" };
  }
  if ((next || "").length < 8) return { ok: false, error: "Yangi parol kamida 8 belgi bo'lsin" };
  await prisma.user.update({ where: { id: me.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  clearLimit(`pwd:${me.id}`);
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
}
