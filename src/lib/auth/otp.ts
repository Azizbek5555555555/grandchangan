import "server-only";
import { prisma } from "../prisma";

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createOtp(phone: string, purpose = "login"): Promise<string> {
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
