import { prisma } from "@/lib/prisma";
import ReviewModeration from "@/components/admin/ReviewModeration";
import { requireSection } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  await requireSection("reviews");
  const rows = await prisma.review.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const plain = rows.map((r) => ({
    id: r.id, authorName: r.authorName, rating: r.rating, comment: r.comment,
    status: r.status, reply: r.reply, createdAt: r.createdAt.toISOString(),
  }));
  return <ReviewModeration reviews={plain} />;
}
