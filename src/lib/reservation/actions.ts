"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { prisma } from "../prisma";
import { ensureAdmin, ensureSection } from "../auth/guard";
import { contactToken, encodeGuestContact, guestContact, parseIntlPhone, parseUzPhone, type Messenger, type Residency } from "../phone";
import { createWithCode } from "../codes";
import { restaurantDateTime, calendarDate } from "../time";
import { SLOT_MINUTES, dayOfWeekOf, hoursFor, slotsForDay, type DayHours } from "../hours";
import { notifyManagersSms, sendSmsLogged } from "../sms/managers";
import { smsText } from "../sms/templates";
import { rateLimit, clientIp, HOUR } from "../security/rate-limit";
import { notifyTelegram, escapeHtml } from "../telegram/notify";
import { Prisma, type ReservationStatus, type TableShape } from "@prisma/client";

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
    zoneId: input.zoneId, number: input.number.trim(), seats: input.seats,
    shape: input.shape ?? "ROUND", isVip: input.isVip ?? false,
    minSpend: input.minSpend ?? null,
    posX: input.posX ?? 40, posY: input.posY ?? 40,
    width: input.width ?? 90, height: input.height ?? 90,
  };
  try {
    if (input.id) await prisma.table.update({ where: { id: input.id }, data });
    // Shu zalda shu raqamli (masalan, sinxronlashda nofaol qilingan) stol bo'lsa — yangisini
    // yaratish o'rniga o'shani qayta faollashtiramiz (zal+raqam unikal)
    else await prisma.table.upsert({
      where: { zoneId_number: { zoneId: data.zoneId, number: data.number } },
      update: { ...data, isActive: true },
      create: data,
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: (await getTranslations("AdminUi.errors"))("tableNumberTaken") };
    }
    throw e;
  }
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
  const start = restaurantDateTime(dateStr, timeStr);
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
  /** local — O'zbekiston raqami (SMS), foreign — chet ellik: WhatsApp yoki Telegram orqali aloqa */
  residency?: Residency; messenger?: Messenger;
}) {
  const e = await getTranslations("Errors");
  const residency: Residency = input.residency === "foreign" ? "foreign" : "local";
  const messenger: Messenger = input.messenger === "telegram" ? "telegram" : "whatsapp";
  const guestName = (input.guestName || "").trim().slice(0, 80);
  if (!guestName) return { ok: false, error: e("nameRequired") };
  // Mahalliy — faqat operator kodi to'g'ri O'zbekiston mobil raqami; chet ellik — xalqaro raqam yoki Telegram @username
  const phone = encodeGuestContact(residency, messenger, input.guestPhone || "");
  if (!phone) {
    return { ok: false, error: residency === "local" ? e("phoneUz") : messenger === "telegram" ? e("phoneTelegram") : e("phoneIntl") };
  }
  const contact = guestContact(phone);
  if (!Number.isInteger(input.partySize) || input.partySize < 1 || input.partySize > 50) {
    return { ok: false, error: e("guestsInvalid") };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dateStr) || !/^\d{2}:\d{2}$/.test(input.timeStr)) {
    return { ok: false, error: e("dateInvalid") };
  }
  const start = restaurantDateTime(input.dateStr, input.timeStr);
  if (Number.isNaN(start.getTime())) return { ok: false, error: e("dateInvalid") };
  if (start.getTime() < Date.now()) return { ok: false, error: e("pastTime") };
  // Ish vaqti (admin -> Sozlamalar) bo'yicha: yopiq kun yoki ish vaqtidan tashqari soat rad etiladi
  const dayRow = await prisma.workingHour.findUnique({ where: { dayOfWeek: dayOfWeekOf(input.dateStr) } });
  const dayHours = dayRow ?? hoursFor([], dayOfWeekOf(input.dateStr));
  if (!slotsForDay(dayHours as DayHours).includes(input.timeStr)) {
    return { ok: false, error: dayHours.isClosed ? e("closedDay") : e("outsideHours") };
  }
  // Spam va SMS isrofiga qarshi (keng chegara: gid bir nechta guruhga bron qila oladi)
  if (!rateLimit(`resv-ip:${await clientIp()}`, 20, HOUR) || !rateLimit(`resv-phone:${phone}`, 10, HOUR)) {
    return { ok: false, error: e("tooMany") };
  }
  const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);

  // Server tomonda qayta tekshirish
  const table = await prisma.table.findUnique({ where: { id: input.tableId } });
  if (!table || !table.isActive) return { ok: false, error: e("tableNotFound") };
  if (table.seats < input.partySize) return { ok: false, error: e("tableTooSmall") };

  const clash = await prisma.reservation.findFirst({
    where: {
      tableId: input.tableId, status: { in: ACTIVE },
      startTime: { lt: end }, endTime: { gt: start },
    },
  });
  if (clash) return { ok: false, error: e("tableBusy") };

  const dateOnly = calendarDate(input.dateStr);

  const reservation = await createWithCode("reservation", "GC", (code) =>
    prisma.reservation.create({
      data: {
        code, tableId: input.tableId, guestName, guestPhone: phone,
        partySize: input.partySize, date: dateOnly, startTime: start, endTime: end,
        status: "PENDING", source: "WEB",
        specialRequest: input.specialRequest?.trim().slice(0, 500) || null,
        occasion: input.occasion?.trim().slice(0, 100) || null,
      },
    })
  );
  const code = reservation.code;

  // Mehmonga SMS — faqat O'zbekiston raqamiga (Eskiz chet el raqamlariga yubora olmaydi)
  if (contact.sms) await sendSmsLogged(phone, smsText.guestBooking({ code, date: input.dateStr, time: input.timeStr }), "booking-guest");
  const via = contact.kind === "whatsapp" ? "WhatsApp " : contact.kind === "telegram" ? "Telegram " : "";
  await notifyManagersSms(
    smsText.managerBooking({
      code, date: input.dateStr, time: input.timeStr, party: input.partySize, table: table.number, contact: contactToken(phone), name: guestName,
    })
  );
  await notifyTelegram(
    `🍽 <b>Yangi bron</b>\nKod: ${code}\nStol: ${escapeHtml(table.number)}\nMehmon: ${escapeHtml(guestName)} (${via}${escapeHtml(contact.display)})${residency === "foreign" ? "\n🌍 Chet ellik mehmon — SMS yuborilmadi" : ""}\nKishi: ${input.partySize}\nVaqt: ${input.dateStr} ${input.timeStr}`
  );

  revalidatePath("/[locale]/admin/reservations", "page");
  return { ok: true, code, reservationId: reservation.id };
}

// ---------- ADMIN: stolni band qilish / yopish ----------
const TIME_RE = /^\d{2}:\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type AdminHoldInput = {
  tableIds: string[];
  fromDate: string;
  fromTime: string;
  toDate: string;
  toTime: string;
  /** guest — telefon/joyida kelishilgan bron; block — stol shu vaqtga yopiladi (mehmonsiz) */
  kind: "guest" | "block";
  guestName?: string;
  guestPhone?: string;
  partySize?: number;
  note?: string;
  /** Mehmonga tasdiq SMS'i yuborilsinmi (faqat guest) */
  smsGuest?: boolean;
};

/**
 * Admin stol(lar)ni ma'lum vaqtga band qiladi: har stolga tasdiqlangan bron yoziladi (source: PHONE — mehmon uchun,
 * ADMIN — yopiq stol). Saytda shu vaqt oralig'ida stol "band" ko'rinadi. Ustma-ust tushgan faol bron bo'lsa — rad
 * etiladi va o'sha bronlar ro'yxati qaytariladi (avval ularni bekor qilish kerak).
 */
export async function adminHoldTables(input: AdminHoldInput): Promise<{ ok: true; codes: string[] } | { ok: false; error: string; conflicts?: string[] }> {
  await ensureSection("reservations");
  const ea = await getTranslations("AdminUi.errors");
  const ids = [...new Set((input.tableIds || []).filter(Boolean))].slice(0, 60);
  if (!ids.length) return { ok: false, error: ea("holdNoTable") };
  if (![input.fromDate, input.toDate].every((d) => DATE_RE.test(d)) || ![input.fromTime, input.toTime].every((x) => TIME_RE.test(x))) {
    return { ok: false, error: ea("holdBadTime") };
  }
  const start = restaurantDateTime(input.fromDate, input.fromTime);
  const end = restaurantDateTime(input.toDate, input.toTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return { ok: false, error: ea("holdBadTime") };
  if (end.getTime() <= Date.now()) return { ok: false, error: ea("holdPast") };
  if (end.getTime() - start.getTime() > 31 * 24 * 60 * 60 * 1000) return { ok: false, error: ea("holdTooLong") };

  const guest = input.kind === "guest";
  const note = (input.note || "").trim().slice(0, 300);
  let guestName = "";
  let phone = "";
  let partySize = 0;
  if (guest) {
    guestName = (input.guestName || "").trim().slice(0, 80);
    // O'zbekiston raqami (operator kodi bilan) yoki xalqaro raqam (+ davlat kodi)
    const raw = input.guestPhone || "";
    const intl = raw.trim().startsWith("+") && !raw.replace(/\D/g, "").startsWith("998") ? parseIntlPhone(raw) : null;
    phone = parseUzPhone(raw) ?? intl ?? "";
    partySize = Number(input.partySize);
    if (!guestName) return { ok: false, error: ea("holdNameRequired") };
    if (!phone) return { ok: false, error: ea("phoneInvalid") };
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 200) return { ok: false, error: ea("holdPartyInvalid") };
  } else {
    // Yopiq stol: ro'yxatda sabab ko'rinadi (mehmon ismi o'rnida)
    guestName = note.slice(0, 80) || ea("holdBlockedName");
  }

  const tables = await prisma.table.findMany({ where: { id: { in: ids } }, select: { id: true, number: true } });
  if (tables.length !== ids.length) return { ok: false, error: ea("holdNoTable") };

  const clashes = await prisma.reservation.findMany({
    where: { tableId: { in: ids }, status: { in: ACTIVE }, startTime: { lt: end }, endTime: { gt: start } },
    select: { code: true, guestName: true, table: { select: { number: true } } },
    take: 20,
  });
  if (clashes.length) {
    return {
      ok: false,
      error: ea("holdConflict"),
      conflicts: clashes.map((c) => `${c.code} · ${c.table?.number ?? "—"} · ${c.guestName}`),
    };
  }

  const date = calendarDate(input.fromDate);
  const codes: string[] = [];
  for (const tb of tables) {
    const r = await createWithCode("reservation", "GC", (code) =>
      prisma.reservation.create({
        data: {
          code, tableId: tb.id, guestName, guestPhone: phone, partySize, date, startTime: start, endTime: end,
          status: "CONFIRMED", source: guest ? "PHONE" : "ADMIN",
          specialRequest: guest ? note || null : null,
        },
      })
    );
    codes.push(r.code);
  }
  if (guest && input.smsGuest && guestContact(phone).sms) {
    await sendSmsLogged(phone, smsText.guestBooking({ code: codes[0], date: input.fromDate, time: input.fromTime }), "booking-guest");
  }

  revalidatePath("/[locale]/admin/reservations", "page");
  revalidatePath("/[locale]/admin/dashboard", "page");
  return { ok: true, codes };
}

// ---------- STATUS (admin) ----------
export async function updateReservationStatus(id: string, status: ReservationStatus, tableId?: string) {
  await ensureSection("reservations");
  await prisma.reservation.update({
    where: { id },
    data: { status, ...(tableId ? { tableId } : {}) },
  });
  revalidatePath("/[locale]/admin/reservations", "page");
  return { ok: true };
}

// ---------- O'CHIRISH (admin) — test yoki spam bronlar uchun ----------
// Oddiy holatda bron o'chirilmaydi, CANCELLED qilinadi. O'chirish bronni, unga biriktirilgan
// oldindan buyurtmani va to'lanmagan to'lov yozuvlarini butunlay olib tashlaydi.
export async function deleteReservation(id: string): Promise<{ ok: boolean; error?: string }> {
  await ensureAdmin();
  const r = await prisma.reservation.findUnique({
    where: { id },
    select: {
      payment: { select: { status: true } },
      preOrder: { select: { id: true, payment: { select: { status: true } } } },
    },
  });
  const ea = await getTranslations("AdminUi.errors");
  if (!r) return { ok: false, error: ea("reservationNotFound") };
  // To'lov tarixi buxgalteriya uchun kerak — to'langan bron o'chirilmaydi
  if (r.payment?.status === "PAID" || r.preOrder?.payment?.status === "PAID") {
    return { ok: false, error: ea("paidCannotDelete") };
  }
  const orderId = r.preOrder?.id;
  await prisma.$transaction([
    prisma.payment.deleteMany({ where: { OR: [{ reservationId: id }, ...(orderId ? [{ orderId }] : [])] } }),
    // Mehmon sharh qoldirgan bo'lsa — sharh saqlanadi, faqat buyurtmaga bog'lanishi uziladi
    ...(orderId
      ? [prisma.review.updateMany({ where: { orderId }, data: { orderId: null } }), prisma.order.delete({ where: { id: orderId } })]
      : []),
    prisma.reservation.delete({ where: { id } }),
  ]);
  revalidatePath("/[locale]/admin/reservations", "page");
  revalidatePath("/[locale]/admin/dashboard", "page");
  revalidatePath("/[locale]/admin/orders", "page");
  return { ok: true };
}
