"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * "Bir kosada" bo'limining jonli ko'rsatkichi: 3D kosa qatlamlarga ajralgan sari hozirgi qatlam raqami
 * (01/06), nomi va 6 bo'lakli progress chizig'i. Progress — ExplodedBowlScene bilan bir xil formula
 * ([data-explode-track] bo'limi yopishgan paytdagi scroll ulushi). labels — yuqoridan pastga
 * (ziravorlar … kosa); ko'rsatkich pastdan yuqoriga (kosa → ziravorlar) yuradi.
 */
export default function ExplodeHud({ labels, className }: { labels: string[]; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLSpanElement | null>(null);
  const [step, setStep] = useState(0);
  const n = labels.length;

  useEffect(() => {
    const el = ref.current;
    const sec = el?.closest<HTMLElement>("[data-explode-track]");
    if (!el || !sec) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = sec.getBoundingClientRect();
      const travel = Math.max(1, r.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, (-r.top / travel - 0.1) / 0.7));
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      // ExplodedBowlScene'dagi nomlar jadvali: li-nom (pastdan) p ≥ 0.2 + li·0.11 da chiqa boshlaydi
      let shown = 0;
      for (let li = 0; li < n; li++) if (p >= 0.2 + li * 0.11 + 0.075) shown = li + 1;
      setStep(Math.max(0, shown - 1));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [n]);

  const idx = n - 1 - step; // labels yuqoridan pastga, ko'rsatkich pastdan yuqoriga
  return (
    <div ref={ref} className={cn("max-w-md", className)} aria-hidden="true">
      <div className="flex items-end gap-5">
        <span translate="no" className="font-display text-6xl leading-none text-brand-gold-light tabular-nums">
          {String(step + 1).padStart(2, "0")}
        </span>
        <span translate="no" className="pb-1.5 text-xs font-semibold tracking-[0.3em] text-brand-cream/50">/ {String(n).padStart(2, "0")}</span>
        <span className="mb-3 h-px flex-1 bg-gradient-to-r from-brand-gold/60 to-transparent" />
      </div>
      {/* Nom almashinuvi — barcha nomlar bir joyda, faqat faoli ko'rinadi */}
      <div className="relative mt-3 h-8">
        {labels.map((l, i) => (
          <span
            key={l}
            className={cn(
              "absolute inset-x-0 top-0 truncate font-display text-2xl italic text-brand-cream transition duration-500 ease-out-expo",
              i === idx ? "translate-y-0 opacity-100" : i < idx ? "translate-y-3 opacity-0" : "-translate-y-3 opacity-0"
            )}
          >
            {l}
          </span>
        ))}
      </div>
      {/* 6 bo'lakli progress */}
      <div className="relative mt-5 h-[3px] w-full overflow-hidden rounded-full bg-brand-cream/10">
        <span ref={barRef} className="absolute inset-0 origin-left bg-gradient-to-r from-fire to-saffron" style={{ transform: "scaleX(0)" }} />
        {Array.from({ length: n - 1 }).map((_, i) => (
          <span key={i} className="absolute top-0 h-full w-[3px] bg-night" style={{ left: `${((i + 1) / n) * 100}%` }} />
        ))}
      </div>
    </div>
  );
}
