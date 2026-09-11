import { prisma } from "@/lib/prisma";
import ReservationsTable from "@/components/admin/ReservationsTable";

export const dynamic = "force-dynamic";

export default async function AdminReservationsPage() {
  const rows = await prisma.reservation.findMany({
    orderBy: { startTime: "desc" },
    take: 200,
    include: { table: { select: { number: true } } },
  });
  const plain = rows.map((r) => ({
    id: r.id, code: r.code, guestName: r.guestName, guestPhone: r.guestPhone,
    partySize: r.partySize, date: r.date.toISOString(), startTime: r.startTime.toISOString(),
    status: r.status, tableNumber: r.table?.number ?? null, occasion: r.occasion,
  }));
  return <ReservationsTable reservations={plain} />;
}
