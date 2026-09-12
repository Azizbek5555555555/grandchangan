"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export default function RotateOnScroll({
  children, className, deg = 160, scaleFrom = 0.8,
}: { children: React.ReactNode; className?: string; deg?: number; scaleFrom?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      gsap.fromTo(
        el,
        { rotate: 0, scale: scaleFrom },
        {
          rotate: deg, scale: 1, ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 },
        }
      );
    },
    { scope: ref }
  );

  return <div ref={ref} className={className} style={{ willChange: "transform" }}>{children}</div>;
}
