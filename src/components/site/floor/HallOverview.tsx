"use client";

import { useLocale, useTranslations } from "next-intl";
import { Phone } from "lucide-react";
import { MAP_ZONES, ROOMS, bookableTables, type FloorTable } from "@/lib/floorplan/layout";
import { cn } from "@/lib/utils";

// Har bir zal uchun xitoycha bezak belgisi (faqat bezak — ma'no matnda)
const GLYPH: Record<string, string> = { vip: "雅", hall: "厅", booth: "座", private: "独" };

// Zallar bo'yicha xarita stollari (o'zgarmas ma'lumot — bir marta hisoblanadi)
const GROUPS = MAP_ZONES.map((z) => {
  const tables = bookableTables(ROOMS).filter((x) => z.kinds.includes(x.room.kind)).map((x) => x.table);
  return { zone: z, tables, maxSeats: Math.max(0, ...tables.map((t) => t.seats)) };
}).filter((g) => g.tables.length > 0);

/**
 * Stol tanlanmaganda o'ng panel bo'sh turmasin: zallar haqida qisqa ma'lumot (stollar soni,
 * necha kishigacha, hozir nechtasi bo'sh).
 * Faqat ko'rinish — tanlov mantig'iga tegmaydi.
 */
export default function HallOverview({
  loaded,
  isFree,
  dark,
}: {
  /** Mavjudlik ma'lumoti yuklanganmi (yo'q bo'lsa — bo'sh stollar soni ko'rsatilmaydi) */
  loaded: boolean;
  /** Xarita stoli hozir bo'shmi (tanlangan ham bo'sh hisoblanadi) */
  isFree: (mt: FloorTable) => boolean;
  dark: boolean;
}) {
  const tp = useTranslations("Pages2");
  const locale = useLocale();
  const lang = (["uz", "ru", "en", "zh"] as const).find((l) => l === locale) ?? "uz";

  const muted = dark ? "text-brand-cream/65" : "text-muted";
  const line = dark ? "border-brand-cream/10" : "border-line";

  return (
    <div className="mt-5">
      <div className="flex items-center gap-3">
        <p className={cn("shrink-0 text-[11px] font-semibold uppercase tracking-[0.25em]", dark ? "text-brand-gold-light" : "text-fire-ink")}>
          {tp("floorHalls")}
        </p>
        <span aria-hidden="true" className={cn("h-px flex-1", dark ? "bg-brand-gold/30" : "bg-line")} />
      </div>

      <ul className={cn("mt-2 divide-y", dark ? "divide-brand-cream/10" : "divide-line")}>
        {GROUPS.map((g) => {
          const free = g.tables.filter(isFree).length;
          return (
            <li key={g.zone.key} className="flex items-center gap-3 py-3">
              <span
                aria-hidden="true"
                lang="zh"
                className={cn(
                  "font-cn flex size-10 shrink-0 items-center justify-center rounded-lg border text-xl leading-none",
                  dark ? "border-brand-gold/35 bg-night-3/70 text-brand-gold-light" : "border-line bg-sand text-fire-ink"
                )}
              >
                {GLYPH[g.zone.key] ?? "席"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg leading-tight [overflow-wrap:anywhere]">{g.zone.name[lang]}</p>
                <p className={cn("mt-0.5 text-xs", muted)}>
                  {tp("floorTablesCount", { count: g.tables.length })} · {tp("floorUpTo", { n: g.maxSeats })}
                </p>
              </div>
              {loaded && (
                <span
                  className={cn(
                    "inline-flex max-w-[45%] shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs leading-tight tabular-nums",
                    free > 0
                      ? dark ? "border-brand-gold/40 text-brand-gold-light" : "border-brand-gold/60 text-content"
                      : cn(line, muted)
                  )}
                >
                  <span aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0 rounded-full", free > 0 ? "bg-brand-gold" : dark ? "bg-brand-cream/30" : "bg-line")} />
                  {tp("floorFreeOf", { free, total: g.tables.length })}
                </span>
              )}
            </li>
          );
        })}
      </ul>

    </div>
  );
}

/** Panel pastidagi "telefon orqali bron" eslatmasi (har doim ko'rinadi — panel bo'sh turmaydi) */
export function CallCard({ phone, dark }: { phone: string; dark: boolean }) {
  const tp = useTranslations("Pages2");
  const tel = `tel:${phone.replace(/[^\d+]/g, "")}`;
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border p-3", dark ? "border-brand-gold/20 bg-night-3/50" : "border-line bg-sand/60")}>
      <span aria-hidden="true" className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-fire text-brand-cream">
        <Phone size={14} />
      </span>
      <div className="min-w-0">
        <p className={cn("text-xs leading-relaxed", dark ? "text-brand-cream/65" : "text-muted")}>{tp("floorCall")}</p>
        <a
          href={tel}
          className={cn(
            "inline-flex min-h-11 items-center text-base font-semibold tracking-wide",
            dark ? "text-brand-gold-light hover:text-saffron" : "text-fire-ink hover:text-fire-deep"
          )}
        >
          {phone}
        </a>
      </div>
    </div>
  );
}
