"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { ensureAdmin } from "../auth/guard";
import { genCode, normalizePhone } from "../utils";
import { sendSms } from "../sms/eskiz";
import { notifyTelegram } from "../telegram/notify";
import type { ReservationStatus, TableShape } from "@prisma/client";

const SLOT_MINUTES = 120;
const ACTIVE: ReservationStatus[] = ["PENDING", "CONFIRMED", "SEATED"];

type Localized = Record<string, string>;

// ---------- ZONES ----------
export async function saveZone(input: {
  id?: string; name: Localized; floor?: number; mapWidth?: number; mapHeight?: number; sortOrder?: number;
}) {
  await ensureAdmin();
  const data = {
    name: input.name, floor: input.floor ?? 1,
    mapWidth: input.mapWidth ?? 1000, mapHeight: input.mapHeight ?? 700,
    sortOrder: input.sortOrder ?? 0,
  };
  const zone = input.id
    ? await prisma.zone.update({ where: { id: input.id }, data })
    : await prisma.zone.create({ data });
  revalidatePath("/[locale]/admin/tables", "page");
  return { ok: true, id: zone.id };
}

export async function deleteZone(id: string) {
  await ensureAdmin();
  await prisma.zone.delete({ where: { id } });
  revalidatePath("/[locale]/admin/tables", "page");
  return { ok: true };
}

// ---------- TABLES ----------
export async function saveTable(input: {
  id?: string; zoneId: string; number: string; seats: number; shape?: TableShape;
  isVip?: boolean; minSpend?: number | null; posX?: number; posY?: number;
  width?: number; height?: number;
}) {
  await ensureAdmin();
  const data = {
    zoneId: input.zoneId, number: input.number, seats: input.seats,
    shape: input.shape ?? "ROUND", isVip: input.isVip ?? false,
    minSpend: input.minSpend ?? null,
    posX: input.posX ?? 40, posY: input.posY ?? 40,
    width: input.width ?? 90, height: input.height ?? 90,
  };
  if (input.id) await prisma.table.update({ where: { id: input.id }, data });
  else await prisma.table.create({ data });
  revalidatePath("/[locale]/admin/tables", "page");
  return { ok: true };
}

export async function deleteTable(id: string) {
  await ensureAdmin();
  await prisma.table.delete({ where: { id } });
  revalidatePath("/[locale]/admin/tables", "page");
  return { ok: true };
}

/** Floor-plan editordan koordinatalarni bulk saqlash */
export async function saveLayout(positions: { id: string; posX: number; posY: number; width: number; height: number }[]) {
  await ensureAdmin();
  await prisma.$transaction(
    positions.map((p) =>
      prisma.table.update({
        where: { id: p.id },
        data: { posX: p.posX, posY: p.posY, width: p.width, height: p.height },
      })
    )
  );
  revalidatePath("/[locale]/admin/tables", "page");
  return { ok: true };
}

// ---------- AVAILABILITY ----------
export async function getAvailability(dateStr: string, timeStr: string, partySize: number) {
  const start = new Date(`${dateStr}T${timeStr}:00`);
  const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);

  const zones = await prisma.zone.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      tables: {
        where: { isActive: true },
        orderBy: { number: "asc" },
        include: {
          reservations: {
            where: {
              status: { in: ACTIVE },
              startTime: { lt: end },
              endTime: { gt: start },
            },
            select: { id: true },
          },
        },
      },
    },
  });

  const result = zones.map((z) => ({
    id: z.id,
    name: z.name,
    mapWidth: z.mapWidth,
    mapHeight: z.mapHeight,
    tables: z.tables.map((tb) => {
      const busy = tb.reservations.length > 0;
      const tooSmall = tb.seats < partySize;
      const maintenance = tb.status === "MAINTENANCE";
      let state: "free" | "busy" | "small" | "maintenance" = "free";
      if (maintenance) state = "maintenance";
      else if (busy) state = "busy";
      else if (tooSmall) state = "small";
      return {
        id: tb.id, number: tb.number, seats: tb.seats, isVip: tb.isVip,
        posX: tb.posX, posY: tb.posY, width: tb.width, height: tb.height,
        shape: tb.shape, minSpend: tb.minSpend ? Number(tb.minSpend) : null, state,
      };
    }),
  }));

  return { start: start.toISOString(), end: end.toISOString(), zones: result };
}

// ---------- CREATE (public) ----------
export async function createReservation(input: {
  tableId: string; guestName: string; guestPhone: string; partySize: number;
  dateStr: string; timeStr: string; specialRequest?: string; occasion?: string;
}) {
  const phone = normalizePhone(input.guestPhone);
  const start = new Date(`${input.dateStr}T${input.timeStr}:00`);
  const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);

  // Server tomonda qayta tekshirish
  const table = await prisma.table.findUnique({ where: { id: input.tableId } });
  if (!table || !table.isActive) return { ok: false, error: "Stol topilmadi" };
  if (table.seats < input.partySize) return { ok: false, error: "Stol sig'imi yetarli emas" };

  const clash = await prisma.reservation.findFirst({
    where: {
      tableId: input.tableId, status: { in: ACTIVE },
      startTime: { lt: end }, endTime: { gt: start },
    },
  });
  if (clash) return { ok: false, error: "Bu stol tanlangan vaqtda band" };

  const count = await prisma.reservation.count();
  const code = genCode("GC", count + 1);
  const dateOnly = new Date(`${input.dateStr}T00:00:00`);

  const reservation = await prisma.reservation.create({
    data: {
      code, tableId: input.tableId, guestName: input.guestName, guestPhone: phone,
      partySize: input.partySize, date: dateOnly, startTime: start, endTime: end,
      status: "PENDING", source: "WEB",
      specialRequest: input.specialRequest || null, occasion: input.occasion || null,
    },
  });

  await sendSms(phone, `GrandChangan: bron qabul qilindi. Kod: ${code}. ${input.dateStr} ${input.timeStr}`);
  await notifyTelegram(
    `🍽 <b>Yangi bron</b>\nKod: ${code}\nStol: ${table.number}\nMehmon: ${input.guestName} (${phone})\nKishi: ${input.partySize}\nVaqt: ${input.dateStr} ${input.timeStr}`
  );

  revalidatePath("/[locale]/admin/reservations", "page");
  return { ok: true, code, reservationId: reservation.id };
}

// ---------- STATUS (admin) ----------
export async function updateReservationStatus(id: string, status: ReservationStatus, tableId?: string) {
  await ensureAdmin();
  await prisma.reservation.update({
    where: { id },
    data: { status, ...(tableId ? { tableId } : {}) },
  });
  revalidatePath("/[locale]/admin/reservations", "page");
  return { ok: true };
}
