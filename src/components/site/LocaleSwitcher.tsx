"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Globe, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = { uz: "O'zbek", ru: "Русский", en: "English", zh: "中文" };
const SHORT: Record<string, string> = { uz: "UZ", ru: "RU", en: "EN", zh: "中文" };

type Props = {
  /**
   * dropdown — header uchun ixcham ochiladigan ro'yxat;
   * inline — qator tugmalar (mobil menyu, footer).
   * Ikkalasi ham qizil/tungi fon ustida (krem matn).
   */
  variant?: "dropdown" | "inline";
  /** dropdown ro'yxati qaysi chetga tekislanadi (header chap chetida — "left"); standart "right" */
  align?: "left" | "right";
  className?: string;
};

/**
 * Til almashtirgich. Haqiqiy havolalar (next-intl Link + locale) — joriy sahifa saqlanadi,
 * `replace` bilan tarix to'lmaydi (avvalgi router.replace xatti-harakati).
 */
export default function LocaleSwitcher({ variant = "dropdown", align = "right", className }: Props) {
  const pathname = usePathname();
  const current = useLocale();
  const T = useTranslations("Chrome");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  // Tashqariga bosilganda yoki Escape — yopiladi
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (variant === "inline") {
    return (
      <ul aria-label={T("language")} className={cn("flex flex-wrap items-center gap-1", className)}>
        {routing.locales.map((l) => {
          const active = l === current;
          return (
            <li key={l}>
              <Link
                href={pathname}
                locale={l}
                replace
                lang={l}
                hrefLang={l}
                aria-current={active ? "true" : undefined}
                title={LABELS[l]}
                className={cn(
                  "inline-flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-[13px] font-semibold tracking-wider transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron",
                  active ? "bg-brand-cream text-brand-ink" : "text-brand-cream/85 hover:bg-brand-cream/10 hover:text-brand-cream"
                )}
              >
                {SHORT[l]}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${T("language")}: ${LABELS[current] ?? current}`}
        className={cn(
          "flex h-11 items-center gap-1.5 rounded-full border border-brand-cream/25 px-3 text-[13px] font-semibold tracking-wider text-brand-cream transition",
          "hover:border-brand-cream/50 hover:bg-brand-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron",
          open && "border-brand-cream/50 bg-brand-cream/10"
        )}
      >
        <Globe size={15} aria-hidden="true" />
        <span>{SHORT[current] ?? current.toUpperCase()}</span>
        <ChevronDown size={14} aria-hidden="true" className={cn("transition-transform duration-300", open && "rotate-180")} />
      </button>

      <div
        id={listId}
        className={cn(
          align === "left" ? "left-0 origin-top-left" : "right-0 origin-top-right",
          "absolute top-full z-10 mt-2 w-44 rounded-2xl border border-brand-gold/25 bg-night-2 p-1.5 shadow-2xl transition duration-200",
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
        )}
      >
        <ul>
          {routing.locales.map((l) => {
            const active = l === current;
            return (
              <li key={l}>
                <Link
                  href={pathname}
                  locale={l}
                  replace
                  lang={l}
                  hrefLang={l}
                  aria-current={active ? "true" : undefined}
                  tabIndex={open ? 0 : -1}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex h-11 items-center justify-between gap-3 rounded-xl px-3 text-sm transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron",
                    active ? "text-saffron" : "text-brand-cream/85 hover:bg-brand-cream/10 hover:text-brand-cream"
                  )}
                >
                  <span>{LABELS[l]}</span>
                  {active ? <Check size={15} aria-hidden="true" /> : <span className="text-[11px] tracking-wider text-brand-cream/45">{SHORT[l]}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
