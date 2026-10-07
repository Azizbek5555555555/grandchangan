import { prisma } from "@/lib/prisma";
import MenuManager from "@/components/admin/MenuManager";
import { requireSection } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  await requireSection("menu");
  const [categories, items] = await Promise.all([
    prisma.menuCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.menuItem.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  const plainCats = JSON.parse(JSON.stringify(categories));
  const plainItems = JSON.parse(JSON.stringify(items)).map((i: Record<string, unknown>) => ({
    ...i,
    price: Number(i.price),
    discountPrice: i.discountPrice != null ? Number(i.discountPrice) : null,
  }));
  return <MenuManager categories={plainCats} items={plainItems} />;
}
