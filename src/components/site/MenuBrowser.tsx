"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Clock, Flame, Leaf, Scale, Search, X } from "lucide-react";
import { cn, t, formatMoney, type Localized } from "@/lib/utils";
import DishFallback from "@/components/site/kit/DishFallback";
import Reveal from "@/components/motion/Reveal";
import RevealGroup from "@/components/motion/RevealGroup";
import SafeImg from "@/components/site/pages/SafeImg";
import { CloudLine } from "@/components/site/pages/Ornament";

type Cat = { id: string; name: unknown; slug: string };
type Item = {
  id: string; categoryId: string; name: unknown; description?: unknown;
  price: number; discountPrice?: number | null; imageUrl?: string | null;
  spicyLevel: string; isVegetarian: boolean; isHalal: boolean; isNew: boolean;
  isFeatured?: boolean; weightGrams?: number | null; prepTimeMin?: number | null;
};

const spicyDots = (level: string) => {
  const map: Record<string, number> = { NONE: 0, MILD: 1, MEDIUM: 2, HOT: 3, EXTRA_HOT: 4 };
  return map[level] || 0;
};
/** JSON nomdan xitoycha variant (bezak uchun) */
const zhOf = (v: unknown) => (v && typeof v === "object" ? (v as Localized).zh?.trim() || "" : "");
const OTHER = "__other";

/**
 * Menyu: chapda yopishqoq kategoriyalar ro'yxati (scroll bo'yicha faol), o'ngda kategoriya
 * bo'limlari va dumaloq rasmli taom kartalari. Telefonda — gorizontal yopishqoq chip'lar.
 * Qidiruv va "faqat vegetarian" filtri saqlangan.
 */
export default function MenuBrowser({
  categories, items, locale,
}: { categories: Cat[]; items: Item[]; locale: string }) {
  const T = useTranslations("Site");
  const P = useTranslations("Pages2");
  const [q, setQ] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const chipsRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((i) => {
      if (vegOnly && !i.isVegetarian) return false;
      if (needle) {
        // Joriy tildagi nom, xitoycha nom va tavsif bo'yicha (turistlar o'z tilida qidiradi)
        const hay = [t(i.name, locale), zhOf(i.name), t(i.description, locale)].join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [items, vegOnly, q, locale]);

  // Kategoriya bo'limlari (bo'shlari yashiriladi). Faol bo'lmagan kategoriyadagi taomlar — "Boshqa"
  const groups = useMemo(() => {
    const known = new Set(categories.map((c) => c.id));
    const out = categories
      .map((c) => ({ id: c.id, name: t(c.name, locale), zh: zhOf(c.name), items: filtered.filter((i) => i.categoryId === c.id) }))
      .filter((g) => g.items.length > 0);
    const rest = filtered.filter((i) => !known.has(i.categoryId));
    if (rest.length) out.push({ id: OTHER, name: P("otherDishes"), zh: "", items: rest });
    return out;
  }, [categories, filtered, locale, P]);

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const featured = useMemo(() => items.filter((i) => i.isFeatured).slice(0, 8), [items]);
  const filtering = q.trim() !== "" || vegOnly;
  const current = active && groups.some((g) => g.id === active) ? active : groups[0]?.id ?? null;

  // Scroll bo'yicha faol kategoriya (ekran yuqori uchdan biri atrofidagi bo'lim)
  useEffect(() => {
    const els = groups.map((g) => document.getElementById(`cat-${g.id}`)).filter(Boolean) as HTMLElement[];
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id.slice(4));
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [groups]);

  // Filtrdan keyin sahifa balandligi o'zgaradi — GSAP trigger'lari qayta hisoblanadi
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [q, vegOnly]);

  // Telefondagi chip'lar qatorida faol chip ko'rinib tursin (faqat gorizontal aylantiramiz)
  useEffect(() => {
    const bar = chipsRef.current;
    const chip = bar?.querySelector<HTMLElement>(`[data-chip="${current}"]`);
    if (!bar || !chip) return;
    bar.scrollTo({ left: chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2, behavior: "smooth" });
  }, [current]);

  const scrollToId = useCallback((elId: string, offsetExtra = 0) => {
    const el = document.getElementById(elId);
    if (!el) return;
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Yopishqoq header (+ telefonda chip'lar qatori) ostida to'xtasin
    const offset = (desktop ? 120 : 150) + offsetExtra;
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, y), behavior: reduce ? "auto" : "smooth" });
  }, []);

  function goCat(id: string) {
    setActive(id);
    scrollToId(`cat-${id}`);
  }

  function goDish(id: string) {
    setQ("");
    setVegOnly(false);
    // Filtr olib tashlangach karta joyiga tushsin
    requestAnimationFrame(() => {
      scrollToId(`dish-${id}`, 40);
      setFlash(id);
      window.setTimeout(() => setFlash((f) => (f === id ? null : f)), 2200);
    });
  }

  const reset = () => { setQ(""); setVegOnly(false); };

  return (
    <div className="relative bg-paper">
      {/* ---- Oshpaz tavsiyasi (TOP belgilangan taomlar) ---- */}
      {featured.length > 0 && (
        <section aria-labelledby="menu-featured" className="relative mx-auto max-w-7xl px-5 pb-6 pt-14 sm:px-8 sm:pt-20">
          <Reveal y={16}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="flex items-center gap-3">
                  <span lang="zh" className="font-cn text-3xl leading-none text-fire">招牌菜</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">{T("dishesEyebrow")}</span>
                </p>
                <h2 id="menu-featured" className="mt-2 font-display text-4xl leading-[1.05] text-content sm:text-5xl">
                  {T("dishesTitle1")} <span className="italic text-fire">{T("dishesTitle2")}</span>
                </h2>
              </div>
              <CloudLine className="hidden w-44 text-fire/40 sm:block" />
            </div>
          </Reveal>
          <RevealGroup
            className="-mx-5 mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 pt-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-x-8 sm:gap-y-6 sm:overflow-visible sm:px-0"
            stagger={0.08}
            y={30}
          >
            {featured.map((it, i) => (
              <button
                key={it.id}
                type="button"
                onClick={() => goDish(it.id)}
                className="group flex w-44 shrink-0 snap-start flex-col items-center text-center outline-none sm:w-52"
              >
                <span
                  className={cn(
                    "relative block aspect-square w-40 overflow-hidden rounded-full bg-sand shadow-xl shadow-fire/15 ring-[6px] ring-card transition duration-700 group-hover:-rotate-6 group-hover:scale-[1.04] group-focus-visible:ring-fire sm:w-44 lg:w-48",
                    i % 2 === 1 && "sm:mt-8"
                  )}
                >
                  <SafeImg
                    src={it.imageUrl}
                    alt={t(it.name, locale)}
                    className="h-full w-full object-cover"
                    fallback={<DishFallback char={zhOf(it.name).charAt(0) || "菜"} />}
                  />
                </span>
                <span className="mt-4 font-display text-lg leading-tight text-content transition group-hover:text-fire">{t(it.name, locale)}</span>
                {locale !== "zh" && zhOf(it.name) && <span lang="zh" className="font-cn text-base text-fire/70">{zhOf(it.name)}</span>}
                <span className="mt-1 text-sm font-bold tabular-nums text-fire">{formatMoney(it.discountPrice ?? it.price)}</span>
              </button>
            ))}
          </RevealGroup>
        </section>
      )}

      {/* ---- Qidiruv va filtr ---- */}
      <div className="mx-auto max-w-7xl px-5 pt-8 sm:px-8">
        <Reveal y={14}>
          <div className="flex flex-col gap-3 rounded-[1.75rem] bg-card p-3 shadow-lg shadow-night/5 ring-1 ring-line sm:flex-row sm:items-center sm:p-4">
            <label className="relative flex-1">
              <span className="sr-only">{T("menuSearch")}</span>
              <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={T("menuSearch")}
                enterKeyHint="search"
                className="h-12 w-full rounded-full border border-line bg-paper pl-11 pr-11 text-base text-content outline-none transition placeholder:text-muted focus:border-fire focus:ring-4 focus:ring-fire/15 [&::-webkit-search-cancel-button]:hidden"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  aria-label={P("clearSearch")}
                  className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:bg-sand hover:text-content"
                >
                  <X size={16} />
                </button>
              )}
            </label>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={vegOnly}
                onClick={() => setVegOnly((v) => !v)}
                className={cn(
                  "inline-flex h-12 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition",
                  vegOnly ? "border-jade bg-jade text-brand-cream" : "border-line bg-paper text-content hover:border-jade"
                )}
              >
                <span className={cn("relative h-5 w-9 rounded-full transition", vegOnly ? "bg-brand-cream/30" : "bg-sand")}>
                  <span className={cn("absolute top-0.5 h-4 w-4 rounded-full transition-all", vegOnly ? "left-[18px] bg-brand-cream" : "left-0.5 bg-jade")} />
                </span>
                <Leaf size={15} aria-hidden="true" /> {T("menuVegOnly")}
              </button>
              <p className="min-w-0 truncate px-2 text-sm text-muted" aria-live="polite">
                {P("dishCount", { count: filtered.length })}
              </p>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ---- Telefon/planshet: yopishqoq gorizontal kategoriyalar ---- */}
      {groups.length > 1 && (
        <div className="sticky top-16 z-30 mt-6 border-y border-line bg-paper lg:hidden">
          <div ref={chipsRef} className="flex gap-2 overflow-x-auto px-5 py-2.5 [scrollbar-width:none] sm:px-8">
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                data-chip={g.id}
                aria-current={current === g.id ? "true" : undefined}
                onClick={() => goCat(g.id)}
                className={cn(
                  "inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition",
                  current === g.id ? "bg-fire text-brand-cream shadow-md shadow-fire/25" : "bg-card text-content ring-1 ring-line"
                )}
              >
                {g.zh && <span lang="zh" className={cn("font-cn text-base leading-none", current === g.id ? "text-saffron" : "text-fire")}>{g.zh.charAt(0)}</span>}
                {g.name}
                <span className={cn("text-xs tabular-nums", current === g.id ? "text-brand-cream/75" : "text-muted")}>{g.items.length}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-5 pb-24 pt-8 sm:px-8 lg:grid lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-14 lg:pb-32 lg:pt-14">
        {/* ---- Kompyuter: chapda yopishqoq kategoriyalar ro'yxati ---- */}
        <aside className="hidden lg:block">
          <nav aria-label={P("categories")} className="sticky top-28">
            <p className="mb-4 flex items-baseline gap-3 px-3">
              <span lang="zh" className="font-cn shrink-0 whitespace-nowrap text-4xl leading-none text-fire">菜单</span>
              <span className="truncate text-xs font-semibold uppercase tracking-[0.24em] text-muted">{P("categories")}</span>
            </p>
            <ul className="space-y-1 border-l border-line">
              {groups.map((g) => {
                const on = current === g.id;
                return (
                  <li key={g.id} className="relative">
                    <span aria-hidden="true" className={cn("absolute -left-px top-2 bottom-2 w-[3px] rounded-full transition-all duration-500", on ? "bg-fire" : "bg-transparent")} />
                    <button
                      type="button"
                      onClick={() => goCat(g.id)}
                      aria-current={on ? "true" : undefined}
                      className={cn(
                        "group ml-3 flex min-h-11 w-[calc(100%-0.75rem)] items-center gap-3 rounded-2xl px-3 py-2 text-left transition",
                        on ? "bg-card text-fire shadow-md shadow-night/5" : "text-content hover:bg-card/70"
                      )}
                    >
                      <span lang="zh" className={cn("font-cn w-7 shrink-0 text-center text-xl leading-none transition", on ? "text-fire" : "text-fire/45 group-hover:text-fire/80")}>
                        {g.zh ? g.zh.charAt(0) : "·"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-[17px]">{g.name}</span>
                        {g.zh && locale !== "zh" && <span lang="zh" className="block text-xs text-muted">{g.zh}</span>}
                      </span>
                      <span className={cn("text-xs tabular-nums", on ? "text-fire" : "text-muted")}>{g.items.length}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* ---- Kategoriya bo'limlari ---- */}
        <div className="min-w-0">
          {groups.map((g, gi) => (
            <section key={g.id} id={`cat-${g.id}`} aria-labelledby={`cat-h-${g.id}`} className={cn(gi > 0 && "mt-16 sm:mt-24")}>
              <Reveal y={20}>
                <div className="relative flex items-end gap-4 border-b border-line pb-4">
                  {g.zh && (
                    <span lang="zh" aria-hidden="true" className="font-cn text-5xl leading-none text-fire sm:text-6xl">
                      {g.zh}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 id={`cat-h-${g.id}`} className="font-display text-3xl leading-[1.08] text-content sm:text-4xl">{g.name}</h2>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">{P("dishCount", { count: g.items.length })}</p>
                  </div>
                  <span aria-hidden="true" className="absolute -bottom-px left-0 h-[3px] w-16 rounded-full bg-fire" />
                </div>
              </Reveal>
              <RevealGroup className="mt-6 grid grid-cols-1 gap-4 sm:mt-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-2 xl:grid-cols-3" stagger={0.07} y={34}>
                {g.items.map((it) => (
                  <DishCard
                    key={it.id}
                    it={it}
                    locale={locale}
                    flash={flash === it.id}
                    catZh={zhOf(catById.get(it.categoryId)?.name)}
                  />
                ))}
              </RevealGroup>
            </section>
          ))}

          {filtered.length === 0 && (
            <div className="mx-auto max-w-md rounded-[2rem] bg-card p-8 text-center ring-1 ring-line">
              <div className="mx-auto h-28 w-28 overflow-hidden rounded-full">
                <DishFallback char="无" />
              </div>
              <p className="mt-5 font-display text-2xl text-content">{T("menuNothing")}</p>
              {filtering && (
                <button
                  type="button"
                  onClick={reset}
                  className="mt-5 inline-flex h-12 items-center justify-center rounded-full bg-fire px-6 text-sm font-semibold text-brand-cream transition hover:bg-fire-deep"
                >
                  {P("resetFilters")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DishCard({ it, locale, flash, catZh }: { it: Item; locale: string; flash: boolean; catZh: string }) {
  const T = useTranslations("Site");
  const P = useTranslations("Pages2");
  const name = t(it.name, locale);
  const zh = zhOf(it.name);
  const desc = t(it.description, locale);
  const spicy = spicyDots(it.spicyLevel);
  const hasDiscount = it.discountPrice != null && it.discountPrice < it.price;

  return (
    <article
      id={`dish-${it.id}`}
      className={cn(
        "group relative flex gap-4 rounded-[1.75rem] bg-card p-4 shadow-lg shadow-night/5 ring-1 ring-line transition duration-500",
        "hover:-translate-y-1 hover:shadow-2xl hover:shadow-fire/10 hover:ring-fire/30",
        "sm:mt-16 sm:flex-col sm:gap-0 sm:px-6 sm:pb-6 sm:pt-24 sm:text-center",
        flash && "ring-2 ring-fire"
      )}
    >
      {/* Dumaloq rasm — kompyuterda karta tepasidan chiqib turadi (namuna 1) */}
      <div
        className={cn(
          "relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-sand shadow-lg shadow-night/15 ring-4 ring-paper transition duration-700",
          "group-hover:rotate-6 sm:absolute sm:-top-16 sm:left-1/2 sm:h-36 sm:w-36 sm:-translate-x-1/2 sm:ring-[6px] sm:group-hover:scale-105"
        )}
      >
        <SafeImg
          src={it.imageUrl}
          alt={name}
          className="h-full w-full object-cover"
          fallback={<DishFallback char={zh.charAt(0) || catZh.charAt(0) || "菜"} />}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {(it.isNew || it.isFeatured) && (
          <div className="mb-1.5 flex flex-wrap gap-1.5 sm:justify-center">
            {it.isNew && <span className="rounded-full bg-saffron px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-ink">{T("badgeNew")}</span>}
            {it.isFeatured && <span className="rounded-full bg-fire px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-cream">{P("chefPick")}</span>}
          </div>
        )}
        <h3 className="font-display text-xl leading-tight text-content">{name}</h3>
        {zh && locale !== "zh" && <p lang="zh" className="font-cn mt-0.5 text-lg leading-tight text-fire/75">{zh}</p>}
        {desc && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{desc}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted sm:justify-center">
          {it.weightGrams ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1"><Scale size={12} aria-hidden="true" /> {P("grams", { n: it.weightGrams })}</span>
          ) : null}
          {it.prepTimeMin ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1"><Clock size={12} aria-hidden="true" /> {P("minutes", { n: it.prepTimeMin })}</span>
          ) : null}
          {spicy > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-fire/10 px-2 py-1 text-fire" title={P("spicy", { n: spicy })} aria-label={P("spicy", { n: spicy })}>
              {Array.from({ length: spicy }).map((_, i) => <Flame key={i} size={12} aria-hidden="true" className="fill-current" />)}
            </span>
          )}
          {it.isVegetarian && (
            <span className="inline-flex items-center gap-1 rounded-full bg-jade px-2.5 py-1 font-medium text-brand-cream"><Leaf size={12} aria-hidden="true" /> {P("veg")}</span>
          )}
          {it.isHalal && <span className="rounded-full px-2.5 py-1 ring-1 ring-line">{T("halal")}</span>}
        </div>

        <div className="mt-auto flex items-baseline gap-2 pt-4 sm:justify-center">
          <span className="text-lg font-bold tabular-nums text-fire sm:text-xl">{formatMoney(hasDiscount ? it.discountPrice! : it.price)}</span>
          {hasDiscount && <s className="text-sm tabular-nums text-muted">{formatMoney(it.price)}</s>}
        </div>
      </div>
    </article>
  );
}
