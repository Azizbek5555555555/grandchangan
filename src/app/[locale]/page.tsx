import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { t, formatMoney } from "@/lib/utils";
import { Star, ArrowRight, Flame, Leaf, UtensilsCrossed, Crown, PartyPopper, ClipboardList } from "lucide-react";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import ReviewForm from "@/components/site/ReviewForm";
import Reveal from "@/components/motion/Reveal";
import RevealGroup from "@/components/motion/RevealGroup";
import TextReveal from "@/components/motion/TextReveal";
import Parallax from "@/components/motion/Parallax";
import Counter from "@/components/motion/Counter";
import Marquee from "@/components/motion/Marquee";
import ZoomImage from "@/components/motion/ZoomImage";
import HorizontalScroll from "@/components/motion/HorizontalScroll";
import RotateOnScroll from "@/components/motion/RotateOnScroll";

export const dynamic = "force-dynamic";

const spicyCount = (lvl: string) => ({ NONE: 0, MILD: 1, MEDIUM: 2, HOT: 3, EXTRA_HOT: 4 }[lvl] ?? 0);
const usable = (u?: string | null) => (u && (u.startsWith("/uploads") || u.startsWith("http")) ? u : null);

const EXPERIENCES = [
  { icon: UtensilsCrossed, title: "Zalda ovqatlanish", text: "An'anaviy Xitoy taomlari, issiq muhit va mukammal xizmat." },
  { icon: Crown, title: "VIP zallar", text: "Maxsus tadbirlar va yopiq uchrashuvlar uchun alohida zallar." },
  { icon: PartyPopper, title: "Tadbir va bazmlar", text: "To'y, yubiley, korporativ — zal va menyuni siz uchun tayyorlaymiz." },
  { icon: ClipboardList, title: "Oldindan buyurtma", text: "Bron paytida taomni tanlang — oshxona vaqtingizga tayyorlaydi." },
];

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tr = await getTranslations({ locale, namespace: "Home" });

  const [hero, featured, reviews, gallery, dishesCount, reviewAgg] = await Promise.all([
    prisma.banner.findFirst({ where: { position: "HERO", isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.menuItem.findMany({ where: { isFeatured: true, isAvailable: true }, take: 6, orderBy: { sortOrder: "asc" } }),
    prisma.review.findMany({ where: { status: "APPROVED" }, take: 6, orderBy: { createdAt: "desc" } }),
    prisma.galleryImage.findMany({ where: { isActive: true }, take: 8, orderBy: { sortOrder: "asc" } }),
    prisma.menuItem.count({ where: { isAvailable: true } }),
    prisma.review.aggregate({ _avg: { rating: true }, _count: true, where: { status: "APPROVED" } }),
  ]);

  const heroImg = usable(hero?.imageUrl);
  const avgRating = Number(reviewAgg._avg.rating ?? 4.8);
  const reviewCount = reviewAgg._count || 0;
  const g = gallery.map((x) => usable(x.url)).filter(Boolean) as string[];
  const bandImg = g[3] || g[0] || heroImg;
  const reserveImg = g[4] || g[1] || heroImg;

  return (
    <>
      <SiteHeader />

      {/* ==================== 1. HERO ==================== */}
      <section className="relative flex min-h-screen items-center overflow-hidden bg-brand-ink">
        {heroImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover animate-kenburns" />
        ) : (
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(60% 60% at 78% 12%, rgba(200,162,75,0.18) 0%, transparent 60%), radial-gradient(55% 55% at 8% 92%, rgba(179,18,23,0.22) 0%, transparent 55%)" }} />
        )}
        <div className="absolute inset-0 hero-scrim" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 text-center">
          <Reveal y={20}>
            <div className="mb-6 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-brand-gold" />
              <span className="text-xs uppercase tracking-[0.4em] text-brand-gold">Samarqand · 中国餐厅</span>
              <span className="h-px w-10 bg-brand-gold" />
            </div>
          </Reveal>
          <TextReveal as="h1" trigger="load" text={hero?.title ? t(hero.title, locale) : "GrandChangan"} className="font-display text-6xl leading-[1.02] text-brand-cream sm:text-8xl" />
          <Reveal y={20} delay={0.3}>
            <p className="mx-auto mt-6 max-w-xl text-lg text-brand-cream/70">{hero?.subtitle ? t(hero.subtitle, locale) : tr("hero_subtitle")}</p>
          </Reveal>
          <Reveal y={20} delay={0.45}>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/reservation" className="btn-gold-sheen group inline-flex items-center gap-2 rounded-full bg-brand-red px-8 py-4 text-sm font-medium text-white transition hover:bg-brand-red-dark">
                {tr("book_table")} <ArrowRight size={16} className="transition group-hover:translate-x-1" />
              </Link>
              <Link href="/menu" className="inline-flex items-center rounded-full border border-brand-cream/25 px-8 py-4 text-sm font-medium text-brand-cream transition hover:border-brand-gold hover:text-brand-gold-light">{tr("view_menu")}</Link>
            </div>
          </Reveal>
        </div>
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center">
          <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-brand-cream/50">Hikoya boshlanadi</p>
          <div className="mx-auto h-10 w-px bg-brand-cream/20"><div className="mx-auto h-2 w-px bg-brand-gold scroll-cue-dot" /></div>
        </div>
      </section>

      {/* ==================== 2. MARQUEE ==================== */}
      <div className="border-y border-brand-gold/20 bg-brand-ink py-5 font-display text-2xl text-brand-cream/80 sm:text-3xl">
        <Marquee items={["GrandChangan", "中国餐厅", "Sichuan", "Kanton", "Halal", "Samarqand", "Dim Sum", "An'ana"]} />
      </div>

      {/* ==================== 3. STORY ==================== */}
      <section className="overflow-hidden bg-brand-cream py-24 lg:py-36">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">
          <div className="relative h-[440px] rounded-3xl lg:h-[600px]">
            {g[0] ? (
              <ZoomImage src={g[0]} className="h-full w-full rounded-3xl" />
            ) : (
              <div className="flex h-full items-center justify-center rounded-3xl bg-brand-ink font-display text-3xl text-brand-gold/25">GrandChangan</div>
            )}
          </div>
          <div>
            <Reveal y={16}><p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-red">Biz haqimizda</p></Reveal>
            <TextReveal text="An'ana va lazzat" className="font-display text-5xl leading-tight text-brand-ink sm:text-6xl" />
            <TextReveal text="uyg'unligi" className="font-display text-5xl leading-tight accent-gold sm:text-6xl" delay={0.1} />
            <RevealGroup className="mt-8 space-y-5 text-lg" stagger={0.15} y={24}>
              <p className="text-neutral-600">GrandChangan — Samarqand markazidagi haqiqiy Xitoy taomlari maskani. Sichuan va Kanton uslublari, yangi mahsulotlar va issiq atmosferani bir dasturxonga jamladik.</p>
              <p className="text-neutral-600">Barcha mahsulotlar halal. Har bir taom — an&apos;ana va mahalliy didning nozik uyg&apos;unligi.</p>
            </RevealGroup>
            <Reveal y={16} delay={0.2}>
              <Link href="/about" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-brand-red">Batafsil <ArrowRight size={16} /></Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ==================== 3.5 SIGNATURE PLATE (aylanadigan tarelka) ==================== */}
      <section className="relative overflow-hidden bg-white py-28 lg:py-40">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <Reveal y={14}><p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-red">Har bir tarelka</p></Reveal>
          <div className="flex flex-wrap items-baseline justify-center gap-x-4">
            <TextReveal text="Bir" className="font-display text-5xl text-brand-ink sm:text-6xl" />
            <TextReveal text="hikoya" className="font-display text-5xl accent-gold sm:text-6xl" delay={0.1} />
          </div>
        </div>
        <div className="relative mx-auto mt-16 flex h-[400px] max-w-5xl items-center justify-center sm:h-[560px]">
          {g[5] ? (
            <Parallax speed={30} className="absolute left-2 top-4 hidden w-40 -rotate-6 sm:block lg:left-12">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g[5]} alt="" className="h-48 w-40 rounded-lg border-4 border-white object-cover shadow-2xl" />
            </Parallax>
          ) : null}
          {g[6] ? (
            <Parallax speed={-24} className="absolute bottom-2 right-2 hidden w-40 rotate-6 sm:block lg:right-12">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g[6]} alt="" className="h-48 w-40 rounded-lg border-4 border-white object-cover shadow-2xl" />
            </Parallax>
          ) : null}

          <RotateOnScroll deg={180} scaleFrom={0.75} className="relative h-72 w-72 sm:h-[440px] sm:w-[440px]">
            <div className="absolute inset-0 rounded-full border-[3px] border-brand-gold/60" />
            <div className="absolute inset-4 overflow-hidden rounded-full shadow-2xl">
              {g[2] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={g[2]} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-brand-cream font-display text-xl text-brand-gold/30">GrandChangan</div>
              )}
            </div>
          </RotateOnScroll>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-brand-ink/75 px-7 py-5 text-center backdrop-blur-sm">
              <p className="font-display text-2xl text-brand-cream sm:text-3xl">GrandChangan</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.35em] text-brand-gold">signature</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 4. PARALLAX QUOTE BAND ==================== */}
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-brand-ink text-center">
        {bandImg ? (
          <Parallax className="absolute -inset-y-[18%] inset-x-0" speed={14}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bandImg} alt="" className="h-full w-full object-cover opacity-60" />
          </Parallax>
        ) : (
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(50% 60% at 50% 40%, rgba(200,162,75,0.14), transparent 70%)" }} />
        )}
        <div className="absolute inset-0 bg-brand-ink/60" />
        <div className="relative z-10 mx-auto max-w-4xl px-6">
          <TextReveal text="Bu shunchaki ovqat emas —" className="font-display text-4xl leading-tight text-brand-cream sm:text-6xl" />
          <TextReveal text="bu hikoya." className="font-display text-4xl leading-tight accent-gold sm:text-6xl" delay={0.15} />
          <Reveal delay={0.3}><p className="mx-auto mt-8 max-w-lg text-brand-cream/60">Har bir taom o&apos;z hikoyasini so&apos;zlaydi — kelib, o&apos;tirib, birga baham ko&apos;ring.</p></Reveal>
        </div>
      </section>

      {/* ==================== 5. SIGNATURE DISHES ==================== */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="mb-16 text-center">
          <Reveal y={14}><p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-red">Menyudan tanlov</p></Reveal>
          <div className="flex flex-wrap items-baseline justify-center gap-x-4">
            <TextReveal text="Mashhur" className="font-display text-5xl text-brand-ink sm:text-6xl" />
            <TextReveal text="taomlar" className="font-display text-5xl accent-gold sm:text-6xl" delay={0.1} />
          </div>
        </div>
        {featured.length > 0 ? (
          <RevealGroup className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1} y={50}>
            {featured.map((it) => {
              const img = usable(it.imageUrl);
              return (
                <div key={it.id} className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white transition hover:border-brand-gold/40 hover:shadow-2xl">
                  <div className="relative h-64 overflow-hidden bg-brand-ink">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="h-full w-full object-cover transition duration-[900ms] group-hover:scale-110" />
                    ) : (
                      <div className="flex h-full items-center justify-center font-display text-2xl text-brand-gold/25">GrandChangan</div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-2xl text-brand-ink">{t(it.name, locale)}</h3>
                      <span className="whitespace-nowrap font-semibold text-brand-red">{formatMoney(Number(it.discountPrice ?? it.price))}</span>
                    </div>
                    {it.description ? <p className="mt-2 line-clamp-2 text-sm text-neutral-500">{t(it.description, locale)}</p> : null}
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
          <p className="rounded-3xl border border-dashed border-neutral-300 p-12 text-center text-neutral-400">Admin paneldan taomlarga &quot;TOP&quot; belgisini qo&apos;ying — bu yerda chiroyli chiqadi.</p>
        )}
      </section>

      {/* ==================== 6. HORIZONTAL EXPERIENCES ==================== */}
      <section className="bg-brand-ink text-brand-cream">
        <HorizontalScroll>
          {/* intro panel */}
          <div className="flex h-screen w-screen shrink-0 flex-col justify-center px-8 sm:w-[60vw] sm:px-16">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-brand-gold">Tajribalar</p>
            <h2 className="font-display text-5xl leading-tight sm:text-7xl">Sizni nima<br /><span className="accent-gold">kutmoqda</span></h2>
            <p className="mt-6 max-w-md text-brand-cream/60">Yon tomonga suring →</p>
          </div>
          {EXPERIENCES.map((e, i) => {
            const img = g[(i % g.length + g.length) % Math.max(g.length, 1)];
            return (
              <div key={i} className="flex h-screen w-[88vw] shrink-0 items-center px-4 sm:w-[520px] sm:px-6">
                <div className="w-full overflow-hidden rounded-3xl border border-brand-gold/20 bg-brand-ink-soft">
                  <div className="relative h-72 overflow-hidden">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-brand-ink"><e.icon size={44} className="text-brand-gold/40" /></div>
                    )}
                    <div className="absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-brand-ink/70 text-brand-gold"><e.icon size={20} /></div>
                    <span className="absolute right-5 top-4 font-display text-5xl text-brand-cream/15">0{i + 1}</span>
                  </div>
                  <div className="p-7">
                    <h3 className="font-display text-3xl text-brand-cream">{e.title}</h3>
                    <p className="mt-3 text-brand-cream/60">{e.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {/* end CTA panel */}
          <div className="flex h-screen w-screen shrink-0 flex-col items-center justify-center px-8 text-center sm:w-[50vw]">
            <h2 className="font-display text-4xl sm:text-5xl">Tayyormisiz?</h2>
            <Link href="/reservation" className="btn-gold-sheen mt-8 inline-flex items-center gap-2 rounded-full bg-brand-red px-9 py-4 font-medium text-white hover:bg-brand-red-dark">Stol band qilish <ArrowRight size={18} /></Link>
          </div>
        </HorizontalScroll>
      </section>

      {/* ==================== 7. STATS ==================== */}
      <section className="bg-brand-cream py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-y-12 md:grid-cols-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 font-display text-5xl text-brand-red sm:text-6xl"><Counter to={avgRating} decimals={1} /><Star size={24} className="fill-brand-gold text-brand-gold" /></div>
              <p className="mt-2 text-xs uppercase tracking-wider text-neutral-400">Reyting</p>
            </div>
            <div className="text-center">
              <div className="font-display text-5xl text-brand-red sm:text-6xl"><Counter to={Math.max(reviewCount, 12)} suffix="+" /></div>
              <p className="mt-2 text-xs uppercase tracking-wider text-neutral-400">Sharhlar</p>
            </div>
            <div className="text-center">
              <div className="font-display text-5xl text-brand-red sm:text-6xl"><Counter to={Math.max(dishesCount, 20)} suffix="+" /></div>
              <p className="mt-2 text-xs uppercase tracking-wider text-neutral-400">Taomlar</p>
            </div>
            <div className="text-center">
              <div className="font-display text-5xl text-brand-red sm:text-6xl">4</div>
              <p className="mt-2 text-xs uppercase tracking-wider text-neutral-400">Til</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 8. ATMOSPHERE ==================== */}
      {g.length >= 3 && (
        <section className="overflow-hidden bg-brand-cream pb-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 text-center">
              <Reveal y={14}><p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-red">Muhit</p></Reveal>
              <TextReveal text="Bizning zal" className="font-display text-5xl text-brand-ink sm:text-6xl" />
            </div>
            <div className="grid grid-cols-3 gap-4 sm:gap-6">
              <Parallax className="col-span-1" speed={16}><ZoomImage src={g[0]} className="h-64 w-full rounded-2xl sm:h-80" /></Parallax>
              <Parallax className="col-span-1 mt-12" speed={26}><ZoomImage src={g[1]} className="h-64 w-full rounded-2xl sm:h-80" /></Parallax>
              <Parallax className="col-span-1" speed={12}><ZoomImage src={g[2]} className="h-64 w-full rounded-2xl sm:h-80" /></Parallax>
            </div>
            <div className="mt-12 text-center">
              <Link href="/gallery" className="inline-flex items-center gap-2 rounded-full border border-brand-ink/20 px-8 py-3 text-sm font-medium text-brand-ink transition hover:bg-brand-ink hover:text-brand-cream">Butun galereya <ArrowRight size={16} /></Link>
            </div>
          </div>
        </section>
      )}

      {/* ==================== 9. RESERVE CTA ==================== */}
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-brand-ink text-center">
        {reserveImg ? (
          <Parallax className="absolute -inset-y-[18%] inset-x-0" speed={12}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={reserveImg} alt="" className="h-full w-full object-cover opacity-50" />
          </Parallax>
        ) : (
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(50% 60% at 50% 50%, rgba(179,18,23,0.25), transparent 70%)" }} />
        )}
        <div className="absolute inset-0 bg-brand-ink/55" />
        <div className="relative z-10 mx-auto max-w-3xl px-6">
          <Reveal y={16}><p className="mb-4 text-xs uppercase tracking-[0.3em] text-brand-gold">Bron</p></Reveal>
          <TextReveal text="Stolingizni band qiling" className="font-display text-5xl text-brand-cream sm:text-7xl" />
          <Reveal y={16} delay={0.2}><p className="mx-auto mt-6 max-w-lg text-brand-cream/60">Vizual zal xaritasidan stol tanlang, taomni oldindan buyurtma qiling — bir necha soniyada.</p></Reveal>
          <Reveal y={16} delay={0.35}>
            <Link href="/reservation" className="btn-gold-sheen mt-10 inline-flex items-center gap-2 rounded-full bg-brand-red px-10 py-4 font-medium text-white transition hover:bg-brand-red-dark">Bron qilish <ArrowRight size={18} /></Link>
          </Reveal>
        </div>
      </section>

      {/* ==================== 10. REVIEWS ==================== */}
      <section className="bg-white py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <Reveal y={14}><p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-red">Mehmonlar fikri</p></Reveal>
            <TextReveal text="Ular biz haqimizda" className="font-display text-5xl text-brand-ink sm:text-6xl" />
          </div>
          {reviews.length > 0 && (
            <RevealGroup className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1} y={40}>
              {reviews.map((r) => (
                <div key={r.id} className="rounded-3xl border border-neutral-200 bg-brand-cream/40 p-7">
                  <div className="mb-3 flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} className={i < r.rating ? "fill-brand-gold text-brand-gold" : "text-neutral-200"} />)}</div>
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
