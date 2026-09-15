"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function CustomCursor() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname?.includes("/admin")) return;
    if (typeof window === "undefined" || window.matchMedia("(pointer: coarse)").matches) return;
    const dot = document.getElementById("cursor-dot");
    const ring = document.getElementById("cursor-ring");
    if (!dot || !ring) return;
    document.body.classList.add("cursor-none");

    let mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my, raf = 0;
    const move = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    };
    const loop = () => {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    const over = (e: MouseEvent) => { if ((e.target as HTMLElement).closest("a,button,[role=button]")) ring.classList.add("cursor-ring-active"); };
    const out = (e: MouseEvent) => { if ((e.target as HTMLElement).closest("a,button,[role=button]")) ring.classList.remove("cursor-ring-active"); };

    window.addEventListener("mousemove", move);
    document.addEventListener("mouseover", over);
    document.addEventListener("mouseout", out);
    loop();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mouseout", out);
      document.body.classList.remove("cursor-none");
    };
  }, [pathname]);

  return (
    <>
      <div id="cursor-dot" className="pointer-events-none fixed left-0 top-0 z-[9999] h-1.5 w-1.5 rounded-full bg-brand-gold" style={{ transform: "translate(-100px,-100px)" }} />
      <div id="cursor-ring" className="pointer-events-none fixed left-0 top-0 z-[9998] rounded-full border border-brand-gold/70" style={{ transform: "translate(-100px,-100px)", width: "34px", height: "34px", transition: "width .25s ease, height .25s ease, background-color .25s ease" }} />
    </>
  );
}
