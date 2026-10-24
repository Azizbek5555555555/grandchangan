import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import MenuBrowser from "@/components/site/MenuBrowser";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import PageHero from "@/components/site/PageHero";

export const dynamic = "force-dynamic";

export default async function MenuPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const st = await getTranslations({ locale, namespace: "Site" });
  const tc = await getTranslations({ locale, namespace: "Common" });
  const [categories, items] = await Promise.all([
    prisma.menuCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.menuItem.findMany({ where: { isAvailable: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  const plainCats = JSON.parse(JSON.stringify(categories));
  // Decimal → number. Admin'da "TOP" belgilangan taomlar (isFeatured) MenuBrowser tepasida "招牌菜" qatorida chiqadi
  const plainItems = JSON.parse(JSON.stringify(items)).map((i: Record<string, unknown>) => ({
    ...i, price: Number(i.price),
    discountPrice: i.discountPrice != null ? Number(i.discountPrice) : null,
  }));

  return (
    <>
      <SiteHeader />
      <PageHero title={tc("menu")} subtitle={st("menuSub")} cn="菜单" />
      <main className="bg-paper">
        <MenuBrowser categories={plainCats} items={plainItems} locale={locale} />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
