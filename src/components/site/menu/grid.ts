import { cn } from "@/lib/utils";

/**
 * Panjara oxirgi qatorini to'ldirish (bo'sh kataklar qolmasin).
 * n — katakchalar soni; sm…lg da 2 ustun, xl da 3 ustun.
 * last — oxirgi katakchaga beriladigan cho'zilish klassi, filler — xl da bitta bezak katakcha kerakmi.
 */
export function rowFill(n: number) {
  const odd = n % 2 === 1;
  const r3 = n % 3;
  return {
    last: cn(odd && "sm:col-span-2", r3 ? "xl:col-span-2" : odd && "xl:col-span-1"),
    filler: r3 === 1,
  };
}
