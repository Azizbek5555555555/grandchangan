"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import LocaleSwitcher from "./LocaleSwitcher";

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

  const nav = [
    { href: "/menu", label: t("menu") },
    { href: "/reservation", label: t("reservation") },
    { href: "/gallery", label: t("gallery") },
    { href: "/blog", label: t("blog") },
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
  ] as const;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "bg-brand-ink/90 py-3 shadow-[0_1px_0_rgba(200,162,75,0.15)] backdrop-blur-md" : "bg-transparent py-5"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5">
        <Link href="/" className="font-display text-2xl tracking-wide text-brand-gold-light">
          Grand<span className="text-brand-cream">Changan</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="group relative text-sm font-medium text-brand-cream/85 transition hover:text-brand-gold-light"
            >
              {n.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-brand-gold transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-brand-cream sm:block">
            <LocaleSwitcher />
          </div>
          <Link
            href="/reservation"
            className="hidden rounded-full border border-brand-gold/60 px-5 py-2 text-sm font-medium text-brand-gold-light transition hover:bg-brand-gold hover:text-brand-ink sm:inline-block"
          >
            {t("reservation")}
          </Link>
          <button onClick={() => setOpen(true)} className="text-brand-cream lg:hidden">
            <Menu size={26} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-brand-ink transition-transform duration-500 lg:hidden",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <span className="font-display text-2xl text-brand-gold-light">GrandChangan</span>
          <button onClick={() => setOpen(false)} className="text-brand-cream"><X size={28} /></button>
        </div>
        <nav className="flex flex-col gap-2 px-5 pt-6">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="border-b border-white/5 py-4 font-display text-2xl text-brand-cream/90"
            >
              {n.label}
            </Link>
          ))}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-brand-cream"><LocaleSwitcher /></div>
            <Link href="/reservation" onClick={() => setOpen(false)} className="rounded-full bg-brand-red px-6 py-2.5 text-sm font-medium text-white">
              {t("reservation")}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
