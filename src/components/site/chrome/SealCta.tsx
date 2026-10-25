import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const SIZES = {
  md: { box: "h-11 gap-2.5 pl-[5px] pr-4 text-[13px]", seal: "size-[34px] text-[1.15rem]", frame: "inset-[3px]" },
  lg: { box: "h-14 gap-3 pl-[6px] pr-6 text-[15px]", seal: "size-[42px] text-[1.4rem]", frame: "inset-[4px]" },
} as const;

/**
 * "Stol band qilish" — premium CTA: lak-qizil fon, ichki oltin ramka, chapda oltin muhr "订".
 * Header, mobil menyu va footer bir xil tugmadan foydalanadi. Hook yo'q (server va client'da ishlaydi).
 */
export default function SealCta({
  href = "/reservation",
  children,
  size = "md",
  glyph = "订",
  className,
  onClick,
}: {
  href?: string;
  children: ReactNode;
  size?: keyof typeof SIZES;
  glyph?: string;
  className?: string;
  onClick?: () => void;
}) {
  const s = SIZES[size];
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "btn-gold-sheen group inline-flex shrink-0 items-center whitespace-nowrap rounded-[3px] bg-fire font-semibold tracking-[0.04em] text-brand-cream shadow-lg shadow-night/40 transition duration-300 hover:bg-fire-deep active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-night",
        s.box,
        className
      )}
    >
      <span aria-hidden="true" className={cn("pointer-events-none absolute rounded-[2px] border border-brand-gold/45", s.frame)} />
      <span
        aria-hidden="true"
        lang="zh"
        className={cn(
          "font-cn relative flex shrink-0 items-center justify-center rounded-[2px] bg-brand-gold-light leading-none text-fire-deep transition-transform duration-500 group-hover:-rotate-[8deg]",
          s.seal
        )}
      >
        {glyph}
      </span>
      <span className="relative">{children}</span>
    </Link>
  );
}
