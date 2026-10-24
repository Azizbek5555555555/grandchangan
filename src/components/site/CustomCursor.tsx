"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const INTERACTIVE = "a,button,[role=button],input,select,textarea,label,summary";

/**
 * Nozik zafar halqa — sichqonchaga yumshoq ergashadi, havola/tugma ustida kattalashadi.
 * Tizim kursori YASHIRILMAYDI (foydalanish qulayligi). Faqat aniq sichqoncha (hover + fine pointer)
 * bo'lganda, reduced-motion o'chiq bo'lganda va admin paneldan tashqarida ishlaydi; aks holda hech narsa chizilmaydi.
 */
export default function CustomCursor() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const ringRef = useRef<HTMLDivElement>(null);

  // Qurilma imkoniyatini aniqlash (o'zgarsa — masalan planshetga sichqoncha ulansa — qayta tekshiriladi)
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(fine.matches && !reduce.matches && !pathname?.includes("/admin"));
    update();
    fine.addEventListener("change", update);
    reduce.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, [pathname]);

  useEffect(() => {
    const ring = ringRef.current;
    if (!enabled || !ring) return;
    let mx = -100, my = -100, rx = -100, ry = -100, raf = 0, shown = false;

    const tick = () => {
      rx += (mx - rx) * 0.2;
      ry += (my - ry) * 0.2;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      // Yetib olgach to'xtaydi — bekor turganda CPU sarflanmaydi
      raf = Math.abs(mx - rx) + Math.abs(my - ry) > 0.2 ? requestAnimationFrame(tick) : 0;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX;
      my = e.clientY;
      if (!shown) {
        shown = true;
        rx = mx;
        ry = my;
        ring.dataset.visible = "true";
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const over = (e: PointerEvent) => {
      ring.dataset.active = (e.target as Element | null)?.closest?.(INTERACTIVE) ? "true" : "false";
    };
    const leave = () => {
      shown = false;
      ring.dataset.visible = "false";
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={ringRef}
      aria-hidden="true"
      data-visible="false"
      data-active="false"
      className="group/cursor pointer-events-none fixed left-0 top-0 z-[9999] opacity-0 transition-opacity duration-300 data-[visible=true]:opacity-100"
      style={{ transform: "translate3d(-100px, -100px, 0)" }}
    >
      <div
        className={cn(
          "-ml-4 -mt-4 h-8 w-8 rounded-full border-[1.5px] border-saffron/70 transition-[transform,background-color,border-color] duration-300 ease-out-expo",
          "group-data-[active=true]/cursor:scale-[1.6] group-data-[active=true]/cursor:border-saffron group-data-[active=true]/cursor:bg-saffron/10"
        )}
      />
    </div>
  );
}
