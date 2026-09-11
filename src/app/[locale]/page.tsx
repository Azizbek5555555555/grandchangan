import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { t, formatMoney } from "@/lib/utils";
import { Star, ArrowRight, UtensilsCrossed, Clock, MapPin } from "lucide-react";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import ReviewForm from "@/components/site/ReviewForm";
import FeaturedSlider from "@/components/site/FeaturedSlider";
import Reveal from "@/components/motion/Reveal";
import RevealGroup from "@/components/motion/RevealGroup";

export const dynamic = "force-dynamic";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tr = await getTranslations({ locale, namespace: "Home" });

  const [hero, featured, reviews, general] = await Promise.all([
    prisma.banner.findFirst({ where: { position: "HERO", isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.menuItem.findMany({ where: { isFeatured: true, isAvailable: true }, take: 8, orderBy: { sortOrder: "asc" } }),
    prisma.review.findMany({ where: { status: "APPROVED" }, take: 6, orderBy: { createdAt: "desc" } }),
    prisma.siteSetting.findUnique({ where: { key: "general" } }),
  ]);
  const g = (general?.value as Record<string, unknown>) || {};
  const featItems = featured.map((it) => ({ id: it.id, name: it.name, price: Number(it.discountPrice ?? it.price), imageUrl: it.imageUrl }));

  return (
    <>
      <SiteHeader />

      {/* ======================= HERO ======================= */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-ink text-center">
        {hero?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 hero-scrim" />
        <div className="relative z-10 max-w-3xl px-5">
          <p className="mb-5 text-sm uppercase tracking-[0.35em] text-brand-gold">Samarqand · Xitoy oshxonasi</p>
          <h1 className="font-display text-5xl leading-tight text-brand-cream sm:text-7xl">
            {hero?.title ? t(hero.title, locale) : tr("hero_title")}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-brand-cream/70">
            {hero?.subtitle ? t(hero.subtitle, locale) : tr("hero_subtitle")}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/reservation" className="group flex items-center gap-2 rounded-full bg-brand-red px-8 py-3.5 font-medium text-white transition hover:bg-brand-red-dark">
              {tr("book_table")} <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </Link>
            <Link href="/menu" className="rounded-full border border-brand-gold/50 px-8 py-3.5 font-medium text-brand-gold-light transition hover:bg-brand-gold hover:text-brand-ink">
              {tr("view_menu")}
            </Link>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
          <div className="h-12 w-px animate-pulse bg-gradient-to-b from-brand-gold to-transparent" />
        </div>
      </section>

      {/* ======================= STORY ======================= */}
      <section className="bg-brand-cream py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
          <Reveal>
            <p className="mb-3 text-sm uppercase tracking-[0.3em] text-brand-red">Biz haqimizda</p>
            <h2 className="font-display text-4xl text-brand-ink sm:text-5xl">An'ana va lazzat uyg'unligi</h2>
            <p className="mt-6 text-neutral-600">
              GrandChangan — Samarqand markazidagi haqiqiy Xitoy taomlari maskani. Sichuan va Kanton
              uslublari, yangi mahsulotlar va issiq atmosferani bir dasturxonga jamladik.
            </p>
            <p className="mt-4 text-neutral-600">
              Har bir taom — an'anaviy retsept va mahalliy didning nozik uyg'unligi. Barcha mahsulotlar halal.
            </p>
            <Link href="/about" className="mt-8 inline-flex items-center gap-2 font-medium text-brand-red">
              Batafsil <ArrowRight size={16} />
            </Link>
          </Reveal>
          <RevealGroup className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl bg-brand-ink p-8 text-center text-brand-cream gold-glow">
              <UtensilsCrossed size={28} className="mx-auto text-brand-gold" />
              <p className="mt-4 font-display text-3xl">50+</p>
              <p className="text-sm text-brand-cream/60">taom turlari</p>
            </div>
            <div className="mt-8 rounded-3xl border border-brand-gold/30 p-8 text-center">
              <Clock size={28} className="mx-auto text-brand-red" />
              <p className="mt-4 font-display text-3xl text-brand-ink">11–23</p>
              <p className="text-sm text-neutral-500">har kuni ochiq</p>
            </div>
            <div className="rounded-3xl border border-brand-gold/30 p-8 text-center">
              <MapPin size={28} className="mx-auto text-brand-red" />
              <p className="mt-4 font-display text-xl text-brand-ink">Samarqand</p>
              <p className="text-sm text-neutral-500">markazda</p>
            </div>
            <div className="mt-8 rounded-3xl bg-brand-red p-8 text-center text-white">
              <Star size={28} className="mx-auto fill-white" />
              <p className="mt-4 font-display text-3xl">VIP</p>
              <p className="text-sm text-white/70">zallar mavjud</p>
            </div>
          </RevealGroup>
        </div>
      </section>

      {/* ======================= FEATURED (Swiper) ======================= */}
      {featItems.length > 0 && (
        <section className="bg-brand-ink py-24">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal className="mb-12 text-center">
              <p className="mb-3 text-sm uppercase tracking-[0.3em] text-brand-gold">Menyudan</p>
              <h2 className="font-display text-4xl text-brand-cream sm:text-5xl">Mashhur taomlar</h2>
            </Reveal>
          </div>
          <div className="mx-auto max-w-6xl px-2">
            <FeaturedSlider items={featItems} locale={locale} />
          </div>
          <div className="mt-8 text-center">
            <Link href="/menu" className="inline-flex items-center gap-2 rounded-full border border-brand-gold/50 px-8 py-3 font-medium text-brand-gold-light transition hover:bg-brand-gold hover:text-brand-ink">
              To'liq menyu <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}

      {/* ======================= RESERVATION CTA ======================= */}
      <section className="relative overflow-hidden bg-brand-ink-soft py-28 text-center">
        <div className="relative z-10 mx-auto max-w-2xl px-5">
          <Reveal>
            <h2 className="font-display text-4xl text-brand-cream sm:text-5xl">Stolingizni band qiling</h2>
            <p className="mt-5 text-brand-cream/60">
              Vizual zal xaritasidan o'zingizga yoqqan stolni tanlang — bir necha soniyada.
            </p>
            <Link href="/reservation" className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-red px-9 py-4 font-medium text-white transition hover:bg-brand-red-dark">
              Bron qilish <ArrowRight size={18} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ======================= REVIEWS ======================= */}
      <section className="bg-brand-cream py-24">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal className="mb-12 text-center">
            <p className="mb-3 text-sm uppercase tracking-[0.3em] text-brand-red">Mehmonlar</p>
            <h2 className="font-display text-4xl text-brand-ink sm:text-5xl">Ular biz haqimizda</h2>
          </Reveal>
          {reviews.length > 0 && (
            <RevealGroup className="mb-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-3xl border border-brand-gold/20 bg-white p-6 shadow-sm">
                  <div className="mb-3 flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} className={i < r.rating ? "fill-brand-gold text-brand-gold" : "text-neutral-200"} />
                    ))}
                  </div>
                  {r.comment && <p className="text-neutral-600">“{r.comment}”</p>}
                  <p className="mt-4 font-display text-lg text-brand-ink">{r.authorName}</p>
                  {r.reply && <p className="mt-2 rounded-xl bg-brand-cream p-3 text-sm text-neutral-500">{r.reply}</p>}
                </div>
              ))}
            </RevealGroup>
          )}
          <Reveal><ReviewForm /></Reveal>
        </div>
      </section>

      <SiteFooter locale={locale} />
    </>
  );
}
