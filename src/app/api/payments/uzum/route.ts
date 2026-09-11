import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * uzum webhook (callback) skeleti.
 * NEEDS-KEYS + SANDBOX-TEST: imzo tekshiruvi va holat kodlari provayder hujjatiga
 * muvofiq to'ldirilishi kerak. Hozircha payload'ni logga yozib, 200 qaytaradi.
 */
export async function POST(req: NextRequest) {
  let payload: unknown = null;
  try { payload = await req.json(); } catch { payload = await req.text(); }
  // eslint-disable-next-line no-console
  console.log("[PAY:uzum] webhook", JSON.stringify(payload));

  // TODO: imzoni tekshirish; providerTxnId bo'yicha Payment topib, status yangilash
  // await prisma.payment.updateMany({ where: { providerTxnId }, data: { status: "PAID", paidAt: new Date() } });
  void prisma;

  return NextResponse.json({ result: { ok: true } });
}

export async function GET() {
  return NextResponse.json({ provider: "uzum", status: "ready" });
}
