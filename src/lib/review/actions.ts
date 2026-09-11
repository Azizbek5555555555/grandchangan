"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { ensureAdmin } from "../auth/guard";
import { notifyTelegram } from "../telegram/notify";
import type { ReviewStatus } from "@prisma/client";

export async function submitReview(input: {
  authorName: string; rating: number; comment?: string; menuItemId?: string;
}) {
  if (input.rating < 1 || input.rating > 5) return { ok: false, error: "Reyting 1-5" };
  await prisma.review.create({
    data: {
      authorName: input.authorName || "Mehmon",
      rating: input.rating,
      comment: input.comment || null,
      menuItemId: input.menuItemId || null,
      status: "PENDING",
    },
  });
  await notifyTelegram(`⭐️ Yangi sharh (${input.rating}/5): ${input.authorName}\n${input.comment || ""}`);
  revalidatePath("/[locale]/admin/reviews", "page");
  return { ok: true };
}

export async function moderateReview(id: string, status: ReviewStatus) {
  await ensureAdmin();
  await prisma.review.update({ where: { id }, data: { status } });
  revalidatePath("/[locale]/admin/reviews", "page");
  revalidatePath("/[locale]", "page");
  return { ok: true };
}

export async function replyReview(id: string, reply: string) {
  await ensureAdmin();
  await prisma.review.update({ where: { id }, data: { reply, repliedAt: new Date() } });
  revalidatePath("/[locale]/admin/reviews", "page");
  return { ok: true };
}

export async function deleteReview(id: string) {
  await ensureAdmin();
  await prisma.review.delete({ where: { id } });
  revalidatePath("/[locale]/admin/reviews", "page");
  return { ok: true };
}
