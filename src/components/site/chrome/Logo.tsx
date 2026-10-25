import { cn } from "@/lib/utils";

type Props = {
  /** sm — telefon header, md — header/mobil menyu, lg — katta (footer va h.k.) */
  size?: "sm" | "md" | "lg";
  /**
   * inline — kichik lak lavha (长安) + yonida "GRAND / CHANGAN";
   * plaque — desktop header markazidagi osma 匾额 lavha (hammasi lavha ichida).
   */
  variant?: "inline" | "plaque";
  className?: string;
};

const INLINE = {
  sm: { box: "h-10 px-2", cn: "text-[1.3rem]", word: "text-[0.6rem]", big: "text-[0.74rem]", gap: "gap-2" },
  md: { box: "h-11 px-2 sm:h-12 sm:px-2.5", cn: "text-[1.4rem] sm:text-[1.6rem]", word: "text-[0.58rem] sm:text-[0.62rem]", big: "text-[0.74rem] sm:text-[0.86rem]", gap: "gap-2 sm:gap-2.5" },
  lg: { box: "h-16 px-3.5", cn: "text-[2.3rem]", word: "text-[0.78rem]", big: "text-[1.15rem]", gap: "gap-3.5" },
} as const;

/** Lavha ramkasi: lak (to'q qizil) fon, qo'sh oltin hoshiya, burchaklarda oltin mixlar */
function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center border border-brand-gold/75 bg-gradient-to-b from-fire-deep via-wine to-wine-deep shadow-lg shadow-night/50",
        className
      )}
    >
      <span className="pointer-events-none absolute inset-[3px] border border-brand-gold/35" />
      {["left-[1px] top-[1px]", "right-[1px] top-[1px]", "bottom-[1px] left-[1px]", "bottom-[1px] right-[1px]"].map((pos) => (
        <span key={pos} className={cn("pointer-events-none absolute size-[3px] rounded-full bg-brand-gold-light", pos)} />
      ))}
      {children}
    </span>
  );
}

/**
 * Logotip — xitoycha 匾额 (yozuvli lavha) uslubida: lak fon, oltin ramka, mo'yqalamda "长安".
 * Faqat ko'rinish — havola va aria-label'ni ota element beradi. Hook yo'q: server va client'da ishlaydi.
 */
export default function Logo({ size = "md", variant = "inline", className }: Props) {
  if (variant === "plaque") {
    return (
      <span aria-hidden="true" className={cn("inline-flex", className)}>
        <Frame className="flex-col px-5 pb-2 pt-2 xl:px-6">
          <span lang="zh" className="font-cn block text-[2.05rem] leading-none tracking-[0.12em] text-brand-gold-light xl:text-[2.3rem]">
            长安
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-[0.56rem] font-semibold uppercase tracking-[0.34em] text-brand-cream/90">
            <span className="h-px w-2.5 bg-brand-gold/70" />
            Grand Changan
            <span className="h-px w-2.5 bg-brand-gold/70" />
          </span>
        </Frame>
      </span>
    );
  }

  const s = INLINE[size];
  return (
    <span aria-hidden="true" className={cn("flex min-w-0 items-center", s.gap, className)}>
      <Frame className={s.box}>
        <span lang="zh" className={cn("font-cn relative leading-none text-brand-gold-light", s.cn)}>长安</span>
      </Frame>
      <span className="font-display min-w-0 uppercase leading-[1.1]">
        <span className={cn("block font-sans font-semibold tracking-[0.42em] text-brand-gold-light", s.word)}>Grand</span>
        <span className={cn("block tracking-[0.16em] text-brand-cream", s.big)}>Changan</span>
      </span>
    </span>
  );
}
