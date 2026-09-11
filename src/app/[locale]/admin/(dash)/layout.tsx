import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { requireRole, ADMIN_ROLES } from "@/lib/auth/guard";
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

  const user = await requireRole(ADMIN_ROLES);
  if (!user) {
    redirect(`/${locale}/admin/login`);
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 text-brand-ink">
      <AdminSidebar userName={user.name || user.email || "Admin"} />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
