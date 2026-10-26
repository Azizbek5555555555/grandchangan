import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import FloorPlanEditor from "@/components/admin/FloorPlanEditor";
import FloorSyncCard from "@/components/admin/FloorSyncCard";
import { requireSection } from "@/lib/auth/guard";
import { getFloorSyncStatus } from "@/lib/floorplan/sync-apply";

export const dynamic = "force-dynamic";

export default async function AdminTablesPage({ params }: { params: Promise<{ locale: string }> }) {
  const me = await requireSection("tables");
  const { locale } = await params;
  setRequestLocale(locale);
  const [zones, status] = await Promise.all([
    // Faqat faol zallar va stollar: xaritadan sinxronlashda nofaol qilingan eski stollar
    // (bron tarixi uchun saqlanadi) editorda ko'rinmaydi — mijozlar ham ularni ko'rmaydi
    prisma.zone.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { tables: { where: { isActive: true }, orderBy: { number: "asc" } } },
    }),
    getFloorSyncStatus(prisma),
  ]);
  const plain = JSON.parse(JSON.stringify(zones)).map((z: Record<string, unknown>) => ({
    ...z,
    tables: (z.tables as Record<string, unknown>[]).map((t) => ({ ...t, minSpend: t.minSpend != null ? Number(t.minSpend) : null })),
  }));
  // Editor holatni (tanlangan zal, joylashuv) faqat birinchi renderda oladi — zallar/stollar
  // to'plami o'zgarsa (xaritadan sinxronlashdan keyin) qayta yaratilsin. Faqat id'lar
  // olinadi: "Joylashuvni saqlash"dan keyin editor tanlangan zalda qoladi.
  const editorKey = idsKey(zones.flatMap((z) => [z.id, ...z.tables.map((tb) => tb.id)]));
  const canSync = me.role === "ADMIN" || me.role === "SUPERADMIN";

  return (
    <FloorPlanEditor
      key={editorKey}
      zones={plain}
      locale={locale}
      syncCard={<FloorSyncCard status={status} canSync={canSync} />}
    />
  );
}

/** id'lar ro'yxatidan qisqa barqaror kalit (React key uchun) */
function idsKey(ids: string[]): string {
  let h = 0;
  for (const ch of ids.join("|")) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
  return `${ids.length}-${(h >>> 0).toString(36)}`;
}
