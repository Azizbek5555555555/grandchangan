"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  children: React.ReactNode;
  className?: string;
  y?: number;
  delay?: number;
  duration?: number;
  as?: "div" | "section" | "li" | "span" | "article";
};

export default function Reveal({
  children, className, y = 40, delay = 0, duration = 0.9, as = "div",
}: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      gsap.fromTo(
        el,
        { opacity: 0, y },
        {
          opacity: 1, y: 0, duration, delay, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        }
      );
    },
    { scope: ref }
  );

  const Tag = as as React.ElementType;
  return (
    <Tag ref={ref} data-reveal className={className}>
      {children}
    </Tag>
  );
}
