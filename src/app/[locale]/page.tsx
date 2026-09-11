import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { t, formatMoney } from "@/lib/utils";
import { Star, ArrowRight, Clock, MapPin, Phone, Flame, Leaf } from "lucide-react";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import ReviewForm from "@/components/site/ReviewForm";
import Reveal from "@/components/motion/Reveal";
import RevealGroup from "@/components/motion/RevealGroup";

export const dynamic = "force-dynamic";

const spicyCount = (lvl: string) => ({ NONE: 0, MILD: 1, MEDIUM: 2, HOT: 3, EXTRA_HOT: 4 }[lvl] ?? 0);

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tr = await getTranslations({ locale, namespace: "Home" });

  const [hero, featured, reviews, general] = await Promise.all([
    prisma.banner.findFirst({ where: { position: "HERO", isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.menuItem.findMany({ where: { isFeatured: true, isAvailable: true }, take: 6, orderBy: { sortOrder: "asc" } }),
    prisma.review.findMany({ where: { status: "APPROVED" }, take: 6, orderBy: { createdAt: "desc" } }),
    prisma.siteSetting.findUnique({ where: { key: "general" } }),
  ]);

  const g = (general?.value as Record<string, unknown>) || {};
  const phone = Array.isArray(g.phones) ? (g.phones as string[])[0] : "+998 66 000 00 00";
  const address = (g.address as string) || "Samarqand markazi";
  // Faqat haqiqiy yuklangan rasmni ko'rsatamiz (buzuq placeholder yo'l emas)
  const heroImg = hero?.imageUrl && (hero.imageUrl.startsWith("/uploads") || hero.imageUrl.startsWith("http"))
    ? hero.imageUrl : null;

  return (
    <>
      <SiteHeader />

      {/* ================= HERO ================= */}
      <section className="relative flex min-h-screen items-center overflow-hidden bg-brand-ink">
        {heroImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(60% 60% at 80% 15%, rgba(200,162,75,0.16) 0%, transparent 60%), radial-gradient(50% 50% at 10% 90%, rgba(179,18,23,0.18) 0%, transparent 55%)",
            }}
          />
        )}
        <div className="absolute inset-0 hero-scrim" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
          <div className="max-w-2xl">
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-10 bg-brand-gold" />
              <span className="text-xs uppercase tracking-[0.35em] text-brand-gold">Samarqand · 中国餐厅</span>
            </div>
            <h1 className="font-display text-5xl leading-[1.05] text-brand-cream sm:text-7xl">
              {hero?.title ? t(hero.title, locale) : "GrandChangan"}
            </h1>
            <p className="mt-6 max-w-lg text-lg text-brand-cream/70">
              {hero?.subtitle ? t(hero.subtitle, locale) : tr("hero_subtitle")}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/reservation" className="group inline-flex items-center gap-2 rounded-full bg-brand-red px-8 py-4 text-sm font-medium text-white transition hover:bg-brand-red-dark">
                {tr("book_table")} <ArrowRight size={16} className="transition group-hover:translate-x-1" />
              </Link>
              <Link href="/menu" className="inline-flex items-center rounded-full border border-brand-cream/25 px-8 py-4 text-sm font-medium text-brand-cream transition hover:border-brand-gold hover:text-brand-gold-light">
                {tr("view_menu")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= INFO STRIP ================= */}
      <section className="border-b border-neutral-200 bg-brand-cream">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-neutral-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex items-center gap-3 px-6 py-6">
            <Clock size={22} className="text-brand-red" />
            <div><p className="text-xs uppercase tracking-wider text-neutral-400">Ish vaqti</p><p className="font-medium text-brand-ink">Har kuni · 11:00 – 23:00</p></div>
          </div>
          <div className="flex items-center gap-3 px-6 py-6">
            <MapPin size={22} className="text-brand-red" />
            <div><p className="text-xs uppercase tracking-wider text-neutral-400">Manzil</p><p className="font-medium text-brand-ink">{address}</p></div>
          </div>
          <div className="flex items-center gap-3 px-6 py-6">
            <Phone size={22} className="text-brand-red" />
            <div><p className="text-xs uppercase tracking-wider text-neutral-400">Telefon</p><p className="font-medium text-brand-ink">{phone}</p></div>
          </div>
        </div>
      </section>

      {/* ================= SIGNATURE DISHES ================= */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <Reveal>
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-red">Menyudan tanlov</p>
            <h2 className="font-display text-4xl text-brand-ink sm:text-5xl">Mashhur taomlar</h2>
          </Reveal>
          <Link href="/menu" className="group inline-flex items-center gap-2 text-sm font-medium text-brand-ink">
            To'liq menyu <ArrowRight size={16} className="transition group-hover:translate-x-1" />
          </Link>
        </div>

        {featured.length > 0 ? (
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((it) => {
              const img = it.imageUrl && (it.imageUrl.startsWith("/uploads") || it.imageUrl.startsWith("http")) ? it.imageUrl : null;
              return (
                <div key={it.id} className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-brand-gold/40 hover:shadow-xl">
                  <div className="relative h-52 overflow-hidden bg-brand-ink">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center font-display text-2xl text-brand-gold/25">GrandChangan</div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-xl text-brand-ink">{t(it.name, locale)}</h3>
                      <span className="whitespace-nowrap font-semibold text-brand-red">{formatMoney(Number(it.discountPrice ?? it.price))}</span>
                    </div>
                    {it.description ? <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{t(it.description, locale)}</p> : null}
                    <div className="mt-3 flex items-center gap-2">
                      {Array.from({ length: spicyCount(it.spicyLevel) }).map((_, i) => <Flame key={i} size={13} className="text-brand-red" />)}
                      {it.isVegetarian && <Leaf size={13} className="text-green-600" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </RevealGroup>
        ) : (
          <p className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-neutral-400">
            Hali &quot;TOP&quot; belgilangan taom yo&apos;q. Admin paneldan taomga &quot;TOP&quot; belgisini qo&apos;ying.
          </p>
        )}
      </section>

      {/* ================= STORY ================= */}
      <section className="bg-brand-ink py-24 text-brand-cream">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
          <Reveal>
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-gold">Biz haqimizda</p>
            <h2 className="font-display text-4xl leading-tight text-brand-cream sm:text-5xl">An&apos;ana va lazzat uyg&apos;unligi</h2>
            <p className="mt-6 text-brand-cream/70">
              GrandChangan — Samarqand markazidagi haqiqiy Xitoy taomlari maskani. Sichuan va Kanton
              uslublari, yangi mahsulotlar va issiq atmosferani bir dasturxonga jamladik.
            </p>
            <p className="mt-4 text-brand-cream/70">Barcha mahsulotlar halal. Har bir taom — an&apos;ana va mahalliy didning nozik uyg&apos;unligi.</p>
            <Link href="/about" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-brand-gold-light">
              Batafsil <ArrowRight size={16} />
            </Link>
          </Reveal>
          <RevealGroup className="grid grid-cols-2 gap-5">
            <div className="rounded-2xl border border-brand-gold/25 p-8 text-center"><p className="font-display text-4xl text-brand-gold-light">50+</p><p className="mt-1 text-sm text-brand-cream/50">taom turi</p></div>
            <div className="mt-8 rounded-2xl border border-brand-gold/25 p-8 text-center"><p className="font-display text-4xl text-brand-gold-light">4</p><p className="mt-1 text-sm text-brand-cream/50">til: UZ/RU/EN/中文</p></div>
            <div className="rounded-2xl border border-brand-gold/25 p-8 text-center"><p className="font-display text-4xl text-brand-gold-light">VIP</p><p className="mt-1 text-sm text-brand-cream/50">alohida zallar</p></div>
            <div className="mt-8 rounded-2xl bg-brand-red p-8 text-center"><p className="font-display text-4xl text-white">11–23</p><p className="mt-1 text-sm text-white/70">har kuni ochiq</p></div>
          </RevealGroup>
        </div>
      </section>

      {/* ================= RESERVATION CTA ================= */}
      <section className="bg-brand-cream py-24">
        <Reveal className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl text-brand-ink sm:text-5xl">Stolingizni band qiling</h2>
          <p className="mx-auto mt-5 max-w-lg text-neutral-500">Vizual zal xaritasidan o&apos;zingizga yoqqan stolni tanlang — bir necha soniyada.</p>
          <Link href="/reservation" className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-red px-9 py-4 font-medium text-white transition hover:bg-brand-red-dark">
            Bron qilish <ArrowRight size={18} />
          </Link>
        </Reveal>
      </section>

      {/* ================= REVIEWS ================= */}
      <section className="border-t border-neutral-200 bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mb-14 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-red">Mehmonlar fikri</p>
            <h2 className="font-display text-4xl text-brand-ink sm:text-5xl">Ular biz haqimizda</h2>
          </Reveal>
          {reviews.length > 0 && (
            <RevealGroup className="mb-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-neutral-200 bg-brand-cream/40 p-6">
                  <div className="mb-3 flex">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={15} className={i < r.rating ? "fill-brand-gold text-brand-gold" : "text-neutral-200"} />)}
                  </div>
                  {r.comment && <p className="text-neutral-600">“{r.comment}”</p>}
                  <p className="mt-4 font-display text-lg text-brand-ink">{r.authorName}</p>
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
