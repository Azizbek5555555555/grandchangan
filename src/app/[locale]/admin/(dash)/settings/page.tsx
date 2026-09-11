import { prisma } from "@/lib/prisma";
import SettingsForm from "@/components/admin/SettingsForm";
export const dynamic = "force-dynamic";
export default async function AdminSettingsPage() {
  const [general, hours] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: "general" } }),
    prisma.workingHour.findMany({ orderBy: { dayOfWeek: "asc" } }),
  ]);
  return <SettingsForm general={(general?.value as never) || {}} hours={JSON.parse(JSON.stringify(hours))} />;
}
