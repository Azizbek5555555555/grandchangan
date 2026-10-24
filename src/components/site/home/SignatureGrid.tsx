"use client";

import { useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import SafeImg from "./SafeImg";
import { PlateFallback } from "./Decor";
import { Price, SpicyVeg } from "./DishBadges";
import type { HomeDish } from "./types";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * 2-bo'lim: mashhur taomlar (namuna 1 kartalari) — kategoriya chiplari bilan filtr.
 * Kartaning tepasidan dumaloq rasm chiqib turadi; hover'da karta ko'tariladi, rasm aylanadi.
 */
export default function SignatureGrid({ dishes, allLabel }: { dishes: HomeDish[]; allLabel: string }) {
  const [active, setActive] = useState<string>("all");
  const gridRef = useRef<HTMLDivElement | null>(null);
  // Oldingi filtr: null/teng — birinchi chiqish (scroll bilan), farqli — filtr almashdi
  const prev = useRef<string | null>(null);

  const cats = useMemo(() => {
    const m = new Map<string, string>();
    dishes.forEach((d) => m.set(d.catId, d.catName));
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [dishes]);
  const shown = active === "all" ? dishes : dishes.filter((d) => d.catId === active);

  useGSAP(
    () => {
      const el = gridRef.current;
      if (!el || reduced()) return;
      const cards = Array.from(el.children) as HTMLElement[];
      const initial = prev.current === null || prev.current === active;
      prev.current = active;
      if (initial) {
        // Birinchi marta — ekranga kirganda navbat bilan chiqadi
        gsap.fromTo(
          cards,
          { opacity: 0, y: 70 },
          { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.1, scrollTrigger: { trigger: el, start: "top 82%", once: true } }
        );
      } else {
        gsap.fromTo(cards, { opacity: 0, y: 28, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out", stagger: 0.06 });
        // Balandlik o'zgardi — pastdagi bo'limlarning trigger joylari yangilansin
        ScrollTrigger.refresh();
      }
    },
    { scope: gridRef, dependencies: [active] }
  );

  return (
    <div>
      {cats.length > 1 && (
        <div role="group" aria-label={allLabel} className="-mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          {[{ id: "all", name: allLabel }, ...cats].map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={active === c.id}
              onClick={() => setActive(c.id)}
              className={cn(
                "h-11 shrink-0 rounded-full border px-5 text-sm font-semibold transition duration-300",
                active === c.id
                  ? "border-fire bg-fire text-brand-cream shadow-lg shadow-fire/25"
                  : "border-line bg-card text-content hover:border-fire hover:text-fire"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div ref={gridRef} className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-12 sm:mt-14">
        {shown.map((d) => (
          <DishCard key={`${active}-${d.id}`} dish={d} />
        ))}
      </div>
    </div>
  );
}

export function DishCard({ dish, className }: { dish: HomeDish; className?: string }) {
  const t = useTranslations("Home2");
  return (
    <article className={cn("group relative w-full pt-[5.5rem] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]", className)}>
      <div className="relative flex h-full flex-col rounded-[28px] border border-line bg-card px-6 pb-6 pt-[6.75rem] text-center shadow-sm transition duration-500 ease-out-expo group-hover:-translate-y-2 group-hover:border-fire/40 group-hover:shadow-2xl group-hover:shadow-fire/15">
        <div className="pb-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{dish.catName}</p>
          {dish.zh && (
            <p lang="zh" className="font-cn text-xl leading-none text-fire">{dish.zh}</p>
          )}
          <h3 className="mt-2 font-display text-2xl font-semibold leading-tight text-content">{dish.name}</h3>
          {dish.desc && <p className="mx-auto mt-3 line-clamp-2 max-w-xs text-sm leading-relaxed text-muted">{dish.desc}</p>}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-dashed border-line pt-5">
          <div className="flex min-w-0 flex-col items-start gap-1 text-left">
            <Price price={dish.price} oldPrice={dish.oldPrice} className="font-poster text-xl text-fire" oldClassName="text-muted" />
            <SpicyVeg spicy={dish.spicy} veg={dish.veg} />
          </div>
          <Link
            href="/menu"
            aria-label={`${t("viewInMenu")}: ${dish.name}`}
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-fire text-brand-cream shadow-lg shadow-fire/30 transition duration-300 hover:rotate-90 hover:bg-fire-deep active:scale-95"
          >
            <Plus size={22} strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      {/* Dumaloq rasm — karta tepasidan chiqib turadi */}
      <div className="absolute left-1/2 top-0 size-44 -translate-x-1/2 rounded-full bg-paper p-1.5 shadow-xl shadow-fire/15 transition duration-700 ease-out-expo group-hover:-translate-y-3 group-hover:rotate-[10deg]">
        <SafeImg
          src={dish.img}
          alt={dish.name}
          className="size-full rounded-full"
          fallback={<PlateFallback char={dish.glyph} glyph="text-[3.4rem]" />}
        />
      </div>
    </article>
  );
}
