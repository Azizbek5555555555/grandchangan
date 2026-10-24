import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth/guard";
import { formatRestaurant } from "@/lib/time";
import { logoutAction } from "@/lib/auth/actions";
import { Badge } from "@/components/ui/primitives";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";

export const dynamic = "force-dynamic";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await currentUser();
  if (!user) redirect(`/${locale}/account/login`);
  const ta = await getTranslations({ locale, namespace: "Account" });
  const tc = await getTranslations({ locale, namespace: "Common" });
  const st = await getTranslations({ locale, namespace: "Site" });

  const reservations = await prisma.reservation.findMany({
    where: { OR: [{ userId: user.id }, { guestPhone: user.phone ?? "___" }] },
    orderBy: { startTime: "desc" }, take: 20,
    include: { table: { select: { number: true } } },
  });

  return (
    <>
      <SiteHeader />
      <main className="relative isolate min-h-[70vh] overflow-hidden bg-paper">
      <span aria-hidden="true" lang="zh" className="font-cn pointer-events-none absolute -right-6 top-24 -z-10 select-none text-[12rem] leading-none text-fire/[0.06]">贵宾</span>
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl text-content">{user.name || ta("guest")}</h1>
            <p className="text-sm text-muted">{user.phone}</p>
          </div>
          <form action={logoutAction}>
            <button className="min-h-11 rounded-full border border-line px-5 text-sm font-semibold text-content transition hover:border-fire hover:text-fire">{tc("logout")}</button>
          </form>
        </div>

        <h2 className="mb-4 flex items-center gap-3 font-display text-2xl text-content"><span lang="zh" aria-hidden="true" className="font-cn text-fire">订座</span>{ta("myBookings")}</h2>
        <div className="space-y-2">
          {reservations.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card p-5 shadow-sm">
              <div>
                <p className="font-mono text-xs text-muted">{r.code}</p>
                <p className="text-sm">{formatRestaurant(r.startTime)} · {ta("guests", { count: r.partySize })} · {st("rTable")} {r.table?.number ?? "—"}</p>
              </div>
              <Badge color={r.status === "CONFIRMED" ? "green" : r.status === "CANCELLED" ? "red" : "gold"}>{ta(`st_${r.status}`)}</Badge>
            </div>
          ))}
          {reservations.length === 0 && <p className="text-muted">{ta("noBookings")}</p>}
        </div>
      </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
