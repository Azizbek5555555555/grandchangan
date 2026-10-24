"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Galereya: pog'onali (masonry) to'r + klaviatura bilan boshqariladigan lightbox (Esc, ←, →) */
export default function GalleryGrid({ urls, labels }: { urls: string[]; labels: { close: string; prev: string; next: string; open: string } }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + urls.length) % urls.length)), [urls.length]);

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

  return (
    <>
      <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4">
        {urls.map((u, i) => (
          <button
            key={u + i}
            type="button"
            onClick={() => setOpen(i)}
            aria-label={`${labels.open} ${i + 1}`}
            className="group relative mb-3 block w-full overflow-hidden rounded-2xl bg-sand sm:mb-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-fire/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" loading="lazy" decoding="async" className="w-full transition duration-700 group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-t from-night/50 to-transparent opacity-0 transition group-hover:opacity-100" />
          </button>
        ))}
      </div>

      {open !== null && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[70] flex items-center justify-center bg-night/95 p-4 backdrop-blur-sm" onClick={close}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urls[open]} alt="" className="max-h-[86vh] max-w-full rounded-2xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
          <button type="button" onClick={close} aria-label={labels.close} autoFocus className="absolute right-4 top-4 flex size-12 items-center justify-center rounded-full bg-night-3 text-brand-cream transition hover:bg-fire">
            <X size={22} />
          </button>
          {urls.length > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label={labels.prev} className={cn(navBtn, "left-3 sm:left-6")}>
                <ChevronLeft size={24} />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label={labels.next} className={cn(navBtn, "right-3 sm:right-6")}>
                <ChevronRight size={24} />
              </button>
            </>
          )}
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-night-3 px-4 py-1.5 text-sm text-brand-cream/80">{open + 1} / {urls.length}</p>
        </div>
      )}
    </>
  );
}

const navBtn = "absolute top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-night-3 text-brand-cream transition hover:bg-fire";
