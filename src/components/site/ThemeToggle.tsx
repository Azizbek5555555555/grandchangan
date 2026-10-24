"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Yorug'/qorong'i tema tugmasi. `className` berilsa — standart ko'rinish butunlay almashadi
 * (admin Sidebar shunday ishlatadi). Standart ko'rinish qizil/tungi fon ustidagi header uchun.
 */
export default function ThemeToggle({ className }: { className?: string }) {
  const T = useTranslations("Site");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={T("theme")}
      aria-pressed={dark}
      className={
        className ||
        cn(
          "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-cream/25 text-brand-cream transition",
          "hover:border-brand-cream/50 hover:bg-brand-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
        )
      }
    >
      {dark ? <Sun size={18} aria-hidden="true" className="text-brand-gold-light" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
