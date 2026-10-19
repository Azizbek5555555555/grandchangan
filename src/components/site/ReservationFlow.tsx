"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Check, Search, Plus, Minus, UtensilsCrossed, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn, t, formatMoney } from "@/lib/utils";
import { getAvailability, createReservation } from "@/lib/reservation/actions";
import { createPreorderForReservation } from "@/lib/order/actions";
import { RESTAURANT_TZ, restaurantDay } from "@/lib/time";
import { slotsForDay, hoursFor, dayOfWeekOf, type DayHours } from "@/lib/hours";
import { findByCode } from "@/lib/floorplan/layout";
import { useRoomName } from "@/components/floorplan/FloorMap";
import FloorAvailabilityMap, { type AvailTable, type AvailZone } from "./FloorAvailabilityMap";

type MenuCat = { id: string; name: unknown };
type MenuItm = { id: string; categoryId: string; name: unknown; price: number; imageUrl?: string | null };

/** Bosh sahifadagi xaritadan kelgan boshlang'ich qiymatlar (reservation/page.tsx tekshiradi) */
export type ReservationInitial = { date?: string; time?: string; guests?: number; tableId?: string };

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Bugun tanlangan bo'lsa, restoran vaqti bo'yicha o'tib ketgan soatlar */
const isPastSlot = (dateStr: string, tm: string) => {
  if (dateStr !== restaurantDay()) return dateStr < restaurantDay();
  const now = new Intl.DateTimeFormat("en-GB", { timeZone: RESTAURANT_TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
  return tm <= now;
};

type Phase = "form" | "prompt" | "menu" | "done";

export default function ReservationFlow({
  locale, menu, hours, phone, initial,
}: {
  locale: string; menu: { categories: MenuCat[]; items: MenuItm[] }; hours: DayHours[];
  /** Xona 1/2 va onlayn bron qilib bo'lmaydigan stollar uchun */
  phone?: string;
  initial?: ReservationInitial;
}) {
  const T = useTranslations("Site");
  const TB = useTranslations("Booking");
  const roomName = useRoomName();
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const STEPS = [T("rGuests"), T("rDate"), T("rTime"), T("rTable"), T("rInfo")];
  const WEEK = useMemo(() => Array.from({ length: 7 }).map((_, i) => new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(2024, 0, 1 + i))), [locale]);

  // Sana + vaqt + kishi soni kelgan bo'lsa — mount'da bo'sh stollar yuklanadi (stol bo'lsa — darhol 5-qadam)
  const boot = !!(initial?.date && initial.time && initial.guests);
  const [booting, setBooting] = useState(boot);
  const [notice, setNotice] = useState<"taken" | "slot" | null>(null);

  const [step, setStep] = useState(() => (boot ? 4 : initial?.guests ? (initial.date ? 3 : 2) : 1));
  const [party, setParty] = useState(initial?.guests ?? 2);
  const [moreGuests, setMoreGuests] = useState((initial?.guests ?? 0) > 8);
  const [date, setDate] = useState<string>(initial?.date ?? "");
  const [time, setTime] = useState<string>(initial?.time ?? "");
  const [calMonth, setCalMonth] = useState(() => {
    if (initial?.date) {
      const [y, m] = initial.date.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [zones, setZones] = useState<AvailZone[] | null>(null);
  const [selectedTable, setSelectedTable] = useState<AvailTable | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [request, setRequest] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>("form");
  const [code, setCode] = useState("");
  const [reservationId, setReservationId] = useState("");
  const [orderTotal, setOrderTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!boot || !initial?.date || !initial.time || !initial.guests) return;
    const { date: d, time: tm, guests: g, tableId } = initial;
    // Vaqt ish vaqtiga mos kelmasa yoki o'tib ketgan bo'lsa — vaqt (yoki sana) tanlashga qaytamiz
    const daySlots = slotsForDay(hoursFor(hours, dayOfWeekOf(d)));
    if (!daySlots.includes(tm) || isPastSlot(d, tm)) {
      const dayOk = daySlots.some((s) => !isPastSlot(d, s));
      setTime("");
      if (!dayOk) setDate("");
      setStep(dayOk ? 3 : 2);
      setNotice("slot");
      setBooting(false);
      return;
    }
    let alive = true;
    setLoading(true);
    getAvailability(d, tm, g)
      .then((res) => {
        if (!alive) return;
        setZones(res.zones);
        const tb = tableId ? res.zones.flatMap((z) => z.tables).find((x) => x.id === tableId) : undefined;
        if (tb && tb.state === "free") {
          setSelectedTable(tb);
          setStep(5);
        } else {
          setStep(4);
          if (tableId) setNotice("taken");
        }
      })
      .catch(() => {
        if (!alive) return;
        setStep(4);
        setError(T("errGeneric"));
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
        setBooting(false);
      });
    return () => { alive = false; };
    // Faqat birinchi ochilishda (initial o'zgarmaydi)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function goToTables() {
    setError(null); setNotice(null); setLoading(true);
    try {
      const res = await getAvailability(date, time, party);
      setZones(res.zones);
      // Avval tanlangan stol yangi vaqtda bo'sh bo'lmasa — tanlov bekor qilinadi
      const fresh = selectedTable ? res.zones.flatMap((z) => z.tables).find((x) => x.id === selectedTable.id) : undefined;
      setSelectedTable(fresh && fresh.state === "free" ? fresh : null);
      setStep(4);
    } catch {
      setError(T("errGeneric"));
    } finally {
      setLoading(false);
    }
  }
  async function submit() {
    if (!selectedTable) return;
    setError(null); setLoading(true);
    const res = await createReservation({ tableId: selectedTable.id, guestName: name, guestPhone: phoneInput, partySize: party, dateStr: date, timeStr: time, specialRequest: request });
    setLoading(false);
    if (res.ok) { setCode(res.code!); setReservationId(res.reservationId!); setPhase("prompt"); }
    else setError(res.error || T("errGeneric"));
  }

  // Bron soatlari — admin Sozlamalar'dagi ish vaqtidan (yopiq kun bo'sh)
  const times = date ? slotsForDay(hoursFor(hours, dayOfWeekOf(date))) : [];
  const year = calMonth.getFullYear(), month = calMonth.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysCount = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysCount; d++) cells.push(d);
  const canPrev = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1);
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(calMonth);
  // Tanlangan stol xaritaning qaysi xonasida (5-qadamdagi qisqa ma'lumot uchun)
  const selectedLoc = selectedTable ? findByCode(selectedTable.number.trim().toUpperCase()) : null;

  if (phase === "done") {
    return (
      <div className="mx-auto max-w-md px-4 pt-16 pb-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"><Check size={32} className="text-green-600" /></div>
        <h2 className="mb-2 font-display text-3xl text-content">{T("rDoneTitle")}</h2>
        <p className="mb-1 text-muted">{T("rYourCode")}</p>
        <p className="mb-6 font-display text-4xl text-brand-red">{code}</p>
        {orderTotal !== null && (
          <div className="mb-6 rounded-2xl border border-brand-gold/40 bg-surface-2 p-4 text-left">
            <p className="flex items-center gap-2 font-medium text-content"><UtensilsCrossed size={16} className="text-brand-red" /> {T("rPreorderDone")}</p>
            <p className="mt-1 text-sm text-muted">{T("rTotal")}: <b>{formatMoney(orderTotal)}</b></p>
            <p className="mt-1 text-xs text-muted">{T("rPayAtRest")}</p>
          </div>
        )}
        <p className="text-sm text-muted">{T("rContactSoon")}</p>
      </div>
    );
  }
  if (phase === "prompt") {
    return (
      <div className="mx-auto max-w-md px-4 pt-12 pb-20 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100"><Check size={28} className="text-green-600" /></div>
        <p className="mb-1 text-sm text-muted">{T("rCodeShort")} <b className="text-brand-red">{code}</b></p>
        <h2 className="mb-3 font-display text-3xl text-content">{T("rPreorderQ")}</h2>
        <p className="mb-8 text-muted">{T("rPreorderDesc")}</p>
        <div className="space-y-3">
          <button onClick={() => setPhase("menu")} className="w-full rounded-xl bg-brand-red py-3.5 font-medium text-white hover:bg-brand-red-dark">{T("rChooseMenu")}</button>
          <button onClick={() => setPhase("done")} className="w-full rounded-xl border border-line py-3.5 font-medium text-muted hover:bg-surface-2">{T("rLater")}</button>
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
          if (res.ok) { setOrderTotal(res.total ?? 0); setPhase("done"); } else setError(res.error || T("errGeneric"));
        }}
        loading={loading} error={error} />
    );
  }

  return (
    <div className={cn("mx-auto px-4 py-12", step === 4 ? "max-w-6xl" : "max-w-2xl")}>
      <div className="mb-10 flex items-center justify-center">
        {STEPS.map((label, i) => {
          const n = i + 1; const done = step > n; const active = step === n;
          return (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium ${done ? "bg-brand-red text-white" : active ? "border-2 border-brand-red text-brand-red" : "bg-surface-2 text-muted"}`}>{done ? <Check size={16} /> : n}</div>
                <span className={`mt-1.5 hidden text-[11px] sm:block ${active ? "text-content" : "text-muted"}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`mx-1 h-px w-6 sm:w-10 ${done ? "bg-brand-red" : "bg-surface-2"}`} />}
            </div>
          );
        })}
      </div>

      {notice === "slot" && step <= 3 && (
        <p className="mb-4 rounded-xl border border-brand-gold/40 bg-brand-gold/10 px-4 py-3 text-center text-sm text-content">{TB("slotUnavailable")}</p>
      )}

      {step === 1 && (
        <div className="rounded-3xl border border-line bg-card p-8 text-center">
          <h2 className="mb-8 font-display text-3xl text-content">{T("rHowMany")}</h2>
          <div className="mx-auto grid max-w-sm grid-cols-4 gap-4">
            {Array.from({ length: moreGuests ? 20 : 8 }).map((_, i) => {
              const v = i + 1;
              return <button key={v} onClick={() => { setParty(v); setStep(2); }} className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-lg transition ${party === v ? "bg-brand-red text-white" : "bg-surface-2 text-content hover:bg-surface-2"}`}>{v}</button>;
            })}
          </div>
          {!moreGuests && <button onClick={() => setMoreGuests(true)} className="mt-6 text-sm text-muted hover:text-brand-red">{T("rMore")} ▾</button>}
        </div>
      )}

      {step === 2 && (
        <div className="rounded-3xl border border-line bg-card p-8">
          <h2 className="mb-6 text-center font-display text-3xl text-content">{T("rWhichDay")}</h2>
          <div className="mb-4 flex items-center justify-between">
            <button disabled={!canPrev} onClick={() => setCalMonth(new Date(year, month - 1, 1))} className="rounded-full p-2 text-muted disabled:opacity-30 hover:bg-surface-2"><ChevronLeft size={20} /></button>
            <span className="font-medium capitalize text-content">{monthLabel}</span>
            <button onClick={() => setCalMonth(new Date(year, month + 1, 1))} className="rounded-full p-2 text-muted hover:bg-surface-2"><ChevronRight size={20} /></button>
          </div>
          <div className="mb-2 grid grid-cols-7 text-center text-xs capitalize text-muted">{WEEK.map((w, i) => <span key={i}>{w}</span>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <span key={i} />;
              const cellDate = new Date(year, month, d); const ds = ymd(cellDate);
              const disabled = cellDate < today || slotsForDay(hoursFor(hours, cellDate.getDay())).every((tm) => isPastSlot(ds, tm)); const selected = ds === date;
              return <button key={i} disabled={disabled} onClick={() => { setDate(ds); setStep(3); }} className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full text-sm transition ${selected ? "bg-brand-red text-white" : disabled ? "text-muted" : "text-content hover:bg-surface-2"}`}>{d}</button>;
            })}
          </div>
          <button onClick={() => setStep(1)} className="mt-6 text-sm text-muted">← {T("rBack")}</button>
        </div>
      )}

      {step === 3 && (
        <div className="rounded-3xl border border-line bg-card p-8 text-center">
          <h2 className="mb-8 font-display text-3xl text-content">{T("rWhichTime")}</h2>
          <div className="mx-auto grid max-w-md grid-cols-4 gap-3">
            {times.map((tm) => {
              const past = isPastSlot(date, tm);
              return <button key={tm} disabled={past} onClick={() => setTime(tm)} className={`rounded-full py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-30 ${time === tm && !past ? "bg-brand-red text-white" : "bg-surface-2 text-content hover:bg-surface-2"}`}>{tm}</button>;
            })}
          </div>
          {error && <p className="mt-4 text-sm text-danger">{error}</p>}
          <div className="mt-8 flex items-center justify-between">
            <button onClick={() => setStep(2)} className="text-sm text-muted">← {T("rBack")}</button>
            <button onClick={goToTables} disabled={!time || isPastSlot(date, time) || loading} className="rounded-full bg-brand-red px-7 py-2.5 font-medium text-white hover:bg-brand-red-dark disabled:opacity-40">{loading ? "..." : T("rSelectTable")}</button>
          </div>
        </div>
      )}

      {step === 4 && booting && (
        <div className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-3xl border border-line bg-card p-10 text-sm text-muted">
          <Loader2 size={18} className="animate-spin" /> {TB("checking")}
        </div>
      )}

      {step === 4 && !booting && (
        <div>
          <div className="mb-5 text-center">
            <h2 className="font-display text-3xl text-content">{T("rChooseTable")}</h2>
            <p className="mt-1 text-sm text-muted">{date} · {time} · {TB("guests", { count: party })}</p>
          </div>
          {notice === "taken" && (
            <p className="mb-4 rounded-xl border border-brand-gold/40 bg-brand-gold/10 px-4 py-3 text-sm text-content">{TB("tableTaken")}</p>
          )}
          {error && <p className="mb-4 text-sm text-danger">{error}</p>}
          <FloorAvailabilityMap
            zones={zones}
            loading={loading}
            selectedTableId={selectedTable?.id ?? null}
            onSelectTable={(tb) => { setSelectedTable(tb); setNotice(null); }}
            phone={phone}
          />
          <div className="mt-6 flex items-center justify-between gap-3">
            <button onClick={() => { setError(null); setStep(3); }} className="shrink-0 text-sm text-muted">← {T("rBack")}</button>
            <button onClick={() => setStep(5)} disabled={!selectedTable} className="rounded-full bg-brand-red px-6 py-2.5 font-medium text-white hover:bg-brand-red-dark disabled:opacity-40">{selectedTable ? `${T("rTable")} ${selectedTable.number} — ${T("rContinue")}` : T("rChooseTable")}</button>
          </div>
        </div>
      )}

      {step === 5 && selectedTable && (
        <div className="rounded-3xl border border-line bg-card p-8">
          <div className="mb-5 rounded-xl bg-surface-2 p-4 text-sm">
            <p>
              <b>{T("rTable")}:</b> {selectedTable.number}
              {selectedLoc && selectedLoc.room.kind !== "vip" ? <> ({roomName(selectedLoc.room)})</> : null}
              {" · "}<b>{T("rGuests")}:</b> {party}
            </p>
            <p><b>{T("rDate")}:</b> {date} · <b>{T("rTime")}:</b> {time}</p>
            {selectedTable.minSpend ? <p className="text-brand-red">{T("rMinSpend")}: {formatMoney(selectedTable.minSpend)}</p> : null}
          </div>
          <div className="space-y-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={T("rNamePh")} className="w-full rounded-lg border border-line px-3 py-2.5" />
            <input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder={T("rPhonePh")} className="w-full rounded-lg border border-line px-3 py-2.5" />
            <textarea value={request} onChange={(e) => setRequest(e.target.value)} rows={2} placeholder={T("rNotePh")} className="w-full rounded-lg border border-line px-3 py-2.5" />
          </div>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => { setError(null); setStep(4); }} className="text-sm text-muted">← {T("rBack")}</button>
            <button onClick={submit} disabled={loading || !name || phoneInput.length < 7} className="rounded-full bg-brand-red px-7 py-2.5 font-medium text-white hover:bg-brand-red-dark disabled:opacity-40">{loading ? "..." : T("rConfirm")}</button>
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
  const T = useTranslations("Site");
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const shown = useMemo(() => menu.items.filter((it) => {
    if (cat !== "all" && it.categoryId !== cat) return false;
    if (q && !t(it.name, locale).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [menu.items, cat, q, locale]);
  const total = useMemo(() => Object.entries(cart).reduce((sum, [id, qty]) => { const mi = menu.items.find((m) => m.id === id); return sum + (mi ? mi.price * qty : 0); }, 0), [cart, menu.items]);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const sub = (id: string) => setCart((c) => { const n = (c[id] || 0) - 1; const cc = { ...c }; if (n <= 0) delete cc[id]; else cc[id] = n; return cc; });

  return (
    <div className="mx-auto max-w-4xl px-4 pb-40 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <div><h2 className="font-display text-3xl text-content">{T("poTitle")}</h2><p className="text-sm text-muted">{T("poSub")}</p></div>
        <button onClick={onSkip} className="text-sm text-muted hover:text-brand-red">{T("poSkip")}</button>
      </div>
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={T("poSearch")} className="w-full rounded-full border border-line py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-red" />
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setCat("all")} className={`rounded-full px-4 py-1.5 text-sm ${cat === "all" ? "bg-brand-red text-white" : "bg-surface-2"}`}>{T("poAll")}</button>
        {menu.categories.map((c) => <button key={c.id} onClick={() => setCat(c.id)} className={`rounded-full px-4 py-1.5 text-sm ${cat === c.id ? "bg-brand-red text-white" : "bg-surface-2"}`}>{t(c.name, locale)}</button>)}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {shown.map((it) => {
          const qty = cart[it.id] || 0;
          return (
            <div key={it.id} className="flex items-center gap-3 rounded-xl border border-line bg-card p-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                <div className="absolute inset-0 flex items-center justify-center text-[8px] text-muted">GC</div>
                {it.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.imageUrl} alt="" loading="lazy" decoding="async" className="relative h-14 w-14 object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                ) : null}
              </div>
              <div className="min-w-0 flex-1"><p className="truncate font-medium text-content">{t(it.name, locale)}</p><p className="text-sm text-brand-red">{formatMoney(it.price)}</p></div>
              {qty === 0 ? (
                <button onClick={() => add(it.id)} className="rounded-full bg-brand-red px-4 py-1.5 text-sm font-medium text-white">+</button>
              ) : (
                <div className="flex items-center gap-2"><button onClick={() => sub(it.id)} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2"><Minus size={14} /></button><span className="w-5 text-center font-medium">{qty}</span><button onClick={() => add(it.id)} className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-red text-white"><Plus size={14} /></button></div>
              )}
            </div>
          );
        })}
      </div>
      {shown.length === 0 && <p className="py-10 text-center text-muted">{T("menuNothing")}</p>}
      {error && <p className="mt-4 text-center text-sm text-danger">{error}</p>}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4">
          <div><p className="text-xs text-muted">{count} {T("poItems")}</p><p className="font-display text-xl text-content">{formatMoney(total)}</p></div>
          <button onClick={() => onConfirm(cart)} disabled={loading || count === 0} className="rounded-full bg-brand-red px-8 py-3 font-medium text-white hover:bg-brand-red-dark disabled:opacity-40">{loading ? "..." : T("poConfirm")}</button>
        </div>
      </div>
    </div>
  );
}
