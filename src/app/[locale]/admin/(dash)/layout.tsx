import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { requireRole, STAFF_ROLES } from "@/lib/auth/guard";
import AdminSidebar from "@/components/admin/Sidebar";

export default async function AdminDashLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireRole(STAFF_ROLES);
  if (!user) {
    redirect(`/${locale}/admin/login`);
  }

  return (
    <div className="flex min-h-screen bg-surface-2 text-content">
      <AdminSidebar userName={user.name || user.email || "Admin"} role={user.role} />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
