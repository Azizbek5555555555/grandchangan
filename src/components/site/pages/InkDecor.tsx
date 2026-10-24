import { cn } from "@/lib/utils";

/**
 * Xitoy tush rasmi (shan shui) uslubidagi bezaklar (namuna: 冶春 sayti): tumanli tog'lar,
 * pagoda/ayvon silueti, uchayotgan qushlar, qizil muhr. Rang — text-* klassi (fill=currentColor).
 */

/** Qatlam-qatlam tumanli tog'lar (pastki chetga qo'yiladi) */
export function Mountains({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 1440 320" preserveAspectRatio="none" className={cn("pointer-events-none", className)}>
      <path d="M0 210 C 90 150, 150 120, 230 160 C 300 196, 340 120, 420 96 C 500 72, 560 150, 640 168 C 720 186, 780 110, 860 90 C 950 66, 1010 140, 1090 150 C 1180 162, 1240 92, 1330 110 C 1390 122, 1420 150, 1440 160 L1440 320 L0 320 Z" fill="currentColor" opacity="0.35" />
      <path d="M0 250 C 120 200, 200 190, 300 222 C 380 248, 460 176, 560 168 C 660 160, 720 230, 820 236 C 920 242, 990 186, 1090 180 C 1200 174, 1280 236, 1440 220 L1440 320 L0 320 Z" fill="currentColor" opacity="0.55" />
      <path d="M0 290 C 160 262, 300 270, 440 286 C 580 302, 700 262, 860 270 C 1020 278, 1160 300, 1300 288 C 1370 282, 1410 276, 1440 278 L1440 320 L0 320 Z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

/** Ikki qavatli ayvon (pagoda) silueti — qayrilgan tom uchlari bilan */
export function Pavilion({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 240 300" className={cn("pointer-events-none", className)}>
      <g fill="currentColor">
        <path d="M120 8 L128 30 L112 30 Z" />
        <path d="M30 78 C 60 70, 90 46, 120 30 C 150 46, 180 70, 210 78 C 196 80, 186 84, 178 90 L62 90 C 54 84, 44 80, 30 78 Z" />
        <rect x="70" y="90" width="100" height="44" />
        <path d="M8 160 C 50 150, 86 128, 120 112 C 154 128, 190 150, 232 160 C 214 162, 202 168, 192 176 L48 176 C 38 168, 26 162, 8 160 Z" />
        <rect x="52" y="176" width="136" height="84" />
        <rect x="20" y="260" width="200" height="14" />
        <rect x="6" y="274" width="228" height="10" />
      </g>
      <g className="fill-paper" opacity="0.85">
        <rect x="84" y="100" width="18" height="28" />
        <rect x="111" y="100" width="18" height="28" />
        <rect x="138" y="100" width="18" height="28" />
        <rect x="66" y="190" width="24" height="70" />
        <rect x="100" y="190" width="40" height="70" />
        <rect x="150" y="190" width="24" height="70" />
      </g>
    </svg>
  );
}

/** Uchayotgan qushlar (tush cho'tkasi bilan) */
export function Birds({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 220 90" fill="none" className={cn("pointer-events-none", className)}>
      <g stroke="currentColor" strokeLinecap="round" strokeWidth="2.4">
        <path d="M10 40 C 22 28, 32 30, 40 40 C 48 30, 60 28, 72 38" />
        <path d="M110 18 C 118 10, 126 12, 131 19 C 136 12, 144 10, 152 17" />
        <path d="M160 62 C 167 55, 174 56, 178 62 C 182 56, 189 55, 196 61" />
      </g>
    </svg>
  );
}

/** Qizil muhr (印章): kvadrat, ichida vertikal ieroglif */
export function SealStamp({ text, className }: { text: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      lang="zh"
      className={cn(
        "font-cn inline-flex size-12 items-center justify-center rounded-[4px] bg-fire text-base leading-none text-brand-cream [writing-mode:vertical-rl]",
        className
      )}
    >
      {text}
    </span>
  );
}

/** Vertikal xitoycha sarlavha (o'ngdan chapga, yuqoridan pastga) */
export function VerticalTitle({ text, className }: { text: string; className?: string }) {
  return (
    <p aria-hidden="true" lang="zh" className={cn("font-cn m-0 leading-[1.15] tracking-[0.18em] [writing-mode:vertical-rl]", className)}>
      {text}
    </p>
  );
}
