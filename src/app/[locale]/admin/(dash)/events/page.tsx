import { prisma } from "@/lib/prisma";
import EventInquiries from "@/components/admin/EventInquiries";
import { requireSection } from "@/lib/auth/guard";
export const dynamic = "force-dynamic";
export default async function AdminEventsPage() {
  await requireSection("events");
  const rows = await prisma.eventInquiry.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const plain = rows.map((q) => ({
    id: q.id, name: q.name, phone: q.phone, eventType: q.eventType, guestCount: q.guestCount,
    preferredDate: q.preferredDate ? q.preferredDate.toISOString() : null, message: q.message,
    status: q.status, createdAt: q.createdAt.toISOString(),
  }));
  return <EventInquiries inquiries={plain} />;
}
