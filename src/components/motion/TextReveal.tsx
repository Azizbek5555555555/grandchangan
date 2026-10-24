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

  // R3F JSX turlarini global qo'shadi — ElementType juda keng bo'lib qoladi, shuning uchun aniq HTML teg turi
  const labelled = as === "h1" || as === "h2" || as === "h3";
  const Tag = as as unknown as React.FC<React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement | null> }>;
  return (
    // aria-label faqat sarlavhalarda ishlaydi; span'da so'zlar o'zi o'qiladi (aria-hidden emas)
    <Tag ref={ref} className={className} aria-label={labelled ? text : undefined}>
      {words.map((w, i) => (
        // py/-my: harf dumlari (y, g, q) va bosh harf ustidagi belgilar overflow'da kesilmasin
        <span key={i} className="-my-[0.14em] inline-block overflow-hidden py-[0.14em] align-bottom" aria-hidden={labelled || undefined}>
          <span data-word className="inline-block">{w}&nbsp;</span>
        </span>
      ))}
    </Tag>
  );
}
