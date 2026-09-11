import { prisma } from "@/lib/prisma";
import CouponManager from "@/components/admin/CouponManager";
export const dynamic = "force-dynamic";
export default async function AdminPromotionsPage() {
  const rows = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  const plain = rows.map((c) => ({ id: c.id, code: c.code, type: c.type, value: Number(c.value), minOrder: c.minOrder ? Number(c.minOrder) : null, usedCount: c.usedCount, usageLimit: c.usageLimit, isActive: c.isActive }));
  return <CouponManager coupons={plain} />;
}
