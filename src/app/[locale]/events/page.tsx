import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import PageHero from "@/components/site/PageHero";
import EventForm from "@/components/site/EventForm";
import Reveal from "@/components/motion/Reveal";
import RevealGroup from "@/components/motion/RevealGroup";
import Reveal3D from "@/components/motion/Reveal3D";
import TextReveal from "@/components/motion/TextReveal";
import { PartyPopper, Crown, Cake, Users } from "lucide-react";

export const dynamic = "force-dynamic";
const usable = (u?: string | null) => (u && (u.startsWith("/uploads") || u.startsWith("http")) ? u : null);

const KINDS = [
  { icon: Cake, key: "k1" },
  { icon: Users, key: "k2" },
  { icon: Crown, key: "k3" },
  { icon: PartyPopper, key: "k4" },
] as const;

export default async function EventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const te = await getTranslations({ locale, namespace: "Events" });
  const gallery = await prisma.galleryImage.findMany({ where: { isActive: true }, take: 1, orderBy: { sortOrder: "asc" } });
  const bg = usable(gallery[0]?.url);

  return (
    <>
      <SiteHeader />
      <PageHero title={te("heroTitle")} subtitle={te("heroSub")} bgImage={bg} />

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-14 text-center">
          <Reveal y={14}><p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-red">{te("eyebrow")}</p></Reveal>
          <TextReveal text={te("title")} className="font-display text-4xl text-content sm:text-5xl" />
        </div>
        <Reveal3D className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.12}>
          {KINDS.map((k, i) => (
            <div key={i} className="rounded-3xl border border-line bg-card p-7 text-center transition hover:border-brand-gold/40 hover:shadow-xl">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-red/10"><k.icon size={24} className="text-brand-red" /></span>
              <h3 className="font-display text-xl text-content">{te(`${k.key}t`)}</h3>
              <p className="mt-2 text-sm text-muted">{te(`${k.key}x`)}</p>
            </div>
          ))}
        </Reveal3D>
      </section>

      <section className="bg-surface-2 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-10 text-center">
            <TextReveal text={te("formTitle")} className="font-display text-4xl text-content sm:text-5xl" />
            <Reveal delay={0.15}><p className="mx-auto mt-4 max-w-lg text-muted">{te("formSub")}</p></Reveal>
          </div>
          <Reveal delay={0.1}><EventForm /></Reveal>
        </div>
      </section>

      <SiteFooter locale={locale} />
    </>
  );
}
