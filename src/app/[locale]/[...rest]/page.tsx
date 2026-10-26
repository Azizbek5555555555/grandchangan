import { notFound } from "next/navigation";

/**
 * Mavjud bo'lmagan har qanday manzil (/en/nimadir, /menu/xyz) — dizaynli 404 sahifasi ([locale]/not-found.tsx)
 * chiqsin, Next.js'ning standart oq sahifasi emas.
 */
export default function CatchAll() {
  notFound();
}
