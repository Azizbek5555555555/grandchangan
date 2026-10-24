import { cn } from "@/lib/utils";

/** To'lqin shakllari (viewBox 1440×100, pastki qismi to'la) */
const PATHS = {
  a: "M0 60 C 240 112, 480 8, 720 52 C 960 96, 1200 18, 1440 56 L1440 100 L0 100 Z",
  b: "M0 46 C 240 96, 480 6, 720 44 C 960 84, 1200 12, 1440 52 L1440 100 L0 100 Z",
  c: "M0 70 C 180 30, 360 30, 540 62 C 720 94, 900 96, 1080 60 C 1260 26, 1350 34, 1440 50 L1440 100 L0 100 Z",
} as const;

type Props = {
  /** Rang text-* klassi bilan beriladi (masalan "text-paper") — keyingi bo'lim rangi */
  className?: string;
  variant?: keyof typeof PATHS;
  /** true — bo'limning TEPA chetiga (oldingi bo'lim rangi pastga oqib tushadi) */
  top?: boolean;
};

/**
 * Bo'limlar orasidagi to'lqinli chegara (namuna 1 uslubi). Ota element `relative` bo'lishi kerak.
 * Pastki chetga qo'yilganda — keyingi bo'lim rangida, tepaga qo'yilganda — oldingi bo'lim rangida.
 */
export default function Wave({ className, variant = "a", top = false }: Props) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 100"
      preserveAspectRatio="none"
      className={cn(
        "pointer-events-none absolute inset-x-0 z-[1] block h-12 w-full sm:h-16 lg:h-20",
        top ? "top-0 -translate-y-px rotate-180" : "bottom-0 translate-y-px",
        className
      )}
    >
      <path d={PATHS[variant]} fill="currentColor" />
    </svg>
  );
}
