import { cn } from "@/lib/utils";
import Reveal from "@/components/motion/Reveal";
import TextReveal from "@/components/motion/TextReveal";

type Props = {
  /** Xitoycha bezak yozuvi (masalan "招牌菜") — mo'yqalam shriftida */
  cn?: string;
  /** Kichik ustki yozuv (masalan "Menyudan tanlov") */
  eyebrow?: string;
  title: string;
  /** Sarlavhaning rangli/kursiv qismi (yangi qatordan emas, davomida) */
  accent?: string;
  sub?: string;
  align?: "left" | "center";
  /** light — krem fon (paper/sand), dark — qizil/vino/tungi fon */
  tone?: "light" | "dark";
  /** poster — jasur afisha shrifti; serif — nafis kursivli (namuna 2/3) */
  font?: "poster" | "serif";
  as?: "h1" | "h2" | "h3";
  className?: string;
};

/** Bo'lim sarlavhasi: xitoycha bezak + eyebrow + animatsiyali sarlavha + izoh */
export default function SectionHead({
  cn: cnText, eyebrow, title, accent, sub, align = "left", tone = "light", font = "poster", as = "h2", className,
}: Props) {
  const dark = tone === "dark";
  const titleCls = cn(
    font === "poster"
      ? "font-poster text-[2.15rem] leading-[1.06] sm:text-5xl lg:text-[3.6rem]"
      : "font-display text-[2.6rem] font-normal leading-[1.02] sm:text-6xl lg:text-[4.2rem]",
    dark ? "text-brand-cream" : "text-content"
  );
  const accentCls = cn(
    titleCls,
    font === "serif" && "italic",
    dark ? (font === "serif" ? "text-brand-gold-light" : "text-saffron") : "text-fire"
  );
  return (
    <div className={cn(align === "center" && "mx-auto text-center", "max-w-3xl", className)}>
      {(cnText || eyebrow) && (
        <Reveal y={14}>
          <div className={cn("mb-3 flex flex-wrap items-center gap-x-3 gap-y-1", align === "center" && "justify-center")}>
            {cnText && <span lang="zh" className={cn("font-cn text-2xl leading-none sm:text-3xl", dark ? "text-saffron" : "text-fire")}>{cnText}</span>}
            {eyebrow && (
              <span className={cn("text-xs font-semibold uppercase tracking-[0.24em]", dark ? "text-brand-cream/75" : "text-muted")}>{eyebrow}</span>
            )}
          </div>
        </Reveal>
      )}
      <div className={cn("flex flex-wrap items-baseline gap-x-3", align === "center" && "justify-center")}>
        <TextReveal as={as} text={title} className={titleCls} />
        {accent && <TextReveal as="span" text={accent} className={accentCls} delay={0.12} />}
      </div>
      {sub && (
        <Reveal y={16} delay={0.15}>
          <p className={cn("mt-5 max-w-xl text-base leading-relaxed sm:text-lg", align === "center" && "mx-auto", dark ? "text-brand-cream/80" : "text-muted")}>{sub}</p>
        </Reveal>
      )}
    </div>
  );
}
