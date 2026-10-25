"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { X, Phone, MapPin, Instagram, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Mountains } from "@/components/site/pages/InkDecor";
import LocaleSwitcher from "../LocaleSwitcher";
import ThemeToggle from "../ThemeToggle";
import Logo from "./Logo";
import Fret from "./Fret";
import SealCta from "./SealCta";
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
const RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-light";
// Eshik tavaqasi ochilgach chetda qoladigan panjara ustun kengligi
const STRIP = "16px";

/**
 * Bitta eshik tavaqasi (屏风): lak fon, panjara naqsh, oltin ramka; ichki chetida yarim medalyon —
 * ikki tavaqa yopilganda birlashib "长安" doirasini hosil qiladi.
 * Ochilish: tavaqalar chetdan kirib yopiladi (tashqi qatlam), so'ng ikki tomonga surilib ochiladi va
 * chetda ingichka ustun bo'lib qoladi (ichki qatlam). Yopilishda — teskari tartib.
 */
function Door({ side, open }: { side: "left" | "right"; open: boolean }) {
  const left = side === "left";
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-y-0 w-1/2 transition-transform duration-[380ms] ease-[cubic-bezier(0.7,0,0.3,1)] motion-reduce:transition-none",
        left ? "left-0" : "right-0",
        open ? "translate-x-0 delay-0" : cn("delay-[420ms]", left ? "-translate-x-full" : "translate-x-full")
      )}
    >
      <div
        style={{ transform: open ? `translateX(${left ? `calc(-100% + ${STRIP})` : `calc(100% - ${STRIP})`})` : "translateX(0)" }}
        className={cn(
          "relative h-full w-full overflow-hidden bg-gradient-to-b from-wine via-wine-deep to-wine transition-transform ease-out-expo motion-reduce:transition-none",
          open ? "delay-[400ms] duration-[650ms]" : "delay-0 duration-[400ms]"
        )}
      >
        <span className="lattice-bg absolute inset-0 text-brand-gold/25" />
        <span className={cn("absolute inset-y-3 border-y border-brand-gold/40", left ? "left-3 right-0 border-l" : "left-0 right-3 border-r")} />
        {/* Ichki chet — qo'sh oltin chiziq (ochilgach shu ustun bo'lib qoladi) */}
        <span className={cn("absolute inset-y-0 w-[16px] bg-gradient-to-b from-fire-deep via-wine to-fire-deep", left ? "right-0" : "left-0")}>
          <span className={cn("absolute inset-y-0 w-px bg-brand-gold/80", left ? "right-0" : "left-0")} />
          <span className={cn("absolute inset-y-0 w-px bg-brand-gold/40", left ? "left-[5px]" : "right-[5px]")} />
          {[18, 50, 82].map((y) => (
            <span key={y} style={{ top: `${y}%` }} className="absolute left-1/2 size-[6px] -translate-x-1/2 rotate-45 bg-brand-gold-light/80" />
          ))}
        </span>
        {/* Yarim medalyon */}
        <span
          className={cn(
            "absolute top-1/2 flex h-44 w-[88px] -translate-y-1/2 items-center border border-brand-gold/70 bg-fire-deep transition-opacity duration-300 motion-reduce:transition-none",
            left ? "right-0 justify-end rounded-l-full border-r-0 pr-2" : "left-0 justify-start rounded-r-full border-l-0 pl-2",
            open ? "opacity-0 delay-[420ms]" : "opacity-100 delay-0"
          )}
        >
          <span lang="zh" className="font-cn text-5xl leading-none text-brand-gold-light">{left ? "长" : "安"}</span>
        </span>
      </div>
    </div>
  );
}

/**
 * To'liq ekranli mobil menyu — "saroy eshigi": ikki panjarali tavaqa yopilib, so'ng ochiladi va ichida
 * tungi manzara (oy, tog'lar), katta vertikal ieroglif, xitoycha belgili ro'yxat, aloqa, til/tema va CTA.
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
  // Kontent eshiklar ochila boshlaganda paydo bo'ladi
  const reveal = (delay: number) => ({ transitionDelay: open ? `${delay}ms` : "0ms" });
  const revealCls = cn(
    "transition duration-700 ease-out-expo motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
    open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
  );
  const socialCls = cn(
    "flex size-11 items-center justify-center rounded-[3px] border border-brand-gold/45 text-brand-gold-light transition hover:border-brand-gold-light hover:bg-brand-gold/15",
    RING
  );

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
      className={cn(
        "fixed inset-0 z-[60] text-brand-cream lg:hidden",
        // Ochilishda darhol ko'rinadi (fokus olishi uchun), yopilishda — eshiklar chiqib ketgach yashirinadi
        open ? "visible" : "invisible transition-[visibility] delay-[820ms] motion-reduce:delay-0"
      )}
    >
      {/* Tungi fon: oy, tog'lar, katta vertikal ieroglif — eshiklar yopiq turganda ostida paydo bo'ladi */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 overflow-hidden bg-night transition-opacity duration-300 motion-reduce:transition-none",
          open ? "opacity-100 delay-[300ms]" : "opacity-0 delay-[400ms]"
        )}
      >
        <span className="lattice-bg absolute inset-0 text-brand-gold/[0.035]" />
        <span className="absolute -right-24 -top-24 size-80 rounded-full bg-fire/25 blur-3xl" />
        <span className="absolute right-[6%] top-[7%] size-40 rounded-full bg-brand-gold/10 blur-2xl sm:size-52" />
        <span className="absolute right-[14%] top-[13%] size-24 rounded-full bg-gradient-to-br from-brand-cream to-brand-gold-light opacity-35 sm:size-32" />
        {/* Oy oldidan o'tayotgan bulut iplari */}
        <span className="absolute right-[4%] top-[20%] h-[3px] w-40 rounded-full bg-gradient-to-r from-transparent via-night/85 to-transparent sm:top-[22%] sm:w-52" />
        <span className="absolute right-[16%] top-[23%] h-[2px] w-28 rounded-full bg-gradient-to-r from-transparent via-night/70 to-transparent sm:top-[25.5%]" />
        <span
          lang="zh"
          className="font-cn absolute -right-2 top-[34%] select-none text-[9.5rem] leading-[0.95] text-brand-gold/[0.09] [writing-mode:vertical-rl] sm:text-[13rem]"
        >
          长安
        </span>
        <Mountains className="absolute inset-x-0 bottom-0 h-40 w-full text-night-3 sm:h-56" />
      </div>

      <Door side="left" open={open} />
      <Door side="right" open={open} />

      {/* Kontent — eshik ustunlari orasida, o'zi scroll bo'ladi */}
      <div
        className={cn(
          "absolute inset-0 overflow-y-auto overscroll-contain transition-opacity motion-reduce:transition-none",
          open ? "opacity-100 delay-[480ms] duration-500" : "opacity-0 delay-0 duration-200"
        )}
      >
        <div className="relative flex min-h-full flex-col px-8 sm:px-14">
          {/* Yuqori qator: logo + yopish */}
          <div className="flex h-[78px] shrink-0 items-center justify-between gap-3">
            <Link href="/" onClick={onClose} aria-label={`GrandChangan — ${tc("home")}`} className={cn("min-w-0 rounded-[3px]", RING)}>
              <Logo size="md" />
            </Link>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={T("closeMenu")}
              className={cn(
                "group relative flex size-11 shrink-0 items-center justify-center rounded-[3px] border border-brand-gold/55 text-brand-gold-light transition hover:bg-brand-gold/15",
                RING
              )}
            >
              <span aria-hidden="true" className="pointer-events-none absolute inset-[3px] rounded-[2px] border border-brand-gold/20" />
              <X size={20} aria-hidden="true" className="transition-transform duration-500 group-hover:rotate-90" />
            </button>
          </div>
          <Fret tile={16} className="h-[9.6px] text-brand-gold/35" />

          <nav aria-label={T("navLabel")} className="pt-5">
            <ol>
              {items.map((n, i) => {
                const active = isActive(pathname, n.href);
                return (
                  <li key={n.href} style={reveal(560 + i * 55)} className={revealCls}>
                    <Link
                      href={n.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className={cn("group flex min-h-[52px] items-center gap-4 border-b border-brand-gold/15 py-1.5", RING)}
                    >
                      {/* Xitoycha belgi — vertikal yorliq; faol sahifada qizil muhr */}
                      <span
                        aria-hidden="true"
                        lang="zh"
                        className={cn(
                          "font-cn flex h-11 w-7 shrink-0 items-center justify-center rounded-[2px] border text-[13px] leading-[1.05] [writing-mode:vertical-rl] transition-colors duration-300",
                          active
                            ? "border-fire bg-fire text-brand-cream"
                            : "border-brand-gold/40 text-brand-gold-light group-hover:border-brand-gold-light"
                        )}
                      >
                        {n.cn}
                      </span>
                      <span
                        className={cn(
                          "font-display min-w-0 flex-1 break-words text-[clamp(1.45rem,6.6vw,2.4rem)] leading-[1.15] transition duration-300 group-hover:translate-x-1 motion-reduce:transition-none",
                          active ? "italic text-brand-gold-light" : "text-brand-cream"
                        )}
                      >
                        {label(n.ns, n.key)}
                      </span>
                      <span aria-hidden="true" className="shrink-0 text-[11px] font-semibold tracking-[0.2em] text-brand-gold/70">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div style={reveal(560 + items.length * 55)} className={cn("mt-auto pb-8 pt-9", revealCls)}>
            {/* Aloqa bloki */}
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-gold-light">{st("hWhere")}</p>
                <p className="flex items-start gap-2 text-[15px] leading-snug text-brand-cream/90">
                  <MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-gold-light" /> {contact.address}
                </p>
              </div>
              <div>
                <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-gold-light">{st("hBooking")}</p>
                <a
                  href={telHref(contact.phone)}
                  className={cn("inline-flex min-h-11 items-center gap-2 rounded-[3px] text-[15px] font-semibold text-brand-cream hover:text-brand-gold-light", RING)}
                >
                  <Phone size={16} aria-hidden="true" className="text-brand-gold-light" /> {contact.phone}
                </a>
              </div>
              {(contact.instagram || contact.telegram) && (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-gold-light">{st("hSocial")}</p>
                  <div className="flex gap-2">
                    {contact.instagram && (
                      <a href={contact.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className={socialCls}>
                        <Instagram size={18} aria-hidden="true" />
                      </a>
                    )}
                    {contact.telegram && (
                      <a href={contact.telegram} target="_blank" rel="noreferrer" aria-label="Telegram" className={socialCls}>
                        <Send size={18} aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Til + tema */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-brand-gold/15 pt-5">
              <LocaleSwitcher variant="inline" />
              <ThemeToggle />
            </div>

            <SealCta size="lg" onClick={onClose} className="mt-6 flex w-full justify-center">
              {st("fReserve")}
            </SealCta>
          </div>
        </div>
      </div>
    </div>
  );
}
