import { cn } from "@/lib/utils";
import Blob from "@/components/site/kit/Blob";
import Wave from "@/components/site/kit/Wave";
import ButtonLink from "@/components/site/kit/ButtonLink";
import SectionHead from "@/components/site/kit/SectionHead";
import DishFallback from "@/components/site/kit/DishFallback";
import Reveal from "@/components/motion/Reveal";
import Parallax from "@/components/motion/Parallax";
import SafeImg from "./SafeImg";
import { CloudLine } from "./Ornament";

type Btn = { href: string; label: string };

/**
 * Sahifa oxiridagi "Stol band qiling" bloki (namuna 2): tungi fon, qizil blob'lar,
 * nafis serif sarlavha, interyer rasmi blob ramkada (bo'lsa) va tugmalar.
 * Tepasida krem bo'limdan to'lqin bilan o'tadi.
 */
export default function CtaBand({
  cnText = "订座", eyebrow, title, accent, sub, primary, secondary, image, waveFrom = "paper", className,
}: {
  cnText?: string;
  eyebrow?: string;
  title: string;
  accent?: string;
  sub?: string;
  primary: Btn;
  secondary?: Btn;
  image?: string | null;
  /** Yuqoridagi bo'lim rangi (to'lqin uchun) */
  waveFrom?: "paper" | "sand";
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden bg-night pb-20 pt-28 text-brand-cream sm:pb-28 sm:pt-36", className)}>
      <Wave top className={waveFrom === "sand" ? "text-sand" : "text-paper"} variant="b" />
      <Parallax className="absolute -left-28 top-10 w-[22rem] sm:w-[30rem]" speed={10}>
        <Blob className="w-full text-fire/85" variant="b" />
      </Parallax>
      <Parallax className="absolute -bottom-24 -right-20 w-[18rem] sm:w-[26rem]" speed={16}>
        <Blob className="w-full text-wine" variant="c" />
      </Parallax>
      <span
        lang="zh"
        aria-hidden="true"
        className="font-cn pointer-events-none absolute -right-4 top-6 select-none text-[9rem] leading-none text-brand-cream/[0.05] sm:text-[15rem]"
      >
        {cnText}
      </span>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <SectionHead cn={cnText} eyebrow={eyebrow} title={title} accent={accent} sub={sub} tone="dark" font="serif" />
          <Reveal y={18} delay={0.2}>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href={primary.href} variant="saffron" blob>{primary.label}</ButtonLink>
              {secondary && <ButtonLink href={secondary.href} variant="ghost-light">{secondary.label}</ButtonLink>}
            </div>
          </Reveal>
          <CloudLine className="mt-10 w-40 text-brand-gold/60" />
        </div>
        {image !== undefined && (
          <Reveal y={30} className="relative mx-auto w-full max-w-md">
            <span className="rounded-blob-2 animate-bob absolute -bottom-5 -left-5 h-24 w-24 bg-saffron sm:h-28 sm:w-28" aria-hidden="true" />
            <div className="rounded-blob relative aspect-square overflow-hidden bg-night-3 ring-1 ring-brand-gold/30">
              <SafeImg
                src={image}
                className="h-full w-full object-cover transition duration-[1.2s] hover:scale-105"
                fallback={<DishFallback char="宴" className="bg-night-3" />}
              />
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
