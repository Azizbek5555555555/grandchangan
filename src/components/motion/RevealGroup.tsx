"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function RevealGroup({
  children, className, stagger = 0.12, y = 40,
}: { children: React.ReactNode; className?: string; stagger?: number; y?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const items = Array.from(el.children) as HTMLElement[];
      gsap.fromTo(
        items,
        { opacity: 0, y },
        {
          opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger,
          scrollTrigger: { trigger: el, start: "top 80%", once: true },
        }
      );
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
