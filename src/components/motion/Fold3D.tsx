"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export default function Fold3D({ targetId }: { targetId: string }) {
  useGSAP(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    gsap.to(el, {
      rotationX: -44,
      rotationY: 17,
      xPercent: -5,
      opacity: 0.2,
      transformOrigin: "left top",
      transformPerspective: 1300,
      ease: "none",
      scrollTrigger: { trigger: el, start: "center 60%", end: "top top", scrub: 0.5 },
    });
  }, []);
  return null;
}
