import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import PageHero from "@/components/site/PageHero";
export const dynamic = "force-dynamic";
export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const images = await prisma.galleryImage.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  return (
    <>
      <SiteHeader />
      <PageHero title="Galereya" subtitle="Interyer, taomlar va tadbirlar" />
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
          {images.map((im) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={im.id} src={im.url} alt="" className="mb-4 w-full rounded-2xl transition duration-500 hover:brightness-110" />
          ))}
        </div>
        {images.length === 0 && <p className="text-center text-neutral-400">Tez orada rasmlar qo'shiladi.</p>}
      </div>
      <SiteFooter locale={locale} />
    </>
  );
}
