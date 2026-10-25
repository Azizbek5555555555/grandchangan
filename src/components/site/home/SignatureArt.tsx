import { cn } from "@/lib/utils";
import SafeImg from "./SafeImg";
import { PorcelainPlate } from "./ShowcaseArt";

/**
 * "Mashhur taomlar" bezaklari (namuna 07: qora tosh tagcha ustida qora tarelka, qizil gul barglari).
 * Faqat ko'rinish; ranglar tokenlar orqali.
 */

/** Qizil gul bargi (viewBox 60×40). Rang — fill tokeni orqali */
export function Petal({ className, ...rest }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 60 40" {...rest} className={cn("pointer-events-none", className)}>
      <path d="M2 22 C 10 4, 38 -2, 58 12 C 50 30, 26 42, 2 22 Z" className="fill-fire" />
      <path d="M2 22 C 10 4, 38 -2, 58 12 C 40 10, 20 14, 2 22 Z" className="fill-fire-deep" opacity="0.55" />
      <path d="M6 21 C 22 16, 38 13, 54 13" fill="none" className="stroke-wine" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

/**
 * Qora tosh tagcha ustidagi tarelka: qiyshiq kvadrat tosh, oltin enso halqasi,
 * qora hoshiyali dumaloq taom rasmi (rasm yo'q bo'lsa — chinni tarelka). Ota kengligini to'ldiradi.
 */
export function SlatePlate({
  src, alt, glyph, glyphSize = "text-6xl", tilt = 8, className, eager,
}: {
  src: string | null;
  alt: string;
  glyph: string;
  glyphSize?: string;
  /** Tosh tagchaning burilishi (daraja) */
  tilt?: number;
  className?: string;
  eager?: boolean;
}) {
  return (
    <div className={cn("relative aspect-square w-full", className)}>
      {/* tosh tagcha */}
      <span
        data-slate
        aria-hidden="true"
        className="absolute inset-[7%] rounded-[12px] bg-night-3 shadow-2xl shadow-night ring-1 ring-brand-cream/[0.06]"
        style={{ rotate: `${tilt}deg` }}
      >
        <span className="lattice-bg absolute inset-0 rounded-[inherit] text-brand-gold/[0.05]" />
        <span className="absolute inset-[5%] rounded-[8px] border border-brand-gold/15" />
      </span>
      {/* oltin enso */}
      <svg aria-hidden="true" viewBox="0 0 200 200" className="animate-spin-slow absolute inset-[4%] text-brand-gold/45">
        <circle cx="100" cy="100" r="97" fill="none" stroke="currentColor" strokeWidth="0.7" strokeDasharray="1 5" strokeLinecap="round" />
      </svg>
      {/* tarelka */}
      <div data-plate className="absolute inset-[14%] rounded-full bg-night p-[4%] shadow-2xl shadow-night ring-1 ring-brand-cream/10">
        <SafeImg
          src={src}
          alt={alt}
          eager={eager}
          className="size-full rounded-full"
          imgClassName="transition duration-[1400ms] ease-out-expo group-hover:scale-110 group-hover:rotate-6"
          fallback={<PorcelainPlate char={glyph} glyph={glyphSize} />}
        />
      </div>
    </div>
  );
}
