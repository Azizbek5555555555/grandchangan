"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import LocaleSwitcher from "./LocaleSwitcher";
import ThemeToggle from "./ThemeToggle";
import Logo from "./chrome/Logo";
import Fret from "./chrome/Fret";
import MobileMenu from "./chrome/MobileMenu";
import SealCta from "./chrome/SealCta";
import { NAV_LEFT, NAV_RIGHT, hasDarkHero, isActive, type HeaderContact, type NavItem } from "./chrome/nav";

export type { HeaderContact };

const MENU_ID = "site-mobile-menu";
const RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-light";

/**
 * Sayt header'i (client qismi) — xitoycha saroy darvozasi kompozitsiyasi.
 * - lg+: markazda osma 匾额 lavha-logo, havolalar uning ikki tomonida (har biri ustida xitoycha belgi),
 *   chap chetda til + tema, o'ng chetda "Stol band qilish" (lak-qizil, oltin ramka, muhr belgisi).
 * - Telefonda: logo + ixcham CTA + burger (≥44px).
 * - Qorong'i hero ustida shaffof; scroll'da (yoki krem hero'li sahifalarda) — to'q panel + oltin huiwen chegara.
 *   Scroll'da ixchamlashadi: xitoycha belgilar yig'iladi, lavha kichrayadi.
 */
export default function HeaderClient({ contact, solid = false }: { contact: HeaderContact; solid?: boolean }) {
  const tc = useTranslations("Common");
  const st = useTranslations("Site");
  const T = useTranslations("Chrome");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sahifa almashsa — menyu yopiladi
  useEffect(() => setOpen(false), [pathname]);

  const close = useCallback(() => setOpen(false), []);
  const filled = solid || scrolled || !hasDarkHero(pathname);
  const label = (n: NavItem) => (n.ns === "Common" ? tc(n.key) : st(n.key));

  // "Asosiy mazmunga o'tish": sahifalardagi <main> ga fokus (id talab qilinmaydi)
  function skipToMain(e: MouseEvent<HTMLAnchorElement>) {
    const main = document.querySelector("main");
    if (!main) return;
    e.preventDefault();
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    main.style.outline = "none";
    main.focus();
  }

  const navLink = (n: NavItem) => {
    const active = isActive(pathname, n.href);
    return (
      <li key={n.href}>
        <Link
          href={n.href}
          aria-current={active ? "page" : undefined}
          className={cn("group relative flex min-h-11 flex-col items-center justify-center whitespace-nowrap px-2 py-1 xl:px-3", RING)}
        >
          {/* Xitoycha belgi — faol sahifada qizil muhr ichida; scroll'da yig'iladi */}
          <span
            aria-hidden="true"
            className={cn(
              "flex items-end justify-center overflow-hidden transition-[height,opacity] duration-500 motion-reduce:transition-none",
              scrolled ? "h-0 opacity-0" : "h-[22px] opacity-100"
            )}
          >
            <span
              lang="zh"
              className={cn(
                "font-cn inline-flex h-[19px] items-center px-1 text-[13px] leading-none tracking-[0.18em] transition-colors duration-300",
                active
                  ? "rounded-[2px] bg-fire text-brand-cream shadow-sm shadow-night/40"
                  : "text-brand-gold-light/60 group-hover:text-brand-gold-light"
              )}
            >
              {n.cn}
            </span>
          </span>
          <span
            className={cn(
              "font-display mt-0.5 text-[15px] tracking-[0.01em] transition-colors duration-300 xl:text-[15.5px]",
              active ? "text-brand-gold-light" : "text-brand-cream/90 group-hover:text-brand-cream"
            )}
          >
            {label(n)}
          </span>
          {/* Oltin chiziq — markazdan yoyiladi, o'rtasida romb */}
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-x-2 bottom-0 flex items-center justify-center transition duration-500 ease-out-expo motion-reduce:transition-none xl:inset-x-3",
              active ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
            )}
          >
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-brand-gold" />
            <span className="mx-1 size-[5px] rotate-45 bg-brand-gold-light" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-brand-gold" />
          </span>
        </Link>
      </li>
    );
  };

  // Premium CTA (lak-qizil, oltin ramka, muhr). Telefonda va lg da qisqa yozuv — logo bilan to'qnashmasin
  const cta = (short: boolean) => <SealCta>{short ? T("ctaShort") : st("fReserve")}</SealCta>;

  return (
    <>
      <a
        href="#main"
        onClick={skipToMain}
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[80] focus-visible:inline-flex focus-visible:h-11 focus-visible:items-center focus-visible:rounded-[3px] focus-visible:bg-brand-cream focus-visible:px-5 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire"
      >
        {T("skip")}
      </a>

      <header className="fixed inset-x-0 top-0 z-50">
        {/* Fon: to'q lak panel + juda nozik panjara naqsh (faqat to'ldirilgan holatda) */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 overflow-hidden bg-night/[0.93] backdrop-blur-md transition-opacity duration-500",
            filled ? "opacity-100" : "opacity-0"
          )}
        >
          <span className="lattice-bg absolute inset-0 text-brand-gold/[0.045]" />
          <span className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-wine/40 to-transparent" />
        </div>
        {/* Pastki chegara: oltin ip + huiwen lenta */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0">
          <Fret
            tile={16}
            className={cn("h-[9.6px] text-brand-gold/40 transition-opacity duration-500", filled ? "opacity-100" : "opacity-0")}
          />
          <span
            className={cn(
              "block h-px bg-gradient-to-r from-transparent via-brand-gold to-transparent transition-opacity duration-500",
              filled ? "opacity-80" : "opacity-35"
            )}
          />
        </div>

        {/* ====== Telefon / planshet (lg dan kichik) ====== */}
        <div
          className={cn(
            "relative mx-auto flex max-w-7xl items-center gap-2 px-4 pb-2 transition-[height] duration-500 sm:gap-3 sm:px-8 lg:hidden",
            scrolled ? "h-[68px]" : "h-[78px]"
          )}
        >
          <Link href="/" aria-label={`GrandChangan — ${tc("home")}`} className={cn("mr-auto min-w-0 shrink rounded-[3px]", RING)}>
            <Logo size="md" />
          </Link>
          {cta(true)}
          {/* Burger — panjara eshik tugmasi */}
          <button
            ref={burgerRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls={MENU_ID}
            aria-label={T("openMenu")}
            className={cn(
              "group relative flex size-11 shrink-0 items-center justify-center rounded-[3px] border border-brand-gold/50 text-brand-cream transition hover:border-brand-gold-light hover:bg-brand-gold/10",
              RING
            )}
          >
            <span aria-hidden="true" className="pointer-events-none absolute inset-[3px] rounded-[2px] border border-brand-gold/20" />
            <span aria-hidden="true" className="flex w-5 flex-col items-center gap-[5px]">
              <span className="h-px w-5 bg-current" />
              <span className="flex w-5 items-center gap-1">
                <span className="h-px flex-1 bg-brand-gold-light" />
                <span className="size-[4px] rotate-45 bg-brand-gold-light transition-transform duration-500 group-hover:rotate-[225deg]" />
                <span className="h-px flex-1 bg-brand-gold-light" />
              </span>
              <span className="h-px w-5 bg-current" />
            </span>
          </button>
        </div>

        {/* ====== Desktop (lg+): [til, tema · havolalar] [匾额] [havolalar · CTA] ====== */}
        <nav
          aria-label={T("navLabel")}
          className={cn(
            "relative mx-auto hidden max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-6 pb-2.5 transition-[height] duration-500 lg:grid xl:px-8",
            scrolled ? "h-[70px]" : "h-[96px]"
          )}
        >
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="flex shrink-0 items-center gap-2">
              <LocaleSwitcher align="left" />
              <ThemeToggle />
            </div>
            <ul className="flex min-w-0 items-center justify-end">{NAV_LEFT.map(navLink)}</ul>
          </div>

          {/* Osma lavha: tepadan ikki oltin ip bilan osilgan */}
          <div className="relative mx-3 flex justify-center xl:mx-6">
            <Link
              href="/"
              aria-label={`GrandChangan — ${tc("home")}`}
              className={cn(
                "relative block origin-center rounded-[2px] transition-transform duration-500 ease-out-expo motion-reduce:transition-none",
                scrolled ? "scale-[0.78]" : "scale-100",
                RING
              )}
            >
              <span aria-hidden="true" className="pointer-events-none absolute bottom-full left-[18%] h-24 w-px bg-gradient-to-t from-brand-gold/80 to-brand-gold/0" />
              <span aria-hidden="true" className="pointer-events-none absolute bottom-full right-[18%] h-24 w-px bg-gradient-to-t from-brand-gold/80 to-brand-gold/0" />
              <Logo variant="plaque" />
              {/* Lavha ostidagi kichik qizil popuk */}
              <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-full flex -translate-x-1/2 flex-col items-center">
                <span className="size-[5px] rotate-45 bg-brand-gold-light" />
                <span className="h-2.5 w-[3px] rounded-b-full bg-fire" />
              </span>
            </Link>
          </div>

          <div className="flex min-w-0 items-center justify-between gap-2">
            <ul className="flex min-w-0 items-center">{NAV_RIGHT.map(navLink)}</ul>
            <div className="shrink-0">
              <span className="xl:hidden">{cta(true)}</span>
              <span className="hidden xl:inline">{cta(false)}</span>
            </div>
          </div>
        </nav>
      </header>

      <MobileMenu id={MENU_ID} open={open} onClose={close} contact={contact} pathname={pathname} returnFocusRef={burgerRef} />
    </>
  );
}
