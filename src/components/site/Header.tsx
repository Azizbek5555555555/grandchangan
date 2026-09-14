"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { X, Instagram, Send, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import LocaleSwitcher from "./LocaleSwitcher";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { href: "/", label: "Bosh sahifa" },
  { href: "/menu", label: "Menyu" },
  { href: "/reservation", label: "Stol band qilish" },
  { href: "/gallery", label: "Galereya" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "Biz haqimizda" },
  { href: "/contact", label: "Aloqa" },
];

export default function SiteHeader(_props?: { locale?: string }) {
  const t = useTranslations("Common");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-500", scrolled ? "bg-brand-ink/90 py-3 shadow-[0_1px_0_rgba(200,162,75,0.15)] backdrop-blur-md" : "bg-transparent py-5")}>
        <div className="mx-auto grid max-w-7xl grid-cols-3 items-center px-5">
          {/* Chap: burger */}
          <button onClick={() => setOpen(true)} className="group flex items-center gap-3 justify-self-start text-brand-cream">
            <span className="flex flex-col gap-[5px]">
              <span className="h-[2px] w-7 bg-brand-gold transition-all group-hover:w-5" />
              <span className="h-[2px] w-5 bg-surface-2 transition-all group-hover:w-7" />
              <span className="h-[2px] w-6 bg-surface-2 transition-all group-hover:w-4" />
            </span>
            <span className="hidden text-xs font-medium uppercase tracking-[0.25em] text-brand-cream/90 sm:inline">Menyu</span>
          </button>

          {/* Markaz: logo */}
          <Link href="/" className="justify-self-center font-display text-2xl tracking-wide text-brand-gold-light">
            Grand<span className="text-brand-cream">Changan</span>
          </Link>

          {/* O'ng: til + bron */}
          <div className="flex items-center gap-3 justify-self-end text-brand-cream">
            <div className="hidden sm:block"><LocaleSwitcher /></div>
            <ThemeToggle className="hidden h-9 w-9 items-center justify-center rounded-full text-brand-cream transition hover:bg-white/10 sm:flex" />
            <Link href="/reservation" className="rounded-full border border-brand-gold/60 px-5 py-2 text-xs font-medium uppercase tracking-wider text-brand-gold-light transition hover:bg-brand-gold hover:text-content">
              {t("reservation")}
            </Link>
          </div>
        </div>
      </header>

      {/* ============ TO'LIQ EKRANLI MENYU ============ */}
      <div className={cn("fixed inset-0 z-[60] transition-all duration-500", open ? "visible opacity-100" : "invisible opacity-0")}>
        <div className="absolute inset-0 bg-brand-ink" onClick={() => setOpen(false)} />
        <div className="relative grid h-full grid-cols-1 lg:grid-cols-2">
          {/* Chap: linklar */}
          <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-24">
            <nav className="space-y-1">
              {NAV.map((n, i) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-baseline gap-4"
                  style={{ transition: "transform .6s cubic-bezier(0.16,1,0.3,1), opacity .6s", transitionDelay: open ? `${120 + i * 55}ms` : "0ms", transform: open ? "translateY(0)" : "translateY(24px)", opacity: open ? 1 : 0 }}
                >
                  <span className="text-xs text-brand-gold/70">0{i}</span>
                  <span className="font-display text-4xl text-brand-cream/90 transition-colors group-hover:text-brand-gold-light sm:text-5xl">{n.label}</span>
                </Link>
              ))}
            </nav>
            <div className="mt-10 flex items-center gap-3">
              <div className="text-brand-cream"><LocaleSwitcher /></div>
              <ThemeToggle className="flex h-9 w-9 items-center justify-center rounded-full text-brand-cream transition hover:bg-white/10" />
            </div>
          </div>

          {/* O'ng: kontakt */}
          <div className="hidden flex-col justify-center border-l border-white/5 bg-brand-ink-soft px-16 lg:flex">
            <p className="font-display text-4xl text-brand-gold-light">GrandChangan</p>
            <p className="mt-2 text-sm text-brand-cream/50">中国餐厅 · Samarqand</p>

            <div className="mt-12 space-y-8">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.25em] text-brand-gold">Biz qayerdamiz</p>
                <p className="flex items-start gap-2 text-brand-cream/80"><MapPin size={16} className="mt-1 text-brand-gold/70" /> Ibn Xoldun 10B, Samarqand</p>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.25em] text-brand-gold">Bron</p>
                <p className="flex items-center gap-2 text-brand-cream/80"><Phone size={16} className="text-brand-gold/70" /> +998 90 503 15 68</p>
              </div>
              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.25em] text-brand-gold">Ijtimoiy tarmoqlar</p>
                <div className="flex gap-3">
                  <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-gold/30 text-brand-gold-light transition hover:bg-brand-gold hover:text-content"><Instagram size={18} /></a>
                  <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-gold/30 text-brand-gold-light transition hover:bg-brand-gold hover:text-content"><Send size={18} /></a>
                </div>
              </div>
            </div>

            <Link href="/reservation" onClick={() => setOpen(false)} className="btn-gold-sheen mt-12 inline-flex w-fit items-center gap-2 rounded-full bg-brand-red px-8 py-3.5 font-medium text-white hover:bg-brand-red-dark">
              Stol band qilish <ArrowUpRight size={18} />
            </Link>
          </div>

          {/* Yopish */}
          <button onClick={() => setOpen(false)} className="absolute right-6 top-6 flex items-center gap-2 text-sm uppercase tracking-widest text-brand-cream/80 transition hover:text-brand-gold">
            <X size={22} /> Yopish
          </button>
        </div>
      </div>
    </>
  );
}
