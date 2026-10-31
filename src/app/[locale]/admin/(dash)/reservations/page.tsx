import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/utils";
import ReservationsTable from "@/components/admin/ReservationsTable";
import { requireSection, ADMIN_ROLES } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export default async function AdminReservationsPage() {
  const me = await requireSection("reservations");
  const locale = await getLocale();
  // Stolni band qilish oynasi uchun — faol zonalar va stollar
  const zones = await prisma.zone.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, tables: { where: { isActive: true }, orderBy: { number: "asc" }, select: { id: true, number: true, seats: true } } },
  });
  const rows = await prisma.reservation.findMany({
    orderBy: { startTime: "desc" },
    take: 200,
    include: {
      table: { select: { number: true } },
      preOrder: { include: { items: true } },
    },
  });
  const plain = rows.map((r) => ({
    id: r.id, code: r.code, guestName: r.guestName, guestPhone: r.guestPhone,
    partySize: r.partySize, date: r.date.toISOString(), startTime: r.startTime.toISOString(), endTime: r.endTime.toISOString(),
    source: r.source,
    status: r.status, tableNumber: r.table?.number ?? null, occasion: r.occasion,
    preOrder: r.preOrder ? {
      code: r.preOrder.code,
      status: r.preOrder.status,
      total: Number(r.preOrder.total),
      items: r.preOrder.items.map((it) => ({
        name: it.nameSnapshot, quantity: it.quantity, unitPrice: Number(it.unitPrice),
      })),
    } : null,
  }));
  return (
    <ReservationsTable
      reservations={plain}
      zones={zones.map((z) => ({ id: z.id, name: t(z.name, locale), tables: z.tables }))}
      canDelete={ADMIN_ROLES.includes(me.role)}
    />
  );
}
