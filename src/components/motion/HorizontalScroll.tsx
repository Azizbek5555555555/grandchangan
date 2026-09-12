"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export default function HorizontalScroll({ children }: { children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement | null>(null);
  const track = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const w = wrap.current, tr = track.current;
      if (!w || !tr) return;
      const distance = () => Math.max(0, tr.scrollWidth - window.innerWidth);

      const tween = gsap.to(tr, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: w,
          start: "top top",
          end: () => "+=" + distance(),
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Fokusdagi kartani aniqlash — markazga kelgani rangli+katta bo'ladi
      const cards = gsap.utils.toArray<HTMLElement>(tr.querySelectorAll("[data-hs-card]"));
      const triggers = cards.map((card) =>
        ScrollTrigger.create({
          trigger: card,
          containerAnimation: tween,
          start: "left center",
          end: "right center",
          onToggle: (self) => card.classList.toggle("hs-active", self.isActive),
        })
      );

      return () => {
        triggers.forEach((t) => t.kill());
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: wrap }
  );

  return (
    <div ref={wrap} className="relative overflow-hidden">
      <div ref={track} className="flex w-max flex-nowrap items-center will-change-transform">
        {children}
      </div>
    </div>
  );
}
