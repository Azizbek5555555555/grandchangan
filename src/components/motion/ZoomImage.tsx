"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export default function ZoomImage({
  src, alt = "", className, from = 1.35,
}: { src: string; alt?: string; className?: string; from?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current?.querySelector("img");
      if (!el) return;
      gsap.fromTo(
        el,
        { scale: from },
        {
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true },
        }
      );
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={"overflow-hidden " + (className || "")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover will-change-transform" />
    </div>
  );
}
