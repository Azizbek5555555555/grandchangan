"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrollRail from "@/components/site/chrome/ScrollRail";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.includes("/admin");

  // useLayoutEffect: sahifa almashganda eski Lenis yangi sahifa chizilishidan OLDIN to'xtatiladi — aks holda
  // davom etayotgan silliq scroll animatsiyasi Next'ning "tepaga qaytish"ini bekor qilib, sahifani pastga tortadi
  useLayoutEffect(() => {
    // Admin panelda tabiiy scroll (formalar, kanban) — Lenis o'chiriladi
    if (isAdmin) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);
    // ScrollRail va boshqa komponentlar silliq o'tish uchun ishlatadi
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    document.documentElement.classList.add("reveal-ready");

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
      document.documentElement.classList.remove("reveal-ready");
    };
  }, [isAdmin, pathname]);

  return (
    <>
      {children}
      {!isAdmin && <ScrollRail key={pathname} />}
    </>
  );
}
