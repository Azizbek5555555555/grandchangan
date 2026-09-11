import { prisma } from "@/lib/prisma";
import CustomersTable from "@/components/admin/CustomersTable";
export const dynamic = "force-dynamic";
export default async function AdminCustomersPage() {
  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "desc" }, take: 300,
    include: { _count: { select: { orders: true, reservations: true } } },
  });
  const plain = rows.map((u) => ({
    id: u.id, name: u.name, phone: u.phone, role: u.role, isBlocked: u.isBlocked,
    ordersCount: u._count.orders, reservationsCount: u._count.reservations, createdAt: u.createdAt.toISOString(),
  }));
  return <CustomersTable customers={plain} />;
}
