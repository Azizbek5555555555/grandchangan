import { prisma } from "@/lib/prisma";
import SettingsForm from "@/components/admin/SettingsForm";
import { requireSection } from "@/lib/auth/guard";
export const dynamic = "force-dynamic";
export default async function AdminSettingsPage() {
  await requireSection("settings");
  const [general, hours] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: "general" } }),
    prisma.workingHour.findMany({ orderBy: { dayOfWeek: "asc" } }),
  ]);
  return <SettingsForm general={(general?.value as never) || {}} hours={JSON.parse(JSON.stringify(hours))} />;
}
