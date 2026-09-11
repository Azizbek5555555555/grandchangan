import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import FloorPlanEditor from "@/components/admin/FloorPlanEditor";

export const dynamic = "force-dynamic";

export default async function AdminTablesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const zones = await prisma.zone.findMany({
    orderBy: { sortOrder: "asc" },
    include: { tables: { orderBy: { number: "asc" } } },
  });
  const plain = JSON.parse(JSON.stringify(zones)).map((z: Record<string, unknown>) => ({
    ...z,
    tables: (z.tables as Record<string, unknown>[]).map((t) => ({ ...t, minSpend: t.minSpend != null ? Number(t.minSpend) : null })),
  }));
  return <FloorPlanEditor zones={plain} locale={locale} />;
}
