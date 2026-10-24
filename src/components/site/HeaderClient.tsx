"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { btnClass } from "@/components/site/kit/ButtonLink";
import LocaleSwitcher from "./LocaleSwitcher";
import ThemeToggle from "./ThemeToggle";
import Logo from "./chrome/Logo";
import MobileMenu from "./chrome/MobileMenu";
import { NAV, hasDarkHero, isActive, type HeaderContact } from "./chrome/nav";

export type { HeaderContact };

const MENU_ID = "site-mobile-menu";

/**
 * Sayt header'i (client qismi).
 * - Qizil/tungi hero ustida shaffof + krem matn; 40px dan keyin — to'q yarim-shaffof panel (bg-night/90 + blur), ixchamroq.
 * - Tepasida hero bo'lmagan sahifalarda (yoki `solid`) — doim to'q panel, matn o'qilsin.
 * - lg+: qatorda havolalar + til + tema + CTA; telefonda: logo + ixcham CTA + burger (≥44px).
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
  const label = (ns: "Common" | "Site", key: string) => (ns === "Common" ? tc(key) : st(key));

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-500",
          filled ? "border-brand-gold/15 bg-night/90 backdrop-blur-md" : "border-transparent bg-transparent"
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-7xl items-center gap-2 px-4 transition-[height] duration-500 sm:gap-3 sm:px-8",
            scrolled ? "h-16" : "h-20 lg:h-24"
          )}
        >
          {/* Logo — kichrayishi mumkin (min-w-0), CTA va burger esa hech qachon siqilmaydi */}
          <Link
            href="/"
            aria-label={`GrandChangan — ${tc("home")}`}
            className="mr-auto min-w-0 shrink rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron lg:mr-0"
          >
            <Logo size="md" />
          </Link>

          {/* Desktop navigatsiya */}
          <nav aria-label={T("navLabel")} className="hidden flex-1 justify-center lg:flex">
            <ul className="flex items-center xl:gap-1">
              {NAV.map((n) => {
                const active = isActive(pathname, n.href);
                return (
                  <li key={n.href} className={cn(n.xlOnly && "hidden xl:block")}>
                    <Link
                      href={n.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex h-11 items-center whitespace-nowrap rounded-full px-2.5 text-[14px] font-medium transition xl:px-3 xl:text-[15px]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron",
                        active ? "text-brand-cream" : "text-brand-cream/85 hover:text-brand-cream"
                      )}
                    >
                      {label(n.ns, n.key)}
                      {/* Faol sahifa belgisi — zafar chiziq */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute inset-x-2.5 bottom-1.5 h-0.5 origin-left rounded-full bg-saffron transition-transform duration-300 xl:inset-x-3",
                          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-50"
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LocaleSwitcher className="hidden lg:block" />
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>

            <Link
              href="/reservation"
              className={cn(
                btnClass("saffron", "md"),
                "h-11 shrink-0 whitespace-nowrap px-4 text-[13px] sm:px-5 sm:text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cream"
              )}
            >
              {/* Telefonda qisqa yozuv — logo bilan to'qnashmasin */}
              <span className="sm:hidden">{T("ctaShort")}</span>
              <span className="hidden sm:inline">{st("fReserve")}</span>
              <ArrowUpRight size={16} aria-hidden="true" className="hidden sm:block" />
            </Link>

            {/* Burger — faqat lg dan kichik ekranlarda */}
            <button
              ref={burgerRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls={MENU_ID}
              aria-label={T("openMenu")}
              className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-cream/30 text-brand-cream transition hover:bg-brand-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron lg:hidden"
            >
              <span aria-hidden="true" className="flex w-5 flex-col items-end gap-[5px]">
                <span className="h-0.5 w-5 rounded-full bg-current" />
                <span className="h-0.5 w-3.5 rounded-full bg-saffron transition-all duration-300 group-hover:w-5" />
                <span className="h-0.5 w-5 rounded-full bg-current" />
              </span>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu id={MENU_ID} open={open} onClose={close} contact={contact} pathname={pathname} returnFocusRef={burgerRef} />
    </>
  );
}
