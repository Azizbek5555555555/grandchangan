"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Star } from "lucide-react";
import { Birds, Mountains, Pavilion } from "@/components/site/pages/InkDecor";
import Wave from "@/components/site/kit/Wave";
import { srcSetOf, type Pic } from "@/components/site/photos/pics";
import { cn } from "@/lib/utils";

export type StageSlide = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  /** Fon rasmi (mijoz rasmi / taom / restoran interyeri) — bo'lmasa tush manzarasi */
  img: Pic | null;
  /** Sharh bog'langan taom nomi */
  dish: string | null;
};

type Labels = {
  eyebrow: string;
  title: string;
  prev: string;
  next: string;
  goTo: string;
  tasted: string;
  avgLabel: string;
  countLabel: string;
  region: string;
  pause: string;
  play: string;
  slide: string;
};

const AUTOPLAY_MS = 8000;

function Stars({ n, size = 16 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex gap-1" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className={i < n ? "fill-saffron text-saffron" : "text-brand-cream/25"} />
      ))}
    </span>
  );
}

/** Rasm yo'q sharh uchun fon: oy, tumanli tog'lar, ayvon silueti, qushlar — har sharhda boshqacha kompozitsiya */
function InkScene({ variant }: { variant: number }) {
  const v = variant % 3;
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-night-2">
      <span className="lattice-bg absolute inset-0 text-brand-gold/[0.05]" />
      <span className={cn("absolute size-[22rem] rounded-full bg-brand-gold-light/15 blur-3xl sm:size-[30rem]", v === 0 ? "right-[12%] top-[8%]" : v === 1 ? "left-[38%] top-[4%]" : "right-[30%] top-[14%]")} />
      <span className={cn("absolute size-40 rounded-full bg-brand-gold-light/70 sm:size-56", v === 0 ? "right-[20%] top-[16%]" : v === 1 ? "left-[48%] top-[10%]" : "right-[38%] top-[22%]")} />
      <Birds className={cn("absolute w-48 text-brand-cream/30 sm:w-64", v === 2 ? "left-[20%] top-[18%]" : "right-[8%] top-[34%]")} />
      <Pavilion className={cn("absolute bottom-[14%] w-40 text-night sm:w-56", v === 1 ? "right-[6%]" : "left-[52%]")} />
      <Mountains className="absolute inset-x-0 bottom-0 h-1/2 w-full text-night-3" />
      <span className={cn("absolute bottom-[22%] size-3 rounded-full bg-fire shadow-[0_0_30px_10px] shadow-fire/40", v === 1 ? "right-[14%]" : "left-[60%]")} />
    </div>
  );
}

/**
 * Sharhlar "kino sahnasi": har sharh — to'liq ekranli fon (Ken Burns bilan sekin yaqinlashadi) ustida katta
 * serif iqtibos, muallif, yulduzlar va taom nomi. Avtomatik almashadi (8 s), sichqoncha/fokus ustida
 * yoki ekrandan tashqarida to'xtaydi, pauza tugmasi bilan butunlay to'xtatiladi (WCAG 2.2.2),
 * reduced-motion'da avtomatik almashmaydi. Klaviatura: ←/→. rating 0 / author "" — taklif slaydi (yulduz va muallifsiz).
 */
export default function ReviewsStage({
  slides, avg, labels, topWaveClass,
}: { slides: StageSlide[]; avg: number | null; labels: Labels; topWaveClass?: string }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  /** Foydalanuvchi pauza tugmasini bosgan */
  const [stopped, setStopped] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  /** Yuklanmagan fon rasmlari — o'rniga tush manzarasi */
  const [broken, setBroken] = useState<Record<string, true>>({});
  const ref = useRef<HTMLElement | null>(null);
  const n = slides.length;

  const go = useCallback((i: number) => setActive(((i % n) + n) % n), [n]);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const playing = n > 1 && visible && !paused && !stopped && !reduced;
  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => go(active + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [playing, active, go]);

  const s = slides[active];
  const long = s.comment.length > 160;
  const ringText = `${labels.avgLabel} · ${labels.countLabel} · `.toUpperCase();

  return (
    <section
      ref={ref}
      data-home="reviews"
      aria-roledescription="carousel"
      aria-label={labels.region}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false); }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(active + 1);
        if (e.key === "ArrowLeft") go(active - 1);
      }}
      className="relative isolate flex min-h-[44rem] flex-col justify-end overflow-hidden bg-night text-brand-cream sm:min-h-[48rem] lg:min-h-[min(100svh,58rem)]"
    >
      {topWaveClass && <Wave top className={topWaveClass} variant="b" />}
      {/* ---------- Fonlar: barcha sharhlarniki, faqat faoli ko'rinadi ---------- */}
      <div className="absolute inset-0 -z-10">
        {slides.map((sl, i) => (
          <div
            key={sl.id}
            aria-hidden="true"
            className={cn("absolute inset-0 transition-opacity duration-[1400ms] ease-out", i === active ? "opacity-100" : "opacity-0")}
          >
            <div
              className={cn(
                "absolute inset-0 transition-transform ease-linear motion-reduce:transition-none",
                i === active ? "scale-[1.12] duration-[9000ms]" : "scale-100 duration-[1400ms]"
              )}
            >
              {sl.img && !broken[sl.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sl.img.md ?? sl.img.src}
                  srcSet={srcSetOf(sl.img)}
                  sizes="100vw"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={{ objectPosition: sl.img.pos ?? "50% 50%" }}
                  onError={() => setBroken((b) => ({ ...b, [sl.id]: true }))}
                  className="h-full w-full object-cover"
                />
              ) : (
                <InkScene variant={i} />
              )}
            </div>
          </div>
        ))}
        {/* Kino qatlamlari: chapdan va pastdan qorong'ilik, vinyetka */}
        <div className="absolute inset-0 bg-gradient-to-r from-night/95 via-night/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/10 to-night/55" />
        <div className="absolute inset-0 shadow-[inset_0_0_160px_40px] shadow-night/70" />
      </div>

      {/* Ulkan oltin qo'shtirnoq */}
      <span aria-hidden="true" className="pointer-events-none absolute left-[3%] top-[6%] -z-[1] select-none font-display text-[16rem] leading-none text-brand-gold/20 sm:text-[22rem]">
        &ldquo;
      </span>

      <div className="relative mx-auto w-full max-w-7xl px-5 pb-14 pt-32 sm:px-8 sm:pb-16 lg:pb-20">
        {/* Sarlavha qatori */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span lang="zh" aria-hidden="true" className="font-cn text-3xl leading-none text-saffron">评价</span>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-cream/75">{labels.eyebrow}</span>
          <span aria-hidden="true" className="hidden h-px w-16 bg-brand-gold/50 sm:block" />
          {avg !== null && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-gold-light lg:hidden">
              <Star size={14} aria-hidden="true" className="fill-saffron text-saffron" />
              <span translate="no">{avg.toFixed(1)}</span>
              <span className="font-normal text-brand-cream/75">· {labels.countLabel}</span>
            </span>
          )}
        </div>
        <h2 className="mt-3 font-display text-4xl leading-[1.05] text-brand-cream sm:text-5xl">{labels.title}</h2>

        <div className="mt-10 grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          {/* ---------- Faol sharh ---------- */}
          {/* aria-live barqaror o'ramda — almashgan slayd ekran o'quvchida o'qiladi */}
          <div aria-live={playing ? "off" : "polite"} aria-atomic="true" className="min-w-0">
            <figure
              key={s.id}
              role="group"
              aria-roledescription={labels.slide}
              aria-label={`${active + 1} / ${n}`}
              className="max-w-3xl animate-[rv-in_900ms_var(--ease-out-expo)_both] motion-reduce:animate-none"
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {s.rating > 0 && (
                  <>
                    <Stars n={s.rating} size={18} />
                    <span className="sr-only">{s.rating}/5</span>
                  </>
                )}
                <span translate="no" className="text-xs font-semibold tracking-[0.3em] text-brand-cream/75">
                  {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
                </span>
              </div>
              {s.comment && (
                <blockquote
                  className={cn(
                    "mt-6 line-clamp-6 text-balance font-display italic leading-[1.18] text-brand-cream",
                    long ? "text-2xl sm:text-3xl lg:text-[2.4rem]" : "text-3xl sm:text-[2.75rem] lg:text-[3.4rem]"
                  )}
                >
                  {s.comment}
                </blockquote>
              )}
              {(s.author || s.dish) && (
                <figcaption className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                  {s.author && (
                    <span className="flex items-center gap-3">
                      <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full border border-brand-gold/60 font-display text-xl text-brand-gold-light">
                        {s.author.trim().charAt(0).toUpperCase() || "G"}
                      </span>
                      <span className="text-lg font-semibold tracking-wide">{s.author}</span>
                    </span>
                  )}
                  {s.dish && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-brand-cream/20 bg-night/40 px-4 py-1.5 text-sm text-brand-cream/85 backdrop-blur-sm">
                      <span className="text-brand-cream/75">{labels.tasted}</span>
                      <span className="font-display italic text-brand-gold-light">{s.dish}</span>
                    </span>
                  )}
                </figcaption>
              )}
            </figure>
          </div>

          {/* ---------- Baho muhri ---------- */}
          {avg !== null && (
            <div className="relative hidden size-40 shrink-0 lg:block" role="img" aria-label={`${labels.avgLabel}: ${avg.toFixed(1)} / 5 · ${labels.countLabel}`}>
              <svg viewBox="0 0 200 200" aria-hidden="true" className="absolute inset-0 size-full animate-spin-slow">
                <defs>
                  <path id="gc-rv-ring" d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0" />
                </defs>
                <text className="fill-brand-gold-light" style={{ fontSize: 13, letterSpacing: 3, fontWeight: 600 }}>
                  <textPath href="#gc-rv-ring" textLength="510" lengthAdjust="spacing">{ringText}{ringText}</textPath>
                </text>
              </svg>
              <span aria-hidden="true" className="absolute inset-[20%] flex flex-col items-center justify-center rounded-full border border-brand-gold/50 bg-night/70 backdrop-blur-sm">
                <span translate="no" className="font-display text-4xl leading-none text-brand-gold-light">{avg.toFixed(1)}</span>
                <span className="mt-1.5"><Stars n={Math.round(avg)} size={10} /></span>
              </span>
            </div>
          )}
        </div>

        {/* ---------- Boshqaruv: progress chiziqlari + tugmalar ---------- */}
        {n > 1 && (
          <div className="mt-12 flex items-center gap-6 border-t border-brand-cream/15 pt-6">
            <div className="hidden flex-1 gap-2 sm:flex">
              {slides.map((sl, i) => (
                <button
                  key={sl.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={labels.goTo.replace("{n}", String(i + 1))}
                  aria-current={i === active ? "true" : undefined}
                  className="group flex h-11 flex-1 items-center"
                >
                  <span className="relative h-[3px] w-full overflow-hidden rounded-full bg-brand-cream/20 transition group-hover:bg-brand-cream/40">
                    <span
                      key={i === active ? `on-${active}-${playing}` : "off"}
                      className={cn(
                        "absolute inset-y-0 left-0 bg-gradient-to-r from-fire to-saffron",
                        i < active && "w-full",
                        i > active && "w-0",
                        i === active && (playing ? "w-0 animate-[rv-fill_linear_forwards]" : "w-full")
                      )}
                      style={i === active && playing ? { animationDuration: `${AUTOPLAY_MS}ms` } : undefined}
                    />
                  </span>
                </button>
              ))}
            </div>
            <div className="ml-auto flex shrink-0 gap-2">
              {!reduced && (
                <button
                  type="button"
                  onClick={() => setStopped((v) => !v)}
                  aria-label={stopped ? labels.play : labels.pause}
                  aria-pressed={stopped}
                  className="flex size-12 items-center justify-center rounded-full border border-brand-cream/30 text-brand-cream transition hover:border-saffron hover:text-saffron focus-visible:outline-2 focus-visible:outline-saffron"
                >
                  {stopped ? <Play size={18} aria-hidden="true" /> : <Pause size={18} aria-hidden="true" />}
                </button>
              )}
              <button type="button" onClick={() => go(active - 1)} aria-label={labels.prev} className="flex size-12 items-center justify-center rounded-full border border-brand-cream/30 text-brand-cream transition hover:border-saffron hover:bg-saffron hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-saffron">
                <ChevronLeft size={20} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => go(active + 1)} aria-label={labels.next} className="flex size-12 items-center justify-center rounded-full border border-brand-cream/30 text-brand-cream transition hover:border-saffron hover:bg-saffron hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-saffron">
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
