"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Leaf, Search, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn, t, currencyOf, formatMoney, hasPrice, type Localized } from "@/lib/utils";
import Reveal from "@/components/motion/Reveal";
import SectionHead from "@/components/site/kit/SectionHead";
import Wave from "@/components/site/kit/Wave";
import { usable } from "@/components/site/home/data";
import { PorcelainPlate } from "@/components/site/home/ShowcaseArt";
import DishCell, { type CellDish } from "@/components/site/menu/DishCell";
import { FillerCell, type FillKind } from "@/components/site/menu/Cells";
import { rowFill } from "@/components/site/menu/grid";
import { PlatedDish } from "@/components/site/menu/Plated";
import { useCellReveal } from "@/components/site/menu/useCellReveal";

type Cat = { id: string; name: unknown; slug: string };
type Item = {
  id: string; slug: string; categoryId: string; name: unknown; description?: unknown;
  price: number; discountPrice?: number | null; imageUrl?: string | null;
  spicyLevel: string; isVegetarian: boolean; isHalal: boolean; isNew: boolean;
  isFeatured?: boolean; weightGrams?: number | null; prepTimeMin?: number | null;
};

const SPICY: Record<string, number> = { NONE: 0, MILD: 1, MEDIUM: 2, HOT: 3, EXTRA_HOT: 4 };
const HAN = /\p{Script=Han}/u;
/** JSON nomdan xitoycha variant (bezak uchun) */
const zhOf = (v: unknown) => (v && typeof v === "object" ? (v as Localized).zh?.trim() || "" : "");
const firstHan = (s: string) => Array.from(s).find((c) => HAN.test(c)) ?? "";
const OTHER = "__other";
/** Bo'sh kataklar o'rnidagi bezaklar navbat bilan almashadi */
const FILLS: FillKind[] = ["reserve", "motto"];

/**
 * Menyu (namuna 03): qorong'i "tungi saroy" foni, oltin chiziqli ramka. Yuqorida qidiruv/filtr qatori,
 * chapda yopishqoq kategoriyalar paneli (scroll bo'yicha faol), o'ngda har bir kategoriya — panjara:
 * birinchi katakcha kategoriya sarlavhasi, keyin tosh tagcha ustidagi taomlar. Oxirgi qator doim to'la
 * (keng katakcha yoki bezak katakcha). Telefonda — gorizontal yopishqoq chip'lar.
 * Pastda "Halal / Oldindan buyurtma / Choy" lentasi.
 */
export default function MenuBrowser({
  categories, items, locale, showFeatured = true, waveTo,
}: {
  categories: Cat[];
  items: Item[];
  locale: string;
  /** false — tepadagi "招牌菜" qatori chiqmaydi (sahifada alohida blok bor) */
  showFeatured?: boolean;
  /** Keyingi bo'lim boshqa rangda bo'lsa — pastdagi to'lqin rangi (masalan "text-paper") */
  waveTo?: string;
}) {
  const T = useTranslations("Site");
  const P = useTranslations("Pages2");
  const M = useTranslations("Menu2");
  const [q, setQ] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const chipsRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  useCellReveal(rootRef);

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const toCell = useCallback(
    (it: Item): CellDish => {
      const zh = zhOf(it.name);
      const disc = it.discountPrice;
      const hasDisc = disc != null && disc > 0 && disc < it.price;
      return {
        id: it.id,
        slug: it.slug,
        name: t(it.name, locale),
        zh: locale === "zh" ? null : zh || null,
        desc: t(it.description, locale),
        price: hasDisc ? disc! : it.price,
        oldPrice: hasDisc ? it.price : null,
        img: usable(it.imageUrl),
        glyph: firstHan(zh) || firstHan(zhOf(catById.get(it.categoryId)?.name)) || "菜",
        spicy: SPICY[it.spicyLevel] ?? 0,
        veg: it.isVegetarian,
        halal: it.isHalal,
        grams: it.weightGrams ?? null,
        mins: it.prepTimeMin ?? null,
        isNew: it.isNew,
        featured: !!it.isFeatured,
      };
    },
    [locale, catById]
  );

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
      .map((c) => ({ id: c.id, slug: c.slug, name: t(c.name, locale), zh: zhOf(c.name), items: filtered.filter((i) => i.categoryId === c.id) }))
      .filter((g) => g.items.length > 0);
    const rest = filtered.filter((i) => !known.has(i.categoryId));
    if (rest.length) out.push({ id: OTHER, slug: OTHER, name: P("otherDishes"), zh: "", items: rest });
    return out;
  }, [categories, filtered, locale, P]);

  const featured = useMemo(() => items.filter((i) => i.isFeatured).slice(0, 8), [items]);
  const filtering = q.trim() !== "" || vegOnly;
  const current = active && groups.some((g) => g.id === active) ? active : groups[0]?.id ?? null;
  const teaGroup = groups.find((g) => g.slug === "tea") ?? groups.find((g) => g.slug === "drinks");

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
    const offset = (desktop ? 100 : 140) + offsetExtra;
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    // Lenis yoqilgan bo'lsa — u orqali (aks holda native smooth scroll Lenis bilan to'qnashadi)
    const lenis = (window as unknown as { __lenis?: { scrollTo: (t: number, o?: { duration?: number; immediate?: boolean }) => void } }).__lenis;
    if (lenis) lenis.scrollTo(Math.max(0, y), { duration: 1.1, immediate: reduce });
    else window.scrollTo({ top: Math.max(0, y), behavior: reduce ? "auto" : "smooth" });
  }, []);

  function goCat(id: string) {
    setActive(id);
    scrollToId(`cat-${id}`);
  }

  const reset = () => { setQ(""); setVegOnly(false); };
  let fillN = 0;

  return (
    <section
      ref={rootRef}
      aria-label={T("fullMenu")}
      className={cn("relative isolate overflow-x-clip bg-night text-brand-cream", waveTo ? "pb-28 sm:pb-36" : "pb-20 sm:pb-28")}
    >
      <span aria-hidden="true" className="hairline-gold absolute inset-x-[8%] top-0" />
      <span aria-hidden="true" className="lattice-bg pointer-events-none absolute inset-0 -z-10 text-brand-gold/[0.035]" />
      <span aria-hidden="true" className="pointer-events-none absolute -left-40 top-40 -z-10 size-[34rem] rounded-full bg-fire-deep/20 blur-[110px]" />
      <span aria-hidden="true" className="pointer-events-none absolute -right-40 bottom-40 -z-10 size-[30rem] rounded-full bg-brand-gold/[0.06] blur-[110px]" />

      <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-8 sm:pt-24">
        {/* ---- Sarlavha ---- */}
        <div className="flex flex-col gap-6 px-1 sm:flex-row sm:items-end sm:justify-between sm:px-0">
          <SectionHead tone="dark" font="serif" cn="菜单" eyebrow={T("fullMenu")} title={M("browseTitle")} accent={M("browseAccent")} />
          <Link
            href="/reservation"
            className="group inline-flex min-h-11 items-center gap-3 self-start text-sm font-semibold text-brand-gold-light transition hover:text-saffron sm:self-auto sm:pb-3"
          >
            <span aria-hidden="true" className="h-px w-10 bg-brand-gold/50 transition-all group-hover:w-14" />
            {M("order")}
            <ArrowRight size={16} aria-hidden="true" className="transition group-hover:translate-x-1" />
          </Link>
        </div>

        {/* ---- Oshpaz tavsiyasi (TOP taomlar) — sahifada alohida blok bo'lmasa ---- */}
        {showFeatured && featured.length > 0 && (
          <div className="mt-12">
            <Reveal y={16}>
              <p className="flex items-center gap-3 px-1">
                <span lang="zh" className="font-cn text-2xl leading-none text-saffron">招牌菜</span>
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cream/75">{T("dishesEyebrow")}</span>
                <span aria-hidden="true" className="h-px flex-1 bg-brand-gold/20" />
              </p>
            </Reveal>
            <div className="-mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-6 sm:overflow-visible sm:px-0">
              {featured.map((it) => {
                const d = toCell(it);
                return (
                  <Link
                    key={it.id}
                    href={`/menu/${it.slug}`}
                    className="group flex w-44 shrink-0 snap-start flex-col items-center rounded-2xl p-2 text-center outline-none transition hover:bg-night-2 focus-visible:ring-2 focus-visible:ring-saffron sm:w-52"
                  >
                    <PlatedDish img={d.img} alt="" glyph={d.glyph} variant="lacquer" glyphClass="text-5xl" />
                    <span className="mt-3 font-display text-lg leading-tight text-brand-cream transition group-hover:text-saffron">{d.name}</span>
                    {d.zh && <span lang="zh" className="font-cn text-base text-brand-gold-light">{d.zh}</span>}
                    {hasPrice(d.price) && <span className="mt-1 text-sm font-semibold tabular-nums text-saffron">{formatMoney(d.price, currencyOf(locale))}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- Oltin ramka ---- */}
        <div className="mt-10 overflow-clip rounded-[1.75rem] border border-brand-gold/25 bg-night shadow-2xl shadow-night sm:mt-14 lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Qidiruv va filtr */}
          <div className="flex flex-col gap-3 border-b border-brand-gold/15 bg-night-2 p-3 sm:flex-row sm:items-center sm:p-4 lg:col-span-2">
            <p className="hidden shrink-0 items-center gap-3 pl-3 pr-4 lg:flex lg:w-[244px]">
              <span lang="zh" aria-hidden="true" className="font-cn shrink-0 whitespace-nowrap text-3xl leading-none text-brand-gold-light">菜单</span>
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cream/75">{P("categories")}</span>
            </p>
            <label className="relative flex-1">
              <span className="sr-only">{T("menuSearch")}</span>
              <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold-light/80" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={T("menuSearch")}
                enterKeyHint="search"
                className="h-12 w-full rounded-full border border-brand-gold/25 bg-night pl-11 pr-11 text-base text-brand-cream outline-none transition placeholder:text-brand-cream/55 focus:border-saffron focus:ring-4 focus:ring-saffron/15 [&::-webkit-search-cancel-button]:hidden"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  aria-label={P("clearSearch")}
                  className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-brand-cream/70 transition hover:bg-night-3 hover:text-brand-cream"
                >
                  <X size={16} aria-hidden="true" />
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
                  vegOnly ? "border-jade bg-jade text-brand-cream" : "border-brand-gold/25 bg-night text-brand-cream hover:border-leaf"
                )}
              >
                <span className={cn("relative h-5 w-9 rounded-full transition", vegOnly ? "bg-brand-cream/30" : "bg-night-3")}>
                  <span className={cn("absolute top-0.5 h-4 w-4 rounded-full transition-all", vegOnly ? "left-[18px] bg-brand-cream" : "left-0.5 bg-leaf")} />
                </span>
                <Leaf size={15} aria-hidden="true" /> {T("menuVegOnly")}
              </button>
              <p className="min-w-0 truncate px-2 text-sm tabular-nums text-brand-cream/70" aria-live="polite">
                {P("dishCount", { count: filtered.length })}
              </p>
            </div>
          </div>

          {/* Telefon/planshet: yopishqoq gorizontal kategoriyalar */}
          {groups.length > 1 && (
            <div className="sticky top-[68px] z-30 border-b border-brand-gold/15 bg-night/95 backdrop-blur lg:hidden">
              <div ref={chipsRef} className="flex gap-2 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] sm:px-4">
                {groups.map((g) => {
                  const on = current === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      data-chip={g.id}
                      aria-current={on ? "true" : undefined}
                      onClick={() => goCat(g.id)}
                      className={cn(
                        "inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition",
                        on ? "border-saffron/70 bg-fire-deep text-brand-cream" : "border-brand-gold/20 text-brand-cream/85 hover:border-brand-gold/40"
                      )}
                    >
                      {g.zh && <span lang="zh" aria-hidden="true" className={cn("font-cn text-base leading-none", on ? "text-saffron" : "text-brand-gold-light")}>{firstHan(g.zh)}</span>}
                      {g.name}
                      <span className={cn("text-xs tabular-nums", on ? "text-brand-cream/80" : "text-brand-cream/60")}>{g.items.length}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kompyuter: chapda yopishqoq kategoriyalar paneli */}
          <aside className="hidden border-r border-brand-gold/15 bg-night-2/60 lg:block">
            <div className="flex h-full flex-col">
              <div className="flex-1">
                <nav aria-label={P("categories")} className="sticky top-24 px-4 py-6">
                  <ul className="space-y-1">
                    {groups.map((g, i) => {
                      const on = current === g.id;
                      return (
                        <li key={g.id} className="relative">
                          <span aria-hidden="true" className={cn("absolute -left-4 bottom-2 top-2 w-[3px] rounded-r-full transition-all duration-500", on ? "bg-saffron" : "bg-transparent")} />
                          <button
                            type="button"
                            onClick={() => goCat(g.id)}
                            aria-current={on ? "true" : undefined}
                            className={cn(
                              "group flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition",
                              on ? "bg-night-3 text-brand-cream" : "text-brand-cream/75 hover:bg-night-3/60 hover:text-brand-cream"
                            )}
                          >
                            <span
                              lang="zh"
                              aria-hidden="true"
                              className={cn(
                                "font-cn flex size-9 shrink-0 items-center justify-center rounded-full border text-lg leading-none transition",
                                on ? "border-saffron/60 text-saffron" : "border-brand-gold/20 text-brand-gold-light/80 group-hover:border-brand-gold/40"
                              )}
                            >
                              {firstHan(g.zh) || String(i + 1)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-display text-[17px] leading-tight">{g.name}</span>
                              {g.zh && locale !== "zh" && <span lang="zh" className="block text-xs text-brand-cream/60">{g.zh}</span>}
                            </span>
                            <span className={cn("text-xs tabular-nums", on ? "text-saffron" : "text-brand-cream/60")}>{g.items.length}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
              {/* Shior kartasi (namuna 03 dagi "From Uji" kartasi o'rnida) */}
              <div className="relative isolate m-4 mt-0 flex gap-4 overflow-hidden rounded-2xl border border-brand-gold/20 bg-night-3 p-5">
                <span aria-hidden="true" className="lattice-bg absolute inset-0 -z-10 text-brand-gold/[0.06]" />
                <span lang="zh" aria-hidden="true" className="font-cn shrink-0 text-3xl leading-[1.1] text-brand-gold-light [writing-mode:vertical-rl]">一品一味</span>
                <div className="min-w-0">
                  <p className="font-display text-xl italic leading-tight text-brand-cream">{M("motto")}</p>
                  <p className="mt-2 text-sm leading-relaxed text-brand-cream/70">{M("mottoSub")}</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Kategoriya panjaralari */}
          <div className="-mb-px min-w-0">
            {groups.map((g, gi) => {
              const fill = rowFill(g.items.length + 1);
              const kind = FILLS[fillN % FILLS.length];
              if (fill.filler) fillN++;
              return (
                <section key={g.id} id={`cat-${g.id}`} aria-labelledby={`cat-h-${g.id}`} className="scroll-mt-36 lg:scroll-mt-24">
                  <div className="-mr-px grid sm:grid-cols-2 xl:grid-cols-3">
                    {/* Kategoriya sarlavhasi — panjaraning birinchi katakchasi */}
                    <div className="relative isolate overflow-hidden border-b border-r border-brand-gold/15 bg-night-2 px-6 py-6 sm:p-8">
                      <span aria-hidden="true" className="lattice-bg absolute inset-0 -z-10 text-brand-gold/[0.05]" />
                      {g.zh && (
                        <span lang="zh" aria-hidden="true" className="font-cn absolute -right-2 top-4 -z-10 hidden text-[8.5rem] leading-[1.02] text-brand-gold/[0.06] [writing-mode:vertical-rl] sm:block">
                          {g.zh}
                        </span>
                      )}
                      <div data-rv className="flex h-full items-center gap-5 sm:flex-col sm:items-start sm:gap-0">
                        <span
                          lang="zh"
                          aria-hidden="true"
                          className="font-cn flex size-16 shrink-0 items-center justify-center rounded-full border border-brand-gold/40 text-3xl leading-none text-brand-gold-light sm:size-20 sm:text-4xl"
                        >
                          {firstHan(g.zh) || "菜"}
                        </span>
                        <div className="min-w-0 flex-1 sm:mt-8 sm:flex sm:w-full sm:flex-col">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-gold-light/85 tabular-nums">
                            {String(gi + 1).padStart(2, "0")} / {String(groups.length).padStart(2, "0")}
                            {g.zh && locale !== "zh" && <span lang="zh" className="ml-2 tracking-normal">{g.zh}</span>}
                          </p>
                          <h3 id={`cat-h-${g.id}`} className="mt-2 font-display text-3xl leading-[1.08] text-brand-cream sm:text-[2.4rem]">{g.name}</h3>
                          <span aria-hidden="true" className="mt-5 hidden h-px w-full bg-gradient-to-r from-brand-gold/50 to-transparent sm:block" />
                          <p className="mt-1.5 text-sm text-brand-cream/70 sm:mt-4">{P("dishCount", { count: g.items.length })}</p>
                          <span aria-hidden="true" className="fret-band mt-auto hidden w-24 pt-10 text-brand-gold/25 sm:block" />
                        </div>
                      </div>
                    </div>

                    {g.items.map((it, i) => (
                      <DishCell
                        key={it.id}
                        domId={`dish-${it.id}`}
                        d={toCell(it)}
                        as="h4"
                        className={cn("scroll-mt-36 lg:scroll-mt-28", i === g.items.length - 1 && fill.last)}
                      />
                    ))}
                    {fill.filler && (
                      <FillerCell kind={kind} className="hidden xl:flex" cnText="长安风味" title={kind === "motto" ? T("sc1t") : undefined} sub={kind === "motto" ? T("sc1x") : undefined} />
                    )}
                  </div>
                </section>
              );
            })}

            {filtered.length === 0 && (
              <div className="flex flex-col items-center border-b border-brand-gold/15 px-6 py-16 text-center">
                <div className="size-32">
                  <PorcelainPlate char="无" glyph="text-5xl" />
                </div>
                <p className="mt-6 font-display text-2xl text-brand-cream">{T("menuNothing")}</p>
                {filtering && (
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-saffron px-6 text-sm font-semibold text-brand-ink transition hover:bg-saffron-deep"
                  >
                    {P("resetFilters")}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pastki lenta: halal, oldindan buyurtma, choy */}
          <div className="relative grid border-t border-brand-gold/15 bg-night-2 sm:grid-cols-3 lg:col-span-2">
            <FootNote glyph="清" title={T("sc4t")} text={T("sc4x")} />
            <FootNote glyph="订" title={T("poTitle")} text={T("poSub")}>
              <Link href="/reservation" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-saffron transition hover:gap-3">
                {M("order")} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </FootNote>
            {teaGroup ? (
              <FootNote glyph="茶" title={`${M("teaTitle")} ${M("teaAccent")}`} text={M("teaSub")} last>
                <button type="button" onClick={() => goCat(teaGroup.id)} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-saffron transition hover:gap-3">
                  {M("teaExplore")} <ArrowRight size={16} aria-hidden="true" />
                </button>
              </FootNote>
            ) : (
              <FootNote glyph="座" title={T("reserveTitle")} text={T("reserveSub")} last>
                <Link href="/reservation" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-saffron transition hover:gap-3">
                  {T("reserveBtn")} <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </FootNote>
            )}
          </div>
        </div>
      </div>

      {waveTo && <Wave className={waveTo} variant="c" />}
    </section>
  );
}

function FootNote({ glyph, title, text, last = false, children }: { glyph: string; title: string; text: string; last?: boolean; children?: React.ReactNode }) {
  return (
    <div className={cn("flex gap-4 border-brand-gold/15 p-6 sm:p-7", !last && "border-b sm:border-b-0 sm:border-r")}>
      <span lang="zh" aria-hidden="true" className="font-cn flex size-12 shrink-0 items-center justify-center rounded-full border border-brand-gold/35 text-xl leading-none text-brand-gold-light">
        {glyph}
      </span>
      <div className="min-w-0">
        <p className="font-display text-lg leading-tight text-brand-cream">{title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-brand-cream/70">{text}</p>
        {children && <div className="mt-1">{children}</div>}
      </div>
    </div>
  );
}
