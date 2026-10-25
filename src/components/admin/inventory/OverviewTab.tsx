"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Boxes,
  Check,
  ClipboardCheck,
  Minus,
  Plus,
  TrendingDown,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { addStarterInventory, startInventoryCount } from "@/lib/inventory/actions";
import { cn, formatMoney } from "@/lib/utils";
import { formatRestaurant } from "@/lib/time";
import {
  INVENTORY_CATEGORIES,
  type InventoryItemRow,
  type InventoryOverview,
  type ItemViewStatus,
} from "@/lib/inventory/types";
import type { InvTab } from "./InventoryManager";
import ItemForm from "./ItemForm";
import PurchaseForm from "./PurchaseForm";
import LossModal from "./LossForm";
import { Chip, ErrorText, StatusBadge, SummaryCard, fmtNum, useInvAction, useNormText, viewStatus } from "./shared";

type Row = { item: InventoryItemRow; status: ItemViewStatus };
type Filter = "all" | "problems" | "unset";
type ModalState = "item" | "purchase" | "loss" | null;

/**
 * Holat — inventarning birinchi, eng oddiy ko'rinishi:
 * 4 ta katta raqam, sozlanmagan bo'lsa "qayerdan boshlash" yo'riqnomasi va
 * har bir buyum uchun bitta qator: kerak (stollar uchun) / bor (jami) / farq / holat.
 */
export default function OverviewTab({
  data,
  onNotice,
  goTo,
}: {
  data: InventoryOverview;
  onNotice: (message: string) => void;
  goTo: (tab: InvTab) => void;
}) {
  const t = useTranslations("Inventory");
  const [filter, setFilter] = useState<Filter>("all");
  const [modal, setModal] = useState<ModalState>(null);

  const rows: Row[] = useMemo(() => {
    const unset = new Set(data.unsetIds);
    return data.items.map((item) => ({ item, status: viewStatus(item, unset) }));
  }, [data.items, data.unsetIds]);

  const short = rows.filter((r) => r.status === "SHORT").length;
  const low = rows.filter((r) => r.status === "LOW").length;
  const unsetCount = rows.filter((r) => r.status === "UNSET").length;
  const hasItems = rows.length > 0;
  const setupDone = hasItems && unsetCount === 0;

  const shown = rows.filter((r) =>
    filter === "problems" ? r.status === "SHORT" || r.status === "LOW" : filter === "unset" ? r.status === "UNSET" : true
  );

  const done = (message: string) => {
    setModal(null);
    onNotice(message);
  };

  return (
    <div className="space-y-6">
      {!setupDone && (
        <StartGuide
          data={data}
          unsetCount={unsetCount}
          onNotice={onNotice}
          onNewItem={() => setModal("item")}
          onPurchase={() => setModal("purchase")}
          onLoss={() => setModal("loss")}
          goTo={goTo}
        />
      )}

      {hasItems && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <SummaryCard
              label={t("cardItems")}
              value={String(data.totals.itemCount)}
              hint={t("cardItemsHint", { tables: data.totals.tableCount, seats: data.totals.seatCount })}
              icon={Boxes}
            />
            <SummaryCard
              label={t("ov.cardShort")}
              value={String(short + low)}
              hint={
                short + low > 0
                  ? t("ov.cardShortHint", { short, low })
                  : unsetCount > 0
                    ? t("ov.cardShortUnset", { count: unsetCount })
                    : t("ov.cardShortOk")
              }
              icon={TriangleAlert}
              alert={short + low > 0}
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
            <SummaryCard
              label={t("cardMonthLoss")}
              value={formatMoney(data.monthLoss)}
              hint={t("cardMonthLossHint", { pieces: fmtNum(data.monthLossPieces) })}
              icon={TrendingDown}
            />
          </div>

          {/* Tez amallar (buyum oynaning o'zida tanlanadi); sozlash paytida bular yo'riqnomada bor */}
          {setupDone && (
            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
              <Button className="min-h-11" onClick={() => setModal("purchase")}>
                <Plus size={16} /> {t("ov.btnPurchase")}
              </Button>
              <Button variant="outline" className="min-h-11 bg-card" onClick={() => setModal("loss")}>
                <Minus size={16} /> {t("ov.btnLoss")}
              </Button>
              <Button variant="outline" className="min-h-11 bg-card" onClick={() => goTo("count")}>
                <ClipboardCheck size={16} /> {data.draft ? t("ov.btnCountContinue") : t("ov.btnCount")}
              </Button>
            </div>
          )}

          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-semibold text-content">{t("ov.listTitle")}</h2>
              <div className="flex flex-wrap gap-2">
                <Chip active={filter === "all"} onClick={() => setFilter("all")}>
                  {t("filterAll")} · {rows.length}
                </Chip>
                <Chip active={filter === "problems"} onClick={() => setFilter("problems")}>
                  {t("ov.filterProblems")} · {short + low}
                </Chip>
                {unsetCount > 0 && (
                  <Chip active={filter === "unset"} onClick={() => setFilter("unset")}>
                    {t("ov.filterUnset")} · {unsetCount}
                  </Chip>
                )}
              </div>
            </div>

            <Legend />

            {shown.length === 0 ? (
              <div className="rounded-2xl border border-line bg-card px-4 py-8 text-center text-sm text-muted">
                {filter === "problems" ? t("ov.noProblems") : t("noItemsInFilter")}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-line bg-card">
                <HeaderRow />
                {INVENTORY_CATEGORIES.map((c) => {
                  const group = shown.filter((r) => r.item.category === c);
                  if (!group.length) return null;
                  return (
                    <div key={c}>
                      <h3 className="flex items-baseline gap-2 border-b border-line bg-surface-2/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                        {t(`category.${c}`)}
                        <span className="font-normal normal-case tracking-normal">· {group.length}</span>
                      </h3>
                      {group.map((r) => (
                        <ItemRow key={r.item.id} row={r} />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {modal === "item" && <ItemForm onClose={() => setModal(null)} onSaved={done} />}
      {modal === "purchase" && <PurchaseForm items={data.items} onClose={() => setModal(null)} onDone={done} />}
      {modal === "loss" && (
        <LossModal items={data.items} staff={data.staff} onClose={() => setModal(null)} onDone={done} />
      )}
    </div>
  );
}

/** "Qanday o'qiladi": uchta ustunning ma'nosi oddiy so'zlar bilan */
function Legend() {
  const t = useTranslations("Inventory");
  return (
    <dl className="mb-4 grid grid-cols-1 gap-2 rounded-xl border border-line bg-card px-4 py-3 text-xs sm:grid-cols-3">
      {(["need", "have", "diff"] as const).map((k) => (
        <div key={k}>
          <dt className="inline font-semibold text-content">{t(`ov.col_${k}`)}</dt>
          <dd className="inline text-muted"> — {t(`ov.legend_${k}`)}</dd>
        </div>
      ))}
    </dl>
  );
}

const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 px-4 py-3 md:grid-cols-[minmax(0,1fr)_6.5rem_6.5rem_6.5rem_8.5rem] md:items-center";

function HeaderRow() {
  const t = useTranslations("Inventory");
  return (
    <div className={cn(ROW_GRID, "hidden border-b border-line bg-surface-2 py-2 text-xs text-muted md:grid")}>
      <span>{t("colItem")}</span>
      <span className="text-right">
        {t("ov.col_need")}
        <span className="block text-[10px]">{t("ov.col_needSub")}</span>
      </span>
      <span className="text-right">
        {t("ov.col_have")}
        <span className="block text-[10px]">{t("ov.col_haveSub")}</span>
      </span>
      <span className="text-right">{t("ov.col_diff")}</span>
      <span className="text-right">{t("colStatus")}</span>
    </div>
  );
}

/** Bitta buyum: telefonda ikki qator (nom + holat, ostida sonlar), kompyuterda jadval qatori */
function ItemRow({ row }: { row: Row }) {
  const t = useTranslations("Inventory");
  const normText = useNormText();
  const { item: i, status } = row;
  const unset = status === "UNSET";
  const hasNorm = i.perSeat > 0 || i.perTable > 0;

  return (
    <div className={cn(ROW_GRID, "border-b border-line last:border-0")}>
      <div className="min-w-0">
        <p className="font-medium text-content">{i.name}</p>
        <p className="text-xs text-muted">
          {normText(i)}
          {status === "LOW" && ` · ${t("ov.minHint", { n: fmtNum(i.minReserve) })}`}
        </p>
      </div>
      <div className="justify-self-end md:order-last">
        <StatusBadge status={status} />
      </div>
      <div className="col-span-2 flex flex-wrap gap-x-5 gap-y-1 text-sm md:contents">
        <Num label={t("ov.col_need")} muted={!hasNorm}>
          {hasNorm ? fmtNum(i.onTables) : "—"}
        </Num>
        <Num label={t("ov.col_have")} muted={unset} strong>
          {unset ? "—" : fmtNum(i.quantity)}
        </Num>
        <Num label={t("ov.col_diff")} muted={unset}>
          {unset ? (
            "—"
          ) : (
            <span className={cn(i.reserve < 0 ? "font-semibold text-danger" : "text-content")}>
              {i.reserve > 0 ? `+${fmtNum(i.reserve)}` : fmtNum(i.reserve)}
              <span className="ml-1 text-xs font-normal">
                {i.reserve < 0 ? t("ov.diffShort") : i.reserve > 0 ? t("ov.diffSpare") : ""}
              </span>
            </span>
          )}
        </Num>
      </div>
    </div>
  );
}

function Num({
  label,
  children,
  muted,
  strong,
}: {
  label: string;
  children: React.ReactNode;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <p className="tabular-nums md:text-right">
      <span className="mr-1 text-xs text-muted md:hidden">{label}</span>
      <span className={cn(muted ? "text-muted" : "text-content", strong && !muted && "font-semibold")}>{children}</span>
    </p>
  );
}

/**
 * "Qayerdan boshlash" — 3 qadam. Ro'yxat bo'sh yoki buyumlar soni hali kiritilmagan
 * bo'lsa ko'rinadi; hammasi kiritilgach yo'qoladi.
 */
function StartGuide({
  data,
  unsetCount,
  onNotice,
  onNewItem,
  onPurchase,
  onLoss,
  goTo,
}: {
  data: InventoryOverview;
  unsetCount: number;
  onNotice: (message: string) => void;
  onNewItem: () => void;
  onPurchase: () => void;
  onLoss: () => void;
  goTo: (tab: InvTab) => void;
}) {
  const t = useTranslations("Inventory");
  const { pending, error, run } = useInvAction();
  const total = data.items.length;
  const step1 = total > 0;
  const step2 = step1 && unsetCount === 0;
  const current = !step1 ? 1 : !step2 ? 2 : 3;

  return (
    <section className="rounded-2xl border border-line bg-card p-4 sm:p-6">
      <h2 className="text-lg font-bold text-content">{t("guide.title")}</h2>
      <p className="mb-5 mt-1 max-w-3xl text-sm text-muted">{t("guide.lead")}</p>

      <ol className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Step n={1} done={step1} active={current === 1} title={t("guide.s1Title")} text={t("guide.s1Text")}>
          {step1 ? (
            <>
              <p className="text-sm text-content">{t("guide.s1Done", { count: total })}</p>
              <Button variant="outline" className="min-h-11" onClick={() => goTo("stock")}>
                <Boxes size={16} /> {t("guide.s1Check")}
              </Button>
            </>
          ) : (
            <>
              {data.canAddStarter && (
                <Button
                  className="min-h-11"
                  disabled={pending}
                  onClick={() => run(() => addStarterInventory(), (r) => onNotice(t("starterAdded", { count: r.created })))}
                >
                  <Boxes size={16} /> {pending ? t("saving") : t("addStarter")}
                </Button>
              )}
              <Button variant="outline" className="min-h-11" onClick={onNewItem}>
                <Plus size={16} /> {t("newItem")}
              </Button>
              <ErrorText>{error}</ErrorText>
            </>
          )}
        </Step>

        <Step n={2} done={step2} active={current === 2} title={t("guide.s2Title")} text={t("guide.s2Text")}>
          {step1 && (
            <>
              <p className="text-sm text-content">{t("guide.s2Progress", { done: total - unsetCount, total })}</p>
              {/* Ochiq sanoq bo'lsa — o'sha yerga o'tadi, aks holda sanoqni boshlab o'tadi */}
              <Button
                className={cn("min-h-11", current !== 2 && "bg-card")}
                variant={current === 2 ? "primary" : "outline"}
                disabled={pending}
                onClick={() => (data.draft ? goTo("count") : run(() => startInventoryCount(), () => goTo("count")))}
              >
                <ClipboardCheck size={16} /> {data.draft ? t("ov.btnCountContinue") : t("guide.s2Count")}
              </Button>
              <Button variant="outline" className="min-h-11" onClick={onPurchase}>
                <Plus size={16} /> {t("ov.btnPurchase")}
              </Button>
              <ErrorText>{error}</ErrorText>
            </>
          )}
        </Step>

        <Step n={3} done={false} active={current === 3} title={t("guide.s3Title")} text={t("guide.s3Text")}>
          {step1 && (
            <Button variant="outline" className="min-h-11" onClick={onLoss}>
              <Minus size={16} /> {t("ov.btnLoss")}
            </Button>
          )}
        </Step>
      </ol>
    </section>
  );
}

function Step({
  n,
  done,
  active,
  title,
  text,
  children,
}: {
  n: number;
  done: boolean;
  active: boolean;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  const t = useTranslations("Inventory");
  return (
    <li
      className={cn(
        "flex flex-col rounded-xl border p-4",
        active ? "border-brand-red bg-surface-2" : "border-line"
      )}
      aria-current={active ? "step" : undefined}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold",
            done ? "bg-success text-surface" : active ? "bg-brand-red text-brand-cream" : "bg-surface-2 text-content"
          )}
          aria-hidden
        >
          {done ? <Check size={16} /> : n}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {done ? t("guide.done") : t("guide.step", { n })}
        </span>
      </div>
      <h3 className="mb-1 font-semibold text-content">{title}</h3>
      <p className="mb-3 text-sm text-muted">{text}</p>
      {children && <div className="mt-auto flex flex-col gap-2">{children}</div>}
    </li>
  );
}
