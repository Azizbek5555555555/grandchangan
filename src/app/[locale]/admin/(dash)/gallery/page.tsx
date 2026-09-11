import { prisma } from "@/lib/prisma";
import GalleryManager from "@/components/admin/GalleryManager";
export const dynamic = "force-dynamic";
export default async function AdminGalleryPage() {
  const rows = await prisma.galleryImage.findMany({ orderBy: { createdAt: "desc" } });
  return <GalleryManager images={rows.map((r) => ({ id: r.id, url: r.url, category: r.category }))} />;
}
