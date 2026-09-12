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
      return () => { tween.scrollTrigger?.kill(); tween.kill(); };
    },
    { scope: wrap }
  );

  return (
    <div ref={wrap} className="relative overflow-hidden">
      <div ref={track} className="flex w-max flex-nowrap items-stretch will-change-transform">
        {children}
      </div>
    </div>
  );
}
