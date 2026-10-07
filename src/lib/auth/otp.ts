import "server-only";
import { randomInt } from "crypto";
import { prisma } from "../prisma";

export function generateOtp(): string {
  return String(randomInt(100000, 1000000)); // kriptografik tasodifiy 6 xonali kod
}

/** Telefon uchun hali ishlatilmagan barcha kodlarni bekor qilish */
export async function invalidateOtps(phone: string, purpose = "login"): Promise<void> {
  await prisma.otpCode.updateMany({
    where: { phone, purpose, usedAt: null },
    data: { usedAt: new Date() },
  });
}

export async function createOtp(phone: string, purpose = "login"): Promise<string> {
  // Bir vaqtda faqat oxirgi kod amal qiladi — taxmin qilish imkoniyati kamayadi
  await invalidateOtps(phone, purpose);
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 daqiqa
  await prisma.otpCode.create({ data: { phone, code, purpose, expiresAt } });
  return code;
}

export async function verifyOtp(
  phone: string,
  code: string,
  purpose = "login"
): Promise<boolean> {
  const otp = await prisma.otpCode.findFirst({
    where: {
      phone,
      code,
      purpose,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return false;
  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { usedAt: new Date() },
  });
  return true;
}
