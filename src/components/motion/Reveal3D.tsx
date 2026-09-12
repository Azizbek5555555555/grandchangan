"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export default function Reveal3D({
  children, className, stagger = 0.12,
}: { children: React.ReactNode; className?: string; stagger?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const items = Array.from(el.children) as HTMLElement[];
      gsap.from(items, {
        opacity: 0, y: 70, rotateX: -45, transformOrigin: "50% 100%",
        duration: 1, ease: "power3.out", stagger,
        scrollTrigger: { trigger: el, start: "top 82%", once: true },
      });
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className} style={{ perspective: "1200px" }}>
      {children}
    </div>
  );
}
