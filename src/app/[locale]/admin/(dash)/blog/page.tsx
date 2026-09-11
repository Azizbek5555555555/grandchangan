import { prisma } from "@/lib/prisma";
import BlogManager from "@/components/admin/BlogManager";
export const dynamic = "force-dynamic";
export default async function AdminBlogPage() {
  const rows = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });
  return <BlogManager posts={JSON.parse(JSON.stringify(rows))} />;
}
