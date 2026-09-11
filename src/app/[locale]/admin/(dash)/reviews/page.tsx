import { prisma } from "@/lib/prisma";
import ReviewModeration from "@/components/admin/ReviewModeration";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const rows = await prisma.review.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const plain = rows.map((r) => ({
    id: r.id, authorName: r.authorName, rating: r.rating, comment: r.comment,
    status: r.status, reply: r.reply, createdAt: r.createdAt.toISOString(),
  }));
  return <ReviewModeration reviews={plain} />;
}
