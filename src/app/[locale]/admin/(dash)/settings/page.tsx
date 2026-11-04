import { prisma } from "@/lib/prisma";
import SettingsForm from "@/components/admin/SettingsForm";
import { requireSection } from "@/lib/auth/guard";
export const dynamic = "force-dynamic";
export default async function AdminSettingsPage() {
  await requireSection("settings");
  const [general, hours, smsLog] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: "general" } }),
    prisma.workingHour.findMany({ orderBy: { dayOfWeek: "asc" } }),
    // Oxirgi SMS'lar (bron, sinov) — kelmagan bo'lsa, Eskiz xatosi shu yerda ko'rinadi
    prisma.notificationLog.findMany({
      where: { channel: "sms" }, orderBy: { createdAt: "desc" }, take: 12,
      select: { id: true, target: true, template: true, status: true, error: true, createdAt: true },
    }),
  ]);
  return (
    <SettingsForm
      general={(general?.value as never) || {}}
      hours={JSON.parse(JSON.stringify(hours))}
      smsLog={smsLog.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() }))}
    />
  );
}
