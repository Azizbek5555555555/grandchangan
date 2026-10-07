import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import MenuBrowser from "@/components/site/MenuBrowser";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import PageHero from "@/components/site/PageHero";
import FeaturedSlider from "@/components/site/FeaturedSlider";

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
  const plainItems = JSON.parse(JSON.stringify(items)).map((i: Record<string, unknown>) => ({
    ...i, price: Number(i.price),
    discountPrice: i.discountPrice != null ? Number(i.discountPrice) : null,
  }));
  // Admin'da "TOP" belgilangan taomlar — ~100 taomli menyuda mehmon avval eng mashhurlarini ko'rsin
  const featured = (plainItems as { id: string; name: unknown; price: number; discountPrice: number | null; imageUrl?: string | null; isFeatured?: boolean }[])
    .filter((i) => i.isFeatured)
    .map((i) => ({ id: i.id, name: i.name, price: i.discountPrice ?? i.price, imageUrl: i.imageUrl }));

  return (
    <>
      <SiteHeader />
      <PageHero title={tc("menu")} subtitle={st("menuSub")} />
      {featured.length > 0 && (
        <section className="bg-brand-ink pb-4 pt-14 text-center">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-brand-gold">{st("dishesEyebrow")}</p>
          <h2 className="mb-10 font-display text-4xl text-brand-cream sm:text-5xl">
            {st("dishesTitle1")} <span className="accent-gold">{st("dishesTitle2")}</span>
          </h2>
          <div className="mx-auto max-w-7xl px-4">
            <FeaturedSlider items={featured} locale={locale} />
          </div>
        </section>
      )}
      <MenuBrowser categories={plainCats} items={plainItems} locale={locale} />
      <SiteFooter locale={locale} />
    </>
  );
}
