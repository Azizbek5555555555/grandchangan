import TextReveal from "@/components/motion/TextReveal";
import Parallax from "@/components/motion/Parallax";
import Reveal from "@/components/motion/Reveal";
import Wave from "@/components/site/kit/Wave";
import Blob from "@/components/site/kit/Blob";
import { cn } from "@/lib/utils";

export type PageHeroProps = {
  title: string;
  subtitle?: string;
  bgImage?: string | null;
  /** Xitoycha bezak yozuvi (masalan menyu uchun "菜单") */
  cn?: string;
  /** Fon: fire — qizil (standart), night — tungi */
  tone?: "fire" | "night";
  /** Sarlavha ostidagi qo'shimcha kontent (tugmalar, chiplar) — ixtiyoriy */
  children?: React.ReactNode;
};

/**
 * Ichki sahifalar hero'si. Pastida krem to'lqin (`text-paper`) — sahifa foni bg-paper bo'lishi kerak.
 * Sarlavha kesilmasligi uchun: leading ≥ 1.08, o'lcham vw bilan cheklangan (uzun ruscha so'zlar ham
 * 320px ekranga sig'adi), overflow-hidden faqat bo'lim darajasida (bezaklar uchun).
 */
export default function PageHero({ title, subtitle, bgImage, cn: cnText, tone = "fire", children }: PageHeroProps) {
  const night = tone === "night";
  return (
    <section
      className={cn(
        "relative isolate flex min-h-[46vh] items-end overflow-hidden pb-24 pt-32 sm:pb-28 lg:min-h-[52vh] lg:pb-32 lg:pt-40",
        night ? "bg-night" : "bg-fire"
      )}
    >
      {/* Fon rasmi — nozik parallaks tekstura, ustida token rangidagi qatlam */}
      {bgImage && (
        <>
          <Parallax className="absolute -inset-y-[18%] inset-x-0 -z-20" speed={10}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bgImage} alt="" className="h-full w-full object-cover grayscale-[35%]" />
          </Parallax>
          <div aria-hidden="true" className={cn("absolute inset-0 -z-10", night ? "bg-night/80" : "bg-fire/85")} />
          <div
            aria-hidden="true"
            className={cn("absolute inset-0 -z-10 bg-gradient-to-t to-transparent", night ? "from-night" : "from-fire")}
          />
        </>
      )}

      {/* Bezaklar: panjara naqsh, organik shakl, katta xira ieroglif */}
      <span aria-hidden="true" className={cn("lattice-bg pointer-events-none absolute inset-0 -z-10", night ? "text-brand-gold/[0.06]" : "text-fire-deep/40")} />
      <Blob
        variant={night ? "b" : "a"}
        className={cn(
          "absolute -z-10 w-[26rem] sm:w-[36rem]",
          night ? "-right-32 -top-24 text-fire/30" : "-left-40 -top-40 text-fire-deep/60"
        )}
      />
      {cnText && (
        <span
          aria-hidden="true"
          lang="zh"
          className={cn(
            "font-cn pointer-events-none absolute -right-4 bottom-10 -z-10 select-none whitespace-nowrap text-[clamp(8rem,30vw,24rem)] leading-none sm:right-4",
            night ? "text-brand-gold/15" : "text-fire-deep"
          )}
        >
          {cnText}
        </span>
      )}

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        {cnText && (
          <Reveal y={12}>
            <p aria-hidden="true" className="mb-4 flex items-center gap-3">
              <span lang="zh" className="font-cn text-3xl leading-none text-saffron">{cnText}</span>
              <span className="h-px w-12 bg-saffron/70" />
            </p>
          </Reveal>
        )}
        <TextReveal
          as="h1"
          trigger="load"
          text={title}
          className="font-poster max-w-5xl text-balance text-[clamp(2.05rem,8.4vw,5.75rem)] leading-[1.1] text-brand-cream"
        />
        {subtitle && (
          <Reveal y={16} delay={0.25}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-brand-cream/90 sm:text-lg">{subtitle}</p>
          </Reveal>
        )}
        {children && (
          <Reveal y={16} delay={0.35}>
            <div className="mt-8">{children}</div>
          </Reveal>
        )}
      </div>

      <Wave className="text-paper" />
    </section>
  );
}
