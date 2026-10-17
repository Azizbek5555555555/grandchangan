import { unstable_rethrow } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireSection } from "@/lib/auth/guard";
import { MANAGEMENT } from "@/lib/auth/permissions";
import { getInventoryItemOptions, getInventoryOverview, getMyLossReports } from "@/lib/inventory/queries";
import InventoryManager from "@/components/admin/inventory/InventoryManager";
import StaffLossReport from "@/components/admin/inventory/StaffLossReport";

export const dynamic = "force-dynamic";

/**
 * Inventar bo'limi.
 *   MANAGER/ADMIN/SUPERADMIN — to'liq boshqaruv (qoldiq, stollar, tarix, inventarizatsiya)
 *   WAITER/KITCHEN           — faqat "sindi / yo'qoldi" formasi va o'z xabarlari
 */
export default async function AdminInventoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const me = await requireSection("inventory");
  const { locale } = await params;
  setRequestLocale(locale);

  try {
    if (MANAGEMENT.includes(me.role)) {
      const data = await getInventoryOverview(locale);
      return <InventoryManager data={data} />;
    }
    const [items, reports] = await Promise.all([getInventoryItemOptions(), getMyLossReports(me.id)]);
    return <StaffLossReport items={items} reports={reports} />;
  } catch (e) {
    // Next'ning ichki signallari (redirect va h.k.) qayta otiladi
    unstable_rethrow(e);
    // Odatda: inventar jadvallari bazada hali yaratilmagan (prisma db push qilinmagan)
    console.error("[inventory] sahifa ma'lumotlarini yuklab bo'lmadi", e);
    const t = await getTranslations("Inventory");
    return (
      <div className="p-6">
        <h1 className="mb-4 text-2xl font-bold">{t("title")}</h1>
        <div className="rounded-xl border border-line bg-card px-4 py-6 text-sm text-muted">{t("errNotReady")}</div>
      </div>
    );
  }
}
