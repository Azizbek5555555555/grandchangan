"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import SafeImg from "./SafeImg";
import { GlyphPanel } from "./Decor";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export type GalleryItem = { src: string; caption: string };

const CHARS = ["宴", "茶", "福", "龙", "灯", "春", "月", "安"];
const TONES = ["night", "wine", "night", "fire", "night", "wine", "night", "fire"] as const;
const two = (n: number) => String(n).padStart(2, "0");

/**
 * Galereya lentasi (namuna 11 — vertikal panellar). Har bir rasm o'z katagida, kataklar hech qachon
 * bir-birining ustiga chiqmaydi (parallaks faqat rasm ICHIDA, ramka joyida turadi).
 * - Kompyuter (lg+): 3–8 vertikal panel bir qatorda; faol panel kengayadi (hover/fokus yoki
 *   ko'rinishda bo'lganda sekin avtomatik almashadi).
 * - Telefon/planshet: aniq 2 ustunli setka — birinchi rasm keng, toq qolgan oxirgisi ham keng.
 */
export default function GalleryStrip({
  items, openLabel, pauseLabel, playLabel,
}: { items: GalleryItem[]; openLabel: string; pauseLabel: string; playLabel: string }) {
  const root = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const [hold, setHold] = useState(false);
  const [inView, setInView] = useState(false);
  /** Foydalanuvchi pauza tugmasini bosgan (WCAG 2.2.2) */
  const [stopped, setStopped] = useState(false);
  const [motionOk, setMotionOk] = useState(false);
  const n = items.length;

  // Ko'rinishdagina avtomatik almashish: faqat kompyuter lentasida (telefonda setka), reduced-motion'da yo'q
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setMotionOk(true);
    const desk = window.matchMedia("(min-width: 1024px)");
    let visible = false;
    const sync = () => setInView(visible && desk.matches);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: 0.35 });
    io.observe(el);
    desk.addEventListener?.("change", sync);
    return () => {
      io.disconnect();
      desk.removeEventListener?.("change", sync);
    };
  }, []);
  useEffect(() => {
    if (!inView || hold || stopped || n < 2) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % n), 4200);
    return () => window.clearInterval(id);
  }, [inView, hold, stopped, n]);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const cells = el.querySelectorAll<HTMLElement>("[data-cell]");
      gsap.from(cells, {
        y: 60, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.08,
        scrollTrigger: { trigger: el, start: "top 82%", once: true },
      });
      // Rasm ichidagi yengil parallaks — ramka joyida qoladi
      el.querySelectorAll<HTMLElement>("[data-img]").forEach((img) => {
        gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
      });
    },
    { scope: root }
  );

  const label = (i: number) => (items[i].caption ? `${openLabel}: ${items[i].caption}` : `${openLabel} — ${two(i + 1)}`);

  return (
    // Sichqoncha chiqib ketsa ham klaviatura fokusi lenta ichida bo'lsa — faol panel joyida qoladi
    <div ref={root} onMouseLeave={() => setHold(!!root.current?.contains(document.activeElement))}>
      {/* ---------- Kompyuter: vertikal panellar lentasi ---------- */}
      <div className="hidden h-[540px] gap-3 lg:flex xl:h-[580px]">
        {items.map((it, i) => {
          const on = active === i;
          return (
            <Link
              key={it.src + i}
              href="/gallery"
              data-cell
              aria-label={label(i)}
              onMouseEnter={() => { setActive(i); setHold(true); }}
              onFocus={() => { setActive(i); setHold(true); }}
              onBlur={(e) => setHold(!!root.current?.contains(e.relatedTarget as Node | null))}
              className={cn(
                "group relative min-w-0 basis-0 overflow-hidden rounded-[22px] bg-night shadow-xl shadow-content/10 transition-[flex-grow] duration-700 ease-out-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire",
                on ? "grow-[5]" : "grow"
              )}
            >
              <Frame item={it} i={i} sizes="text-7xl" />
              <span aria-hidden="true" className={cn("absolute inset-0 bg-gradient-to-t from-night/85 via-night/20 to-night/30 transition duration-700", on ? "opacity-100" : "opacity-90")} />
              {/* oltin ichki ramka (faol panel) */}
              <span aria-hidden="true" className={cn("absolute inset-3 rounded-[16px] border border-brand-gold/55 transition duration-700", on ? "scale-100 opacity-100" : "scale-[1.03] opacity-0")} />

              {/* yig'ilgan holat: vertikal yorliq */}
              <span
                aria-hidden="true"
                className={cn("absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 transition duration-500", on ? "translate-y-4 opacity-0" : "opacity-100")}
              >
                <span lang="zh" className="font-cn text-3xl leading-none text-brand-gold-light">{CHARS[i % CHARS.length]}</span>
                <span className="h-10 w-px bg-brand-gold/50" />
                <span className="text-xs font-semibold tracking-[0.2em] text-brand-cream/80">{two(i + 1)}</span>
              </span>

              {/* ochilgan holat: izoh */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-9 transition duration-700 ease-out-expo",
                  on ? "translate-y-0 opacity-100 delay-200" : "translate-y-6 opacity-0"
                )}
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-3 text-xs font-semibold tracking-[0.24em] text-saffron">
                    {two(i + 1)} <span className="h-px w-8 bg-saffron/60" /> {two(n)}
                  </span>
                  {it.caption && <span className="mt-3 block max-w-md truncate font-display text-3xl text-brand-cream">{it.caption}</span>}
                </span>
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-brand-gold/60 text-brand-gold-light transition group-hover:bg-brand-gold group-hover:text-brand-ink">
                  <ArrowUpRight size={18} />
                </span>
              </span>
              <span aria-hidden="true" lang="zh" className={cn("font-cn absolute right-7 top-7 text-2xl leading-[1.1] text-brand-cream/85 [writing-mode:vertical-rl] transition duration-700", on ? "opacity-100" : "opacity-0")}>
                {CHARS[i % CHARS.length]}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Avto-almashishni to'xtatish/davom ettirish */}
      {motionOk && n > 1 && (
        <div className="mt-4 hidden justify-end lg:flex">
          <button
            type="button"
            onClick={() => setStopped((v) => !v)}
            aria-label={stopped ? playLabel : pauseLabel}
            aria-pressed={stopped}
            className="flex size-11 items-center justify-center rounded-full border border-content/25 text-content transition hover:border-fire-ink hover:text-fire-ink focus-visible:outline-2 focus-visible:outline-fire"
          >
            {stopped ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
          </button>
        </div>
      )}

      {/* ---------- Telefon/planshet: aniq setka ---------- */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:hidden">
        {items.map((it, i) => {
          const wide = i === 0 || (i === n - 1 && (n - 1) % 2 === 1);
          return (
            <Link
              key={it.src + i}
              href="/gallery"
              data-cell
              aria-label={label(i)}
              className={cn(
                "group relative min-w-0 overflow-hidden rounded-[18px] bg-night shadow-lg shadow-content/10",
                wide ? "col-span-2 aspect-[16/10]" : "aspect-[4/5]"
              )}
            >
              <Frame item={it} i={i} sizes="text-[5rem]" />
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-night/75 via-transparent to-transparent" />
              <span aria-hidden="true" className="absolute inset-2 rounded-[13px] border border-brand-gold/35" />
              <span aria-hidden="true" className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold tracking-[0.22em] text-saffron">{two(i + 1)} / {two(n)}</span>
                  {it.caption && <span className={cn("mt-1 block truncate font-display text-brand-cream", wide ? "text-xl" : "text-base")}>{it.caption}</span>}
                </span>
                <span lang="zh" className="font-cn shrink-0 text-xl leading-none text-brand-gold-light">{CHARS[i % CHARS.length]}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** Rasm (parallaks uchun biroz kattaroq, ramka ichida) + yuklanmasa ieroglif paneli */
function Frame({ item, i, sizes }: { item: GalleryItem; i: number; sizes: string }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div data-img className="absolute inset-x-0 -inset-y-[8%]">
        <SafeImg
          src={item.src}
          alt=""
          className="h-full w-full"
          imgClassName="transition duration-[1400ms] ease-out-expo group-hover:scale-105"
          fallback={<GlyphPanel char={CHARS[i % CHARS.length]} tone={TONES[i % TONES.length]} size={sizes} />}
        />
      </div>
    </div>
  );
}
