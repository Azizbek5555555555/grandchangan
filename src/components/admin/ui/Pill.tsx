import { cn } from "@/lib/utils";

export type PillTone = "neutral" | "gold" | "saffron" | "jade" | "success" | "fire";

/** Yumshoq fon + rangli nuqta. Matn har doim o'qiladigan (content/muted) — rangni nuqta beradi */
const TONE: Record<PillTone, { box: string; dot: string }> = {
  neutral: { box: "bg-surface-2 text-muted", dot: "bg-muted" },
  gold: { box: "bg-brand-gold/15 text-content", dot: "bg-brand-gold" },
  saffron: { box: "bg-saffron/15 text-content", dot: "bg-saffron-deep" },
  jade: { box: "bg-leaf/15 text-content", dot: "bg-leaf" },
  success: { box: "bg-success-soft text-success", dot: "bg-success" },
  fire: { box: "bg-fire/10 text-fire-ink", dot: "bg-fire-ink" },
};

export default function Pill({ tone = "neutral", children, className }: { tone?: PillTone; children: React.ReactNode; className?: string }) {
  const c = TONE[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium", c.box, className)}>
      <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", c.dot)} />
      {children}
    </span>
  );
}

/** Holat → rang (bir xil ma'noli holatlar hamma bo'limda bir xil ko'rinsin) */
export const STATUS_TONE: Record<string, PillTone> = {
  // bron
  PENDING: "gold", CONFIRMED: "saffron", SEATED: "jade", COMPLETED: "neutral", CANCELLED: "fire", NO_SHOW: "fire",
  // buyurtma
  NEW: "gold", PREPARING: "saffron", READY: "jade", SERVED: "success",
  // to'lov
  PAID: "success", FAILED: "fire", REFUNDED: "neutral",
  // sharh / maqola
  APPROVED: "success", REJECTED: "fire", PUBLISHED: "success", DRAFT: "neutral", ARCHIVED: "neutral",
  // tadbir so'rovi
  CONTACTED: "saffron", CLOSED: "neutral",
};
