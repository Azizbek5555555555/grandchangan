"use client";

import { useState, useRef } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button, Modal } from "@/components/ui/primitives";
import { t } from "@/lib/utils";
import { saveZone, saveTable, deleteTable, saveLayout } from "@/lib/reservation/actions";

type Table = {
  id: string; number: string; seats: number; isVip: boolean;
  posX: number; posY: number; width: number; height: number; shape: string;
};
type Zone = { id: string; name: unknown; mapWidth: number; mapHeight: number; tables: Table[] };

export default function FloorPlanEditor({ zones, locale }: { zones: Zone[]; locale: string }) {
  const [activeZone, setActiveZone] = useState<string>(zones[0]?.id ?? "");
  const [positions, setPositions] = useState<Record<string, Table>>(() => {
    const m: Record<string, Table> = {};
    zones.forEach((z) => z.tables.forEach((tb) => (m[tb.id] = { ...tb })));
    return m;
  });
  const [tableModal, setTableModal] = useState<Table | null>(null);
  const [tableNew, setTableNew] = useState(false);
  const [dirty, setDirty] = useState(false);
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
    await saveLayout(list);
    setDirty(false);
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Zallar va stollar</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={async () => {
            const name = prompt("Yangi zal nomi (UZ):");
            if (name) { const r = await saveZone({ name: { uz: name } }); if (r.ok) location.reload(); }
          }}>
            <Plus size={16} /> Zal
          </Button>
          <Button
            variant="outline"
            onClick={() => { setTableNew(true); setTableModal(emptyTable()); }}
            disabled={!activeZone}
          >
            <Plus size={16} /> Stol
          </Button>
          <Button onClick={persist} disabled={!dirty}>
            <Save size={16} /> Joylashuvni saqlash
          </Button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {zones.map((z) => (
          <button
            key={z.id}
            onClick={() => setActiveZone(z.id)}
            className={`rounded-full px-4 py-1.5 text-sm ${activeZone === z.id ? "bg-brand-red text-white" : "bg-neutral-100"}`}
          >
            {t(z.name, locale)}
          </button>
        ))}
      </div>

      {zone && (
        <div
          ref={canvasRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="relative rounded-xl border border-neutral-300 bg-[linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:40px_40px]"
          style={{ width: "100%", maxWidth: zone.mapWidth, height: zone.mapHeight }}
        >
          {zoneTables.map((tb) => (
            <div
              key={tb.id}
              onPointerDown={(e) => onPointerDown(e, tb)}
              onDoubleClick={() => { setTableNew(false); setTableModal(tb); }}
              className={`absolute flex cursor-move select-none flex-col items-center justify-center text-xs font-medium text-white shadow ${
                tb.isVip ? "bg-brand-gold text-brand-ink" : "bg-brand-red"
              } ${tb.shape === "SQUARE" || tb.shape === "RECT" ? "rounded-lg" : "rounded-full"}`}
              style={{ left: tb.posX, top: tb.posY, width: tb.width, height: tb.height }}
            >
              <span>{tb.number}</span>
              <span className="opacity-80">{tb.seats}👤</span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-sm text-neutral-400">
        Stolni suring — joyini o'zgartiring. Ikki marta bosing — tahrirlash.
      </p>

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
  const [number, setNumber] = useState(data.number);
  const [seats, setSeats] = useState(String(data.seats));
  const [isVip, setIsVip] = useState(data.isVip);
  const [shape, setShape] = useState(data.shape);
  return (
    <Modal open onClose={onClose} title={isNew ? "Yangi stol" : `Stol ${data.number}`}>
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Raqam / nomi</span>
          <input value={number} onChange={(e) => setNumber(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">O'rin soni</span>
          <input type="number" value={seats} onChange={(e) => setSeats(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Shakl</span>
          <select value={shape} onChange={(e) => setShape(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm">
            <option value="ROUND">Dumaloq</option>
            <option value="SQUARE">Kvadrat</option>
            <option value="RECT">To'rtburchak</option>
            <option value="BOOTH">Kabinka</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isVip} onChange={(e) => setIsVip(e.target.checked)} /> VIP stol
        </label>
        <div className="flex justify-between">
          {!isNew && (
            <Button variant="danger" onClick={async () => { if (confirm("O'chirilsinmi?")) { await deleteTable(data.id); location.reload(); } }}>
              <Trash2 size={14} /> O'chirish
            </Button>
          )}
          <Button className="ml-auto" onClick={async () => {
            await saveTable({
              id: data.id || undefined, zoneId, number, seats: Number(seats) || 1,
              shape: shape as never, isVip, posX: data.posX, posY: data.posY, width: data.width, height: data.height,
            });
            location.reload();
          }}>
            Saqlash
          </Button>
        </div>
      </div>
    </Modal>
  );
}
