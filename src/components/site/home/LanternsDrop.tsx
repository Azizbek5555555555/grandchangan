"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export type HangingLantern = {
  /** Gorizontal joy (left %, masalan "6%") */
  left: string;
  /** Fonar kengligi (px) */
  size: number;
  /** Ip uzunligi (px) — bo'lim tepasidan */
  rope: number;
  char?: string;
};

/**
 * 2D xitoy fonarlari (SVG): bo'limga scroll qilib kelinganda tepadan tushib, mayatnikdek chayqalib
 * to'xtaydi va ichidagi nur yonadi; keyin sekin tebranadi. reduced-motion'da — statik.
 */
export default function LanternsDrop({ items, className }: { items: HangingLantern[]; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const drops = el.querySelectorAll<HTMLElement>("[data-drop]");
      const glows = el.querySelectorAll<HTMLElement>("[data-glow]");
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 75%", once: true } });
      tl.fromTo(drops, { yPercent: -120, rotation: -14 }, { yPercent: 0, rotation: 0, duration: 1.8, ease: "elastic.out(1, 0.45)", stagger: 0.18 })
        .fromTo(glows, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 1.2, ease: "power2.out", stagger: 0.18 }, 0.5);
    },
    { scope: root }
  );

  return (
    <div ref={root} aria-hidden="true" className={cn("pointer-events-none absolute inset-x-0 top-0 h-0", className)}>
      {items.map((l, i) => (
        <div key={i} data-drop className="absolute top-0 origin-top" style={{ left: l.left, width: l.size }}>
          <div className="animate-sway origin-top" style={{ animationDelay: `${i * -1.3}s` }}>
            <span className="mx-auto block w-px bg-gradient-to-b from-transparent via-brand-gold/50 to-brand-gold/70" style={{ height: l.rope }} />
            <div className="relative">
              <span data-glow className="absolute inset-[-25%] rounded-full bg-saffron/25 blur-3xl" />
              <LanternSvg char={l.char ?? "福"} id={`lt${i}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LanternSvg({ char, id }: { char: string; id: string }) {
  return (
    <svg viewBox="0 0 100 168" className="relative block w-full drop-shadow-2xl">
      <defs>
        <radialGradient id={`${id}-body`} cx="50%" cy="45%" r="60%">
          <stop offset="0%" className="text-saffron" stopColor="currentColor" />
          <stop offset="45%" className="text-fire" stopColor="currentColor" />
          <stop offset="100%" className="text-wine" stopColor="currentColor" />
        </radialGradient>
      </defs>
      {/* tepa qalpoq */}
      <rect x="32" y="0" width="36" height="10" rx="2" className="fill-brand-gold" />
      <rect x="27" y="9" width="46" height="5" rx="2" className="fill-saffron-deep" />
      {/* tana */}
      <ellipse cx="50" cy="66" rx="46" ry="52" fill={`url(#${id}-body)`} />
      {/* qovurg'alar */}
      <g fill="none" className="stroke-wine" strokeOpacity="0.55" strokeWidth="1.4">
        <ellipse cx="50" cy="66" rx="31" ry="52" />
        <ellipse cx="50" cy="66" rx="15" ry="52" />
        <line x1="50" y1="14" x2="50" y2="118" />
      </g>
      {/* oltin chiziqlar */}
      <path d="M12 40 Q50 30 88 40" fill="none" className="stroke-brand-gold" strokeWidth="1.6" />
      <path d="M12 92 Q50 102 88 92" fill="none" className="stroke-brand-gold" strokeWidth="1.6" />
      <text x="50" y="76" textAnchor="middle" className="fill-brand-gold-light font-cn" style={{ fontSize: 26 }}>{char}</text>
      {/* past qalpoq + popuk */}
      <rect x="27" y="117" width="46" height="5" rx="2" className="fill-saffron-deep" />
      <rect x="34" y="121" width="32" height="8" rx="2" className="fill-brand-gold" />
      <circle cx="50" cy="134" r="4" className="fill-brand-gold" />
      <g className="stroke-fire" strokeWidth="1.3" strokeLinecap="round">
        <line x1="50" y1="137" x2="50" y2="166" />
        <line x1="47" y1="137" x2="44" y2="164" />
        <line x1="53" y1="137" x2="56" y2="164" />
        <line x1="45" y1="137" x2="40" y2="160" />
        <line x1="55" y1="137" x2="60" y2="160" />
      </g>
    </svg>
  );
}
