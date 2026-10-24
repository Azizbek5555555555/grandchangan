import { cn } from "@/lib/utils";

/**
 * Bosh sahifa bezaklari (faqat ko'rinish, aria-hidden): bambuk barglari, rangli ieroglif panellari,
 * xitoycha muhr. Ranglar faqat text-* / bg-* tokenlari orqali.
 */

/** Bambuk bargi (viewBox 120×60). Rang — text-leaf / text-jade */
export function Leaf({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 60" className={cn("pointer-events-none", className)}>
      <path d="M3 31 C 26 6, 78 -2, 117 27 C 84 55, 30 60, 3 31 Z" fill="currentColor" />
      <path d="M8 31 C 40 25, 80 23, 112 27" fill="none" strokeWidth="1.6" strokeLinecap="round" className="stroke-paper/45" />
      <path d="M40 27 L 54 15 M60 25 L 74 14 M48 28 L 62 41 M70 27 L 84 39" fill="none" strokeWidth="1" strokeLinecap="round" className="stroke-paper/25" />
    </svg>
  );
}

/** Uch bargli novda */
export function Sprig({ className, tone = "leaf" }: { className?: string; tone?: "leaf" | "jade" }) {
  const a = tone === "leaf" ? "text-leaf" : "text-jade";
  const b = tone === "leaf" ? "text-jade" : "text-leaf";
  return (
    <div aria-hidden="true" className={cn("pointer-events-none relative", className)}>
      <Leaf className={cn("absolute left-0 top-[18%] w-[78%] -rotate-[28deg]", a)} />
      <Leaf className={cn("absolute left-[22%] top-[46%] w-[70%] rotate-[14deg]", b)} />
      <Leaf className={cn("absolute left-[8%] top-[2%] w-[58%] -rotate-[62deg]", b)} />
    </div>
  );
}

type PanelTone = "night" | "fire" | "saffron" | "wine" | "sand";
const PANEL: Record<PanelTone, { bg: string; lattice: string; ink: string }> = {
  night: { bg: "bg-night-3", lattice: "text-brand-gold/15", ink: "text-brand-gold-light/80" },
  fire: { bg: "bg-fire", lattice: "text-fire-deep/60", ink: "text-brand-cream/90" },
  saffron: { bg: "bg-saffron", lattice: "text-saffron-deep/50", ink: "text-fire-deep" },
  wine: { bg: "bg-wine", lattice: "text-wine-deep/70", ink: "text-saffron/90" },
  sand: { bg: "bg-sand", lattice: "text-fire/10", ink: "text-fire/80" },
};

/**
 * Rasm yo'q joylar uchun nafis rangli panel: deraza panjarasi naqshi + mo'yqalam ieroglif.
 * Ota element o'lchamini to'ldiradi.
 */
export function GlyphPanel({
  char, tone = "night", vertical = false, className, size = "text-[clamp(3rem,38%,9rem)]",
}: { char: string; tone?: PanelTone; vertical?: boolean; className?: string; size?: string }) {
  const p = PANEL[tone];
  return (
    <div aria-hidden="true" className={cn("relative flex h-full w-full items-center justify-center overflow-hidden", p.bg, className)}>
      <span className={cn("lattice-bg absolute inset-0", p.lattice)} />
      <span className={cn("absolute inset-[9%] rounded-[inherit] border border-dashed", tone === "night" ? "border-brand-gold/25" : "border-brand-cream/25")} />
      <span
        lang="zh"
        className={cn("font-cn relative leading-none", size, p.ink, vertical && "[writing-mode:vertical-rl]")}
      >
        {char}
      </span>
    </div>
  );
}

/** Xitoycha qizil muhr (印章) — ichida vertikal yozuv */
export function Seal({ text, className }: { text: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      lang="zh"
      className={cn(
        "font-cn inline-flex items-center justify-center rounded-md border-2 border-brand-cream/80 bg-fire leading-none text-brand-cream shadow-lg [writing-mode:vertical-rl]",
        className
      )}
    >
      {text}
    </span>
  );
}
