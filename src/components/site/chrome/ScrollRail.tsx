"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Sec = { el: HTMLElement; label: string };
type LenisLike = { scrollTo: (target: number | HTMLElement, opts?: { offset?: number; duration?: number }) => void };

/** Sahifaning yuqori darajadagi bo'limlari (ichma-ich section'lar emas) + footer */
function collect(): Sec[] {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>("section, footer")).filter(
    (el) => !el.parentElement?.closest("section, footer") && el.offsetHeight > 240
  );
  return nodes.map((el, i) => {
    const h = el.querySelector<HTMLElement>("h1, h2");
    // SectionHead'da sarlavha va aksent qo'shni elementlar — ikkalasini olamiz
    const raw = (h?.parentElement?.textContent || h?.textContent || "").replace(/\s+/g, " ").trim();
    return { el, label: raw ? (raw.length > 30 ? raw.slice(0, 29) + "…" : raw) : String(i + 1).padStart(2, "0") };
  });
}

function go(target: number | HTMLElement) {
  const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
  if (lenis) lenis.scrollTo(target, { offset: typeof target === "number" ? 0 : -70, duration: 1.2 });
  else if (typeof target === "number") window.scrollTo({ top: target, behavior: "smooth" });
  else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 70, behavior: "smooth" });
}

/**
 * O'ng tomondagi maxsus scroll ko'rsatkich: tepaga/pastga tugmalari, bo'limlar nuqtalari (bosilsa o'tadi,
 * ustiga kelinsa nomi chiqadi), joriy bo'lim raqami va to'ladigan oltin chiziq. Telefonda — progress
 * halqali "tepaga" tugmasi. Lenis bilan silliq o'tadi.
 */
export default function ScrollRail() {
  const t = useTranslations("Chrome");
  const pathname = usePathname();
  const [secs, setSecs] = useState<Sec[]>([]);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [shown, setShown] = useState(false);
  const secsRef = useRef<Sec[]>([]);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      const vh = window.innerHeight;
      const max = Math.max(1, document.documentElement.scrollHeight - vh);
      setProgress(Math.min(1, Math.max(0, window.scrollY / max)));
      setShown(window.scrollY > 400);
      let idx = 0;
      secsRef.current.forEach((s, i) => {
        if (s.el.getBoundingClientRect().top <= vh * 0.4) idx = i;
      });
      setActive(idx);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    const refresh = () => {
      const s = collect();
      secsRef.current = s;
      setSecs(s);
      measure();
    };
    // sahifa to'liq chizilgach (rasmlar, 3D joylari) bo'limlarni yig'amiz
    const t1 = window.setTimeout(refresh, 600);
    const t2 = window.setTimeout(refresh, 2500);
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", onScroll, { passive: true });
    measure();
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const step = useCallback(
    (d: number) => {
      const s = secsRef.current;
      if (!s.length) return;
      const next = Math.min(s.length - 1, Math.max(0, active + d));
      if (next === active && d < 0) go(0);
      else go(s[next].el);
    },
    [active]
  );

  const n = secs.length;
  const btn = "flex size-10 items-center justify-center rounded-full text-brand-cream/85 transition hover:bg-fire hover:text-brand-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron disabled:opacity-30";
  // Telefonda bron sahifasining pastki paneli bilan to'qnashmasin
  const hideMobile = pathname?.includes("/reservation");

  return (
    <>
      {/* ---------- Kompyuter: o'ng tomondagi relsli panel ---------- */}
      {n > 1 && (
        <nav
          aria-label={t("railLabel")}
          className="fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-2 rounded-full border border-brand-gold/25 bg-night/75 px-1 py-2 shadow-2xl backdrop-blur-md md:flex 2xl:right-5"
        >
          <button type="button" onClick={() => step(-1)} aria-label={t("railUp")} className={btn} disabled={progress <= 0.001}>
            <ChevronUp size={18} />
          </button>
          <p translate="no" className="flex flex-col items-center leading-none" aria-live="polite">
            <span className="font-poster text-sm text-saffron">{String(active + 1).padStart(2, "0")}</span>
            <span className="mt-1 text-[10px] font-semibold text-brand-cream/60">/{String(n).padStart(2, "0")}</span>
          </p>
          <div className="relative my-1 h-[min(40vh,320px)] w-px bg-brand-cream/20">
            <span className="absolute inset-x-0 top-0 origin-top bg-saffron transition-[height] duration-150" style={{ height: `${progress * 100}%` }} />
            {secs.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(s.el)}
                aria-label={`${String(i + 1).padStart(2, "0")} — ${s.label}`}
                aria-current={i === active ? "true" : undefined}
                className="group absolute left-1/2 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center focus-visible:outline-none"
                style={{ top: `${n > 1 ? (i / (n - 1)) * 100 : 0}%` }}
              >
                <span
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === active ? "size-3 bg-saffron ring-4 ring-saffron/25" : i < active ? "size-2 bg-saffron/80" : "size-2 bg-brand-cream/40 group-hover:bg-brand-cream"
                  )}
                />
                <span className="pointer-events-none absolute right-7 whitespace-nowrap rounded-full bg-night/90 px-3 py-1 text-xs font-medium text-brand-cream opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="font-poster text-saffron">{String(i + 1).padStart(2, "0")}</span> {s.label}
                </span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => step(1)} aria-label={t("railDown")} className={btn} disabled={active >= n - 1}>
            <ChevronDown size={18} />
          </button>
        </nav>
      )}

      {/* ---------- Telefon: progress halqali "tepaga" ---------- */}
      {!hideMobile && (
        <button
          type="button"
          onClick={() => go(0)}
          aria-label={t("railTop")}
          className={cn(
            "fixed bottom-5 right-4 z-40 flex size-12 items-center justify-center rounded-full bg-night/85 text-brand-cream shadow-2xl backdrop-blur-md transition duration-300 md:hidden",
            shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
          )}
        >
          <svg viewBox="0 0 48 48" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
            <circle cx="24" cy="24" r="21" fill="none" className="stroke-brand-cream/15" strokeWidth="2.5" />
            <circle cx="24" cy="24" r="21" fill="none" className="stroke-saffron" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={131.9} strokeDashoffset={131.9 * (1 - progress)} />
          </svg>
          <ArrowUp size={18} />
        </button>
      )}
    </>
  );
}
