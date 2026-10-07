"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * "Varaq" o'tishi: bo'lim ekran tepasiga yetganda to'xtaydi va chap-yuqoriga varaqdek
 * buklanib ketadi, ostidan keyingi bo'lim ochiladi.
 *
 * Tuzilma: target va keyingi bo'lim bitta o'ramda bo'lishi kerak:
 *   <div> <section id={targetId}/> <section (keyingi)/> </div>
 * sticky/z-index JS orqali qo'yiladi — JS ishlamasa yoki foydalanuvchi "kam harakat"
 * sozlamasini yoqqan bo'lsa, sahifa oddiy scroll bo'lib qoladi.
 */
export default function Fold3D({ targetId }: { targetId: string }) {
  useGSAP(() => {
    const el = document.getElementById(targetId);
    const wrap = el?.parentElement;
    if (!el || !wrap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // perspective va o'q nuqtasi o'zgarmas (animatsiya qilinsa, boshida kuchli buzilish bo'lardi)
    gsap.set(el, { position: "sticky", top: 0, zIndex: 20, transformOrigin: "left top", transformPerspective: 1300 });
    const tween = gsap.fromTo(
      el,
      { rotationX: 0, rotationY: 0, autoAlpha: 1 },
      {
        rotationX: -82,
        rotationY: 14,
        autoAlpha: 0, // oxirida visibility:hidden — ostidagi forma bosiladigan bo'ladi
        ease: "power1.in",
        scrollTrigger: {
          trigger: wrap,
          start: "top top",
          end: () => "+=" + el.offsetHeight,
          scrub: 0.4,
          invalidateOnRefresh: true,
          // Bu komponent sahifa tepasida yaratiladi, lekin bo'lim gorizontal pin'dan PASTDA.
          // Past ustuvorlik — pin masofasi qo'shilgandan keyin hisoblansin (aks holda
          // animatsiya foydalanuvchi yetib kelmasdan tugab qolardi).
          refreshPriority: -1,
        },
      }
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(el, { clearProps: "all" });
    };
  }, []);
  return null;
}
