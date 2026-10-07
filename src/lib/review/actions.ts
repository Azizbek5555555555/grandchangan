"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { prisma } from "../prisma";
import { ensureAdmin } from "../auth/guard";
import { notifyTelegram, escapeHtml } from "../telegram/notify";
import { rateLimit, clientIp, HOUR } from "../security/rate-limit";
import type { ReviewStatus } from "@prisma/client";

export async function submitReview(input: {
  authorName: string; rating: number; comment?: string; menuItemId?: string;
}) {
  const e = await getTranslations("Errors");
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) return { ok: false, error: e("ratingInvalid") };
  if (!rateLimit(`review-ip:${await clientIp()}`, 5, HOUR)) return { ok: false, error: e("tooMany") };
  const authorName = (input.authorName || "").trim().slice(0, 60) || "Mehmon";
  const comment = (input.comment || "").trim().slice(0, 1000);
  await prisma.review.create({
    data: {
      authorName,
      rating: input.rating,
      comment: comment || null,
      menuItemId: input.menuItemId || null,
      status: "PENDING",
    },
  });
  await notifyTelegram(`⭐️ Yangi sharh (${input.rating}/5): ${escapeHtml(authorName)}\n${escapeHtml(comment)}`);
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
