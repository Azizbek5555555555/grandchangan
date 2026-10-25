"use client";

import dynamic from "next/dynamic";
import Lazy3D from "./Lazy3D";

// three.js sahnasi alohida chunk — faqat klientda; sahifa yuklangach bo'sh vaqtda oldindan yuklanadi (load)
const load = () => import("./scenes/DimSumScene");
const Scene = dynamic(load, { ssr: false, loading: () => null });

/** Bambuk bug'latgich + chuchvaralar; bo'lim ko'ringanda qopqoq ochilib bug' chiqadi. Konteynerga o'lcham bering. */
export default function DimSumSteamer({ className }: { className?: string }) {
  return <Lazy3D className={className} Scene={Scene} load={load} />;
}
