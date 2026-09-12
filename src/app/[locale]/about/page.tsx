import { setRequestLocale } from "next-intl/server";
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
  const [setting, gallery] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: "general" } }),
    prisma.galleryImage.findMany({ where: { isActive: true }, take: 2, orderBy: { sortOrder: "asc" } }),
  ]);
  const g = (setting?.value as Record<string, unknown>) || {};
  const imgs = gallery.map((x) => usable(x.url)).filter(Boolean) as string[];

  return (
    <>
      <SiteHeader />
      <PageHero title="Biz haqimizda" subtitle="An'ana, mahorat va mehmondo'stlik" bgImage={imgs[0] || null} />

      <section className="overflow-hidden bg-brand-cream py-24 lg:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">
          <div className="relative h-[420px] rounded-3xl lg:h-[560px]">
            {imgs[0] ? (
              <ZoomImage src={imgs[0]} className="h-full w-full rounded-3xl" />
            ) : (
              <div className="flex h-full items-center justify-center rounded-3xl bg-brand-ink font-display text-3xl text-brand-gold/25">GrandChangan</div>
            )}
          </div>
          <div>
            <TextReveal text="Samarqand markazidagi" className="font-display text-4xl leading-tight text-brand-ink sm:text-5xl" />
            <TextReveal text="Xitoy taomlari maskani" className="font-display text-4xl leading-tight accent-gold sm:text-5xl" delay={0.1} />
            <RevealGroup className="mt-8 space-y-5 text-lg" stagger={0.15} y={22}>
              <p className="text-neutral-600">An&apos;anaviy retseptlar, yangi mahsulotlar va issiq muhitni bir joyga jamladik. Oshpazlarimiz Sichuan, Kanton va boshqa mintaqa taomlarini mahalliy didga moslab tayyorlaydi.</p>
              <p className="text-neutral-600">Barcha mahsulotlar halal. Bizning maqsadimiz — har bir mehmonga unutilmas taom va muhitni taqdim etish.</p>
            </RevealGroup>
            {g.address ? <Reveal delay={0.2}><p className="mt-8 text-sm text-neutral-500">Manzil: {t(g.address, locale)}</p></Reveal> : null}
          </div>
        </div>
      </section>

      <section className="bg-brand-ink py-24 text-center text-brand-cream">
        <div className="mx-auto max-w-3xl px-6">
          <TextReveal text="Dasturxonimizga marhamat" className="font-display text-4xl sm:text-5xl" />
          <Reveal delay={0.2}><p className="mx-auto mt-6 max-w-lg text-brand-cream/60">Kelib, o&apos;tirib, birga baham ko&apos;ring — har bir taom o&apos;z hikoyasini so&apos;zlaydi.</p></Reveal>
        </div>
      </section>

      <SiteFooter locale={locale} />
    </>
  );
}
