"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Minus, Phone, Plus, RotateCw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getAvailability } from "@/lib/reservation/actions";
import { RESTAURANT_TZ, addDays, formatDayMonth, restaurantDay } from "@/lib/time";
import { dayOfWeekOf, hoursFor, slotsForDay, type DayHours } from "@/lib/hours";
import { cn } from "@/lib/utils";
import Reveal from "@/components/motion/Reveal";
import TextReveal from "@/components/motion/TextReveal";
import FloorAvailabilityMap, { type AvailZone } from "./FloorAvailabilityMap";

/**
 * Bosh sahifa: "Restoran xaritasi" bo'limi. Mijoz sana, vaqt va kishi sonini tanlaydi —
 * xaritada bo'sh/band stollar ko'rinadi, stolni tanlab bron sahifasiga o'tadi
 * (/reservation?date&time&guests&table → darhol ma'lumot formasi).
 */

const MAX_GUESTS = 20;
const MAX_DAYS = 60;

type Clock = { today: string; nowHM: string };

/** Restoran vaqti bo'yicha hozirgi sana va soat (HH:MM) */
function restaurantClock(): Clock {
  const nowHM = new Intl.DateTimeFormat("en-GB", {
    timeZone: RESTAURANT_TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date());
  return { today: restaurantDay(), nowHM };
}

/** Kunning hali o'tib ketmagan bron soatlari (ish vaqti bo'yicha) */
function openSlots(hours: DayHours[], date: string, clock: Clock): string[] {
  if (!date || date < clock.today) return [];
  const all = slotsForDay(hoursFor(hours, dayOfWeekOf(date)));
  return date === clock.today ? all.filter((tm) => tm > clock.nowHM) : all;
}

/** Eng yaqin bo'sh vaqt: bugun (qolgan bo'lsa), aks holda keyingi ochiq kun */
function firstOpen(hours: DayHours[], clock: Clock): { date: string; time: string } {
  for (let i = 0; i <= MAX_DAYS; i++) {
    const date = addDays(clock.today, i);
    const slots = openSlots(hours, date, clock);
    if (slots.length) return { date, time: slots[0] };
  }
  return { date: clock.today, time: "" };
}

export default function HomeFloorSection({
  hours, phone, today, nowHM,
}: {
  hours: DayHours[];
  phone: string;
  /** Server hisoblagan restoran sanasi/soati — SSR va hydration bir xil bo'lishi uchun */
  today: string;
  nowHM: string;
}) {
  const tb = useTranslations("Booking");
  const ts = useTranslations("Site");
  const locale = useLocale();

  const [clock, setClock] = useState<Clock>({ today, nowHM });
  const [when, setWhen] = useState(() => firstOpen(hours, { today, nowHM }));
  const { date, time } = when;
  const [guests, setGuests] = useState(2);
  const [zones, setZones] = useState<AvailZone[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const reqRef = useRef(0);
  const sectionRef = useRef<HTMLElement>(null);
  // Bo'lim ekranga yaqinlashgandagina so'rov yuboriladi (bosh sahifani ochgan har kishi uchun emas)
  const [near, setNear] = useState(false);

  const tomorrow = addDays(clock.today, 1);
  const maxDate = addDays(clock.today, MAX_DAYS);
  const daySlots = useMemo(() => (date ? slotsForDay(hoursFor(hours, dayOfWeekOf(date))) : []), [hours, date]);
  const times = useMemo(() => openSlots(hours, date, clock), [hours, date, clock]);
  const closed = !!date && daySlots.length === 0;
  const noneLeft = !closed && times.length === 0;
  const canQuery = !!time && times.includes(time);

  // Soat har daqiqada yangilanadi — o'tib ketgan vaqtlar ro'yxatdan chiqadi
  useEffect(() => {
    setClock(restaurantClock());
    const id = setInterval(() => setClock(restaurantClock()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Tanlangan vaqt o'tib ketgan bo'lsa — shu kunning keyingi vaqtiga (yoki keyingi ochiq kunga)
  useEffect(() => {
    setWhen((w) => {
      if (!w.time) return w;
      const slots = openSlots(hours, w.date, clock);
      if (slots.includes(w.time)) return w;
      return slots.length ? { date: w.date, time: slots[0] } : firstOpen(hours, clock);
    });
  }, [clock, hours]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setNear(true);
        io.disconnect();
      }
    }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Bo'lim balandligi o'zgarsa (xabarlar, "Boshqa stollar", telefonda karta) — pastdagi Fold3D va
  // Reveal triggerlarining joyi eskiradi. ScrollTrigger'ni kechiktirib qayta hisoblaymiz.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let timer = 0;
    let lastH = el.offsetHeight;
    const ro = new ResizeObserver(() => {
      const h = el.offsetHeight;
      if (Math.abs(h - lastH) < 2) return;
      lastH = h;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => ScrollTrigger.refresh(), 250);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  // Bo'sh stollarni avtomatik yuklash: 300 ms kutib, eskirgan javoblar e'tiborsiz qoldiriladi
  useEffect(() => {
    if (!near) return;
    const id = ++reqRef.current;
    if (!canQuery) {
      setZones(null);
      setSelectedId(null);
      setLoading(false);
      setFailed(false);
      return;
    }
    setLoading(true);
    setFailed(false);
    const timer = setTimeout(() => {
      getAvailability(date, time, guests)
        .then((res) => {
          if (id !== reqRef.current) return;
          setZones(res.zones);
          // Tanlangan stol endi bo'sh bo'lmasa — tanlov bekor qilinadi
          setSelectedId((cur) =>
            cur && res.zones.some((z) => z.tables.some((t) => t.id === cur && t.state === "free")) ? cur : null
          );
        })
        .catch(() => {
          if (id !== reqRef.current) return;
          setZones(null);
          setFailed(true);
        })
        .finally(() => {
          if (id === reqRef.current) setLoading(false);
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [near, date, time, guests, canQuery, retry]);

  function changeDate(d: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d < clock.today || d > maxDate) return;
    const slots = openSlots(hours, d, clock);
    setWhen((w) => ({ date: d, time: slots.includes(w.time) ? w.time : slots[0] ?? "" }));
  }

  // Kartadagi qisqa yozuv: "21 oktyabr · 19:00 · 4 kishi" (faqat stol tanlanganda — klientda)
  const dateLabel = useMemo(() => {
    return date ? formatDayMonth(date, locale) : "";
  }, [date, locale]);

  const tel = `tel:${phone.replace(/[^\d+]/g, "")}`;
  const label = "mb-2 block text-[11px] uppercase tracking-[0.25em] text-brand-cream/50";
  const field = "h-11 rounded-xl border border-brand-cream/20 bg-brand-ink px-3 text-sm text-brand-cream [color-scheme:dark] outline-none transition focus:border-brand-gold disabled:opacity-40";
  const chip = (active: boolean) => cn(
    "h-11 shrink-0 rounded-full border px-4 text-sm transition",
    active ? "border-brand-gold bg-brand-gold font-medium text-brand-ink" : "border-brand-cream/20 text-brand-cream/80 hover:border-brand-gold/60 hover:text-brand-cream"
  );

  return (
    <section
      ref={sectionRef}
      id="floor-map"
      className="relative -mt-12 overflow-hidden rounded-t-[2.75rem] bg-brand-ink py-24 text-brand-cream shadow-[0_-50px_90px_-30px_var(--color-brand-ink)] lg:py-32"
    >
      {/* Fon: yumshoq oltin nur va xira ieroglif */}
      <span className="pointer-events-none absolute left-1/2 top-0 h-72 w-[42rem] max-w-full -translate-x-1/2 rounded-full bg-brand-gold/10 blur-3xl" />
      <span className="pointer-events-none absolute -right-6 top-10 select-none font-display text-[10rem] leading-none text-brand-cream/[0.03] sm:text-[14rem]">席位</span>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal y={14}><p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-gold">{tb("eyebrow")}</p></Reveal>
          <div className="flex flex-wrap items-baseline justify-center gap-x-4">
            <TextReveal text={tb("title1")} className="font-display text-4xl text-brand-cream sm:text-6xl" />
            <TextReveal text={tb("title2")} className="font-display text-4xl accent-gold sm:text-6xl" delay={0.1} />
          </div>
          <Reveal y={16} delay={0.15}><p className="mx-auto mt-5 max-w-xl text-brand-cream/60">{tb("subtitle")}</p></Reveal>
        </div>

        <Reveal y={30} delay={0.1} className="mt-12">
          {/* Boshqaruv: sana, vaqt, kishi soni */}
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-brand-cream/10 bg-brand-ink-soft/70 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div className="col-span-2 min-w-0 lg:col-span-1">
              <span className={label}>{ts("rDate")}</span>
              <div role="group" aria-label={ts("rDate")} className="flex flex-wrap gap-2">
                <button type="button" onClick={() => changeDate(clock.today)} aria-pressed={date === clock.today} className={chip(date === clock.today)}>
                  {tb("today")}
                </button>
                <button type="button" onClick={() => changeDate(tomorrow)} aria-pressed={date === tomorrow} className={chip(date === tomorrow)}>
                  {tb("tomorrow")}
                </button>
                <input
                  type="date"
                  value={date}
                  min={clock.today}
                  max={maxDate}
                  aria-label={tb("pickDate")}
                  onChange={(e) => changeDate(e.target.value)}
                  className={cn(field, "min-w-[9.5rem] flex-1")}
                />
              </div>
            </div>

            <label className="min-w-0">
              <span className={label}>{ts("rTime")}</span>
              <select
                value={canQuery ? time : ""}
                disabled={times.length === 0}
                onChange={(e) => setWhen((w) => ({ ...w, time: e.target.value }))}
                className={cn(field, "w-full")}
              >
                {times.length === 0 && <option value="">{tb("noTime")}</option>}
                {times.map((tm) => <option key={tm} value={tm}>{tm}</option>)}
              </select>
            </label>

            <div className="min-w-0">
              <span className={label}>{ts("rGuests")}</span>
              <div role="group" aria-label={ts("rGuests")} className="flex h-11 items-center justify-between rounded-xl border border-brand-cream/20 bg-brand-ink">
                <button
                  type="button"
                  aria-label={tb("guestsLess")}
                  disabled={guests <= 1}
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-l-xl text-brand-cream transition hover:bg-brand-cream/10 disabled:opacity-30"
                >
                  <Minus size={16} />
                </button>
                <span className="min-w-0 truncate px-1 text-sm font-medium tabular-nums" aria-live="polite">
                  {tb("guests", { count: guests })}
                </span>
                <button
                  type="button"
                  aria-label={tb("guestsMore")}
                  disabled={guests >= MAX_GUESTS}
                  onClick={() => setGuests((g) => Math.min(MAX_GUESTS, g + 1))}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-r-xl text-brand-cream transition hover:bg-brand-cream/10 disabled:opacity-30"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Holat xabarlari */}
          <div aria-live="polite" className="space-y-2 empty:hidden [&:not(:empty)]:mt-4">
            {closed && <Note>{tb("closedDay")}</Note>}
            {noneLeft && <Note>{tb("noSlotsToday")}</Note>}
            {failed && (
              <Note>
                {tb("loadError")}{" "}
                <button type="button" onClick={() => setRetry((n) => n + 1)} className="inline-flex items-center gap-1 font-medium text-brand-gold-light hover:text-brand-gold">
                  <RotateCw size={13} /> {tb("retry")}
                </button>
              </Note>
            )}
            {guests >= MAX_GUESTS && (
              <Note>
                {tb("bigGroup")}{" "}
                <a href={tel} className="inline-flex items-center gap-1 font-medium text-brand-gold-light hover:text-brand-gold">
                  <Phone size={13} /> {phone}
                </a>
              </Note>
            )}
          </div>

          <FloorAvailabilityMap
            className="mt-6"
            tone="dark"
            zones={zones}
            loading={loading}
            selectedTableId={selectedId}
            onSelectTable={(t) => setSelectedId(t.id)}
            phone={phone}
            action={(t) => loading ? null : (
              <>
                <p className="mb-3 text-xs text-brand-cream/60">
                  {dateLabel} · {time} · {tb("guests", { count: guests })}
                </p>
                <Link
                  href={{ pathname: "/reservation", query: { date, time, guests: String(guests), table: t.id } }}
                  className="btn-gold-sheen group inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-red px-6 py-3.5 text-sm font-medium text-brand-cream transition hover:bg-brand-red-dark"
                >
                  {tb("bookThis")} <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </Link>
              </>
            )}
          />
        </Reveal>
      </div>
    </section>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-brand-gold/25 bg-brand-gold/10 px-4 py-2.5 text-sm text-brand-cream/85">{children}</p>
  );
}
