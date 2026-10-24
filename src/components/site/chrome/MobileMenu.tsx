"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { X, Phone, MapPin, Instagram, Send, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { btnClass } from "@/components/site/kit/ButtonLink";
import Blob from "@/components/site/kit/Blob";
import LocaleSwitcher from "../LocaleSwitcher";
import ThemeToggle from "../ThemeToggle";
import Logo from "./Logo";
import { NAV, HOME_ITEM, isActive, telHref, type HeaderContact } from "./nav";

type Props = {
  id: string;
  open: boolean;
  onClose: () => void;
  contact: HeaderContact;
  pathname: string;
  /** Yopilganda fokus qaytadigan tugma (burger) */
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
// Doira shaklida ochilish markazi — burger tugmasi joyi (o'ng yuqori burchak)
const CLIP_AT = "at calc(100% - 2.4rem) 2.5rem";

/**
 * To'liq ekranli mobil menyu: qizil fon + panjara naqsh, katta afisha havolalari (navbat bilan
 * kirib keladi), xitoycha bezak, aloqa bloki, til/tema va CTA.
 * Escape va havola bosilganda yopiladi, ochiqligida sahifa scroll'i qulflanadi, fokus ichida aylanadi.
 */
export default function MobileMenu({ id, open, onClose, contact, pathname, returnFocusRef }: Props) {
  const tc = useTranslations("Common");
  const st = useTranslations("Site");
  const T = useTranslations("Chrome");
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // Fokus: ochilganda — yopish tugmasiga, yopilganda — burger'ga qaytadi
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      const focusClose = () => {
        if (!panelRef.current?.contains(document.activeElement)) closeRef.current?.focus({ preventScroll: true });
      };
      focusClose();
      // Zaxira: brauzer ko'rinishni kechroq yangilasa ham fokus albatta ko'chsin
      const tm = window.setTimeout(focusClose, 120);
      return () => window.clearTimeout(tm);
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      returnFocusRef.current?.focus({ preventScroll: true });
    }
  }, [open, returnFocusRef]);

  // Ochiqligida: scroll qulfi, Escape bilan yopish, desktop o'lchamga o'tsa yopish
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const mq = window.matchMedia("(min-width: 1024px)");
    const onMq = () => mq.matches && onClose();
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open, onClose]);

  // Tab fokus menyudan chiqib ketmasin
  function trapTab(e: React.KeyboardEvent) {
    if (e.key !== "Tab" || !panelRef.current) return;
    const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const items = [HOME_ITEM, ...NAV];
  const label = (ns: "Common" | "Site", key: string) => (ns === "Common" ? tc(key) : st(key));

  return (
    <div
      id={id}
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={tc("menu")}
      inert={!open}
      data-lenis-prevent
      onKeyDown={trapTab}
      style={{ clipPath: `circle(${open ? "150%" : "0%"} ${CLIP_AT})` }}
      className={cn(
        "fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-fire text-brand-cream lg:hidden",
        "duration-700 ease-out-expo motion-reduce:transition-none",
        // Ochilishda darhol ko'rinadi (fokus olishi uchun), yopilishda — doira yopilgach yashirinadi
        open ? "visible transition-[clip-path]" : "invisible transition-[clip-path,visibility]"
      )}
    >
      {/* Bezak: panjara naqsh, to'q-qizil blob, vertikal ieroglif */}
      <span aria-hidden="true" className="lattice-bg pointer-events-none fixed inset-0 text-fire-deep/45" />
      <Blob variant="c" className="pointer-events-none fixed -bottom-40 -left-40 w-[30rem] text-fire-deep/70" />
      <span
        aria-hidden="true"
        lang="zh"
        className="font-cn pointer-events-none fixed -right-3 top-24 select-none text-[9rem] leading-none text-fire-deep [writing-mode:vertical-rl] sm:text-[13rem]"
      >
        长安
      </span>

      <div className="relative flex min-h-full flex-col">
        {/* Yuqori qator — header bilan bir joyda: logo + yopish */}
        <div className="flex h-20 shrink-0 items-center justify-between gap-3 px-4 sm:px-8">
          <Link
            href="/"
            onClick={onClose}
            aria-label={`GrandChangan — ${tc("home")}`}
            className="min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
          >
            <Logo size="md" />
          </Link>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={T("closeMenu")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-cream/40 text-brand-cream transition hover:bg-brand-cream hover:text-fire focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-1 flex-col px-5 pb-10 pt-4 sm:px-8 sm:pt-8">
          <nav aria-label={T("navLabel")}>
            <ol className="space-y-0.5">
              {items.map((n, i) => {
                const active = isActive(pathname, n.href);
                return (
                  <li
                    key={n.href}
                    style={{ transitionDelay: open ? `${180 + i * 55}ms` : "0ms" }}
                    className={cn(
                      "transition duration-700 ease-out-expo motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
                      open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                    )}
                  >
                    <Link
                      href={n.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className="group flex min-h-11 items-center gap-3 rounded-xl py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron sm:gap-5"
                    >
                      {/* Chapda xitoycha belgi (bezak), o'ngda katta afisha yozuvi */}
                      <span aria-hidden="true" lang="zh" className="font-cn w-6 shrink-0 text-center text-[1.05rem] leading-none text-saffron [writing-mode:vertical-rl] sm:w-8 sm:text-2xl">
                        {n.cn}
                      </span>
                      <span
                        className={cn(
                          "font-poster min-w-0 break-words text-[clamp(1.6rem,7.6vw,3.25rem)] leading-[1.1] transition duration-300 group-hover:translate-x-1.5 motion-reduce:transition-none",
                          active ? "text-saffron" : "text-brand-cream"
                        )}
                      >
                        {label(n.ns, n.key)}
                      </span>
                      {active && <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-saffron" />}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div
            style={{ transitionDelay: open ? "620ms" : "0ms" }}
            className={cn(
              "mt-10 transition duration-700 ease-out-expo motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
              open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            )}
          >
            {/* Aloqa bloki */}
            <div className="grid gap-6 border-t border-brand-cream/25 pt-7 sm:grid-cols-3">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-cream">{st("hWhere")}</p>
                <p className="flex items-start gap-2 text-[15px] leading-snug text-brand-cream/90">
                  <MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-saffron" /> {contact.address}
                </p>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-cream">{st("hBooking")}</p>
                <a
                  href={telHref(contact.phone)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg text-[15px] font-semibold text-brand-cream hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
                >
                  <Phone size={16} aria-hidden="true" className="text-saffron" /> {contact.phone}
                </a>
              </div>
              {(contact.instagram || contact.telegram) && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-cream">{st("hSocial")}</p>
                  <div className="flex gap-2">
                    {contact.instagram && (
                      <a href={contact.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-cream/40 transition hover:bg-brand-cream hover:text-fire focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron">
                        <Instagram size={18} aria-hidden="true" />
                      </a>
                    )}
                    {contact.telegram && (
                      <a href={contact.telegram} target="_blank" rel="noreferrer" aria-label="Telegram" className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-cream/40 transition hover:bg-brand-cream hover:text-fire focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron">
                        <Send size={18} aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Til + tema */}
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
              <LocaleSwitcher variant="inline" />
              <ThemeToggle />
            </div>

            <Link href="/reservation" onClick={onClose} className={cn(btnClass("saffron", "lg"), "mt-7 w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cream")}>
              {st("fReserve")} <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
