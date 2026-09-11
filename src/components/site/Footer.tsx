import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { Instagram, Send, Phone, MapPin } from "lucide-react";

export default async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Common" });
  const general = await prisma.siteSetting.findUnique({ where: { key: "general" } });
  const g = (general?.value as Record<string, unknown>) || {};
  const phones = Array.isArray(g.phones) ? (g.phones as string[]) : ["+998 66 000 00 00"];

  return (
    <footer className="relative overflow-hidden bg-brand-ink text-brand-cream">
      <div className="hairline-gold" />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <p className="font-display text-3xl text-brand-gold-light">GrandChangan</p>
          <p className="mt-4 max-w-xs text-sm text-brand-cream/50">
            {String((g.name as string) || "Haqiqiy Xitoy taomlari")} · Samarqand markazida, an'anaviy atmosfera bilan.
          </p>
          <div className="mt-6 flex gap-3">
            {g.instagram ? (
              <a href={String(g.instagram)} target="_blank" rel="noreferrer" className="rounded-full border border-brand-gold/30 p-2.5 text-brand-gold-light transition hover:bg-brand-gold hover:text-brand-ink">
                <Instagram size={18} />
              </a>
            ) : null}
            {g.telegram ? (
              <a href={String(g.telegram)} target="_blank" rel="noreferrer" className="rounded-full border border-brand-gold/30 p-2.5 text-brand-gold-light transition hover:bg-brand-gold hover:text-brand-ink">
                <Send size={18} />
              </a>
            ) : null}
          </div>
        </div>

        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-brand-gold">Sahifalar</p>
          <ul className="space-y-2.5 text-sm text-brand-cream/60">
            <li><Link href="/menu" className="transition hover:text-brand-gold-light">{t("menu")}</Link></li>
            <li><Link href="/reservation" className="transition hover:text-brand-gold-light">{t("reservation")}</Link></li>
            <li><Link href="/gallery" className="transition hover:text-brand-gold-light">{t("gallery")}</Link></li>
            <li><Link href="/blog" className="transition hover:text-brand-gold-light">{t("blog")}</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-brand-gold">Aloqa</p>
          <ul className="space-y-3 text-sm text-brand-cream/60">
            {phones.map((p) => (
              <li key={p} className="flex items-center gap-2"><Phone size={15} className="text-brand-gold/70" /> {p}</li>
            ))}
            {g.address ? <li className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 text-brand-gold/70" /> {String(g.address)}</li> : null}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-brand-gold">Ish vaqti</p>
          <p className="text-sm text-brand-cream/60">Dushanba — Yakshanba</p>
          <p className="font-display text-2xl text-brand-cream">11:00 — 23:00</p>
          <Link href="/reservation" className="mt-5 inline-block rounded-full bg-brand-red px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-red-dark">
            {t("reservation")}
          </Link>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-5 text-xs text-brand-cream/40 sm:flex-row">
          <span>© {new Date().getFullYear()} GrandChangan. Barcha huquqlar himoyalangan.</span>
          <span>Webz tomonidan ishlab chiqilgan</span>
        </div>
      </div>
    </footer>
  );
}
