"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export default function Counter({
  to, suffix = "", decimals = 0, className,
}: { to: number; suffix?: string; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const obj = { val: 0 };
      gsap.to(obj, {
        val: to,
        duration: 1.8,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
        onUpdate: () => { el.textContent = obj.val.toFixed(decimals) + suffix; },
      });
    },
    { scope: ref }
  );

  return <span ref={ref} className={className}>{(0).toFixed(decimals)}{suffix}</span>;
}
