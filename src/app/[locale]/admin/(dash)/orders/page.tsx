import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import OrdersKanban from "@/components/admin/OrdersKanban";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [orders, menuItems, tables] = await Promise.all([
    prisma.order.findMany({
      where: { status: { notIn: ["CANCELLED"] } },
      orderBy: { createdAt: "desc" }, take: 200,
      include: { items: true, table: { select: { number: true } } },
    }),
    prisma.menuItem.findMany({ where: { isAvailable: true }, orderBy: { sortOrder: "asc" } }),
    prisma.table.findMany({ where: { isActive: true }, orderBy: { number: "asc" } }),
  ]);

  const plainOrders = orders.map((o) => ({
    id: o.id, code: o.code, status: o.status, type: o.type, total: Number(o.total),
    tableNumber: o.table?.number ?? null, guestName: o.guestName,
    items: o.items.map((it) => ({ nameSnapshot: it.nameSnapshot, quantity: it.quantity })),
    createdAt: o.createdAt.toISOString(),
  }));
  const plainMenu = menuItems.map((m) => ({ id: m.id, name: m.name, price: Number(m.discountPrice ?? m.price) }));
  const plainTables = tables.map((t2) => ({ id: t2.id, number: t2.number }));

  return <OrdersKanban orders={plainOrders} menuItems={plainMenu} tables={plainTables} locale={locale} />;
}
