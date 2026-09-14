import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth/guard";
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

  const reservations = await prisma.reservation.findMany({
    where: { OR: [{ userId: user.id }, { guestPhone: user.phone ?? "___" }] },
    orderBy: { startTime: "desc" }, take: 20,
    include: { table: { select: { number: true } } },
  });

  return (
    <>
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-5 pb-16 pt-32">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-content">{user.name || "Mehmon"}</h1>
            <p className="text-sm text-muted">{user.phone}</p>
          </div>
          <form action={logoutAction}>
            <button className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-surface-2">Chiqish</button>
          </form>
        </div>

        <h2 className="mb-3 font-semibold text-content">Bronlarim</h2>
        <div className="space-y-2">
          {reservations.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-line bg-card p-4">
              <div>
                <p className="font-mono text-xs text-muted">{r.code}</p>
                <p className="text-sm">{new Date(r.startTime).toLocaleString("uz-UZ", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })} · {r.partySize} kishi · Stol {r.table?.number ?? "—"}</p>
              </div>
              <Badge color={r.status === "CONFIRMED" ? "green" : r.status === "CANCELLED" ? "red" : "gold"}>{r.status}</Badge>
            </div>
          ))}
          {reservations.length === 0 && <p className="text-muted">Hozircha bron yo'q.</p>}
        </div>
      </div>
      <SiteFooter locale={locale} />
    </>
  );
}
