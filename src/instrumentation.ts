/**
 * Server ishga tushganda bir marta: bazadagi stol raqamlarini yangi raqamlashga o'tkazish
 * (4 raqamisiz, ./lib/floorplan/renumber.ts). Allaqachon o'tkazilgan bo'lsa — hech narsa qilmaydi.
 * Xato bo'lsa ham server ishlayveradi (admin "Xaritadan stollarni yangilash" tugmasi ham shuni bajaradi).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.DATABASE_URL) return;
  const { PrismaClient } = await import("@prisma/client");
  const { renumberTablesOnce } = await import("./lib/floorplan/renumber");
  const db = new PrismaClient();
  // Kutilmaydi — baza sekin javob bersa ham server darhol ishga tushadi
  void renumberTablesOnce(db)
    .then((n) => n && console.log(`[floor] stol raqamlari yangilandi (4 raqamisiz): ${n} ta stol`))
    .catch((e) => console.error("[floor] stol raqamlarini yangilab bo'lmadi", e))
    .finally(() => db.$disconnect().catch(() => {}));
}
