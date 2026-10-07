import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { genCode } from "./utils";

type CodedModel = "order" | "reservation";

/**
 * Keyingi tartib raqami — yozuvlar soni (count) emas, oxirgi kod bo'yicha.
 * count ishlatilsa, biror yozuv o'chirilgach yangi kod mavjud kod bilan to'qnashardi.
 * Kodlar 6 xonagacha nol bilan to'ldirilgan (GC-000123), shuning uchun satr bo'yicha
 * saralash raqam bo'yicha saralash bilan bir xil.
 */
async function nextNumber(model: CodedModel, prefix: string): Promise<number> {
  const query = {
    where: { code: { startsWith: `${prefix}-` } },
    orderBy: { code: "desc" as const },
    select: { code: true },
  };
  const last =
    model === "order"
      ? await prisma.order.findFirst(query)
      : await prisma.reservation.findFirst(query);
  const n = last ? parseInt(last.code.slice(prefix.length + 1), 10) : 0;
  return (Number.isFinite(n) ? n : 0) + 1;
}

function isCodeClash(e: unknown): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") return false;
  const target = (e.meta as { target?: unknown } | undefined)?.target;
  return Array.isArray(target) ? target.includes("code") : String(target ?? "").includes("code");
}

/**
 * Yangi kod bilan yozuv yaratish. Bir vaqtda ikkita so'rov bir xil kod olsa
 * (unique to'qnashuv), keyingi raqam bilan qayta urinadi.
 */
export async function createWithCode<T>(
  model: CodedModel,
  prefix: string,
  create: (code: string) => Promise<T>
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const code = genCode(prefix, await nextNumber(model, prefix));
    try {
      return await create(code);
    } catch (e) {
      if (attempt < 4 && isCodeClash(e)) continue;
      throw e;
    }
  }
}
