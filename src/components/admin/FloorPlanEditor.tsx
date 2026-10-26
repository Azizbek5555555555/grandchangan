"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Plus, Save, Trash2, Users, Move, Crown } from "lucide-react";
import { t, cn } from "@/lib/utils";
import { saveZone, saveTable, deleteTable, saveLayout } from "@/lib/reservation/actions";
import PageHeader from "@/components/admin/ui/PageHeader";
import Dialog from "@/components/admin/ui/Dialog";
import { Field, Notice } from "@/components/admin/ui/Field";
import EmptyState from "@/components/admin/ui/EmptyState";
import { ui } from "@/components/admin/ui/styles";

type Table = {
  id: string; number: string; seats: number; isVip: boolean;
  posX: number; posY: number; width: number; height: number; shape: string;
};
type Zone = { id: string; name: unknown; mapWidth: number; mapHeight: number; tables: Table[] };

const SHAPES = ["ROUND", "SQUARE", "RECT", "BOOTH"] as const;

export default function FloorPlanEditor({ zones, locale, syncCard }: { zones: Zone[]; locale: string; syncCard?: React.ReactNode }) {
  const ta = useTranslations("Admin");
  const tt = useTranslations("AdminUi.tables");
  const [activeZone, setActiveZone] = useState<string>(zones[0]?.id ?? "");
  const [positions, setPositions] = useState<Record<string, Table>>(() => {
    const m: Record<string, Table> = {};
    zones.forEach((z) => z.tables.forEach((tb) => (m[tb.id] = { ...tb })));
    return m;
  });
  const [tableModal, setTableModal] = useState<Table | null>(null);
  const [tableNew, setTableNew] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const zone = zones.find((z) => z.id === activeZone);
  const zoneTables = zone ? zone.tables.map((tb) => positions[tb.id] || tb) : [];

  function onPointerDown(e: React.PointerEvent, tb: Table) {
    const rect = canvasRef.current!.getBoundingClientRect();
    dragRef.current = { id: tb.id, dx: e.clientX - rect.left - tb.posX, dy: e.clientY - rect.top - tb.posY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const id = dragRef.current.id;
    const x = Math.max(0, e.clientX - rect.left - dragRef.current.dx);
    const y = Math.max(0, e.clientY - rect.top - dragRef.current.dy);
    setPositions((p) => ({ ...p, [id]: { ...p[id], posX: Math.round(x), posY: Math.round(y) } }));
    setDirty(true);
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  async function persist() {
    const list = zoneTables.map((tb) => ({
      id: tb.id, posX: tb.posX, posY: tb.posY, width: tb.width, height: tb.height,
    }));
    setSaving(true);
    try {
      await saveLayout(list);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={ui.page}>
      <PageHeader
        section="tables"
        title={ta("tables")}
        description={tt("subtitle")}
        actions={
          <>
            <button
              type="button"
              className={ui.btnSecondary}
              onClick={async () => {
                const name = prompt(tt("zonePrompt"));
                if (name) { const r = await saveZone({ name: { uz: name } }); if (r.ok) location.reload(); }
              }}
            >
              <Plus size={16} aria-hidden /> {tt("addZone")}
            </button>
            <button
              type="button"
              className={ui.btnSecondary}
              onClick={() => { setTableNew(true); setTableModal(emptyTable()); }}
              disabled={!activeZone}
            >
              <Plus size={16} aria-hidden /> {tt("addTable")}
            </button>
            <button type="button" className={ui.btnPrimary} onClick={persist} disabled={!dirty || saving}>
              <Save size={16} aria-hidden /> {tt("saveLayout")}
            </button>
          </>
        }
      />

      {syncCard && <div className="mb-6">{syncCard}</div>}

      {zones.length === 0 ? (
        <div className={ui.card}><EmptyState icon={Move} title={tt("noZones")} /></div>
      ) : (
        <>
          <div role="tablist" aria-label={tt("zones")} className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
              {zones.map((z) => {
                const active = activeZone === z.id;
                return (
                  <button
                    key={z.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveZone(z.id)}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm transition sm:min-h-9",
                      active ? "border-fire bg-fire text-brand-cream" : "border-line bg-card text-muted hover:border-brand-gold/50 hover:text-content"
                    )}
                  >
                    {t(z.name, locale) || "—"}
                    <span className={cn("rounded-full px-1.5 text-[11px] font-semibold tabular-nums", active ? "bg-brand-cream/20" : "bg-surface-2")}>{z.tables.length}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {zone && (
            // Xarita faqat o'z ichida suriladi (telefonda sahifa kengaymaydi)
            <div className="overflow-auto rounded-2xl border border-line bg-card shadow-sm shadow-night/5">
              <div
                ref={canvasRef}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className="relative bg-surface bg-[linear-gradient(90deg,var(--line)_1px,transparent_1px),linear-gradient(var(--line)_1px,transparent_1px)] bg-[size:40px_40px]"
                style={{ width: zone.mapWidth, height: zone.mapHeight, minWidth: "100%" }}
              >
                {zoneTables.map((tb) => (
                  <div
                    key={tb.id}
                    role="button"
                    tabIndex={0}
                    aria-label={tt("tableAria", { n: tb.number, seats: tb.seats })}
                    onPointerDown={(e) => onPointerDown(e, tb)}
                    onDoubleClick={() => { setTableNew(false); setTableModal(tb); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { setTableNew(false); setTableModal(tb); } }}
                    className={cn(
                      "absolute flex cursor-move touch-none select-none flex-col items-center justify-center gap-0.5 border text-xs font-semibold shadow-md shadow-night/20 transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold",
                      tb.isVip ? "border-brand-gold-light bg-brand-gold text-brand-ink" : "border-fire-deep bg-fire text-brand-cream",
                      tb.shape === "SQUARE" || tb.shape === "RECT" || tb.shape === "BOOTH" ? "rounded-xl" : "rounded-full"
                    )}
                    style={{ left: tb.posX, top: tb.posY, width: tb.width, height: tb.height }}
                  >
                    {tb.isVip && <Crown size={11} aria-hidden className="opacity-80" />}
                    <span className="text-sm leading-none">{tb.number}</span>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium opacity-80">
                      <Users size={10} aria-hidden /> {tb.seats}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Move size={15} aria-hidden className="shrink-0" />
            {tt("hint")}
            {dirty && <span className="ml-auto shrink-0 rounded-full bg-brand-gold/15 px-2.5 py-0.5 text-xs font-medium text-content">{tt("unsaved")}</span>}
          </p>
        </>
      )}

      {tableModal && (
        <TableModal
          isNew={tableNew}
          data={tableModal}
          zoneId={activeZone}
          onClose={() => setTableModal(null)}
        />
      )}
    </div>
  );
}

function emptyTable(): Table {
  return { id: "", number: "", seats: 4, isVip: false, posX: 40, posY: 40, width: 90, height: 90, shape: "ROUND" };
}

function TableModal({ isNew, data, zoneId, onClose }: { isNew: boolean; data: Table; zoneId: string; onClose: () => void }) {
  const tt = useTranslations("AdminUi.tables");
  const tc = useTranslations("AdminUi.common");
  const [number, setNumber] = useState(data.number);
  const [seats, setSeats] = useState(String(data.seats));
  const [isVip, setIsVip] = useState(data.isVip);
  const [shape, setShape] = useState(data.shape);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const r = await saveTable({
        id: data.id || undefined, zoneId, number, seats: Number(seats) || 1,
        shape: shape as never, isVip, posX: data.posX, posY: data.posY, width: data.width, height: data.height,
      });
      if (r && "ok" in r && !r.ok) { setError(("error" in r && r.error) || tc("error")); return; }
      location.reload();
    } catch {
      setError(tc("error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      onClose={onClose}
      title={isNew ? tt("newTable") : tt("tableTitle", { n: data.number })}
      footer={
        <>
          {!isNew && (
            <button
              type="button"
              className={cn(ui.btnDanger, "mr-auto")}
              onClick={async () => { if (confirm(tc("deleteConfirm"))) { await deleteTable(data.id); location.reload(); } }}
            >
              <Trash2 size={15} aria-hidden /> {tc("delete")}
            </button>
          )}
          <button type="button" onClick={onClose} className={ui.btnSecondary}>{tc("cancel")}</button>
          <button type="button" className={ui.btnPrimary} disabled={saving || !number.trim()} onClick={save}>
            {saving ? tc("saving") : tc("save")}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={tt("number")}>
            <input value={number} onChange={(e) => setNumber(e.target.value)} className={ui.input} />
          </Field>
          <Field label={tt("seats")}>
            <input type="number" min={1} value={seats} onChange={(e) => setSeats(e.target.value)} className={ui.input} />
          </Field>
        </div>
        <Field label={tt("shape")}>
          <select value={shape} onChange={(e) => setShape(e.target.value)} className={ui.input}>
            {SHAPES.map((s) => <option key={s} value={s}>{tt(`shapes.${s}`)}</option>)}
          </select>
        </Field>
        <label className="flex min-h-11 items-center gap-3 rounded-xl border border-line px-3 text-sm">
          <input type="checkbox" checked={isVip} onChange={(e) => setIsVip(e.target.checked)} className={ui.checkbox} />
          <Crown size={15} aria-hidden className="text-brand-gold" /> {tt("vip")}
        </label>
        {error && <Notice ok={false}>{error}</Notice>}
      </div>
    </Dialog>
  );
}
