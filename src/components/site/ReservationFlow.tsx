"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Check, Search, Plus, Minus, UtensilsCrossed, ChevronLeft, ChevronRight, ChevronDown, Loader2,
  Users, CalendarDays, Clock, Armchair, Phone, ArrowRight, ArrowLeft, Sun, Moon,
} from "lucide-react";
import { cn, t, formatMoney } from "@/lib/utils";
import { getAvailability, createReservation } from "@/lib/reservation/actions";
import { createPreorderForReservation } from "@/lib/order/actions";
import { RESTAURANT_TZ, formatDayMonth, formatMonthYear, restaurantDay, weekdayShort } from "@/lib/time";
import { slotsForDay, hoursFor, dayOfWeekOf, SLOT_MINUTES, type DayHours } from "@/lib/hours";
import { findByCode } from "@/lib/floorplan/layout";
import { useRoomName } from "@/components/floorplan/FloorMap";
import Blob from "@/components/site/kit/Blob";
import DishFallback from "@/components/site/kit/DishFallback";
import ButtonLink, { btnClass } from "@/components/site/kit/ButtonLink";
import Lanterns from "@/components/three/Lanterns";
import SafeImg from "@/components/site/pages/SafeImg";
import Celebrate from "@/components/site/pages/Celebrate";
import { KnotDivider } from "@/components/site/pages/Ornament";
import { areaCls, errorCls, fieldCls, labelCls } from "@/components/site/pages/form";
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
/** Kechki slotlar shu soatdan boshlanadi (faqat guruhlash uchun) */
const EVENING_FROM = "17:00";

type Phase = "form" | "prompt" | "menu" | "done";

/** Qadam almashganda kartani yumshoq ko'rsatish (reduced-motion — animatsiyasiz) */
function StepAnim({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(el, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out", clearProps: "transform,opacity" });
    });
    return () => mm.revert();
  }, { scope: ref });
  return <div ref={ref} className={className}>{children}</div>;
}

/** Qadam sarlavhasi: xitoycha bezak + nafis serif sarlavha */
function StepTitle({ cnText, title, sub, center = true }: { cnText: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={cn("mb-8", center && "text-center")}>
      <span lang="zh" aria-hidden="true" className="font-cn text-2xl leading-none text-fire-ink">{cnText}</span>
      <h2 className="mt-1 font-display text-3xl leading-[1.1] text-content sm:text-4xl">{title}</h2>
      {sub && <p className="mt-2 text-sm text-muted">{sub}</p>}
    </div>
  );
}

const cardCls = "rounded-[2rem] bg-card p-6 shadow-xl shadow-night/5 ring-1 ring-line sm:p-10";
const backCls = "inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted transition hover:bg-sand hover:text-content disabled:opacity-40";

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
  const TE = useTranslations("Errors");
  const TC = useTranslations("Common");
  const P = useTranslations("Pages2");
  const roomName = useRoomName();
  // "Bugun" — restoran vaqti (Toshkent) bo'yicha, mehmon brauzeri mintaqasiga bog'liq emas
  const todayStr = useMemo(() => restaurantDay(), []);
  const thisMonth = useMemo(() => { const [y, m] = todayStr.split("-").map(Number); return new Date(y, m - 1, 1); }, [todayStr]);
  // Kalendar (oy/hafta nomlari Intl bilan) faqat brauzerda chiziladi — server va brauzer ICU farqi hydration xatosi bermasin
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const tablesReq = useRef(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const STEPS = [T("rGuests"), T("rDate"), T("rTime"), T("rTable"), T("rInfo")];
  const WEEK = useMemo(() => Array.from({ length: 7 }).map((_, i) => weekdayShort(i, locale)), [locale]);

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
    return thisMonth;
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
      if (!dayOk) {
        setDate("");
        setCalMonth(thisMonth);
      }
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

  // Qadam/bosqich almashganda — oqim boshi ekrandan yuqorida qolgan bo'lsa, unga qaytamiz (telefonda muhim)
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const el = rootRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 0) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: Math.max(0, top + window.scrollY - 90), behavior: reduce ? "auto" : "smooth" });
    }
  }, [step, phase]);

  async function goToTables() {
    // Eskirgan javob (foydalanuvchi orqaga qaytib boshqa sana tanlagan bo'lsa) e'tiborsiz qoldiriladi
    const id = ++tablesReq.current;
    setError(null); setNotice(null); setLoading(true);
    try {
      const res = await getAvailability(date, time, party);
      if (id !== tablesReq.current) return;
      setZones(res.zones);
      // Avval tanlangan stol yangi vaqtda bo'sh bo'lmasa — tanlov bekor qilinadi
      const fresh = selectedTable ? res.zones.flatMap((z) => z.tables).find((x) => x.id === selectedTable.id) : undefined;
      setSelectedTable(fresh && fresh.state === "free" ? fresh : null);
      setStep(4);
    } catch {
      if (id === tablesReq.current) setError(T("errGeneric"));
    } finally {
      if (id === tablesReq.current) setLoading(false);
    }
  }
  async function submit() {
    if (!selectedTable) return;
    setError(null); setLoading(true);
    const res = await createReservation({ tableId: selectedTable.id, guestName: name, guestPhone: phoneInput, partySize: party, dateStr: date, timeStr: time, specialRequest: request });
    setLoading(false);
    if (res.ok) { setCode(res.code!); setReservationId(res.reservationId!); setPhase("prompt"); return; }
    // Stol shu orada band bo'lib qolgan bo'lsa — xaritani yangilab, 4-qadamga qaytamiz
    if (res.error === TE("tableBusy") || res.error === TE("tableNotFound")) {
      await goToTables();
      setNotice("taken");
      return;
    }
    setError(res.error || T("errGeneric"));
  }

  // Bron soatlari — admin Sozlamalar'dagi ish vaqtidan (yopiq kun bo'sh)
  const times = date ? slotsForDay(hoursFor(hours, dayOfWeekOf(date))) : [];
  const dayTimes = times.filter((tm) => tm < EVENING_FROM);
  const eveTimes = times.filter((tm) => tm >= EVENING_FROM);
  const year = calMonth.getFullYear(), month = calMonth.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysCount = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysCount; d++) cells.push(d);
  const canPrev = new Date(year, month, 1) > thisMonth;
  const monthLabel = formatMonthYear(year, month, locale);
  // Tanlangan stol xaritaning qaysi xonasida (5-qadamdagi qisqa ma'lumot uchun)
  const selectedLoc = selectedTable ? findByCode(selectedTable.number.trim().toUpperCase()) : null;
  const tableText = selectedTable
    ? `${selectedTable.number}${selectedLoc && selectedLoc.room.kind !== "vip" ? ` · ${roomName(selectedLoc.room)}` : ""}`
    : "";
  // Sana yozuvi faqat brauzerda chiroyli (server/brauzer ICU farqi) — avval xom ko'rinishda
  const dateText = date ? (mounted ? formatDayMonth(date, locale) : date) : "";
  const tel = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const busy = loading || booting;

  // ---- Umumiy fon (krem bo'lim, nozik panjara naqsh va blob) ----
  const shell = (children: React.ReactNode, wide = false) => (
    <section className="relative overflow-x-clip bg-paper">
      <span aria-hidden="true" className="lattice-bg pointer-events-none absolute inset-0 text-fire/[0.05]" />
      <Blob className="absolute -right-48 top-24 w-[30rem] text-sand" variant="c" />
      <Blob className="absolute -left-56 bottom-10 w-[26rem] text-sand" variant="a" />
      <div ref={rootRef} className={cn("relative mx-auto px-5 pb-24 pt-10 sm:px-8 sm:pb-32 sm:pt-14", wide ? "max-w-7xl" : "max-w-6xl")}>
        {children}
      </div>
    </section>
  );

  // ---- Bron "chiptasi": tanlangan qiymatlar (kompyuterda o'ngda, yakunda ham) ----
  const rows: { n: number; icon: React.ReactNode; label: string; value: string }[] = [
    { n: 1, icon: <Users size={16} />, label: T("rGuests"), value: TB("guests", { count: party }) },
    { n: 2, icon: <CalendarDays size={16} />, label: T("rDate"), value: dateText },
    { n: 3, icon: <Clock size={16} />, label: T("rTime"), value: step >= 3 || phase !== "form" ? time : "" },
    { n: 4, icon: <Armchair size={16} />, label: T("rTable"), value: step >= 5 || phase !== "form" ? tableText : "" },
  ];
  const ticket = (
    <div className="relative overflow-hidden rounded-[2rem] bg-night p-7 text-brand-cream shadow-2xl shadow-night/30">
      <Blob className="absolute -right-16 -top-16 w-48 text-fire/80" variant="b" />
      <span lang="zh" aria-hidden="true" className="font-cn absolute bottom-4 right-5 text-7xl leading-none text-brand-cream/[0.07]">订座</span>
      <p className="relative flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-saffron">
        <span lang="zh" className="font-cn text-xl normal-case tracking-normal">长安</span> {P("yourBooking")}
      </p>
      <ul className="relative mt-6 space-y-1">
        {rows.map((r) => {
          const can = phase === "form" && step > r.n && !busy;
          return (
            <li key={r.n}>
              <button
                type="button"
                disabled={!can}
                onClick={() => { setError(null); setStep(r.n); }}
                className="group flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-left transition enabled:hover:bg-brand-cream/5"
              >
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", r.value ? "bg-saffron text-brand-ink" : "bg-night-3 text-brand-cream/50")}>{r.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-brand-cream/55">{r.label}</span>
                  <span className={cn("block truncate font-display text-lg", r.value ? "text-brand-cream" : "text-brand-cream/35")}>{r.value || "—"}</span>
                </span>
                {can && <span className="text-xs text-brand-cream/0 transition group-hover:text-saffron">{P("edit")}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {/* Chipta "teshiklari" */}
      <div className="relative -mx-7 my-5 flex items-center">
        <span className="h-6 w-6 -translate-x-3 rounded-full bg-paper" />
        <span className="flex-1 border-t-2 border-dashed border-brand-cream/15" />
        <span className="h-6 w-6 translate-x-3 rounded-full bg-paper" />
      </div>
      <p className="relative text-sm leading-relaxed text-brand-cream/70">{P("holdNote", { hours: SLOT_MINUTES / 60 })}</p>
      {selectedTable?.minSpend && step >= 5 ? (
        <p className="relative mt-2 text-sm text-saffron">{T("rMinSpend")}: {formatMoney(selectedTable.minSpend)}</p>
      ) : null}
    </div>
  );

  // Telefon: tanlanganlar ixcham qatorda
  const miniSummary = (
    <div className="mb-5 flex flex-wrap justify-center gap-2 lg:hidden">
      {rows.filter((r) => r.value).map((r) => {
        const can = phase === "form" && step > r.n && !busy;
        return (
          <button
            key={r.n}
            type="button"
            disabled={!can}
            onClick={() => { setError(null); setStep(r.n); }}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-night px-3.5 text-sm text-brand-cream"
          >
            <span className="text-saffron">{r.icon}</span> {r.value}
          </button>
        );
      })}
    </div>
  );

  // ======================== Yakun ========================
  if (phase === "done") {
    return shell(
      <StepAnim className="mx-auto max-w-xl">
        <div className="relative overflow-hidden rounded-[2rem] bg-night px-6 pb-10 pt-10 text-center text-brand-cream shadow-2xl shadow-night/30 sm:px-12">
          <Blob className="absolute -left-20 -top-24 w-64 text-fire/80" variant="a" />
          <Blob className="absolute -bottom-24 -right-16 w-60 text-wine" variant="c" />
          <Lanterns className="pointer-events-none absolute inset-x-0 top-0 h-56" />
          <Celebrate />
          <div className="relative">
            <span lang="zh" aria-hidden="true" className="font-cn text-4xl leading-none text-saffron">谢谢</span>
            <h2 className="mt-3 font-display text-4xl leading-[1.08] sm:text-5xl">{T("rDoneTitle")}</h2>
            <p className="mt-7 text-sm text-brand-cream/70">{T("rYourCode")}</p>
            <p className="mt-2 inline-block rounded-2xl border-2 border-dashed border-saffron/60 px-6 py-3 font-poster text-3xl tracking-wider text-saffron sm:text-4xl">{code}</p>
            <ul className="mx-auto mt-7 grid max-w-sm grid-cols-2 gap-2 text-left text-sm">
              {rows.filter((r) => r.value).map((r) => (
                <li key={r.n} className="rounded-2xl bg-night-3 px-4 py-3">
                  <span className="block text-[11px] uppercase tracking-[0.16em] text-brand-cream/55">{r.label}</span>
                  <span className="block truncate font-medium">{r.value}</span>
                </li>
              ))}
            </ul>
            {orderTotal !== null && (
              <div className="mx-auto mt-4 max-w-sm rounded-2xl border border-brand-gold/40 bg-night-3 p-4 text-left">
                <p className="flex items-center gap-2 font-medium"><UtensilsCrossed size={16} className="text-saffron" /> {T("rPreorderDone")}</p>
                <p className="mt-1 text-sm text-brand-cream/75">{T("rTotal")}: <b className="text-saffron">{formatMoney(orderTotal)}</b></p>
                <p className="mt-1 text-xs text-brand-cream/60">{T("rPayAtRest")}</p>
              </div>
            )}
            <p className="mt-6 text-sm text-brand-cream/75">{T("rContactSoon")}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/" variant="saffron" blob>{TC("home")}</ButtonLink>
              <ButtonLink href="/menu" variant="ghost-light">{TC("menu")}</ButtonLink>
            </div>
          </div>
        </div>
      </StepAnim>
    );
  }

  // ======================== Bron qabul qilindi → oldindan buyurtma? ========================
  if (phase === "prompt") {
    return shell(
      <StepAnim className="mx-auto max-w-lg">
        <div className="relative overflow-hidden rounded-[2rem] bg-card p-7 text-center shadow-xl shadow-night/5 ring-1 ring-line sm:p-10">
          <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center">
            <Celebrate />
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-fire text-brand-cream shadow-lg shadow-fire/30">
              <Check size={38} strokeWidth={2.5} />
            </span>
          </div>
          <p className="font-display text-2xl text-content">{T("rDoneTitle")}</p>
          <p className="mt-2 text-sm text-muted">{T("rCodeShort")}</p>
          <p className="mt-1 font-poster text-3xl tracking-wider text-fire-ink">{code}</p>
          <KnotDivider className="my-7 text-fire/50" />
          <span lang="zh" aria-hidden="true" className="font-cn text-2xl leading-none text-fire-ink">点菜</span>
          <h2 className="mt-1 font-display text-3xl leading-[1.1] text-content">{T("rPreorderQ")}</h2>
          <p className="mx-auto mt-3 max-w-sm text-muted">{T("rPreorderDesc")}</p>
          <div className="mt-8 grid gap-3">
            <button type="button" onClick={() => setPhase("menu")} className={cn(btnClass("fire", "lg"), "w-full")}>
              <UtensilsCrossed size={18} /> {T("rChooseMenu")}
            </button>
            <button type="button" onClick={() => setPhase("done")} className={cn(btnClass("ghost-dark", "lg"), "w-full")}>{T("rLater")}</button>
          </div>
        </div>
      </StepAnim>
    );
  }

  // ======================== Oldindan buyurtma menyusi ========================
  if (phase === "menu") {
    return shell(
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

  // ======================== Bron qadamlari ========================
  const stepper = (
    <nav aria-label={P("steps")} className="mx-auto mb-8 max-w-2xl sm:mb-12">
      <ol className="flex items-start">
        {STEPS.map((label, i) => {
          const n = i + 1; const done = step > n; const active = step === n;
          return (
            <li key={i} className="flex flex-1 items-start last:flex-none">
              <button
                type="button"
                disabled={!done || busy}
                onClick={() => { setError(null); setStep(n); }}
                aria-current={active ? "step" : undefined}
                className="group flex w-14 flex-col items-center gap-1.5 sm:w-20"
              >
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold transition duration-500",
                    done ? "bg-fire text-brand-cream group-enabled:group-hover:bg-fire-deep" : active ? "bg-card text-fire-ink ring-2 ring-fire shadow-lg shadow-fire/20" : "bg-sand text-muted"
                  )}
                >
                  {done ? <Check size={18} strokeWidth={2.6} /> : n}
                </span>
                <span className={cn("text-center text-[11px] leading-tight sm:text-xs", active ? "font-semibold text-content" : "text-muted")}>{label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className="relative mx-0.5 mt-[21px] h-0.5 flex-1 overflow-hidden rounded-full bg-sand">
                  <span className={cn("absolute inset-y-0 left-0 bg-fire transition-all duration-700", done ? "w-full" : "w-0")} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );

  const slotBtn = (tm: string) => {
    const past = isPastSlot(date, tm);
    const on = time === tm && !past;
    return (
      <button
        key={tm}
        type="button"
        disabled={past}
        aria-pressed={on}
        onClick={() => setTime(tm)}
        className={cn(
          "h-12 rounded-full text-base font-medium tabular-nums transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-30",
          on ? "bg-fire text-brand-cream shadow-lg shadow-fire/30" : "bg-sand text-content enabled:hover:bg-fire/10 enabled:hover:text-fire"
        )}
      >
        {tm}
      </button>
    );
  };

  return shell(
    <>
      {stepper}

      {notice === "slot" && step <= 3 && (
        <p className="mx-auto mb-5 max-w-2xl rounded-2xl border border-saffron/50 bg-saffron/15 px-4 py-3 text-center text-sm text-content">{TB("slotUnavailable")}</p>
      )}

      {step !== 4 && miniSummary}

      {step !== 4 && (
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
          <div className="min-w-0">
            {step === 1 && (
              <StepAnim key="s1" className={cn(cardCls, "text-center")}>
                <StepTitle cnText="几位" title={T("rHowMany")} />
                <div className="mx-auto grid max-w-sm grid-cols-4 gap-3 sm:gap-4">
                  {Array.from({ length: moreGuests ? 20 : 8 }).map((_, i) => {
                    const v = i + 1;
                    return (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={party === v}
                        onClick={() => { setParty(v); setStep(2); }}
                        className={cn(
                          "mx-auto flex aspect-square w-full max-w-16 items-center justify-center rounded-full text-lg font-semibold tabular-nums transition active:scale-95",
                          party === v ? "bg-fire text-brand-cream shadow-lg shadow-fire/30" : "bg-sand text-content hover:bg-fire/10 hover:text-fire"
                        )}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
                {!moreGuests ? (
                  <button type="button" onClick={() => setMoreGuests(true)} className="mt-6 inline-flex h-11 items-center gap-1 rounded-full px-4 text-sm font-medium text-muted transition hover:bg-sand hover:text-fire">
                    {T("rMore")} <ChevronDown size={16} />
                  </button>
                ) : (
                  <p className="mx-auto mt-6 max-w-sm rounded-2xl bg-sand px-4 py-3 text-sm text-muted">
                    {TB("bigGroup")}{" "}
                    {tel && <a href={tel} className="inline-flex items-center gap-1 font-semibold text-fire-ink"><Phone size={13} /> {phone}</a>}
                  </p>
                )}
              </StepAnim>
            )}

            {step === 2 && (
              <StepAnim key="s2" className={cardCls}>
                <StepTitle cnText="日期" title={T("rWhichDay")} />
                {mounted ? (
                  <div className="mx-auto max-w-md">
                    <div className="mb-4 flex items-center justify-between">
                      <button type="button" disabled={!canPrev} aria-label={P("prevMonth")} onClick={() => setCalMonth(new Date(year, month - 1, 1))} className="flex h-11 w-11 items-center justify-center rounded-full text-content ring-1 ring-line transition hover:bg-sand disabled:opacity-30"><ChevronLeft size={20} /></button>
                      <span className="font-display text-xl text-content" aria-live="polite">{monthLabel}</span>
                      <button type="button" aria-label={P("nextMonth")} onClick={() => setCalMonth(new Date(year, month + 1, 1))} className="flex h-11 w-11 items-center justify-center rounded-full text-content ring-1 ring-line transition hover:bg-sand"><ChevronRight size={20} /></button>
                    </div>
                    <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wider text-muted">{WEEK.map((w, i) => <span key={i} className={cn(i >= 5 && "text-fire/80")}>{w}</span>)}</div>
                    <div className="grid grid-cols-7 gap-y-1">
                      {cells.map((d, i) => {
                        if (d === null) return <span key={i} />;
                        const cellDate = new Date(year, month, d); const ds = ymd(cellDate);
                        const disabled = ds < todayStr || slotsForDay(hoursFor(hours, cellDate.getDay())).every((tm) => isPastSlot(ds, tm)); const selected = ds === date;
                        const isToday = ds === todayStr;
                        return (
                          <button
                            key={i}
                            type="button"
                            disabled={disabled}
                            aria-pressed={selected}
                            onClick={() => { setDate(ds); setStep(3); }}
                            className={cn(
                              "relative mx-auto flex size-10 items-center justify-center rounded-full text-[15px] tabular-nums transition sm:size-11",
                              selected ? "bg-fire font-semibold text-brand-cream shadow-lg shadow-fire/30" : disabled ? "cursor-not-allowed text-muted opacity-40" : "text-content hover:bg-fire/10 hover:text-fire",
                              isToday && !selected && "ring-1 ring-fire/50"
                            )}
                          >
                            {d}
                            {isToday && <span className={cn("absolute bottom-1.5 h-1 w-1 rounded-full", selected ? "bg-brand-cream" : "bg-fire")} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : <div className="h-80" aria-hidden />}
                <button type="button" onClick={() => setStep(1)} className={cn(backCls, "mt-6")}><ArrowLeft size={16} /> {T("rBack")}</button>
              </StepAnim>
            )}

            {step === 3 && (
              <StepAnim key="s3" className={cardCls}>
                <StepTitle cnText="时间" title={T("rWhichTime")} sub={dateText} />
                <div className="mx-auto max-w-md space-y-6">
                  {dayTimes.length > 0 && (
                    <div>
                      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted"><Sun size={14} className="text-saffron" /> {P("slotDay")}</p>
                      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">{dayTimes.map(slotBtn)}</div>
                    </div>
                  )}
                  {eveTimes.length > 0 && (
                    <div>
                      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted"><Moon size={14} className="text-fire-ink" /> {P("slotEvening")}</p>
                      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">{eveTimes.map(slotBtn)}</div>
                    </div>
                  )}
                </div>
                {error && <p className={cn(errorCls, "mt-5")}>{error}</p>}
                <div className="mt-8 flex items-center justify-between gap-3">
                  <button type="button" onClick={() => setStep(2)} disabled={loading} className={backCls}><ArrowLeft size={16} /> {T("rBack")}</button>
                  <button type="button" onClick={goToTables} disabled={!time || isPastSlot(date, time) || loading} className={cn(btnClass("fire", "md"), "disabled:pointer-events-none disabled:opacity-40")}>
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <>{T("rSelectTable")}</>}
                  </button>
                </div>
              </StepAnim>
            )}

            {step === 5 && selectedTable && (
              <StepAnim key="s5" className={cardCls}>
                <StepTitle cnText="信息" title={P("infoTitle")} center={false} />
                <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-sand p-4 text-sm text-content">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-fire font-semibold text-brand-cream">{selectedTable.number.length <= 4 ? selectedTable.number : <Armchair size={18} />}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{T("rTable")} {tableText}</p>
                    <p className="text-muted">{TB("guests", { count: party })} · {dateText} · {time}</p>
                    {selectedTable.minSpend ? <p className="text-fire-ink">{T("rMinSpend")}: {formatMoney(selectedTable.minSpend)}</p> : null}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block">
                    <span className={labelCls}>{T("rNamePh")}</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" enterKeyHint="next" placeholder={T("rNamePh")} className={fieldCls} />
                  </label>
                  <label className="block">
                    <span className={labelCls}>{T("cPhone")}</span>
                    <input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="next" placeholder={T("rPhonePh")} className={fieldCls} />
                  </label>
                  <label className="block">
                    <span className={labelCls}>{T("rNotePh")}</span>
                    <textarea value={request} onChange={(e) => setRequest(e.target.value)} rows={3} placeholder={P("notePlaceholder")} className={areaCls} />
                  </label>
                </div>
                {error && <p className={cn(errorCls, "mt-4")}>{error}</p>}
                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button type="button" onClick={() => { setError(null); setStep(4); }} className={backCls}><ArrowLeft size={16} /> {T("rBack")}</button>
                  <button type="button" onClick={submit} disabled={loading || !name || phoneInput.length < 7} className={cn(btnClass("fire", "lg", true), "w-full disabled:pointer-events-none disabled:opacity-40 sm:w-auto")}>
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} /> {T("rConfirm")}</>}
                  </button>
                </div>
              </StepAnim>
            )}
          </div>

          <aside className="sticky top-28 hidden lg:block">
            <StepAnim>{ticket}</StepAnim>
          </aside>
        </div>
      )}

      {step === 4 && booting && (
        <div className={cn(cardCls, "mx-auto flex max-w-md items-center justify-center gap-3 text-sm text-muted")}>
          <Loader2 size={18} className="animate-spin text-fire-ink" /> {TB("checking")}
        </div>
      )}

      {step === 4 && !booting && (
        <StepAnim key="s4">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <StepTitle cnText="选桌" title={T("rChooseTable")} center={false} />
            <div className="-mt-4 mb-8 flex flex-wrap gap-2 sm:mt-0">
              {rows.slice(0, 3).map((r) => (
                <button
                  key={r.n}
                  type="button"
                  disabled={busy}
                  onClick={() => { setError(null); setStep(r.n); }}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-card px-3.5 text-sm text-content ring-1 ring-line transition hover:ring-fire"
                >
                  <span className="text-fire-ink">{r.icon}</span> {r.value}
                </button>
              ))}
            </div>
          </div>
          {notice === "taken" && (
            <p className="mb-4 rounded-2xl border border-saffron/50 bg-saffron/15 px-4 py-3 text-sm text-content">{TB("tableTaken")}</p>
          )}
          {error && <p className={cn(errorCls, "mb-4")}>{error}</p>}
          <div className="relative -mx-5 overflow-hidden bg-night px-3 py-5 text-brand-cream sm:mx-0 sm:rounded-[2rem] sm:p-6 lg:p-8">
            <Blob className="absolute -right-24 -top-28 w-72 text-fire/25" variant="b" />
            <div className="relative">
              <FloorAvailabilityMap
                tone="dark"
                zones={zones}
                loading={loading}
                selectedTableId={selectedTable?.id ?? null}
                onSelectTable={(tb) => { setSelectedTable(tb); setNotice(null); }}
                phone={phone}
              />
            </div>
          </div>
          {/* Telefonda pastga yopishib turadi — ro'yxatdan stol tanlagach darhol davom etish mumkin */}
          <div className="sticky bottom-0 z-30 -mx-5 mt-6 flex items-center justify-between gap-3 border-t border-line bg-paper px-5 py-3 sm:static sm:mx-0 sm:border-0 sm:p-0">
            <button type="button" onClick={() => { setError(null); setStep(3); }} className={cn(backCls, "shrink-0")}><ArrowLeft size={16} /> <span className="hidden sm:inline">{T("rBack")}</span></button>
            <button type="button" onClick={() => setStep(5)} disabled={!selectedTable} className={cn(btnClass("fire", "md"), "min-w-0 flex-1 disabled:pointer-events-none disabled:opacity-40 sm:flex-none")}>
              <span className="truncate">{selectedTable ? `${T("rTable")} ${selectedTable.number} — ${T("rContinue")}` : T("rChooseTable")}</span>
              {selectedTable && <ArrowRight size={16} className="shrink-0" />}
            </button>
          </div>
        </StepAnim>
      )}
    </>,
    step === 4
  );
}

function PreorderMenu({
  locale, menu, onSkip, onConfirm, loading, error,
}: {
  locale: string; menu: { categories: MenuCat[]; items: MenuItm[] };
  onSkip: () => void; onConfirm: (cart: Record<string, number>) => void; loading: boolean; error: string | null;
}) {
  const T = useTranslations("Site");
  const P = useTranslations("Pages2");
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
  const zh = (v: unknown) => (v && typeof v === "object" ? String((v as Record<string, unknown>).zh ?? "") : "");

  const chip = (on: boolean) => cn(
    "inline-flex h-11 shrink-0 items-center rounded-full px-4 text-sm font-medium transition",
    on ? "bg-fire text-brand-cream shadow-md shadow-fire/25" : "bg-card text-content ring-1 ring-line hover:ring-fire"
  );

  return (
    <StepAnim className="mx-auto max-w-4xl pb-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span lang="zh" aria-hidden="true" className="font-cn text-2xl leading-none text-fire-ink">点菜</span>
          <h2 className="mt-1 font-display text-3xl leading-[1.1] text-content sm:text-4xl">{T("poTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{T("poSub")}</p>
        </div>
        <button type="button" onClick={onSkip} className="inline-flex h-11 items-center rounded-full px-4 text-sm font-medium text-muted transition hover:bg-sand hover:text-fire">{T("poSkip")}</button>
      </div>
      <label className="relative mb-4 block">
        <span className="sr-only">{T("poSearch")}</span>
        <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={T("poSearch")} className={cn(fieldCls, "rounded-full bg-card pl-11")} />
      </label>
      <div className="-mx-5 mb-6 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        <button type="button" onClick={() => setCat("all")} className={chip(cat === "all")}>{T("poAll")}</button>
        {menu.categories.map((c) => <button type="button" key={c.id} onClick={() => setCat(c.id)} className={chip(cat === c.id)}>{t(c.name, locale)}</button>)}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {shown.map((it) => {
          const qty = cart[it.id] || 0;
          return (
            <div key={it.id} className={cn("flex items-center gap-3 rounded-[1.5rem] bg-card p-3 ring-1 transition", qty ? "ring-fire/50" : "ring-line")}>
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-sand">
                <SafeImg src={it.imageUrl} alt="" className="h-16 w-16 object-cover" fallback={<DishFallback char={zh(it.name).charAt(0) || "菜"} />} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg leading-tight text-content">{t(it.name, locale)}</p>
                <p className="text-sm font-semibold tabular-nums text-fire-ink">{formatMoney(it.price)}</p>
              </div>
              {qty === 0 ? (
                <button type="button" onClick={() => add(it.id)} aria-label={`${P("add")}: ${t(it.name, locale)}`} className="flex h-11 w-11 items-center justify-center rounded-full bg-fire text-brand-cream transition hover:bg-fire-deep active:scale-95"><Plus size={18} /></button>
              ) : (
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => sub(it.id)} aria-label={P("less")} className="flex h-11 w-11 items-center justify-center rounded-full bg-sand text-content transition active:scale-95"><Minus size={16} /></button>
                  <span className="w-6 text-center font-semibold tabular-nums text-content" aria-live="polite">{qty}</span>
                  <button type="button" onClick={() => add(it.id)} aria-label={P("add")} className="flex h-11 w-11 items-center justify-center rounded-full bg-fire text-brand-cream transition hover:bg-fire-deep active:scale-95"><Plus size={16} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {shown.length === 0 && <p className="py-10 text-center text-muted">{T("menuNothing")}</p>}
      {error && <p className={cn(errorCls, "mt-4 text-center")}>{error}</p>}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-cream/10 bg-night text-brand-cream">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-3.5 sm:py-4">
          <div>
            <p className="text-xs text-brand-cream/65">{count} {T("poItems")}</p>
            <p className="font-display text-xl tabular-nums text-saffron">{formatMoney(total)}</p>
          </div>
          <button type="button" onClick={() => onConfirm(cart)} disabled={loading || count === 0} className={cn(btnClass("saffron", "md"), "disabled:pointer-events-none disabled:opacity-40")}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : T("poConfirm")}
          </button>
        </div>
      </div>
    </StepAnim>
  );
}
