import "server-only";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { prisma } from "../prisma";
import { getSession } from "./session";
import { MANAGEMENT, STAFF_ROLE_LIST, canAccess, firstSection, type AdminSection } from "./permissions";
import type { User, UserRole } from "@prisma/client";

export async function currentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.isBlocked) return null;
  return user;
}

export async function requireRole(roles: UserRole[]): Promise<User | null> {
  const user = await currentUser();
  if (!user || !roles.includes(user.role)) return null;
  return user;
}

/** Server action uchun: rol mos kelmasa xato otadi */
export async function ensureRoles(roles: UserRole[]): Promise<User> {
  const user = await requireRole(roles);
  if (!user) throw new Error("Ruxsat yo'q");
  return user;
}

/** Boshqaruv (MANAGER/ADMIN/SUPERADMIN) action'lari uchun */
export async function ensureAdmin(): Promise<User> {
  return ensureRoles(ADMIN_ROLES);
}

/** Server action uchun: shu bo'limga ruxsat bo'lmasa xato otadi */
export async function ensureSection(section: AdminSection): Promise<User> {
  const user = await currentUser();
  if (!user || !canAccess(user.role, section)) throw new Error("Ruxsat yo'q");
  return user;
}

/**
 * Admin sahifasi uchun: kirmagan bo'lsa — login'ga, bo'limga ruxsati bo'lmasa —
 * o'zining birinchi ochiq bo'limiga yo'naltiradi.
 */
export async function requireSection(section: AdminSection): Promise<User> {
  const locale = await getLocale();
  const user = await currentUser();
  if (!user || !STAFF_ROLES.includes(user.role)) redirect({ href: "/admin/login", locale });
  if (!canAccess(user!.role, section)) {
    const first = firstSection(user!.role);
    redirect({ href: first ? `/admin/${first}` : "/admin/login", locale });
  }
  return user!;
}

export const STAFF_ROLES: UserRole[] = STAFF_ROLE_LIST;
export const ADMIN_ROLES: UserRole[] = MANAGEMENT;
