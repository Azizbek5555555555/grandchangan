import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import GalleryHero from "@/components/site/heroes/GalleryHero";
import SectionHead from "@/components/site/kit/SectionHead";
import ButtonLink from "@/components/site/kit/ButtonLink";
import Reveal from "@/components/motion/Reveal";
import GalleryGrid from "@/components/site/pages/GalleryGrid";
import { Birds, Mountains, Pavilion } from "@/components/site/pages/InkDecor";
import { GlyphPanel } from "@/components/site/home/Decor";

export const dynamic = "force-dynamic";
const usable = (u?: string | null) => (u && (u.startsWith("/uploads") || u.startsWith("http")) ? u : null);

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [st, tc, g2] = await Promise.all([
    getTranslations({ locale, namespace: "Site" }),
    getTranslations({ locale, namespace: "Common" }),
    getTranslations({ locale, namespace: "Gallery2" }),
  ]);
  const images = await prisma.galleryImage.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  const urls = images.map((i) => usable(i.url)).filter(Boolean) as string[];

  return (
    <>
      <SiteHeader />
      <GalleryHero title={tc("gallery")} sub={st("gallerySub")} urls={urls} />
      <main className="relative isolate overflow-x-clip bg-paper pb-28 pt-10">
        <Birds className="absolute right-[10%] top-6 -z-10 w-44 text-content/20" />
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-12">
            <SectionHead font="serif" cn="氛围" eyebrow={g2("eyebrow")} title={g2("title")} accent={g2("accent")} />
          </div>
          {urls.length > 0 ? (
            <Reveal y={30}>
              <GalleryGrid urls={urls} labels={{ close: st("close"), prev: g2("prev"), next: g2("next"), open: g2("open") }} />
            </Reveal>
          ) : (
            <Reveal className="relative overflow-hidden rounded-[2rem] bg-sand px-6 pb-40 pt-16 text-center">
              <div className="mx-auto grid max-w-lg grid-cols-3 gap-3">
                {["宴", "茶", "福"].map((c) => (
                  <div key={c} className="aspect-[3/4] overflow-hidden rounded-2xl"><GlyphPanel char={c} tone={c === "茶" ? "fire" : "night"} size="text-6xl" /></div>
                ))}
              </div>
              <p className="mx-auto mt-10 max-w-md font-display text-2xl text-content">{st("gallerySoon")}</p>
              <ButtonLink href="/reservation" className="mt-8">{tc("reservation")}</ButtonLink>
              <Pavilion className="absolute bottom-10 right-8 w-28 text-content/10" />
              <Mountains className="absolute inset-x-0 bottom-0 h-28 w-full text-paper" />
            </Reveal>
          )}
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
