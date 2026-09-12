"use client";

import { useState, useMemo } from "react";
import { Check, Search, Plus, Minus, UtensilsCrossed, ChevronLeft, ChevronRight } from "lucide-react";
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
const STATE_COLOR: Record<string, string> = { free: "bg-green-500", busy: "bg-red-500", small: "bg-orange-400", maintenance: "bg-neutral-400" };
const STEPS = ["Kishilar", "Sana", "Vaqt", "Stol", "Ma'lumot"];
const WEEK = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

type Phase = "form" | "prompt" | "menu" | "done";

export default function ReservationFlow({
  locale, menu,
}: { locale: string; menu: { categories: MenuCat[]; items: MenuItm[] } }) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [step, setStep] = useState(1);
  const [party, setParty] = useState(2);
  const [moreGuests, setMoreGuests] = useState(false);
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [calMonth, setCalMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const [zones, setZones] = useState<ZoneAvail[]>([]);
  const [activeZone, setActiveZone] = useState("");
  const [selectedTable, setSelectedTable] = useState<TableAvail | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [request, setRequest] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>("form");
  const [code, setCode] = useState("");
  const [reservationId, setReservationId] = useState("");
  const [orderTotal, setOrderTotal] = useState<number | null>(null);

  async function goToTables() {
    setLoading(true);
    const res = await getAvailability(date, time, party);
    setLoading(false);
    setZones(res.zones as ZoneAvail[]);
    setActiveZone(res.zones[0]?.id ?? "");
    setStep(4);
  }

  async function submit() {
    if (!selectedTable) return;
    setError(null);
    setLoading(true);
    const res = await createReservation({ tableId: selectedTable.id, guestName: name, guestPhone: phone, partySize: party, dateStr: date, timeStr: time, specialRequest: request });
    setLoading(false);
    if (res.ok) { setCode(res.code!); setReservationId(res.reservationId!); setPhase("prompt"); }
    else setError(res.error || "Xatolik");
  }

  const zone = zones.find((z) => z.id === activeZone);

  // ---------- calendar cells ----------
  const year = calMonth.getFullYear(), month = calMonth.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysCount = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysCount; d++) cells.push(d);
  const canPrev = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1);

  // =================== DONE / PROMPT / MENU ===================
  if (phase === "done") {
    return (
      <div className="mx-auto max-w-md px-4 pt-16 pb-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"><Check size={32} className="text-green-600" /></div>
        <h2 className="mb-2 font-display text-3xl text-brand-ink">Bron qabul qilindi!</h2>
        <p className="mb-1 text-neutral-500">Bron kodingiz:</p>
        <p className="mb-6 font-display text-4xl text-brand-red">{code}</p>
        {orderTotal !== null && (
          <div className="mb-6 rounded-2xl border border-brand-gold/40 bg-brand-cream p-4 text-left">
            <p className="flex items-center gap-2 font-medium text-brand-ink"><UtensilsCrossed size={16} className="text-brand-red" /> Oldindan buyurtma qabul qilindi</p>
            <p className="mt-1 text-sm text-neutral-600">Jami: <b>{formatMoney(orderTotal)}</b></p>
            <p className="mt-1 text-xs text-neutral-500">To&apos;lov restoranda amalga oshiriladi.</p>
          </div>
        )}
        <p className="text-sm text-neutral-500">Tez orada siz bilan bog&apos;lanamiz. SMS yuborildi.</p>
      </div>
    );
  }
  if (phase === "prompt") {
    return (
      <div className="mx-auto max-w-md px-4 pt-12 pb-20 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100"><Check size={28} className="text-green-600" /></div>
        <p className="mb-1 text-sm text-neutral-500">Bron kodi: <b className="text-brand-red">{code}</b></p>
        <h2 className="mb-3 font-display text-3xl text-brand-ink">Oldindan ovqat tanlaysizmi?</h2>
        <p className="mb-8 text-neutral-500">Taomlarni hozir tanlab qo&apos;ying — oshxona bron vaqtingizga tayyorlaydi.</p>
        <div className="space-y-3">
          <button onClick={() => setPhase("menu")} className="w-full rounded-xl bg-brand-red py-3.5 font-medium text-white hover:bg-brand-red-dark">Menyudan tanlash</button>
          <button onClick={() => setPhase("done")} className="w-full rounded-xl border border-neutral-300 py-3.5 font-medium text-neutral-600 hover:bg-neutral-50">Keyinroq, stolda tanlayman →</button>
        </div>
      </div>
    );
  }
  if (phase === "menu") {
    return (
      <PreorderMenu locale={locale} menu={menu}
        onSkip={() => setPhase("done")}
        onConfirm={async (cart) => {
          setError(null); setLoading(true);
          const items = Object.entries(cart).map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
          const res = await createPreorderForReservation({ reservationId, items });
          setLoading(false);
          if (res.ok) { setOrderTotal(res.total ?? 0); setPhase("done"); } else setError(res.error || "Xatolik");
        }}
        loading={loading} error={error} />
    );
  }

  // =================== FORM ===================
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Stepper */}
      <div className="mb-10 flex items-center justify-center">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          return (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium ${done ? "bg-brand-red text-white" : active ? "border-2 border-brand-red text-brand-red" : "bg-neutral-200 text-neutral-400"}`}>
                  {done ? <Check size={16} /> : n}
                </div>
                <span className={`mt-1.5 hidden text-[11px] sm:block ${active ? "text-brand-ink" : "text-neutral-400"}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`mx-1 h-px w-6 sm:w-10 ${done ? "bg-brand-red" : "bg-neutral-200"}`} />}
            </div>
          );
        })}
      </div>

      {/* STEP 1: PARTY */}
      {step === 1 && (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center">
          <h2 className="mb-8 font-display text-3xl text-brand-ink">Necha kishi?</h2>
          <div className="mx-auto grid max-w-sm grid-cols-4 gap-4">
            {Array.from({ length: moreGuests ? 20 : 8 }).map((_, i) => {
              const v = i + 1;
              return (
                <button key={v} onClick={() => { setParty(v); setStep(2); }}
                  className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-lg transition ${party === v ? "bg-brand-red text-white" : "bg-neutral-100 text-brand-ink hover:bg-neutral-200"}`}>
                  {v}
                </button>
              );
            })}
          </div>
          {!moreGuests && <button onClick={() => setMoreGuests(true)} className="mt-6 text-sm text-neutral-500 hover:text-brand-red">Ko&apos;proq ▾</button>}
        </div>
      )}

      {/* STEP 2: DATE */}
      {step === 2 && (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8">
          <h2 className="mb-6 text-center font-display text-3xl text-brand-ink">Qaysi kun?</h2>
          <div className="mb-4 flex items-center justify-between">
            <button disabled={!canPrev} onClick={() => setCalMonth(new Date(year, month - 1, 1))} className="rounded-full p-2 text-neutral-500 disabled:opacity-30 hover:bg-neutral-100"><ChevronLeft size={20} /></button>
            <span className="font-medium text-brand-ink">{MONTHS[month]} {year}</span>
            <button onClick={() => setCalMonth(new Date(year, month + 1, 1))} className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"><ChevronRight size={20} /></button>
          </div>
          <div className="mb-2 grid grid-cols-7 text-center text-xs text-neutral-400">{WEEK.map((w) => <span key={w}>{w}</span>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <span key={i} />;
              const cellDate = new Date(year, month, d);
              const ds = ymd(cellDate);
              const disabled = cellDate < today;
              const selected = ds === date;
              return (
                <button key={i} disabled={disabled}
                  onClick={() => { setDate(ds); setStep(3); }}
                  className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full text-sm transition ${selected ? "bg-brand-red text-white" : disabled ? "text-neutral-300" : "text-brand-ink hover:bg-neutral-100"}`}>
                  {d}
                </button>
              );
            })}
          </div>
          <button onClick={() => setStep(1)} className="mt-6 text-sm text-neutral-500">← Orqaga</button>
        </div>
      )}

      {/* STEP 3: TIME */}
      {step === 3 && (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center">
          <h2 className="mb-8 font-display text-3xl text-brand-ink">Qaysi vaqt?</h2>
          <div className="mx-auto grid max-w-md grid-cols-4 gap-3">
            {TIMES.map((tm) => (
              <button key={tm} onClick={() => { setTime(tm); }}
                className={`rounded-full py-3 text-sm transition ${time === tm ? "bg-brand-red text-white" : "bg-neutral-100 text-brand-ink hover:bg-neutral-200"}`}>
                {tm}
              </button>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-between">
            <button onClick={() => setStep(2)} className="text-sm text-neutral-500">← Orqaga</button>
            <button onClick={goToTables} disabled={!time || loading} className="rounded-full bg-brand-red px-7 py-2.5 font-medium text-white hover:bg-brand-red-dark disabled:opacity-40">{loading ? "..." : "Stol tanlash →"}</button>
          </div>
        </div>
      )}

      {/* STEP 4: TABLE MAP */}
      {step === 4 && zone && (
        <div>
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {zones.map((z) => (
              <button key={z.id} onClick={() => setActiveZone(z.id)} className={`rounded-full px-4 py-1.5 text-sm ${activeZone === z.id ? "bg-brand-red text-white" : "bg-neutral-100"}`}>{t(z.name, locale)}</button>
            ))}
          </div>
          <div className="mb-4 flex flex-wrap justify-center gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-green-500" /> Bo&apos;sh</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-red-500" /> Band</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-orange-400" /> Sig&apos;im kam</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-brand-gold" /> Tanlangan</span>
          </div>
          <div className="mx-auto overflow-auto rounded-xl border border-neutral-300 bg-neutral-50 p-2">
            <div className="relative mx-auto bg-[linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" style={{ width: zone.mapWidth, height: zone.mapHeight }}>
              {zone.tables.map((tb) => {
                const selectable = tb.state === "free";
                const isSel = selectedTable?.id === tb.id;
                return (
                  <button key={tb.id} disabled={!selectable} onClick={() => setSelectedTable(tb)}
                    className={`absolute flex flex-col items-center justify-center text-xs font-medium text-white shadow ${isSel ? "bg-brand-gold text-brand-ink ring-4 ring-brand-gold/40" : STATE_COLOR[tb.state]} ${tb.shape === "SQUARE" || tb.shape === "RECT" ? "rounded-lg" : "rounded-full"} ${selectable ? "cursor-pointer" : "cursor-not-allowed opacity-70"}`}
                    style={{ left: tb.posX, top: tb.posY, width: tb.width, height: tb.height }}>
                    <span>{tb.number}</span>
                    <span className="opacity-80">{tb.seats}👤</span>
                    {tb.isVip && <span className="text-[9px]">VIP</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setStep(3)} className="text-sm text-neutral-500">← Orqaga</button>
            <button onClick={() => setStep(5)} disabled={!selectedTable} className="rounded-full bg-brand-red px-6 py-2.5 font-medium text-white hover:bg-brand-red-dark disabled:opacity-40">{selectedTable ? `Stol ${selectedTable.number} — davom` : "Stol tanlang"}</button>
          </div>
        </div>
      )}

      {/* STEP 5: CONTACT */}
      {step === 5 && selectedTable && (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8">
          <div className="mb-5 rounded-xl bg-brand-cream p-4 text-sm">
            <p><b>Stol:</b> {selectedTable.number} · <b>Kishi:</b> {party}</p>
            <p><b>Sana:</b> {date} · <b>Vaqt:</b> {time}</p>
            {selectedTable.minSpend ? <p className="text-brand-red">Minimal xarajat: {formatMoney(selectedTable.minSpend)}</p> : null}
          </div>
          <div className="space-y-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ismingiz" className="w-full rounded-lg border border-neutral-300 px-3 py-2.5" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" className="w-full rounded-lg border border-neutral-300 px-3 py-2.5" />
            <textarea value={request} onChange={(e) => setRequest(e.target.value)} rows={2} placeholder="Izoh (ixtiyoriy)" className="w-full rounded-lg border border-neutral-300 px-3 py-2.5" />
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setStep(4)} className="text-sm text-neutral-500">← Orqaga</button>
            <button onClick={submit} disabled={loading || !name || phone.length < 7} className="rounded-full bg-brand-red px-7 py-2.5 font-medium text-white hover:bg-brand-red-dark disabled:opacity-40">{loading ? "..." : "Bronni tasdiqlash"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PreorderMenu({
  locale, menu, onSkip, onConfirm, loading, error,
}: {
  locale: string; menu: { categories: MenuCat[]; items: MenuItm[] };
  onSkip: () => void; onConfirm: (cart: Record<string, number>) => void; loading: boolean; error: string | null;
}) {
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});

  const shown = useMemo(() => menu.items.filter((it) => {
    if (cat !== "all" && it.categoryId !== cat) return false;
    if (q && !t(it.name, locale).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [menu.items, cat, q, locale]);

  const total = useMemo(() => Object.entries(cart).reduce((sum, [id, qty]) => {
    const mi = menu.items.find((m) => m.id === id); return sum + (mi ? mi.price * qty : 0);
  }, 0), [cart, menu.items]);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const sub = (id: string) => setCart((c) => { const n = (c[id] || 0) - 1; const cc = { ...c }; if (n <= 0) delete cc[id]; else cc[id] = n; return cc; });

  return (
    <div className="mx-auto max-w-4xl px-4 pb-40 pt-8">
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
        {menu.categories.map((c) => <button key={c.id} onClick={() => setCat(c.id)} className={`rounded-full px-4 py-1.5 text-sm ${cat === c.id ? "bg-brand-red text-white" : "bg-neutral-100"}`}>{t(c.name, locale)}</button>)}
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
          <div><p className="text-xs text-neutral-400">{count} ta taom</p><p className="font-display text-xl text-brand-ink">{formatMoney(total)}</p></div>
          <button onClick={() => onConfirm(cart)} disabled={loading || count === 0} className="rounded-full bg-brand-red px-8 py-3 font-medium text-white hover:bg-brand-red-dark disabled:opacity-40">{loading ? "..." : "Buyurtmani tasdiqlash"}</button>
        </div>
      </div>
    </div>
  );
}
