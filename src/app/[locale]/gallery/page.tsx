import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/utils";
import type { PhotoKind } from "@/lib/photos";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import GalleryHero from "@/components/site/heroes/GalleryHero";
import SectionHead from "@/components/site/kit/SectionHead";
import ButtonLink from "@/components/site/kit/ButtonLink";
import Reveal from "@/components/motion/Reveal";
import GalleryGrid, { type GalleryGroup, type GridItem } from "@/components/site/pages/GalleryGrid";
import { GALLERY_PICS, picGlyph, urlPic, type Pic } from "@/components/site/photos/pics";
import { photoText } from "@/components/site/photos/text";
import { Birds, Mountains, Pavilion } from "@/components/site/pages/InkDecor";
import { GlyphPanel } from "@/components/site/home/Decor";

export const dynamic = "force-dynamic";
const usable = (u?: string | null) => (u && (u.startsWith("/uploads") || u.startsWith("http")) ? u : null);

/**
 * To'rda vertikal rasmlar (2 qator egallaydi) oxirida to'planib qolmasin — saralangan tartibni saqlagan
 * holda har ~5 gorizontal rasmdan keyin bittadan joylanadi.
 */
function interleave(pics: Pic[]): Pic[] {
  const tall = pics.filter((p) => p.w && p.h && p.h > p.w);
  const wide = pics.filter((p) => !tall.includes(p));
  const out: Pic[] = [];
  wide.forEach((p, i) => {
    out.push(p);
    if (i % 5 === 3 && tall.length) out.push(tall.shift()!);
  });
  return [...out, ...tall];
}

/** Rasm turi → galereya filtri */
const GROUP: Record<PhotoKind, GalleryGroup | undefined> = {
  hall: "hall", bar: "hall", stage: "hall", vip: "vip", booth: "booth", private: "booth",
  decor: "decor", exterior: "outside", tableware: undefined,
};

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [st, tc, g2, fl, h2, pt] = await Promise.all([
    getTranslations({ locale, namespace: "Site" }),
    getTranslations({ locale, namespace: "Common" }),
    getTranslations({ locale, namespace: "Gallery2" }),
    getTranslations({ locale, namespace: "Floor" }),
    getTranslations({ locale, namespace: "Home2" }),
    photoText(locale),
  ]);
  const images = await prisma.galleryImage.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });

  // Avval restoranning haqiqiy rasmlari (saralangan), keyin admin yuklagan rasmlar — ular yo'qolmaydi
  const items: GridItem[] = [
    ...interleave(GALLERY_PICS).map((p) => {
      // alt — aniq izoh + umumiy tur ("Deraza yonidagi kabinka — GrandChangan"), bir xil alt'lar takrorlanmasin
      const caption = pt.caption(p);
      const alt = pt.alt(p);
      return { pic: p, caption, alt: caption && caption !== alt ? `${caption} — ${alt}` : alt, glyph: picGlyph(p), group: p.kind ? GROUP[p.kind] : undefined };
    }),
    ...images.flatMap((x) => {
      const p = urlPic(usable(x.url));
      if (!p || GALLERY_PICS.some((r) => r.src === p.src)) return [];
      const caption = x.caption ? t(x.caption, locale).trim() : "";
      return [{ pic: p, caption, alt: caption, glyph: "画" }];
    }),
  ];
  const groups: Record<GalleryGroup, string> = {
    hall: fl("kinds.hall"),
    vip: h2("panel4t"),
    booth: fl("kinds.booth"),
    decor: g2.has("fDetails") ? g2("fDetails") : pt.alt({ src: "", kind: "decor" }),
    outside: fl("kinds.entrance"),
  };

  return (
    <>
      <SiteHeader />
      <GalleryHero title={tc("gallery")} sub={st("gallerySub")} pics={items.map((x) => x.pic)} />
      <main id="main" className="relative isolate overflow-x-clip bg-paper pb-28 pt-10">
        <Birds className="absolute right-[10%] top-6 -z-10 w-44 text-content/20" />
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-12">
            <SectionHead font="serif" cn="氛围" eyebrow={g2("eyebrow")} title={g2("title")} accent={g2("accent")} />
          </div>
          {items.length > 0 ? (
            <Reveal y={30}>
              <GalleryGrid
                items={items}
                labels={{ close: st("close"), prev: g2("prev"), next: g2("next"), open: g2("open"), filters: g2("eyebrow"), all: st("menuAll"), groups }}
              />
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
