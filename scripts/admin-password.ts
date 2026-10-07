/**
 * Xodim (admin) parolini terminaldan tiklash — admin panelga kira olmay qolganda.
 *
 *   npm run admin:password                                   -> bazadagi xodimlar ro'yxati
 *   npm run admin:password -- admin@grandchangan.uz YangiParol123   -> parolni o'rnatadi
 *
 * Faqat xodim (CUSTOMER emas) akkauntining parolini o'zgartiradi va blokdan chiqaradi.
 * db:seed dan farqli: sozlamalar, kategoriyalar va boshqa ma'lumotlarga tegmaydi.
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

try { process.loadEnvFile(".env"); } catch { /* .env bo'lmasa — muhit o'zgaruvchilaridan */ }

const prisma = new PrismaClient();

async function listStaff() {
  const staff = await prisma.user.findMany({
    where: { role: { not: "CUSTOMER" } },
    select: { email: true, role: true, isBlocked: true, name: true },
    orderBy: { role: "desc" },
  });
  console.log(`Bazadagi xodimlar (${staff.length} ta):`);
  for (const s of staff) {
    console.log(`  ${s.email ?? "(email yo'q)"}  —  ${s.role}${s.isBlocked ? "  [BLOKLANGAN]" : ""}${s.name ? `  (${s.name})` : ""}`);
  }
}

async function main() {
  const [emailRaw, password] = process.argv.slice(2);
  if (!emailRaw || !password) {
    console.log("Foydalanish: npm run admin:password -- <email> <yangi-parol>\n");
    await listStaff();
    return;
  }
  const email = emailRaw.trim().toLowerCase();
  if (password.length < 8) {
    console.error("✖ Parol kamida 8 belgi bo'lsin");
    process.exitCode = 1;
    return;
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role === "CUSTOMER") {
    console.error(`✖ "${email}" email bilan xodim topilmadi.\n`);
    await listStaff();
    process.exitCode = 1;
    return;
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 10), isBlocked: false },
  });
  console.log(`✔ ${email} (${user.role}) uchun yangi parol o'rnatildi. Endi admin panelga shu parol bilan kiring.`);
}

main()
  .catch((e) => { console.error(e instanceof Error ? e.message : e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
