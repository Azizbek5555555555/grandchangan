import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type BtnVariant = "saffron" | "fire" | "night" | "ghost-light" | "ghost-dark" | "gold-outline";
export type BtnSize = "md" | "lg";

const VARIANTS: Record<BtnVariant, string> = {
  // Qizil fon ustida asosiy tugma
  saffron: "bg-saffron text-brand-ink hover:bg-saffron-deep",
  // Krem/qorong'i fon ustida asosiy tugma
  fire: "bg-fire text-brand-cream hover:bg-fire-deep",
  night: "bg-night text-brand-cream hover:bg-night-3",
  "ghost-light": "border border-brand-cream/60 text-brand-cream hover:bg-brand-cream/10",
  "ghost-dark": "border border-content/30 text-content hover:bg-content hover:text-surface",
  "gold-outline": "border border-brand-gold/60 text-brand-gold-light hover:bg-brand-gold hover:text-brand-ink",
};

const SIZES: Record<BtnSize, string> = {
  md: "h-12 px-6 text-sm",
  lg: "h-14 px-8 text-[15px] sm:text-base",
};

/** Tugma klasslari — <button> uchun ham ishlatiladi */
export function btnClass(variant: BtnVariant = "fire", size: BtnSize = "lg", blob = false) {
  return cn(
    "btn-gold-sheen inline-flex select-none items-center justify-center gap-2 font-semibold transition duration-300 active:scale-[0.97]",
    blob ? "rounded-blob" : "rounded-full",
    VARIANTS[variant],
    SIZES[size]
  );
}

type Props = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: BtnVariant;
  size?: BtnSize;
  /** Organik "blob" shakl (namuna 2) */
  blob?: boolean;
  className?: string;
};

/** Sayt tugmasi-havola (i18n Link) */
export default function ButtonLink({ variant = "fire", size = "lg", blob = false, className, ...rest }: Props) {
  return <Link {...rest} className={cn(btnClass(variant, size, blob), className)} />;
}
