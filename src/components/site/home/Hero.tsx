import { ArrowRight, Clock } from "lucide-react";
import HeroBowl from "@/components/three/HeroBowl";
import ButtonLink from "@/components/site/kit/ButtonLink";
import Wave from "@/components/site/kit/Wave";
import { cn } from "@/lib/utils";

/**
 * 1-bo'lim: HERO — premium "Grand Mansion" afishasi uslubida (namuna: docs/references/05-premium1.jpg,
 * 01-3d-xitoy-tayoqcha). Qorong'i fon, markazda 3D lag'mon kosasi, uning ortida oltin konturli ulkan 长安
 * va oltin "oy" doirasi, chetlarda vertikal xitoycha yozuvlar, pastda nafis serif sarlavha.
 * Kirish animatsiyasi — sof CSS (@starting-style), reduced-motion'da o'chadi.
 */

const ENTER =
  "transition-[opacity,translate] duration-[1200ms] ease-out-expo starting:translate-y-8 starting:opacity-0 motion-reduce:transition-none";

export type HeroFact = { value: string; label: string };

type Props = {
  tag: string;
  lines: string[];
  /** Kursiv oltin qator indeksi */
  accentLine: number;
  sub: string;
  /** zh tilida sarlavha mo'yqalam shriftida */
  cnHeadline: boolean;
  bookLabel: string;
  menuLabel: string;
  facts: HeroFact[];
  hours: { value: string; label: string };
  sticker: { ring: string; center: string } | null;
  /** Pastki to'lqin rangi — keyingi bo'lim foni */
  waveClass?: string;
};

export default function Hero({ tag, lines, accentLine, sub, cnHeadline, bookLabel, menuLabel, facts, hours, sticker, waveClass = "text-paper" }: Props) {
  return (
    <section className="relative isolate overflow-hidden bg-night pb-28 pt-24 text-brand-cream sm:pb-32 lg:min-h-[100svh] lg:pb-36 lg:pt-28">
      {/* ---------- Fon: iliq nur, panjara, tutun ---------- */}
      <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[38%] -z-10 size-[54rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fire-deep/35 blur-[120px]" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-40 left-1/2 -z-10 h-80 w-[70rem] -translate-x-1/2 rounded-[50%] bg-saffron/10 blur-3xl" />
      <span aria-hidden="true" className="lattice-bg pointer-events-none absolute inset-0 -z-10 text-brand-gold/[0.035]" />

      {/* ---------- Chetlardagi vertikal yozuvlar (kompyuterda) ---------- */}
      <p aria-hidden="true" lang="zh" className="font-cn pointer-events-none absolute left-6 top-1/2 hidden -translate-y-1/2 text-2xl leading-[1.25] tracking-[0.35em] text-brand-gold/70 [writing-mode:vertical-rl] xl:block 2xl:left-12">
        丝路起点 · 长安美食
      </p>
      <div aria-hidden="true" className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-4 xl:flex 2xl:right-12">
        <span className="h-24 w-px bg-gradient-to-b from-transparent to-brand-gold/60" />
        <span lang="zh" className="font-cn text-lg tracking-[0.4em] text-brand-gold/70 [writing-mode:vertical-rl]">撒马尔罕</span>
        <span className="flex size-11 items-center justify-center rounded-[4px] bg-fire font-cn text-sm leading-none text-brand-cream [writing-mode:vertical-rl]" lang="zh">长安</span>
        <span className="h-24 w-px bg-gradient-to-t from-transparent to-brand-gold/60" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        {/* ---------- Eyebrow ---------- */}
        <p className={cn(ENTER, "flex items-center justify-center gap-4 text-[11px] font-semibold uppercase tracking-[0.42em] text-brand-gold-light sm:text-xs")}>
          <span className="h-px w-10 bg-brand-gold/60 sm:w-16" />
          {tag}
          <span className="h-px w-10 bg-brand-gold/60 sm:w-16" />
        </p>

        {/* ---------- Markaz: oltin oy + ulkan 长安 + 3D kosa ---------- */}
        <div className="relative mx-auto mt-4 aspect-square w-full max-w-[min(92vw,44rem)] lg:-mb-28 lg:mt-0 lg:max-w-[min(64vh,40rem)]">
          <span
            aria-hidden="true"
            lang="zh"
            className="font-cn pointer-events-none absolute inset-x-0 top-1/2 -translate-y-[58%] select-none whitespace-nowrap text-center text-[min(40vw,17rem)] leading-none text-transparent opacity-60 [-webkit-text-stroke:1px_var(--color-brand-gold)]"
          >
            长安
          </span>
          <span aria-hidden="true" className="absolute inset-[9%] rounded-full border border-brand-gold/30" />
          <span aria-hidden="true" className="absolute inset-[13%] animate-spin-slow rounded-full border border-dashed border-brand-gold/20" />
          <HeroBowl tone="night" poster="/3d/hero-bowl.webp" className="absolute inset-0" />
          {sticker && <GoldSeal ring={sticker.ring} center={sticker.center} />}
        </div>

        {/* ---------- Pastki qator: sarlavha | tugmalar ---------- */}
        <div className="relative z-10 mt-2 grid items-end gap-10 lg:mt-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16">
          <div className="min-w-0">
            <h1
              lang={cnHeadline ? "zh" : undefined}
              className={cn(
                "text-balance text-brand-cream",
                cnHeadline ? "font-cn text-6xl leading-[1.1] sm:text-7xl" : "font-display text-[clamp(2.6rem,6.4vw,5.6rem)] font-normal leading-[1.02] tracking-[-0.01em]"
              )}
            >
              {lines.map((l, i) => (
                <span
                  key={i}
                  className={cn(ENTER, i === 0 ? "delay-[150ms]" : i === 1 ? "delay-[260ms]" : "delay-[370ms]", "block", i === accentLine && "italic text-brand-gold-light")}
                >
                  {l}
                </span>
              ))}
            </h1>
          </div>
          <div className={cn(ENTER, "min-w-0 delay-[480ms] lg:pb-3")}>
            <p className="max-w-md text-base leading-relaxed text-brand-cream/85 sm:text-lg">{sub}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/reservation" variant="fire" blob className="group">
                {bookLabel}
                <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </ButtonLink>
              <ButtonLink href="/menu" variant="gold-outline">{menuLabel}</ButtonLink>
            </div>
          </div>
        </div>

        {/* ---------- Raqamlar lentasi (oltin chiziq) ---------- */}
        <dl translate="no" className={cn(ENTER, "relative z-10 mt-12 grid grid-cols-2 gap-6 border-t border-brand-gold/25 pt-6 delay-[620ms] sm:grid-cols-4 sm:gap-0")}>
          {facts.map((f) => (
            <div key={f.label} className="min-w-0 sm:border-r sm:border-brand-gold/15 sm:px-6 sm:first:pl-0">
              <dt className="sr-only">{f.label}</dt>
              <dd className="font-display text-4xl leading-none text-brand-gold-light sm:text-5xl">{f.value}</dd>
              <dd aria-hidden="true" className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-cream/80">{f.label}</dd>
            </div>
          ))}
          <div className="min-w-0 sm:px-6">
            <dt className="sr-only">{hours.label}</dt>
            <dd className="flex items-center gap-2 font-display text-3xl leading-none text-brand-gold-light sm:text-4xl">
              <Clock size={20} className="shrink-0 text-saffron" aria-hidden="true" />
              {hours.value}
            </dd>
            <dd aria-hidden="true" className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-cream/80">{hours.label}</dd>
          </div>
        </dl>
      </div>

      <Wave className={waveClass} />
    </section>
  );
}

/** Oltin muhr-belgi: aylanma yozuv va markazda xitoycha nom (kosa yonida) */
function GoldSeal({ ring, center }: { ring: string; center: string }) {
  const ringText = `${ring} · ${ring} · `;
  return (
    <div aria-hidden="true" className="absolute left-[2%] top-[10%] z-10 size-24 sm:size-32">
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full animate-spin-slow">
        <defs>
          <path id="gc-seal-ring" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
        </defs>
        <text className="fill-brand-gold-light" style={{ fontSize: 15, letterSpacing: 3, fontWeight: 600 }}>
          <textPath href="#gc-seal-ring" textLength="496" lengthAdjust="spacing">{ringText.toUpperCase()}</textPath>
        </text>
      </svg>
      <span className="absolute inset-[22%] flex items-center justify-center rounded-full border border-brand-gold/50 bg-night/80 backdrop-blur-sm">
        <span lang="zh" className="font-cn text-center text-lg leading-tight text-saffron sm:text-2xl">{center}</span>
      </span>
    </div>
  );
}
