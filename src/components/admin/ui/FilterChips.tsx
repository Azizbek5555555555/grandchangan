"use client";

import { cn } from "@/lib/utils";

export type ChipOption = { value: string; label: string; count?: number };

/** Holat bo'yicha filtr "chip"lari. Telefonda faqat o'zi gorizontal suriladi */
export default function FilterChips({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: ChipOption[];
  value: string;
  onChange: (v: string) => void;
  /** Guruh uchun aria-label */
  label: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn("-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0", className)}>
      <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={active}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-sm transition sm:min-h-9",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60",
                active
                  ? "border-fire bg-fire text-brand-cream"
                  : "border-line bg-card text-muted hover:border-brand-gold/50 hover:text-content"
              )}
            >
              {o.label}
              {o.count !== undefined && (
                <span
                  className={cn(
                    "min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold tabular-nums",
                    active ? "bg-brand-cream/20 text-brand-cream" : "bg-surface-2 text-muted"
                  )}
                >
                  {o.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
