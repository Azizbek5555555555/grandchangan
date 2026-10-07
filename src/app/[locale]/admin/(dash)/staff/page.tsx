import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth/guard";
import { ROLE_RANK } from "@/lib/auth/permissions";
import StaffManager from "@/components/admin/StaffManager";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const me = await requireSection("staff");
  const rows = await prisma.user.findMany({
    where: { role: { not: "CUSTOMER" } },
    select: { id: true, name: true, email: true, phone: true, role: true, isBlocked: true },
  });
  rows.sort((a, b) => ROLE_RANK[b.role] - ROLE_RANK[a.role] || (a.name || "").localeCompare(b.name || ""));
  return <StaffManager staff={rows} myId={me.id} myRole={me.role} />;
}
