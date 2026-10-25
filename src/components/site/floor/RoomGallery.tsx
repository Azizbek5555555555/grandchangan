"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Photo } from "@/lib/photos";
import { cn } from "@/lib/utils";
import RoomPhoto from "./RoomPhoto";

/**
 * Tanlangan xonaning haqiqiy rasmi (panelda): katta rasm + ostida kichik rasmchalar (almashtirish).
 * Rasm yo'q xona (Xona 1/2) — ieroglifli zaxira panel va "tez orada" yozuvi.
 * Xona/stol almashganda chaqiruvchi `key` beradi — tanlov birinchi rasmga qaytadi.
 */
export default function RoomGallery({
  photos,
  glyph,
  label,
  className,
}: {
  photos: Photo[];
  /** Xona turi belgisi (muhr va zaxira uchun) */
  glyph: string;
  /** Rasm ustidagi qisqa yozuv (xona turi: "VIP xona") */
  label: string;
  className?: string;
}) {
  const tp = useTranslations("Pages2");
  const ts = useTranslations("Site");
  const [index, setIndex] = useState(0);
  const i = Math.min(index, Math.max(0, photos.length - 1));
  const cur = photos[i] ?? null;

  return (
    <figure className={cn("min-w-0", className)}>
      <div className="relative isolate aspect-[16/10] overflow-hidden rounded-2xl bg-night-3 ring-1 ring-brand-gold/30 lg:aspect-[4/3]">
        <RoomPhoto
          key={cur?.src ?? "none"}
          photo={cur}
          glyph={glyph}
          glyphSize="text-7xl sm:text-8xl"
          sizes="(min-width: 1560px) 630px, 40vw"
          imgClassName="animate-kenburns"
        />
        {/* Matn o'qilishi uchun pastki qorong'i qatlam va ichki oltin ramka */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-night/90 via-night/40 to-transparent" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-2 rounded-[12px] border border-brand-gold/30" />
        <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
          <span className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              lang="zh"
              className="font-cn flex size-9 shrink-0 items-center justify-center rounded-[4px] bg-fire text-lg leading-none text-brand-cream shadow-lg shadow-night/40"
            >
              {glyph}
            </span>
            <span className="min-w-0 text-[11px] font-semibold uppercase leading-snug tracking-[0.22em] text-brand-cream [overflow-wrap:anywhere]">
              {cur ? label : ts("gallerySoon")}
            </span>
          </span>
          {photos.length > 1 && (
            <span className="shrink-0 rounded-full border border-brand-gold/30 bg-night/70 px-2.5 py-1 text-[11px] tabular-nums text-brand-cream/90">
              {i + 1} / {photos.length}
            </span>
          )}
        </figcaption>
      </div>

      {photos.length > 1 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {photos.map((p, n) => (
            <button
              key={p.src}
              type="button"
              onClick={() => setIndex(n)}
              aria-pressed={n === i}
              aria-label={tp("floorPhotoN", { n: n + 1 })}
              className={cn(
                "relative h-11 w-14 shrink-0 overflow-hidden rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-light",
                n === i ? "ring-2 ring-brand-gold" : "opacity-60 ring-1 ring-brand-cream/15 hover:opacity-100"
              )}
            >
              <RoomPhoto photo={p} glyph={glyph} glyphSize="text-base" decorative />
            </button>
          ))}
        </div>
      )}
    </figure>
  );
}
