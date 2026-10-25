import { cn } from "@/lib/utils";
import SafeImg from "@/components/site/home/SafeImg";
import { PorcelainPlate } from "@/components/site/home/ShowcaseArt";

/**
 * Taom tagchasi (namuna 03): notekis chetli tosh plita yoki qizil lak patnis.
 * Faqat bezak (aria-hidden), ota o'lchamini to'ldiradi. Ranglar — fill-* tokenlari.
 */
export function Dais({ variant = "stone", className }: { variant?: "stone" | "lacquer"; className?: string }) {
  const lac = variant === "lacquer";
  const slab = "M16 30 C 12 17, 40 9, 78 8 C 104 7, 122 12, 150 9 C 186 7, 224 13, 228 28 C 232 41, 216 51, 184 53 C 152 56, 128 51, 100 55 C 66 58, 22 50, 16 30 Z";
  return (
    <svg aria-hidden="true" viewBox="0 0 244 72" preserveAspectRatio="none" className={cn("pointer-events-none block", className)}>
      {/* Yon qalinligi */}
      <path d={slab} transform="translate(0 10)" className={lac ? "fill-wine-deep" : "fill-night-2"} />
      {/* Ustki yuza */}
      <path d={slab} className={lac ? "fill-fire-deep" : "fill-night-3"} />
      {/* Chetdagi nozik yorug'lik */}
      <path d={slab} fill="none" strokeWidth="0.9" className={lac ? "stroke-saffron/45" : "stroke-brand-gold/30"} />
      {lac ? (
        <path d="M44 30 C 80 20, 160 19, 200 29" fill="none" strokeWidth="0.8" strokeDasharray="5 3" className="stroke-saffron/40" />
      ) : (
        <g className="fill-brand-cream/[0.07]">
          <circle cx="58" cy="24" r="1.4" /><circle cx="92" cy="40" r="1" /><circle cx="150" cy="20" r="1.2" />
          <circle cx="186" cy="38" r="1.5" /><circle cx="122" cy="46" r="0.9" /><circle cx="210" cy="26" r="0.8" />
        </g>
      )}
    </svg>
  );
}

/**
 * Tagcha ustidagi dumaloq taom: rasm bo'lsa — dumaloq rasm, bo'lmasa — chinni tarelka zaxirasi
 * (huiwen hoshiyali, markazda ieroglif). Ota kengligini oladi (aspect 5/4).
 * Karta `group` bo'lsa — hover'da tarelka biroz ko'tarilib aylanadi.
 */
export function PlatedDish({
  img, alt, glyph, variant = "stone", glyphClass = "text-6xl", eager = false, className,
}: {
  img: string | null;
  alt: string;
  glyph: string;
  variant?: "stone" | "lacquer";
  glyphClass?: string;
  eager?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative mx-auto aspect-[5/4] w-full", className)}>
      {/* Tarelka ortidagi iliq nur */}
      <span aria-hidden="true" className="absolute inset-x-[18%] top-[6%] aspect-square rounded-full bg-brand-gold/[0.07] blur-2xl" />
      <Dais variant={variant} className="absolute inset-x-0 bottom-0 h-[34%] w-full drop-shadow-xl" />
      {/* Tarelka soyasi */}
      <span aria-hidden="true" className="absolute bottom-[16%] left-1/2 h-[9%] w-[54%] -translate-x-1/2 rounded-[50%] bg-night/80 blur-md" />
      <div className="absolute bottom-[17%] left-1/2 aspect-square w-[66%] -translate-x-1/2 transition-[translate,rotate] duration-700 ease-out-expo group-hover:-translate-y-2 group-hover:rotate-[8deg] motion-reduce:transition-none">
        <SafeImg
          src={img}
          alt={alt}
          eager={eager}
          className="h-full w-full rounded-full shadow-[0_22px_38px_-14px] shadow-night ring-1 ring-brand-gold/25"
          imgClassName="rounded-full"
          fallback={<PorcelainPlate char={glyph} glyph={glyphClass} />}
        />
      </div>
    </div>
  );
}
