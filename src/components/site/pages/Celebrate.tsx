"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

/** Bayram "konfetti"si uchun rang klasslari (faqat tokenlar) */
const COLORS = ["bg-fire", "bg-saffron", "bg-brand-gold", "bg-jade", "bg-fire-deep", "bg-saffron-deep"];
const COUNT = 28;

/**
 * Bron muvaffaqiyatli bo'lganda — markazdan otilib chiqadigan qog'oz bo'laklari va to'lqin halqalar
 * (xitoycha mushak/bayram ruhi). Faqat bezak; reduced-motion bo'lsa umuman ko'rinmaydi.
 * Ota element `relative` bo'lishi kerak.
 */
export default function Celebrate({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const bits = el.querySelectorAll<HTMLElement>("[data-bit]");
        const rings = el.querySelectorAll<HTMLElement>("[data-ring]");
        gsap.set(el, { autoAlpha: 1 });
        bits.forEach((b, i) => {
          const a = (i / bits.length) * Math.PI * 2 + gsap.utils.random(-0.2, 0.2);
          const d = gsap.utils.random(110, 260);
          gsap.fromTo(
            b,
            { x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 },
            {
              x: Math.cos(a) * d,
              y: Math.sin(a) * d + gsap.utils.random(20, 90),
              scale: gsap.utils.random(0.7, 1.3),
              rotate: gsap.utils.random(-260, 260),
              opacity: 0,
              duration: gsap.utils.random(1.3, 2),
              ease: "power3.out",
              delay: 0.15 + (i % 4) * 0.03,
            }
          );
        });
        gsap.fromTo(rings, { scale: 0.2, opacity: 0.7 }, { scale: 2.4, opacity: 0, duration: 1.6, ease: "power2.out", stagger: 0.25 });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <div ref={ref} aria-hidden="true" className={cn("pointer-events-none invisible absolute inset-0 flex items-center justify-center", className)}>
      <span data-ring className="absolute h-28 w-28 rounded-full border-2 border-saffron" />
      <span data-ring className="absolute h-28 w-28 rounded-full border border-fire" />
      {Array.from({ length: COUNT }).map((_, i) => (
        <span
          key={i}
          data-bit
          className={cn(
            "absolute opacity-0",
            COLORS[i % COLORS.length],
            i % 3 === 0 ? "h-2.5 w-2.5 rotate-45" : i % 3 === 1 ? "h-2 w-4 rounded-sm" : "h-2.5 w-2.5 rounded-full"
          )}
        />
      ))}
    </div>
  );
}
