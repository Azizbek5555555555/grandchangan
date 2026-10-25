"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import DishCell from "@/components/site/menu/DishCell";
import { FillerCell } from "@/components/site/menu/Cells";
import { rowFill } from "@/components/site/menu/grid";
import type { HomeCategory } from "./types";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const HAN = /\p{Script=Han}/u;
const firstHan = (s: string | null) => (s ? Array.from(s).find((c) => HAN.test(c)) ?? "" : "");

/**
 * 6-bo'lim: MENYU (namuna 03 — menyu sahifasi bilan bir oila): oltin chiziqli qorong'i ramka,
 * chapda kategoriyalar paneli (xitoycha belgi + nom + soni; telefonda gorizontal chip'lar),
 * o'ngda tanlangan kategoriyaning taomlari tosh tagcha ustida, panjara katakchalarida.
 * Oxirgi qator doim to'la (keng katakcha yoki "Stol band qiling" katakchasi).
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
      // Katakcha chiziqlari joyida qoladi — faqat ichidagi kontent jonlanadi
      const inner = Array.from(el.querySelectorAll<HTMLElement>("[data-rv]"));
      const initial = prev.current === null || prev.current === activeId;
      prev.current = activeId;
      if (initial) {
        gsap.fromTo(inner, { opacity: 0, y: 40 }, {
          opacity: 1, y: 0, duration: 0.85, ease: "power3.out", stagger: 0.08, clearProps: "transform",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      } else {
        gsap.fromTo(inner, { opacity: 0, x: 36 }, { opacity: 1, x: 0, duration: 0.55, ease: "power3.out", stagger: 0.06, clearProps: "transform" });
        ScrollTrigger.refresh();
      }
    },
    { scope: gridRef, dependencies: [activeId] }
  );

  if (!active) return null;
  const fill = rowFill(active.dishes.length);

  return (
    <div className="mt-12 overflow-clip rounded-[1.75rem] border border-brand-gold/25 bg-night shadow-2xl shadow-night lg:mt-16 lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* ---------- Kategoriyalar paneli ---------- */}
      <div className="border-b border-brand-gold/15 bg-night-2 lg:border-b-0 lg:border-r">
        <p className="hidden items-center gap-3 border-b border-brand-gold/15 px-6 py-5 lg:flex">
          <span lang="zh" aria-hidden="true" className="font-cn shrink-0 whitespace-nowrap text-3xl leading-none text-brand-gold-light">菜单</span>
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cream/75">{t("menuCats")}</span>
        </p>
        <div
          role="group"
          aria-label={t("menuCats")}
          className="flex gap-2 overflow-x-auto px-3 py-3 [scrollbar-width:none] sm:px-4 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-4 lg:py-5"
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
                  "group relative flex min-h-11 shrink-0 items-center gap-3 rounded-full border px-4 text-left transition duration-300 lg:min-h-14 lg:rounded-xl lg:border-transparent lg:px-3",
                  on
                    ? "border-saffron/70 bg-fire-deep text-brand-cream lg:bg-night-3"
                    : "border-brand-gold/20 text-brand-cream/80 hover:border-brand-gold/40 hover:text-brand-cream lg:hover:bg-night-3/60"
                )}
              >
                <span aria-hidden="true" className={cn("absolute -left-4 bottom-2 top-2 hidden w-[3px] rounded-r-full transition lg:block", on ? "bg-saffron" : "bg-transparent")} />
                <span
                  lang="zh"
                  aria-hidden="true"
                  className={cn(
                    "font-cn flex shrink-0 items-center justify-center text-base leading-none lg:size-9 lg:rounded-full lg:border lg:text-lg",
                    on ? "text-saffron lg:border-saffron/60" : "text-brand-gold-light lg:border-brand-gold/20"
                  )}
                >
                  {firstHan(c.zh) || c.glyph || String(i + 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block whitespace-nowrap font-display text-[16px] leading-tight lg:whitespace-normal lg:text-[17px]">{c.name}</span>
                  {c.zh && <span lang="zh" aria-hidden="true" className="hidden text-xs text-brand-cream/60 lg:block">{c.zh}</span>}
                </span>
                <span className={cn("text-xs tabular-nums", on ? "text-saffron" : "text-brand-cream/60")}>
                  <span className="sr-only">{t("dishCount", { count: c.count })}: </span>
                  {c.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------- Taomlar ---------- */}
      <div className="flex min-w-0 flex-col">
        <div aria-live="polite" className="flex items-center gap-4 border-b border-brand-gold/15 px-5 py-4 sm:px-7">
          {active.zh && (
            <span lang="zh" aria-hidden="true" className="font-cn hidden size-12 shrink-0 items-center justify-center rounded-full border border-brand-gold/40 text-2xl leading-none text-brand-gold-light sm:flex">
              {firstHan(active.zh)}
            </span>
          )}
          <p className="min-w-0 flex-1 font-display text-2xl leading-tight text-brand-cream sm:text-3xl">
            {active.name}
            {active.zh && <span lang="zh" className="font-cn ml-3 text-lg text-brand-gold-light">{active.zh}</span>}
          </p>
          <p className="shrink-0 text-sm text-brand-cream/70">{t("dishCount", { count: active.count })}</p>
        </div>

        <div className="-mb-px flex-1">
          <div ref={gridRef} className="-mr-px grid h-full sm:grid-cols-2 xl:grid-cols-3">
            {active.dishes.map((d, i) => (
              <DishCell
                key={`${active.id}-${d.id}`}
                d={d}
                className={i === active.dishes.length - 1 ? fill.last : undefined}
                action={
                  <Link
                    href={`/menu#dish-${d.id}`}
                    aria-label={`${t("viewInMenu")}: ${d.name}`}
                    className="flex size-11 shrink-0 items-center justify-center rounded-full border border-brand-gold/30 text-brand-cream transition duration-300 hover:border-saffron hover:bg-saffron hover:text-brand-ink"
                  >
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </Link>
                }
              />
            ))}
            {fill.filler && <FillerCell key={`${active.id}-fill`} kind="reserve" className="hidden xl:flex" />}
          </div>
        </div>
      </div>
    </div>
  );
}
