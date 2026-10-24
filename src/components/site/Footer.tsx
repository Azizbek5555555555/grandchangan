import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { t as tt } from "@/lib/utils";
import { hoursFor, sameEveryDay } from "@/lib/hours";
import { Instagram, Send, Phone, MapPin, ArrowUpRight, Clock, Mail } from "lucide-react";
import ButtonLink, { btnClass } from "@/components/site/kit/ButtonLink";
import FretBand from "@/components/site/kit/FretBand";
import Blob from "@/components/site/kit/Blob";
import Lanterns from "@/components/three/Lanterns";
import LocaleSwitcher from "./LocaleSwitcher";
import Logo from "./chrome/Logo";
import { NAV, telHref } from "./chrome/nav";

export default async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Common" });
  const st = await getTranslations({ locale, namespace: "Site" });
  const [general, hours] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: "general" } }),
    prisma.workingHour.findMany({ select: { dayOfWeek: true, openTime: true, closeTime: true, isClosed: true } }),
  ]);
  // Ish vaqti admin Sozlamalar'idan: hamma kun bir xil bo'lsa — bitta qator, aks holda kunma-kun
  const everyDay = sameEveryDay(hours);
  const dayName = (dow: number) => new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(Date.UTC(2024, 0, 7 + dow)));
  const week = [1, 2, 3, 4, 5, 6, 0].map((d) => hoursFor(hours, d));
  const g = (general?.value as Record<string, unknown>) || {};
  const phones = Array.isArray(g.phones) && g.phones.length ? (g.phones as string[]) : ["+998 90 503 15 68"];
  // Aloqa sahifasidagi bilan bir xil zaxira qiymatlar
  const email = (g.email as string) || "info@grandchangan.uz";
  const address = tt(g.address, locale) || "Ibn Xoldun 10B, Samarqand";
  const mapLink = (g.mapLink as string) || "";
  const instagram = g.instagram ? String(g.instagram) : "";
  const telegram = g.telegram ? String(g.telegram) : "";
  const label = (ns: "Common" | "Site", key: string) => (ns === "Common" ? t(key) : st(key));

  const colHead = "mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-gold-light";
  const linkCls = "rounded-md transition hover:text-saffron focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron";
  const socialCls = "flex h-11 w-11 items-center justify-center rounded-full border border-brand-gold/35 text-brand-gold-light transition hover:border-saffron hover:bg-saffron hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron";

  return (
    <footer className="relative isolate overflow-hidden bg-night text-brand-cream">
      {/* ============ CTA band ============ */}
      <section aria-labelledby="footer-cta-title" className="relative">
        <Blob variant="b" className="absolute -left-48 -top-32 -z-10 w-[34rem] text-fire/20 sm:w-[44rem]" />
        <span aria-hidden="true" className="lattice-bg pointer-events-none absolute inset-0 -z-10 text-brand-gold/[0.04]" />
        <div className="mx-auto grid max-w-7xl items-center gap-6 px-5 pb-16 pt-6 sm:px-8 sm:pb-24 lg:grid-cols-[1.25fr_1fr] lg:gap-10 lg:py-28">
          {/* Fonarlar — faqat bezak; telefonda matn ustida "osilib" turadi */}
          <div aria-hidden="true" className="pointer-events-none relative order-first h-44 sm:h-56 lg:order-last lg:h-[26rem]">
            <Blob variant="c" className="absolute left-1/2 top-1/2 h-[90%] -translate-x-1/2 -translate-y-1/2 text-fire/25" />
            <Lanterns className="absolute inset-0 h-full w-full" />
          </div>

          <div>
            <p className="flex items-center gap-3">
              <span aria-hidden="true" lang="zh" className="font-cn text-3xl leading-none text-saffron">欢迎</span>
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cream/80">{st("fCtaEyebrow")}</span>
            </p>
            <h2 id="footer-cta-title" className="font-poster mt-5 text-balance text-[clamp(2.2rem,7.4vw,5rem)] leading-[1.08] text-brand-cream">
              {st("fCtaTitle")}
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-brand-cream/75 sm:text-lg">{st("aboutCtaSub")}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/reservation" variant="saffron" blob className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cream">
                {st("fReserve")} <ArrowUpRight size={18} aria-hidden="true" />
              </ButtonLink>
              <a href={telHref(phones[0])} className={`${btnClass("ghost-light", "lg")} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron`}>
                <Phone size={17} aria-hidden="true" /> {phones[0]}
              </a>
            </div>
          </div>
        </div>
      </section>

      <FretBand className="text-fire/50" />

      {/* ============ Ustunlar ============ */}
      <div className="relative">
        <span aria-hidden="true" lang="zh" className="font-cn pointer-events-none absolute -bottom-10 -right-6 -z-10 select-none text-[13rem] leading-none text-brand-gold/[0.05] sm:text-[20rem]">
          长安
        </span>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 py-16 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.35fr_0.9fr_1.2fr_1.15fr] lg:gap-10 lg:py-20">
          {/* Logo + shior + ijtimoiy tarmoqlar */}
          <div>
            <Link href="/" aria-label={`GrandChangan — ${t("home")}`} className="inline-block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron">
              <Logo size="lg" />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-brand-cream/65">
              {String((g.name as string) || "Haqiqiy Xitoy taomlari")} · {st("fTagline")}
            </p>
            {(instagram || telegram) && (
              <div className="mt-6 flex gap-3">
                {instagram && (
                  <a href={instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className={socialCls}>
                    <Instagram size={18} aria-hidden="true" />
                  </a>
                )}
                {telegram && (
                  <a href={telegram} target="_blank" rel="noreferrer" aria-label="Telegram" className={socialCls}>
                    <Send size={18} aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Sahifalar */}
          <nav aria-labelledby="footer-pages">
            <h2 id="footer-pages" className={colHead}>{st("fPages")}</h2>
            <ul className="space-y-1 text-[15px] text-brand-cream/75">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className={`${linkCls} inline-flex min-h-9 items-center`}>{label(n.ns, n.key)}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Aloqa */}
          <div>
            <h2 className={colHead}>{st("fContact")}</h2>
            <ul className="space-y-3 text-[15px] text-brand-cream/80">
              <li className="flex items-start gap-3">
                <MapPin size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-saffron" />
                {mapLink ? (
                  <a href={mapLink} target="_blank" rel="noreferrer" className={linkCls}>{address}</a>
                ) : (
                  <span>{address}</span>
                )}
              </li>
              {phones.map((p) => (
                <li key={p} className="flex items-center gap-3">
                  <Phone size={17} aria-hidden="true" className="shrink-0 text-saffron" />
                  <a href={telHref(p)} className={`${linkCls} whitespace-nowrap`}>{p}</a>
                </li>
              ))}
              <li className="flex items-center gap-3">
                <Mail size={17} aria-hidden="true" className="shrink-0 text-saffron" />
                <a href={`mailto:${email}`} className={`${linkCls} break-all`}>{email}</a>
              </li>
            </ul>
          </div>

          {/* Ish vaqti */}
          <div>
            <h2 className={colHead}>{st("fHours")}</h2>
            {everyDay ? (
              <div className="rounded-2xl border border-brand-gold/20 bg-night-2 p-5">
                <p className="flex items-center gap-2 text-sm text-brand-cream/70"><Clock size={15} aria-hidden="true" className="text-saffron" /> {st("fEveryday")}</p>
                <p className="font-display mt-2 text-3xl text-brand-cream">{everyDay.openTime} — {everyDay.closeTime}</p>
                <p className="mt-1 text-xs text-brand-cream/60">{st("fOpen")}</p>
              </div>
            ) : (
              <ul className="space-y-1.5 rounded-2xl border border-brand-gold/20 bg-night-2 p-5 text-sm">
                {week.map((h) => (
                  <li key={h.dayOfWeek} className="flex justify-between gap-4">
                    <span className="capitalize text-brand-cream/65">{dayName(h.dayOfWeek)}</span>
                    <span className={h.isClosed ? "text-brand-cream/55" : "text-brand-cream"}>{h.isClosed ? st("closed") : `${h.openTime} — ${h.closeTime}`}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ============ Pastki qator ============ */}
      <div className="relative border-t border-brand-gold/15">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-6 text-center text-xs text-brand-cream/60 sm:px-8 lg:flex-row lg:text-left">
          <span>© {new Date().getFullYear()} GrandChangan. {st("fRights")}</span>
          <LocaleSwitcher variant="inline" className="justify-center" />
          <span>{st("fMadeBy")}</span>
        </div>
      </div>
    </footer>
  );
}
