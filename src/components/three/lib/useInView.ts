"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Element viewport yaqinidami (rootMargin ichida).
 * near — hozir yaqinda (render yoqiladi/to'xtatiladi), seen — bir marta bo'lsa ham ko'rindi (lazy yuklash).
 */
export function useNearViewport(ref: RefObject<HTMLElement | null>, rootMargin = "200px") {
  const [near, setNear] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        if (!e) return;
        setNear(e.isIntersecting);
        if (e.isIntersecting) setSeen(true);
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);

  return { near, seen };
}
