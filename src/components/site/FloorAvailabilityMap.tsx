"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Hand, Loader2, Phone, Users } from "lucide-react";
import FloorMap, { useRoomName, type TableVisualState } from "@/components/floorplan/FloorMap";
import { MAP_ZONES, ROOMS, bookableTables, type FloorRoom, type FloorTable } from "@/lib/floorplan/layout";
import type { getAvailability } from "@/lib/reservation/actions";
import { cn, formatMoney, t as tl } from "@/lib/utils";
import HallOverview, { CallCard } from "./floor/HallOverview";
import RoomGallery from "./floor/RoomGallery";
import SelectionDock from "./floor/SelectionDock";
import { ROOM_GLYPH, roomPhotos } from "./floor/roomPhotos";

/**
 * Mijozlar uchun xarita + bo'sh/band stollar (bosh sahifa va bron sahifasining 4-qadami).
 * Bazadagi stol ↔ xarita stoli: Table.number === xarita stoli kodi (VIP-1, Z-3, K-2, A-1).
 * Xaritada kodi topilmagan baza stollari pastda oddiy tugmalar ("Boshqa stollar") bo'lib chiqadi —
 * admin xaritadan stollarni yaratmaguncha ham bron ishlayveradi.
 * Faqat ko'rinish: ma'lumotni (zones) va tanlovni chaqiruvchi boshqaradi.
 *
 * Joylashuv: xarita butun kenglikda (katta), ostida belgilar va panel — tanlangan xonaning haqiqiy
 * rasmi, stollar, bron tugmasi. Stol tanlanmaganda panelda zallar ro'yxati (rasmlari bilan).
 * dockAction berilsa — tanlangan stol uchun tezkor "dok": katta ekranda xarita burchagida, telefonda
 * ekran pastida (paneldagi tugma ko'rinib turganda yashiriladi).
 *
 * Telefonda xarita kichik (stol ~30px) — shuning uchun xarita ostida "Ro'yxatdan tanlash" bloki:
 * har bir stol katta (≥44px) tugma, xonalar bo'yicha guruhlangan (quickPick, standart — yoqilgan).
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
  dockAction,
  quickPick = true,
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
  /** Dok uchun ixcham tugma (masalan "Bron qilish"); berilmasa — dok ko'rsatilmaydi */
  dockAction?: (table: AvailTable, info: TablePick) => React.ReactNode;
  /** Telefon/planshetda xarita ostidagi katta tugmali stollar ro'yxati (lg dan kichik ekranlarda) */
  quickPick?: boolean;
}) {
  const tb = useTranslations("Booking");
  const ts = useTranslations("Site");
  const tf = useTranslations("Floor");
  const tp = useTranslations("Pages2");
  const locale = useLocale();
  const roomName = useRoomName();
  const dark = tone === "dark";
  // Ranglar faqat tokenlar: "dark" — tungi blok (namuna 2), "theme" — krem bo'lim (yorug'/qorong'i tema)
  const C = dark
    ? {
        card: "border-brand-gold/25 bg-night-2 text-brand-cream",
        muted: "text-brand-cream/65",
        divider: "border-brand-cream/12",
        chip: "border-brand-cream/20 bg-night-3 text-brand-cream hover:border-brand-gold",
        eyebrow: "text-brand-gold-light",
        link: "text-saffron hover:text-brand-gold-light",
        legend: "border border-brand-gold/20 bg-night-2/80 text-brand-cream/80",
      }
    : {
        card: "border-line bg-card text-content",
        muted: "text-muted",
        divider: "border-line",
        chip: "border-line bg-card text-content hover:border-fire",
        eyebrow: "text-fire-ink",
        link: "text-fire-ink underline decoration-fire/40 underline-offset-4 hover:decoration-2",
        legend: "border border-line bg-sand text-muted",
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

  // Dok: foydalanuvchi yopgan stol (boshqa stol tanlansa — yana chiqadi)
  const [dockClosedFor, setDockClosedFor] = useState<string | null>(null);
  // Panel tugmasi ekranda ko'rinib turganda dok yashiriladi (bir xil tugma ikki joyda turmasin)
  const [inlineSeen, setInlineSeen] = useState(false);
  const inlineRef = useCallback((el: HTMLDivElement | null) => {
    if (!el || typeof IntersectionObserver === "undefined") return;
    // Bir chaqiruvda bir nechta yozuv kelishi mumkin — oxirgisi joriy holat
    const io = new IntersectionObserver((list) => setInlineSeen(list[list.length - 1].isIntersecting), { threshold: 0.5 });
    io.observe(el);
    return () => {
      io.disconnect();
      setInlineSeen(false);
    };
  }, []);

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

  // "Ro'yxatdan tanlash": xarita stollari bazadagi stolga bog'langanlari, zallar bo'yicha (VIP, zal, kabina, alohida)
  const quick = useMemo(() => {
    const lang = (["uz", "ru", "en", "zh"] as const).find((l) => l === locale) ?? "uz";
    const all = bookableTables(ROOMS).filter((x) => db.byCode.has(norm(x.table.code ?? "")));
    return MAP_ZONES
      .map((z) => ({ key: z.key, name: z.name[lang], items: all.filter((x) => z.kinds.includes(x.room.kind)) }))
      .filter((g) => g.items.length > 0);
  }, [db, locale]);
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
  // Bo'sh panel (zallar haqida) uchun: xarita stoli hozir bo'shmi
  const isFreeMap = useCallback((mt: FloorTable) => {
    const v = visualOf(entryFor(mt));
    return v === "free" || v === "selected";
  }, [visualOf, entryFor]);

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
            <p className={cn("font-display text-4xl leading-none", dark && "text-brand-gold-light")}>{code}</p>
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
        <h3 className="mt-1 font-display text-2xl leading-tight sm:text-3xl">{roomName(room)}</h3>

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
                      "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition",
                      C.chip,
                      active && "border-brand-gold ring-2 ring-brand-gold/40",
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

  // Telefon/planshet: katta tugmali stollar ro'yxati (xaritadagi kichik stollarni bosish qiyin).
  // Xarita bilan panel orasida turadi; tanlangach bron tugmasi ekran pastidagi dokda (dockAction) yoki panelda.
  const quickList = quickPick && loaded && quick.length > 0 && (
    <div className={cn("mt-4 rounded-2xl border p-4 lg:hidden", dark ? "border-brand-cream/10 bg-night-2/60" : "border-line bg-card")}>
      <p className={cn("text-[11px] font-semibold uppercase tracking-[0.22em]", C.eyebrow)}>{tp("quickPick")}</p>
      <p className={cn("mt-1 text-xs", C.muted)}>{tp("quickPickHint")}</p>
      <div className="mt-3 space-y-4">
        {quick.map((grp) => (
          <div key={grp.key}>
            <p className={cn("mb-2 font-display text-base", dark ? "text-brand-cream" : "text-content")}>{grp.name}</p>
            <div className="flex flex-wrap gap-2">
              {grp.items.map(({ table: mt, room }) => {
                const e = entryFor(mt);
                const v = visualOf(e);
                const can = v === "free" || v === "selected";
                return (
                  <button
                    key={mt.id}
                    type="button"
                    disabled={!can}
                    aria-pressed={v === "selected"}
                    aria-label={tableLabel(mt)}
                    onClick={() => pickTable(mt, room)}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition disabled:cursor-not-allowed disabled:opacity-45",
                      v === "selected" ? "border-brand-gold bg-brand-gold text-brand-ink" : C.chip
                    )}
                  >
                    <span className={cn("h-2.5 w-2.5 rounded-full", DOT[v])} />
                    <b className="font-semibold">{mt.code}</b>
                    <span className={v === "selected" ? "text-brand-ink/70" : C.muted}>{e?.table.seats ?? mt.seats}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ---- Panel: tanlangan stol uchun bron bloki (chaqiruvchining tugmasi) ----
  // action null qaytarsa (masalan, yuklanayotganda) — bo'sh quti chizilmaydi
  const actionNode = selectedFree && action ? action(selectedFree.table, pickInfo) : null;
  const actionBlock = selectedFree && (actionNode || !showingSelected) ? (
    <div ref={actionNode ? inlineRef : undefined} className={cn("rounded-xl border p-4", dark ? "border-brand-gold/25 bg-night-3/50" : "border-line bg-sand/50")}>
      {!showingSelected && (
        <p className={cn("flex items-center gap-2 text-sm", actionNode && "mb-3")}>
          <span className={cn("h-2 w-2 shrink-0 rounded-full", DOT.selected)} />
          {tb("selectedLine", { code: selectedFree.table.number })} · {tb("seats", { count: selectedFree.table.seats })}
        </p>
      )}
      {actionNode}
    </div>
  ) : null;
  const callCard = phone ? <CallCard phone={phone} dark={dark} /> : null;

  // ---- Dok: tanlangan bo'sh stol + ixcham bron tugmasi ----
  const dockEntry = dockAction && selectedFree && !loading ? selectedFree : undefined;
  const dockRoom = dockEntry ? pickInfo.room : null;
  const dockProps = dockEntry ? {
    eyebrow: dockRoom ? roomName(dockRoom) : tl(dockEntry.zone.name, locale),
    code: dockEntry.table.number,
    seats: tb("seats", { count: dockEntry.table.seats }),
    photo: dockRoom ? roomPhotos(dockRoom, pickInfo.mapTable)[0] ?? null : null,
    glyph: dockRoom ? ROOM_GLYPH[dockRoom.kind] : "席",
    action: dockAction?.(dockEntry.table, pickInfo),
    label: tb("selectedLine", { code: dockEntry.table.number }),
  } : null;

  return (
    <div className={cn("min-w-0", className)}>
      {/* ---- Xarita (butun kenglikda) ---- */}
      <div className="relative min-w-0">
        {/* Xarita atrofidagi oltin ramka (FloorMap'ning o'zi o'zgarmaydi — faqat tashqi ko'rinishi) */}
        <div className={cn("relative rounded-[18px] p-[3px] sm:p-1", dark ? "bg-gradient-to-br from-brand-gold/50 via-brand-gold/10 to-brand-gold/40" : "bg-gradient-to-br from-brand-gold/60 via-line to-brand-gold/50")}>
          <FloorMap
            className="aspect-[1450/880] w-full rounded-[15px] border-brand-gold/20"
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
            <div className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-night/90 p-1.5 text-xs text-brand-cream shadow-lg sm:left-4 sm:top-4 sm:px-3">
              {/* Telefonda faqat belgi — kichik xaritaning ko'p qismini yopmasin */}
              <Loader2 size={14} className="animate-spin text-brand-gold-light" /> <span className="sr-only sm:not-sr-only">{tb("loading")}</span>
            </div>
          )}
          {/* Katta ekran: dok xaritaning pastki-chap qismida — bar, qabulxona va kirish (band qilinmaydigan joy) ustida */}
          {dockProps && (
            <div className="absolute bottom-3 left-3 z-10 hidden w-[min(46%,36rem)] lg:block">
              <SelectionDock
                variant="overlay"
                show={dockClosedFor !== dockProps.code && !inlineSeen}
                onClose={() => setDockClosedFor(dockProps.code)}
                closeLabel={ts("close")}
                {...dockProps}
              />
            </div>
          )}
        </div>
        {/* Telefonda FloorMap o'z maslahatini yashiradi — qisqa maslahat shu yerda */}
        <p className={cn("mt-2 flex items-center gap-1.5 text-xs sm:hidden", C.muted)}>
          <Hand size={13} aria-hidden="true" /> {tp("mapTouchHint")}
        </p>
        {/* Belgilar (xaritadagi ko'rinish bilan bir xil) */}
        <div className={cn("mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl px-4 py-3 text-xs", C.legend)}>
          <Legend swatch="border-brand-gold bg-brand-gold/15" label={ts("rFree")} />
          <Legend swatch="border-brand-red bg-brand-red/40" label={ts("rBusy")} />
          <Legend swatch="border-brand-gold bg-transparent opacity-60" label={ts("rSmall")} />
          <Legend swatch="border-brand-gold-light bg-brand-gold" label={ts("rSelected")} />
          {loaded && (
            <span
              className={cn(
                "ml-auto inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold",
                dark ? "border-brand-gold/40 bg-brand-gold/10 text-brand-gold-light" : "border-brand-gold/60 bg-card text-content"
              )}
            >
              <span aria-hidden="true" className="relative flex h-2 w-2">
                {db.free > 0 && <span className="absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-60 motion-safe:animate-ping" />}
                <span className={cn("relative inline-flex h-2 w-2 rounded-full", db.free > 0 ? "bg-brand-gold" : "bg-brand-red")} />
              </span>
              {tb("freeCount", { count: db.free })}
            </span>
          )}
        </div>
      </div>

      {quickList}

      {/* ---- Panel: xona rasmi, stollar va bron (xarita ostida, butun kenglikda) ---- */}
      <section aria-live="polite" className={cn("relative mt-4 overflow-hidden rounded-[1.25rem] border p-4 sm:p-6 lg:mt-5 lg:p-7", C.card)}>
        {/* Panel bezagi: yuqori oltin chiziq va xira ieroglif */}
        <span aria-hidden="true" className="hairline-gold pointer-events-none absolute inset-x-6 top-0" />
        <span
          aria-hidden="true"
          lang="zh"
          className={cn("font-cn pointer-events-none absolute -bottom-6 -right-2 select-none text-[7rem] leading-none", dark ? "text-brand-gold/[0.06]" : "text-fire/[0.05]")}
        >
          席
        </span>

        {focusRoom ? (
          // Katta ekranda: chapda katta rasm (panelning "yuzi"), o'ngda ma'lumot, bron va telefon
          <div className="relative grid gap-5 lg:grid-cols-2 lg:gap-8 xl:gap-10">
            <RoomGallery
              key={`${focusRoom.id}:${focusTable?.id ?? ""}`}
              photos={roomPhotos(focusRoom, focusTable)}
              glyph={ROOM_GLYPH[focusRoom.kind]}
              label={tf(`kinds.${focusRoom.kind}`)}
            />
            <div className="flex min-w-0 flex-col gap-5">
              <div className="min-w-0">{roomInfo(focusRoom)}</div>
              {actionBlock}
              {callCard && <div className="lg:mt-auto">{callCard}</div>}
            </div>
          </div>
        ) : selected ? (
          <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-8">
            {tableDetails(selected.table.number, selected.table.seats, selected, tl(selected.zone.name, locale))}
            {(actionBlock || callCard) && (
              <div className="flex min-w-0 flex-col gap-4">
                {actionBlock}
                {callCard}
              </div>
            )}
          </div>
        ) : (
          <div className="relative grid gap-5 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-5">
            <div className="min-w-0 lg:col-start-1 lg:row-start-1">
              <p className={cn("text-[11px] uppercase tracking-[0.25em]", C.eyebrow)}>{ts("rTable")}</p>
              <h3 className="mt-1 font-display text-2xl sm:text-3xl">{tb("introTitle")}</h3>
              <p className={cn("mt-2 text-sm leading-relaxed", C.muted)}>{tb("introText")}</p>
            </div>
            <HallOverview loaded={loaded} isFree={isFreeMap} dark={dark} className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1" />
            {callCard && <div className="min-w-0 lg:col-start-1 lg:row-start-2 lg:self-end">{callCard}</div>}
          </div>
        )}
      </section>

      {/* Xaritaga hali bog'lanmagan baza stollari — bron baribir ishlaydi */}
      {loaded && db.unmatched.length > 0 && (
        <div className={cn("mt-5 border-t pt-5", C.divider)}>
          <p className={cn("font-display text-lg", dark ? "text-brand-cream" : "text-content")}>{tb("otherTables")}</p>
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
                    "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition disabled:cursor-not-allowed disabled:opacity-50",
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

      {/* Telefon/planshet: ekran pastiga yopishgan dok (bo'lim ichida). Balandligi 0 — oxirida joy egallamaydi.
          Telefonda "tepaga" tugmasidan (ScrollRail) yuqorida turadi. */}
      {dockProps && (
        <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 h-0 md:bottom-4 lg:hidden">
          <div className="absolute inset-x-0 bottom-0">
            <SelectionDock variant="bar" show={!inlineSeen} {...dockProps} />
          </div>
        </div>
      )}
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("h-3.5 w-3.5 rounded-full border-2", swatch)} /> {label}
    </span>
  );
}
