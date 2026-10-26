import { prisma } from "@/lib/prisma";
import BlogManager from "@/components/admin/BlogManager";
import { requireSection } from "@/lib/auth/guard";
import { SAMPLE_POSTS } from "@/lib/blog/sample-posts";
export const dynamic = "force-dynamic";
export default async function AdminBlogPage() {
  await requireSection("blog");
  const rows = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });
  return <BlogManager posts={JSON.parse(JSON.stringify(rows))} sampleSlugs={SAMPLE_POSTS.map((p) => p.slug)} />;
}
