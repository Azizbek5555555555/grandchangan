import { cn } from "@/lib/utils";

/**
 * Xitoycha chiziqli bezaklar (namuna 1): "xiangyun" bulut jingalagi va "huiwen" burchak naqshi.
 * Rang — text-* klassi (stroke=currentColor). Faqat bezak: aria-hidden.
 */

/** Xiangyun (祥云) — bulut jingalagi chizig'i, sarlavha ostida yoki bo'lim chetida */
export function CloudLine({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 160 40" fill="none" className={cn("pointer-events-none", className)}>
      <g stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 32 H44 C34 32 28 24 32 17 C36 10 48 11 49 19 C50 25 43 27 40 23 C38 20 41 17 44 19" />
        <path d="M44 32 H116 C104 32 98 20 106 12 C114 4 130 8 130 19 C130 27 120 29 118 23 C116 18 122 15 125 19" />
        <path d="M116 32 H158" />
        <circle cx={80} cy={32} r={2.4} fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

/** Huiwen (回纹) burchagi — karta/ramka burchagiga qo'yiladi. rotate bilan 4 burchakka */
export function FretCorner({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" fill="none" className={cn("pointer-events-none", className)}>
      <path
        d="M2 46 V2 H46 M10 46 V10 H38 V30 H20 V20 H28"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="square"
      />
    </svg>
  );
}

/** Ingichka ajratgich: chiziq — romb — chiziq (sarlavhalar ostida) */
export function KnotDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex items-center gap-3", className)}>
      <span className="h-px flex-1 bg-current opacity-40" />
      <span className="h-2 w-2 rotate-45 border border-current" />
      <span className="h-1.5 w-1.5 rotate-45 bg-current" />
      <span className="h-2 w-2 rotate-45 border border-current" />
      <span className="h-px flex-1 bg-current opacity-40" />
    </div>
  );
}
