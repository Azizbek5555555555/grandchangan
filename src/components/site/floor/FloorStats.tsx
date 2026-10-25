"use client";

import { useTranslations } from "next-intl";
import { ROOMS, floorTotals } from "@/lib/floorplan/layout";
import { cn } from "@/lib/utils";

// Raqamlar xarita ma'lumotidan (o'ylab topilmaydi): stollar, o'rinlar, VIP xonalar
const TOTALS = floorTotals();
const VIP_ROOMS = ROOMS.filter((r) => r.kind === "vip").length;

/**
 * Sarlavha yonidagi "pasport": serif raqamlar, oltin ajratgichlar va vertikal xitoycha muhr.
 * Krem (paper) fonda — matn text-content/text-muted, qorong'i temada ham o'qiladi.
 */
export default function FloorStats({ className }: { className?: string }) {
  const t = useTranslations("Home2");
  const items = [
    { v: TOTALS.tables, l: t("statTables"), cn: "桌" },
    { v: TOTALS.seats, l: t("statSeats"), cn: "席" },
    { v: VIP_ROOMS, l: t("statVip"), cn: "雅" },
  ];
  return (
    <div className={cn("flex items-stretch gap-4 sm:gap-6", className)}>
      <dl className="grid flex-1 grid-cols-3 divide-x divide-brand-gold/40 border-y border-brand-gold/40 py-4 lg:flex-none">
        {items.map((it) => (
          <div key={it.l} className="relative flex min-w-0 flex-col items-center px-3 text-center sm:px-6 lg:px-7">
            <span aria-hidden="true" lang="zh" className="font-cn pointer-events-none absolute -top-1 right-1.5 text-sm leading-none text-fire-ink/70 sm:right-3">
              {it.cn}
            </span>
            <dt className="order-2 mt-2 text-[10px] font-semibold uppercase leading-tight tracking-[0.2em] text-muted sm:text-[11px]">{it.l}</dt>
            <dd className="order-1 font-display text-4xl leading-none tabular-nums text-content sm:text-5xl">{it.v}</dd>
          </div>
        ))}
      </dl>
      {/* Vertikal muhr: 订座 — "joy band qilish" */}
      <span
        aria-hidden="true"
        lang="zh"
        className="font-cn hidden shrink-0 items-center justify-center rounded-[6px] border border-brand-gold/60 bg-fire px-2 py-3 text-xl leading-[1.05] text-brand-cream shadow-lg shadow-fire/20 [writing-mode:vertical-rl] sm:inline-flex"
      >
        订座
      </span>
    </div>
  );
}
