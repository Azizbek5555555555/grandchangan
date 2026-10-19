"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Maximize2, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BOOTH_GROUP, BUILDING, ROOMS, VIEWBOX,
  type ChairSides, type Decor, type FloorRoom, type FloorTable,
} from "@/lib/floorplan/layout";

/**
 * Restoranning interaktiv 2D xaritasi (umumiy komponent: admin inventari va mijozlar sayti).
 * - Surish: sichqoncha/barmoq bilan tortish
 * - Kattalashtirish: g'ildirak (kursor atrofida), ikki barmoq (pinch), +/− tugmalar, ikki marta bosish
 * - Xonaga bosish: onSelect(xona, ekrandagi nuqta) — chaqiruvchi o'zi oyna/panel ko'rsatadi
 * - Stolga bosish (ixtiyoriy, sayt uchun): onSelectTable(stol, xona, nuqta) — xonaga bosishdan ustun
 * Xarita doim qorong'i uslubda (rasmdagidek), sayt mavzusidan qat'i nazar.
 *
 * Unumdorlik: surish/kattalashtirishda faqat tashqi <g> transformi o'zgaradi — xonalar va stollar
 * qatlami (MapLayer) memo qilingan va qayta chizilmaydi.
 */

type View = { x: number; y: number; k: number };
const MIN_K = 0.8;
const MAX_K = 5;
const CLICK_SLOP = 5; // px — shundan kam siljisa "bosish" hisoblanadi
const clampK = (k: number) => Math.min(MAX_K, Math.max(MIN_K, k));

/** Xona nomi (tarjima bilan): "VIP 2", "Katta zal", "Kabina 3" */
export function useRoomName() {
  const t = useTranslations("Floor");
  return useCallback((room: FloorRoom) => t(`rooms.${room.kind}`, { n: room.num ?? "" }).trim(), [t]);
}

export type FloorSelectPoint = { clientX: number; clientY: number };

/** Stolning xaritadagi ko'rinishi (sayt): bo'sh, band, sig'masligi, bron yo'q, tanlangan */
export type TableVisualState = "free" | "busy" | "small" | "off" | "selected";

type TableStateFn = (t: FloorTable, room: FloorRoom) => TableVisualState | null;
type TableLabelFn = (t: FloorTable, room: FloorRoom) => string;

export default function FloorMap({
  rooms = ROOMS,
  selectedId,
  onSelect,
  badge,
  className,
  tableState,
  onSelectTable,
  dimRoom,
  tableLabel,
  hint,
  pageScroll = false,
}: {
  rooms?: FloorRoom[];
  selectedId?: string | null;
  onSelect?: (room: FloorRoom, point: FloorSelectPoint) => void;
  /** Xona ostidagi kichik yozuv (masalan, "8 o'rin"); null — ko'rsatilmaydi */
  badge?: (room: FloorRoom) => string | null;
  className?: string;
  /** Stol holati (rang); berilmasa yoki null — oddiy ko'rinish (admin) */
  tableState?: TableStateFn;
  /** Berilsa — kodli stollar bosiladigan bo'ladi (klaviatura bilan ham) */
  onSelectTable?: (t: FloorTable, room: FloorRoom, point: FloorSelectPoint) => void;
  /** true — xona xiralashtiriladi (masalan, band qilib bo'lmaydigan joylar) */
  dimRoom?: (room: FloorRoom) => boolean;
  /** Stolning ekran o'quvchi uchun nomi (kod, o'rinlar, holat); bo'lmasa — stol kodi */
  tableLabel?: TableLabelFn;
  /** Pastdagi maslahat matni; undefined — standart (Floor.hint), null — ko'rsatilmaydi */
  hint?: string | null;
  /**
   * Sahifa ichidagi xarita (sayt): g'ildirak faqat Ctrl bilan (trackpad pinch ham) kattalashtiradi,
   * aks holda sahifa scroll bo'ladi; telefonda kattalashtirilmagan xaritada vertikal surish sahifani
   * aylantiradi. false (admin) — avvalgidek: g'ildirak doim kattalashtiradi.
   */
  pageScroll?: boolean;
}) {
  const t = useTranslations("Floor");
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setViewState] = useState<View>({ x: 0, y: 0, k: 1 });
  // Eng so'nggi ko'rinish (pinch boshlanishida render kutmasdan o'qish uchun)
  const viewRef = useRef<View>(view);
  const setView = useCallback((next: View | ((v: View) => View)) => {
    setViewState((v) => {
      const nv = typeof next === "function" ? next(v) : next;
      viewRef.current = nv;
      return nv;
    });
  }, []);
  const [dragging, setDragging] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    sx: number; sy: number; lx: number; ly: number; moved: boolean;
    roomId: string | null; tableId: string | null;
    pinch?: { dist: number; view: View; mid: { x: number; y: number } };
  } | null>(null);

  // Klaviatura uchun eng so'nggi callback'lar (memo qatlam qayta chizilmasligi uchun ref orqali)
  const cbRef = useRef({ onSelect, onSelectTable });
  useEffect(() => {
    cbRef.current = { onSelect, onSelectTable };
  });

  // Ekran (client) koordinatasi → SVG koordinatasi (view transformidan oldin)
  const toSvg = useCallback((cx: number, cy: number) => {
    const m = svgRef.current?.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(cx, cy).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }, []);

  // Chegaralar: kattalashtirilganda xaritaning istalgan chetiga borish mumkin, lekin undan
  // tashqariga chiqib ketmaydi (ozgina zaxira bilan). Kichiklashtirilganda — markazda turadi.
  const clampView = useCallback((v: View): View => {
    const M = 60;
    const x0 = VIEWBOX.x, x1 = VIEWBOX.x + VIEWBOX.w, y0 = VIEWBOX.y, y1 = VIEWBOX.y + VIEWBOX.h;
    if (v.k <= 1) return { k: v.k, x: ((x0 + x1) / 2) * (1 - v.k), y: ((y0 + y1) / 2) * (1 - v.k) };
    const minX = x1 * (1 - v.k) - M, maxX = x0 * (1 - v.k) + M;
    const minY = y1 * (1 - v.k) - M, maxY = y0 * (1 - v.k) + M;
    return { k: v.k, x: Math.min(maxX, Math.max(minX, v.x)), y: Math.min(maxY, Math.max(minY, v.y)) };
  }, []);

  // p (SVG koordinata) nuqtasi joyida qolgan holda kattalashtirish
  const zoomAt = useCallback((px: number, py: number, factor: number) => {
    setView((v) => {
      const k = clampK(v.k * factor);
      const cx = (px - v.x) / v.k, cy = (py - v.y) / v.k;
      return clampView({ k, x: px - cx * k, y: py - cy * k });
    });
  }, [clampView, setView]);

  const zoomCenter = (factor: number) => zoomAt(VIEWBOX.x + VIEWBOX.w / 2, VIEWBOX.y + VIEWBOX.h / 2, factor);

  // G'ildirak — passive:false kerak (sahifa scroll bo'lmasligi uchun preventDefault).
  // pageScroll rejimida Ctrl'siz g'ildirak sahifaga qoldiriladi (Lenis ham Ctrl'li hodisaga tegmaydi).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      if (pageScroll && !e.ctrlKey) return;
      e.preventDefault();
      const p = toSvg(e.clientX, e.clientY);
      zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0015));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [toSvg, zoomAt, pageScroll]);

  const hitAt = (target: EventTarget | null) => {
    const el = target instanceof Element ? target : null;
    return {
      roomId: el?.closest("[data-room]")?.getAttribute("data-room") ?? null,
      tableId: el?.closest("[data-table]")?.getAttribute("data-table") ?? null,
    };
  };

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      gesture.current = { sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, moved: false, ...hitAt(e.target) };
    } else if (pointers.current.size === 2 && gesture.current) {
      const [a, b] = [...pointers.current.values()];
      const mid = toSvg((a.x + b.x) / 2, (a.y + b.y) / 2);
      gesture.current.moved = true; // ikki barmoq — bu bosish emas
      gesture.current.pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, view: viewRef.current, mid };
    }
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    if (pointers.current.size >= 2 && g.pinch) {
      const [a, b] = [...pointers.current.values()];
      const { dist, view: v0, mid } = g.pinch;
      const k = clampK(v0.k * (Math.hypot(a.x - b.x, a.y - b.y) / dist));
      const now = toSvg((a.x + b.x) / 2, (a.y + b.y) / 2);
      const cx = (mid.x - v0.x) / v0.k, cy = (mid.y - v0.y) / v0.k;
      setView(clampView({ k, x: now.x - cx * k, y: now.y - cy * k }));
      return;
    }
    if (!g.moved && Math.hypot(e.clientX - g.sx, e.clientY - g.sy) > CLICK_SLOP) {
      g.moved = true;
      setDragging(true);
    }
    if (g.moved) {
      const p0 = toSvg(g.lx, g.ly), p1 = toSvg(e.clientX, e.clientY);
      setView((v) => clampView({ ...v, x: v.x + (p1.x - p0.x), y: v.y + (p1.y - p0.y) }));
    }
    g.lx = e.clientX;
    g.ly = e.clientY;
  }

  /**
   * Barmoq/sichqoncha qo'yib yuborilganda (up va cancel uchun umumiy). Qolgan barmoqlarga qarab
   * ishora qayta boshlanadi: 2+ — yangi pinch, 1 — surish shu joydan. Hammasi qo'yilsa — tugagan
   * ishorani qaytaradi (bosishni aniqlash uchun).
   */
  function release(pointerId: number) {
    pointers.current.delete(pointerId);
    const g = gesture.current;
    const rest = [...pointers.current.values()];
    if (g && rest.length >= 2) {
      const [a, b] = rest;
      g.pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, view: viewRef.current, mid: toSvg((a.x + b.x) / 2, (a.y + b.y) / 2) };
      return null;
    }
    if (g && rest.length === 1) {
      g.pinch = undefined;
      g.lx = rest[0].x;
      g.ly = rest[0].y;
      return null;
    }
    gesture.current = null;
    setDragging(false);
    return g;
  }

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    const g = release(e.pointerId);
    if (!g || g.moved || !g.roomId) return;
    const room = rooms.find((r) => r.id === g.roomId);
    if (!room) return;
    const point = { clientX: e.clientX, clientY: e.clientY };
    // Stolga bosish xonaga bosishdan ustun
    if (g.tableId && onSelectTable) {
      const tb = room.tables.find((x) => x.id === g.tableId);
      if (tb) {
        onSelectTable(tb, room, point);
        return;
      }
    }
    onSelect?.(room, point);
  }

  function onPointerCancel(e: React.PointerEvent<SVGSVGElement>) {
    release(e.pointerId);
  }

  // SVG nuqtasi (xarita koordinatasi) → ekrandagi nuqta (klaviatura bilan tanlash uchun)
  const screenPoint = useCallback((x: number, y: number): FloorSelectPoint | null => {
    const m = svgRef.current?.getScreenCTM();
    if (!m) return null;
    const v = viewRef.current;
    const p = new DOMPoint(v.x + x * v.k, v.y + y * v.k).matrixTransform(m);
    return { clientX: p.x, clientY: p.y };
  }, []);

  // Klaviatura: xonada Enter/Space — xona markazi nuqtasi bilan tanlash
  const onRoomKey = useCallback((room: FloorRoom) => {
    const cb = cbRef.current.onSelect;
    const p = screenPoint(room.rect.x + room.rect.w / 2, room.rect.y + room.rect.h / 2);
    if (cb && p) cb(room, p);
  }, [screenPoint]);

  // Klaviatura: stolda Enter/Space — stol markazi bilan
  const onTableKey = useCallback((tb: FloorTable, room: FloorRoom) => {
    const cb = cbRef.current.onSelectTable;
    const p = screenPoint(tb.cx, tb.cy);
    if (cb && p) cb(tb, room, p);
  }, [screenPoint]);

  const hintText = hint === undefined ? t("hint") : hint;

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-line bg-brand-ink", className)}>
      <svg
        ref={svgRef}
        viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label={t("mapLabel")}
        className={cn(
          "block h-full w-full select-none",
          pageScroll && view.k <= 1 ? "touch-pan-y" : "touch-none",
          dragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onDoubleClick={(e) => {
          const p = toSvg(e.clientX, e.clientY);
          zoomAt(p.x, p.y, 1.6);
        }}
      >
        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          <MapLayer
            rooms={rooms}
            selectedId={selectedId ?? null}
            badge={badge}
            tableState={tableState}
            dimRoom={dimRoom}
            tableLabel={tableLabel}
            roomsInteractive={!!onSelect}
            tablesInteractive={!!onSelectTable}
            onRoomKey={onRoomKey}
            onTableKey={onTableKey}
          />
        </g>
      </svg>

      {/* Boshqaruv tugmalari */}
      <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-xl border border-brand-cream/20 bg-brand-ink/90 text-brand-cream shadow-lg">
        <MapButton label={t("zoomIn")} onClick={() => zoomCenter(1.4)}><Plus size={18} /></MapButton>
        <MapButton label={t("zoomOut")} onClick={() => zoomCenter(1 / 1.4)}><Minus size={18} /></MapButton>
        <MapButton label={t("reset")} onClick={() => setView({ x: 0, y: 0, k: 1 })}><Maximize2 size={16} /></MapButton>
      </div>
      {hintText && (
        <p className="pointer-events-none absolute bottom-2 left-3 hidden text-[11px] text-brand-cream/60 sm:block">{hintText}</p>
      )}
    </div>
  );
}

function MapButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center border-b border-brand-cream/10 transition last:border-b-0 hover:bg-brand-cream/10"
    >
      {children}
    </button>
  );
}

/**
 * Xarita mazmuni (bino, xonalar, stollar). memo — surish paytida qayta chizilmaydi;
 * faqat xonalar/tanlov/holat funksiyalari o'zgarganda yangilanadi.
 */
const MapLayer = memo(function MapLayer({
  rooms, selectedId, badge, tableState, dimRoom, tableLabel,
  roomsInteractive, tablesInteractive, onRoomKey, onTableKey,
}: {
  rooms: FloorRoom[];
  selectedId: string | null;
  badge?: (room: FloorRoom) => string | null;
  tableState?: TableStateFn;
  dimRoom?: (room: FloorRoom) => boolean;
  tableLabel?: TableLabelFn;
  roomsInteractive: boolean;
  tablesInteractive: boolean;
  onRoomKey: (room: FloorRoom) => void;
  onTableKey: (t: FloorTable, room: FloorRoom) => void;
}) {
  const t = useTranslations("Floor");
  const roomName = useRoomName();
  return (
    <>
      {/* Bino tashqi devori */}
      <rect x={BUILDING.x} y={BUILDING.y} width={BUILDING.w} height={BUILDING.h} rx={6}
        className="fill-brand-ink-soft stroke-brand-cream-dim" strokeWidth={10} />
      {/* Kabinachalar umumiy ramkasi */}
      <rect x={BOOTH_GROUP.x} y={BOOTH_GROUP.y} width={BOOTH_GROUP.w} height={BOOTH_GROUP.h}
        className="fill-none stroke-brand-cream-dim" strokeWidth={6} />
      <text x={BOOTH_GROUP.x + BOOTH_GROUP.w / 2} y={BOOTH_GROUP.y + 24} textAnchor="middle"
        className="fill-brand-cream text-[17px] font-medium tracking-[0.2em] uppercase">
        {t("rooms.boothGroup")}
      </text>

      {rooms.map((room) => (
        <RoomShape
          key={room.id}
          room={room}
          name={roomName(room)}
          selected={room.id === selectedId}
          badge={badge?.(room) ?? null}
          onKey={onRoomKey}
          interactive={roomsInteractive}
          dim={dimRoom?.(room) ?? false}
          tableState={tableState}
          tableLabel={tableLabel}
          tablesInteractive={tablesInteractive}
          onTableKey={onTableKey}
        />
      ))}
    </>
  );
});

function RoomShape({
  room, name, selected, badge, onKey, interactive, dim, tableState, tableLabel, tablesInteractive, onTableKey,
}: {
  room: FloorRoom; name: string; selected: boolean; badge: string | null;
  onKey: (room: FloorRoom) => void; interactive: boolean; dim: boolean;
  tableState?: TableStateFn; tableLabel?: TableLabelFn; tablesInteractive: boolean;
  onTableKey: (t: FloorTable, room: FloorRoom) => void;
}) {
  const { x, y, w, h } = room.rect;
  const label = room.label ?? { x: x + w / 2, y: y + h / 2 };
  const isCorridor = room.kind === "corridor";
  const text = room.short ?? name;
  const big = w > 150 && h > 120;
  // Sayt rejimi (stol holatlari bor): yozuvlar to'q chiziq bilan o'raladi — rangli stol ustida ham o'qiladi
  const site = !!tableState;
  const outline = site ? { strokeWidth: 5, strokeLinejoin: "round" as const } : {};
  const outlineCls = site ? "stroke-brand-ink [paint-order:stroke]" : "";
  // Stol kodini faqat ko'p stolli xonada yozamiz (bitta stolli xonada xona nomi stol ustida turadi)
  const showCodes = site && room.tables.length > 1;
  return (
    <g
      data-room={room.id}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={name}
      aria-pressed={interactive ? selected : undefined}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onKey(room);
        }
      }}
      className={cn("group outline-none", dim && "opacity-55")}
    >
      <title>{name}</title>
      <rect
        x={x} y={y} width={w} height={h} rx={3}
        className={cn(
          "stroke-brand-cream-dim transition-colors",
          isCorridor ? "fill-brand-ink" : "fill-brand-ink-soft",
          selected ? "fill-brand-gold/20" : "group-hover:fill-brand-gold/10 group-focus-visible:fill-brand-gold/10"
        )}
        strokeWidth={6}
      />
      {/* Ichki oltin chiziq (rasmdagidek) yoki tanlangan xona ramkasi */}
      {!isCorridor && w > 60 && h > 60 && (
        <rect
          x={x + 9} y={y + 9} width={w - 18} height={h - 18} rx={2}
          className={cn("fill-none", selected ? "stroke-brand-gold" : "stroke-brand-gold/35")}
          strokeWidth={selected ? 4 : 1.5}
        />
      )}
      {isCorridor && (
        <line x1={x + w / 2} y1={y + 16} x2={x + w / 2} y2={y + h - 16}
          className="stroke-brand-cream/15" strokeWidth={2} strokeDasharray="10 10" />
      )}

      {room.decor?.map((d, i) => <DecorShape key={i} d={d} />)}
      {room.tables.map((tb) => (
        <TableShape
          key={tb.id}
          t={tb}
          state={tableState?.(tb, room) ?? null}
          interactive={tablesInteractive && !!tb.code}
          label={tableLabel?.(tb, room) ?? tb.code ?? ""}
          showCode={showCodes && !!tb.code}
          onKey={() => onTableKey(tb, room)}
        />
      ))}

      {isCorridor ? (
        <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle"
          transform={`rotate(-90 ${label.x} ${label.y})`}
          className="pointer-events-none fill-brand-cream/55 text-[16px] tracking-[0.35em] uppercase">
          {name}
        </text>
      ) : (
        <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" {...outline}
          className={cn(
            "pointer-events-none fill-brand-cream font-medium uppercase", outlineCls,
            room.kind === "booth" ? "text-[22px]" : big ? "text-[20px] tracking-[0.12em]" : "text-[16px] tracking-[0.1em]"
          )}>
          {text}
        </text>
      )}
      {badge && (
        <text x={label.x} y={label.y + (room.kind === "booth" ? 22 : 24)} textAnchor="middle" dominantBaseline="middle" {...outline}
          className={cn("pointer-events-none fill-brand-gold-light text-[12px]", outlineCls)}>
          {badge}
        </text>
      )}
    </g>
  );
}

/** Stullar: dumaloq stol atrofida teng taqsimlangan, to'rtburchak stolda — tomonlar bo'yicha */
function chairSpots(t: FloorTable): { x: number; y: number; a: number }[] {
  if (t.shape === "round") {
    const r = (t.r ?? 30) + 10;
    return Array.from({ length: t.seats }, (_, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / t.seats;
      return { x: t.cx + r * Math.cos(a), y: t.cy + r * Math.sin(a), a: (a * 180) / Math.PI + 90 };
    });
  }
  if (t.shape !== "rect") return [];
  const w = t.w ?? 60, h = t.h ?? 40;
  const sides: ChairSides = t.chairs ?? { top: 0, bottom: 0, left: Math.ceil(t.seats / 2), right: Math.floor(t.seats / 2) };
  const spread = (n: number, len: number) => Array.from({ length: n }, (_, i) => -len / 2 + (len * (i + 0.5)) / n);
  const out: { x: number; y: number; a: number }[] = [];
  spread(sides.top, w).forEach((d) => out.push({ x: t.cx + d, y: t.cy - h / 2 - 10, a: 0 }));
  spread(sides.bottom, w).forEach((d) => out.push({ x: t.cx + d, y: t.cy + h / 2 + 10, a: 180 }));
  spread(sides.left, h).forEach((d) => out.push({ x: t.cx - w / 2 - 10, y: t.cy + d, a: 270 }));
  spread(sides.right, h).forEach((d) => out.push({ x: t.cx + w / 2 + 10, y: t.cy + d, a: 90 }));
  return out;
}

// ---- Stol holatlari ranglari (faqat tokenlar) ----
type VisualKey = TableVisualState | "none";
/** Stol yuzasi */
const BODY: Record<VisualKey, string> = {
  none: "fill-brand-ink stroke-brand-gold",
  free: "fill-brand-ink stroke-brand-gold transition-colors group-hover/table:fill-brand-gold/30 group-focus-visible/table:fill-brand-gold/30",
  selected: "fill-brand-gold stroke-brand-gold-light [filter:drop-shadow(0_0_10px_var(--color-brand-gold))]",
  busy: "fill-brand-red/35 stroke-brand-red",
  small: "fill-brand-ink stroke-brand-gold/70",
  off: "fill-brand-ink stroke-brand-cream/50",
};
/** Stullar / kabina o'rindiqlari */
const SEAT: Record<VisualKey, string> = {
  none: "fill-brand-cream/25",
  free: "fill-brand-gold/45",
  selected: "fill-brand-gold-light",
  busy: "fill-brand-red/45",
  small: "fill-brand-cream/25",
  off: "fill-brand-cream/25",
};
/** Butun stol guruhining shaffofligi */
const FADE: Partial<Record<VisualKey, string>> = { small: "opacity-45", off: "opacity-25" };
/** Yumshoq oltin nur (faqat bo'sh va tanlangan stol atrofida; filter emas — surishda arzon) */
const HALO: Partial<Record<VisualKey, string>> = {
  free: "fill-brand-gold/10 stroke-brand-gold/40 transition-colors group-hover/table:fill-brand-gold/20",
  selected: "fill-brand-gold/25 stroke-brand-gold",
};

/** Stol atrofidagi (stullar bilan) to'liq maydon — bosish zonasi va nur uchun */
function tableBounds(t: FloorTable): { x: number; y: number; w: number; h: number; rx: number; round: boolean } {
  if (t.shape === "round") {
    const r = (t.r ?? 30) + 20;
    return { x: t.cx - r, y: t.cy - r, w: r * 2, h: r * 2, rx: r, round: true };
  }
  const w = t.w ?? 60, h = t.h ?? 40;
  if (t.shape === "booth") return { x: t.cx - w / 2 - 4, y: t.cy - h / 2 - 38, w: w + 8, h: h + 76, rx: 10, round: false };
  return { x: t.cx - w / 2 - 22, y: t.cy - h / 2 - 22, w: w + 44, h: h + 44, rx: 14, round: false };
}

function TableShape({
  t, state, interactive, label, showCode, onKey,
}: {
  t: FloorTable; state: TableVisualState | null; interactive: boolean; label: string; showCode: boolean; onKey: () => void;
}) {
  const v: VisualKey = state ?? "none";
  const visuals = <TableVisual t={t} v={v} />;
  // Admin (holat ham, bosish ham yo'q) — avvalgi ko'rinish o'zgarmaydi
  if (!interactive && !state) return visuals;

  const b = tableBounds(t);
  const halo = HALO[v];
  // Holat noma'lum (ma'lumot hali yuklanmagan) stol ham bosiladi — ma'lumot kartasi uchun
  const clickable = state === null || state === "free" || state === "selected";
  const inner = (
    <>
      {halo && (b.round
        ? <circle cx={t.cx} cy={t.cy} r={b.w / 2} className={cn("pointer-events-none", halo)} strokeWidth={1.5} />
        : <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={b.rx} className={cn("pointer-events-none", halo)} strokeWidth={1.5} />)}
      {visuals}
      {showCode && t.code && (
        <text x={t.cx} y={t.cy} textAnchor="middle" dominantBaseline="central"
          className={cn(
            "pointer-events-none text-[15px] font-semibold",
            state === "selected" ? "fill-brand-ink" : state === "busy" ? "fill-brand-cream/75" : "fill-brand-cream"
          )}>
          {t.code}
        </text>
      )}
    </>
  );

  if (!interactive) return <g className={cn("pointer-events-none", FADE[v])}>{inner}</g>;

  return (
    <g
      data-table={t.id}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={state === "selected"}
      aria-disabled={state === "busy" || state === "small" || state === "off" ? true : undefined}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation(); // xonaning o'z Enter/Space ishlovchisi ishlamasin
          onKey();
        }
      }}
      className={cn("group/table outline-none", FADE[v], clickable ? "cursor-pointer" : "cursor-not-allowed")}
    >
      <title>{label}</title>
      {/* Ko'rinmas bosish zonasi (stullar bilan birga) */}
      {b.round
        ? <circle cx={t.cx} cy={t.cy} r={b.w / 2} className="fill-transparent" />
        : <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={b.rx} className="fill-transparent" />}
      {inner}
      {/* Klaviatura fokusi halqasi */}
      {b.round
        ? <circle cx={t.cx} cy={t.cy} r={b.w / 2 + 4} className="pointer-events-none fill-none stroke-brand-gold-light opacity-0 group-focus-visible/table:opacity-100" strokeWidth={3} strokeDasharray="6 5" />
        : <rect x={b.x - 4} y={b.y - 4} width={b.w + 8} height={b.h + 8} rx={b.rx + 4} className="pointer-events-none fill-none stroke-brand-gold-light opacity-0 group-focus-visible/table:opacity-100" strokeWidth={3} strokeDasharray="6 5" />}
    </g>
  );
}

/** Stolning o'zi (stullar, yuza). v === "none" — admin'dagi avvalgi ko'rinish */
function TableVisual({ t, v }: { t: FloorTable; v: VisualKey }) {
  if (t.shape === "booth") {
    const w = t.w ?? 50, h = t.h ?? 40;
    return (
      <g className="pointer-events-none">
        <rect x={t.cx - w / 2} y={t.cy - h / 2 - 34} width={w} height={20} rx={6} className={v === "none" ? "fill-brand-cream/20" : SEAT[v]} />
        <rect x={t.cx - w / 2 + 4} y={t.cy - h / 2 + 6} width={w - 8} height={h - 12} rx={3}
          className={v === "none" ? "fill-brand-ink stroke-brand-gold/70" : BODY[v]} strokeWidth={v === "none" ? 1.5 : 2.5} />
        <rect x={t.cx - w / 2} y={t.cy + h / 2 + 14} width={w} height={20} rx={6} className={v === "none" ? "fill-brand-cream/20" : SEAT[v]} />
      </g>
    );
  }
  if (t.shape === "bar") {
    const w = t.w ?? 200, h = t.h ?? 40;
    return (
      <g className="pointer-events-none">
        <rect x={t.cx - w / 2} y={t.cy - h / 2} width={w} height={h} rx={6}
          className="fill-brand-ink stroke-brand-gold/60" strokeWidth={1.5} />
        {Array.from({ length: t.seats }, (_, i) => (
          <circle key={i} cx={t.cx - w / 2 + (w * (i + 0.5)) / t.seats} cy={t.cy + h / 2 + 26} r={12}
            className="fill-brand-cream/20 stroke-brand-cream/30" strokeWidth={1} />
        ))}
      </g>
    );
  }
  const strokeWidth = v === "none" ? 2 : v === "free" || v === "selected" ? 3 : 2;
  return (
    <g className="pointer-events-none">
      {chairSpots(t).map((c, i) => (
        <rect key={i} x={c.x - 9} y={c.y - 7} width={18} height={14} rx={4}
          transform={`rotate(${c.a} ${c.x} ${c.y})`} className={SEAT[v]} />
      ))}
      {t.shape === "round" ? (
        <circle cx={t.cx} cy={t.cy} r={t.r} className={BODY[v]} strokeWidth={strokeWidth} />
      ) : (
        <rect x={t.cx - (t.w ?? 60) / 2} y={t.cy - (t.h ?? 40) / 2} width={t.w} height={t.h} rx={6}
          className={BODY[v]} strokeWidth={strokeWidth} />
      )}
    </g>
  );
}

function DecorShape({ d }: { d: Decor }) {
  if (d.type === "rect") {
    return <rect x={d.x} y={d.y} width={d.w} height={d.h} rx={d.rx ?? 0}
      className="pointer-events-none fill-brand-cream/10 stroke-brand-cream/25" strokeWidth={1} />;
  }
  if (d.type === "arrow") {
    return <path d={`M ${d.x} ${d.y - 12} L ${d.x + 10} ${d.y} L ${d.x + 4} ${d.y} L ${d.x + 4} ${d.y + 12} L ${d.x - 4} ${d.y + 12} L ${d.x - 4} ${d.y} L ${d.x - 10} ${d.y} Z`}
      className="pointer-events-none fill-brand-cream" />;
  }
  // Hojatxona belgisi (oddiy odam siluyeti)
  return (
    <g className="pointer-events-none fill-brand-cream/80">
      <circle cx={d.x} cy={d.y - 18} r={5} />
      <rect x={d.x - 6} y={d.y - 11} width={12} height={16} rx={3} />
      <rect x={d.x - 5} y={d.y + 4} width={4} height={13} rx={1.5} />
      <rect x={d.x + 1} y={d.y + 4} width={4} height={13} rx={1.5} />
    </g>
  );
}
