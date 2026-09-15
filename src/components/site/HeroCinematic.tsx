"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";

type Props = {
  mainImg?: string | null;
  dishes: string[];
  eyebrow: string;
  title: string;
  subtitle: string;
  bookLabel: string;
  menuLabel: string;
  scrollLabel: string;
};

export default function HeroCinematic({ mainImg, dishes, eyebrow, title, subtitle, bookLabel, menuLabel, scrollLabel }: Props) {
  const root = useRef<HTMLElement | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      gsap.from("[data-hero-fade]", { opacity: 0, y: 34, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.2 });
      gsap.from("[data-hero-float]", { opacity: 0, scale: 0.82, duration: 1.2, ease: "power3.out", stagger: 0.15, delay: 0.45 });
      gsap.utils.toArray<HTMLElement>("[data-hero-float]").forEach((el, i) => {
        gsap.to(el, { y: "+=20", duration: 3 + i * 0.5, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1 });
      });

      const r = root.current, st = stage.current;
      if (!r || !st) return;
      const onMove = (e: MouseEvent) => {
        const b = r.getBoundingClientRect();
        const px = (e.clientX - b.left) / b.width - 0.5;
        const py = (e.clientY - b.top) / b.height - 0.5;
        gsap.to(st, { rotateY: px * 9, rotateX: -py * 9, duration: 0.7, ease: "power2.out", transformPerspective: 1200 });
        gsap.utils.toArray<HTMLElement>("[data-depth]").forEach((el) => {
          const d = parseFloat(el.getAttribute("data-depth") || "0");
          gsap.to(el, { x: px * d, y: py * d, duration: 0.7, ease: "power2.out" });
        });
      };
      r.addEventListener("mousemove", onMove);
      return () => r.removeEventListener("mousemove", onMove);
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative flex min-h-screen items-center overflow-hidden bg-brand-ink" style={{ perspective: "1200px" }}>
      <div ref={stage} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        {mainImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img data-depth="24" src={mainImg} alt="" className="absolute inset-0 h-[112%] w-[108%] -translate-x-[4%] -translate-y-[6%] object-cover animate-kenburns" />
        ) : (
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(60% 60% at 78% 12%, rgba(200,162,75,0.18) 0%, transparent 60%), radial-gradient(55% 55% at 8% 92%, rgba(179,18,23,0.22) 0%, transparent 55%)" }} />
        )}
        <div className="absolute inset-0 hero-scrim" />

        {dishes[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img data-hero-float data-depth="70" src={dishes[0]} alt="" className="absolute left-[5%] top-[16%] hidden h-56 w-44 rounded-3xl border-4 border-white/10 object-cover shadow-2xl lg:block" style={{ transform: "translateZ(60px)" }} />
        ) : null}
        {dishes[1] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img data-hero-float data-depth="95" src={dishes[1]} alt="" className="absolute right-[6%] top-[20%] hidden h-52 w-40 rotate-3 rounded-3xl border-4 border-white/10 object-cover shadow-2xl lg:block" style={{ transform: "translateZ(95px)" }} />
        ) : null}
        {dishes[2] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img data-hero-float data-depth="55" src={dishes[2]} alt="" className="absolute bottom-[12%] right-[14%] hidden h-44 w-56 -rotate-3 rounded-3xl border-4 border-white/10 object-cover shadow-2xl xl:block" style={{ transform: "translateZ(40px)" }} />
        ) : null}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 text-center">
        <p data-hero-fade className="mb-6 text-xs uppercase tracking-[0.4em] text-brand-gold">{eyebrow}</p>
        <h1 data-hero-fade className="font-display text-6xl leading-[1.02] text-brand-cream sm:text-8xl">{title}</h1>
        <p data-hero-fade className="mx-auto mt-6 max-w-xl text-lg text-brand-cream/70">{subtitle}</p>
        <div data-hero-fade className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/reservation" className="btn-gold-sheen group inline-flex items-center gap-2 rounded-full bg-brand-red px-8 py-4 text-sm font-medium text-white transition hover:bg-brand-red-dark">
            {bookLabel} <ArrowRight size={16} className="transition group-hover:translate-x-1" />
          </Link>
          <Link href="/menu" className="inline-flex items-center rounded-full border border-brand-cream/25 px-8 py-4 text-sm font-medium text-brand-cream transition hover:border-brand-gold hover:text-brand-gold-light">
            {menuLabel}
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center">
        <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-brand-cream/50">{scrollLabel}</p>
        <div className="mx-auto h-10 w-px bg-brand-cream/20"><div className="mx-auto h-2 w-px bg-brand-gold scroll-cue-dot" /></div>
      </div>
    </section>
  );
}
