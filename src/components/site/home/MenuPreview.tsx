"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import SafeImg from "./SafeImg";
import { GlyphPanel } from "./Decor";
import { Price, SpicyVeg } from "./DishBadges";
import type { HomeCategory } from "./types";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * 6-bo'lim: MENYU (namuna 2): chapda kategoriyalar ro'yxati (taomlar soni bilan), o'ngda tanlangan
 * kategoriyaning taomlari. Kategoriya almashganda kartalar silliq almashadi.
 * Ma'lumot serverda tayyorlanadi (har kategoriyadan 6 tagacha mavjud taom).
 */
export default function MenuPreview({ cats }: { cats: HomeCategory[] }) {
  const t = useTranslations("Home2");
  const [activeId, setActiveId] = useState(cats[0]?.id ?? "");
  const gridRef = useRef<HTMLDivElement | null>(null);
  const prev = useRef<string | null>(null);
  const active = cats.find((c) => c.id === activeId) ?? cats[0];

  useGSAP(
    () => {
      const el = gridRef.current;
      if (!el || reduced()) return;
      const cards = Array.from(el.children) as HTMLElement[];
      const initial = prev.current === null || prev.current === activeId;
      prev.current = activeId;
      if (initial) {
        gsap.fromTo(cards, { opacity: 0, y: 50 }, {
          opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      } else {
        gsap.fromTo(cards, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.55, ease: "power3.out", stagger: 0.06 });
        ScrollTrigger.refresh();
      }
    },
    { scope: gridRef, dependencies: [activeId] }
  );

  if (!active) return null;

  return (
    <div className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12">
      {/* ---------- Kategoriyalar ---------- */}
      <div
        role="group"
        aria-label={t("menuCats")}
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0"
      >
        {cats.map((c, i) => {
          const on = c.id === active.id;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => setActiveId(c.id)}
              className={cn(
                "group flex min-h-12 shrink-0 items-center gap-3 rounded-full border px-5 text-left transition duration-300 lg:min-h-14 lg:rounded-2xl lg:border-transparent",
                on
                  ? "border-fire bg-fire text-brand-cream shadow-lg shadow-fire/20"
                  : "border-brand-cream/15 text-brand-cream/80 hover:border-brand-cream/30 hover:bg-night-3 hover:text-brand-cream"
              )}
            >
              <span aria-hidden="true" className={cn("hidden w-6 font-poster text-xs lg:inline", on ? "text-saffron" : "text-brand-cream/35")}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex min-w-0 flex-1 items-baseline gap-2">
                <span className="truncate font-display text-[17px] font-medium lg:text-lg">{c.name}</span>
                {c.zh && (
                  <span lang="zh" aria-hidden="true" className={cn("font-cn hidden text-base leading-none sm:inline", on ? "text-saffron" : "text-saffron/70")}>
                    {c.zh}
                  </span>
                )}
              </span>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", on ? "bg-fire-deep text-brand-cream" : "bg-night-3 text-brand-cream/60")}>
                <span className="sr-only">{t("dishCount", { count: c.count })}: </span>
                {c.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ---------- Taomlar ---------- */}
      <div className="min-w-0">
        <div aria-live="polite" className="mb-6 flex items-baseline justify-between gap-4 border-b border-brand-cream/10 pb-4">
          <p className="font-display text-2xl text-brand-cream sm:text-3xl">
            {active.name}
            {active.zh && <span lang="zh" className="font-cn ml-3 text-xl text-saffron">{active.zh}</span>}
          </p>
          <p className="shrink-0 text-sm text-brand-cream/60">{t("dishCount", { count: active.count })}</p>
        </div>

        <div ref={gridRef} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {active.dishes.map((d) => (
            <article
              key={`${active.id}-${d.id}`}
              className="group flex flex-col rounded-[24px] border border-brand-cream/10 bg-night-2 p-3 transition-[border-color,background-color] duration-300 hover:border-saffron/40 hover:bg-night-3"
            >
              <SafeImg
                src={d.img}
                alt={d.name}
                className="aspect-[4/3] w-full rounded-2xl"
                imgClassName="transition duration-700 group-hover:scale-110"
                fallback={<GlyphPanel char={d.glyph} tone={d.veg ? "wine" : "night"} className="rounded-2xl" size="text-[4.5rem]" />}
              />
              <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 font-display text-xl font-semibold leading-snug text-brand-cream">{d.name}</h3>
                  <SpicyVeg spicy={d.spicy} veg={d.veg} tone="dark" className="mt-1.5 shrink-0" />
                </div>
                {d.zh && <p lang="zh" className="font-cn mt-1 text-lg leading-none text-saffron/80">{d.zh}</p>}
                {d.desc && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-brand-cream/65">{d.desc}</p>}
                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <Price price={d.price} oldPrice={d.oldPrice} className="text-lg font-bold text-saffron" oldClassName="text-brand-cream/50" />
                  <Link
                    href="/menu"
                    aria-label={`${t("viewInMenu")}: ${d.name}`}
                    className="flex size-11 shrink-0 items-center justify-center rounded-full border border-brand-cream/20 text-brand-cream transition duration-300 hover:border-saffron hover:bg-saffron hover:text-brand-ink"
                  >
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
