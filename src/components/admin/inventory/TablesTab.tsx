"use client";

import { Fragment, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InventoryOverview, TableSetLine, ZoneSet } from "@/lib/inventory/types";
import type { InvTab } from "./InventoryManager";
import { fmtNum } from "./shared";

/** Jadvalning "asosiy buyumlar" ustunida nechta buyum nomi ko'rinadi */
const MAIN_COUNT = 3;

const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_1.5rem] items-center gap-x-3 md:grid-cols-[minmax(0,14rem)_5rem_5rem_minmax(0,1fr)_1.5rem]";

/**
 * Stollar: zal bo'yicha yig'ma jadval (stollar, o'rinlar, asosiy kerakli buyumlar).
 * Zalni bosganda — zal bo'yicha jami ro'yxat va stollar; stolni bosganda — shu stolning to'plami.
 * Sonlar buyumning "har o'ringa / har stolga" qoidasidan hisoblanadi — bazada stol bo'yicha saqlanmaydi.
 */
export default function TablesTab({ data, goTo }: { data: InventoryOverview; goTo: (tab: InvTab) => void }) {
  const t = useTranslations("Inventory");
  const { zones, totals, items } = data;
  const [open, setOpen] = useState<string | null>(null);
  const hasNorms = items.some((i) => i.perSeat > 0 || i.perTable > 0);
  const categoryOf = useMemo(() => new Map<string, string>(items.map((i) => [i.id, i.category])), [items]);

  // Stollarga yetmaydigan buyumlar (soni kiritilganlari orasida) — bitta umumiy eslatma
  const shortCount = useMemo(() => {
    const unset = new Set(data.unsetIds);
    return items.filter((i) => i.status === "SHORT" && !unset.has(i.id)).length;
  }, [items, data.unsetIds]);

  if (zones.length === 0) {
    return <Notice>{t("noTables")}</Notice>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl border border-line bg-card px-4 py-3 text-sm text-content">
        <Info size={16} className="mt-0.5 shrink-0 text-brand-gold" />
        <p>{t("tb.how")}</p>
      </div>

      {!hasNorms && <Notice>{t(items.length ? "noNorms" : "noItemsForTables")}</Notice>}

      {hasNorms && shortCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-card px-4 py-3 text-sm text-content">
          <span className="flex items-start gap-2">
            <TriangleAlert size={16} className="mt-0.5 shrink-0 text-danger" />
            {t("tb.shortNote", { count: shortCount })}
          </span>
          <button
            type="button"
            onClick={() => goTo("overview")}
            className="inline-flex min-h-11 items-center gap-1 font-medium text-danger hover:underline"
          >
            {t("tb.shortLink")} <ChevronRight size={14} />
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <div className={cn(ROW_GRID, "border-b border-line bg-surface-2 px-4 py-2 text-xs text-muted")}>
          <span>{t("tb.colZone")}</span>
          <span className="text-right">{t("tb.colTables")}</span>
          <span className="text-right">{t("tb.colSeats")}</span>
          <span className="hidden md:block">{t("tb.colMain")}</span>
          <span />
        </div>

        {zones.map((z) => {
          const isOpen = open === z.id;
          return (
            <Fragment key={z.id}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : z.id)}
                aria-expanded={isOpen}
                aria-controls={`inv-zone-${z.id}`}
                className={cn(
                  ROW_GRID,
                  "min-h-14 w-full border-b border-line px-4 py-3 text-left text-sm transition hover:bg-surface-2",
                  isOpen && "bg-surface-2"
                )}
              >
                <span className="font-semibold text-content">{z.name}</span>
                <span className="text-right tabular-nums text-content">{fmtNum(z.tableCount)}</span>
                <span className="text-right tabular-nums text-content">{fmtNum(z.seatCount)}</span>
                <span className="hidden truncate text-muted md:block">
                  <MainItems lines={z.totals} categoryOf={categoryOf} />
                </span>
                <ChevronDown size={16} className={cn("justify-self-end text-muted transition", isOpen && "rotate-180")} />
              </button>
              {isOpen && <ZoneDetail zone={z} hasNorms={hasNorms} />}
            </Fragment>
          );
        })}

        <div className={cn(ROW_GRID, "bg-surface-2 px-4 py-3 text-sm font-semibold text-content")}>
          <span>{t("tb.total")}</span>
          <span className="text-right tabular-nums">{fmtNum(totals.tableCount)}</span>
          <span className="text-right tabular-nums">{fmtNum(totals.seatCount)}</span>
          <span className="hidden truncate font-normal text-muted md:block">
            <MainItems lines={totals.onTables} categoryOf={categoryOf} />
          </span>
          <span />
        </div>
      </div>
    </div>
  );
}

/**
 * "Palochka 57 · Guruch kosasi 57 · Piyola 57 · yana 18 xil" — har xil guruhdan bittadan
 * (bir guruhdagi o'xshash buyumlar takrorlanmasin), yetmasa qolganlaridan
 */
function MainItems({ lines, categoryOf }: { lines: TableSetLine[]; categoryOf: Map<string, string> }) {
  const t = useTranslations("Inventory");
  if (!lines.length) return <>—</>;
  const seen = new Set<string>();
  const firstOfGroup = lines.filter((l) => {
    const c = categoryOf.get(l.itemId) ?? "";
    if (seen.has(c)) return false;
    seen.add(c);
    return true;
  });
  const picked = [...firstOfGroup, ...lines.filter((l) => !firstOfGroup.includes(l))].slice(0, MAIN_COUNT);
  const head = picked.map((l) => `${l.name} ${fmtNum(l.qty)}`).join(" · ");
  const rest = lines.length - picked.length;
  return (
    <>
      {head}
      {rest > 0 && ` · ${t("tb.more", { count: rest })}`}
    </>
  );
}

/** Zal ochilganda: zal bo'yicha jami kerakli buyumlar va stollar (stolni bosganda — uning to'plami) */
function ZoneDetail({ zone: z, hasNorms }: { zone: ZoneSet; hasNorms: boolean }) {
  const t = useTranslations("Inventory");
  const [tableId, setTableId] = useState<string | null>(null);
  const table = z.tables.find((tb) => tb.id === tableId) ?? null;

  return (
    <div id={`inv-zone-${z.id}`} className="space-y-5 border-b border-line px-4 py-4">
      <div>
        <p className="mb-2 text-sm font-semibold text-content">{t("tb.zoneNeed", { zone: z.name })}</p>
        {hasNorms && z.totals.length ? <LineGrid lines={z.totals} /> : <p className="text-sm text-muted">{t("tableEmpty")}</p>}
      </div>

      <div>
        <p className="text-sm font-semibold text-content">{t("tb.tablesTitle")}</p>
        <p className="mb-2 text-xs text-muted">{t("tb.pickTable")}</p>
        <div className="flex flex-wrap gap-2">
          {z.tables.map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => setTableId(tableId === tb.id ? null : tb.id)}
              aria-pressed={tableId === tb.id}
              className={cn(
                "min-h-11 rounded-lg border px-3 text-sm transition",
                tableId === tb.id
                  ? "border-brand-red bg-brand-red text-brand-cream"
                  : "border-line bg-card text-content hover:bg-surface-2"
              )}
            >
              <span className="font-semibold">{tb.number}</span>{" "}
              <span className={cn("ml-1.5 text-xs", tableId === tb.id ? "text-brand-cream" : "text-muted")}>
                {t("tb.seats", { count: tb.seats })}
              </span>
            </button>
          ))}
        </div>

        {table && (
          <div className="mt-3 rounded-xl border border-line bg-surface-2 p-4" aria-live="polite">
            <p className="mb-2 text-sm font-semibold text-content">
              {t("tb.tableNeed", { number: table.number, seats: table.seats })}
            </p>
            {table.items.length ? <LineGrid lines={table.items} /> : <p className="text-sm text-muted">{t("tableEmpty")}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

/** Buyum — son, 1–3 ustunli ixcham ro'yxat (yuqoridan pastga o'qiladi — guruhlar ketma-ket) */
function LineGrid({ lines }: { lines: TableSetLine[] }) {
  return (
    <ul className="gap-x-8 text-sm sm:columns-2 xl:columns-3">
      {lines.map((l) => (
        <li key={l.itemId} className="flex break-inside-avoid items-baseline justify-between gap-3 border-b border-line/60 py-1.5">
          <span className="min-w-0 text-content">{l.name}</span>
          <span className="shrink-0 font-semibold tabular-nums text-content">{fmtNum(l.qty)}</span>
        </li>
      ))}
    </ul>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-line bg-card px-4 py-6 text-center text-sm text-muted">{children}</div>;
}
