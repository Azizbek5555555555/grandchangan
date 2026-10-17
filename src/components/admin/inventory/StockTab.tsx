"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Boxes, ClipboardCheck, Package, Pencil, Plus, Minus, Trash2, TrendingDown, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { addStarterInventory, deleteInventoryItem } from "@/lib/inventory/actions";
import { cn, formatMoney } from "@/lib/utils";
import { formatRestaurant } from "@/lib/time";
import { INVENTORY_CATEGORIES, type InventoryCategory, type InventoryItemRow, type InventoryOverview } from "@/lib/inventory/types";
import ItemForm from "./ItemForm";
import PurchaseForm from "./PurchaseForm";
import LossModal from "./LossForm";
import { Chip, ErrorText, StatusBadge, SummaryCard, fmtNum, useInvAction } from "./shared";

type Filter = "all" | "low" | InventoryCategory;
type ModalState =
  | { kind: "item"; item?: InventoryItemRow }
  | { kind: "purchase"; item: InventoryItemRow }
  | { kind: "loss"; item: InventoryItemRow }
  | null;

/** Qoldiq: umumiy kartalar, guruh filtri, buyumlar jadvali va amallar */
export default function StockTab({
  data,
  onNotice,
}: {
  data: InventoryOverview;
  onNotice: (message: string) => void;
}) {
  const t = useTranslations("Inventory");
  const [filter, setFilter] = useState<Filter>("all");
  const [modal, setModal] = useState<ModalState>(null);
  const { pending, error, run } = useInvAction();
  const { items } = data;

  const byCategory = useMemo(() => {
    const m = new Map<InventoryCategory, number>();
    for (const i of items) m.set(i.category, (m.get(i.category) ?? 0) + 1);
    return m;
  }, [items]);

  const shown = items.filter((i) =>
    filter === "all" ? true : filter === "low" ? i.status !== "OK" : i.category === filter
  );
  const zeroCount = items.filter((i) => i.quantity === 0).length;

  const done = (message: string) => {
    setModal(null);
    onNotice(message);
  };

  function remove(item: InventoryItemRow) {
    if (!window.confirm(t("deleteConfirm", { name: item.name }))) return;
    run(
      () => deleteInventoryItem(item.id),
      (r) => onNotice(t(r.archived ? "deletedArchived" : "deleted", { name: item.name }))
    );
  }

  function addStarter() {
    run(
      () => addStarterInventory(),
      (r) => onNotice(t("starterAdded", { count: r.created }))
    );
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          label={t("cardItems")}
          value={String(data.totals.itemCount)}
          hint={t("cardItemsHint", { tables: data.totals.tableCount, seats: data.totals.seatCount })}
          icon={Boxes}
        />
        <SummaryCard
          label={t("cardLow")}
          value={String(data.lowCount)}
          hint={t("cardLowHint")}
          icon={TriangleAlert}
          alert={data.lowCount > 0}
        />
        <SummaryCard
          label={t("cardMonthLoss")}
          value={formatMoney(data.monthLoss)}
          hint={t("cardMonthLossHint", { pieces: fmtNum(data.monthLossPieces) })}
          icon={TrendingDown}
        />
        <SummaryCard
          label={t("cardLastCount")}
          value={data.lastCountAt ? formatRestaurant(data.lastCountAt, { time: false }) : "—"}
          hint={
            data.counts[0]
              ? t("countShortageTotal", {
                  pieces: fmtNum(data.counts[0].shortagePieces),
                  sum: formatMoney(data.counts[0].shortageSum),
                })
              : t("cardLastCountNever")
          }
          icon={ClipboardCheck}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          canAddStarter={data.canAddStarter}
          pending={pending}
          error={error}
          onStarter={addStarter}
          onNew={() => setModal({ kind: "item" })}
        />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Chip active={filter === "all"} onClick={() => setFilter("all")}>
                {t("filterAll")} · {items.length}
              </Chip>
              {data.lowCount > 0 && (
                <Chip active={filter === "low"} onClick={() => setFilter("low")}>
                  {t("filterLow")} · {data.lowCount}
                </Chip>
              )}
              {INVENTORY_CATEGORIES.filter((c) => byCategory.has(c)).map((c) => (
                <Chip key={c} active={filter === c} onClick={() => setFilter(c)}>
                  {t(`category.${c}`)} · {byCategory.get(c)}
                </Chip>
              ))}
            </div>
            <Button onClick={() => setModal({ kind: "item" })}>
              <Plus size={16} /> {t("newItem")}
            </Button>
          </div>

          <p className="mb-3 text-xs text-muted">{t("stockExplain")}</p>
          {zeroCount > 0 && (
            <p className="mb-3 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-content">
              {t("zeroStockHint", { count: zeroCount })}
            </p>
          )}
          {error && (
            <div className="mb-3">
              <ErrorText>{error}</ErrorText>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-line bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface-2 text-left text-muted">
                <tr>
                  <th className="px-4 py-3">{t("colItem")}</th>
                  <th className="px-4 py-3">{t("colCategory")}</th>
                  <th className="px-4 py-3 text-right">{t("colTotal")}</th>
                  <th className="px-4 py-3 text-right">{t("colOnTables")}</th>
                  <th className="px-4 py-3 text-right">{t("colReserve")}</th>
                  <th className="px-4 py-3 text-right">{t("colMin")}</th>
                  <th className="px-4 py-3">{t("colStatus")}</th>
                  <th className="px-4 py-3 text-right">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((i) => (
                  <tr key={i.id} className="border-b border-line last:border-0">
                    <td className="min-w-44 px-4 py-3">
                      <div className="font-medium text-content">{i.name}</div>
                      <div className="text-xs text-muted">
                        {i.perSeat || i.perTable
                          ? t("normShort", { seat: i.perSeat, table: i.perTable })
                          : t("noNorm")}
                        {i.unitPrice != null && ` · ${formatMoney(i.unitPrice)}`}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{t(`category.${i.category}`)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{fmtNum(i.quantity)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmtNum(i.onTables)}</td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right tabular-nums",
                        i.reserve < 0 ? "font-semibold text-danger" : "text-content"
                      )}
                    >
                      {fmtNum(i.reserve)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">{fmtNum(i.minReserve)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={i.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setModal({ kind: "purchase", item: i })}
                          className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-line px-2 py-1 text-xs text-content hover:bg-surface-2"
                          title={t("actPurchaseHint")}
                        >
                          <Plus size={13} /> {t("actPurchase")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setModal({ kind: "loss", item: i })}
                          className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-line px-2 py-1 text-xs text-danger hover:bg-brand-red/10"
                          title={t("actLossHint")}
                        >
                          <Minus size={13} /> {t("actLoss")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setModal({ kind: "item", item: i })}
                          className="rounded p-1.5 text-muted hover:bg-surface-2 hover:text-content"
                          title={t("actEdit")}
                          aria-label={t("actEdit")}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(i)}
                          disabled={pending}
                          className="rounded p-1.5 text-muted hover:bg-brand-red/10 hover:text-danger disabled:opacity-40"
                          title={t("actDelete")}
                          aria-label={t("actDelete")}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted">
                      {t("noItemsInFilter")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modal?.kind === "item" && <ItemForm item={modal.item} onClose={() => setModal(null)} onSaved={done} />}
      {modal?.kind === "purchase" && <PurchaseForm item={modal.item} onClose={() => setModal(null)} onDone={done} />}
      {modal?.kind === "loss" && (
        <LossModal item={modal.item} staff={data.staff} onClose={() => setModal(null)} onDone={done} />
      )}
    </div>
  );
}

/** Bo'sh inventar: tushuntirish + tayyor ro'yxat tugmasi */
function EmptyState({
  canAddStarter,
  pending,
  error,
  onStarter,
  onNew,
}: {
  canAddStarter: boolean;
  pending: boolean;
  error: string | null;
  onStarter: () => void;
  onNew: () => void;
}) {
  const t = useTranslations("Inventory");
  return (
    <div className="rounded-2xl border border-line bg-card p-8 text-center">
      <Package size={40} className="mx-auto mb-3 text-brand-gold" />
      <h2 className="mb-2 text-lg font-bold text-content">{t("emptyTitle")}</h2>
      <p className="mx-auto mb-5 max-w-xl text-sm text-muted">{t(canAddStarter ? "emptyText" : "emptyTextNoStarter")}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {canAddStarter && (
          <Button onClick={onStarter} disabled={pending}>
            <Boxes size={16} /> {pending ? t("saving") : t("addStarter")}
          </Button>
        )}
        <Button variant="outline" onClick={onNew}>
          <Plus size={16} /> {t("newItem")}
        </Button>
      </div>
      {error && (
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
      <p className="mx-auto mt-5 max-w-xl text-xs text-muted">{t("emptyHint")}</p>
    </div>
  );
}
