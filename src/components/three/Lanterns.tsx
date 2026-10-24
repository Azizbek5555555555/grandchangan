"use client";

import dynamic from "next/dynamic";
import Lazy3D from "./Lazy3D";

// three.js sahnasi alohida chunk — faqat klientda va viewport yaqinida yuklanadi
const Scene = dynamic(() => import("./scenes/LanternsScene"), { ssr: false, loading: () => null });

/** Suzib yuruvchi qizil xitoy fonarlari (bezak). Konteynerga o'lcham bering. */
export default function Lanterns({ className }: { className?: string }) {
  return <Lazy3D className={className} Scene={Scene} />;
}
