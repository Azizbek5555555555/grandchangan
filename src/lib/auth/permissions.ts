import type { UserRole } from "@prisma/client";

/**
 * Admin panel bo'limlari va ularga kim kira oladi. Sidebar, sahifalar va server action'lar
 * shu bitta xaritadan foydalanadi.
 *   MANAGER/ADMIN/SUPERADMIN — boshqaruv (hamma bo'limlar)
 *   WAITER (ofitsiant)       — bronlar, buyurtmalar
 *   KITCHEN (oshxona)        — faqat buyurtmalar (holatini o'zgartirish)
 *   Xodimlar bo'limi         — faqat ADMIN va SUPERADMIN
 */
export const MANAGEMENT: UserRole[] = ["MANAGER", "ADMIN", "SUPERADMIN"];

export const SECTION_ROLES = {
  dashboard: MANAGEMENT,
  reservations: [...MANAGEMENT, "WAITER"],
  orders: [...MANAGEMENT, "WAITER", "KITCHEN"],
  menu: MANAGEMENT,
  tables: MANAGEMENT,
  reviews: MANAGEMENT,
  blog: MANAGEMENT,
  banners: MANAGEMENT,
  promotions: MANAGEMENT,
  customers: MANAGEMENT,
  staff: ["ADMIN", "SUPERADMIN"],
  payments: MANAGEMENT,
  events: MANAGEMENT,
  gallery: MANAGEMENT,
  settings: MANAGEMENT,
} satisfies Record<string, UserRole[]>;

export type AdminSection = keyof typeof SECTION_ROLES;
export const SECTIONS = Object.keys(SECTION_ROLES) as AdminSection[];

export function canAccess(role: UserRole, section: AdminSection): boolean {
  return (SECTION_ROLES[section] as UserRole[]).includes(role);
}

/** Rol uchun birinchi ochiq bo'lim (kirgandan keyin shu yerga yo'naltiriladi) */
export function firstSection(role: UserRole): AdminSection | null {
  return SECTIONS.find((s) => canAccess(role, s)) ?? null;
}

/** Rol darajasi: faqat o'zidan past darajadagi foydalanuvchini boshqarish mumkin */
export const ROLE_RANK: Record<UserRole, number> = {
  CUSTOMER: 0, WAITER: 1, KITCHEN: 1, MANAGER: 2, ADMIN: 3, SUPERADMIN: 4,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  CUSTOMER: "Mijoz", WAITER: "Ofitsiant", KITCHEN: "Oshxona",
  MANAGER: "Menejer", ADMIN: "Admin", SUPERADMIN: "Superadmin",
};

export const STAFF_ROLE_LIST: UserRole[] = ["WAITER", "KITCHEN", "MANAGER", "ADMIN", "SUPERADMIN"];
