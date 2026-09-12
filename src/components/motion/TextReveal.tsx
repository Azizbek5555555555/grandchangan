"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

type Props = {
  text: string;
  className?: string;
  trigger?: "scroll" | "load";
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
};

export default function TextReveal({ text, className, trigger = "scroll", delay = 0, as = "h2" }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const words = text.split(" ");

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const spans = el.querySelectorAll("[data-word]");
      gsap.from(spans, {
        yPercent: 120,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.07,
        delay,
        ...(trigger === "scroll"
          ? { scrollTrigger: { trigger: el, start: "top 85%", once: true } }
          : {}),
      });
    },
    { scope: ref }
  );

  const Tag = as as React.ElementType;
  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" aria-hidden="true">
          <span data-word className="inline-block">{w}&nbsp;</span>
        </span>
      ))}
    </Tag>
  );
}
