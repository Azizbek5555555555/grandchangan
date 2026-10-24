"use client";

import { Flame, Leaf } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn, formatMoney } from "@/lib/utils";
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
            <Flame key={i} size={14} aria-hidden="true" className={cn("-mx-px", tone === "dark" ? "fill-saffron/30 text-saffron" : "fill-fire/20 text-fire")} />
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

/** Narx: chegirma bo'lsa eski narx ustidan chiziladi */
export function Price({ price, oldPrice, className, oldClassName }: { price: number; oldPrice: number | null; className?: string; oldClassName?: string }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className={cn("whitespace-nowrap", className)}>{formatMoney(price)}</span>
      {oldPrice != null && <s className={cn("whitespace-nowrap text-sm", oldClassName)}>{formatMoney(oldPrice)}</s>}
    </span>
  );
}
