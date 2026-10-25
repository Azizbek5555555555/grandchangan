"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Wave from "@/components/site/kit/Wave";
import { cn } from "@/lib/utils";
import { HERO_SLIDES, srcSetOf, type Frame } from "./slides";

/** Har slayd ekranda turadigan vaqt (s) */
const DUR = 6.5;
/** Ken Burns davomiyligi — o'tish vaqti bilan birga */
const KB_DUR = DUR + 2.5;
const LG = "(min-width: 1024px)";
/** Panjara o'tishidagi eng ko'p tasma soni (lg) */
const MAX_STRIPS = 7;

export type HeroLabels = {
  region: string;
  role: string;
  slide: string;
  prev: string;
  next: string;
  pause: string;
  play: string;
  scroll: string;
};

type Props = {
  /** Slayd nomlari (HUD va aria-label), HERO_SLIDES tartibida */
  names: string[];
  /** Rasmlarning alt matni */
  alts: string[];
  /** HUD da xitoycha kichik nom (zh tilida ko'rsatilmaydi — nomning o'zi xitoycha) */
  showCn: boolean;
  labels: HeroLabels;
  copy: ReactNode;
  facts: ReactNode;
  seal: ReactNode;
  waveClass: string;
};

const pad = (x: number) => String(x).padStart(2, "0");

const BTN =
  "flex size-11 shrink-0 items-center justify-center rounded-full border border-brand-gold/45 bg-night/55 text-brand-cream transition duration-300 hover:border-brand-gold-light hover:bg-brand-gold/15 hover:text-brand-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-night active:scale-95";

/**
 * 1-bo'lim: HERO — restoranning tashqi rasmlaridan kinematik slayd-shou (to'liq ekran, header ostidan).
 *
 * O'tishlar (navbat bilan): "osma o'ramlar" — vertikal panjara tasmalari tepadan pastga ochiladi, uchida oltin
 * tayoqcha; va "oy-darvoza" (月洞门) — rasmning muhim nuqtasidan oltin halqali doira kengayadi. Har slaydda sekin
 * Ken Burns (telefonda keng rasm gorizontal panorama bilan "o'qiladi"). Vertikal rasm lg+ da to'liq ekranga
 * cho'zilmaydi — oltin ramkali osma o'ram bo'lib ochiladi.
 *
 * Boshqaruv: oldingi/keyingi/pauza (≥44px), ←/→, HUD ustida sichqoncha yoki klaviatura fokusi turganda,
 * ekrandan tashqarida avto-almashish to'xtaydi. prefers-reduced-motion: avto-almashish va Ken Burns yo'q,
 * qo'lda almashtirish — oddiy xira o'tish. Birinchi rasm SSR'da darhol (fetchPriority high), qolganlari
 * sahifa yuklangach (lazy).
 */
export default function HeroShow({ names, alts, showCn, labels, copy, facts, seal, waveClass }: Props) {
  const n = HERO_SLIDES.length;
  const [index, setIndex] = useState(0);
  /** Qolgan rasmlar yuklanishi mumkin (sahifa yuklangandan keyin) */
  const [ready, setReady] = useState(false);
  /** Foydalanuvchi pauzani bosgan (reduced-motion'da boshidan to'xtagan) */
  const [stopped, setStopped] = useState(false);
  const [hover, setHover] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(true);

  const playing = ready && !stopped && !hover && !focused && inView && n > 1;

  const rootRef = useRef<HTMLElement | null>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const rodRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const ringRef = useRef<HTMLSpanElement | null>(null);
  /** Ekranda ko'rinib turgan slayd va borilayotgan slayd */
  const shown = useRef(0);
  const target = useRef(0);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const timerRef = useRef<gsap.core.Tween | null>(null);
  const kbRef = useRef<Map<number, gsap.core.Tween[]>>(new Map());
  const playingRef = useRef(false);
  const readyRef = useRef(false);
  const reducedRef = useRef(false);
  const goRef = useRef<(to: number, dir: number) => void>(() => {});

  // ---------- Ken Burns ----------
  const stopKB = useCallback((i: number) => {
    kbRef.current.get(i)?.forEach((t) => t.kill());
    kbRef.current.delete(i);
  }, []);

  const startKB = useCallback(
    (i: number) => {
      stopKB(i);
      const el = slideRefs.current[i];
      if (!el || reducedRef.current) return;
      const lg = window.matchMedia(LG).matches;
      const f: Frame = lg ? HERO_SLIDES[i].desk : HERO_SLIDES[i].mob;
      const kb = el.querySelector<HTMLElement>("[data-kb]");
      const img = el.querySelector<HTMLElement>("[data-main]");
      const tw: gsap.core.Tween[] = [];
      if (kb) tw.push(gsap.fromTo(kb, { scale: f.zoom[0], transformOrigin: f.origin }, { scale: f.zoom[1], duration: KB_DUR, ease: "none" }));
      if (img) {
        if (f.pan && !lg) tw.push(gsap.fromTo(img, { "--fx": f.pan[0] }, { "--fx": f.pan[1], duration: KB_DUR, ease: "sine.inOut" }));
        else img.style.removeProperty("--fx");
      }
      kbRef.current.set(i, tw);
    },
    [stopKB]
  );

  // ---------- Progress chiziqlari va avto-almashish taymeri ----------
  const setFills = useCallback((active: number) => {
    fillRefs.current.forEach((f, j) => f && gsap.set(f, { scaleX: j < active ? 1 : 0 }));
  }, []);

  const startTimer = useCallback(() => {
    timerRef.current?.kill();
    timerRef.current = null;
    const i = shown.current;
    setFills(i);
    const fill = fillRefs.current[i];
    if (!readyRef.current || n < 2 || !fill) return;
    timerRef.current = gsap.to(fill, {
      scaleX: 1,
      duration: DUR,
      ease: "none",
      paused: !playingRef.current,
      onComplete: () => goRef.current(shown.current + 1, 1),
    });
  }, [n, setFills]);

  // ---------- O'tishlar ----------
  /** Panjara tasmalari ("osma o'ramlar"): tepadan pastga, ketma-ket; uchida oltin tayoqcha */
  const lattice = useCallback((tl: gsap.core.Timeline, inEl: HTMLElement, dir: number, lg: boolean) => {
    const N = lg ? MAX_STRIPS : 5;
    const p = Array.from({ length: N }, () => ({ v: 0 }));
    const rods = rodRefs.current;
    rods.forEach((r, i) => r && gsap.set(r, { left: `${(i / N) * 100}%`, width: `${100 / N}%`, top: "0%", opacity: 0, display: i < N ? "block" : "none" }));
    const draw = () => {
      const pts: string[] = [];
      p.forEach((s, i) => {
        const x0 = (i / N) * 100;
        const x1 = ((i + 1) / N) * 100;
        const y = s.v * 100;
        pts.push(`${x0}% 0%`, `${x0}% ${y}%`, `${x1}% ${y}%`, `${x1}% 0%`);
        const r = rods[i];
        if (r) {
          r.style.top = `${y}%`;
          // Tayoqcha ochilish boshida paydo bo'lib, oxirida so'nadi
          r.style.opacity = String(Math.min(1, s.v * 8, (1 - s.v) * 5));
        }
      });
      inEl.style.clipPath = `polygon(${pts.join(",")})`;
    };
    draw();
    tl.to(p, { v: 1, duration: 1.25, ease: "expo.inOut", stagger: { each: 0.08, from: dir > 0 ? "start" : "end" }, onUpdate: draw }, 0);
    const par = inEl.querySelector("[data-par]");
    if (par) tl.fromTo(par, { yPercent: -4, scale: 1.1, transformOrigin: "50% 0%" }, { yPercent: 0, scale: 1, duration: 1.9, ease: "expo.out", clearProps: "transform" }, 0);
  }, []);

  /** Oy-darvoza: rasmning muhim nuqtasidan oltin halqali doira kengayadi */
  const moonGate = useCallback((tl: gsap.core.Timeline, inEl: HTMLElement, f: Frame) => {
    const w = inEl.offsetWidth;
    const h = inEl.offsetHeight;
    const [ox, oy] = f.origin.split(" ").map((v) => parseFloat(v) / 100);
    const cx = w * ox;
    const cy = h * oy;
    const R = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) + 8;
    const o = { r: 0 };
    const ring = ringRef.current;
    if (ring) gsap.set(ring, { left: cx, top: cy, width: 0, height: 0, opacity: 1 });
    const draw = () => {
      inEl.style.clipPath = `circle(${o.r}px at ${cx}px ${cy}px)`;
      if (ring) ring.style.width = ring.style.height = `${o.r * 2}px`;
    };
    draw();
    tl.to(o, { r: R, duration: 1.7, ease: "expo.inOut", onUpdate: draw }, 0);
    if (ring) tl.to(ring, { opacity: 0, duration: 0.5, ease: "power1.in" }, 0.9);
    const par = inEl.querySelector("[data-par]");
    if (par) tl.fromTo(par, { scale: 1.16, transformOrigin: f.origin }, { scale: 1, duration: 2.1, ease: "expo.out", clearProps: "transform" }, 0);
  }, []);

  /** Rasm yuklanib, dekod bo'lguncha kutish (ko'pi bilan 2.5 s) */
  const whenLoaded = useCallback((el: HTMLElement) => {
    const img = el.querySelector<HTMLImageElement>("[data-main]");
    if (!img) return Promise.resolve();
    img.loading = "eager";
    const wait = img.complete && img.naturalWidth > 0
      ? img.decode().catch(() => {})
      : new Promise<void>((res) => {
          img.addEventListener("load", () => res(), { once: true });
          img.addEventListener("error", () => res(), { once: true });
        });
    return Promise.race([wait, new Promise<void>((res) => setTimeout(res, 2500))]);
  }, []);

  const run = useCallback(
    (from: number, to: number, dir: number) => {
      const inEl = slideRefs.current[to];
      const outEl = slideRefs.current[from];
      if (!inEl || !outEl) return;
      const lg = window.matchMedia(LG).matches;
      const s = HERO_SLIDES[to];
      shown.current = to;
      gsap.set(inEl, { visibility: "visible", zIndex: 3 });
      gsap.set(outEl, { zIndex: 2 });
      startKB(to);

      const outDim = outEl.querySelector("[data-dim]");
      const outPar = outEl.querySelector("[data-par]");
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(outEl, { visibility: "hidden", zIndex: 1 });
          if (outDim) gsap.set(outDim, { opacity: 0 });
          if (outPar) gsap.set(outPar, { clearProps: "transform" });
          stopKB(from);
          inEl.style.clipPath = "";
          gsap.set(inEl, { zIndex: 2, clearProps: "opacity" });
          rodRefs.current.forEach((r) => r && gsap.set(r, { opacity: 0 }));
          if (ringRef.current) gsap.set(ringRef.current, { opacity: 0 });
          tlRef.current = null;
          startTimer();
        },
      });
      tlRef.current = tl;

      if (reducedRef.current) {
        // Harakatsiz: oddiy xira o'tish
        tl.fromTo(inEl, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.out" });
        return;
      }

      if (to % 2 === 1) lattice(tl, inEl, dir, lg);
      else moonGate(tl, inEl, lg ? s.desk : s.mob);

      // Chiqib ketayotgan rasm: biroz yaqinlashib, qorayadi (chuqurlik)
      if (outDim) tl.to(outDim, { opacity: 0.6, duration: 1.4, ease: "power2.in" }, 0);
      if (outPar) tl.to(outPar, { scale: 1.06, transformOrigin: "50% 50%", duration: 1.7, ease: "power2.inOut" }, 0);

      // Vertikal rasm (lg): oltin ramkali o'ram tepadan pastga ochiladi, pastki tayoqcha bilan
      if (s.tall && lg) {
        const clip = inEl.querySelector<HTMLElement>("[data-frame-clip]");
        const rod = inEl.querySelector<HTMLElement>("[data-rod-b]");
        if (clip) {
          const hgt = clip.offsetHeight;
          tl.fromTo(clip, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "power3.inOut", clearProps: "clipPath" }, 0.45);
          if (rod) tl.fromTo(rod, { y: -hgt }, { y: 0, duration: 1.6, ease: "power3.inOut", clearProps: "transform" }, 0.45);
        }
      }
    },
    [lattice, moonGate, startKB, startTimer, stopKB]
  );

  const go = useCallback(
    (raw: number, dir: number) => {
      if (n < 2) return;
      const to = ((raw % n) + n) % n;
      // Tugallanmagan o'tish darhol yakunlanadi
      tlRef.current?.progress(1);
      if (to === shown.current && to === target.current) return;
      target.current = to;
      setIndex(to);
      timerRef.current?.kill();
      timerRef.current = null;
      setFills(to);
      if (!readyRef.current) {
        readyRef.current = true;
        setReady(true);
      }
      const el = slideRefs.current[to];
      if (!el) return;
      // React "hidden" sinfini olib tashlashi uchun bir kadr kutamiz, keyin rasm yuklanishini
      requestAnimationFrame(() => {
        whenLoaded(el).then(() => {
          if (target.current !== to) return;
          // Kutilayotgan o'tishdan ko'rinib turgan slaydga qaytildi — faqat taymer qayta
          if (shown.current === to) {
            if (!tlRef.current) startTimer();
            return;
          }
          run(shown.current, to, dir);
        });
      });
    },
    [n, run, setFills, startTimer, whenLoaded]
  );
  goRef.current = go;

  // ---------- Boshlanish: reduced-motion, yuklanish, ko'rinish ----------
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = mq.matches;
    if (mq.matches) setStopped(true);
    startKB(0);

    // Qolgan rasmlar — sahifa to'liq yuklangach (LCP'ga xalaqit bermasin)
    let idle = 0;
    const markReady = () => {
      idle = window.setTimeout(() => {
        readyRef.current = true;
        setReady(true);
      }, 400);
    };
    if (document.readyState === "complete") markReady();
    else window.addEventListener("load", markReady, { once: true });
    // Dev rejimda "load" kech kelishi mumkin — 5 s dan keyin baribir
    const fallback = window.setTimeout(markReady, 5000);

    const el = rootRef.current;
    const io = el ? new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 }) : null;
    if (el && io) io.observe(el);

    // Telefon ↔ kompyuter kadrlashi almashsa (burilish, oyna o'lchami) — joriy slayd Ken Burns'i qayta
    const lgMq = window.matchMedia(LG);
    const onBp = () => {
      if (!tlRef.current) startKB(shown.current);
    };
    lgMq.addEventListener("change", onBp);

    const kbMap = kbRef.current;
    return () => {
      lgMq.removeEventListener("change", onBp);
      window.removeEventListener("load", markReady);
      window.clearTimeout(idle);
      window.clearTimeout(fallback);
      io?.disconnect();
      tlRef.current?.kill();
      timerRef.current?.kill();
      kbMap.forEach((tw) => tw.forEach((t) => t.kill()));
      kbMap.clear();
    };
  }, [startKB]);

  // Rasmlar tayyor bo'lgach — taymer
  useEffect(() => {
    if (ready && !tlRef.current && !timerRef.current) startTimer();
  }, [ready, startTimer]);

  // Pauza / davom
  useEffect(() => {
    playingRef.current = playing;
    const t = timerRef.current;
    if (t) {
      if (playing) t.play();
      else t.pause();
    }
  }, [playing]);

  // Ekrandan tashqarida Ken Burns ham to'xtaydi
  useEffect(() => {
    kbRef.current.forEach((tw) => tw.forEach((t) => (inView ? t.play() : t.pause())));
  }, [inView]);

  // Pauza/davom (reduced-motion'da foydalanuvchi o'zi yoqsa — almashadi, lekin Ken Burns'siz)
  const toggle = () => setStopped((v) => !v);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(target.current + 1, 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(target.current - 1, -1);
    }
  };

  const slide = HERO_SLIDES[index];

  return (
    <section
      ref={rootRef}
      aria-roledescription={labels.role}
      aria-label={labels.region}
      onFocus={(e) => {
        if ((e.target as HTMLElement).matches?.(":focus-visible")) setFocused(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      className="relative isolate overflow-hidden bg-night text-brand-cream [--hero-top:clamp(13rem,calc(100svh-30rem),52svh)]"
    >
      {/* ================= Sahna: slaydlar + qatlamlar (z-0 — ichki z-index'lar shu yerda qoladi, to'lqin ustida) ================= */}
      <div
        aria-live={playing ? "off" : "polite"}
        className="absolute inset-x-0 top-0 z-0 h-[calc(var(--hero-top)+11rem)] overflow-hidden lg:h-full"
      >
        {HERO_SLIDES.map((s, i) => {
          const first = i === 0;
          return (
            <div
              key={s.key}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              role="group"
              aria-roledescription={labels.slide}
              aria-label={`${i + 1} / ${n}: ${names[i]}`}
              aria-hidden={i !== index}
              className={cn("absolute inset-0 overflow-hidden", !first && (ready ? "invisible" : "hidden"))}
            >
              <div
                data-par
                className={cn(
                  "absolute inset-0",
                  // Sahifa ochilganda birinchi rasm sekin "o'tiradi"
                  first && "transition-[scale] duration-[2600ms] ease-out-expo starting:scale-[1.12] motion-reduce:transition-none"
                )}
              >
                {s.tall ? <TallSlide i={i} alt={alts[i]} first={first} /> : (
                  <div data-kb className="absolute inset-0">
                    <SlideImg i={i} alt={alts[i]} first={first} />
                  </div>
                )}
              </div>
              {/* Chiqib ketayotganda qorayish */}
              <div data-dim aria-hidden="true" className="pointer-events-none absolute inset-0 bg-night opacity-0" />
            </div>
          );
        })}

        {/* ---------- Rang va o'qilish qatlamlari (tokenlar) ---------- */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[4]">
          {/* Iliq "kechki" tus — kunduzgi rasmlar saytning qorong'i-oltin palitrasiga tushadi (filter/blend'siz — telefonda yengil) */}
          <span className="absolute inset-0 bg-wine/25" />
          <span className="absolute inset-0 bg-night/15" />
          <span className="absolute inset-0 bg-[radial-gradient(120%_90%_at_70%_30%,transparent_35%,var(--color-night)_115%)] opacity-80" />
          {/* Header ostida */}
          <span className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-night/80 via-night/25 to-transparent lg:h-56 lg:from-night/85 lg:via-night/35" />
          {/* Chap tomonda matn uchun (lg) */}
          <span className="absolute inset-y-0 left-0 hidden w-[72%] bg-gradient-to-r from-night/90 via-night/55 to-transparent lg:block" />
          {/* Pastda: telefonda rasm tungi fonga eriydi, kompyuterda raqamlar lentasi uchun */}
          <span className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-night via-night/75 to-transparent lg:h-[48%] lg:via-night/60" />
          <span className="absolute -left-40 bottom-[-12rem] hidden size-[48rem] bg-[radial-gradient(closest-side,var(--color-fire-deep),transparent)] opacity-30 lg:block" />
          {/* Kirish pardasi */}
          <span className="absolute inset-0 bg-night opacity-0 transition-opacity duration-[1600ms] ease-out starting:opacity-60 motion-reduce:transition-none" />
        </div>

        {/* ---------- O'tish effektlari: oltin tayoqchalar va oy-darvoza halqasi ---------- */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5]">
          {Array.from({ length: MAX_STRIPS }, (_, i) => (
            <span
              key={i}
              ref={(el) => {
                rodRefs.current[i] = el;
              }}
              className="absolute top-0 h-[3px] -translate-y-1/2 rounded-full bg-gradient-to-r from-brand-gold via-brand-gold-light to-brand-gold opacity-0 shadow-[0_2px_10px] shadow-night/70"
            />
          ))}
          <span
            ref={ringRef}
            className="absolute size-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-gold-light/80 opacity-0 outline outline-1 outline-offset-[10px] outline-brand-gold/35"
          />
        </div>
      </div>

      {/* Chap tomonda nozik panjara naqsh (matn foni) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 [mask-image:linear-gradient(to_top,black,transparent_55%)] lg:[mask-image:linear-gradient(to_right,black,transparent_45%)]">
        <span className="lattice-bg absolute inset-0 text-brand-gold/[0.06]" />
      </div>

      {/* ================= Chap chet (keng ekranda): vertikal xitoycha yozuv, muhr va scroll ko'rsatkichi =================
          O'ng chet — sayt bo'ylab ScrollRail'niki, shuning uchun bezaklar chapda */}
      <div aria-hidden="true" className="pointer-events-none absolute bottom-28 left-6 top-[27%] z-10 hidden flex-col items-center justify-between min-[1400px]:flex 2xl:left-12">
        <div className="flex flex-col items-center gap-4">
          <span className="h-16 w-px bg-gradient-to-b from-transparent to-brand-gold/70" />
          <p key={index} lang="zh" className="font-cn text-2xl leading-[1.2] tracking-[0.3em] text-brand-gold-light [writing-mode:vertical-rl]">
            {Array.from(slide.verse).map((ch, i) => (
              <span
                key={i}
                className="inline-block transition-[opacity,translate] duration-700 ease-out starting:-translate-y-2 starting:opacity-0 motion-reduce:transition-none"
                style={{ transitionDelay: `${250 + i * 110}ms` }}
              >
                {ch}
              </span>
            ))}
          </p>
          <span lang="zh" className="flex size-10 items-center justify-center rounded-[3px] bg-fire font-cn text-sm leading-none text-brand-cream shadow-lg shadow-night/50 [writing-mode:vertical-rl]">
            长安
          </span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.45em] text-brand-cream/75 [writing-mode:vertical-rl]">{labels.scroll}</span>
          <span className="relative h-16 w-px overflow-hidden bg-brand-cream/20">
            <span className="scroll-cue-dot absolute left-[-2.5px] top-1 size-1.5 rounded-full bg-brand-gold-light motion-reduce:[animation:none]" />
          </span>
        </div>
      </div>

      {/* ================= Muhr (ixtiyoriy) ================= */}
      {seal && (
        <div className="pointer-events-none absolute right-4 top-[calc(var(--hero-top)-5.25rem)] z-10 size-16 transition-[opacity,scale] delay-[1100ms] duration-[1200ms] ease-out-expo starting:scale-75 starting:opacity-0 motion-reduce:transition-none sm:right-8 sm:top-[calc(var(--hero-top)-7rem)] sm:size-24 lg:bottom-[16rem] lg:right-[max(4.5rem,calc(50vw-38rem))] lg:top-auto lg:size-28">
          {seal}
        </div>
      )}

      {/* ================= Kontent =================
          md+ da o'ng chetda sayt ScrollRail'i turadi — kontent unga tegmasin (md:pr-[4.5rem]) */}
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col px-5 pb-20 pt-[var(--hero-top)] sm:px-8 sm:pb-24 md:pr-[4.5rem] min-[1344px]:pr-8 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:grid-rows-[1fr_auto] lg:pb-28 lg:pt-32">
        {/* ---------- HUD: [hisoblagich · xitoycha nom | boshqaruv] / [slayd nomi | progress] ---------- */}
        <div
          onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
          onPointerLeave={() => setHover(false)}
          onKeyDown={onKey}
          className="order-first mb-6 flex flex-col gap-3 transition-opacity delay-[1000ms] duration-1000 starting:opacity-0 motion-reduce:transition-none lg:order-none lg:col-start-2 lg:row-start-2 lg:mb-0 lg:w-[21rem] lg:gap-4 lg:border-t lg:border-brand-gold/25 lg:pl-8 lg:pt-6 xl:w-[26rem] xl:pl-10"
        >
          <div className="flex items-center gap-4">
            {/* Hisoblagich (raqam pastdan aylanib chiqadi) + xitoycha nom */}
            <p aria-hidden="true" className="flex min-w-0 flex-1 items-baseline gap-1.5 font-display leading-none tabular-nums">
              <span className="relative inline-block overflow-hidden text-3xl text-brand-gold-light lg:text-[2.75rem]">
                <span key={index} className="block transition-[translate,opacity] duration-700 ease-out-expo starting:translate-y-full starting:opacity-0 motion-reduce:transition-none">
                  {pad(index + 1)}
                </span>
              </span>
              <span className="text-sm text-brand-cream/60 lg:text-base">/ {pad(n)}</span>
              {showCn && (
                <span key={`c${index}`} lang="zh" className="ml-2 font-cn text-base text-brand-gold-light/85 transition-opacity duration-700 starting:opacity-0 motion-reduce:transition-none lg:ml-3 lg:text-xl">
                  {slide.cn}
                </span>
              )}
            </p>
            <div className="flex shrink-0 gap-2">
              <button type="button" data-hero-prev onClick={() => go(target.current - 1, -1)} aria-label={labels.prev} className={BTN}>
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <button type="button" onClick={toggle} aria-label={stopped ? labels.play : labels.pause} className={BTN}>
                {stopped ? <Play size={15} className="translate-x-px" aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
              </button>
              <button type="button" data-hero-next onClick={() => go(target.current + 1, 1)} aria-label={labels.next} className={BTN}>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Slayd nomi (joy yetmasa — progress qisqaradi, keyin nom) */}
            <p key={`n${index}`} className="flex min-w-0 shrink items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-cream/90 transition-[opacity,translate] duration-700 ease-out-expo starting:translate-y-1.5 starting:opacity-0 motion-reduce:transition-none lg:gap-3 lg:tracking-[0.22em]">
              <span aria-hidden="true" className="h-px w-5 shrink-0 bg-brand-gold/60 lg:w-8" />
              <span className="truncate">{names[index]}</span>
            </p>
            {/* Progress: har slayd uchun chiziq, faoli 6.5 s da to'ladi */}
            <div aria-hidden="true" className="flex min-w-16 flex-1 gap-1.5">
              {HERO_SLIDES.map((s, i) => (
                <span key={s.key} className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-brand-cream/20">
                  <span
                    ref={(el) => {
                      fillRefs.current[i] = el;
                    }}
                    className="absolute inset-0 origin-left bg-gradient-to-r from-brand-gold to-brand-gold-light [transform:scaleX(0)]"
                  />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ---------- Sarlavha, tavsif, tugmalar ---------- */}
        <div
          className="order-2 lg:order-none lg:col-span-2 lg:row-start-1 lg:self-end lg:pb-10"
          // Tugmalar ustida turganda almashmasin
          onPointerOver={(e) => {
            if (e.pointerType === "mouse") setHover(!!(e.target as HTMLElement).closest?.("[data-hero-cta]"));
          }}
          onPointerLeave={() => setHover(false)}
        >
          {copy}
        </div>

        {/* ---------- Raqamlar lentasi ---------- */}
        <div className="order-3 mt-10 lg:order-none lg:col-start-1 lg:row-start-2 lg:mt-0">{facts}</div>
      </div>

      <Wave className={waveClass} />
    </section>
  );
}

/** Slayd rasmi: telefonda balandlik bo'yicha (kengligi --fx bilan suriladi), kompyuterda object-cover */
function SlideImg({ i, alt, first, className }: { i: number; alt: string; first: boolean; className?: string }) {
  const s = HERO_SLIDES[i];
  const p = s.photo;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      data-main
      src={p.md}
      srcSet={srcSetOf(p)}
      sizes={s.tall ? "(min-width: 1024px) 420px, 100vw" : "(max-width: 1023px) 250vw, 100vw"}
      width={p.w}
      height={p.h}
      alt={alt}
      loading={first ? "eager" : "lazy"}
      fetchPriority={first ? "high" : "low"}
      decoding={first ? "auto" : "async"}
      draggable={false}
      className={cn(
        "absolute top-0 h-full w-auto min-w-full max-w-none select-none object-cover",
        "left-[calc(var(--fx)*1%)] [translate:calc(var(--fx)*-1%)_0] [object-position:50%_calc(var(--fy)*1%)]",
        s.pos,
        className
      )}
    />
  );
}

/**
 * Vertikal rasm. Telefonda — oddiy to'liq slayd. lg+ da: tungi panjara fon (iliq nur bilan), o'ngda oltin
 * qo'sh ramkali "osma o'ram" (tepa/past tayoqchalar), yonida katta vertikal 长安大饭店.
 */
function TallSlide({ i, alt, first }: { i: number; alt: string; first: boolean }) {
  return (
    <>
      {/* lg: atmosfera foni — tungi lak, panjara naqsh, iliq yog'och nuri (filter'siz) */}
      <div aria-hidden="true" className="absolute inset-0 hidden overflow-hidden bg-night-2 lg:block">
        <span className="absolute inset-0 bg-[radial-gradient(60%_70%_at_72%_42%,var(--color-wine),transparent)] opacity-90" />
        <span className="absolute inset-0 bg-[radial-gradient(30%_40%_at_70%_45%,var(--color-fire-deep),transparent)] opacity-50" />
        <span className="lattice-bg absolute inset-0 text-brand-gold/[0.08]" />
      </div>

      {/* Ramka: telefonda to'liq ekran, lg da o'ngdagi osma o'ram */}
      <div
        data-frame
        className="absolute inset-0 lg:inset-auto lg:bottom-[17rem] lg:right-[max(4.5rem,calc(50vw-38rem))] lg:top-[8.5rem] lg:aspect-[3/4]"
      >
        {/* Ramka chapida katta vertikal yozuv (lavhadagi 長安大飯店) */}
        <p
          aria-hidden="true"
          lang="zh"
          className="font-cn absolute right-full top-0 mr-8 hidden text-6xl leading-[1.12] text-brand-gold/60 [writing-mode:vertical-rl] lg:block xl:mr-12 xl:text-7xl"
        >
          长安大饭店
        </p>
        <span aria-hidden="true" className="absolute -inset-x-3 -top-2.5 z-[2] hidden h-2.5 rounded-full bg-gradient-to-b from-brand-gold-light to-brand-gold shadow-md shadow-night/60 lg:block" />
        <div data-frame-clip className="absolute inset-0 overflow-hidden lg:border lg:border-brand-gold/70 lg:shadow-2xl lg:shadow-night/80">
          <div data-kb className="absolute inset-0">
            <SlideImg i={i} alt={alt} first={first} />
          </div>
          <span aria-hidden="true" className="absolute inset-[6px] hidden border border-brand-gold/35 lg:block" />
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 hidden h-1/3 bg-gradient-to-t from-night/70 to-transparent lg:block" />
        </div>
        <span data-rod-b aria-hidden="true" className="absolute -inset-x-3 -bottom-2.5 z-[2] hidden h-2.5 rounded-full bg-gradient-to-b from-brand-gold-light to-brand-gold shadow-md shadow-night/60 lg:block" />
      </div>
    </>
  );
}
