import { ArrowDown, ArrowRight } from "lucide-react";
import DimSumSteamer from "@/components/three/DimSumSteamer";
import ButtonLink from "@/components/site/kit/ButtonLink";
import Wave from "@/components/site/kit/Wave";
import { cn } from "@/lib/utils";
import { ENTER, HeroEyebrow, HeroTitle } from "./parts";

/**
 * MENYU hero'si (namuna 03 — "Crafted with intention"): qorong'i, chapda nafis serif sarlavha va
 * raqamlar (taomlar / bo'limlar), o'ngda tosh tagcha ustida 3D bambuk bug'latgich (oltin oy ortida),
 * chap chetda vertikal xitoycha yozuv "菜单 — 一品一味" (har taom — o'z ta'mi).
 */
export default function MenuHero({
  title, eyebrow, sub, stats, bookLabel, browseLabel, waveClass,
}: {
  title: string;
  eyebrow: string;
  sub: string;
  stats: { value: number; label: string }[];
  bookLabel: string;
  browseLabel: string;
  /** Keyingi bo'lim krem bo'lsa — to'lqin rangi; qorong'i bo'lsa berilmaydi */
  waveClass?: string;
}) {
  return (
    <section className={cn("relative isolate overflow-hidden bg-night pt-28 text-brand-cream lg:pt-32", waveClass ? "pb-24 sm:pb-28" : "pb-10")}>
      <span aria-hidden="true" className="lattice-bg pointer-events-none absolute inset-0 -z-10 text-brand-gold/[0.035]" />
      <span aria-hidden="true" className="pointer-events-none absolute -right-32 top-10 -z-10 size-[44rem] rounded-full bg-fire-deep/30 blur-[120px]" />

      {/* Chap chetdagi vertikal yozuv */}
      <div aria-hidden="true" className="pointer-events-none absolute left-6 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-4 xl:flex 2xl:left-12">
        <span lang="zh" className="font-cn text-2xl leading-[1.3] text-brand-gold-light [writing-mode:vertical-rl]">菜单</span>
        <span className="h-16 w-px bg-brand-gold/50" />
        <span lang="zh" className="font-cn text-2xl leading-[1.3] text-brand-gold-light [writing-mode:vertical-rl]">一品一味</span>
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-6 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
        <div className="min-w-0 lg:py-10">
          <HeroEyebrow cn="菜单" text={eyebrow} />
          <HeroTitle text={title} className="mt-5 font-display text-[clamp(3rem,10vw,7rem)] font-normal leading-[1.05] text-brand-cream" />
          <p className={cn(ENTER, "mt-6 max-w-md text-lg leading-relaxed text-brand-cream/80 delay-200")}>{sub}</p>

          <div className={cn(ENTER, "mt-9 flex flex-wrap gap-3 delay-300")}>
            <a href="#menu-browser" className="btn-gold-sheen inline-flex h-14 items-center gap-2 rounded-full border border-brand-gold/60 px-7 font-semibold text-brand-gold-light transition hover:bg-brand-gold hover:text-brand-ink">
              {browseLabel}
              <ArrowDown size={18} aria-hidden="true" />
            </a>
            <ButtonLink href="/reservation" variant="fire" className="group">
              {bookLabel}
              <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </ButtonLink>
          </div>

          {stats.length > 0 && (
            <dl translate="no" className={cn(ENTER, "mt-12 flex gap-10 border-t border-brand-gold/20 pt-6 delay-500")}>
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-display text-5xl leading-none text-brand-gold-light">{s.value}</dd>
                  <dd aria-hidden="true" className="mt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-cream/70">{s.label}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* 3D bug'latgich — oltin oy va tosh tagcha */}
        <div className="relative isolate mx-auto aspect-square w-full max-w-[min(88vw,36rem)]">
          <span aria-hidden="true" className="absolute inset-[12%] rounded-full bg-gradient-to-b from-brand-gold/15 to-transparent" />
          <span aria-hidden="true" className="absolute inset-[12%] rounded-full border border-brand-gold/30" />
          <span aria-hidden="true" className="absolute inset-[6%] animate-spin-slow rounded-full border border-dashed border-brand-gold/15" />
          <span aria-hidden="true" className="absolute bottom-[12%] left-1/2 h-[14%] w-[72%] -translate-x-1/2 rounded-[50%] bg-night-3 shadow-[0_30px_60px_-10px] shadow-night ring-1 ring-brand-gold/15" />
          <DimSumSteamer className="absolute inset-0 z-10" />
        </div>
      </div>

      {waveClass && <Wave className={waveClass} />}
    </section>
  );
}
