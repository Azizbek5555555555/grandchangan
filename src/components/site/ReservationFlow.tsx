"use client";

import { useState } from "react";
import { Users, Calendar, Clock, Check } from "lucide-react";
import { t } from "@/lib/utils";
import { getAvailability, createReservation } from "@/lib/reservation/actions";

type TableAvail = {
  id: string; number: string; seats: number; isVip: boolean;
  posX: number; posY: number; width: number; height: number; shape: string;
  minSpend: number | null; state: "free" | "busy" | "small" | "maintenance";
};
type ZoneAvail = { id: string; name: unknown; mapWidth: number; mapHeight: number; tables: TableAvail[] };

const TIMES = ["11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];

const STATE_COLOR: Record<string, string> = {
  free: "bg-green-500", busy: "bg-red-500", small: "bg-orange-400", maintenance: "bg-neutral-400",
};

export default function ReservationFlow({ locale }: { locale: string }) {
  const [step, setStep] = useState(1);
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("19:00");
  const [party, setParty] = useState(2);

  const [zones, setZones] = useState<ZoneAvail[]>([]);
  const [activeZone, setActiveZone] = useState("");
  const [selectedTable, setSelectedTable] = useState<TableAvail | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [request, setRequest] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadAvailability() {
    setLoading(true);
    const res = await getAvailability(date, time, party);
    setLoading(false);
    setZones(res.zones as ZoneAvail[]);
    setActiveZone(res.zones[0]?.id ?? "");
    setStep(2);
  }

  async function submit() {
    if (!selectedTable) return;
    setError(null);
    setLoading(true);
    const res = await createReservation({
      tableId: selectedTable.id, guestName: name, guestPhone: phone,
      partySize: party, dateStr: date, timeStr: time, specialRequest: request,
    });
    setLoading(false);
    if (res.ok) setDone(res.code!);
    else setError(res.error || "Xatolik");
  }

  const zone = zones.find((z) => z.id === activeZone);

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 pt-40 pb-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check size={32} className="text-green-600" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-brand-ink">Bron qabul qilindi!</h2>
        <p className="mb-1 text-neutral-500">Bron kodingiz:</p>
        <p className="mb-6 text-3xl font-bold text-brand-red">{done}</p>
        <p className="text-sm text-neutral-500">
          Tasdiqlash uchun tez orada siz bilan bog'lanamiz. SMS yuborildi.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <div className="mb-10 flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-2 w-16 rounded-full ${step >= s ? "bg-brand-red" : "bg-neutral-200"}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="mx-auto max-w-md space-y-5 rounded-2xl border border-neutral-200 bg-white p-8">
          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-sm font-medium"><Calendar size={16} /> Sana</span>
            <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
          </label>
          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-sm font-medium"><Clock size={16} /> Vaqt</span>
            <select value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2">
              {TIMES.map((tm) => <option key={tm} value={tm}>{tm}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-sm font-medium"><Users size={16} /> Kishilar soni</span>
            <input type="number" min={1} max={30} value={party} onChange={(e) => setParty(Number(e.target.value))} className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
          </label>
          <button onClick={loadAvailability} disabled={loading} className="w-full rounded-lg bg-brand-red py-3 font-medium text-white hover:bg-brand-red-dark disabled:opacity-60">
            {loading ? "..." : "Bo'sh stollarni ko'rish"}
          </button>
        </div>
      )}

      {step === 2 && zone && (
        <div>
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {zones.map((z) => (
              <button key={z.id} onClick={() => setActiveZone(z.id)} className={`rounded-full px-4 py-1.5 text-sm ${activeZone === z.id ? "bg-brand-red text-white" : "bg-neutral-100"}`}>
                {t(z.name, locale)}
              </button>
            ))}
          </div>

          <div className="mb-4 flex flex-wrap justify-center gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-green-500" /> Bo'sh</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-red-500" /> Band</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-orange-400" /> Sig'im kam</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-brand-gold" /> Tanlangan</span>
          </div>

          <div className="mx-auto overflow-auto rounded-xl border border-neutral-300 bg-neutral-50 p-2" style={{ maxWidth: "100%" }}>
            <div className="relative mx-auto bg-[linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" style={{ width: zone.mapWidth, height: zone.mapHeight }}>
              {zone.tables.map((tb) => {
                const selectable = tb.state === "free";
                const isSel = selectedTable?.id === tb.id;
                return (
                  <button
                    key={tb.id}
                    disabled={!selectable}
                    onClick={() => setSelectedTable(tb)}
                    className={`absolute flex flex-col items-center justify-center text-xs font-medium text-white shadow ${
                      isSel ? "bg-brand-gold text-brand-ink ring-4 ring-brand-gold/40" : STATE_COLOR[tb.state]
                    } ${tb.shape === "SQUARE" || tb.shape === "RECT" ? "rounded-lg" : "rounded-full"} ${selectable ? "cursor-pointer" : "cursor-not-allowed opacity-70"}`}
                    style={{ left: tb.posX, top: tb.posY, width: tb.width, height: tb.height }}
                  >
                    <span>{tb.number}</span>
                    <span className="opacity-80">{tb.seats}👤</span>
                    {tb.isVip && <span className="text-[9px]">VIP</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setStep(1)} className="text-sm text-neutral-500">← Orqaga</button>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedTable}
              className="rounded-lg bg-brand-red px-6 py-2.5 font-medium text-white hover:bg-brand-red-dark disabled:opacity-40"
            >
              {selectedTable ? `Stol ${selectedTable.number} — davom etish` : "Stol tanlang"}
            </button>
          </div>
        </div>
      )}

      {step === 3 && selectedTable && (
        <div className="mx-auto max-w-md space-y-5 rounded-2xl border border-neutral-200 bg-white p-8">
          <div className="rounded-lg bg-brand-cream p-3 text-sm">
            <p><b>Stol:</b> {selectedTable.number} · <b>Kishi:</b> {party}</p>
            <p><b>Sana:</b> {date} {time}</p>
            {selectedTable.minSpend ? <p className="text-brand-red">Minimal xarajat: {selectedTable.minSpend.toLocaleString()} so'm</p> : null}
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Ismingiz</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Telefon</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Izoh (ixtiyoriy)</span>
            <textarea value={request} onChange={(e) => setRequest(e.target.value)} rows={2} className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-between">
            <button onClick={() => setStep(2)} className="text-sm text-neutral-500">← Orqaga</button>
            <button
              onClick={submit}
              disabled={loading || !name || phone.length < 7}
              className="rounded-lg bg-brand-red px-6 py-2.5 font-medium text-white hover:bg-brand-red-dark disabled:opacity-40"
            >
              {loading ? "..." : "Bronni tasdiqlash"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
