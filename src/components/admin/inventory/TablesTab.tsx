"use client";

import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InventoryItemRow, InventoryOverview, StockStatus, TableSetLine } from "@/lib/inventory/types";
import { fmtNum } from "./shared";

/**
 * Stollar: har bir zona (xona) va stoldagi buyumlar to'plami.
 * Sonlar normadan hisoblanadi (o'ringa × o'rinlar + stolga) — bazada stol bo'yicha saqlanmaydi.
 */
export default function TablesTab({ data }: { data: InventoryOverview }) {
  const t = useTranslations("Inventory");
  const { zones, totals, items } = data;
  const statusById = new Map(items.map((i) => [i.id, i.status]));
  const hasNorms = items.some((i) => i.perSeat > 0 || i.perTable > 0);

  if (zones.length === 0) {
    return <Notice>{t("noTables")}</Notice>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">{t("tablesExplain")}</p>
      {!hasNorms && <Notice>{t(items.length ? "noNorms" : "noItemsForTables")}</Notice>}

      {/* Butun restoran bo'yicha jami */}
      <section className="rounded-2xl border border-line bg-card p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold text-content">{t("grandTotals")}</h2>
          <span className="text-sm text-muted">
            {t("zoneSummary", { tables: totals.tableCount, seats: totals.seatCount })}
          </span>
        </div>
        <SetChips lines={totals.onTables} items={items} statusById={statusById} showStock />
        {totals.onTables.some((l) => statusById.get(l.itemId) === "SHORT") && (
          <p className="mt-3 text-xs text-danger">{t("grandTotalsShortHint")}</p>
        )}
      </section>

      {zones.map((z) => (
        <details key={z.id} open className="group rounded-2xl border border-line bg-card">
          <summary className="flex cursor-pointer list-none flex-wrap [&::-webkit-details-marker]:hidden items-center justify-between gap-2 px-5 py-4">
            <span className="flex items-center gap-2 font-semibold text-content">
              <ChevronRight size={16} className="text-muted transition group-open:rotate-90" />
              {z.name}
            </span>
            <span className="text-sm text-muted">{t("zoneSummary", { tables: z.tableCount, seats: z.seatCount })}</span>
          </summary>

          <div className="border-t border-line px-5 py-4">
            <div className="mb-4 rounded-xl bg-surface-2 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{t("zoneTotals")}</p>
              <SetChips lines={z.totals} items={items} statusById={statusById} />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {z.tables.map((tb) => (
                <div key={tb.id} className="rounded-xl border border-line p-3">
                  <p className="mb-2 text-sm font-semibold text-content">
                    {t("tableTitle", { number: tb.number, seats: tb.seats })}
                  </p>
                  {tb.items.length ? (
                    <SetChips lines={tb.items} items={items} statusById={statusById} compact />
                  ) : (
                    <p className="text-xs text-muted">{t("tableEmpty")}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

/** To'plam: "Piyola ×4" ko'rinishidagi yorliqlar. Yetishmaydigan (SHORT) buyum — qizil chegara. */
function SetChips({
  lines,
  items,
  statusById,
  compact,
  showStock,
}: {
  lines: TableSetLine[];
  items: InventoryItemRow[];
  statusById: Map<string, StockStatus>;
  compact?: boolean;
  showStock?: boolean;
}) {
  const t = useTranslations("Inventory");
  if (!lines.length) return <p className="text-xs text-muted">{t("tableEmpty")}</p>;
  const qtyById = showStock ? new Map(items.map((i) => [i.id, i.quantity])) : null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {lines.map((l) => {
        const short = statusById.get(l.itemId) === "SHORT";
        return (
          <li
            key={l.itemId}
            className={cn(
              "rounded-md border bg-card text-content",
              compact ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm",
              short ? "border-danger" : "border-line"
            )}
            title={short ? t("status.SHORT") : undefined}
          >
            {l.name} <span className="font-semibold tabular-nums">×{fmtNum(l.qty)}</span>
            {qtyById && (
              <span className={cn("ml-1 text-xs", short ? "text-danger" : "text-muted")}>
                {t("stockOf", { qty: fmtNum(qtyById.get(l.itemId) ?? 0) })}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-line bg-card px-4 py-6 text-center text-sm text-muted">{children}</div>;
}
