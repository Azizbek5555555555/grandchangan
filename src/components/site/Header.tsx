import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/utils";
import HeaderClient from "./HeaderClient";
import { phoneOf } from "@/lib/contact";

/**
 * Sayt header'i. Burger menyudagi telefon, manzil va ijtimoiy tarmoqlar admin
 * Sozlamalar'idan olinadi (avval kodda qotirilgan edi).
 *
 * `solid` — header doim to'q panel bo'lsin (sahifa tepasida qizil/tungi hero bo'lmasa).
 * Berilmasa, yo'l bo'yicha avtomatik aniqlanadi (chrome/nav.ts -> hasDarkHero).
 */
export default async function SiteHeader({ solid }: { solid?: boolean } = {}) {
  const locale = await getLocale();
  const setting = await prisma.siteSetting.findUnique({ where: { key: "general" } });
  const g = (setting?.value as Record<string, unknown>) || {};
  const phone = phoneOf(g);
  return (
    <HeaderClient
      solid={solid}
      contact={{
        phone,
        address: t(g.address, locale) || "Ibn Xoldun 10B, Samarqand",
        instagram: g.instagram ? String(g.instagram) : undefined,
        telegram: g.telegram ? String(g.telegram) : undefined,
      }}
    />
  );
}
