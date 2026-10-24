"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * Raqam sanagich. Server HTML'da darhol HAQIQIY qiymat (JS'siz ham to'g'ri ko'rinadi);
 * brauzerda ko'rinishga kirganda 0 dan sanaydi. prefers-reduced-motion — animatsiyasiz.
 */
export default function CountUp({ to, suffix = "", className }: { to: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const obj = { v: 0 };
    el.textContent = `0${suffix}`;
    const tw = gsap.to(obj, {
      v: to,
      duration: 1.8,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 92%", once: true },
      onUpdate: () => { el.textContent = `${Math.round(obj.v)}${suffix}`; },
    });
    return () => {
      tw.scrollTrigger?.kill();
      tw.kill();
      el.textContent = `${to}${suffix}`;
    };
  }, [to, suffix]);

  return <span ref={ref} className={className}>{to}{suffix}</span>;
}
