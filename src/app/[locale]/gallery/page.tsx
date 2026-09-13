import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import PageHero from "@/components/site/PageHero";
import ZoomImage from "@/components/motion/ZoomImage";
import Reveal3D from "@/components/motion/Reveal3D";

export const dynamic = "force-dynamic";
const usable = (u?: string | null) => (u && (u.startsWith("/uploads") || u.startsWith("http")) ? u : null);

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const st = await getTranslations({ locale, namespace: "Site" });
  const tc = await getTranslations({ locale, namespace: "Common" });
  const images = await prisma.galleryImage.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  const urls = images.map((i) => i.url).filter((u) => usable(u)) as string[];
  const feat = urls.slice(0, 2);
  const rest = urls.slice(2);

  return (
    <>
      <SiteHeader />
      <PageHero title={tc("gallery")} subtitle={st("gallerySub")} bgImage={urls[0] || null} />
      <div className="mx-auto max-w-7xl px-5 py-16 lg:py-24">
        {feat.length > 0 && (
          <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {feat.map((u, i) => <ZoomImage key={i} src={u} className="h-[340px] w-full rounded-3xl sm:h-[460px]" />)}
          </div>
        )}
        {rest.length > 0 && (
          <Reveal3D className="columns-2 gap-4 sm:columns-3 lg:columns-4" stagger={0.06}>
            {rest.map((u, i) => (
              <div key={i} className="mb-4 overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="w-full transition duration-700 hover:scale-105" />
              </div>
            ))}
          </Reveal3D>
        )}
        {images.length === 0 && <p className="text-center text-neutral-400">{st("gallerySoon")}</p>}
      </div>
      <SiteFooter locale={locale} />
    </>
  );
}
