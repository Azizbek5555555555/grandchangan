import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/utils";
import HeaderClient from "./HeaderClient";

/**
 * Sayt header'i. Burger menyudagi telefon, manzil va ijtimoiy tarmoqlar admin
 * Sozlamalar'idan olinadi (avval kodda qotirilgan edi).
 */
export default async function SiteHeader() {
  const locale = await getLocale();
  const setting = await prisma.siteSetting.findUnique({ where: { key: "general" } });
  const g = (setting?.value as Record<string, unknown>) || {};
  const phone = Array.isArray(g.phones) && g.phones[0] ? String(g.phones[0]) : "+998 90 503 15 68";
  return (
    <HeaderClient
      contact={{
        phone,
        address: t(g.address, locale) || "Ibn Xoldun 10B, Samarqand",
        instagram: g.instagram ? String(g.instagram) : undefined,
        telegram: g.telegram ? String(g.telegram) : undefined,
      }}
    />
  );
}
