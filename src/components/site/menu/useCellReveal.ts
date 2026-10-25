"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * Katakchalar ichidagi kontent ([data-rv]) ko'rinishga kirganda qatorma-qator ochiladi.
 * Katakchaning o'zi (oltin chiziqlari bilan) joyida qoladi — panjara "sakramaydi".
 * Faqat mount'da ishlaydi: keyin (filtrdan so'ng) qo'shilgan katakchalar darhol ko'rinadi.
 * JS'siz yoki reduced-motion'da — hammasi ko'rinib turadi.
 */
export function useCellReveal(scope: React.RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const root = scope.current;
      if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const els = Array.from(root.querySelectorAll<HTMLElement>("[data-rv]"));
      // Ekranda allaqachon ko'rinib turganlarni yashirmaymiz (miltillamasin)
      const below = els.filter((el) => el.getBoundingClientRect().top > window.innerHeight * 0.92);
      if (!below.length) return;
      gsap.set(below, { opacity: 0, y: 36 });
      ScrollTrigger.batch(below, {
        start: "top 92%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.09, overwrite: true, clearProps: "transform" }),
      });
    },
    { scope }
  );
}
