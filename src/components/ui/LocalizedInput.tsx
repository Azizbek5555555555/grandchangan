"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "uz", label: "UZ" },
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
  { code: "zh", label: "中文" },
] as const;

export type LocalizedValue = Partial<Record<"uz" | "ru" | "en" | "zh", string>>;

/** 4 tilli matn maydoni: til tugmalari + bitta input/textarea. Bo'sh tillar nuqta bilan belgilanadi */
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
  const t = useTranslations("AdminUi.localized");
  const [active, setActive] = useState<string>("uz");
  const id = useId();
  const fieldCls =
    "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-content outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </label>
        <div role="group" aria-label={t("switch")} className="flex gap-1 rounded-lg bg-surface-2 p-0.5">
          {LOCALES.map((l) => {
            const filled = !!value[l.code]?.trim();
            const name = t(`lang_${l.code}`);
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => setActive(l.code)}
                aria-pressed={active === l.code}
                title={filled ? name : `${name} — ${t("empty")}`}
                className={cn(
                  "relative min-h-8 min-w-9 rounded-md px-2 text-xs font-semibold transition",
                  active === l.code ? "bg-fire text-brand-cream shadow-sm" : "text-muted hover:text-content"
                )}
              >
                {l.label}
                {!filled && <span aria-hidden="true" className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-brand-gold" />}
              </button>
            );
          })}
        </div>
      </div>
      {textarea ? (
        <textarea
          id={id}
          lang={active}
          value={value[active as keyof LocalizedValue] || ""}
          onChange={(e) => onChange({ ...value, [active]: e.target.value })}
          rows={3}
          className={fieldCls}
        />
      ) : (
        <input
          id={id}
          lang={active}
          value={value[active as keyof LocalizedValue] || ""}
          onChange={(e) => onChange({ ...value, [active]: e.target.value })}
          className={fieldCls}
        />
      )}
    </div>
  );
}
