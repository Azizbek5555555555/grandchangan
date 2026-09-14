import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { CalendarClock, ClipboardList, Users, Wallet, Star, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

function StatCard({ label, value, icon: Icon, hint }: { label: string; value: string; icon: React.ComponentType<{ size?: number; className?: string }>; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <Icon size={20} className="text-brand-red" />
      </div>
      <p className="text-2xl font-bold text-content">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 6);

  const [reservationsToday, ordersToday, customers, paidAgg, pendingReviews, pendingReservations, weekOrders, recentReservations] = await Promise.all([
    prisma.reservation.count({ where: { date: { gte: today } } }),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID", paidAt: { gte: today } } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.reservation.count({ where: { status: "PENDING" } }),
    prisma.order.findMany({ where: { createdAt: { gte: weekAgo } }, select: { total: true, createdAt: true } }),
    prisma.reservation.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { table: { select: { number: true } } } }),
  ]);

  // 7 kunlik daromad (buyurtmalar summasi bo'yicha)
  const byDay: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekAgo); d.setDate(d.getDate() + i);
    byDay[d.toISOString().slice(0, 10)] = 0;
  }
  weekOrders.forEach((o) => {
    const k = o.createdAt.toISOString().slice(0, 10);
    if (k in byDay) byDay[k] += Number(o.total);
  });
  const days = Object.entries(byDay);
  const maxVal = Math.max(1, ...days.map(([, v]) => v));

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Boshqaruv paneli</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Bugungi bronlar" value={String(reservationsToday)} icon={CalendarClock} hint={`${pendingReservations} kutilmoqda`} />
        <StatCard label="Bugungi buyurtmalar" value={String(ordersToday)} icon={ClipboardList} />
        <StatCard label="Mijozlar" value={String(customers)} icon={Users} />
        <StatCard label="Bugungi daromad" value={formatMoney(Number(paidAgg._sum.amount ?? 0))} icon={Wallet} hint="To'langan to'lovlar" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-card p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Oxirgi 7 kun — buyurtmalar summasi</h2>
          <div className="flex h-48 items-end gap-2">
            {days.map(([day, val]) => (
              <div key={day} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t bg-brand-red" style={{ height: `${(val / maxVal) * 100}%` }} title={formatMoney(val)} />
                </div>
                <span className="text-[10px] text-muted">{day.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-card p-5">
            <div className="flex items-center gap-2 text-muted"><Star size={16} className="text-brand-gold" /> Kutilayotgan sharhlar</div>
            <p className="mt-2 text-2xl font-bold">{pendingReviews}</p>
          </div>
          <div className="rounded-2xl border border-line bg-card p-5">
            <div className="flex items-center gap-2 text-muted"><MessageSquare size={16} className="text-blue-500" /> Tasdiq kutayotgan bronlar</div>
            <p className="mt-2 text-2xl font-bold">{pendingReservations}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-card p-5">
        <h2 className="mb-4 font-semibold">So'nggi bronlar</h2>
        <div className="space-y-2">
          {recentReservations.map((r) => (
            <div key={r.id} className="flex items-center justify-between border-b border-line pb-2 text-sm last:border-0">
              <span className="font-mono text-xs text-muted">{r.code}</span>
              <span>{r.guestName}</span>
              <span className="text-muted">Stol {r.table?.number ?? "—"}</span>
              <span className="text-xs text-muted">{new Date(r.startTime).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          ))}
          {recentReservations.length === 0 && <p className="text-muted">Hozircha bron yo'q.</p>}
        </div>
      </div>
    </div>
  );
}
