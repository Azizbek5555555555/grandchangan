"use client";

import { useState } from "react";
import { Badge, Modal } from "@/components/ui/primitives";
import { UtensilsCrossed } from "lucide-react";
import { t, formatMoney } from "@/lib/utils";
import { updateReservationStatus } from "@/lib/reservation/actions";

type PreOrderItem = { name: unknown; quantity: number; unitPrice: number };
type PreOrder = { code: string; status: string; total: number; items: PreOrderItem[] };
type Res = {
  id: string; code: string; guestName: string; guestPhone: string; partySize: number;
  date: string; startTime: string; status: string; tableNumber?: string | null;
  occasion?: string | null; preOrder?: PreOrder | null;
};

const STATUSES = ["PENDING", "CONFIRMED", "SEATED", "COMPLETED", "CANCELLED", "NO_SHOW"];
const COLOR: Record<string, string> = {
  PENDING: "gold", CONFIRMED: "blue", SEATED: "green", COMPLETED: "gray", CANCELLED: "red", NO_SHOW: "red",
};

export default function ReservationsTable({ reservations }: { reservations: Res[] }) {
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState<Res | null>(null);
  const shown = filter === "all" ? reservations : reservations.filter((r) => r.status === filter);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Bronlar</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-xs ${filter === s ? "bg-brand-red text-white" : "bg-surface-2"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface-2 text-left text-muted">
            <tr>
              <th className="px-4 py-3">Kod</th>
              <th className="px-4 py-3">Mehmon</th>
              <th className="px-4 py-3">Kishi</th>
              <th className="px-4 py-3">Sana / vaqt</th>
              <th className="px-4 py-3">Stol</th>
              <th className="px-4 py-3">Buyurtma</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-4 py-3">Amal</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-b border-line">
                <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{r.guestName}</div>
                  <div className="text-xs text-muted">{r.guestPhone}</div>
                </td>
                <td className="px-4 py-3">{r.partySize}</td>
                <td className="px-4 py-3 text-xs">
                  {new Date(r.startTime).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3">{r.tableNumber || "—"}</td>
                <td className="px-4 py-3">
                  {r.preOrder ? (
                    <button
                      onClick={() => setDetail(r)}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-red/10 px-2.5 py-1 text-xs font-medium text-brand-red hover:bg-brand-red/20"
                    >
                      <UtensilsCrossed size={12} />
                      {r.preOrder.items.length} taom · {formatMoney(r.preOrder.total)}
                    </button>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3"><Badge color={COLOR[r.status]}>{r.status}</Badge></td>
                <td className="px-4 py-3">
                  <select
                    value={r.status}
                    onChange={(e) => updateReservationStatus(r.id, e.target.value as never)}
                    className="rounded border border-line px-2 py-1 text-xs"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted">Bron yo&apos;q</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {detail?.preOrder && (
        <Modal open onClose={() => setDetail(null)} title={`Oldindan buyurtma — ${detail.code}`}>
          <div className="mb-3 rounded-lg bg-surface-2 p-3 text-sm">
            <p><b>Mehmon:</b> {detail.guestName} · {detail.guestPhone}</p>
            <p><b>Vaqt:</b> {new Date(detail.startTime).toLocaleString("uz-UZ")} · <b>Stol:</b> {detail.tableNumber || "—"}</p>
            <p><b>Buyurtma kodi:</b> <span className="font-mono">{detail.preOrder.code}</span></p>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {detail.preOrder.items.map((it, i) => (
                <tr key={i} className="border-b border-line">
                  <td className="py-2">{t(it.name, "uz")}</td>
                  <td className="py-2 text-center text-muted">×{it.quantity}</td>
                  <td className="py-2 text-right">{formatMoney(it.unitPrice * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="pt-3 font-semibold" colSpan={2}>Jami</td>
                <td className="pt-3 text-right font-bold text-brand-red">{formatMoney(detail.preOrder.total)}</td>
              </tr>
            </tfoot>
          </table>
          <p className="mt-3 text-xs text-muted">To&apos;lov restoranda amalga oshiriladi (dine-in).</p>
        </Modal>
      )}
    </div>
  );
}
