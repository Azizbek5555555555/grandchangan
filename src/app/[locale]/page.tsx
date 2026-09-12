import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { t, formatMoney } from "@/lib/utils";
import { Star, ArrowRight, Flame, Leaf } from "lucide-react";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import ReviewForm from "@/components/site/ReviewForm";
import Reveal from "@/components/motion/Reveal";
import RevealGroup from "@/components/motion/RevealGroup";
import TextReveal from "@/components/motion/TextReveal";
import Parallax from "@/components/motion/Parallax";
import Counter from "@/components/motion/Counter";

export const dynamic = "force-dynamic";

const spicyCount = (lvl: string) => ({ NONE: 0, MILD: 1, MEDIUM: 2, HOT: 3, EXTRA_HOT: 4 }[lvl] ?? 0);
const usable = (u?: string | null) => (u && (u.startsWith("/uploads") || u.startsWith("http")) ? u : null);

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tr = await getTranslations({ locale, namespace: "Home" });

  const [hero, featured, reviews, gallery, dishesCount, reviewAgg] = await Promise.all([
    prisma.banner.findFirst({ where: { position: "HERO", isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.menuItem.findMany({ where: { isFeatured: true, isAvailable: true }, take: 6, orderBy: { sortOrder: "asc" } }),
    prisma.review.findMany({ where: { status: "APPROVED" }, take: 6, orderBy: { createdAt: "desc" } }),
    prisma.galleryImage.findMany({ where: { isActive: true }, take: 5, orderBy: { sortOrder: "asc" } }),
    prisma.menuItem.count({ where: { isAvailable: true } }),
    prisma.review.aggregate({ _avg: { rating: true }, _count: true, where: { status: "APPROVED" } }),
  ]);

  const heroImg = usable(hero?.imageUrl);
  const avgRating = Number(reviewAgg._avg.rating ?? 4.8);
  const reviewCount = reviewAgg._count || 0;
  const galleryImgs = gallery.map((g) => usable(g.url)).filter(Boolean) as string[];

  return (
    <>
      <SiteHeader />

      {/* ==================== HERO ==================== */}
      <section className="relative flex min-h-screen items-center overflow-hidden bg-brand-ink">
        {heroImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover animate-kenburns" />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(60% 60% at 80% 12%, rgba(200,162,75,0.16) 0%, transparent 60%), radial-gradient(55% 55% at 8% 92%, rgba(179,18,23,0.20) 0%, transparent 55%)",
            }}
          />
        )}
        <div className="absolute inset-0 hero-scrim" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
          <div className="max-w-2xl">
            <Reveal y={20}>
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-10 bg-brand-gold" />
                <span className="text-xs uppercase tracking-[0.35em] text-brand-gold">Samarqand · 中国餐厅</span>
              </div>
            </Reveal>
            <TextReveal
              as="h1"
              trigger="load"
              text={hero?.title ? t(hero.title, locale) : "GrandChangan"}
              className="font-display text-5xl leading-[1.05] text-brand-cream sm:text-7xl"
            />
            <Reveal y={20} delay={0.3}>
              <p className="mt-6 max-w-lg text-lg text-brand-cream/70">
                {hero?.subtitle ? t(hero.subtitle, locale) : tr("hero_subtitle")}
              </p>
            </Reveal>
            <Reveal y={20} delay={0.45}>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/reservation" className="btn-gold-sheen group inline-flex items-center gap-2 rounded-full bg-brand-red px-8 py-4 text-sm font-medium text-white transition hover:bg-brand-red-dark">
                  {tr("book_table")} <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </Link>
                <Link href="/menu" className="inline-flex items-center rounded-full border border-brand-cream/25 px-8 py-4 text-sm font-medium text-brand-cream transition hover:border-brand-gold hover:text-brand-gold-light">
                  {tr("view_menu")}
                </Link>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center">
          <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-brand-cream/50">Pastga suring</p>
          <div className="mx-auto h-10 w-px bg-brand-cream/20">
            <div className="mx-auto h-2 w-px bg-brand-gold scroll-cue-dot" />
          </div>
        </div>
      </section>

      {/* ==================== STORY ==================== */}
      <section className="overflow-hidden bg-brand-cream py-24 lg:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
          <div className="relative h-[420px] overflow-hidden rounded-3xl lg:h-[560px]">
            <Parallax className="absolute -inset-y-[12%] inset-x-0" speed={8}>
              {galleryImgs[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={galleryImgs[0]} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center bg-brand-ink font-display text-3xl text-brand-gold/25">GrandChangan</div>
              )}
            </Parallax>
          </div>
          <div>
            <Reveal y={16}><p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-red">Biz haqimizda</p></Reveal>
            <TextReveal text="An'ana va lazzat uyg'unligi" className="font-display text-4xl leading-tight text-brand-ink sm:text-5xl" />
            <RevealGroup className="mt-6 space-y-4" stagger={0.15} y={20}>
              <p className="text-neutral-600">
                GrandChangan — Samarqand markazidagi haqiqiy Xitoy taomlari maskani. Sichuan va Kanton
                uslublari, yangi mahsulotlar va issiq atmosferani bir dasturxonga jamladik.
              </p>
              <p className="text-neutral-600">Barcha mahsulotlar halal. Har bir taom — an&apos;ana va mahalliy didning nozik uyg&apos;unligi.</p>
              <blockquote className="border-l-2 border-brand-gold pl-5 font-display text-xl italic text-brand-ink">
                &ldquo;Bu shunchaki ovqat emas — bu hikoya. Dasturxonimizga marhamat.&rdquo;
              </blockquote>
            </RevealGroup>
            <Reveal y={16} delay={0.2}>
              <Link href="/about" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-brand-red">
                Batafsil <ArrowRight size={16} />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ==================== SIGNATURE DISHES ==================== */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <Reveal y={14}><p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-red">Menyudan tanlov</p></Reveal>
            <TextReveal text="Mashhur taomlar" className="font-display text-4xl text-brand-ink sm:text-5xl" />
          </div>
          <Link href="/menu" className="group inline-flex items-center gap-2 text-sm font-medium text-brand-ink">
            To&apos;liq menyu <ArrowRight size={16} className="transition group-hover:translate-x-1" />
          </Link>
        </div>

        {featured.length > 0 ? (
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1} y={40}>
            {featured.map((it) => {
              const img = usable(it.imageUrl);
              return (
                <div key={it.id} className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-brand-gold/40 hover:shadow-xl">
                  <div className="relative h-56 overflow-hidden bg-brand-ink">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
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

      {/* ==================== STATS BAND ==================== */}
      <section className="relative overflow-hidden bg-brand-ink py-24 text-brand-cream">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mb-14 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-gold">Raqamlarda</p>
            <TextReveal text="Ishonch va sifat" className="font-display text-4xl text-brand-cream sm:text-5xl" />
          </Reveal>
          <div className="grid grid-cols-2 gap-y-10 rounded-3xl border border-brand-gold/20 py-12 md:grid-cols-4">
            <div className="border-brand-gold/15 text-center md:border-r">
              <div className="flex items-center justify-center gap-1 font-display text-4xl text-brand-gold-light sm:text-5xl">
                <Counter to={avgRating} decimals={1} /> <Star size={22} className="fill-brand-gold text-brand-gold" />
              </div>
              <p className="mt-2 text-xs uppercase tracking-wider text-brand-cream/50">Reyting</p>
            </div>
            <div className="border-brand-gold/15 text-center md:border-r">
              <div className="font-display text-4xl text-brand-gold-light sm:text-5xl"><Counter to={Math.max(reviewCount, 12)} suffix="+" /></div>
              <p className="mt-2 text-xs uppercase tracking-wider text-brand-cream/50">Sharhlar</p>
            </div>
            <div className="border-brand-gold/15 text-center md:border-r">
              <div className="font-display text-4xl text-brand-gold-light sm:text-5xl"><Counter to={Math.max(dishesCount, 20)} suffix="+" /></div>
              <p className="mt-2 text-xs uppercase tracking-wider text-brand-cream/50">Taomlar</p>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl text-brand-gold-light sm:text-5xl">4</div>
              <p className="mt-2 text-xs uppercase tracking-wider text-brand-cream/50">Til</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== ATMOSPHERE (parallax gallery) ==================== */}
      {galleryImgs.length >= 3 && (
        <section className="overflow-hidden bg-brand-cream py-24">
          <div className="mx-auto max-w-7xl px-6">
            <Reveal className="mb-12 text-center">
              <p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-red">Muhit</p>
              <TextReveal text="Bizning zal" className="font-display text-4xl text-brand-ink sm:text-5xl" />
            </Reveal>
            <div className="grid grid-cols-3 gap-4">
              <Parallax className="col-span-1" speed={14}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={galleryImgs[0]} alt="" className="h-72 w-full rounded-2xl object-cover" />
              </Parallax>
              <Parallax className="col-span-1 mt-10" speed={22}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={galleryImgs[1]} alt="" className="h-72 w-full rounded-2xl object-cover" />
              </Parallax>
              <Parallax className="col-span-1" speed={10}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={galleryImgs[2]} alt="" className="h-72 w-full rounded-2xl object-cover" />
              </Parallax>
            </div>
            <div className="mt-10 text-center">
              <Link href="/gallery" className="inline-flex items-center gap-2 rounded-full border border-brand-ink/20 px-8 py-3 text-sm font-medium text-brand-ink transition hover:bg-brand-ink hover:text-brand-cream">
                Butun galereya <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ==================== RESERVATION CTA ==================== */}
      <section className="relative overflow-hidden bg-brand-ink-soft py-28 text-center">
        <div className="relative z-10 mx-auto max-w-2xl px-6">
          <TextReveal text="Stolingizni band qiling" className="font-display text-4xl text-brand-cream sm:text-5xl" />
          <Reveal y={16} delay={0.15}>
            <p className="mx-auto mt-5 max-w-lg text-brand-cream/60">Vizual zal xaritasidan o&apos;zingizga yoqqan stolni tanlang — bir necha soniyada. Xohlasangiz taomni oldindan buyurtma qiling.</p>
          </Reveal>
          <Reveal y={16} delay={0.3}>
            <Link href="/reservation" className="btn-gold-sheen mt-8 inline-flex items-center gap-2 rounded-full bg-brand-red px-9 py-4 font-medium text-white transition hover:bg-brand-red-dark">
              Bron qilish <ArrowRight size={18} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ==================== REVIEWS ==================== */}
      <section className="border-t border-neutral-200 bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mb-14 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-red">Mehmonlar fikri</p>
            <TextReveal text="Ular biz haqimizda" className="font-display text-4xl text-brand-ink sm:text-5xl" />
          </Reveal>
          {reviews.length > 0 && (
            <RevealGroup className="mb-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1} y={30}>
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-neutral-200 bg-brand-cream/40 p-6">
                  <div className="mb-3 flex">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={15} className={i < r.rating ? "fill-brand-gold text-brand-gold" : "text-neutral-200"} />)}
                  </div>
                  {r.comment && <p className="text-neutral-600">&ldquo;{r.comment}&rdquo;</p>}
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
