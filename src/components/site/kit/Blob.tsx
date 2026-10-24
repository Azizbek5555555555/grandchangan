import { cn } from "@/lib/utils";

/** Organik shakllar (viewBox 600×600) — namuna 2 dagi qizil "dog'"lar */
const PATHS = {
  a: "M421,72 C503,110 566,196 571,288 C576,384 521,486 434,537 C350,586 236,590 150,546 C62,500 14,404 24,306 C34,206 98,112 186,70 C262,34 348,38 421,72 Z",
  b: "M300,40 C410,30 540,90 560,210 C580,330 520,440 420,500 C320,560 180,560 100,480 C20,400 30,270 80,180 C130,90 200,48 300,40 Z",
  c: "M330,28 C450,40 560,120 572,250 C584,380 500,470 400,530 C300,590 170,572 96,490 C22,408 18,300 60,200 C102,100 210,16 330,28 Z",
} as const;

type Props = {
  /** O'lcham, joylashuv va rang (text-*) klasslari */
  className?: string;
  variant?: keyof typeof PATHS;
};

/** Dekorativ blob. Rang — text-* klassi (fill=currentColor). Faqat bezak: aria-hidden. */
export default function Blob({ className, variant = "a" }: Props) {
  return (
    <svg aria-hidden="true" viewBox="0 0 600 600" className={cn("pointer-events-none", className)}>
      <path d={PATHS[variant]} fill="currentColor" />
    </svg>
  );
}
