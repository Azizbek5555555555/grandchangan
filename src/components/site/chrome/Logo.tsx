import { cn } from "@/lib/utils";

type Props = {
  /** sm — telefon header, md — desktop header, lg — footer */
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZES = {
  sm: { cn: "text-[1.75rem]", word: "text-[0.62rem] tracking-[0.1em]", gap: "gap-1.5" },
  md: { cn: "text-[1.75rem] sm:text-[2.35rem]", word: "text-[0.62rem] tracking-[0.1em] sm:text-[0.78rem] sm:tracking-[0.12em]", gap: "gap-1.5 sm:gap-2" },
  lg: { cn: "text-[3rem]", word: "text-[1.05rem] tracking-[0.12em]", gap: "gap-3" },
} as const;

/**
 * Logotip: mo'yqalamda "长安" (zafar rang) + ustma-ust "GRAND / CHANGAN" afisha shriftida.
 * Faqat ko'rinish — havola va aria-label'ni ota element beradi. Hook yo'q: server va client'da ishlaydi.
 */
export default function Logo({ size = "md", className }: Props) {
  const s = SIZES[size];
  return (
    <span aria-hidden="true" className={cn("flex min-w-0 items-center", s.gap, className)}>
      <span lang="zh" className={cn("font-cn shrink-0 leading-none text-saffron", s.cn)}>长安</span>
      <span className={cn("font-poster min-w-0 uppercase leading-[1.05] text-brand-cream", s.word)}>
        <span className="block">Grand</span>
        <span className="block">Changan</span>
      </span>
    </span>
  );
}
