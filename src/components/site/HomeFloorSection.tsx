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
import SectionHead from "@/components/site/kit/SectionHead";
import { btnClass } from "@/components/site/kit/ButtonLink";
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

  // Bo'lim balandligi o'zgarsa (xabarlar, "Boshqa stollar", telefonda karta) — pastdagi
  // Reveal/Parallax triggerlarining joyi eskiradi. ScrollTrigger'ni kechiktirib qayta hisoblaymiz.
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
  const label = "mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-muted";
  const field = "h-11 rounded-xl border border-line bg-paper px-3 text-sm text-content outline-none transition focus:border-fire focus:ring-4 focus:ring-fire/10 disabled:opacity-40 [.dark_&]:[color-scheme:dark]";
  const chip = (active: boolean) => cn(
    "h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition",
    active ? "border-fire bg-fire text-brand-cream shadow-md shadow-fire/20" : "border-line bg-paper text-content hover:border-fire hover:text-fire"
  );

  return (
    <section
      ref={sectionRef}
      id="floor-map"
      className="relative overflow-hidden bg-paper pb-16 pt-14 sm:pb-20 sm:pt-16 lg:pb-24"
    >
      {/* Fon: xira ieroglif */}
      <span aria-hidden="true" lang="zh" className="font-cn pointer-events-none absolute -right-4 top-6 select-none text-[9rem] leading-none text-fire/[0.07] sm:text-[13rem]">席位</span>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead cn="平面图" eyebrow={tb("eyebrow")} title={tb("title1")} accent={tb("title2")} sub={tb("subtitle")} />

        <Reveal y={40} delay={0.1} className="mt-10 sm:mt-12">
          {/* Boshqaruv: sana, vaqt, kishi soni */}
          <div className="grid grid-cols-2 gap-4 rounded-[24px] border border-line bg-card p-4 shadow-lg shadow-content/5 sm:p-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
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
              <div role="group" aria-label={ts("rGuests")} className="flex h-11 items-center justify-between rounded-xl border border-line bg-paper">
                <button
                  type="button"
                  aria-label={tb("guestsLess")}
                  disabled={guests <= 1}
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-l-xl text-content transition hover:bg-fire/10 hover:text-fire disabled:opacity-30"
                >
                  <Minus size={16} />
                </button>
                <span className="min-w-0 truncate px-1 text-sm font-semibold tabular-nums text-content" aria-live="polite">
                  {tb("guests", { count: guests })}
                </span>
                <button
                  type="button"
                  aria-label={tb("guestsMore")}
                  disabled={guests >= MAX_GUESTS}
                  onClick={() => setGuests((g) => Math.min(MAX_GUESTS, g + 1))}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-r-xl text-content transition hover:bg-fire/10 hover:text-fire disabled:opacity-30"
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
                <button type="button" onClick={() => setRetry((n) => n + 1)} className="inline-flex min-h-11 items-center gap-1 font-semibold text-fire-ink hover:text-fire-deep">
                  <RotateCw size={13} /> {tb("retry")}
                </button>
              </Note>
            )}
            {guests >= MAX_GUESTS && (
              <Note>
                {tb("bigGroup")}{" "}
                <a href={tel} className="inline-flex items-center gap-1 font-semibold text-fire-ink hover:text-fire-deep">
                  <Phone size={13} /> {phone}
                </a>
              </Note>
            )}
          </div>

          <FloorAvailabilityMap
            className="mt-6"
            tone="theme"
            zones={zones}
            loading={loading}
            selectedTableId={selectedId}
            onSelectTable={(t) => setSelectedId(t.id)}
            phone={phone}
            action={(t) => loading ? null : (
              <>
                <p className="mb-3 text-xs text-muted">
                  {dateLabel} · {time} · {tb("guests", { count: guests })}
                </p>
                <Link
                  href={{ pathname: "/reservation", query: { date, time, guests: String(guests), table: t.id } }}
                  className={cn(btnClass("fire", "md"), "group w-full")}
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
    <p className="rounded-xl border border-saffron/40 bg-saffron/10 px-4 py-2.5 text-sm text-content">{children}</p>
  );
}
