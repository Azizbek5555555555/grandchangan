"use client";

import dynamic from "next/dynamic";
import Lazy3D from "./Lazy3D";

// three.js sahnasi alohida chunk — faqat klientda va viewport yaqinida yuklanadi
const Scene = dynamic(() => import("./scenes/HeroBowlScene"), { ssr: false, loading: () => null });

/** Lag'mon kosasi + palochkalar + uchayotgan masalliqlar. Konteynerga o'lcham bering (masalan aspect-square). */
export default function HeroBowl({ className }: { className?: string }) {
  return <Lazy3D className={className} Scene={Scene} />;
}
