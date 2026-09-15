"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

// Diagonal 3D "varaq ochilishi" — pastki-o'ngdan yuqori-chapga buklanib ochiladi
export default function PeelReveal({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const cover = root.current?.querySelector("[data-cover]") as HTMLElement | null;
      if (!cover) return;
      gsap.set(cover, { autoAlpha: 1, rotateX: 0, rotateY: 0 });
      gsap.to(cover, {
        rotateY: -102,
        rotateX: 26,
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top 92%", end: "top 20%", scrub: true },
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} className="relative" style={{ perspective: "1700px" }}>
      {children}
      <div
        data-cover
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          visibility: "hidden",
          transformOrigin: "0% 0%",
          backfaceVisibility: "hidden",
          willChange: "transform, opacity",
          background: "linear-gradient(135deg, #f1e9db 0%, #e6dbc6 55%, #d5c9af 100%)",
        }}
      >
        {/* hinge soyasi (yuqori-chap) */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.06) 35%, transparent 55%)" }} />
        {/* ko'tarilayotgan burchak yorug'ligi (pastki-o'ng) */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 100% 100%, rgba(255,255,255,0.4), transparent 45%)" }} />
      </div>
    </div>
  );
}
