import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/utils";
import { Phone, Mail, MapPin, ExternalLink } from "lucide-react";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/motion/Reveal";

export const dynamic = "force-dynamic";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const st = await getTranslations({ locale, namespace: "Site" });
  const tc = await getTranslations({ locale, namespace: "Common" });

  const [setting, hours] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: "general" } }),
    prisma.workingHour.findMany({ orderBy: { dayOfWeek: "asc" } }),
  ]);
  const g = (setting?.value as Record<string, unknown>) || {};
  const phone = Array.isArray(g.phones) && g.phones[0] ? String(g.phones[0]) : "+998 90 503 15 68";
  const email = (g.email as string) || "info@grandchangan.uz";
  const address = t(g.address, locale) || "Ibn Xoldun 10B, Samarqand, Samarqand viloyati";
  const mapQuery = (g.mapQuery as string) || "Grand Changan Restaurant, Ibn Xoldun 10B, Samarqand";
  const mapLink = (g.mapLink as string) || "https://maps.app.goo.gl/5L3QJVcdrLRz1eEZ6";
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;
  const dayName = (dow: number) => new Intl.DateTimeFormat(locale, { weekday: "long" }).format(new Date(2024, 0, 7 + dow));

  return (
    <>
      <SiteHeader />
      <PageHero title={tc("contact")} subtitle={st("contactSub")} />
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Reveal className="flex flex-col justify-between">
            <div className="space-y-4">
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-brand-red/40">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-red/10"><Phone size={20} className="text-brand-red" /></span>
                <div><p className="text-xs uppercase tracking-wider text-neutral-400">{st("cPhone")}</p><p className="font-medium text-brand-ink">{phone}</p></div>
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-brand-red/40">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-red/10"><Mail size={20} className="text-brand-red" /></span>
                <div><p className="text-xs uppercase tracking-wider text-neutral-400">{st("cEmail")}</p><p className="font-medium text-brand-ink">{email}</p></div>
              </a>
              <a href={mapLink} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-brand-red/40">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-red/10"><MapPin size={20} className="text-brand-red" /></span>
                <div><p className="text-xs uppercase tracking-wider text-neutral-400">{st("cAddress")}</p><p className="font-medium text-brand-ink">{address}</p></div>
              </a>
            </div>
            <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5">
              <h2 className="mb-3 font-display text-xl text-brand-ink">{st("cHours")}</h2>
              <ul className="space-y-1.5 text-sm text-neutral-600">
                {hours.map((h) => (
                  <li key={h.dayOfWeek} className="flex justify-between border-b border-neutral-100 py-1.5 last:border-0">
                    <span className="capitalize">{dayName(h.dayOfWeek)}</span>
                    <span className="font-medium">{h.isClosed ? st("closed") : `${h.openTime} — ${h.closeTime}`}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-col">
            <div className="relative min-h-[460px] flex-1 overflow-hidden rounded-2xl border border-neutral-200 shadow-sm">
              <iframe src={mapSrc} title="GrandChangan" className="absolute inset-0 h-full w-full" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
            </div>
            <a href={mapLink} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-ink py-3 font-medium text-brand-cream transition hover:bg-brand-ink/90">
              {st("openMaps")} <ExternalLink size={16} />
            </a>
          </Reveal>
        </div>
      </div>
      <SiteFooter locale={locale} />
    </>
  );
}
