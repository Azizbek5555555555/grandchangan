"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Link } from "@/i18n/navigation";
import ButtonLink from "@/components/site/kit/ButtonLink";
import { cn } from "@/lib/utils";
import { Price, SpicyVeg } from "./DishBadges";
import { Petal, SlatePlate } from "./SignatureArt";
import type { HomeDish } from "./types";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const two = (n: number) => String(n).padStart(2, "0");

/**
 * 2-bo'lim: MASHHUR TAOMLAR — krem fon ustidagi qora "taom taxtasi" (namuna 04 menu highlights,
 * 07 qora tarelkalar, 09 vertikal chiziqlar).
 * - 1–2 taom: katta "featured" tarqatma (tosh tagcha ustida tarelka) + yon panel
 *   (2-taom ustuni yoki "to'liq menyu" katagi) — taxta hech qachon bo'sh ko'rinmaydi;
 * - 3+ taom: vertikal ingichka chiziqli ustunlar (har birida ieroglif, nom, narx, pastga tushgan
 *   oltin chiziq va tarelka) + oxirida "to'liq menyu" katagi; 4 tadan ko'p katak — karusel.
 * Pastda — oldindan buyurtma / bron lentasi.
 */
export default function SignatureGrid({ dishes, menuCount }: { dishes: HomeDish[]; menuCount: number }) {
  const t = useTranslations("Home2");
  const st = useTranslations("Site");
  const th = useTranslations("Home");
  const root = useRef<HTMLDivElement | null>(null);
  const feature = dishes.length <= 2;

  useGSAP(
    () => {
      const el = root.current;
      if (!el || reduced()) return;
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 80%", once: true } });
      tl.from(el, { y: 60, opacity: 0, duration: 1, ease: "power3.out" })
        .from(el.querySelectorAll("[data-cell]"), { y: 50, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.09 }, 0.25)
        .from(el.querySelectorAll("[data-line]"), { scaleY: 0, transformOrigin: "50% 0%", duration: 1.1, ease: "power2.inOut", stagger: 0.09 }, 0.5)
        .from(el.querySelectorAll("[data-plate]"), { rotation: -40, scale: 0.8, opacity: 0, duration: 1.3, ease: "expo.out", stagger: 0.09 }, 0.55)
        .from(el.querySelectorAll("[data-slate]"), { rotation: -12, opacity: 0, duration: 1.2, ease: "power3.out", stagger: 0.09 }, 0.45)
        .from(el.querySelectorAll("[data-petal]"), { y: -80, x: 30, rotation: -90, opacity: 0, duration: 1.6, ease: "power2.out", stagger: 0.15 }, 0.6);
    },
    { scope: root }
  );

  const menuCell = <MenuCell count={menuCount} title={st("fullMenu")} sub={t("dishCount", { count: menuCount })} />;

  // Pastki lenta: oldindan buyurtma matni + (karuselda) strelkalar + bron tugmasi
  const footer = (controls?: React.ReactNode) => (
    <div className="flex flex-col gap-5 border-t border-brand-gold/15 bg-night-2/70 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10">
      <div className="flex items-center gap-4">
        <span aria-hidden="true" lang="zh" className="font-cn flex size-11 shrink-0 items-center justify-center rounded-[6px] border border-brand-cream/40 bg-fire text-xl leading-none text-brand-cream">
          订
        </span>
        <p className="max-w-md text-sm leading-relaxed text-brand-cream/75">{st("rPreorderDesc")}</p>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        {controls}
        <ButtonLink href="/reservation" variant="saffron" size="md" className="group shrink-0 px-7">
          {th("book_table")}
          <ArrowRight size={16} className="transition group-hover:translate-x-1" />
        </ButtonLink>
      </div>
    </div>
  );

  return (
    <div ref={root} className="relative mt-12 sm:mt-14">
      {/* Qizil gul barglari — taxta burchaklarida */}
      <Petal data-petal className="absolute -left-3 -top-5 z-10 w-14 rotate-[-18deg] sm:-left-6 sm:w-20" />
      <Petal data-petal className="absolute -right-2 top-[38%] z-10 hidden w-12 rotate-[140deg] sm:block" />
      <Petal data-petal className="absolute -bottom-4 right-[18%] z-10 w-10 rotate-[30deg] sm:w-14" />

      <div className="relative isolate overflow-hidden rounded-[28px] bg-night text-brand-cream shadow-2xl shadow-night/25 ring-1 ring-brand-gold/25 sm:rounded-[36px]">
        <span aria-hidden="true" className="lattice-bg absolute inset-0 -z-10 text-brand-gold/[0.035]" />
        <span aria-hidden="true" className="absolute -left-40 -top-40 -z-10 size-[28rem] rounded-full bg-fire-deep/20 blur-3xl" />

        {feature ? (
          <>
            <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.42fr)]">
              <FeatureStage dish={dishes[0]} index={1} />
              <div className="border-t border-brand-gold/15 lg:border-l lg:border-t-0">
                {dishes[1] ? <ColumnCell dish={dishes[1]} index={2} /> : menuCell}
              </div>
            </div>
            {footer()}
          </>
        ) : (
          <Columns dishes={dishes} menuCell={menuCell} prev={t("sigPrev")} next={t("sigNext")} label={`${st("dishesTitle1")} ${st("dishesTitle2")}`} footer={footer} />
        )}

      </div>
    </div>
  );
}

/* ---------------- Featured tarqatma (1–2 taom) ---------------- */

function FeatureStage({ dish, index }: { dish: HomeDish; index: number }) {
  const t = useTranslations("Home2");
  const st = useTranslations("Site");
  const chips = [
    dish.grams ? t("grams", { n: dish.grams }) : null,
    dish.mins ? t("minutes", { n: dish.mins }) : null,
    dish.halal ? st("halal") : null,
  ].filter(Boolean) as string[];

  return (
    <article data-cell className="group relative grid items-center gap-8 px-6 pb-10 pt-10 sm:px-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:py-14">
      {/* katta xira raqam */}
      <span aria-hidden="true" className="pointer-events-none absolute left-6 top-4 font-display text-[7rem] italic leading-none text-brand-gold/[0.08] sm:left-10 sm:text-[9rem]">
        {two(index)}
      </span>

      <div className="relative mx-auto w-full max-w-[420px]">
        <SlatePlate src={dish.img} alt={dish.name} glyph={dish.glyph} glyphSize="text-[5.5rem] sm:text-[7rem]" tilt={-9} eager />
        <Petal data-petal className="absolute bottom-[8%] left-[2%] w-12 rotate-[200deg]" />
      </div>

      <div className="relative min-w-0 md:pr-16">
        {/* vertikal xitoycha nom (namuna 10) */}
        {dish.zh && (
          <p aria-hidden="true" lang="zh" className="font-cn absolute right-0 top-0 hidden text-4xl leading-[1.1] text-brand-gold-light/85 [writing-mode:vertical-rl] md:block lg:text-5xl">
            {dish.zh}
          </p>
        )}
        <p className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-cream/70">
          <span className="font-display text-base normal-case italic tracking-normal text-saffron">{two(index)}</span>
          <span aria-hidden="true" className="h-px w-8 bg-brand-gold/50" />
          {dish.catName}
        </p>
        {dish.zh && (
          <p lang="zh" className="font-cn mt-4 text-3xl leading-none text-brand-gold-light md:hidden">{dish.zh}</p>
        )}
        <h3 className="mt-4 font-display text-[2.1rem] leading-[1.08] text-brand-cream sm:text-5xl">{dish.name}</h3>
        {dish.desc && <p className="mt-5 max-w-md text-[15px] leading-relaxed text-brand-cream/75">{dish.desc}</p>}

        {(chips.length > 0 || dish.spicy > 0 || dish.veg) && (
          <ul className="mt-6 flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <li key={c} className="rounded-full border border-brand-gold/30 px-3 py-1 text-xs font-medium tracking-wide text-brand-cream/80">{c}</li>
            ))}
            {(dish.spicy > 0 || dish.veg) && (
              <li className="rounded-full border border-brand-gold/30 px-3 py-1"><SpicyVeg spicy={dish.spicy} veg={dish.veg} tone="dark" /></li>
            )}
          </ul>
        )}

        <div aria-hidden="true" className="hairline-gold mt-8 max-w-md" />
        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-5">
          <Price price={dish.price} oldPrice={dish.oldPrice} className="font-display text-4xl text-saffron" oldClassName="text-brand-cream/60" />
          <ButtonLink href={`/menu/${dish.slug}`} variant="gold-outline" size="md" className="group">
            {t("viewInMenu")}
            <ArrowRight size={16} className="transition group-hover:translate-x-1" />
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

/* ---------------- Ustunlar (3+ taom) ---------------- */

function Columns({
  dishes, menuCell, prev, next, label, footer,
}: {
  dishes: HomeDish[];
  menuCell: React.ReactNode;
  prev: string;
  next: string;
  /** Karusel nomi (ekran o'quvchi uchun) */
  label: string;
  footer: (controls?: React.ReactNode) => React.ReactNode;
}) {
  const track = useRef<HTMLDivElement | null>(null);
  const [edge, setEdge] = useState({ start: true, end: true });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const go = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const cell = el.firstElementChild as HTMLElement | null;
    el.scrollBy({ left: dir * (cell?.offsetWidth ?? el.clientWidth), behavior: reduced() ? "auto" : "smooth" });
  };

  const scrollable = !(edge.start && edge.end);

  return (
    <div className="relative">
      <div
        ref={track}
        onScroll={measure}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {dishes.map((d, i) => (
          <div key={d.id} className={cn("w-[84%] shrink-0 snap-start border-brand-gold/15 sm:w-1/2 lg:w-1/4", i > 0 && "border-l")}>
            <ColumnCell dish={d} index={i + 1} />
          </div>
        ))}
        <div className="w-[84%] shrink-0 snap-start border-l border-brand-gold/15 sm:w-1/2 lg:w-1/4">{menuCell}</div>
      </div>

      {footer(
        scrollable ? (
          <div className="flex items-center gap-2">
            {([[-1, prev, ArrowLeft, edge.start], [1, next, ArrowRight, edge.end]] as const).map(([dir, label, Icon, off]) => (
              <button
                key={dir}
                type="button"
                aria-label={label}
                // disabled emas: chetga yetganda klaviatura fokusi <body> ga tushib ketmasin
                aria-disabled={off}
                onClick={() => { if (!off) go(dir); }}
                className="flex size-12 items-center justify-center rounded-full border border-brand-gold/50 text-brand-gold-light transition duration-300 hover:bg-brand-gold hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron aria-disabled:cursor-default aria-disabled:opacity-30 aria-disabled:hover:bg-transparent aria-disabled:hover:text-brand-gold-light"
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        ) : null
      )}
    </div>
  );
}

/** 09-uslubdagi ustun: ieroglif → nom → narx → tavsif → pastga tushgan chiziq → tarelka */
function ColumnCell({ dish, index }: { dish: HomeDish; index: number }) {
  const t = useTranslations("Home2");
  const mark = dish.zh ?? dish.glyph;
  return (
    <article data-cell className="group relative flex h-full flex-col px-6 pb-8 pt-8 text-center sm:px-7">
      <div className="flex items-center justify-between gap-3 text-left">
        <span className="font-display text-lg italic text-saffron">{two(index)}</span>
        <span className="truncate text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-cream/65">{dish.catName}</span>
      </div>

      <p aria-hidden="true" lang="zh" className={cn("font-cn mt-6 leading-none text-brand-gold-light", Array.from(mark).length > 3 ? "text-3xl" : "text-4xl")}>
        {mark}
      </p>
      <h3 className="mt-3 line-clamp-2 min-h-[2.5em] font-display text-[1.45rem] leading-[1.15] text-brand-cream">{dish.name}</h3>
      <div aria-hidden="true" className="hairline-gold mx-auto my-4 w-3/4" />
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <Price price={dish.price} oldPrice={dish.oldPrice} className="font-display text-2xl text-saffron" oldClassName="text-brand-cream/60" />
        <SpicyVeg spicy={dish.spicy} veg={dish.veg} tone="dark" />
      </div>
      {dish.desc && <p className="mx-auto mt-3 line-clamp-3 max-w-[26ch] text-[13px] leading-relaxed text-brand-cream/65">{dish.desc}</p>}

      {/* pastga tushgan oltin chiziq (namuna 09) */}
      <span data-line aria-hidden="true" className="mx-auto mt-5 block min-h-10 w-px flex-1 bg-gradient-to-b from-brand-gold/60 via-brand-gold/30 to-transparent" />

      <div className="relative mx-auto -mt-1 w-[82%] max-w-[250px]">
        <SlatePlate src={dish.img} alt={dish.name} glyph={dish.glyph} glyphSize="text-5xl" tilt={index % 2 ? 7 : -7} />
        <Link
          href={`/menu/${dish.slug}`}
          aria-label={`${t("viewInMenu")}: ${dish.name}`}
          className="absolute -bottom-1 right-0 flex size-12 items-center justify-center rounded-full bg-fire text-brand-cream shadow-lg shadow-night ring-1 ring-brand-cream/20 transition duration-300 hover:rotate-90 hover:bg-fire-deep active:scale-95"
        >
          <Plus size={20} strokeWidth={2.4} />
        </Link>
      </div>
    </article>
  );
}

/** "To'liq menyu" katagi — bo'sh joyni nafis CTA bilan to'ldiradi */
function MenuCell({ count, title, sub }: { count: number; title: string; sub: string }) {
  return (
    <Link
      href="/menu"
      data-cell
      className="group relative flex h-full min-h-[340px] flex-col items-center justify-center gap-6 lg:min-h-[420px] overflow-hidden px-6 py-12 text-center focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-saffron"
    >
      <span aria-hidden="true" className="absolute inset-0 -z-10 bg-wine/40 opacity-0 transition duration-500 group-hover:opacity-100 group-focus-visible:opacity-100" />
      {/* oy-darvoza ichida vertikal 菜单 */}
      <span aria-hidden="true" className="relative flex h-44 w-28 items-center justify-center rounded-t-full sm:h-56 sm:w-32 border border-brand-gold/45 transition duration-700 ease-out-expo group-hover:-translate-y-1">
        <span className="absolute inset-2 rounded-t-full border border-dashed border-brand-gold/20" />
        <span lang="zh" className="font-cn text-5xl leading-[1.05] text-brand-gold-light [writing-mode:vertical-rl] sm:text-6xl">菜单</span>
      </span>
      <span className="block">
        <span className="block font-display text-3xl text-brand-cream">{title}</span>
        {count > 0 && <span className="mt-2 block text-xs font-semibold uppercase tracking-[0.22em] text-brand-cream/70">{sub}</span>}
      </span>
      <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full border border-brand-gold/60 text-brand-gold-light transition duration-300 group-hover:bg-brand-gold group-hover:text-brand-ink">
        <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
