import { cn } from "@/lib/utils";

/**
 * "Biz haqimizda" bo'limi bezaklari (faqat ko'rinish, aria-hidden):
 * osma qog'oz o'rama (mo'yqalam she'r), oltin burchak qavslari, ingichka chiziqli ikonlar (namuna 04).
 */

/**
 * Osma qog'oz o'rama (挂轴): yog'och tayoqchalar, krem qog'oz, ikki ustunli vertikal she'r va qizil muhr.
 * Li Bo: «长安一片月，万户捣衣声» — "Chang'an uzra bir parcha oy, minglab xonadondan kir yuvish sadosi".
 */
export function PoemScroll({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none relative flex flex-col items-center", className)}>
      {/* osma ip */}
      <svg viewBox="0 0 100 40" className="-mb-px w-[70%] text-brand-gold/70">
        <path d="M6 40 L50 4 L94 40" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="50" cy="4" r="3" fill="currentColor" />
      </svg>
      {/* yuqori tayoqcha */}
      <span className="relative z-10 block h-2.5 w-[118%] rounded-full bg-gradient-to-b from-wine to-wine-deep shadow-md shadow-night">
        <span className="absolute -left-1 top-1/2 size-3 -translate-y-1/2 rounded-full bg-brand-gold" />
        <span className="absolute -right-1 top-1/2 size-3 -translate-y-1/2 rounded-full bg-brand-gold" />
      </span>
      {/* qog'oz */}
      <div className="relative w-full overflow-hidden bg-brand-cream px-[14%] pb-[16%] pt-[18%] shadow-2xl shadow-night">
        <span className="absolute inset-x-[7%] inset-y-[3%] border border-brand-gold/40" />
        <div className="relative flex flex-row-reverse justify-center gap-[10%]">
          <span lang="zh" className="font-cn text-lg leading-[1.15] text-brand-ink [writing-mode:vertical-rl] sm:text-[1.6rem]">长安一片月</span>
          <span lang="zh" className="font-cn mt-[40%] text-lg leading-[1.15] text-brand-ink/80 [writing-mode:vertical-rl] sm:text-[1.6rem]">万户捣衣声</span>
        </div>
        <span lang="zh" className="font-cn relative mx-auto mt-[14%] flex size-7 items-center justify-center rounded-[3px] bg-fire text-[0.7rem] leading-none text-brand-cream [writing-mode:vertical-rl] sm:size-9 sm:text-sm">
          李白
        </span>
      </div>
      {/* pastki tayoqcha */}
      <span className="relative z-10 block h-3 w-[118%] rounded-full bg-gradient-to-b from-wine to-wine-deep shadow-md shadow-night">
        <span className="absolute -left-1.5 top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-brand-gold" />
        <span className="absolute -right-1.5 top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-brand-gold" />
      </span>
    </div>
  );
}

/** To'rt burchakdagi ingichka oltin qavslar (ota `relative` bo'lsin) */
export function GoldCorners({ className, inset = "-inset-2.5" }: { className?: string; inset?: string }) {
  const c = "absolute size-6 border-brand-gold/80";
  return (
    <span aria-hidden="true" className={cn("pointer-events-none absolute", inset, className)}>
      <span className={cn(c, "left-0 top-0 border-l border-t")} />
      <span className={cn(c, "right-0 top-0 border-r border-t")} />
      <span className={cn(c, "bottom-0 left-0 border-b border-l")} />
      <span className={cn(c, "bottom-0 right-0 border-b border-r")} />
    </span>
  );
}

/* ---------- Ingichka oltin chiziqli ikonlar (viewBox 48, rang — text-*) ---------- */

const ICON = { fill: "none", stroke: "currentColor", strokeWidth: 1.3, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Yangi masalliqlar — bok-choy bargi */
export function IconLeaf({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className={className} {...ICON}>
      <path d="M24 44 C 24 34, 24 24, 26 14" />
      <path d="M26 14 C 18 8, 9 12, 9 22 C 9 31, 17 36, 24 34" />
      <path d="M26 14 C 34 8, 41 13, 40 23 C 39 31, 31 35, 25 33" />
      <path d="M24 26 L 15 20 M24 31 L 14 27 M25 24 L 33 19 M25 29 L 35 26" opacity="0.7" />
    </svg>
  );
}

/** Asl retseptlar — kosa va palochkalar */
export function IconBowl({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className={className} {...ICON}>
      <path d="M6 24 H42" />
      <path d="M8 24 C 9 34, 16 39, 24 39 C 32 39, 39 34, 40 24" />
      <path d="M18 42 H30" />
      <path d="M28 21 L 42 5 M32 22 L 45 8" />
      <path d="M16 18 C 14 15, 18 13, 16 9 M22 18 C 20 15, 24 13, 22 9" opacity="0.7" />
    </svg>
  );
}

/** Vok olovi — vok va alanga */
export function IconWok({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className={className} {...ICON}>
      <path d="M4 20 H34 C 34 27, 27 32, 19 32 C 11 32, 4 27, 4 20 Z" />
      <path d="M34 21 L 45 17" />
      <path d="M12 44 C 9 40, 13 38, 12 35 C 15 37, 16 40, 14 44 M20 45 C 17 40, 21 38, 20 34 C 24 37, 25 41, 22 45 M28 44 C 25 40, 29 38, 28 35 C 31 37, 32 40, 30 44" />
      <path d="M12 15 C 12 12, 15 11, 14 7 M20 15 C 20 12, 23 11, 22 7" opacity="0.7" />
    </svg>
  );
}

/** Mehr bilan — choynak */
export function IconTeapot({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className={className} {...ICON}>
      <path d="M11 22 C 11 33, 16 39, 24 39 C 32 39, 37 33, 37 22 Z" />
      <path d="M16 22 C 17 17, 20 15, 24 15 C 28 15, 31 17, 32 22" />
      <path d="M24 15 V12 M21 12 H27" />
      <path d="M37 25 C 43 24, 44 32, 37 33" />
      <path d="M11 27 C 6 26, 4 22, 3 18" />
      <path d="M14 43 H34" opacity="0.7" />
    </svg>
  );
}
