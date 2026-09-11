import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Phone, Mail, MapPin } from "lucide-react";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/motion/Reveal";
export const dynamic = "force-dynamic";
export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [setting, hours] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: "general" } }),
    prisma.workingHour.findMany({ orderBy: { dayOfWeek: "asc" } }),
  ]);
  const g = (setting?.value as Record<string, unknown>) || {};
  const DAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
  return (
    <>
      <SiteHeader />
      <PageHero title="Aloqa" subtitle="Biz bilan bog'laning" />
      <div className="mx-auto max-w-4xl px-5 py-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
          <Reveal className="space-y-5">
            {g.phones ? <p className="flex items-center gap-3 text-neutral-700"><span className="rounded-full bg-brand-red/10 p-2.5"><Phone size={18} className="text-brand-red" /></span> {(g.phones as string[]).join(", ")}</p> : null}
            {g.email ? <p className="flex items-center gap-3 text-neutral-700"><span className="rounded-full bg-brand-red/10 p-2.5"><Mail size={18} className="text-brand-red" /></span> {String(g.email)}</p> : null}
            {g.address ? <p className="flex items-center gap-3 text-neutral-700"><span className="rounded-full bg-brand-red/10 p-2.5"><MapPin size={18} className="text-brand-red" /></span> {String(g.address)}</p> : null}
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mb-4 font-display text-2xl text-brand-ink">Ish vaqti</h2>
            <ul className="space-y-2 text-sm text-neutral-600">
              {hours.map((h) => (
                <li key={h.dayOfWeek} className="flex justify-between border-b border-neutral-100 py-1.5">
                  <span>{DAYS[h.dayOfWeek]}</span>
                  <span className="font-medium">{h.isClosed ? "Yopiq" : `${h.openTime} — ${h.closeTime}`}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
      <SiteFooter locale={locale} />
    </>
  );
}
