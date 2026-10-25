import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/utils";
import { Phone, Mail, MapPin, ExternalLink } from "lucide-react";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import ContactHero from "@/components/site/heroes/ContactHero";
import { dayOfWeekOf, hoursSummary } from "@/lib/hours";
import { restaurantDay } from "@/lib/time";
import Reveal from "@/components/motion/Reveal";
import SectionHead from "@/components/site/kit/SectionHead";
import { CloudLine } from "@/components/site/pages/Ornament";
import { phoneOf } from "@/lib/contact";

export const dynamic = "force-dynamic";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const st = await getTranslations({ locale, namespace: "Site" });
  const tc = await getTranslations({ locale, namespace: "Common" });
  const [p2, h2] = await Promise.all([
    getTranslations({ locale, namespace: "Pages2" }),
    getTranslations({ locale, namespace: "Home2" }),
  ]);

  const [setting, hours] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: "general" } }),
    prisma.workingHour.findMany({ orderBy: { dayOfWeek: "asc" } }),
  ]);
  const g = (setting?.value as Record<string, unknown>) || {};
  const phone = phoneOf(g);
  const email = (g.email as string) || "info@grandchangan.uz";
  const address = t(g.address, locale) || "Ibn Xoldun 10B, Samarqand, Samarqand viloyati";
  const mapQuery = (g.mapQuery as string) || "Grand Changan Restaurant, Ibn Xoldun 10B, Samarqand";
  const mapLink = (g.mapLink as string) || "https://maps.app.goo.gl/5L3QJVcdrLRz1eEZ6";
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;
  const dayName = (dow: number) => new Intl.DateTimeFormat(locale, { weekday: "long" }).format(new Date(2024, 0, 7 + dow));

  return (
    <>
      <SiteHeader />
      <ContactHero
        title={tc("contact")}
        sub={st("contactSub")}
        phone={phone}
        address={address}
        hours={(() => {
          const hs = hoursSummary(hours, dayOfWeekOf(restaurantDay()));
          return `${hs.every ? st("fOpen") : h2("today")} · ${hs.value ?? st("closed")}`;
        })()}
        labels={{ phone: st("cPhone"), address: st("cAddress"), hours: st("cHours"), place: `${tc("brand")} · ${p2("heroCity")}` }}
      />
      <main id="main" className="bg-paper">
      <div className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-8">
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHead font="serif" cn="联系我们" eyebrow={st("contactSub")} title={st("hWhere")} />
          <CloudLine className="w-40 text-fire/40" />
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Reveal className="flex flex-col justify-between">
            <div className="space-y-4">
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-4 group rounded-2xl border border-line bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-fire/50 hover:shadow-lg">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-fire transition group-hover:bg-fire-deep"><Phone size={20} className="text-brand-cream" /></span>
                <div><p className="text-xs uppercase tracking-wider text-muted">{st("cPhone")}</p><p className="font-medium text-content">{phone}</p></div>
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-4 group rounded-2xl border border-line bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-fire/50 hover:shadow-lg">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-fire transition group-hover:bg-fire-deep"><Mail size={20} className="text-brand-cream" /></span>
                <div><p className="text-xs uppercase tracking-wider text-muted">{st("cEmail")}</p><p className="font-medium text-content">{email}</p></div>
              </a>
              <a href={mapLink} target="_blank" rel="noreferrer" className="flex items-center gap-4 group rounded-2xl border border-line bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-fire/50 hover:shadow-lg">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-fire transition group-hover:bg-fire-deep"><MapPin size={20} className="text-brand-cream" /></span>
                <div><p className="text-xs uppercase tracking-wider text-muted">{st("cAddress")}</p><p className="font-medium text-content">{address}</p></div>
              </a>
            </div>
            <div className="mt-8 rounded-2xl border border-line bg-card p-5">
              <h2 className="mb-3 flex items-center gap-3 font-display text-2xl text-content"><span lang="zh" aria-hidden="true" className="font-cn text-fire-ink">时</span>{st("cHours")}</h2>
              <ul className="space-y-1.5 text-sm text-muted">
                {hours.map((h) => (
                  <li key={h.dayOfWeek} className="flex justify-between border-b border-line py-1.5 last:border-0">
                    <span className="capitalize">{dayName(h.dayOfWeek)}</span>
                    <span className="font-medium">{h.isClosed ? st("closed") : `${h.openTime} — ${h.closeTime}`}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-col">
            <div className="relative min-h-[460px] flex-1 overflow-hidden rounded-3xl border-4 border-card shadow-xl shadow-content/10">
              <iframe src={mapSrc} title="GrandChangan" className="absolute inset-0 h-full w-full" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
            </div>
            <a href={mapLink} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center justify-center gap-2 min-h-12 rounded-full bg-night py-3 font-semibold text-brand-cream transition hover:bg-night-3">
              {st("openMaps")} <ExternalLink size={16} />
            </a>
          </Reveal>
        </div>
      </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
