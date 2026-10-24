"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Rasm + zaxira: zaxira (fallback) doim ostida turadi, rasm ustidan yuklanadi.
 * Rasm yuklanmasa (404, fayl serveri o'chiq) — rasm olib tashlanadi va chiroyli zaxira ko'rinib qoladi
 * (hech qachon "singan rasm" belgisi yoki bo'sh kulrang quti emas).
 */
export default function SafeImg({
  src, alt = "", className, imgClassName, fallback, eager = false,
}: {
  src: string | null;
  alt?: string;
  /** Konteyner klasslari (o'lcham, shakl) */
  className?: string;
  imgClassName?: string;
  fallback: React.ReactNode;
  /** Birinchi ekrandagi rasmlar uchun */
  eager?: boolean;
}) {
  const ref = useRef<HTMLImageElement | null>(null);
  const [failed, setFailed] = useState(false);

  // Hydration'dan oldin xato bo'lgan rasm (onError allaqachon o'tib ketgan)
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0">{fallback}</div>
      {src && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
          className={cn("absolute inset-0 h-full w-full object-cover", imgClassName)}
        />
      )}
    </div>
  );
}
