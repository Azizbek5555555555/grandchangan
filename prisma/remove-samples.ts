/**
 * Bir martalik tozalash: seed orqali qo'shilgan namuna taomlarni bazadan o'chiradi.
 * Ishga tushirish:  npx tsx prisma/remove-samples.ts
 * (Faqat quyidagi slug'larni o'chiradi — sizning qo'lda qo'shgan taomlaringizga tegmaydi.)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const slugs = ["peking-duck", "kung-pao-chicken", "veg-spring-rolls", "hot-sour-soup", "jasmine-tea"];
  const res = await prisma.menuItem.deleteMany({ where: { slug: { in: slugs } } });
  console.log(`✔ ${res.count} ta namuna taom o'chirildi.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
