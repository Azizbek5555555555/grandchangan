"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * "Oshpaz tanlovi" tarelkasi atrofidagi jonli bezak (faqat ko'rinish):
 * - tush cho'tkasi bilan chizilgan "enso" halqasi — bo'limga scroll qilinganda chizilib boradi;
 * - oltin shkala (soat siferblatiday chiziqchalar) — scroll bilan sekin aylanadi;
 * - tarelkaning o'zi — biroz aylanib, kattalashib keladi.
 * prefers-reduced-motion: hammasi statik, enso to'liq chizilgan holda.
 */
export default function ShowcaseArt({
  children, flip = false, className,
}: { children: React.ReactNode; flip?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const st = { trigger: el, start: "top 90%", end: "bottom 20%", scrub: 1 };
      gsap.fromTo(el.querySelectorAll("[data-enso]"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "none", scrollTrigger: { ...st, end: "center 45%" } });
      gsap.fromTo(el.querySelector("[data-ticks]"), { rotate: flip ? 30 : -30 }, { rotate: flip ? -30 : 30, ease: "none", scrollTrigger: st });
      gsap.fromTo(el.querySelector("[data-plate]"), { rotate: flip ? 24 : -24, scale: 0.9 }, { rotate: 0, scale: 1, ease: "none", scrollTrigger: { ...st, end: "center 50%" } });
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={cn("relative aspect-square", className)}>
      {/* Oltin shkala */}
      <svg data-ticks aria-hidden="true" viewBox="0 0 200 200" className="pointer-events-none absolute -inset-[13%] size-[126%] text-brand-gold">
        <circle cx="100" cy="100" r="97" fill="none" stroke="currentColor" strokeWidth="0.35" opacity="0.7" />
        {Array.from({ length: 72 }).map((_, i) => {
          const long = i % 6 === 0;
          return (
            <line
              key={i}
              x1="100" y1="3" x2="100" y2={long ? 10 : 6.5}
              stroke="currentColor"
              strokeWidth={long ? 0.7 : 0.4}
              opacity={long ? 0.95 : 0.6}
              transform={`rotate(${i * 5} 100 100)`}
            />
          );
        })}
        <circle cx="100" cy="3" r="1.6" className="fill-fire" />
      </svg>

      {/* Tush "enso" halqasi: qalin asosiy chiziq + ingichka "quruq cho'tka" izi */}
      <svg aria-hidden="true" viewBox="0 0 200 200" className={cn("pointer-events-none absolute -inset-[6%] size-[112%] text-content", flip ? "-rotate-[150deg]" : "rotate-[30deg]")}>
        <circle data-enso cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" pathLength={1} strokeDasharray="0.9 2" opacity="0.7" />
        <circle data-enso cx="100" cy="100" r="97.4" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" pathLength={1} strokeDasharray="0.62 2" opacity="0.5" transform="rotate(14 100 100)" />
        <circle data-enso cx="100" cy="100" r="92.6" fill="none" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" pathLength={1} strokeDasharray="0.4 2" opacity="0.45" transform="rotate(-8 100 100)" />
      </svg>

      <div data-plate className="relative h-full w-full will-change-transform">{children}</div>
    </div>
  );
}

/**
 * Rasm yo'q taom uchun "chinni tarelka" zaxirasi: krem chinni, ingichka qizil hoshiyalar,
 * huiwen naqshli halqa va markazda mo'yqalam ieroglif. Ota o'lchamini to'ldiradi.
 */
export function PorcelainPlate({ char, glyph = "text-8xl", className }: { char: string; glyph?: string; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("relative h-full w-full", className)}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full">
        <circle cx="100" cy="100" r="99" className="fill-paper" />
        <circle cx="100" cy="100" r="93" fill="none" className="stroke-fire" strokeWidth="1.2" />
        {/* huiwen halqasi — uzuq-uzuq naqsh */}
        <circle cx="100" cy="100" r="86" fill="none" className="stroke-fire" strokeWidth="5" strokeDasharray="5 2.2 1.4 2.2" opacity="0.85" />
        <circle cx="100" cy="100" r="79.5" fill="none" className="stroke-fire" strokeWidth="0.8" />
        <circle cx="100" cy="100" r="62" fill="none" className="stroke-fire" strokeWidth="0.4" opacity="0.4" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        <span lang="zh" className={cn("font-cn leading-none text-fire-ink", glyph)}>{char}</span>
      </span>
    </div>
  );
}
