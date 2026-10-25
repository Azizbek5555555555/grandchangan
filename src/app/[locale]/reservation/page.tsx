import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import ReservationFlow, { type ReservationInitial } from "@/components/site/ReservationFlow";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import ReserveHero from "@/components/site/heroes/ReserveHero";
import { dayOfWeekOf, hoursSummary } from "@/lib/hours";
import { restaurantDay } from "@/lib/time";
import { phoneOf } from "@/lib/contact";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Bosh sahifadagi xaritadan kelgan parametrlar: ?date=YYYY-MM-DD&time=HH:MM&guests=N&table=<id>.
 * Har biri alohida tekshiriladi — noto'g'risi shunchaki e'tiborsiz qoldiriladi.
 */
function parseInitial(sp: SearchParams): ReservationInitial | undefined {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
  const out: ReservationInitial = {};

  const date = one(sp.date);
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    // Haqiqiy kalendar sanasi (2026-02-31 emas)
    const d = new Date(`${date}T00:00:00Z`);
    if (!Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date) out.date = date;
  }
  const time = one(sp.time);
  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) out.time = time;
  const guests = one(sp.guests);
  if (/^\d{1,2}$/.test(guests)) {
    const n = Number(guests);
    if (n >= 1 && n <= 50) out.guests = n;
  }
  const table = one(sp.table);
  if (/^[A-Za-z0-9_-]{1,40}$/.test(table)) out.tableId = table;

  return Object.keys(out).length ? out : undefined;
}

export default async function ReservationPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<SearchParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const st = await getTranslations({ locale, namespace: "Site" });
  const tc = await getTranslations({ locale, namespace: "Common" });
  const [p2, h2] = await Promise.all([
    getTranslations({ locale, namespace: "Pages2" }),
    getTranslations({ locale, namespace: "Home2" }),
  ]);
  const initial = parseInitial(await searchParams);

  const [categories, items, hours, generalSetting] = await Promise.all([
    prisma.menuCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.menuItem.findMany({ where: { isAvailable: true }, orderBy: { sortOrder: "asc" }, select: { id: true, categoryId: true, name: true, price: true, discountPrice: true, imageUrl: true } }),
    prisma.workingHour.findMany({ select: { dayOfWeek: true, openTime: true, closeTime: true, isClosed: true } }),
    prisma.siteSetting.findUnique({ where: { key: "general" } }),
  ]);
  // Telefon — Header bilan bir xil manba (Xona 1/2 va onlayn bron qilib bo'lmaydigan stollar uchun)
  const general = (generalSetting?.value as Record<string, unknown>) || {};
  const phone = phoneOf(general);

  const hs = hoursSummary(hours, dayOfWeekOf(restaurantDay()));
  const hoursText = `${hs.every ? st("fOpen") : h2("today")} · ${hs.value ?? st("closed")}`;

  const menu = {
    categories: JSON.parse(JSON.stringify(categories)),
    items: items.map((i) => ({
      id: i.id, categoryId: i.categoryId, name: i.name,
      price: Number(i.discountPrice ?? i.price), imageUrl: i.imageUrl,
    })),
  };

  return (
    <>
      <SiteHeader />
      <ReserveHero
        title={tc("reservation")}
        sub={st("reserveSub")}
        ticketLabel={p2("heroTicket")}
        steps={[`${st("rDate")} · ${st("rTime")}`, st("rTable"), p2("infoTitle")]}
        hours={hoursText}
        phone={phone}
      />
      <main id="main" className="bg-paper">
        <ReservationFlow key={JSON.stringify(initial ?? {})} locale={locale} menu={menu} hours={hours} phone={phone} initial={initial} />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
