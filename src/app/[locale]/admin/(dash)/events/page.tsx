import { prisma } from "@/lib/prisma";
import EventInquiries from "@/components/admin/EventInquiries";
export const dynamic = "force-dynamic";
export default async function AdminEventsPage() {
  const rows = await prisma.eventInquiry.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const plain = rows.map((q) => ({
    id: q.id, name: q.name, phone: q.phone, eventType: q.eventType, guestCount: q.guestCount,
    preferredDate: q.preferredDate ? q.preferredDate.toISOString() : null, message: q.message,
    status: q.status, createdAt: q.createdAt.toISOString(),
  }));
  return <EventInquiries inquiries={plain} />;
}
