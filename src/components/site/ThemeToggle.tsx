"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ className }: { className?: string }) {
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
    <button onClick={toggle} aria-label="Tema" className={className || "flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10"}>
      {dark ? <Sun size={18} className="text-brand-gold-light" /> : <Moon size={18} />}
    </button>
  );
}
