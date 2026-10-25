"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import Lazy3D from "./Lazy3D";
import type { SceneProps } from "./lib/types";

// three.js sahnasi alohida chunk — faqat klientda va viewport yaqinida yuklanadi
const Scene = dynamic(() => import("./scenes/HeroBowlScene"), { ssr: false, loading: () => null });

/**
 * Lag'mon kosasi + palochkalar + uchayotgan masalliqlar. Konteynerga o'lcham bering (masalan aspect-square).
 * tone: "fire" — qizil fon uchun yorug'lik, "night" — qorong'i (premium) fon uchun.
 */
export default function HeroBowl({ className, tone = "fire" }: { className?: string; tone?: "fire" | "night" }) {
  const Bound = useMemo(
    () =>
      function HeroBound(p: SceneProps) {
        return <Scene {...p} tone={tone} />;
      },
    [tone],
  );
  return <Lazy3D className={className} Scene={Bound} />;
}
