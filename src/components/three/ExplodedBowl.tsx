"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import Lazy3D from "./Lazy3D";
import type { SceneProps } from "./lib/types";

// three.js sahnasi alohida chunk — faqat klientda; sahifa yuklangach bo'sh vaqtda oldindan yuklanadi (load)
const load = () => import("./scenes/ExplodedBowlScene");
const Scene = dynamic(load, { ssr: false, loading: () => null });

/**
 * Lag'mon kosasining qatlamli ("exploded") ko'rinishi. labels — yuqoridan pastga 6 ta nom:
 * ziravorlar, ko'katlar, go'sht, lag'mon, sho'rva, kosa. Progress: eng yaqin [data-explode-track]
 * ota bo'limning scroll'idan (sticky bo'lim ichiga qo'ying), topilmasa — ko'rinishga kirishdan.
 */
export default function ExplodedBowl({ className, labels }: { className?: string; labels: string[] }) {
  const key = labels.join("|");
  const Bound = useMemo(
    () =>
      function ExplodedBound(p: SceneProps) {
        return <Scene {...p} labels={labels} />;
      },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  return <Lazy3D className={className} Scene={Bound} load={load} rootMargin="400px" />;
}
