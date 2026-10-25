"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import Lazy3D from "./Lazy3D";
import type { SceneProps } from "./lib/types";

// three.js sahnasi alohida chunk — faqat klientda; sahifa yuklangach bo'sh vaqtda oldindan yuklanadi (load)
const load = () => import("./scenes/HeroBowlScene");
const Scene = dynamic(load, { ssr: false, loading: () => null });

/**
 * Lag'mon kosasi + palochkalar + uchayotgan masalliqlar. Konteynerga o'lcham bering (masalan aspect-square).
 * tone: "fire" — qizil fon uchun yorug'lik, "night" — qorong'i (premium) fon uchun.
 */
export default function HeroBowl({ className, tone = "fire", poster }: { className?: string; tone?: "fire" | "night"; poster?: string }) {
  const Bound = useMemo(
    () =>
      function HeroBound(p: SceneProps) {
        return <Scene {...p} tone={tone} />;
      },
    [tone],
  );
  return <Lazy3D className={className} Scene={Bound} load={load} poster={poster} />;
}
