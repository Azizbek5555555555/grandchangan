"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import FloorMap, { useRoomName, type FloorSelectPoint, type TableVisualState } from "@/components/floorplan/FloorMap";
import { ROOMS, floorTotals, isDining, roomSeats, type FloorRoom, type FloorTable } from "@/lib/floorplan/layout";
import { normLines } from "@/lib/inventory/calc";
import type { InventoryItemRow, InventoryOverview, ItemViewStatus } from "@/lib/inventory/types";
import { StatusBadge, fmtNum, useNormText, viewStatus } from "./shared";

type Line = { item: InventoryItemRow; qty: number };

/** Berilgan stollar (o'rinlar soni) uchun normaga ko'ra kerak bo'lgan buyumlar */
const linesFor = (items: InventoryItemRow[], seatsList: number[]): Line[] => normLines(items, seatsList);

/** Stolni alohida tanlash mumkinmi: ovqatlanish joyidagi kodli stol (bar peshtaxtasi — yo'q) */
const pickable = (tb: FloorTable, room: FloorRoom) => isDining(room) && !!tb.code;

/** Qisqa oyna o'lchami (xarita chegarasidan chiqmasligi uchun) */
const POP_W = 268;
/** Shundan tor xaritada qisqa oyna o'rniga panel ko'rsatiladi */
const NARROW = 520;

/**
 * Inventar → Xarita: restoran rejasi.
 *  - Xonaga bosilganda — shu xonadagi stollar va buyumlar jami;
 *  - Stolga bosilganda — aynan shu stol (kod, o'rinlar) uchun kerakli buyumlar va ularning holati.
 * Qisqa oyna sichqoncha yonida, batafsil — yon panelda (telefonda — xarita ostida).
 * Sonlar normadan hisoblanadi: (o'ringa norma × o'rinlar) + stolga norma.
 */
export default function MapTab({ data }: { data: InventoryOverview }) {
  const t = useTranslations("Inventory");
  const tf = useTranslations("Floor");
  const roomName = useRoomName();
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [selected, setSelected] = useState<FloorRoom | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [pop, setPop] = useState<{ left: number; top: number } | null>(null);

  const totals = useMemo(() => floorTotals(), []);
  // Bazadagi faol stollar xarita bilan mos bo'lmasa (sinxronlanmagan) — eslatma ko'rsatiladi
  const dbDiffers = data.totals.tableCount !== totals.tables || data.totals.seatCount !== totals.seats;
  const hasNorms = data.items.some((i) => i.perSeat > 0 || i.perTable > 0);
  const unset = useMemo(() => new Set(data.unsetIds), [data.unsetIds]);
  const allSeats = useMemo(() => ROOMS.filter(isDining).flatMap((r) => r.tables.map((tb) => tb.seats)), []);
  const table = selected && tableId ? selected.tables.find((tb) => tb.id === tableId) ?? null : null;

  // Esc — oynani yopish
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPop(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /**
   * Oyna sichqoncha yonida, lekin xarita chegarasidan chiqmasin. Tor ekranda (telefon) xarita
   * kichik — oyna uni butunlay yopib qo'yardi, shuning uchun o'rniga xarita ostidagi panelga o'tamiz.
   */
  function placePop(p: FloorSelectPoint, h: number) {
    const box = wrapRef.current?.getBoundingClientRect();
    if (!box) return;
    if (box.width < NARROW) {
      setPop(null);
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      return;
    }
    const left = Math.min(Math.max(p.clientX - box.left + 14, 8), Math.max(8, box.width - POP_W - 8));
    const top = Math.min(Math.max(p.clientY - box.top + 14, 8), Math.max(8, box.height - h - 8));
    setPop({ left, top });
  }

  function onSelect(room: FloorRoom, p: FloorSelectPoint) {
    setSelected(room);
    setTableId(null);
    placePop(p, 230);
  }

  function onSelectTable(tb: FloorTable, room: FloorRoom, p: FloorSelectPoint) {
    if (!pickable(tb, room)) return onSelect(room, p);
    setSelected(room);
    setTableId(tb.id);
    placePop(p, 300);
  }

  /** Panelda stolni tanlash (xaritasiz — klaviatura va telefon uchun) */
  function pickFromPanel(tb: FloorTable) {
    setTableId(tb.id);
    setPop(null);
  }

  function openDetails() {
    setPop(null);
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    panelRef.current?.focus();
  }

  // Xaritadagi stollar: tanlangani oltin, qolgan kodli stollar bosiladigan (hover nuri bilan)
  const tableState = useCallback(
    (tb: FloorTable, room: FloorRoom): TableVisualState | null =>
      pickable(tb, room) ? (tb.id === tableId ? "selected" : "free") : null,
    [tableId]
  );
  const tableLabel = useCallback(
    (tb: FloorTable) => t("map.tableAria", { code: tb.code ?? "", seats: tb.seats }),
    [t]
  );

  const roomLines = useMemo(
    () => (selected ? linesFor(data.items, selected.tables.map((tb) => tb.seats)) : []),
    [selected, data.items]
  );
  const tableLines = useMemo(() => (table ? linesFor(data.items, [table.seats]) : []), [table, data.items]);
  const allLines = useMemo(() => linesFor(data.items, allSeats), [data.items, allSeats]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0">
        <p className="mb-3 text-sm text-muted">
          {t("map.summary", { tables: totals.tables, seats: totals.seats })}
        </p>
        <div
          ref={wrapRef}
          className="relative"
          // Xaritani surish boshlanganda qisqa oyna yopiladi (tanlov panelda qoladi)
          onWheelCapture={() => setPop(null)}
          onPointerDownCapture={(e) => {
            if (!(e.target instanceof Element) || !e.target.closest("[data-map-pop]")) setPop(null);
          }}
        >
          <FloorMap
            className="aspect-[1450/880] w-full lg:aspect-auto lg:h-[58vh] lg:min-h-[360px]"
            selectedId={selected?.id}
            onSelect={onSelect}
            onSelectTable={onSelectTable}
            tableState={tableState}
            tableLabel={tableLabel}
            hint={t("map.hint")}
            badge={(r) => (isDining(r) && r.rect.w > 150 && roomSeats(r).seats > 0
              ? t("map.seatsBadge", { count: roomSeats(r).seats }) : null)}
          />
          {selected && pop && (
            <div
              data-map-pop
              role="dialog"
              aria-label={table ? t("map.tableTitle", { code: table.code ?? "" }) : roomName(selected)}
              style={{ left: pop.left, top: pop.top, width: POP_W }}
              className="absolute z-10 rounded-xl border border-line bg-card p-3 text-sm text-content shadow-xl"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                {table ? (
                  <div className="min-w-0">
                    <p className="font-display text-lg leading-tight">{t("map.tableTitle", { code: table.code ?? "" })}</p>
                    <p className="text-xs text-muted">{t("map.tableSub", { seats: table.seats, room: roomName(selected) })}</p>
                  </div>
                ) : (
                  <p className="font-semibold">{roomName(selected)}</p>
                )}
                <button type="button" onClick={() => setPop(null)} aria-label={t("close")} className="-m-1 p-1 text-muted hover:text-content">
                  <X size={14} />
                </button>
              </div>
              {table ? (
                <>
                  {hasNorms && <TableSummary lines={tableLines} unset={unset} className="mt-2" />}
                  <PopLines lines={tableLines} unset={unset} withStatus />
                </>
              ) : (
                <>
                  <RoomStats room={selected} />
                  {isDining(selected) && <PopLines lines={roomLines} unset={unset} />}
                </>
              )}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                {table && (
                  <button
                    type="button"
                    onClick={() => setTableId(null)}
                    className="inline-flex min-h-8 items-center gap-1 text-xs font-medium text-muted hover:text-content"
                  >
                    <ArrowLeft size={12} /> {t("map.backToRoom", { room: roomName(selected) })}
                  </button>
                )}
                <button
                  type="button"
                  onClick={openDetails}
                  className="ml-auto inline-flex min-h-8 items-center gap-1 text-xs font-medium text-fire-ink hover:underline"
                >
                  {t("map.details")} <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
        {dbDiffers && (
          <p className="mt-2 text-xs text-muted">
            {t("map.dbNote", { tables: data.totals.tableCount, seats: data.totals.seatCount })}
          </p>
        )}
      </div>

      <aside
        ref={panelRef}
        tabIndex={-1}
        aria-live="polite"
        className="min-w-0 scroll-mt-4 rounded-2xl border border-line bg-card p-4 shadow-sm outline-none lg:max-h-[calc(58vh+3rem)] lg:overflow-y-auto"
      >
        {!selected ? (
          <>
            <p className="mb-1 font-semibold text-content">{t("map.allTitle")}</p>
            <p className="mb-3 text-xs text-muted">{t("map.selectHint")}</p>
            {hasNorms ? <LineList lines={allLines} unset={unset} /> : <p className="text-sm text-muted">{t("map.noNorms")}</p>}
          </>
        ) : table ? (
          <TablePanel
            table={table}
            roomLabel={roomName(selected)}
            lines={tableLines}
            hasNorms={hasNorms}
            unset={unset}
            onBack={() => { setTableId(null); setPop(null); }}
          />
        ) : (
          <>
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="font-display text-xl text-content">{roomName(selected)}</p>
                <p className="text-xs text-muted">
                  {tf(`kinds.${selected.kind}`) !== roomName(selected) && tf(`kinds.${selected.kind}`)}
                  {!selected.bookable && <> · {tf("notBookable")}</>}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setSelected(null); setTableId(null); setPop(null); }}
                aria-label={t("close")}
                className="-m-1 flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-content sm:h-8 sm:w-8"
              >
                <X size={16} />
              </button>
            </div>
            <RoomStats room={selected} />
            <div className="mt-3">
              <RoomBody
                room={selected}
                lines={roomLines}
                items={data.items}
                hasNorms={hasNorms}
                unset={unset}
                onPickTable={pickFromPanel}
              />
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

/** Qisqa oynadagi ro'yxat (6 tagacha) */
function PopLines({ lines, unset, withStatus }: { lines: Line[]; unset: Set<string>; withStatus?: boolean }) {
  const t = useTranslations("Inventory");
  if (!lines.length) return null;
  return (
    <ul className="mt-2 space-y-0.5">
      {lines.slice(0, 6).map((l) => {
        const status = viewStatus(l.item, unset);
        return (
          <li key={l.item.id} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5">
              {withStatus && <StatusDot status={status} />}
              <span className="truncate">{l.item.name}</span>
            </span>
            <span className="font-semibold tabular-nums">×{l.qty}</span>
          </li>
        );
      })}
      {lines.length > 6 && <li className="text-xs text-muted">{t("map.more", { count: lines.length - 6 })}</li>}
    </ul>
  );
}

const DOT: Record<ItemViewStatus, string> = {
  OK: "bg-success",
  LOW: "bg-brand-gold",
  SHORT: "bg-danger",
  UNSET: "bg-muted/50",
};

/** Holat nuqtasi (rang + ekran o'quvchi uchun matn) */
function StatusDot({ status }: { status: ItemViewStatus }) {
  const t = useTranslations("Inventory");
  return (
    <span title={t(`status.${status}`)} className={cn("inline-block h-2 w-2 shrink-0 rounded-full", DOT[status])}>
      <span className="sr-only">{t(`status.${status}`)}</span>
    </span>
  );
}

/** Stol bo'yicha xulosa: yetishmaydi / kam / kiritilmagan / hammasi bor */
function TableSummary({ lines, unset, className }: { lines: Line[]; unset: Set<string>; className?: string }) {
  const t = useTranslations("Inventory");
  if (!lines.length) return null;
  const by = (s: ItemViewStatus) => lines.filter((l) => viewStatus(l.item, unset) === s).length;
  const short = by("SHORT"), low = by("LOW"), unsetCount = by("UNSET");
  const [cls, text] =
    short > 0 ? ["bg-danger/10 text-danger", t("map.sumShort", { count: short })]
    : low > 0 ? ["bg-brand-gold/15 text-content", t("map.sumLow", { count: low })]
    : unsetCount > 0 ? ["bg-surface-2 text-muted", t("map.sumUnset", { count: unsetCount })]
    : ["bg-success-soft text-success", t("map.sumOk")];
  return <p className={cn("rounded-lg px-2.5 py-1.5 text-xs font-medium", cls, className)}>{text}</p>;
}

/** Yon panel: aynan bitta stol */
function TablePanel({
  table, roomLabel, lines, hasNorms, unset, onBack,
}: {
  table: FloorTable; roomLabel: string; lines: Line[]; hasNorms: boolean; unset: Set<string>; onBack: () => void;
}) {
  const t = useTranslations("Inventory");
  const normText = useNormText();
  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="-ml-1 mb-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-sm font-medium text-muted transition hover:text-content sm:min-h-8"
      >
        <ArrowLeft size={14} /> {t("map.backToRoom", { room: roomLabel })}
      </button>
      <p className="font-display text-2xl leading-tight text-content">{t("map.tableTitle", { code: table.code ?? "" })}</p>
      <p className="mb-3 text-xs text-muted">{t("map.tableSub", { seats: table.seats, room: roomLabel })}</p>
      {!hasNorms ? (
        <p className="text-sm text-muted">{t("map.noNorms")}</p>
      ) : !lines.length ? (
        <p className="text-sm text-muted">{t("tableEmpty")}</p>
      ) : (
        <>
          <TableSummary lines={lines} unset={unset} className="mb-3" />
          <p className="mb-2 text-sm font-medium text-content">{t("map.tableItems")}</p>
          <ul className="divide-y divide-line">
            {lines.map(({ item, qty }) => (
              <li key={item.id} className="py-2">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 text-sm text-content">{item.name}</p>
                  <span className="shrink-0 text-base font-semibold tabular-nums text-content">×{qty}</span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <p className="text-[11px] text-muted">{normText(item)}</p>
                  <span className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted tabular-nums">{t("map.inStock", { qty: fmtNum(item.quantity) })}</span>
                    <StatusBadge status={viewStatus(item, unset)} />
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">{t("map.statusNote")}</p>
        </>
      )}
    </>
  );
}

function RoomStats({ room }: { room: FloorRoom }) {
  const t = useTranslations("Inventory");
  if (!isDining(room) && room.kind !== "bar") return null;
  const s = roomSeats(room);
  return <p className="text-xs text-muted">{t("map.tablesSeats", { tables: s.tables, seats: s.seats })}</p>;
}

function RoomBody({
  room,
  lines,
  items,
  hasNorms,
  unset,
  onPickTable,
}: {
  room: FloorRoom;
  lines: Line[];
  items: InventoryItemRow[];
  hasNorms: boolean;
  unset: Set<string>;
  onPickTable: (tb: FloorTable) => void;
}) {
  const t = useTranslations("Inventory");
  if (room.kind === "kitchen") {
    const kitchen = items.filter((i) => i.category === "KITCHEN");
    return (
      <>
        <p className="mb-2 text-sm font-medium text-content">{t("map.kitchenItems")}</p>
        {kitchen.length ? (
          <ul className="space-y-1 text-sm">
            {kitchen.map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span>{i.name}</span>
                <span className="font-semibold tabular-nums">{i.quantity}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">{t("map.kitchenEmpty")}</p>
        )}
      </>
    );
  }
  if (room.kind === "bar") return <p className="text-sm text-muted">{t("map.barNote")}</p>;
  if (!isDining(room)) return <p className="text-sm text-muted">{t("map.noTableware")}</p>;
  if (room.tables.length === 0) return <p className="text-sm text-muted">{t("map.noTablesYet")}</p>;

  const codeTables = room.tables.filter((tb) => tb.code);
  // Bir xil o'rinli stollarni guruhlash: "6 kishilik stol × 8"
  const groups = new Map<number, number>();
  room.tables.forEach((tb) => groups.set(tb.seats, (groups.get(tb.seats) ?? 0) + 1));

  return (
    <>
      {/* Aniq stolni tanlash (xaritada bosish bilan bir xil) */}
      {codeTables.length > 0 && (
        <div className="mb-4">
          <p className="mb-1 text-sm font-medium text-content">{t("map.tablesHeading")}</p>
          <p className="mb-2 text-xs text-muted">{t("map.pickTable")}</p>
          <div className="flex flex-wrap gap-1.5">
            {codeTables.map((tb) => (
              <button
                key={tb.id}
                type="button"
                onClick={() => onPickTable(tb)}
                aria-label={t("map.tableAria", { code: tb.code ?? "", seats: tb.seats })}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-card px-3 text-xs font-medium text-content transition hover:border-brand-gold/60 hover:bg-surface-2 sm:min-h-8"
              >
                {tb.code}
                <span className="text-muted">· {t("map.seatsBadge", { count: tb.seats })}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {!hasNorms ? (
        <p className="text-sm text-muted">{t("map.noNorms")}</p>
      ) : (
        <>
          <p className="mb-2 text-sm font-medium text-content">{t("map.roomItems")}</p>
          <LineList lines={lines} unset={unset} />
          {room.tables.length > 1 && (
            <div className="mt-4 border-t border-line pt-3">
              <p className="mb-2 text-sm font-medium text-content">{t("map.perTable")}</p>
              {[...groups.entries()].sort((a, b) => a[0] - b[0]).map(([seats, count]) => (
                <div key={seats} className="mb-3 rounded-lg bg-surface-2 p-2.5">
                  <p className="mb-1 text-xs font-semibold text-content">{t("map.tableGroup", { seats, count })}</p>
                  <p className="text-xs leading-relaxed text-muted">
                    {linesFor(items, [seats]).map((l) => `${l.item.name} ×${l.qty}`).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

/** Buyumlar ro'yxati; soni kiritilmagan buyum "yetishmaydi" deb belgilanmaydi */
function LineList({ lines, unset }: { lines: Line[]; unset: Set<string> }) {
  const t = useTranslations("Inventory");
  return (
    <ul className="space-y-1 text-sm">
      {lines.map(({ item, qty }) => {
        const status = viewStatus(item, unset);
        return (
          <li key={item.id} className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-content">{item.name}</span>
            <span className="flex shrink-0 items-center gap-2">
              {status !== "OK" && (
                <span
                  title={t(`status.${status}`)}
                  className={cn("text-[10px] font-medium uppercase", status === "SHORT" ? "text-danger" : "text-muted")}
                >
                  {t(`status.${status}`)}
                </span>
              )}
              <span className="font-semibold tabular-nums text-content">×{qty}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
