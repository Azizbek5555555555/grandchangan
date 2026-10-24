"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Buzilgan/yo'q rasm o'rniga chiroyli zaxira (fallback) ko'rsatadigan <img>.
 * SSR'da yuklanib ulgurmagan va hydration'dan oldin xato bergan rasmlar ham ushlanadi
 * (onError React ulanmasdan oldin sodir bo'lishi mumkin — shuning uchun mount'da tekshiramiz).
 */
export default function SafeImg({
  src, alt = "", className, fallback, loading = "lazy",
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  /** Rasm bo'lmasa yoki yuklanmasa — shu chiziladi (masalan <DishFallback />) */
  fallback: React.ReactNode;
  loading?: "lazy" | "eager";
}) {
  const ref = useRef<HTMLImageElement | null>(null);
  const [broken, setBroken] = useState(!src);

  useEffect(() => {
    setBroken(!src);
  }, [src]);

  useEffect(() => {
    const el = ref.current;
    // Yuklanish tugagan, lekin o'lchami 0 — demak xato bilan tugagan
    if (el && el.complete && el.naturalWidth === 0) setBroken(true);
  }, [src]);

  if (broken || !src) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
      onError={() => setBroken(true)}
    />
  );
}
