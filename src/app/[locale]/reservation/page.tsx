import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import ReservationFlow from "@/components/site/ReservationFlow";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import PageHero from "@/components/site/PageHero";

export const dynamic = "force-dynamic";

export default async function ReservationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const st = await getTranslations({ locale, namespace: "Site" });
  const tc = await getTranslations({ locale, namespace: "Common" });

  const [categories, items] = await Promise.all([
    prisma.menuCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.menuItem.findMany({ where: { isAvailable: true }, orderBy: { sortOrder: "asc" }, select: { id: true, categoryId: true, name: true, price: true, discountPrice: true, imageUrl: true } }),
  ]);

  const menu = {
    categories: JSON.parse(JSON.stringify(categories)),
    items: items.map((i) => ({
      id: i.id, categoryId: i.categoryId, name: i.name,
      price: Number(i.discountPrice ?? i.price), imageUrl: i.imageUrl,
    })),
  };

  return (
    <>
      <SiteHeader />
      <PageHero title={tc("reservation")} subtitle={st("reservationSub")} />
      <ReservationFlow locale={locale} menu={menu} />
      <SiteFooter locale={locale} />
    </>
  );
}
