"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Photo } from "@/lib/photos";
import { cn } from "@/lib/utils";
import { GlyphPanel } from "@/components/site/home/Decor";
import { mdWidth, photoFocus } from "./roomPhotos";

/**
 * Xona rasmi: ostida doim ieroglifli zaxira panel, ustida rasm (yuklanmasa — olib tashlanadi).
 * Katta rasm (sizes berilsa): telefonda faqat md, katta ekranda srcSet (md + asl) — brauzer o'zi tanlaydi.
 * Kichik rasmcha (sizes yo'q): faqat md. Hammasi lazy (bo'lim birinchi ekranda emas).
 * Ota element o'lchamini to'ldiradi.
 */
export default function RoomPhoto({
  photo,
  glyph,
  sizes,
  className,
  imgClassName,
  glyphSize = "text-3xl",
  decorative = false,
}: {
  photo: Photo | null;
  /** Zaxira panel belgisi (xona turi) */
  glyph: string;
  /** Katta ekrandagi ko'rinish kengligi (masalan "(min-width: 1560px) 690px, 46vw") */
  sizes?: string;
  className?: string;
  imgClassName?: string;
  /** Zaxira ieroglif o'lchami (rasmcha — kichik, katta rasm — katta) */
  glyphSize?: string;
  /** Bezak rasm (masalan, nomi bor tugma ichida) — alt bo'sh */
  decorative?: boolean;
}) {
  const t = useTranslations("Photos");
  const ref = useRef<HTMLImageElement | null>(null);
  const [failed, setFailed] = useState(false);

  // Hydration'dan oldin xato bo'lgan rasm (onError allaqachon o'tib ketgan)
  useEffect(() => {
    setFailed(false);
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, [photo?.src]);

  const img = photo && !failed && (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={photo.md}
      alt={decorative ? "" : t(photo.kind)}
      width={photo.w}
      height={photo.h}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("absolute inset-0 h-full w-full object-cover", photoFocus(photo), imgClassName)}
    />
  );

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <GlyphPanel char={glyph} tone="night" className="absolute inset-0" size={glyphSize} />
      {img && photo && sizes ? (
        <picture>
          <source media="(min-width: 1024px)" srcSet={`${photo.md} ${mdWidth(photo)}w, ${photo.src} ${photo.w}w`} sizes={sizes} />
          {img}
        </picture>
      ) : img}
    </div>
  );
}
