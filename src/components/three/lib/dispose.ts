"use client";

import { useEffect, useMemo, type DependencyList } from "react";

type Disposable = { dispose: () => void };

function isDisposable(v: unknown): v is Disposable {
  return typeof v === "object" && v !== null && typeof (v as Disposable).dispose === "function";
}

/** Ob'ekt ichidagi barcha geometriya/material/teksturalarni bo'shatadi (bir daraja + massivlar) */
export function disposeDeep(v: unknown, depth = 0): void {
  if (depth > 3 || v === null || typeof v !== "object") return;
  if (isDisposable(v)) {
    v.dispose();
    return;
  }
  const values = Array.isArray(v) ? v : Object.values(v as Record<string, unknown>);
  for (const x of values) disposeDeep(x, depth + 1);
}

/** useMemo + unmount'da dispose (CanvasTexture, BufferGeometry, Material) */
export function useDisposable<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(factory, deps);
  useEffect(() => () => disposeDeep(value), [value]);
  return value;
}
