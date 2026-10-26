"use client";

import { Flame, Leaf } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn, currencyOf, formatMoney, hasPrice } from "@/lib/utils";
import { SPICY_KEYS } from "./data";

/** Achchiqlik (olov belgilari) va vegetarian bargi — ekran o'quvchi uchun matn bilan */
export function SpicyVeg({ spicy, veg, tone = "light", className }: { spicy: number; veg: boolean; tone?: "light" | "dark"; className?: string }) {
  const t = useTranslations("Home2");
  if (!spicy && !veg) return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {spicy > 0 && (
        <span className="inline-flex items-center" title={t(`spicy.${SPICY_KEYS[spicy]}`)}>
          {Array.from({ length: spicy }).map((_, i) => (
            <Flame key={i} size={14} aria-hidden="true" className={cn("-mx-px", tone === "dark" ? "fill-saffron/30 text-saffron" : "fill-fire/20 text-fire-ink")} />
          ))}
          <span className="sr-only">{t(`spicy.${SPICY_KEYS[spicy]}`)}</span>
        </span>
      )}
      {veg && (
        <span className="inline-flex items-center" title={t("veg")}>
          <Leaf size={14} aria-hidden="true" className={tone === "dark" ? "fill-leaf/30 text-leaf" : "fill-jade/15 text-jade"} />
          <span className="sr-only">{t("veg")}</span>
        </span>
      )}
    </span>
  );
}

/** Narx: chegirma bo'lsa eski narx ustidan chiziladi; narx belgilanmagan (0) bo'lsa — hech narsa ko'rsatilmaydi */
export function Price({ price, oldPrice, className, oldClassName }: { price: number; oldPrice: number | null; className?: string; oldClassName?: string }) {
  const cur = currencyOf(useLocale());
  if (!hasPrice(price)) return null;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className={cn("whitespace-nowrap", className)}>{formatMoney(price, cur)}</span>
      {oldPrice != null && <s className={cn("whitespace-nowrap text-sm", oldClassName)}>{formatMoney(oldPrice, cur)}</s>}
    </span>
  );
}
