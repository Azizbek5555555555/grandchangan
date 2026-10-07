import { prisma } from "@/lib/prisma";
import BannerManager from "@/components/admin/BannerManager";
import { requireSection } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  await requireSection("banners");
  const banners = await prisma.banner.findMany({ orderBy: [{ position: "asc" }, { sortOrder: "asc" }] });
  return <BannerManager banners={JSON.parse(JSON.stringify(banners))} />;
}
