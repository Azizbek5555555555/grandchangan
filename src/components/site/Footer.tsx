import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { t as tt } from "@/lib/utils";
import { Instagram, Send, Phone, MapPin, ArrowUpRight, Clock } from "lucide-react";

export default async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Common" });
  const st = await getTranslations({ locale, namespace: "Site" });
  const general = await prisma.siteSetting.findUnique({ where: { key: "general" } });
  const g = (general?.value as Record<string, unknown>) || {};
  const phones = Array.isArray(g.phones) && g.phones.length ? (g.phones as string[]) : ["+998 90 503 15 68"];

  return (
    <footer className="relative overflow-hidden bg-brand-ink text-brand-cream">
      {/* dekorativ katta ieroglif */}
      <span className="pointer-events-none absolute -right-10 top-0 select-none font-display text-[16rem] leading-none text-white/[0.03] sm:text-[22rem]">餐厅</span>

      {/* CTA band */}
      <div className="relative border-b border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-14 text-center md:flex-row md:text-left">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-brand-gold">{st("fCtaEyebrow")}</p>
            <h2 className="font-display text-4xl text-brand-cream sm:text-5xl">{st("fCtaTitle")}</h2>
          </div>
          <Link href="/reservation" className="btn-gold-sheen inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-red px-9 py-4 font-medium text-white transition hover:bg-brand-red-dark">
            {st("fReserve")} <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>

      {/* asosiy */}
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <p className="font-display text-3xl text-brand-gold-light">Grand<span className="text-brand-cream">Changan</span></p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-cream/50">
            {String((g.name as string) || "Haqiqiy Xitoy taomlari")} · {st("fTagline")}
          </p>
          <div className="mt-6 flex gap-3">
            <a href={g.instagram ? String(g.instagram) : "#"} target="_blank" rel="noreferrer" className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-gold/30 text-brand-gold-light transition hover:bg-brand-gold hover:text-brand-ink"><Instagram size={18} /></a>
            <a href={g.telegram ? String(g.telegram) : "#"} target="_blank" rel="noreferrer" className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-gold/30 text-brand-gold-light transition hover:bg-brand-gold hover:text-brand-ink"><Send size={18} /></a>
          </div>
        </div>

        <div>
          <p className="mb-5 text-xs uppercase tracking-[0.25em] text-brand-gold">{st("fPages")}</p>
          <ul className="space-y-3 text-sm text-brand-cream/60">
            <li><Link href="/menu" className="transition hover:text-brand-gold-light">{t("menu")}</Link></li>
            <li><Link href="/reservation" className="transition hover:text-brand-gold-light">{t("reservation")}</Link></li>
            <li><Link href="/gallery" className="transition hover:text-brand-gold-light">{t("gallery")}</Link></li>
            <li><Link href="/about" className="transition hover:text-brand-gold-light">{t("about")}</Link></li>
            <li><Link href="/blog" className="transition hover:text-brand-gold-light">{t("blog")}</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-5 text-xs uppercase tracking-[0.25em] text-brand-gold">{st("fContact")}</p>
          <ul className="space-y-4 text-sm text-brand-cream/60">
            {phones.map((p) => (
              <li key={p} className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5"><Phone size={15} className="text-brand-gold/70" /></span> {p}</li>
            ))}
            <li className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5"><MapPin size={15} className="text-brand-gold/70" /></span> {tt(g.address, locale) || "Ibn Xoldun 10B, Samarqand"}</li>
          </ul>
        </div>

        <div>
          <p className="mb-5 text-xs uppercase tracking-[0.25em] text-brand-gold">{st("fHours")}</p>
          <div className="rounded-2xl border border-brand-gold/15 p-5">
            <p className="flex items-center gap-2 text-sm text-brand-cream/60"><Clock size={15} className="text-brand-gold/70" /> {st("fEveryday")}</p>
            <p className="mt-2 font-display text-3xl text-brand-cream">11:00 — 23:00</p>
            <p className="mt-1 text-xs text-brand-cream/40">{st("fOpen")}</p>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-brand-cream/40 sm:flex-row">
          <span>© {new Date().getFullYear()} GrandChangan. {st("fRights")}</span>
          <span>{st("fMadeBy")}</span>
        </div>
      </div>
    </footer>
  );
}
