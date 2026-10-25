import TextReveal from "@/components/motion/TextReveal";
import { cn } from "@/lib/utils";

/**
 * Ichki sahifa hero'lari uchun umumiy bo'laklar. Har sahifaning o'z kompozitsiyasi bor
 * (heroes/*Hero.tsx), lekin sarlavha, eyebrow va kirish animatsiyasi bir xil qoidaga bo'ysunadi:
 * sarlavha kesilmasin (leading ≥ 1.05), uzun ruscha so'z 320px ga sig'sin, reduced-motion'da harakat yo'q.
 */

/** Sof CSS kirish animatsiyasi (@starting-style) — JS'siz ham kontent ko'rinadi */
export const ENTER =
  "transition-[opacity,translate] duration-[1100ms] ease-out-expo starting:translate-y-6 starting:opacity-0 motion-reduce:transition-none";

/** Sahifa sarlavhasi (h1) — so'zma-so'z ochiladi */
export function HeroTitle({ text, className }: { text: string; className?: string }) {
  return <TextReveal as="h1" trigger="load" text={text} className={cn("text-balance", className)} />;
}

/** Kichik ustki yozuv: xitoycha belgi + matn + chiziq */
export function HeroEyebrow({
  cn: cnText, text, tone = "dark", className,
}: { cn?: string; text: string; tone?: "dark" | "light"; className?: string }) {
  const dark = tone === "dark";
  return (
    <p className={cn(ENTER, "flex flex-wrap items-center gap-x-3 gap-y-1", className)}>
      {cnText && (
        <span aria-hidden="true" lang="zh" className={cn("font-cn text-2xl leading-none sm:text-3xl", dark ? "text-saffron" : "text-fire-ink")}>
          {cnText}
        </span>
      )}
      <span className={cn("text-[11px] font-semibold uppercase tracking-[0.32em] sm:text-xs", dark ? "text-brand-cream/80" : "text-muted")}>{text}</span>
      <span aria-hidden="true" className={cn("h-px w-12", dark ? "bg-brand-gold/60" : "bg-fire/40")} />
    </p>
  );
}
