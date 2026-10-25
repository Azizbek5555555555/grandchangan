import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import MenuBrowser from "@/components/site/MenuBrowser";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import MenuHero from "@/components/site/heroes/MenuHero";
import { ChefSignature, TeaRitual, type SpecialItem } from "@/components/site/pages/MenuSpecials";

export const dynamic = "force-dynamic";

export default async function MenuPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const st = await getTranslations({ locale, namespace: "Site" });
  const tc = await getTranslations({ locale, namespace: "Common" });
  const [p2, th] = await Promise.all([
    getTranslations({ locale, namespace: "Pages2" }),
    getTranslations({ locale, namespace: "Home" }),
  ]);
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

  // Oshpaz tanlovi (TOP taomlar, avval rasmlilari) va "Choy marosimi" (choy, ichimlik, shirinlik)
  const specials = plainItems as SpecialItem[];
  const signature = specials
    .filter((i) => (i as unknown as { isFeatured: boolean }).isFeatured)
    .sort((a, b) => Number(!!b.imageUrl) - Number(!!a.imageUrl))
    .slice(0, 3);
  const teaCats = categories.filter((c) => ["tea", "drinks", "dessert"].includes(c.slug));
  const tea = specials.filter((i) => teaCats.some((c) => c.id === i.categoryId)).slice(0, 6);

  return (
    <>
      <SiteHeader />
      <MenuHero
        title={tc("menu")}
        eyebrow={p2("heroMenuEyebrow")}
        sub={st("menuSub")}
        stats={[
          { value: plainItems.length, label: p2("heroDishes") },
          { value: categories.filter((c) => plainItems.some((i: { categoryId: string }) => i.categoryId === c.id)).length, label: p2("heroCats") },
        ].filter((s) => s.value > 0)}
        bookLabel={th("book_table")}
        browseLabel={th("view_menu")}
        waveClass={signature.length ? "text-paper" : undefined}
      />
      {/* Fon ketma-ketligi: hero (tun) → oshpaz tanlovi (krem) → menyu (tun, oltin ramka) → choy (krem) → footer (tun).
          Oshpaz tanlovi bo'lmasa hero va menyu orasida faqat oltin chiziq qoladi. */}
      <main>
        <ChefSignature items={signature} locale={locale} />
        <div id="menu-browser" className="scroll-mt-20">
          <MenuBrowser
            categories={plainCats}
            items={plainItems}
            locale={locale}
            showFeatured={signature.length === 0}
            waveTo={tea.length ? "text-paper" : undefined}
          />
        </div>
        <TeaRitual items={tea} locale={locale} anchorId={tea[0]?.categoryId ?? null} />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
