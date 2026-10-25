"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import ButtonLink from "@/components/site/kit/ButtonLink";
import { Seal } from "@/components/site/home/Decor";
import type { CellTone } from "./DishCell";

/** Bezak katakcha turlari: shior (vertikal mo'yqalam yozuv) yoki stol band qilish taklifi */
export type FillKind = "motto" | "reserve";

/**
 * Taomlar orasidagi "bo'sh joy" o'rniga nafis katakcha. Faqat xl (3 ustun) da kerak bo'lganda ko'rinadi —
 * klassni (masalan "hidden xl:flex") chaqiruvchi beradi.
 */
export function FillerCell({
  kind, tone = "night", className, cnText, title, sub,
}: {
  kind: FillKind;
  tone?: CellTone;
  className?: string;
  /** Shior uchun boshqa xitoycha yozuv (masalan choy uchun 一杯清茶) */
  cnText?: string;
  title?: string;
  sub?: string;
}) {
  const m = useTranslations("Menu2");
  const s = useTranslations("Site");
  const night = tone === "night";

  return (
    <div
      className={cn(
        "relative isolate flex-col overflow-hidden border-b border-r",
        night ? "border-brand-gold/15 bg-night-2" : "border-line bg-paper",
        className
      )}
    >
      <span aria-hidden="true" className={cn("lattice-bg absolute inset-0 -z-10", night ? "text-brand-gold/[0.05]" : "text-fire/[0.05]")} />
      {kind === "motto" ? (
        <div data-rv className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
          <span aria-hidden="true" className={cn("h-14 w-px", night ? "bg-brand-gold/40" : "bg-fire/30")} />
          <span
            lang="zh"
            aria-hidden="true"
            className={cn("font-cn text-5xl leading-[1.15] [writing-mode:vertical-rl]", night ? "text-brand-gold-light" : "text-fire-ink")}
          >
            {cnText ?? "一品一味"}
          </span>
          <span aria-hidden="true" className={cn("h-14 w-px", night ? "bg-brand-gold/40" : "bg-fire/30")} />
          <p className={cn("font-display text-xl italic", night ? "text-brand-cream" : "text-content")}>{title ?? m("motto")}</p>
          <p className={cn("max-w-[15rem] text-sm leading-relaxed", night ? "text-brand-cream/70" : "text-muted")}>{sub ?? m("mottoSub")}</p>
        </div>
      ) : (
        <div data-rv className="flex h-full flex-col justify-between gap-8 p-8">
          <div className="flex items-start justify-between gap-4">
            <Seal text="订座" className="px-1.5 py-2 text-2xl" />
            <span aria-hidden="true" className={cn("mt-3 h-px flex-1", night ? "bg-brand-gold/25" : "bg-line")} />
          </div>
          <div>
            <p className={cn("font-display text-3xl leading-[1.1]", night ? "text-brand-cream" : "text-content")}>{title ?? s("reserveTitle")}</p>
            <p className={cn("mt-4 text-sm leading-relaxed", night ? "text-brand-cream/70" : "text-muted")}>{sub ?? s("reserveSub")}</p>
          </div>
          <ButtonLink href="/reservation" variant={night ? "gold-outline" : "ghost-dark"} size="md" className="group self-start">
            {s("reserveBtn")}
            <ArrowRight size={16} aria-hidden="true" className="transition group-hover:translate-x-1" />
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
