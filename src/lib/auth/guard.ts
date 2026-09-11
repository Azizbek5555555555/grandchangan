import "server-only";
import { prisma } from "../prisma";
import { getSession } from "./session";
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

export async function ensureAdmin(): Promise<User> {
  const user = await requireRole(ADMIN_ROLES);
  if (!user) throw new Error("Ruxsat yo'q");
  return user;
}

export const STAFF_ROLES: UserRole[] = ["WAITER", "KITCHEN", "MANAGER", "ADMIN", "SUPERADMIN"];
export const ADMIN_ROLES: UserRole[] = ["MANAGER", "ADMIN", "SUPERADMIN"];
