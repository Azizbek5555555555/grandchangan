import { ArrowLeft, ArrowRight, Clock, Flame, Leaf, Scale, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn, formatMoney, hasPrice } from "@/lib/utils";
import ButtonLink from "@/components/site/kit/ButtonLink";
import Wave from "@/components/site/kit/Wave";
import { PlatedDish } from "@/components/site/menu/Plated";
import { ENTER, HeroEyebrow, HeroTitle } from "@/components/site/heroes/parts";

export type DishHeroData = {
  name: string;
  /** Xitoycha nom — sahifa tili zh bo'lsa null */
  zh: string | null;
  desc: string;
  composition: string;
  img: string | null;
  glyph: string;
  catName: string;
  catZh: string | null;
  catHref: string;
  spicy: number;
  veg: boolean;
  halal: boolean;
  grams: number | null;
  mins: number | null;
  price: number;
  oldPrice: number | null;
  currency: string;
};

export type DishHeroLabels = {
  home: string;
  menu: string;
  book: string;
  preorder: string;
  back: string;
  dineIn: string;
  composition: string;
  spicy: string;
  veg: string;
  halal: string;
  grams: string;
  mins: string;
};

/**
 * Taom sahifasi hero'si: qorong'i "tungi saroy" foni. Chapda non-kesak (breadcrumb), kategoriya, katta serif nom,
 * xitoycha nom, tavsif, belgilar va CTA; o'ngda lak patnis ustida katta tarelka — ortida ulkan konturli ieroglif,
 * aylanuvchi oltin halqalar va vertikal qizil xitoycha yorliq (Oshpaz tanlovi uslubida).
 */
export default function DishHero({ d, l, waveClass }: { d: DishHeroData; l: DishHeroLabels; waveClass?: string }) {
  const chips = [
    d.spicy > 0 ? { key: "s", icon: Flame, label: l.spicy, hot: true } : null,
    d.veg ? { key: "v", icon: Leaf, label: l.veg } : null,
    d.halal ? { key: "h", icon: ShieldCheck, label: l.halal } : null,
    d.grams ? { key: "g", icon: Scale, label: l.grams } : null,
    d.mins ? { key: "m", icon: Clock, label: l.mins } : null,
  ].filter(Boolean) as { key: string; icon: typeof Flame; label: string; hot?: boolean }[];

  return (
    <section className={cn("relative isolate overflow-hidden bg-night pt-28 text-brand-cream lg:pt-32", waveClass ? "pb-28 sm:pb-36" : "pb-16 sm:pb-20")}>
      <span aria-hidden="true" className="lattice-bg pointer-events-none absolute inset-0 -z-10 text-brand-gold/[0.035]" />
      <span aria-hidden="true" className="pointer-events-none absolute -right-40 top-0 -z-10 size-[46rem] rounded-full bg-fire-deep/30 blur-[120px]" />
      <span aria-hidden="true" className="pointer-events-none absolute -left-48 bottom-0 -z-10 size-[30rem] rounded-full bg-saffron/[0.06] blur-[110px]" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Non-kesak */}
        <nav aria-label="breadcrumb" className={cn(ENTER, "text-xs text-brand-cream/60")}>
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li><Link href="/" className="transition hover:text-saffron">{l.home}</Link></li>
            <li aria-hidden="true" className="text-brand-gold/50">/</li>
            <li><Link href="/menu" className="transition hover:text-saffron">{l.menu}</Link></li>
            <li aria-hidden="true" className="text-brand-gold/50">/</li>
            <li><Link href={d.catHref} className="transition hover:text-saffron">{d.catName}</Link></li>
          </ol>
        </nav>

        <div className="mt-8 grid items-center gap-12 lg:mt-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          <div className="min-w-0">
            <HeroEyebrow cn={d.catZh ?? undefined} text={d.catName} />
            <HeroTitle text={d.name} className="mt-5 break-words font-display text-[clamp(2.6rem,7vw,5.5rem)] font-normal leading-[1.06] text-brand-cream" />
            {d.zh && (
              <p lang="zh" className={cn(ENTER, "font-cn mt-4 text-3xl leading-tight text-brand-gold-light delay-150 sm:text-4xl")}>{d.zh}</p>
            )}
            <span aria-hidden="true" className="hairline-gold mt-7 block max-w-md" />
            {d.desc && <p className={cn(ENTER, "mt-6 max-w-xl text-lg leading-relaxed text-brand-cream/75 delay-200")}>{d.desc}</p>}

            {chips.length > 0 && (
              <ul className={cn(ENTER, "mt-7 flex flex-wrap gap-2 delay-300")}>
                {chips.map((c) => (
                  <li
                    key={c.key}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium tracking-wide",
                      c.hot ? "border-saffron/50 text-saffron" : "border-brand-gold/30 text-brand-cream/80"
                    )}
                  >
                    {c.key === "s" ? (
                      <span className="inline-flex" aria-hidden="true">
                        {Array.from({ length: d.spicy }).map((_, i) => <Flame key={i} size={13} className="-mx-px fill-saffron/30" />)}
                      </span>
                    ) : (
                      <c.icon size={13} aria-hidden="true" className={c.key === "v" ? "text-leaf" : "text-saffron"} />
                    )}
                    {c.label}
                  </li>
                ))}
              </ul>
            )}

            {d.composition && (
              <div className={cn(ENTER, "mt-7 max-w-xl delay-300")}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-gold-light/80">{l.composition}</p>
                <p className="mt-2 text-sm leading-relaxed text-brand-cream/70">{d.composition}</p>
              </div>
            )}

            <div className={cn(ENTER, "mt-9 flex flex-wrap items-center gap-x-6 gap-y-4 delay-500")}>
              {hasPrice(d.price) && (
                <p className="flex items-baseline gap-3">
                  <span translate="no" className="font-display text-4xl tabular-nums text-saffron">{formatMoney(d.price, d.currency)}</span>
                  {d.oldPrice != null && <s className="text-lg tabular-nums text-brand-cream/55">{formatMoney(d.oldPrice, d.currency)}</s>}
                </p>
              )}
              <ButtonLink href="/reservation" variant="fire" blob className="group">
                {l.book}
                <ArrowRight size={18} aria-hidden="true" className="transition group-hover:translate-x-1" />
              </ButtonLink>
              <ButtonLink href="/reservation" variant="gold-outline">{l.preorder}</ButtonLink>
            </div>
            <p className={cn(ENTER, "mt-5 max-w-md text-[13px] leading-relaxed text-brand-cream/55 delay-700")}>{l.dineIn}</p>
            <Link href="/menu" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-gold-light transition hover:gap-3 hover:text-saffron">
              <ArrowLeft size={16} aria-hidden="true" /> {l.back}
            </Link>
          </div>

          {/* ---------- Tarelka ---------- */}
          <div className={cn(ENTER, "relative mx-auto w-full max-w-[34rem] delay-200")}>
            <span
              aria-hidden="true"
              lang="zh"
              className="font-cn pointer-events-none absolute left-1/2 top-[-6%] -translate-x-1/2 select-none text-[min(68vw,30rem)] leading-none text-transparent opacity-[0.14] [-webkit-text-stroke:1px_var(--color-brand-gold)]"
            >
              {d.glyph}
            </span>
            <span aria-hidden="true" className="absolute left-1/2 top-[1%] aspect-square w-[80%] -translate-x-1/2 rounded-full border border-brand-gold/35" />
            <span aria-hidden="true" className="absolute left-1/2 top-[-5%] aspect-square w-[92%] -translate-x-1/2 animate-spin-slow rounded-full border border-dashed border-brand-gold/25" />
            <div className="group relative">
              <PlatedDish img={d.img} alt={d.name} glyph={d.glyph} variant="lacquer" eager glyphClass="text-[6rem] sm:text-[8rem]" />
            </div>
            {d.zh && (
              <span
                lang="zh"
                aria-hidden="true"
                className="font-cn absolute right-0 top-0 flex max-h-[70%] items-center overflow-hidden rounded-md border border-saffron/40 bg-fire-deep px-2 py-4 text-2xl leading-tight text-brand-cream shadow-lg [writing-mode:vertical-rl] sm:-right-2 sm:text-3xl"
              >
                {d.zh}
              </span>
            )}
          </div>
        </div>
      </div>
      {waveClass ? <Wave className={waveClass} /> : <span aria-hidden="true" className="hairline-gold absolute inset-x-[8%] bottom-0" />}
    </section>
  );
}
