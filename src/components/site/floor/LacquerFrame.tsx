import { cn } from "@/lib/utils";
import { FretCorner } from "@/components/site/pages/Ornament";

const CORNER = "absolute size-5 text-brand-gold/75 sm:size-7";

/**
 * "Lak quti" — qorong'i quti, ichida ingichka oltin ramka va to'rt burchakda huiwen naqshi,
 * fonda juda nozik deraza panjarasi. Faqat ko'rinish: ichidagi kontentga tegmaydi.
 * Yorug' temada krem bo'lim ustida qora quti, qorong'i temada oltin ramka uni ajratib turadi.
 */
export default function LacquerFrame({
  children,
  className,
  innerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-[22px] bg-night text-brand-cream shadow-2xl shadow-night/25 ring-1 ring-brand-gold/25 sm:rounded-[30px]",
        className
      )}
    >
      {/* Fon: panjara naqshi + qizil lak nuri */}
      <span aria-hidden="true" className="lattice-bg pointer-events-none absolute inset-0 -z-10 text-brand-gold/[0.045]" />
      <span aria-hidden="true" className="pointer-events-none absolute -left-32 -top-40 -z-10 size-[28rem] rounded-full bg-fire-deep/25 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-48 -right-24 -z-10 size-[26rem] rounded-full bg-brand-gold/[0.07] blur-3xl" />

      {/* Ichki oltin ramka (ikki chiziq) */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-1.5 rounded-[17px] border border-brand-gold/30 sm:inset-2 sm:rounded-[24px]" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-[15px] hidden rounded-[18px] border border-brand-gold/15 sm:block" />

      {/* Burchak naqshlari (kontentga tegmaydi: ichki chekinish undan katta) */}
      <FretCorner className={cn(CORNER, "left-2.5 top-2.5 sm:left-3.5 sm:top-3.5")} />
      <FretCorner className={cn(CORNER, "right-2.5 top-2.5 rotate-90 sm:right-3.5 sm:top-3.5")} />
      <FretCorner className={cn(CORNER, "bottom-2.5 right-2.5 rotate-180 sm:bottom-3.5 sm:right-3.5")} />
      <FretCorner className={cn(CORNER, "bottom-2.5 left-2.5 -rotate-90 sm:bottom-3.5 sm:left-3.5")} />

      <div className={cn("relative px-3.5 pb-9 pt-9 sm:p-11 lg:p-12", innerClassName)}>{children}</div>
    </div>
  );
}
