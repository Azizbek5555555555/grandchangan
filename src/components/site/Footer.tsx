import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { cn, t as tt } from "@/lib/utils";
import { hoursFor, sameEveryDay } from "@/lib/hours";
import { Instagram, Send, Phone, MapPin, Mail, ArrowUpRight } from "lucide-react";
import LanternsDrop from "@/components/site/home/LanternsDrop";
import LocaleSwitcher from "./LocaleSwitcher";
import Fret from "./chrome/Fret";
import NightScene from "./chrome/NightScene";
import SealCta from "./chrome/SealCta";
import { NAV, HOME_ITEM, telHref } from "./chrome/nav";

const RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-light";

/** Ustun: vertikal oltin chiziq bilan ajratilgan, sarlavhasida xitoycha vertikal yorliq (muhr) */
function Column({ cn: glyph, title, id, children, className }: { cn: string; title: string; id: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative border-t border-brand-gold/15 pt-8 lg:border-t-0 lg:pl-9 lg:pt-0", className)}>
      <span aria-hidden="true" className="absolute inset-y-0 left-0 hidden w-px bg-gradient-to-b from-brand-gold/0 via-brand-gold/45 to-brand-gold/0 lg:block" />
      <span aria-hidden="true" className="absolute -left-[3px] top-0 hidden size-[7px] rotate-45 border border-brand-gold/60 bg-night lg:block" />
      <div className="mb-6 flex items-center gap-3.5">
        <span
          aria-hidden="true"
          lang="zh"
          className="font-cn flex h-[52px] w-8 shrink-0 items-center justify-center rounded-[2px] border border-brand-gold/40 bg-fire text-[15px] leading-[1.05] text-brand-cream shadow-md shadow-night/50 [writing-mode:vertical-rl]"
        >
          {glyph}
        </span>
        <h2 id={id} className="text-xs font-semibold uppercase tracking-[0.26em] text-brand-gold-light">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

/**
 * Sayt footer'i — "tungi Chang'an":
 * 1) tungi manzara (oy, tush tog'lari, ayvon, osma fonarlar) ustida taklif va bron CTA;
 * 2) katta brend yozuvi — mo'yqalamda 长安 + GRAND CHANGAN;
 * 3) vertikal oltin chiziqlar bilan ajratilgan 4 ustun (xitoycha yorliqlar bilan);
 * 4) huiwen lenta, til tanlash va copyright.
 * Ma'lumotlar (telefon, manzil, ish vaqti, ijtimoiy tarmoqlar) — admin Sozlamalar'idan.
 */
export default async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Common" });
  const st = await getTranslations({ locale, namespace: "Site" });
  const T = await getTranslations({ locale, namespace: "Chrome" });
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
  const mapLink = (g.mapLink as string) || "https://maps.app.goo.gl/5L3QJVcdrLRz1eEZ6";
  const instagram = g.instagram ? String(g.instagram) : "";
  const telegram = g.telegram ? String(g.telegram) : "";
  const label = (ns: "Common" | "Site", key: string) => (ns === "Common" ? t(key) : st(key));

  const linkCls = cn("rounded-[2px] transition-colors hover:text-brand-gold-light", RING);
  const iconBtn = cn(
    "flex size-11 items-center justify-center rounded-[3px] border border-brand-gold/40 text-brand-gold-light transition hover:border-brand-gold-light hover:bg-brand-gold/15",
    RING
  );

  return (
    <footer className="relative isolate overflow-hidden bg-night text-brand-cream">
      {/* ============ 1. Tungi manzara + taklif ============ */}
      <section aria-labelledby="footer-cta-title" className="relative isolate">
        <NightScene />
        <LanternsDrop
          className="hidden sm:block"
          items={[
            { left: "4%", size: 46, rope: 40, char: "福" },
            { left: "64%", size: 34, rope: 110, char: "喜" },
          ]}
        />
        <LanternsDrop className="sm:hidden" items={[{ left: "8%", size: 34, rope: 26, char: "福" }]} />

        <div className="mx-auto max-w-7xl px-5 pb-48 pt-40 sm:px-8 sm:pb-60 sm:pt-44 lg:pb-72 lg:pt-36">
          <div className="max-w-2xl">
            <p className="flex items-center gap-3">
              <span
                aria-hidden="true"
                lang="zh"
                className="font-cn flex size-11 items-center justify-center rounded-[3px] border border-brand-gold/50 bg-fire text-lg leading-none text-brand-cream shadow-md shadow-night/50"
              >
                欢迎
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.26em] text-brand-gold-light">{st("fCtaEyebrow")}</span>
            </p>
            <h2 id="footer-cta-title" className="font-display mt-6 text-balance text-[clamp(2.4rem,6.6vw,5rem)] leading-[1.06] text-brand-cream">
              {st("fCtaTitle")}
            </h2>
            <span aria-hidden="true" className="mt-6 flex w-48 items-center gap-2">
              <span className="h-px flex-1 bg-gradient-to-r from-brand-gold to-brand-gold/0" />
              <span className="size-[6px] rotate-45 bg-brand-gold-light" />
              <span className="h-px w-8 bg-brand-gold/50" />
            </span>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-brand-cream/80 sm:text-lg">{st("aboutCtaSub")}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <SealCta size="lg">
                {st("fReserve")} <ArrowUpRight size={17} aria-hidden="true" className="ml-1 inline-block align-[-3px]" />
              </SealCta>
              <a
                href={telHref(phones[0])}
                className={cn(
                  "inline-flex h-14 items-center gap-2.5 rounded-[3px] border border-brand-gold/50 bg-night/40 px-6 text-[15px] font-semibold tracking-[0.03em] text-brand-cream backdrop-blur-sm transition hover:border-brand-gold-light hover:bg-brand-gold/10",
                  RING
                )}
              >
                <Phone size={17} aria-hidden="true" className="text-brand-gold-light" /> {phones[0]}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 2. Brend yozuvi ============ */}
      <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-6 text-center sm:px-8 lg:pb-20">
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-transparent to-brand-gold/50" />
          <Link href="/" aria-label={`GrandChangan — ${t("home")}`} className={cn("relative rounded-[3px] px-2", RING)}>
            <span aria-hidden="true" lang="zh" className="font-cn block text-[clamp(4.5rem,15vw,9.5rem)] leading-none text-brand-gold-light">
              长安
            </span>
            <span
              aria-hidden="true"
              lang="zh"
              className="font-cn absolute -right-4 bottom-1 flex h-12 w-7 items-center justify-center rounded-[2px] bg-fire text-[13px] leading-[1.05] text-brand-cream shadow-md shadow-night/60 [writing-mode:vertical-rl] sm:-right-7 sm:h-16 sm:w-9 sm:text-base"
            >
              美食
            </span>
          </Link>
          <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-l from-transparent to-brand-gold/50" />
        </div>
        <p className="font-display mt-4 text-[clamp(1.15rem,4.4vw,2.6rem)] uppercase leading-[1.1] tracking-[0.3em] text-brand-cream">
          Grand <span className="italic text-brand-gold-light">Changan</span>
        </p>
        <p className="font-display mx-auto mt-4 max-w-xl text-base italic text-brand-gold-light/90 sm:text-lg">{T("footMotto")}</p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-brand-cream/70">{st("fTagline")}</p>
      </div>

      {/* ============ 3. Ustunlar ============ */}
      <div className="relative">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-x-10 gap-y-10 px-5 pb-16 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.15fr_1fr_1fr_1fr] lg:gap-x-0 lg:pb-20">
          {/* Sahifalar */}
          <Column cn="导航" title={st("fPages")} id="footer-pages">
            <nav aria-labelledby="footer-pages">
              <ul className="grid grid-cols-2 gap-x-4 text-[15px] text-brand-cream/80 lg:grid-cols-1">
                {[HOME_ITEM, ...NAV].map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} className={cn(linkCls, "group inline-flex min-h-11 items-center gap-3")}>
                      <span aria-hidden="true" lang="zh" className="font-cn w-8 shrink-0 text-sm leading-none text-brand-gold/70 transition-colors group-hover:text-brand-gold-light">
                        {n.cn}
                      </span>
                      {label(n.ns, n.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </Column>

          {/* Aloqa */}
          <Column cn="联系" title={st("fContact")} id="footer-contact">
            <ul className="text-[15px] text-brand-cream/85">
              {phones.map((p) => (
                <li key={p}>
                  <a href={telHref(p)} className={cn(linkCls, "inline-flex min-h-11 items-center gap-3 whitespace-nowrap")}>
                    <Phone size={16} aria-hidden="true" className="shrink-0 text-brand-gold-light" /> {p}
                  </a>
                </li>
              ))}
              <li>
                <a href={`mailto:${email}`} className={cn(linkCls, "inline-flex min-h-11 items-center gap-3 break-all")}>
                  <Mail size={16} aria-hidden="true" className="shrink-0 text-brand-gold-light" /> {email}
                </a>
              </li>
            </ul>
            {(instagram || telegram) && (
              <div className="mt-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-cream/70">{st("hSocial")}</p>
                <div className="flex gap-2.5">
                  {instagram && (
                    <a href={instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className={iconBtn}>
                      <Instagram size={18} aria-hidden="true" />
                    </a>
                  )}
                  {telegram && (
                    <a href={telegram} target="_blank" rel="noreferrer" aria-label="Telegram" className={iconBtn}>
                      <Send size={18} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </Column>

          {/* Ish vaqti */}
          <Column cn="时辰" title={st("fHours")} id="footer-hours">
            {everyDay ? (
              <div>
                <p className="text-sm text-brand-cream/75">{st("fEveryday")}</p>
                <p className="font-display mt-2 whitespace-nowrap text-[2.1rem] leading-none text-brand-cream">
                  {everyDay.openTime}
                  <span className="mx-2 text-brand-gold/70">—</span>
                  {everyDay.closeTime}
                </p>
                <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-light">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-jade ring-4 ring-jade/25" />
                  {st("fOpen")}
                </p>
              </div>
            ) : (
              <ul className="max-w-xs space-y-1.5 text-sm">
                {week.map((h) => (
                  <li key={h.dayOfWeek} className="flex justify-between gap-4 border-b border-brand-gold/10 pb-1.5 last:border-0">
                    <span className="capitalize text-brand-cream/70">{dayName(h.dayOfWeek)}</span>
                    <span className={h.isClosed ? "text-brand-cream/60" : "text-brand-cream"}>
                      {h.isClosed ? st("closed") : `${h.openTime} — ${h.closeTime}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Column>

          {/* Manzil + xarita */}
          <Column cn="寻访" title={st("hWhere")} id="footer-where">
            <p className="flex items-start gap-3 text-[15px] leading-snug text-brand-cream/85">
              <MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-gold-light" /> {address}
            </p>
            <a
              href={mapLink}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "group mt-5 inline-flex min-h-11 items-center gap-2 rounded-[3px] border border-brand-gold/45 px-4 text-sm font-semibold text-brand-gold-light transition hover:border-brand-gold-light hover:bg-brand-gold/10",
                RING
              )}
            >
              {st("openMaps")}
              <ArrowUpRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </Column>
        </div>
      </div>

      {/* ============ 4. Pastki qator ============ */}
      <div className="relative">
        <Fret tile={20} className="h-3 text-brand-gold/25" />
        <div className="border-t border-brand-gold/15">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-6 text-center text-xs text-brand-cream/65 sm:px-8 lg:flex-row lg:text-left">
            <span>© {new Date().getFullYear()} GrandChangan. {st("fRights")}</span>
            <LocaleSwitcher variant="inline" className="justify-center" />
            <span>{st("fMadeBy")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
