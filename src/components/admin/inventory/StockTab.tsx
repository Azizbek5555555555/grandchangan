"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Boxes, Package, Pencil, Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { addStarterInventory, deleteInventoryItem } from "@/lib/inventory/actions";
import { cn } from "@/lib/utils";
import {
  INVENTORY_CATEGORIES,
  type InventoryCategory,
  type InventoryItemRow,
  type InventoryOverview,
} from "@/lib/inventory/types";
import ItemForm from "./ItemForm";
import PurchaseForm from "./PurchaseForm";
import LossModal from "./LossForm";
import { Chip, ErrorText, StatusBadge, fmtNum, useInvAction, useNormText, viewStatus, useMoney } from "./shared";

type Filter = "all" | "problems" | "unset" | InventoryCategory;
type ModalState =
  | { kind: "item"; item?: InventoryItemRow }
  | { kind: "purchase"; item: InventoryItemRow }
  | { kind: "loss"; item: InventoryItemRow }
  | null;

const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 px-4 py-3 md:grid-cols-[minmax(0,1fr)_5.5rem_6.5rem_5.5rem_7.5rem_13.5rem] md:items-center";

/** Ombor: buyumlar ro'yxati va amallar (yangi buyum, kirim, sindi, tahrirlash, o'chirish) */
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
  const unset = useMemo(() => new Set(data.unsetIds), [data.unsetIds]);

  const byCategory = useMemo(() => {
    const m = new Map<InventoryCategory, number>();
    for (const i of items) m.set(i.category, (m.get(i.category) ?? 0) + 1);
    return m;
  }, [items]);

  const isProblem = (i: InventoryItemRow) => {
    const s = viewStatus(i, unset);
    return s === "SHORT" || s === "LOW";
  };
  const problemCount = items.filter(isProblem).length;

  const shown = items.filter((i) =>
    filter === "all"
      ? true
      : filter === "problems"
        ? isProblem(i)
        : filter === "unset"
          ? unset.has(i.id)
          : i.category === filter
  );

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
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Chip active={filter === "all"} onClick={() => setFilter("all")}>
                {t("filterAll")} · {items.length}
              </Chip>
              {problemCount > 0 && (
                <Chip active={filter === "problems"} onClick={() => setFilter("problems")}>
                  {t("ov.filterProblems")} · {problemCount}
                </Chip>
              )}
              {unset.size > 0 && (
                <Chip active={filter === "unset"} onClick={() => setFilter("unset")}>
                  {t("ov.filterUnset")} · {unset.size}
                </Chip>
              )}
              {/* Guruh filtrlari telefonda yashiriladi — ro'yxatning o'zi guruhlarga bo'lingan */}
              <span className="hidden sm:contents">
                {INVENTORY_CATEGORIES.filter((c) => byCategory.has(c)).map((c) => (
                  <Chip key={c} active={filter === c} onClick={() => setFilter(c)}>
                    {t(`category.${c}`)} · {byCategory.get(c)}
                  </Chip>
                ))}
              </span>
            </div>
            <Button className="min-h-11 w-full sm:w-auto" onClick={() => setModal({ kind: "item" })}>
              <Plus size={16} /> {t("newItem")}
            </Button>
          </div>

          <p className="mb-3 text-xs text-muted">{t("stockExplain")}</p>
          {unset.size > 0 && (
            <p className="mb-3 rounded-lg border border-line bg-card px-3 py-2 text-sm text-content">
              {t("zeroStockHint", { count: unset.size })}
            </p>
          )}
          {error && (
            <div className="mb-3">
              <ErrorText>{error}</ErrorText>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-line bg-card">
            <div className={cn(ROW_GRID, "hidden border-b border-line bg-surface-2 py-2 text-xs text-muted md:grid")}>
              <span>{t("colItem")}</span>
              <span className="text-right">{t("colTotal")}</span>
              <span className="text-right">{t("colOnTables")}</span>
              <span className="text-right">{t("colReserve")}</span>
              <span>{t("colStatus")}</span>
              <span className="text-right">{t("colActions")}</span>
            </div>
            {INVENTORY_CATEGORIES.map((c) => {
              const group = shown.filter((i) => i.category === c);
              if (!group.length) return null;
              return (
                <div key={c}>
                  <p className="border-b border-line bg-surface-2/60 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                    {t(`category.${c}`)}
                  </p>
                  {group.map((i) => (
                    <StockRow
                      key={i.id}
                      item={i}
                      unset={unset.has(i.id)}
                      pending={pending}
                      onPurchase={() => setModal({ kind: "purchase", item: i })}
                      onLoss={() => setModal({ kind: "loss", item: i })}
                      onEdit={() => setModal({ kind: "item", item: i })}
                      onDelete={() => remove(i)}
                    />
                  ))}
                </div>
              );
            })}
            {shown.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">{t("noItemsInFilter")}</p>}
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

/** Bitta buyum: telefonda karta (sonlar va tugmalar pastda), kompyuterda jadval qatori */
function StockRow({
  item: i,
  unset,
  pending,
  onPurchase,
  onLoss,
  onEdit,
  onDelete,
}: {
  item: InventoryItemRow;
  unset: boolean;
  pending: boolean;
  onPurchase: () => void;
  onLoss: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("Inventory");
  const money = useMoney();
  const normText = useNormText();
  const hasNorm = i.perSeat > 0 || i.perTable > 0;

  return (
    <div className={cn(ROW_GRID, "border-b border-line last:border-0")}>
      <div className="min-w-0">
        <p className="font-medium text-content">{i.name}</p>
        <p className="text-xs text-muted">
          {normText(i)}
          {i.minReserve > 0 && ` · ${t("ov.minHint", { n: fmtNum(i.minReserve) })}`}
          {i.unitPrice != null && ` · ${money(i.unitPrice)}`}
        </p>
      </div>
      {/* Telefonda o'ng tepada, kompyuterda "Holat" ustunida */}
      <div className="justify-self-end md:order-4 md:justify-self-start">
        <StatusBadge status={unset ? "UNSET" : i.status} />
      </div>
      <div className="col-span-2 flex flex-wrap gap-x-5 gap-y-1 text-sm tabular-nums md:contents">
        <Cell label={t("colTotal")} className="md:order-1">
          <span className={cn("font-semibold", unset ? "text-muted" : "text-content")}>{unset ? "—" : fmtNum(i.quantity)}</span>
        </Cell>
        <Cell label={t("colOnTables")} className="md:order-2">
          <span className="text-content">{hasNorm ? fmtNum(i.onTables) : "—"}</span>
        </Cell>
        <Cell label={t("colReserve")} className="md:order-3">
          <span className={cn(unset ? "text-muted" : i.reserve < 0 ? "font-semibold text-danger" : "text-content")}>
            {unset ? "—" : fmtNum(i.reserve)}
          </span>
        </Cell>
      </div>
      {/* Telefonda: [Kirim][Sindi] teng kenglikda + ikki ikonka; kompyuterda — ixcham qator */}
      <div className="col-span-2 grid grid-cols-[1fr_1fr_auto_auto] items-center gap-1.5 md:order-5 md:col-span-1 md:flex md:justify-end md:gap-1">
        <button
          type="button"
          onClick={onPurchase}
          className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-line px-2 text-sm text-content hover:bg-surface-2 md:min-h-8 md:text-xs"
          title={t("actPurchaseHint")}
        >
          <Plus size={13} className="hidden shrink-0 min-[400px]:block" /> {t("actPurchase")}
        </button>
        <button
          type="button"
          onClick={onLoss}
          className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-line px-2 text-sm text-danger hover:bg-brand-red/10 md:min-h-8 md:text-xs"
          title={t("actLossHint")}
        >
          <Minus size={13} className="hidden shrink-0 min-[400px]:block" /> {t("actLoss")}
        </button>
        <span className="contents">
          <button
            type="button"
            onClick={onEdit}
            className="flex size-11 items-center justify-center rounded text-muted hover:bg-surface-2 hover:text-content md:size-8"
            title={t("actEdit")}
            aria-label={t("actEdit")}
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="flex size-11 items-center justify-center rounded text-muted hover:bg-brand-red/10 hover:text-danger disabled:opacity-40 md:size-8"
            title={t("actDelete")}
            aria-label={t("actDelete")}
          >
            <Trash2 size={15} />
          </button>
        </span>
      </div>
    </div>
  );
}

function Cell({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <p className={cn("md:text-right", className)}>
      <span className="mr-1 text-xs text-muted md:hidden">{label}</span>
      {children}
    </p>
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
    <div className="rounded-2xl border border-line bg-card p-6 text-center sm:p-8">
      <Package size={40} className="mx-auto mb-3 text-brand-gold" />
      <h2 className="mb-2 text-lg font-bold text-content">{t("emptyTitle")}</h2>
      <p className="mx-auto mb-5 max-w-xl text-sm text-muted">{t(canAddStarter ? "emptyText" : "emptyTextNoStarter")}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {canAddStarter && (
          <Button className="min-h-11" onClick={onStarter} disabled={pending}>
            <Boxes size={16} /> {pending ? t("saving") : t("addStarter")}
          </Button>
        )}
        <Button variant="outline" className="min-h-11" onClick={onNew}>
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
