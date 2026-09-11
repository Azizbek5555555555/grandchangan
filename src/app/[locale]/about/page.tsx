import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/motion/Reveal";
export const dynamic = "force-dynamic";
export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const setting = await prisma.siteSetting.findUnique({ where: { key: "general" } });
  const g = (setting?.value as Record<string, unknown>) || {};
  return (
    <>
      <SiteHeader />
      <PageHero title="Biz haqimizda" subtitle="An'ana, mahorat va mehmondo'stlik" />
      <div className="mx-auto max-w-3xl px-5 py-20">
        <Reveal>
          <p className="text-lg leading-relaxed text-neutral-700">
            GrandChangan — Samarqand markazidagi haqiqiy Xitoy taomlari restorani. An'anaviy retseptlar,
            yangi mahsulotlar va issiq muhitni bir joyga jamladik.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 text-lg leading-relaxed text-neutral-700">
            Oshpazlarimiz Xitoyning turli mintaqalari — Sichuan, Kanton va boshqa uslublardagi taomlarni
            mahalliy didga moslab tayyorlaydi. Barcha mahsulotlar halal.
          </p>
        </Reveal>
        {g.address ? <p className="mt-10 text-sm text-neutral-500">Manzil: {String(g.address)}</p> : null}
      </div>
      <SiteFooter locale={locale} />
    </>
  );
}
