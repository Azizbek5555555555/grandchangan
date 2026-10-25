"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Element viewport yaqinidami.
 * near — hozir rootMargin ichida (render yoqiladi/to'xtatiladi);
 * seen — bir marta bo'lsa ham mountMargin ichiga kirdi (sahna oldindan o'rnatiladi, shader'lar kompilyatsiya
 * qilinadi — foydalanuvchi bo'limga yetganda 3D darhol tayyor turadi).
 */
export function useNearViewport(ref: RefObject<HTMLElement | null>, rootMargin = "200px", mountMargin = rootMargin) {
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
    // Uzoqroqdan "oldindan o'rnatish" kuzatuvchisi — bir marta ishlaydi
    const pre = new IntersectionObserver(
      (entries) => {
        if (entries.some((x) => x.isIntersecting)) {
          setSeen(true);
          pre.disconnect();
        }
      },
      { rootMargin: mountMargin },
    );
    io.observe(el);
    pre.observe(el);
    return () => {
      io.disconnect();
      pre.disconnect();
    };
  }, [ref, rootMargin, mountMargin]);

  return { near, seen };
}
