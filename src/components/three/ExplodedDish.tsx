"use client";

import dynamic from "next/dynamic";
import { useMemo, type ReactNode } from "react";
import type { SceneRecipe } from "@/lib/menu/recipe-types";
import Lazy3D from "./Lazy3D";
import type { ExplodeView } from "./scenes/ExplodedDishScene";
import type { SceneProps } from "./lib/types";

// three.js sahnasi alohida chunk — faqat klientda; sahifa yuklangach bo'sh vaqtda oldindan yuklanadi (load)
const load = () => import("./scenes/ExplodedDishScene");
const Scene = dynamic(load, { ssr: false, loading: () => null });

/**
 * Taomning qatlamli ("exploded") ko'rinishi: idish + retsept qatlamlari. labels — yuqoridan pastga
 * (oxirgisi — idish). Progress: eng yaqin [data-explode-track] ota bo'limning scroll'idan (sticky bo'lim ichiga qo'ying).
 * fallback — 3D tayyor bo'lguncha (va WebGL bo'lmasa) ko'rsatiladi.
 */
export default function ExplodedDish({
  className, recipe, labels, view, fallback,
}: {
  className?: string;
  recipe: SceneRecipe;
  labels: string[];
  view?: ExplodeView;
  fallback?: ReactNode;
}) {
  const key = JSON.stringify([recipe, labels, view]);
  const Bound = useMemo(
    () =>
      function ExplodedBound(p: SceneProps) {
        return <Scene {...p} recipe={recipe} labels={labels} view={view} />;
      },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  return <Lazy3D className={className} Scene={Bound} load={load} rootMargin="400px" fallback={fallback} />;
}
