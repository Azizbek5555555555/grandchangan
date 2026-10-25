import { cn } from "@/lib/utils";
import { Mountains } from "@/components/site/pages/InkDecor";

/** Yulduzlar: [left %, top %, o'lcham px] — qat'iy joylar (SSR/hydration bir xil) */
const STARS: [number, number, number][] = [
  [8, 14, 2], [17, 32, 1.5], [26, 9, 1.5], [38, 22, 2], [47, 6, 1.5], [55, 30, 1.5], [63, 12, 2],
  [72, 40, 1.5], [81, 8, 1.5], [91, 26, 2], [96, 48, 1.5], [33, 44, 1.5], [4, 52, 1.5],
];

/** Qayrilgan tomli ayvon (亭) silueti — tom uchlari tepaga qayrilgan, derazalarida chiroq */
function Pagoda({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 260 300" className={cn("pointer-events-none", className)}>
      <g fill="currentColor">
        {/* shpil */}
        <rect x="127" y="4" width="6" height="26" />
        <circle cx="130" cy="8" r="5" />
        {/* yuqori tom */}
        <path d="M40 74 C 30 66, 22 60, 14 62 C 52 58, 92 42, 130 26 C 168 42, 208 58, 246 62 C 238 60, 230 66, 220 74 Z" />
        <rect x="74" y="74" width="112" height="46" />
        {/* pastki tom */}
        <path d="M18 158 C 8 150, 2 144, -6 146 C 42 140, 92 120, 130 104 C 168 120, 218 140, 266 146 C 258 144, 252 150, 242 158 Z" />
        <rect x="48" y="158" width="164" height="96" />
        {/* zina va poydevor */}
        <rect x="30" y="254" width="200" height="14" />
        <rect x="14" y="268" width="232" height="32" />
      </g>
      <g className="fill-saffron" opacity="0.75">
        <rect x="90" y="86" width="16" height="26" rx="1" />
        <rect x="122" y="86" width="16" height="26" rx="1" />
        <rect x="154" y="86" width="16" height="26" rx="1" />
        <rect x="66" y="176" width="26" height="62" rx="1" />
        <rect x="168" y="176" width="26" height="62" rx="1" />
      </g>
      <g className="fill-saffron-deep" opacity="0.9">
        <rect x="108" y="172" width="44" height="82" rx="1" />
      </g>
      {/* osilgan fonarchalar */}
      <g className="fill-fire">
        <ellipse cx="40" cy="176" rx="7" ry="9" />
        <ellipse cx="220" cy="176" rx="7" ry="9" />
      </g>
      <g className="stroke-brand-gold" strokeWidth="1.2">
        <line x1="40" y1="158" x2="40" y2="167" />
        <line x1="220" y1="158" x2="220" y2="167" />
      </g>
    </svg>
  );
}

/**
 * Footer'ning tungi manzarasi (shan shui uslubi): yulduzli osmon, to'lin oy va bulut iplari,
 * qatlam-qatlam tush tog'lari, tog' yonbag'rida chirog'i yongan ayvon. Faqat bezak (aria-hidden).
 * Ota element `relative` bo'lishi kerak; manzara uni to'liq qoplaydi va pastki chekkasi bg-night ga qo'shiladi.
 */
export default function NightScene({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      {/* Osmon: ufqda iliq vino nuri */}
      <span className="absolute inset-0 bg-gradient-to-b from-night via-night-2 to-night" />
      <span className="absolute -inset-x-1/4 bottom-[6%] h-[55%] rounded-[50%] bg-wine-deep/70 blur-3xl" />
      <span className="lattice-bg absolute inset-0 text-brand-gold/[0.03]" />
      {STARS.map(([l, t, s]) => (
        <span
          key={`${l}-${t}`}
          className="absolute rounded-full bg-brand-cream/60"
          style={{ left: `${l}%`, top: `${t}%`, width: s, height: s }}
        />
      ))}

      {/* Oy: nur halqasi + disk + bulut iplari */}
      <div className="absolute right-[6%] top-[7%] sm:right-[10%] lg:right-[14%] lg:top-[12%]">
        <span className="absolute left-1/2 top-1/2 size-[230%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-gold/10 blur-2xl" />
        <span className="absolute left-1/2 top-1/2 size-[150%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-gold/15" />
        <span className="relative block size-24 rounded-full bg-gradient-to-br from-brand-cream via-brand-cream to-brand-gold-light opacity-90 sm:size-32 lg:size-44" />
        <span className="absolute -left-10 top-[58%] h-[3px] w-[150%] rounded-full bg-gradient-to-r from-transparent via-night-2 to-transparent" />
        <span className="absolute -right-6 top-[72%] h-[2px] w-[110%] rounded-full bg-gradient-to-r from-transparent via-night-2/90 to-transparent" />
      </div>

      {/* Tog'lar: uzoq (oltin-tush), o'rta (vino), yaqin (tun) — ayvon o'rta qatlamda turadi */}
      <Mountains className="absolute inset-x-0 bottom-0 h-56 w-full text-brand-gold/15 sm:h-72 lg:h-80" />
      <Pagoda className="absolute bottom-12 right-[8%] w-24 text-night-2 sm:bottom-14 sm:w-32 lg:bottom-16 lg:right-[20%] lg:w-40" />
      <Mountains className="absolute inset-x-0 bottom-0 h-32 w-full -scale-x-100 text-wine/60 sm:h-40 lg:h-48" />
      <Mountains className="absolute inset-x-0 bottom-0 h-20 w-full text-night sm:h-24 lg:h-28" />
      <span className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-night to-night/0" />
    </div>
  );
}
