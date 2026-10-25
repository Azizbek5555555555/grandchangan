import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Ingichka "huiwen" (回纹) lenta — header pastki chegarasi, mobil menyu va footer uchun.
 * globals.css dagi `.fret-band` 24px qotirilgan; bu yerda balandlik `h-*` klassi bilan, plitka o'lchami
 * `tile` bilan beriladi. Rang — `text-*` klassi (fon currentColor, shakl — SVG niqob).
 */
const SHAPES = {
  // Klassik ilmoq (fret-band bilan bir xil shakl)
  hook: "M0 22H40M8 22V3H32V16H16V9H24",
  // Ikki tomonlama "qadam" — pastki va yuqori chiziq orasida
  step: "M0 2H40M0 22H40M6 22V8H20V16H14M26 2V16H34V8",
} as const;

export default function Fret({
  className,
  tile = 20,
  shape = "hook",
}: {
  className?: string;
  /** Plitka kengligi (px); balandlik 24/40 nisbatda */
  tile?: number;
  shape?: keyof typeof SHAPES;
}) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='24' viewBox='0 0 40 24'><path d='${SHAPES[shape]}' fill='none' stroke='black' stroke-width='2.4'/></svg>`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}") repeat-x left center / ${tile}px ${(tile * 24) / 40}px`;
  const style: CSSProperties = { WebkitMask: url, mask: url };
  return <span aria-hidden="true" className={cn("block w-full bg-current", className)} style={style} />;
}
