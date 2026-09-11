"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "uz", label: "UZ" },
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
  { code: "zh", label: "中文" },
] as const;

export type LocalizedValue = Partial<Record<"uz" | "ru" | "en" | "zh", string>>;

export function LocalizedInput({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: LocalizedValue;
  onChange: (v: LocalizedValue) => void;
  textarea?: boolean;
}) {
  const [active, setActive] = useState<string>("uz");
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-700">{label}</span>
        <div className="flex gap-1">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setActive(l.code)}
              className={cn(
                "rounded px-2 py-0.5 text-xs",
                active === l.code ? "bg-brand-red text-white" : "bg-neutral-100 text-neutral-500"
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      {textarea ? (
        <textarea
          value={value[active as keyof LocalizedValue] || ""}
          onChange={(e) => onChange({ ...value, [active]: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-red"
        />
      ) : (
        <input
          value={value[active as keyof LocalizedValue] || ""}
          onChange={(e) => onChange({ ...value, [active]: e.target.value })}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-red"
        />
      )}
    </div>
  );
}
