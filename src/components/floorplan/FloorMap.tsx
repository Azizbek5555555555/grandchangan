"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Maximize2, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BOOTH_GROUP, BUILDING, ROOMS, VIEWBOX,
  type ChairSides, type Decor, type FloorRoom, type FloorTable,
} from "@/lib/floorplan/layout";

/**
 * Restoranning interaktiv 2D xaritasi (umumiy komponent: admin inventari va keyin mijozlar sayti).
 * - Surish: sichqoncha/barmoq bilan tortish
 * - Kattalashtirish: g'ildirak (kursor atrofida), ikki barmoq (pinch), +/− tugmalar, ikki marta bosish
 * - Xonaga bosish: onSelect(xona, ekrandagi nuqta) — chaqiruvchi o'zi oyna/panel ko'rsatadi
 * Xarita doim qorong'i uslubda (rasmdagidek), sayt mavzusidan qat'i nazar.
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

export default function FloorMap({
  rooms = ROOMS,
  selectedId,
  onSelect,
  badge,
  className,
}: {
  rooms?: FloorRoom[];
  selectedId?: string | null;
  onSelect?: (room: FloorRoom, point: FloorSelectPoint) => void;
  /** Xona ostidagi kichik yozuv (masalan, "8 o'rin"); null — ko'rsatilmaydi */
  badge?: (room: FloorRoom) => string | null;
  className?: string;
}) {
  const t = useTranslations("Floor");
  const roomName = useRoomName();
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const [dragging, setDragging] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    sx: number; sy: number; lx: number; ly: number; moved: boolean; roomId: string | null;
    pinch?: { dist: number; view: View; mid: { x: number; y: number } };
  } | null>(null);

  // Ekran (client) koordinatasi → SVG koordinatasi (view transformidan oldin)
  const toSvg = useCallback((cx: number, cy: number) => {
    const m = svgRef.current?.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(cx, cy).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }, []);

  // Xarita ko'rinish maydonidan butunlay chiqib ketmasin: markazi doim ekranda qoladi
  const clampView = useCallback((v: View): View => {
    const cx = VIEWBOX.x + VIEWBOX.w / 2;
    const cy = VIEWBOX.y + VIEWBOX.h / 2;
    const minX = VIEWBOX.x - cx * v.k, maxX = VIEWBOX.x + VIEWBOX.w - cx * v.k;
    const minY = VIEWBOX.y - cy * v.k, maxY = VIEWBOX.y + VIEWBOX.h - cy * v.k;
    return { k: v.k, x: Math.min(maxX, Math.max(minX, v.x)), y: Math.min(maxY, Math.max(minY, v.y)) };
  }, []);

  // p (SVG koordinata) nuqtasi joyida qolgan holda kattalashtirish
  const zoomAt = useCallback((px: number, py: number, factor: number) => {
    setView((v) => {
      const k = clampK(v.k * factor);
      const cx = (px - v.x) / v.k, cy = (py - v.y) / v.k;
      return clampView({ k, x: px - cx * k, y: py - cy * k });
    });
  }, [clampView]);

  const zoomCenter = (factor: number) => zoomAt(VIEWBOX.x + VIEWBOX.w / 2, VIEWBOX.y + VIEWBOX.h / 2, factor);

  // G'ildirak — passive:false kerak (sahifa scroll bo'lmasligi uchun preventDefault)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = toSvg(e.clientX, e.clientY);
      zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0015));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [toSvg, zoomAt]);

  const roomAt = (target: EventTarget | null): string | null =>
    (target instanceof Element ? target.closest("[data-room]")?.getAttribute("data-room") : null) ?? null;

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      gesture.current = { sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, moved: false, roomId: roomAt(e.target) };
    } else if (pointers.current.size === 2 && gesture.current) {
      const [a, b] = [...pointers.current.values()];
      const mid = toSvg((a.x + b.x) / 2, (a.y + b.y) / 2);
      gesture.current.moved = true; // ikki barmoq — bu bosish emas
      gesture.current.pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, view, mid };
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

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    const g = gesture.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) {
      // pinch tugadi, bitta barmoq qoldi — surishni shu joydan davom ettirish
      if (g) {
        const [rest] = [...pointers.current.values()];
        g.pinch = undefined;
        g.lx = rest.x;
        g.ly = rest.y;
      }
      return;
    }
    gesture.current = null;
    setDragging(false);
    if (g && !g.moved && g.roomId && onSelect) {
      const room = rooms.find((r) => r.id === g.roomId);
      if (room) onSelect(room, { clientX: e.clientX, clientY: e.clientY });
    }
  }

  function onPointerCancel(e: React.PointerEvent<SVGSVGElement>) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) {
      gesture.current = null;
      setDragging(false);
    }
  }

  // Klaviatura: xonada Enter/Space — xona markazi nuqtasi bilan tanlash
  function selectByKey(room: FloorRoom) {
    const m = svgRef.current?.getScreenCTM();
    if (!m || !onSelect) return;
    const c = { x: room.rect.x + room.rect.w / 2, y: room.rect.y + room.rect.h / 2 };
    const p = new DOMPoint(view.x + c.x * view.k, view.y + c.y * view.k).matrixTransform(m);
    onSelect(room, { clientX: p.x, clientY: p.y });
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-line bg-brand-ink", className)}>
      <svg
        ref={svgRef}
        viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label={t("mapLabel")}
        className={cn("block h-full w-full touch-none select-none", dragging ? "cursor-grabbing" : "cursor-grab")}
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
              onKey={() => selectByKey(room)}
              interactive={!!onSelect}
            />
          ))}
        </g>
      </svg>

      {/* Boshqaruv tugmalari */}
      <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-xl border border-brand-cream/20 bg-brand-ink/90 text-brand-cream shadow-lg">
        <MapButton label={t("zoomIn")} onClick={() => zoomCenter(1.4)}><Plus size={18} /></MapButton>
        <MapButton label={t("zoomOut")} onClick={() => zoomCenter(1 / 1.4)}><Minus size={18} /></MapButton>
        <MapButton label={t("reset")} onClick={() => setView({ x: 0, y: 0, k: 1 })}><Maximize2 size={16} /></MapButton>
      </div>
      <p className="pointer-events-none absolute bottom-2 left-3 hidden text-[11px] text-brand-cream/60 sm:block">{t("hint")}</p>
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

function RoomShape({
  room, name, selected, badge, onKey, interactive,
}: {
  room: FloorRoom; name: string; selected: boolean; badge: string | null; onKey: () => void; interactive: boolean;
}) {
  const { x, y, w, h } = room.rect;
  const label = room.label ?? { x: x + w / 2, y: y + h / 2 };
  const isCorridor = room.kind === "corridor";
  const text = room.short ?? name;
  const big = w > 150 && h > 120;
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
          onKey();
        }
      }}
      className="group outline-none"
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
      {room.tables.map((tb) => <TableShape key={tb.id} t={tb} />)}

      {isCorridor ? (
        <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle"
          transform={`rotate(-90 ${label.x} ${label.y})`}
          className="pointer-events-none fill-brand-cream/55 text-[16px] tracking-[0.35em] uppercase">
          {name}
        </text>
      ) : (
        <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle"
          className={cn(
            "pointer-events-none fill-brand-cream font-medium uppercase",
            room.kind === "booth" ? "text-[22px]" : big ? "text-[20px] tracking-[0.12em]" : "text-[16px] tracking-[0.1em]"
          )}>
          {text}
        </text>
      )}
      {badge && (
        <text x={label.x} y={label.y + (room.kind === "booth" ? 22 : 24)} textAnchor="middle" dominantBaseline="middle"
          className="pointer-events-none fill-brand-gold-light text-[12px]">
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

function TableShape({ t }: { t: FloorTable }) {
  if (t.shape === "booth") {
    const w = t.w ?? 50, h = t.h ?? 40;
    return (
      <g className="pointer-events-none">
        <rect x={t.cx - w / 2} y={t.cy - h / 2 - 34} width={w} height={20} rx={6} className="fill-brand-cream/20" />
        <rect x={t.cx - w / 2 + 4} y={t.cy - h / 2 + 6} width={w - 8} height={h - 12} rx={3}
          className="fill-brand-ink stroke-brand-gold/70" strokeWidth={1.5} />
        <rect x={t.cx - w / 2} y={t.cy + h / 2 + 14} width={w} height={20} rx={6} className="fill-brand-cream/20" />
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
  return (
    <g className="pointer-events-none">
      {chairSpots(t).map((c, i) => (
        <rect key={i} x={c.x - 9} y={c.y - 7} width={18} height={14} rx={4}
          transform={`rotate(${c.a} ${c.x} ${c.y})`} className="fill-brand-cream/25" />
      ))}
      {t.shape === "round" ? (
        <circle cx={t.cx} cy={t.cy} r={t.r} className="fill-brand-ink stroke-brand-gold" strokeWidth={2} />
      ) : (
        <rect x={t.cx - (t.w ?? 60) / 2} y={t.cy - (t.h ?? 40) / 2} width={t.w} height={t.h} rx={6}
          className="fill-brand-ink stroke-brand-gold" strokeWidth={2} />
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
