import { unstable_rethrow } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { getInventoryDashboardStats } from "@/lib/inventory/queries";
import { formatMoney, currencyOf, cn } from "@/lib/utils";
import { restaurantDay, restaurantDateTime, addDays, weekdayShort } from "@/lib/time";
import {
  CalendarClock,
  ClipboardList,
  Users,
  Wallet,
  Star,
  Hourglass,
  Package,
  TrendingDown,
  ArrowRight,
  ExternalLink,
  CalendarX2,
} from "lucide-react";
import { requireSection } from "@/lib/auth/guard";
import PageHeader from "@/components/admin/ui/PageHeader";
import Pill, { STATUS_TONE } from "@/components/admin/ui/Pill";
import EmptyState from "@/components/admin/ui/EmptyState";
import { ui } from "@/components/admin/ui/styles";
import { fmtDate } from "@/components/admin/ui/format";

export const dynamic = "force-dynamic";

type IconT = React.ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;

function StatCard({ label, value, icon: Icon, hint, href }: { label: string; value: string; icon: IconT; hint?: string; href?: string }) {
  const card = (
    <div className={cn(ui.card, "h-full p-4 transition sm:p-5", href && "group-hover:border-brand-gold/50 group-hover:shadow-md")}>
      <div className="mb-3 flex items-start justify-between gap-2 sm:mb-4 sm:gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted sm:text-xs">{label}</span>
        <span className="hidden size-9 shrink-0 sm:inline-flex items-center justify-center rounded-xl bg-fire/10 text-fire-ink">
          <Icon size={18} aria-hidden />
        </span>
      </div>
      <p className="font-display text-2xl leading-none text-content lining-nums tabular-nums sm:text-3xl">{value}</p>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </div>
  );
  // href berilsa karta tegishli bo'limga havola bo'ladi
  return href ? (
    <Link href={href} className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60">
      {card}
    </Link>
  ) : (
    card
  );
}

/** "Diqqat talab" ro'yxatidagi qator */
function AttentionRow({ icon: Icon, label, value, href, warn }: { icon: IconT; label: string; value: string; href: string; warn?: boolean }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60"
      >
        <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-xl", warn ? "bg-brand-gold/15 text-brand-gold" : "bg-surface-2 text-muted")}>
          <Icon size={17} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-sm text-content">{label}</span>
        <span className="shrink-0 font-display text-lg lining-nums tabular-nums text-content sm:text-xl">{value}</span>
        <ArrowRight size={15} aria-hidden className="shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-fire-ink" />
      </Link>
    </li>
  );
}

/**
 * Inventar kartalari uchun statistika. Inventar jadvallari bazada hali bo'lmasa
 * (production'da prisma db push qilinmagan) xato otadi — shunda kartalar yashiriladi,
 * dashboard'ning qolgan qismi ishlashda davom etadi.
 */
async function safeInventoryStats(): Promise<{ lowCount: number; monthLoss: number } | null> {
  try {
    return await getInventoryDashboardStats();
  } catch (e) {
    unstable_rethrow(e);
    console.warn("[dashboard] inventar statistikasi yuklanmadi:", e instanceof Error ? e.message : e);
    return null;
  }
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  await requireSection("dashboard");
  const { locale } = await params;
  setRequestLocale(locale);
  const cur = currencyOf(locale);

  // "Bugun" — restoran vaqti (Toshkent) bo'yicha, server mintaqasiga bog'liq emas
  const todayStr = restaurantDay();
  const today = restaurantDateTime(todayStr, "00:00");
  const tomorrow = restaurantDateTime(addDays(todayStr, 1), "00:00");
  const weekStartStr = addDays(todayStr, -6);
  const weekAgo = restaurantDateTime(weekStartStr, "00:00");

  const [t, ta, ti, ts] = await Promise.all([
    getTranslations("AdminUi.dashboard"),
    getTranslations("Admin"),
    getTranslations("Inventory"),
    getTranslations("AdminUi.resStatus"),
  ]);
  const [reservationsToday, ordersToday, customers, paidAgg, pendingReviews, pendingReservations, weekOrders, recentReservations, inventory] = await Promise.all([
    // Admin yopgan stollar (source: ADMIN) — bron emas, hisobga kirmaydi
    prisma.reservation.count({ where: { startTime: { gte: today, lt: tomorrow }, source: { not: "ADMIN" } } }),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID", paidAt: { gte: today } } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.reservation.count({ where: { status: "PENDING" } }),
    prisma.order.findMany({ where: { createdAt: { gte: weekAgo } }, select: { total: true, createdAt: true } }),
    prisma.reservation.findMany({ where: { source: { not: "ADMIN" } }, orderBy: { createdAt: "desc" }, take: 6, include: { table: { select: { number: true } } } }),
    safeInventoryStats(),
  ]);

  // 7 kunlik daromad (buyurtmalar summasi bo'yicha)
  const byDay: Record<string, number> = {};
  for (let i = 0; i < 7; i++) byDay[addDays(weekStartStr, i)] = 0;
  weekOrders.forEach((o) => {
    const k = restaurantDay(o.createdAt);
    if (k in byDay) byDay[k] += Number(o.total);
  });
  const days = Object.entries(byDay);
  const maxVal = Math.max(1, ...days.map(([, v]) => v));
  const weekTotal = days.reduce((s, [, v]) => s + v, 0);
  // Hafta kuni nomi (dushanbadan: 0) va kun raqami
  const dayLabel = (ymd: string) => {
    const dow = new Date(`${ymd}T12:00:00Z`).getUTCDay();
    return { wd: weekdayShort((dow + 6) % 7, locale), d: Number(ymd.slice(8, 10)) };
  };

  return (
    <div className={ui.page}>
      <PageHeader
        section="dashboard"
        eyebrow={fmtDate(today, locale, { time: false, month: "long" })}
        title={ta("dashboard")}
        description={t("subtitle")}
        actions={
          <a href={locale === "uz" ? "/" : `/${locale}`} target="_blank" rel="noopener noreferrer" className={ui.btnSecondary}>
            <ExternalLink size={16} aria-hidden /> {t("openSite")}
          </a>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label={t("todayReservations")}
          value={String(reservationsToday)}
          icon={CalendarClock}
          hint={t("pendingHint", { count: pendingReservations })}
          href="/admin/reservations"
        />
        <StatCard label={t("todayOrders")} value={String(ordersToday)} icon={ClipboardList} href="/admin/orders" />
        <StatCard
          label={t("todayRevenue")}
          value={formatMoney(Number(paidAgg._sum.amount ?? 0), cur)}
          icon={Wallet}
          hint={t("paidHint")}
          href="/admin/payments"
        />
        <StatCard label={t("customers")} value={String(customers)} icon={Users} href="/admin/customers" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section aria-labelledby="dash-week" className={cn(ui.card, ui.cardPad, "lg:col-span-2")}>
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="dash-week" className={ui.cardTitle}>{t("weekTitle")}</h2>
            <p className="text-sm text-muted">
              {t("weekTotal")}: <span className="font-semibold text-content tabular-nums">{formatMoney(weekTotal, cur)}</span>
            </p>
          </div>
          <div className="relative">
            <div className="flex h-40 items-end gap-2 border-b border-line sm:h-52 sm:gap-3">
              {days.map(([day, val]) => {
                const isToday = day === todayStr;
                return (
                  <div key={day} className="flex h-full flex-1 flex-col items-center justify-end" title={`${fmtDate(`${day}T12:00:00+05:00`, locale, { time: false })}: ${formatMoney(val, cur)}`}>
                    <div
                      className={cn("w-full max-w-12 rounded-t-lg transition", isToday ? "bg-fire" : "bg-fire/35 hover:bg-fire/60")}
                      style={{ height: `${Math.max(val > 0 ? 4 : 1.5, (val / maxVal) * 100)}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex gap-2 sm:gap-3">
              {days.map(([day]) => {
                const { wd, d } = dayLabel(day);
                const isToday = day === todayStr;
                return (
                  <div key={day} className={cn("flex-1 text-center text-[11px] leading-tight", isToday ? "font-semibold text-fire-ink" : "text-muted")}>
                    <span className="block">{wd}</span>
                    <span className="block tabular-nums">{d}</span>
                  </div>
                );
              })}
            </div>
            {weekTotal === 0 && (
              <p className="absolute inset-x-0 top-12 text-center text-sm text-muted sm:top-16">{t("weekEmpty")}</p>
            )}
          </div>
        </section>

        <section aria-labelledby="dash-attn" className={cn(ui.card, "p-2 sm:p-3")}>
          <h2 id="dash-attn" className={cn(ui.cardTitle, "px-3 pb-2 pt-2")}>{t("attention")}</h2>
          <ul className="space-y-0.5">
            <AttentionRow icon={Hourglass} label={t("pendingReservations")} value={String(pendingReservations)} href="/admin/reservations" warn={pendingReservations > 0} />
            <AttentionRow icon={Star} label={t("pendingReviews")} value={String(pendingReviews)} href="/admin/reviews" warn={pendingReviews > 0} />
            {inventory && (
              <>
                <AttentionRow icon={Package} label={ti("dashLow")} value={String(inventory.lowCount)} href="/admin/inventory?tab=stock" warn={inventory.lowCount > 0} />
                <AttentionRow icon={TrendingDown} label={ti("dashMonthLoss")} value={formatMoney(inventory.monthLoss, cur)} href="/admin/inventory?tab=history" />
              </>
            )}
          </ul>
        </section>
      </div>

      <section aria-labelledby="dash-recent" className={cn(ui.card, "mt-6 overflow-hidden")}>
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
          <h2 id="dash-recent" className={ui.cardTitle}>{t("recent")}</h2>
          <Link href="/admin/reservations" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-fire-ink hover:underline sm:min-h-0">
            {t("viewAll")} <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
        {recentReservations.length === 0 ? (
          <EmptyState icon={CalendarX2} title={t("empty")} />
        ) : (
          <ul className="divide-y divide-line">
            {recentReservations.map((r) => (
              <li key={r.id} className="flex items-center gap-4 px-4 py-3 text-sm sm:px-5">
                <span className="hidden w-28 shrink-0 font-mono text-xs text-muted sm:block">{r.code}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-content">{r.guestName}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {r.table?.number ? t("table", { n: r.table.number }) : t("noTable")} · {t("guests", { count: r.partySize })} · {fmtDate(r.startTime, locale)}
                    <span className="font-mono sm:hidden"> · {r.code}</span>
                  </p>
                </div>
                <Pill tone={STATUS_TONE[r.status]}>{ts(r.status)}</Pill>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
