import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import PageHero from "@/components/site/PageHero";
import EventForm from "@/components/site/EventForm";
import Reveal from "@/components/motion/Reveal";
import RevealGroup from "@/components/motion/RevealGroup";
import TextReveal from "@/components/motion/TextReveal";
import { PartyPopper, Crown, Cake, Users } from "lucide-react";

export const dynamic = "force-dynamic";
const usable = (u?: string | null) => (u && (u.startsWith("/uploads") || u.startsWith("http")) ? u : null);

const KINDS = [
  { icon: Cake, title: "Tug'ilgan kun", text: "Yaqinlaringiz bilan unutilmas bayram." },
  { icon: Users, title: "Korporativ", text: "Jamoa uchun professional muhit." },
  { icon: Crown, title: "Yubiley", text: "Maxsus sanani alohida nishonlang." },
  { icon: PartyPopper, title: "To'y va bazmlar", text: "Katta tadbirlar uchun VIP zallar." },
];

export default async function EventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const gallery = await prisma.galleryImage.findMany({ where: { isActive: true }, take: 1, orderBy: { sortOrder: "asc" } });
  const bg = usable(gallery[0]?.url);

  return (
    <>
      <SiteHeader />
      <PageHero title="Tadbirlar va bazmlar" subtitle="To'y, yubiley, korporativ tadbirlar" bgImage={bg} />

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-14 text-center">
          <Reveal y={14}><p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-red">Imkoniyatlar</p></Reveal>
          <TextReveal text="Har qanday tadbir uchun" className="font-display text-4xl text-brand-ink sm:text-5xl" />
        </div>
        <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1} y={40}>
          {KINDS.map((k, i) => (
            <div key={i} className="rounded-3xl border border-neutral-200 bg-white p-7 text-center transition hover:border-brand-gold/40 hover:shadow-xl">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-red/10"><k.icon size={24} className="text-brand-red" /></span>
              <h3 className="font-display text-xl text-brand-ink">{k.title}</h3>
              <p className="mt-2 text-sm text-neutral-500">{k.text}</p>
            </div>
          ))}
        </RevealGroup>
      </section>

      <section className="bg-brand-cream py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-10 text-center">
            <TextReveal text="Ariza qoldiring" className="font-display text-4xl text-brand-ink sm:text-5xl" />
            <Reveal delay={0.15}><p className="mx-auto mt-4 max-w-lg text-neutral-500">Zal va menyuni band qiling — biz siz bilan bog&apos;lanamiz.</p></Reveal>
          </div>
          <Reveal delay={0.1}><EventForm /></Reveal>
        </div>
      </section>

      <SiteFooter locale={locale} />
    </>
  );
}
