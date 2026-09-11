"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/primitives";
import { updateReservationStatus } from "@/lib/reservation/actions";

type Res = {
  id: string; code: string; guestName: string; guestPhone: string; partySize: number;
  date: string; startTime: string; status: string; tableNumber?: string | null; occasion?: string | null;
};

const STATUSES = ["PENDING", "CONFIRMED", "SEATED", "COMPLETED", "CANCELLED", "NO_SHOW"];
const COLOR: Record<string, string> = {
  PENDING: "gold", CONFIRMED: "blue", SEATED: "green", COMPLETED: "gray", CANCELLED: "red", NO_SHOW: "red",
};

export default function ReservationsTable({ reservations }: { reservations: Res[] }) {
  const [filter, setFilter] = useState("all");
  const shown = filter === "all" ? reservations : reservations.filter((r) => r.status === filter);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Bronlar</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-xs ${filter === s ? "bg-brand-red text-white" : "bg-neutral-100"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-3">Kod</th>
              <th className="px-4 py-3">Mehmon</th>
              <th className="px-4 py-3">Kishi</th>
              <th className="px-4 py-3">Sana / vaqt</th>
              <th className="px-4 py-3">Stol</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-4 py-3">Amal</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-b border-neutral-100">
                <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{r.guestName}</div>
                  <div className="text-xs text-neutral-400">{r.guestPhone}</div>
                </td>
                <td className="px-4 py-3">{r.partySize}</td>
                <td className="px-4 py-3 text-xs">
                  {new Date(r.startTime).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3">{r.tableNumber || "—"}</td>
                <td className="px-4 py-3"><Badge color={COLOR[r.status]}>{r.status}</Badge></td>
                <td className="px-4 py-3">
                  <select
                    value={r.status}
                    onChange={(e) => updateReservationStatus(r.id, e.target.value as never)}
                    className="rounded border border-neutral-300 px-2 py-1 text-xs"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-400">Bron yo'q</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
