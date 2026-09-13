import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/utils";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/motion/Reveal";
import RevealGroup from "@/components/motion/RevealGroup";
import TextReveal from "@/components/motion/TextReveal";
import ZoomImage from "@/components/motion/ZoomImage";

export const dynamic = "force-dynamic";
const usable = (u?: string | null) => (u && (u.startsWith("/uploads") || u.startsWith("http")) ? u : null);

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const st = await getTranslations({ locale, namespace: "Site" });
  const tc = await getTranslations({ locale, namespace: "Common" });
  const [setting, gallery] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: "general" } }),
    prisma.galleryImage.findMany({ where: { isActive: true }, take: 2, orderBy: { sortOrder: "asc" } }),
  ]);
  const g = (setting?.value as Record<string, unknown>) || {};
  const imgs = gallery.map((x) => usable(x.url)).filter(Boolean) as string[];

  return (
    <>
      <SiteHeader />
      <PageHero title={tc("about")} subtitle={st("aboutSub")} bgImage={imgs[0] || null} />
      <section className="overflow-hidden bg-brand-cream py-24 lg:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">
          <div className="relative h-[420px] rounded-3xl lg:h-[560px]">
            {imgs[0] ? <ZoomImage src={imgs[0]} className="h-full w-full rounded-3xl" /> : <div className="flex h-full items-center justify-center rounded-3xl bg-brand-ink font-display text-3xl text-brand-gold/25">GrandChangan</div>}
          </div>
          <div>
            <TextReveal text={st("aboutT1")} className="font-display text-4xl leading-tight text-brand-ink sm:text-5xl" />
            <TextReveal text={st("aboutT2")} className="font-display text-4xl leading-tight accent-gold sm:text-5xl" delay={0.1} />
            <RevealGroup className="mt-8 space-y-5 text-lg" stagger={0.15} y={22}>
              <p className="text-neutral-600">{st("aboutP1")}</p>
              <p className="text-neutral-600">{st("aboutP2")}</p>
            </RevealGroup>
            {g.address ? <Reveal delay={0.2}><p className="mt-8 text-sm text-neutral-500">{st("aboutAddr")}: {t(g.address, locale)}</p></Reveal> : null}
          </div>
        </div>
      </section>
      <section className="bg-brand-ink py-24 text-center text-brand-cream">
        <div className="mx-auto max-w-3xl px-6">
          <TextReveal text={st("aboutCta")} className="font-display text-4xl sm:text-5xl" />
          <Reveal delay={0.2}><p className="mx-auto mt-6 max-w-lg text-brand-cream/60">{st("aboutCtaSub")}</p></Reveal>
        </div>
      </section>
      <SiteFooter locale={locale} />
    </>
  );
}
