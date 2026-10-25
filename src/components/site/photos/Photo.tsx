"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { srcSetOf, type Pic } from "./pics";

/**
 * Restoran rasmi: srcSet (md + katta) + sizes, muhim nuqta (object-position), lazy/async.
 * Rasm yo'q yoki yuklanmasa — chiroyli zaxira (fallback) ko'rinadi; yuklanayotganda konteyner
 * foni (className'dagi bg-*) turadi. Birinchi ekrandagi rasm uchun priority (eager + fetchPriority high).
 */
export default function Photo({
  pic, alt = "", sizes = "100vw", className, imgClassName, fallback, priority = false, pos,
}: {
  pic: Pic | null;
  alt?: string;
  /** <img sizes> — ramkaning ekrandagi taxminiy kengligi */
  sizes?: string;
  /** Konteyner klasslari (o'lcham, shakl, fon) */
  className?: string;
  imgClassName?: string;
  fallback?: React.ReactNode;
  priority?: boolean;
  /** pic.pos ni shu joy uchun almashtirish */
  pos?: string;
}) {
  const ref = useRef<HTMLImageElement | null>(null);
  const [failed, setFailed] = useState(false);
  const src = pic?.src ?? null;

  useEffect(() => {
    setFailed(false);
    // Hydration'dan oldin xato bo'lgan rasm (onError allaqachon o'tib ketgan)
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, [src]);

  const show = !!pic && !failed;
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!show && fallback && <div className="absolute inset-0">{fallback}</div>}
      {show && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={pic.md ?? pic.src}
          srcSet={srcSetOf(pic)}
          sizes={pic.md ? sizes : undefined}
          width={pic.w}
          height={pic.h}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onError={() => setFailed(true)}
          style={{ objectPosition: pos ?? pic.pos ?? "50% 50%" }}
          className={cn("absolute inset-0 h-full w-full object-cover", imgClassName)}
        />
      )}
    </div>
  );
}
