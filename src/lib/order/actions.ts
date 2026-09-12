"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { ensureAdmin } from "../auth/guard";
import { genCode, normalizePhone } from "../utils";
import { notifyTelegram } from "../telegram/notify";
import type { OrderStatus, OrderType } from "@prisma/client";

export async function createOrder(input: {
  type?: OrderType; tableId?: string; guestName?: string; guestPhone?: string;
  note?: string;
  items: { menuItemId: string; quantity: number; note?: string }[];
}) {
  await ensureAdmin();
  if (!input.items?.length) return { ok: false, error: "Taomlar tanlanmagan" };

  const ids = input.items.map((i) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({ where: { id: { in: ids } } });
  const byId = new Map(menuItems.map((m) => [m.id, m]));

  let subtotal = 0;
  const orderItems = input.items.map((i) => {
    const mi = byId.get(i.menuItemId);
    const unit = mi ? Number(mi.discountPrice ?? mi.price) : 0;
    const line = unit * i.quantity;
    subtotal += line;
    return {
      menuItemId: i.menuItemId,
      nameSnapshot: (mi?.name as object) ?? {},
      unitPrice: unit,
      quantity: i.quantity,
      note: i.note || null,
      subtotal: line,
    };
  });

  const count = await prisma.order.count();
  const code = genCode("ORD", count + 1);

  const order = await prisma.order.create({
    data: {
      code, type: input.type ?? "DINE_IN", status: "NEW",
      tableId: input.tableId || null,
      guestName: input.guestName || null,
      guestPhone: input.guestPhone ? normalizePhone(input.guestPhone) : null,
      note: input.note || null,
      subtotal, serviceCharge: 0, discount: 0, total: subtotal,
      items: { create: orderItems },
    },
  });

  await notifyTelegram(`🧾 Yangi buyurtma ${code} — ${subtotal.toLocaleString()} so'm`);
  revalidatePath("/[locale]/admin/orders", "page");
  return { ok: true, code: order.code };
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  await ensureAdmin();
  await prisma.order.update({ where: { id }, data: { status } });
  revalidatePath("/[locale]/admin/orders", "page");
  return { ok: true };
}

export async function deleteOrder(id: string) {
  await ensureAdmin();
  await prisma.order.delete({ where: { id } });
  revalidatePath("/[locale]/admin/orders", "page");
  return { ok: true };
}


// ---------- PRE-ORDER (public) — bronga biriktirilgan oldindan buyurtma ----------
// To'lov YO'Q. Faqat oshxonaga oldindan xabar; narx ko'rsatiladi, restoranda to'lanadi.
export async function createPreorderForReservation(input: {
  reservationId: string;
  items: { menuItemId: string; quantity: number }[];
}) {
  if (!input.items?.length) return { ok: false, error: "Taomlar tanlanmagan" };

  const reservation = await prisma.reservation.findUnique({
    where: { id: input.reservationId },
    include: { preOrder: true },
  });
  if (!reservation) return { ok: false, error: "Bron topilmadi" };
  if (reservation.preOrder) return { ok: false, error: "Bu bronga allaqachon buyurtma biriktirilgan" };

  const ids = input.items.map((i) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({ where: { id: { in: ids }, isAvailable: true } });
  const byId = new Map(menuItems.map((m) => [m.id, m]));

  let subtotal = 0;
  const orderItems = input.items
    .filter((i) => byId.has(i.menuItemId) && i.quantity > 0)
    .map((i) => {
      const mi = byId.get(i.menuItemId)!;
      const unit = Number(mi.discountPrice ?? mi.price);
      const line = unit * i.quantity;
      subtotal += line;
      return {
        menuItemId: i.menuItemId,
        nameSnapshot: (mi.name as object) ?? {},
        unitPrice: unit,
        quantity: i.quantity,
        subtotal: line,
      };
    });
  if (!orderItems.length) return { ok: false, error: "Taomlar tanlanmagan" };

  const count = await prisma.order.count();
  const code = genCode("ORD", count + 1);

  const order = await prisma.order.create({
    data: {
      code,
      type: "PREORDER",
      status: "NEW",
      reservationId: reservation.id,
      tableId: reservation.tableId,
      guestName: reservation.guestName,
      guestPhone: reservation.guestPhone,
      scheduledFor: reservation.startTime,
      subtotal,
      serviceCharge: 0,
      discount: 0,
      total: subtotal,
      items: { create: orderItems },
    },
  });

  await notifyTelegram(
    `🍽 <b>Pre-order</b> (bron ${reservation.code})\n${orderItems.length} xil taom · ${subtotal.toLocaleString()} so'm\nVaqt: ${new Date(reservation.startTime).toLocaleString("uz-UZ")}`
  );
  revalidatePath("/[locale]/admin/reservations", "page");
  return { ok: true, orderCode: order.code, total: subtotal };
}
