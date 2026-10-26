"use client";

import { useLocale, useTranslations } from "next-intl";
import { Clock, Flame, Leaf, Scale } from "lucide-react";
import { cn, currencyOf, formatMoney, hasPrice } from "@/lib/utils";
import { SPICY_KEYS } from "@/components/site/home/data";
import { PlatedDish } from "./Plated";

/** Menyu katakchasi uchun normallashtirilgan taom (menyu sahifasi, bosh sahifa va choy bloki bir xil ishlatadi) */
export type CellDish = {
  id: string;
  name: string;
  /** Xitoycha nom (bezak) — sahifa tili zh bo'lsa null */
  zh: string | null;
  desc: string;
  /** Amaldagi narx */
  price: number;
  /** Chegirma bo'lsa — eski narx */
  oldPrice: number | null;
  img: string | null;
  /** Zaxira tarelkadagi ieroglif */
  glyph: string;
  spicy: number;
  veg: boolean;
  halal: boolean;
  grams: number | null;
  mins: number | null;
  isNew?: boolean;
  featured?: boolean;
};

export type CellTone = "night" | "paper";

const TONE = {
  night: {
    cell: "bg-night",
    title: "text-brand-cream",
    zh: "text-brand-gold-light",
    desc: "text-brand-cream/70",
    tag: "bg-night-3 text-brand-cream/80",
    chip: "border-brand-gold/45 bg-night-2/95 text-brand-gold-light",
    chipHot: "border-saffron/60 bg-night-2/95 text-saffron",
    price: "text-saffron",
    old: "text-brand-cream/55",
    flame: "text-saffron fill-saffron/30",
    leaf: "text-leaf fill-leaf/25",
    rule: "bg-brand-gold/20",
  },
  paper: {
    cell: "bg-sand",
    title: "text-content",
    zh: "text-fire-ink",
    desc: "text-muted",
    tag: "bg-paper text-muted ring-1 ring-line",
    chip: "border-line bg-card text-muted",
    chipHot: "border-fire/40 bg-card text-fire-ink",
    price: "text-fire-ink",
    old: "text-muted",
    flame: "text-fire-ink fill-fire/20",
    leaf: "text-jade fill-jade/15",
    rule: "bg-line",
  },
} as const;

/**
 * Menyu katakchasi (namuna 03): tosh tagcha ustida dumaloq taom, yuqorida teg (Tavsiya/Yangi),
 * nafis serif nom, oltin xitoycha nom, tavsif, teg-chiplar (achchiq, vegetarian, halal, gramm, vaqt) va narx.
 * Katakcha keng bo'lsa (2 ustunga cho'zilgan) — container query bilan gorizontal ko'rinishga o'tadi.
 */
export default function DishCell({
  d, tone = "night", className, flash = false, domId, action, as: H = "h3", eager = false,
}: {
  d: CellDish;
  tone?: CellTone;
  className?: string;
  /** Qisqa yoritish (featured qatoridan bosilganda) */
  flash?: boolean;
  domId?: string;
  /** Narx yonidagi amal (masalan "Menyuda ko'rish" havolasi) */
  action?: React.ReactNode;
  as?: "h3" | "h4";
  eager?: boolean;
}) {
  const p = useTranslations("Pages2");
  const cur = currencyOf(useLocale());
  const h = useTranslations("Home2");
  const s = useTranslations("Site");
  const c = TONE[tone];
  const chips =
    d.featured || d.isNew ? (
      <>
        {d.featured && (
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]", c.chipHot)}>
            <span lang="zh" aria-hidden="true" className="font-cn text-sm leading-none tracking-normal">招牌</span>
            {p("chefPick")}
          </span>
        )}
        {d.isNew && <span className={cn("rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]", c.chip)}>{s("badgeNew")}</span>}
      </>
    ) : null;

  return (
    <article
      id={domId}
      className={cn(
        "@container group relative border-b border-r transition-shadow duration-500",
        tone === "night" ? "border-brand-gold/15" : "border-line",
        c.cell,
        flash && "ring-2 ring-inset ring-saffron",
        className
      )}
    >
      {/* Telefon: ixcham gorizontal (chapda kichik tarelka); sm+: vertikal; keng katakcha (@lg): gorizontal */}
      <div data-rv className="flex h-full flex-col p-7 max-sm:flex-row max-sm:gap-4 max-sm:p-5 @lg:flex-row @lg:items-center @lg:gap-8 @lg:p-9">
        <div className="relative max-sm:w-24 max-sm:shrink-0 max-sm:self-start @lg:w-[46%] @lg:shrink-0">
          {chips && <div className="absolute left-0 top-0 z-10 hidden flex-wrap gap-1.5 sm:flex">{chips}</div>}
          <PlatedDish
            img={d.img}
            alt={d.name}
            glyph={d.glyph}
            eager={eager}
            glyphClass="text-[clamp(2.75rem,16cqw,4.5rem)] max-sm:text-3xl @lg:text-[clamp(3rem,9cqw,5rem)]"
            className="max-w-[17rem] @lg:max-w-none"
          />
        </div>

        <div className="mt-5 flex min-w-0 flex-1 flex-col max-sm:mt-0 @lg:mt-0">
          {chips && <div className="mb-2 flex flex-wrap gap-1.5 sm:hidden">{chips}</div>}
          <H className={cn("font-display text-[1.6rem] leading-[1.12] max-sm:text-[1.35rem]", c.title, "@lg:text-[2rem]")}>{d.name}</H>
          {d.zh && <p lang="zh" className={cn("font-cn mt-1.5 text-lg leading-tight", c.zh)}>{d.zh}</p>}
          <span aria-hidden="true" className={cn("mt-4 block h-px w-12 max-sm:hidden", c.rule)} />
          {d.desc && <p className={cn("mt-4 line-clamp-3 text-sm leading-relaxed max-sm:mt-3 max-sm:line-clamp-2", c.desc)}>{d.desc}</p>}

          <ul className="mt-4 flex flex-wrap gap-1.5 text-xs">
            {d.spicy > 0 && (
              <li className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1", c.tag)}>
                <span className="inline-flex" aria-hidden="true">
                  {Array.from({ length: d.spicy }).map((_, i) => <Flame key={i} size={12} className={cn("-mx-px", c.flame)} />)}
                </span>
                {h(`spicy.${SPICY_KEYS[d.spicy]}`)}
              </li>
            )}
            {d.veg && (
              <li className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1", c.tag)}>
                <Leaf size={12} aria-hidden="true" className={c.leaf} /> {p("veg")}
              </li>
            )}
            {d.halal && <li className={cn("rounded-full px-2.5 py-1", c.tag)}>{s("halal")}</li>}
            {d.grams ? (
              <li className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 tabular-nums", c.tag)}>
                <Scale size={12} aria-hidden="true" /> {p("grams", { n: d.grams })}
              </li>
            ) : null}
            {d.mins ? (
              <li className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 tabular-nums", c.tag)}>
                <Clock size={12} aria-hidden="true" /> {p("minutes", { n: d.mins })}
              </li>
            ) : null}
          </ul>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5 max-sm:pt-4">
            {hasPrice(d.price) ? (
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className={cn("whitespace-nowrap font-display text-2xl tabular-nums max-sm:text-xl", c.price)}>{formatMoney(d.price, cur)}</span>
                {d.oldPrice != null && <s className={cn("whitespace-nowrap text-sm tabular-nums", c.old)}>{formatMoney(d.oldPrice, cur)}</s>}
              </p>
            ) : <span />}
            {action}
          </div>
        </div>
      </div>
    </article>
  );
}
