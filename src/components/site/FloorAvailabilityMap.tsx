"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Phone, Users } from "lucide-react";
import FloorMap, { useRoomName, type TableVisualState } from "@/components/floorplan/FloorMap";
import { ROOMS, bookableTables, type FloorRoom, type FloorTable } from "@/lib/floorplan/layout";
import type { getAvailability } from "@/lib/reservation/actions";
import { cn, formatMoney, t as tl } from "@/lib/utils";

/**
 * Mijozlar uchun xarita + bo'sh/band stollar (bosh sahifa va bron sahifasining 4-qadami).
 * Bazadagi stol ↔ xarita stoli: Table.number === xarita stoli kodi (VIP-1, Z-3, K-2, A-1).
 * Xaritada kodi topilmagan baza stollari pastda oddiy tugmalar ("Boshqa stollar") bo'lib chiqadi —
 * admin xaritadan stollarni yaratmaguncha ham bron ishlayveradi.
 * Faqat ko'rinish: ma'lumotni (zones) va tanlovni chaqiruvchi boshqaradi.
 */

export type AvailZone = Awaited<ReturnType<typeof getAvailability>>["zones"][number];
export type AvailTable = AvailZone["tables"][number];
/** Tanlangan stol xaritaning qayerida (xaritada yo'q stol uchun ikkalasi null) */
export type TablePick = { room: FloorRoom | null; mapTable: FloorTable | null };

type Entry = { table: AvailTable; zone: AvailZone };

const norm = (s: string) => s.trim().toUpperCase();
/** Xaritadagi band qilinadigan stollar: KOD → { stol, xona } */
const MAP_BY_CODE = new Map(bookableTables(ROOMS).map((x) => [norm(x.table.code ?? ""), x]));

export default function FloorAvailabilityMap({
  zones,
  selectedTableId,
  onSelectTable,
  className,
  tone = "theme",
  loading = false,
  phone,
  action,
}: {
  /** getAvailability natijasi; null — hali yuklanmagan (stollar oddiy ko'rinishda) */
  zones: AvailZone[] | null;
  selectedTableId: string | null;
  onSelectTable: (table: AvailTable, info: TablePick) => void;
  className?: string;
  /** "dark" — bosh sahifaning qorong'i bo'limi; "theme" — sayt mavzusi tokenlari */
  tone?: "dark" | "theme";
  loading?: boolean;
  /** Xona 1/2 va onlayn bron qilib bo'lmaydigan stollar uchun "qo'ng'iroq qiling" havolasi */
  phone?: string;
  /** Tanlangan (bo'sh) stol uchun kartadagi tugma(lar), masalan "Shu stolni band qilish" */
  action?: (table: AvailTable, info: TablePick) => React.ReactNode;
}) {
  const tb = useTranslations("Booking");
  const ts = useTranslations("Site");
  const tf = useTranslations("Floor");
  const locale = useLocale();
  const roomName = useRoomName();
  const dark = tone === "dark";
  const C = dark
    ? {
        card: "border-brand-cream/15 bg-brand-ink-soft text-brand-cream",
        muted: "text-brand-cream/60",
        divider: "border-brand-cream/10",
        chip: "border-brand-cream/15 text-brand-cream hover:border-brand-gold/70",
        eyebrow: "text-brand-gold",
        link: "text-brand-gold-light hover:text-brand-gold",
      }
    : {
        card: "border-line bg-card text-content",
        muted: "text-muted",
        divider: "border-line",
        chip: "border-line text-content hover:border-brand-gold",
        eyebrow: "text-muted",
        link: "text-content underline decoration-brand-gold underline-offset-4 hover:decoration-2",
      };
  const DOT: Record<TableVisualState, string> = {
    free: "bg-brand-gold ring-2 ring-brand-gold/30",
    selected: "bg-brand-gold-light ring-2 ring-brand-gold",
    busy: "bg-brand-red",
    small: dark ? "bg-brand-cream/35" : "bg-muted",
    off: dark ? "bg-brand-cream/15" : "bg-line",
  };

  // Kartada nima ko'rsatiladi: foydalanuvchi bosgan xona (va stol). null — tanlovdan kelib chiqadi
  const [focus, setFocus] = useState<{ roomId: string; tableId?: string } | null>(null);

  const db = useMemo(() => {
    const byCode = new Map<string, Entry>();
    const byId = new Map<string, Entry>();
    const unmatched: Entry[] = [];
    for (const zone of zones ?? []) {
      for (const table of zone.tables) {
        const e = { table, zone };
        byId.set(table.id, e);
        const key = norm(table.number);
        // Xaritada shu kod bo'lsa — xaritaga bog'lanadi; bo'lmasa yoki takror kod — pastdagi ro'yxatga
        if (MAP_BY_CODE.has(key) && !byCode.has(key)) byCode.set(key, e);
        else unmatched.push(e);
      }
    }
    const free = [...byId.values()].filter((e) => e.table.state === "free").length;
    return { byCode, byId, unmatched, free };
  }, [zones]);

  const loaded = zones !== null;
  const entryFor = useCallback((mt: FloorTable) => (mt.code ? db.byCode.get(norm(mt.code)) : undefined), [db]);

  const visualOf = useCallback((e: Entry | undefined): TableVisualState => {
    if (!e) return "off";
    const s = e.table.state;
    if (s === "free") return e.table.id === selectedTableId ? "selected" : "free";
    return s === "maintenance" ? "off" : s;
  }, [selectedTableId]);

  const stateText = useCallback((v: TableVisualState) => ({
    free: ts("rFree"), busy: ts("rBusy"), small: ts("rSmall"), selected: ts("rSelected"), off: tb("stateOff"),
  })[v], [ts, tb]);

  // FloorMap uchun (barqaror funksiyalar — xarita qatlami keraksiz qayta chizilmaydi)
  const tableState = useCallback((mt: FloorTable) => (loaded ? visualOf(entryFor(mt)) : null), [loaded, visualOf, entryFor]);
  const tableLabel = useCallback((mt: FloorTable) => {
    const e = entryFor(mt);
    const parts = [mt.code ?? "", tb("seats", { count: e?.table.seats ?? mt.seats })];
    if (loaded) parts.push(stateText(visualOf(e)));
    return parts.join(" · ");
  }, [entryFor, loaded, stateText, visualOf, tb]);
  const dimRoom = useCallback((room: FloorRoom) => !room.bookable, []);

  function pickTable(mt: FloorTable, room: FloorRoom) {
    setFocus({ roomId: room.id, tableId: mt.id });
    const e = entryFor(mt);
    if (e && e.table.state === "free") onSelectTable(e.table, { room, mapTable: mt });
  }

  function pickRoom(room: FloorRoom) {
    // Bitta stolli xona (VIP, kabina, alohida stol) — xonaga bosish = stolni tanlash
    const coded = room.bookable ? room.tables.filter((x) => x.code) : [];
    if (coded.length === 1) return pickTable(coded[0], room);
    setFocus({ roomId: room.id });
  }

  // ---- Tanlangan stol va karta holati ----
  const selected = selectedTableId ? db.byId.get(selectedTableId) : undefined;
  const selectedLoc = selected && db.byCode.get(norm(selected.table.number)) === selected
    ? MAP_BY_CODE.get(norm(selected.table.number)) : undefined;
  const view = focus ?? (selectedLoc ? { roomId: selectedLoc.room.id, tableId: selectedLoc.table.id } : null);
  const focusRoom = view ? ROOMS.find((r) => r.id === view.roomId) ?? null : null;
  const focusTable = focusRoom
    ? (view?.tableId ? focusRoom.tables.find((x) => x.id === view.tableId) : undefined)
      ?? (selectedLoc?.room.id === focusRoom.id ? selectedLoc.table : undefined)
      ?? null
    : null;
  const selectedFree = selected && selected.table.state === "free" ? selected : undefined;
  const pickInfo: TablePick = { room: selectedLoc?.room ?? null, mapTable: selectedLoc?.table ?? null };
  // Kartada aynan tanlangan stol ko'rsatilyaptimi (unda pastdagi "tanlangan" qatori takrorlanmaydi)
  const showingSelected = !!selectedFree && (
    focusRoom ? !!focusTable && focusTable.id === selectedLoc?.table.id : true
  );

  const tel = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const phoneLink = tel && (
    <a href={tel} className={cn("mt-2 inline-flex items-center gap-1.5 text-sm font-medium", C.link)}>
      <Phone size={14} /> {phone}
    </a>
  );

  // Eslatma: quyidagilar komponent emas, oddiy render funksiyalar — har renderda qayta
  // o'rnatilmaydi (tugmalardagi klaviatura fokusi yo'qolmaydi).
  const pill = (v: TableVisualState) => (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs", C.divider)}>
      <span className={cn("h-2 w-2 rounded-full", DOT[v])} /> {stateText(v)}
    </span>
  );

  const tableDetails = (code: string, seats: number, entry: Entry | undefined, sub?: string) => {
    const v = loaded ? visualOf(entry) : null;
    return (
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-3xl leading-none">{code}</p>
            {sub && <p className={cn("mt-1 text-xs", C.muted)}>{sub}</p>}
          </div>
          {v && pill(v)}
        </div>
        <p className={cn("mt-3 flex items-center gap-1.5 text-sm", C.muted)}>
          <Users size={14} /> {tb("seats", { count: seats })}
        </p>
        {entry?.table.minSpend ? (
          <p className="mt-1 text-sm">{ts("rMinSpend")}: <b>{formatMoney(entry.table.minSpend)}</b></p>
        ) : null}
        {v === "busy" && <p className={cn("mt-3 text-sm", C.muted)}>{tb("busyHint")}</p>}
        {v === "small" && <p className={cn("mt-3 text-sm", C.muted)}>{tb("smallHint", { count: seats })}</p>}
        {v === "off" && (
          <>
            <p className={cn("mt-3 text-sm", C.muted)}>{tb("offHint")}</p>
            {phoneLink}
          </>
        )}
      </div>
    );
  };

  const roomInfo = (room: FloorRoom) => {
    const coded = room.tables.filter((x) => x.code);
    const multi = room.bookable && coded.length > 1;
    return (
      <div>
        {tf(`kinds.${room.kind}`) !== roomName(room) && (
          <p className={cn("text-[11px] uppercase tracking-[0.25em]", C.eyebrow)}>{tf(`kinds.${room.kind}`)}</p>
        )}
        <h3 className="mt-1 font-display text-2xl">{roomName(room)}</h3>

        {focusTable && (
          <div className={cn("mt-4", multi && cn("rounded-xl border p-3", C.divider))}>
            {tableDetails(focusTable.code ?? "", entryFor(focusTable)?.table.seats ?? focusTable.seats, entryFor(focusTable))}
          </div>
        )}

        {multi && (
          <div className="mt-4">
            {!focusTable && <p className={cn("mb-2 text-sm", C.muted)}>{tb("hallHint")}</p>}
            <div className="flex flex-wrap gap-2">
              {coded.map((mt) => {
                const e = entryFor(mt);
                const v = loaded ? visualOf(e) : null;
                const active = focusTable?.id === mt.id;
                return (
                  <button
                    key={mt.id}
                    type="button"
                    onClick={() => pickTable(mt, room)}
                    aria-pressed={active}
                    aria-label={tableLabel(mt)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition",
                      C.chip,
                      active && "border-brand-gold",
                      v && v !== "free" && v !== "selected" && "opacity-60"
                    )}
                  >
                    {v && <span className={cn("h-2 w-2 rounded-full", DOT[v])} />}
                    <b className="font-semibold">{mt.code}</b>
                    <span className={C.muted}>· {e?.table.seats ?? mt.seats}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {room.bookable && room.tables.length === 0 && (
          <>
            <p className={cn("mt-3 text-sm", C.muted)}>{tb("phoneOnly")}</p>
            {phoneLink}
          </>
        )}
        {!room.bookable && <p className={cn("mt-3 text-sm", C.muted)}>{tb(`info.${room.kind}`)}</p>}
      </div>
    );
  };

  return (
    <div className={cn("min-w-0", className)}>
      {/* Belgilar (xaritadagi ko'rinish bilan bir xil) */}
      <div className={cn("mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs", C.muted)}>
        <Legend swatch="border-brand-gold bg-brand-gold/15" label={ts("rFree")} />
        <Legend swatch="border-brand-red bg-brand-red/40" label={ts("rBusy")} />
        <Legend swatch="border-brand-gold bg-transparent opacity-60" label={ts("rSmall")} />
        <Legend swatch="border-brand-gold-light bg-brand-gold" label={ts("rSelected")} />
        {loaded && <span className="ml-auto">{tb("freeCount", { count: db.free })}</span>}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-5">
        <div className="relative min-w-0">
          <FloorMap
            className="aspect-[1450/880] w-full"
            selectedId={focusRoom?.id ?? null}
            onSelect={pickRoom}
            onSelectTable={pickTable}
            tableState={tableState}
            tableLabel={tableLabel}
            dimRoom={dimRoom}
            hint={tb("mapHint")}
            pageScroll
          />
          {loading && (
            <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-brand-ink/85 px-3 py-1.5 text-xs text-brand-cream shadow-lg">
              <Loader2 size={14} className="animate-spin" /> {tb("loading")}
            </div>
          )}
        </div>

        <aside aria-live="polite" className={cn("min-w-0 rounded-2xl border p-5", C.card)}>
          {focusRoom ? (
            roomInfo(focusRoom)
          ) : selected ? (
            tableDetails(selected.table.number, selected.table.seats, selected, tl(selected.zone.name, locale))
          ) : (
            <div>
              <p className={cn("text-[11px] uppercase tracking-[0.25em]", C.eyebrow)}>{ts("rTable")}</p>
              <h3 className="mt-1 font-display text-2xl">{tb("introTitle")}</h3>
              <p className={cn("mt-2 text-sm", C.muted)}>{tb("introText")}</p>
            </div>
          )}

          {selectedFree && (action || !showingSelected) && (
            <div className={cn("mt-5 border-t pt-4", C.divider)}>
              {!showingSelected && (
                <p className="mb-3 flex items-center gap-2 text-sm">
                  <span className={cn("h-2 w-2 rounded-full", DOT.selected)} />
                  {tb("selectedLine", { code: selectedFree.table.number })} · {tb("seats", { count: selectedFree.table.seats })}
                </p>
              )}
              {action?.(selectedFree.table, pickInfo)}
            </div>
          )}
        </aside>
      </div>

      {/* Xaritaga hali bog'lanmagan baza stollari — bron baribir ishlaydi */}
      {loaded && db.unmatched.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-medium">{tb("otherTables")}</p>
          <p className={cn("mb-3 text-xs", C.muted)}>{tb("otherTablesHint")}</p>
          <div className="flex flex-wrap gap-2">
            {db.unmatched.map((e) => {
              const v = visualOf(e);
              const can = e.table.state === "free";
              return (
                <button
                  key={e.table.id}
                  type="button"
                  disabled={!can}
                  aria-pressed={v === "selected"}
                  onClick={() => {
                    setFocus(null);
                    onSelectTable(e.table, { room: null, mapTable: null });
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50",
                    v === "selected" ? "border-brand-gold bg-brand-gold text-brand-ink" : C.chip
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", DOT[v])} />
                  <b className="font-semibold">{e.table.number}</b>
                  <span className={v === "selected" ? "text-brand-ink/70" : C.muted}>
                    {tb("seats", { count: e.table.seats })} · {v === "selected" ? ts("rSelected") : stateText(v)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loaded && db.byId.size === 0 && (
        <div className={cn("mt-5 rounded-2xl border p-4 text-sm", C.card)}>
          <p className={C.muted}>{tb("noTables")}</p>
          {phoneLink}
        </div>
      )}
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-3.5 w-3.5 rounded-full border-2", swatch)} /> {label}
    </span>
  );
}
