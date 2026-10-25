"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { srcSetOf, type Pic } from "@/components/site/photos/pics";

export type GalleryGroup = "hall" | "vip" | "booth" | "decor" | "outside";
/** group yo'q — bazadagi (admin yuklagan) rasm: faqat "Barchasi" ro'yxatida */
export type GridItem = { pic: Pic; caption: string; alt: string; glyph: string; group?: GalleryGroup };

type Labels = { close: string; prev: string; next: string; open: string; filters: string; all: string; groups: Record<GalleryGroup, string> };

const GROUP_ORDER: GalleryGroup[] = ["hall", "vip", "booth", "decor", "outside"];

/**
 * Galereya: bo'limlar bo'yicha filtr (zal, VIP, kabinka, detallar, tashqi) va qatorma-qator to'r —
 * saralangan tartib saqlanadi; gorizontal rasm 4:3 katak, vertikal rasm 2 qatorli baland katak
 * (grid-flow-dense bo'shliqlarni to'ldiradi). Izoh va oltin ramka hover/fokusda. Lightbox: katta o'lcham,
 * izoh, klaviatura (Esc, ←, →) va telefonda surish (swipe). Yuklanmagan rasm ro'yxatdan olib tashlanadi.
 */
export default function GalleryGrid({ items, labels }: { items: GridItem[]; labels: Labels }) {
  const [filter, setFilter] = useState<GalleryGroup | "all">("all");
  const [broken, setBroken] = useState<Record<string, true>>({});
  const [open, setOpen] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const touch = useRef<number | null>(null);

  const groups = useMemo(() => GROUP_ORDER.filter((g) => items.some((it) => it.group === g)), [items]);
  const list = useMemo(
    () => items.filter((it) => !broken[it.pic.src] && (filter === "all" || it.group === filter)),
    [items, broken, filter]
  );
  const n = list.length;

  const close = useCallback(() => {
    setOpen(null);
    // Fokus lightbox'ni ochgan rasmga qaytadi
    opener.current?.focus();
  }, []);
  const step = useCallback((d: number) => setOpen((i) => (i === null || n === 0 ? i : (i + d + n) % n)), [n]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, step]);

  // Qo'shni rasmlarni oldindan yuklab qo'yamiz — almashganda kutilmasin
  useEffect(() => {
    if (open === null || n < 2) return;
    [list[(open + 1) % n], list[(open - 1 + n) % n]].forEach((it) => {
      const im = new Image();
      im.src = it.pic.src;
    });
  }, [open, list, n]);

  const cur = open !== null ? list[open] : null;

  return (
    <>
      {/* ---------- Filtr ---------- */}
      {groups.length > 1 && (
        <div role="group" aria-label={labels.filters} className="-mx-5 mb-8 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          {(["all", ...groups] as const).map((g) => {
            const on = filter === g;
            const count = g === "all" ? items.filter((it) => !broken[it.pic.src]).length : items.filter((it) => it.group === g && !broken[it.pic.src]).length;
            return (
              <button
                key={g}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(g)}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire",
                  on ? "border-fire bg-fire text-brand-cream" : "border-line bg-card text-content hover:border-fire/60"
                )}
              >
                {g === "all" ? labels.all : labels.groups[g]}
                <span className={cn("text-xs font-normal", on ? "text-brand-cream/80" : "text-muted")}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ---------- To'r ---------- */}
      <div className="grid grid-flow-row-dense grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {list.map((it, i) => {
          const tall = !!(it.pic.w && it.pic.h && it.pic.h > it.pic.w);
          return (
            <button
              key={it.pic.src}
              type="button"
              onClick={(e) => {
                opener.current = e.currentTarget;
                setOpen(i);
              }}
              aria-label={`${labels.open}: ${it.caption || it.alt || i + 1}`}
              className={cn(
                "group relative block w-full overflow-hidden rounded-2xl bg-sand shadow-md shadow-content/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-fire/40",
                tall ? "row-span-2 min-h-64" : "aspect-[4/3]"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.pic.md ?? it.pic.src}
                srcSet={srcSetOf(it.pic)}
                sizes="(min-width: 1024px) 300px, (min-width: 640px) 33vw, 50vw"
                width={it.pic.w}
                height={it.pic.h}
                alt={it.alt}
                loading="lazy"
                decoding="async"
                onError={() => setBroken((b) => ({ ...b, [it.pic.src]: true }))}
                style={{ objectPosition: it.pic.pos }}
                className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out-expo group-hover:scale-105"
              />
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-night/80 via-night/5 to-transparent opacity-70 transition duration-500 group-hover:opacity-100 group-focus-visible:opacity-100" />
              <span aria-hidden="true" className="absolute inset-2 scale-[1.02] rounded-[12px] border border-brand-gold/50 opacity-0 transition duration-500 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100" />
              {it.caption && (
                <span aria-hidden="true" className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 text-left sm:inset-x-4 sm:bottom-4">
                  <span className="min-w-0 truncate font-display text-sm text-brand-cream sm:text-base">{it.caption}</span>
                  <span lang="zh" className="font-cn shrink-0 text-lg leading-none text-brand-gold-light">{it.glyph}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Portal: Reveal transform'i ichida fixed ekranni to'liq qoplamasdi; data-lenis-prevent — fon scroll qilmasin */}
      {cur && open !== null && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={cur.caption || labels.open}
          data-lenis-prevent
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-night/95 p-4 backdrop-blur-sm sm:p-8"
          onClick={close}
          onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touch.current === null) return;
            const dx = e.changedTouches[0].clientX - touch.current;
            touch.current = null;
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
          }}
        >
          <figure className="relative flex max-h-full max-w-full flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={cur.pic.src}
              src={cur.pic.src}
              alt={cur.alt}
              width={cur.pic.w}
              height={cur.pic.h}
              className="max-h-[78vh] w-auto max-w-full rounded-2xl bg-night-3 object-contain shadow-2xl shadow-night animate-[rv-in_600ms_var(--ease-out-expo)_both] motion-reduce:animate-none"
            />
            <figcaption className="mt-4 flex max-w-full items-center gap-3 rounded-full bg-night-3 px-4 py-1.5 text-sm text-brand-cream/85">
              <span lang="zh" aria-hidden="true" className="font-cn text-base leading-none text-saffron">{cur.glyph}</span>
              {cur.caption && <span className="min-w-0 truncate font-display">{cur.caption}</span>}
              <span translate="no" className="shrink-0 text-brand-cream/60">{open + 1} / {n}</span>
            </figcaption>
          </figure>
          <button type="button" onClick={close} aria-label={labels.close} autoFocus className="absolute right-4 top-4 flex size-12 items-center justify-center rounded-full bg-night-3 text-brand-cream transition hover:bg-fire">
            <X size={22} />
          </button>
          {n > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label={labels.prev} className={cn(navBtn, "left-3 sm:left-6")}>
                <ChevronLeft size={24} />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label={labels.next} className={cn(navBtn, "right-3 sm:right-6")}>
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}

const navBtn = "absolute top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-night-3/90 text-brand-cream transition hover:bg-fire";
