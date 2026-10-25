"use client";

import dynamic from "next/dynamic";
import Lazy3D from "./Lazy3D";

// three.js sahnasi alohida chunk — faqat klientda; sahifa yuklangach bo'sh vaqtda oldindan yuklanadi (load)
const load = () => import("./scenes/LanternsScene");
const Scene = dynamic(load, { ssr: false, loading: () => null });

/** Suzib yuruvchi qizil xitoy fonarlari (bezak). Konteynerga o'lcham bering. */
export default function Lanterns({ className }: { className?: string }) {
  return <Lazy3D className={className} Scene={Scene} load={load} />;
}
