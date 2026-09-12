"use client";

import { useState, useMemo } from "react";
import { Users, Calendar, Clock, Check, Search, Plus, Minus, UtensilsCrossed } from "lucide-react";
import { t, formatMoney } from "@/lib/utils";
import { getAvailability, createReservation } from "@/lib/reservation/actions";
import { createPreorderForReservation } from "@/lib/order/actions";

type TableAvail = {
  id: string; number: string; seats: number; isVip: boolean;
  posX: number; posY: number; width: number; height: number; shape: string;
  minSpend: number | null; state: "free" | "busy" | "small" | "maintenance";
};
type ZoneAvail = { id: string; name: unknown; mapWidth: number; mapHeight: number; tables: TableAvail[] };

type MenuCat = { id: string; name: unknown };
type MenuItm = { id: string; categoryId: string; name: unknown; price: number; imageUrl?: string | null };

const TIMES = ["11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];
const STATE_COLOR: Record<string, string> = {
  free: "bg-green-500", busy: "bg-red-500", small: "bg-orange-400", maintenance: "bg-neutral-400",
};

type Phase = "form" | "prompt" | "menu" | "done";

export default function ReservationFlow({
  locale, menu,
}: { locale: string; menu: { categories: MenuCat[]; items: MenuItm[] } }) {
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
  const [error, setError] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>("form");
  const [code, setCode] = useState<string>("");
  const [reservationId, setReservationId] = useState<string>("");
  const [orderTotal, setOrderTotal] = useState<number | null>(null);

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
    if (res.ok) {
      setCode(res.code!);
      setReservationId(res.reservationId!);
      setPhase("prompt");
    } else {
      setError(res.error || "Xatolik");
    }
  }

  const zone = zones.find((z) => z.id === activeZone);

  if (phase === "done") {
    return (
      <div className="mx-auto max-w-md px-4 pt-40 pb-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check size={32} className="text-green-600" />
        </div>
        <h2 className="mb-2 font-display text-3xl text-brand-ink">Bron qabul qilindi!</h2>
        <p className="mb-1 text-neutral-500">Bron kodingiz:</p>
        <p className="mb-6 font-display text-4xl text-brand-red">{code}</p>
        {orderTotal !== null && (
          <div className="mb-6 rounded-2xl border border-brand-gold/40 bg-brand-cream p-4 text-left">
            <p className="flex items-center gap-2 font-medium text-brand-ink"><UtensilsCrossed size={16} className="text-brand-red" /> Oldindan buyurtma qabul qilindi</p>
            <p className="mt-1 text-sm text-neutral-600">Jami: <b>{formatMoney(orderTotal)}</b></p>
            <p className="mt-1 text-xs text-neutral-500">To&apos;lov restoranda amalga oshiriladi. Ovqatlar bron vaqtiga tayyorlanadi.</p>
          </div>
        )}
        <p className="text-sm text-neutral-500">Tasdiqlash uchun tez orada siz bilan bog&apos;lanamiz. SMS yuborildi.</p>
      </div>
    );
  }

  if (phase === "prompt") {
    return (
      <div className="mx-auto max-w-md px-4 pt-32 pb-20 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <Check size={28} className="text-green-600" />
        </div>
        <p className="mb-1 text-sm text-neutral-500">Bron kodi: <b className="text-brand-red">{code}</b></p>
        <h2 className="mb-3 font-display text-3xl text-brand-ink">Oldindan ovqat tanlaysizmi?</h2>
        <p className="mb-8 text-neutral-500">
          Xohlasangiz taomlarni hozir tanlab qo&apos;ying — oshxona bron vaqtingizga tayyorlab qo&apos;yadi.
          Yoki keyinroq stolda ofitsiantdan buyurtma berasiz.
        </p>
        <div className="space-y-3">
          <button onClick={() => setPhase("menu")} className="w-full rounded-xl bg-brand-red py-3.5 font-medium text-white hover:bg-brand-red-dark">
            Menyudan tanlash
          </button>
          <button onClick={() => setPhase("done")} className="w-full rounded-xl border border-neutral-300 py-3.5 font-medium text-neutral-600 hover:bg-neutral-50">
            Keyinroq, stolda tanlayman →
          </button>
        </div>
      </div>
    );
  }

  if (phase === "menu") {
    return (
      <PreorderMenu
        locale={locale}
        menu={menu}
        onSkip={() => setPhase("done")}
        onConfirm={async (cart) => {
          setError(null);
          setLoading(true);
          const items = Object.entries(cart).map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
          const res = await createPreorderForReservation({ reservationId, items });
          setLoading(false);
          if (res.ok) { setOrderTotal(res.total ?? 0); setPhase("done"); }
          else setError(res.error || "Xatolik");
        }}
        loading={loading}
        error={error}
      />
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
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-green-500" /> Bo&apos;sh</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-red-500" /> Band</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-orange-400" /> Sig&apos;im kam</span>
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
            {selectedTable.minSpend ? <p className="text-brand-red">Minimal xarajat: {formatMoney(selectedTable.minSpend)}</p> : null}
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

function PreorderMenu({
  locale, menu, onSkip, onConfirm, loading, error,
}: {
  locale: string;
  menu: { categories: MenuCat[]; items: MenuItm[] };
  onSkip: () => void;
  onConfirm: (cart: Record<string, number>) => void;
  loading: boolean;
  error: string | null;
}) {
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});

  const shown = useMemo(() => menu.items.filter((it) => {
    if (cat !== "all" && it.categoryId !== cat) return false;
    if (q && !t(it.name, locale).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [menu.items, cat, q, locale]);

  const total = useMemo(() =>
    Object.entries(cart).reduce((sum, [id, qty]) => {
      const mi = menu.items.find((m) => m.id === id);
      return sum + (mi ? mi.price * qty : 0);
    }, 0), [cart, menu.items]);

  const count = Object.values(cart).reduce((a, b) => a + b, 0);

  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const sub = (id: string) => setCart((c) => {
    const n = (c[id] || 0) - 1; const cc = { ...c };
    if (n <= 0) delete cc[id]; else cc[id] = n;
    return cc;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 pb-40 pt-32">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-brand-ink">Oldindan buyurtma</h2>
          <p className="text-sm text-neutral-500">Taomlarni tanlang — oshxona bron vaqtiga tayyorlaydi.</p>
        </div>
        <button onClick={onSkip} className="text-sm text-neutral-500 hover:text-brand-red">O&apos;tkazib yuborish →</button>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Taom qidirish..." className="w-full rounded-full border border-neutral-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-red" />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setCat("all")} className={`rounded-full px-4 py-1.5 text-sm ${cat === "all" ? "bg-brand-red text-white" : "bg-neutral-100"}`}>Barchasi</button>
        {menu.categories.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} className={`rounded-full px-4 py-1.5 text-sm ${cat === c.id ? "bg-brand-red text-white" : "bg-neutral-100"}`}>{t(c.name, locale)}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {shown.map((it) => {
          const qty = cart[it.id] || 0;
          return (
            <div key={it.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                <div className="absolute inset-0 flex items-center justify-center text-[8px] text-neutral-300">GC</div>
                {it.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.imageUrl} alt="" className="relative h-14 w-14 object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-brand-ink">{t(it.name, locale)}</p>
                <p className="text-sm text-brand-red">{formatMoney(it.price)}</p>
              </div>
              {qty === 0 ? (
                <button onClick={() => add(it.id)} className="rounded-full bg-brand-red px-4 py-1.5 text-sm font-medium text-white">+</button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => sub(it.id)} className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200"><Minus size={14} /></button>
                  <span className="w-5 text-center font-medium">{qty}</span>
                  <button onClick={() => add(it.id)} className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-red text-white"><Plus size={14} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {shown.length === 0 && <p className="py-10 text-center text-neutral-400">Taom topilmadi.</p>}

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs text-neutral-400">{count} ta taom</p>
            <p className="font-display text-xl text-brand-ink">{formatMoney(total)}</p>
          </div>
          <button
            onClick={() => onConfirm(cart)}
            disabled={loading || count === 0}
            className="rounded-full bg-brand-red px-8 py-3 font-medium text-white hover:bg-brand-red-dark disabled:opacity-40"
          >
            {loading ? "..." : "Buyurtmani tasdiqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}
