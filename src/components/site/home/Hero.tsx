import { ArrowRight, Clock } from "lucide-react";
import HeroBowl from "@/components/three/HeroBowl";
import ButtonLink from "@/components/site/kit/ButtonLink";
import Wave from "@/components/site/kit/Wave";
import { cn } from "@/lib/utils";

/**
 * 1-bo'lim: HERO (namuna 1 — qizil lag'mon afishasi).
 * Chapda katta afisha sarlavha, o'ngda 3D lag'mon kosasi va uning ortida bezaklar.
 * Kirish animatsiyasi — sof CSS (@starting-style): JS'siz ham ishlaydi, sahifa yuklanishida
 * "miltillash" bo'lmaydi; prefers-reduced-motion'da o'chadi.
 */

// Yuklanishda pastdan suzib chiqish (Tailwind `starting:` = @starting-style)
const ENTER =
  "transition-[opacity,translate] duration-[1100ms] ease-out-expo starting:translate-y-10 starting:opacity-0 motion-reduce:transition-none";

export type HeroFact = { value: string; label: string };

type Props = {
  tag: string;
  lines: string[];
  /** Saffron rangli qator indeksi */
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

const DELAYS = ["delay-[120ms]", "delay-[220ms]", "delay-[320ms]"];

export default function Hero({ tag, lines, accentLine, sub, cnHeadline, bookLabel, menuLabel, facts, hours, sticker, waveClass = "text-paper" }: Props) {
  return (
    <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-fire pb-24 pt-28 text-brand-cream sm:pb-28 lg:pb-32 lg:pt-32">
      {/* Fon: iliq zafar nur va nozik panjara naqshi */}
      <span aria-hidden="true" className="pointer-events-none absolute -left-40 -top-40 -z-10 size-[38rem] rounded-full bg-saffron/15 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-48 right-[-10%] -z-10 size-[44rem] rounded-full bg-fire-deep/70 blur-3xl" />
      <span aria-hidden="true" className="lattice-bg pointer-events-none absolute inset-0 -z-10 text-fire-deep/25" />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-6">
        {/* ---------- Matn ---------- */}
        <div className="relative z-10 min-w-0">
          <p className={cn(ENTER, "inline-flex h-9 items-center gap-2.5 rounded-full border border-brand-cream/25 bg-fire-deep/60 px-4 text-[13px] font-medium tracking-wide text-brand-cream/90 backdrop-blur-sm")}>
            <span className="size-2 rounded-full bg-saffron" />
            {tag}
          </p>

          <h1
            lang={cnHeadline ? "zh" : undefined}
            className={cn(
              "mt-6 text-balance",
              cnHeadline
                ? "font-cn text-[clamp(3.6rem,11vw,7.5rem)] leading-[1.08]"
                : "font-poster text-[clamp(2.7rem,7.2vw,6.3rem)] leading-[1.05]"
            )}
          >
            {lines.map((l, i) => (
              <span key={i} className={cn(ENTER, DELAYS[i] ?? DELAYS[2], "block", i === accentLine && "text-saffron")}>
                {l}
              </span>
            ))}
          </h1>

          {sub && (
            <p className={cn(ENTER, "mt-6 max-w-xl text-lg leading-relaxed text-brand-cream/85 delay-[420ms] sm:text-xl")}>{sub}</p>
          )}

          <div className={cn(ENTER, "mt-9 flex flex-wrap gap-3 delay-[520ms] sm:gap-4")}>
            <ButtonLink href="/reservation" variant="saffron" className="group shadow-lg shadow-wine/40">
              {bookLabel}
              <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </ButtonLink>
            <ButtonLink href="/menu" variant="ghost-light">{menuLabel}</ButtonLink>
          </div>

          {/* Raqamlar: zal xaritasidan (stollar, o'rinlar, VIP) va ish vaqti bazadan */}
          <dl className={cn(ENTER, "mt-12 grid max-w-xl grid-cols-2 gap-y-6 delay-[640ms] sm:flex sm:flex-wrap sm:gap-y-4")}>
            {facts.map((f) => (
              <div key={f.label} className="pr-6 sm:border-r sm:border-brand-cream/20 sm:px-6 sm:first:pl-0">
                <dt className="sr-only">{f.label}</dt>
                <dd className="font-poster text-3xl leading-none sm:text-[2.1rem]">{f.value}</dd>
                <dd aria-hidden="true" className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cream/75">{f.label}</dd>
              </div>
            ))}
            <div className="pr-6 sm:px-6">
              <dt className="sr-only">{hours.label}</dt>
              <dd className="flex items-center gap-2 font-poster text-xl leading-none sm:text-2xl">
                <Clock size={18} className="shrink-0 text-saffron" aria-hidden="true" />
                {hours.value}
              </dd>
              <dd aria-hidden="true" className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cream/75">{hours.label}</dd>
            </div>
          </dl>
        </div>

        {/* ---------- 3D kosa va bezaklar ---------- */}
        <div className="relative mx-auto w-[min(86vw,340px)] sm:w-[460px] lg:w-full lg:max-w-[620px]">
          <div className="relative aspect-square">
            {/* Ulkan 长安 (orqa fonda) */}
            <span
              aria-hidden="true"
              lang="zh"
              className={cn(
                "font-cn pointer-events-none absolute -right-[14%] -top-[12%] select-none whitespace-nowrap text-[clamp(8rem,34vw,17rem)] leading-none text-fire-deep [writing-mode:vertical-rl]",
                "transition-[opacity,translate] duration-[1600ms] ease-out-expo starting:translate-y-16 starting:opacity-0 motion-reduce:transition-none"
              )}
            >
              长安
            </span>

            {/* To'q qizil disk + aylanuvchi zafar halqa */}
            <div className="absolute inset-[7%] transition-[opacity,scale] duration-[1300ms] ease-out-expo delay-150 starting:scale-75 starting:opacity-0 motion-reduce:transition-none">
              <div className="absolute inset-0 rounded-full bg-fire-deep shadow-2xl shadow-wine/60" />
              <div className="absolute inset-[7%] rounded-full border-2 border-dashed border-saffron/35 animate-spin-slow" />
              <div className="absolute inset-[20%] rounded-full bg-wine/35 blur-2xl" />
            </div>

            {/* 3D lag'mon kosasi ("three" agenti) */}
            <div className="absolute inset-0 z-10 transition-[opacity,translate] duration-[1400ms] ease-out-expo delay-300 starting:translate-y-12 starting:opacity-0 motion-reduce:transition-none">
              <HeroBowl className="h-full w-full" />
            </div>

            {/* Vertikal xitoycha lenta */}
            <div
              aria-hidden="true"
              lang="zh"
              className="font-cn absolute -left-1 top-[10%] z-20 rounded-full border border-saffron/40 bg-wine/90 px-2 py-5 text-lg leading-none tracking-[0.25em] text-saffron shadow-lg [writing-mode:vertical-rl] transition-[opacity,translate] duration-1000 ease-out-expo delay-500 starting:-translate-y-6 starting:opacity-0 motion-reduce:transition-none sm:text-xl"
            >
              丝路起点 · 正宗中餐
            </div>

            {/* Zafar "stiker": oshpaz tavsiyasi */}
            {sticker && <Sticker ring={sticker.ring} center={sticker.center} />}
          </div>
        </div>
      </div>

      <Wave className={waveClass} />
    </section>
  );
}

function Sticker({ ring, center }: { ring: string; center: string }) {
  const han = /\p{Script=Han}/u.test(center);
  // Halqa matni aylana uzunligini to'ldirishi uchun takrorlanadi
  const reps = Math.max(2, Math.min(4, Math.round(36 / Math.max(ring.length, 4))));
  const ringText = Array.from({ length: reps }, () => `${ring.toUpperCase()} • `).join("");
  return (
    <div className="absolute -bottom-[2%] right-[2%] z-20 size-[7.5rem] rotate-[-10deg] transition-[opacity,scale,rotate] duration-[1100ms] ease-out-expo delay-700 starting:rotate-[-120deg] starting:scale-50 starting:opacity-0 motion-reduce:transition-none sm:size-36 lg:right-[4%]">
      <div className="relative size-full rounded-full bg-saffron text-brand-ink shadow-xl shadow-wine/50 ring-4 ring-saffron/30">
        <svg viewBox="0 0 200 200" aria-hidden="true" className="absolute inset-0 size-full animate-spin-slow">
          <defs>
            <path id="gc-sticker-ring" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
          </defs>
          <text fill="currentColor" fontSize="15" fontWeight="700" letterSpacing="2">
            <textPath href="#gc-sticker-ring" textLength="496" lengthAdjust="spacing">{ringText}</textPath>
          </text>
        </svg>
        <div className="absolute inset-[24%] flex items-center justify-center rounded-full border border-dashed border-brand-ink/30 text-center">
          <span
            lang={han ? "zh" : undefined}
            className={cn(
              "line-clamp-2 px-1 leading-[1.1] text-fire-deep",
              han ? "font-cn text-xl sm:text-2xl" : "font-display text-sm font-semibold sm:text-base"
            )}
          >
            {center}
          </span>
        </div>
      </div>
    </div>
  );
}
