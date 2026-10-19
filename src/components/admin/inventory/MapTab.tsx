"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import FloorMap, { useRoomName, type FloorSelectPoint } from "@/components/floorplan/FloorMap";
import { ROOMS, floorTotals, isDining, roomSeats, type FloorRoom } from "@/lib/floorplan/layout";
import { tableQty } from "@/lib/inventory/calc";
import type { InventoryItemRow, InventoryOverview } from "@/lib/inventory/types";

type Line = { item: InventoryItemRow; qty: number };

/** Berilgan stollar (o'rinlar soni) uchun normaga ko'ra kerak bo'lgan buyumlar */
function linesFor(items: InventoryItemRow[], seatsList: number[]): Line[] {
  return items
    .filter((i) => i.perSeat > 0 || i.perTable > 0)
    .map((item) => ({ item, qty: seatsList.reduce((s, seats) => s + tableQty(item, seats), 0) }))
    .filter((l) => l.qty > 0)
    .sort((a, b) => b.qty - a.qty || a.item.name.localeCompare(b.item.name));
}

/**
 * Inventar → Xarita: restoran rejasi. Xonaga bosilganda sichqoncha yonida qisqa oyna
 * va yon panelda (telefonda — xarita ostida) shu xonadagi stollar va buyumlar soni.
 * Sonlar normadan hisoblanadi: (o'ringa norma × o'rinlar) + stolga norma.
 */
export default function MapTab({ data }: { data: InventoryOverview }) {
  const t = useTranslations("Inventory");
  const tf = useTranslations("Floor");
  const roomName = useRoomName();
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [selected, setSelected] = useState<FloorRoom | null>(null);
  const [pop, setPop] = useState<{ left: number; top: number } | null>(null);

  const totals = useMemo(() => floorTotals(), []);
  // Bazadagi faol stollar xarita bilan mos bo'lmasa (sinxronlanmagan) — eslatma ko'rsatiladi
  const dbDiffers = data.totals.tableCount !== totals.tables || data.totals.seatCount !== totals.seats;
  const hasNorms = data.items.some((i) => i.perSeat > 0 || i.perTable > 0);
  const allSeats = useMemo(() => ROOMS.filter(isDining).flatMap((r) => r.tables.map((tb) => tb.seats)), []);

  // Esc — oynani yopish
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPop(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onSelect(room: FloorRoom, p: FloorSelectPoint) {
    setSelected(room);
    const box = wrapRef.current?.getBoundingClientRect();
    if (!box) return;
    // Oyna sichqoncha yonida, lekin xarita chegarasidan chiqmasin
    const W = 260, H = 230;
    const left = Math.min(Math.max(p.clientX - box.left + 14, 8), Math.max(8, box.width - W - 8));
    const top = Math.min(Math.max(p.clientY - box.top + 14, 8), Math.max(8, box.height - H - 8));
    setPop({ left, top });
  }

  const roomLines = useMemo(
    () => (selected ? linesFor(data.items, selected.tables.map((tb) => tb.seats)) : []),
    [selected, data.items]
  );
  const allLines = useMemo(() => linesFor(data.items, allSeats), [data.items, allSeats]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
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
            badge={(r) => (isDining(r) && r.rect.w > 150 && roomSeats(r).seats > 0
              ? t("map.seatsBadge", { count: roomSeats(r).seats }) : null)}
          />
          {selected && pop && (
            <div
              data-map-pop
              role="dialog"
              aria-label={roomName(selected)}
              style={{ left: pop.left, top: pop.top }}
              className="absolute z-10 w-[260px] rounded-xl border border-line bg-card p-3 text-sm text-content shadow-xl"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <p className="font-semibold">{roomName(selected)}</p>
                <button type="button" onClick={() => setPop(null)} aria-label={t("close")} className="text-muted hover:text-content">
                  <X size={14} />
                </button>
              </div>
              <RoomStats room={selected} />
              {isDining(selected) && roomLines.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {roomLines.slice(0, 6).map((l) => (
                    <li key={l.item.id} className="flex justify-between gap-2">
                      <span className="truncate">{l.item.name}</span>
                      <span className="font-semibold tabular-nums">×{l.qty}</span>
                    </li>
                  ))}
                  {roomLines.length > 6 && (
                    <li className="text-xs text-muted">{t("map.more", { count: roomLines.length - 6 })}</li>
                  )}
                </ul>
              )}
              <button
                type="button"
                onClick={() => {
                  setPop(null);
                  panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                  panelRef.current?.focus();
                }}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-danger hover:underline"
              >
                {t("map.details")} <ChevronRight size={12} />
              </button>
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
        className="min-w-0 rounded-2xl border border-line bg-card p-4 outline-none lg:max-h-[calc(58vh+3rem)] lg:overflow-y-auto"
      >
        {!selected ? (
          <>
            <p className="mb-1 font-semibold text-content">{t("map.allTitle")}</p>
            <p className="mb-3 text-xs text-muted">{t("map.selectHint")}</p>
            {hasNorms ? <LineList lines={allLines} /> : <p className="text-sm text-muted">{t("map.noNorms")}</p>}
          </>
        ) : (
          <>
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="text-lg font-semibold text-content">{roomName(selected)}</p>
                <p className="text-xs text-muted">
                  {tf(`kinds.${selected.kind}`)}
                  {!selected.bookable && <> · {tf("notBookable")}</>}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setSelected(null); setPop(null); }}
                aria-label={t("close")}
                className="rounded p-1 text-muted hover:text-content"
              >
                <X size={16} />
              </button>
            </div>
            <RoomStats room={selected} />
            <div className="mt-3">
              <RoomBody room={selected} lines={roomLines} items={data.items} hasNorms={hasNorms} />
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function RoomStats({ room }: { room: FloorRoom }) {
  const t = useTranslations("Inventory");
  if (!isDining(room) && room.kind !== "bar") return null;
  const s = roomSeats(room);
  return <p className="text-xs text-muted">{t("map.tablesSeats", { tables: s.tables, seats: s.seats })}</p>;
}

function RoomBody({ room, lines, items, hasNorms }: { room: FloorRoom; lines: Line[]; items: InventoryItemRow[]; hasNorms: boolean }) {
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
  if (!hasNorms) return <p className="text-sm text-muted">{t("map.noNorms")}</p>;

  // Bir xil o'rinli stollarni guruhlash: "6 kishilik stol × 8"
  const groups = new Map<number, number>();
  room.tables.forEach((tb) => groups.set(tb.seats, (groups.get(tb.seats) ?? 0) + 1));

  return (
    <>
      <p className="mb-2 text-sm font-medium text-content">{t("map.roomItems")}</p>
      <LineList lines={lines} />
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
  );
}

function LineList({ lines }: { lines: Line[] }) {
  const t = useTranslations("Inventory");
  return (
    <ul className="space-y-1 text-sm">
      {lines.map(({ item, qty }) => (
        <li key={item.id} className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-content">{item.name}</span>
          <span className="flex shrink-0 items-center gap-2">
            {item.status !== "OK" && (
              <span
                title={t(`status.${item.status}`)}
                className={cn("text-[10px] font-medium uppercase", item.status === "SHORT" ? "text-danger" : "text-brand-gold")}
              >
                {t(`status.${item.status}`)}
              </span>
            )}
            <span className="font-semibold tabular-nums text-content">×{qty}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
