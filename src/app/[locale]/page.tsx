import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { t, formatMoney } from "@/lib/utils";
import { Star, ArrowRight, Flame, Leaf, UtensilsCrossed } from "lucide-react";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import ReviewForm from "@/components/site/ReviewForm";
import Reveal from "@/components/motion/Reveal";
import RevealGroup from "@/components/motion/RevealGroup";
import TextReveal from "@/components/motion/TextReveal";
import Parallax from "@/components/motion/Parallax";
import Counter from "@/components/motion/Counter";
import ZoomImage from "@/components/motion/ZoomImage";
import HorizontalScroll from "@/components/motion/HorizontalScroll";
import RotateOnScroll from "@/components/motion/RotateOnScroll";

export const dynamic = "force-dynamic";

const spicyCount = (lvl: string) => ({ NONE: 0, MILD: 1, MEDIUM: 2, HOT: 3, EXTRA_HOT: 4 }[lvl] ?? 0);
const usable = (u?: string | null) => (u && (u.startsWith("/uploads") || u.startsWith("http")) ? u : null);

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tr = await getTranslations({ locale, namespace: "Home" });
  const st = await getTranslations({ locale, namespace: "Site" });

  const [hero, featured, reviews, gallery, dishesCount, reviewAgg, showcaseBanners] = await Promise.all([
    prisma.banner.findFirst({ where: { position: "HERO", isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.menuItem.findMany({ where: { isFeatured: true, isAvailable: true }, take: 6, orderBy: { sortOrder: "asc" } }),
    prisma.review.findMany({ where: { status: "APPROVED" }, take: 6, orderBy: { createdAt: "desc" } }),
    prisma.galleryImage.findMany({ where: { isActive: true }, take: 8, orderBy: { sortOrder: "asc" } }),
    prisma.menuItem.count({ where: { isAvailable: true } }),
    prisma.review.aggregate({ _avg: { rating: true }, _count: true, where: { status: "APPROVED" } }),
    prisma.banner.findMany({ where: { position: "HOME_SECONDARY", isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  const heroImg = usable(hero?.imageUrl);
  const avgRating = Number(reviewAgg._avg.rating ?? 4.8);
  const reviewCount = reviewAgg._count || 0;
  const g = gallery.map((x) => usable(x.url)).filter(Boolean) as string[];
  const bandImg = g[3] || g[0] || heroImg;
  const reserveImg = g[4] || g[1] || heroImg;
  const showcase = showcaseBanners.length
    ? showcaseBanners.map((b, i) => ({ title: t(b.title, locale) || `Karta ${i + 1}`, text: b.subtitle ? t(b.subtitle, locale) : "", img: usable(b.imageUrl) }))
    : [
        { title: st("sc1t"), text: st("sc1x") },
        { title: st("sc2t"), text: st("sc2x") },
        { title: st("sc3t"), text: st("sc3x") },
        { title: st("sc4t"), text: st("sc4x") },
      ].map((d, i) => ({ ...d, img: g.length ? g[i % g.length] : null }));

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
          <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-brand-cream/50">{st("scrollCue")}</p>
          <div className="mx-auto h-10 w-px bg-brand-cream/20"><div className="mx-auto h-2 w-px bg-brand-gold scroll-cue-dot" /></div>
        </div>
      </section>

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
            <Reveal y={16}><p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-red">{st("storyEyebrow")}</p></Reveal>
            <TextReveal text={st("storyTitle1")} className="font-display text-5xl leading-tight text-brand-ink sm:text-6xl" />
            <TextReveal text={st("storyTitle2")} className="font-display text-5xl leading-tight accent-gold sm:text-6xl" delay={0.1} />
            <RevealGroup className="mt-8 space-y-5 text-lg" stagger={0.15} y={24}>
              <p className="text-neutral-600">{st("storyP1")}</p>
              <p className="text-neutral-600">{st("storyP2")}</p>
            </RevealGroup>
            <Reveal y={16} delay={0.2}>
              <Link href="/about" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-brand-red">{st("more")} <ArrowRight size={16} /></Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ==================== 3.5 SIGNATURE PLATE (aylanadigan tarelka) ==================== */}
      <section className="relative overflow-hidden bg-white py-28 lg:py-40">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <Reveal y={14}><p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-red">{st("plateEyebrow")}</p></Reveal>
          <div className="flex flex-wrap items-baseline justify-center gap-x-4">
            <TextReveal text={st("plateTitle1")} className="font-display text-5xl text-brand-ink sm:text-6xl" />
            <TextReveal text={st("plateTitle2")} className="font-display text-5xl accent-gold sm:text-6xl" delay={0.1} />
          </div>
        </div>
        <div className="relative mx-auto mt-16 flex h-[460px] max-w-6xl items-center justify-center sm:h-[620px]">
          {g[5] ? (
            <Parallax speed={34} className="absolute -left-2 top-0 hidden w-56 -rotate-6 sm:block lg:left-4 lg:w-72">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g[5]} alt="" className="h-72 w-56 rounded-xl border-4 border-white object-cover shadow-2xl lg:h-96 lg:w-72" />
            </Parallax>
          ) : null}
          {g[6] ? (
            <Parallax speed={-28} className="absolute -right-2 bottom-0 hidden w-56 rotate-6 sm:block lg:right-4 lg:w-72">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g[6]} alt="" className="h-72 w-56 rounded-xl border-4 border-white object-cover shadow-2xl lg:h-96 lg:w-72" />
            </Parallax>
          ) : null}

          {g[7] ? (
            <Parallax speed={-40} className="absolute right-24 top-0 hidden w-40 rotate-3 lg:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g[7]} alt="" className="h-52 w-40 rounded-xl border-4 border-white object-cover shadow-2xl" />
            </Parallax>
          ) : null}
          {g[3] ? (
            <Parallax speed={44} className="absolute bottom-2 left-24 hidden w-40 -rotate-3 lg:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g[3]} alt="" className="h-52 w-40 rounded-xl border-4 border-white object-cover shadow-2xl" />
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
          <TextReveal text={st("quote1")} className="font-display text-4xl leading-tight text-brand-cream sm:text-6xl" />
          <TextReveal text={st("quote2")} className="font-display text-4xl leading-tight accent-gold sm:text-6xl" delay={0.15} />
          <Reveal delay={0.3}><p className="mx-auto mt-8 max-w-lg text-brand-cream/60">{st("quoteSub")}</p></Reveal>
        </div>
      </section>

      {/* ==================== 5. SIGNATURE DISHES ==================== */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="mb-16 text-center">
          <Reveal y={14}><p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-red">{st("dishesEyebrow")}</p></Reveal>
          <div className="flex flex-wrap items-baseline justify-center gap-x-4">
            <TextReveal text={st("dishesTitle1")} className="font-display text-5xl text-brand-ink sm:text-6xl" />
            <TextReveal text={st("dishesTitle2")} className="font-display text-5xl accent-gold sm:text-6xl" delay={0.1} />
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
          <p className="rounded-3xl border border-dashed border-neutral-300 p-12 text-center text-neutral-400">{st("dishesEmpty")}</p>
        )}
      </section>

      {/* ==================== 6. HORIZONTAL SHOWCASE ==================== */}
      <section className="bg-brand-ink text-brand-cream">
        <div className="mx-auto max-w-7xl px-6 pt-24 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-gold">{st("scEyebrow")}</p>
          <div className="flex flex-wrap items-baseline justify-center gap-x-4">
            <TextReveal text={st("scTitle1")} className="font-display text-5xl sm:text-6xl" />
            <TextReveal text={st("scTitle2")} className="font-display text-5xl accent-gold sm:text-6xl" delay={0.1} />
          </div>
          <p className="mt-4 text-sm text-brand-cream/40">{st("scHint")}</p>
        </div>
        <HorizontalScroll>
          <div className="h-1 w-[26vw] shrink-0 sm:w-[30vw]" />
          {showcase.map((e, i) => (
            <div key={i} data-hs-card className="mx-4 flex h-[80vh] w-[82vw] shrink-0 items-center sm:mx-6 sm:w-[640px]">
              <div className="w-full overflow-hidden rounded-[2rem] border border-brand-gold/20 bg-brand-ink-soft">
                <div className="relative h-[46vh] overflow-hidden sm:h-[440px]">
                  {e.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.img} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-brand-ink"><UtensilsCrossed size={64} className="text-brand-gold/40" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-ink-soft via-transparent to-transparent" />
                  <span className="absolute right-7 top-5 font-display text-7xl text-brand-cream/15">0{i + 1}</span>
                </div>
                <div className="p-9">
                  <h3 className="font-display text-4xl text-brand-cream">{e.title}</h3>
                  {e.text ? <p className="mt-4 max-w-md text-lg text-brand-cream/60">{e.text}</p> : null}
                </div>
              </div>
            </div>
          ))}
          <div className="flex h-[80vh] w-[70vw] shrink-0 items-center justify-center px-8 text-center sm:w-[46vw]">
            <div>
              <h2 className="font-display text-4xl sm:text-5xl">{st("scCta1")}<br /><span className="accent-gold">{st("scCta2")}</span></h2>
              <Link href="/reservation" className="btn-gold-sheen mt-8 inline-flex items-center gap-2 rounded-full bg-brand-red px-9 py-4 font-medium text-white hover:bg-brand-red-dark">Stol band qilish <ArrowRight size={18} /></Link>
            </div>
          </div>
          <div className="h-1 w-[10vw] shrink-0" />
        </HorizontalScroll>
      </section>

      {/* ==================== 7. STATS ==================== */}
      <section className="bg-brand-cream py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-y-12 md:grid-cols-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 font-display text-5xl text-brand-red sm:text-6xl"><Counter to={avgRating} decimals={1} /><Star size={24} className="fill-brand-gold text-brand-gold" /></div>
              <p className="mt-2 text-xs uppercase tracking-wider text-neutral-400">{st("statRating")}</p>
            </div>
            <div className="text-center">
              <div className="font-display text-5xl text-brand-red sm:text-6xl"><Counter to={Math.max(reviewCount, 12)} suffix="+" /></div>
              <p className="mt-2 text-xs uppercase tracking-wider text-neutral-400">{st("statReviews")}</p>
            </div>
            <div className="text-center">
              <div className="font-display text-5xl text-brand-red sm:text-6xl"><Counter to={Math.max(dishesCount, 20)} suffix="+" /></div>
              <p className="mt-2 text-xs uppercase tracking-wider text-neutral-400">{st("statDishes")}</p>
            </div>
            <div className="text-center">
              <div className="font-display text-5xl text-brand-red sm:text-6xl">4</div>
              <p className="mt-2 text-xs uppercase tracking-wider text-neutral-400">{st("statLangs")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 8. ATMOSPHERE ==================== */}
      {g.length >= 3 && (
        <section className="overflow-hidden bg-brand-cream pb-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 text-center">
              <Reveal y={14}><p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-red">{st("atmoEyebrow")}</p></Reveal>
              <TextReveal text={st("atmoTitle")} className="font-display text-5xl text-brand-ink sm:text-6xl" />
            </div>
            <div className="grid grid-cols-3 gap-4 sm:gap-6">
              <Parallax className="col-span-1" speed={16}><ZoomImage src={g[0]} className="h-64 w-full rounded-2xl sm:h-80" /></Parallax>
              <Parallax className="col-span-1 mt-12" speed={26}><ZoomImage src={g[1]} className="h-64 w-full rounded-2xl sm:h-80" /></Parallax>
              <Parallax className="col-span-1" speed={12}><ZoomImage src={g[2]} className="h-64 w-full rounded-2xl sm:h-80" /></Parallax>
            </div>
            <div className="mt-12 text-center">
              <Link href="/gallery" className="inline-flex items-center gap-2 rounded-full border border-brand-ink/20 px-8 py-3 text-sm font-medium text-brand-ink transition hover:bg-brand-ink hover:text-brand-cream">{st("fullGallery")} <ArrowRight size={16} /></Link>
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
          <Reveal y={16}><p className="mb-4 text-xs uppercase tracking-[0.3em] text-brand-gold">{st("reserveEyebrow")}</p></Reveal>
          <TextReveal text={st("reserveTitle")} className="font-display text-5xl text-brand-cream sm:text-7xl" />
          <Reveal y={16} delay={0.2}><p className="mx-auto mt-6 max-w-lg text-brand-cream/60">{st("reserveSub")}</p></Reveal>
          <Reveal y={16} delay={0.35}>
            <Link href="/reservation" className="btn-gold-sheen mt-10 inline-flex items-center gap-2 rounded-full bg-brand-red px-10 py-4 font-medium text-white transition hover:bg-brand-red-dark">{st("reserveBtn")} <ArrowRight size={18} /></Link>
          </Reveal>
        </div>
      </section>

      {/* ==================== 10. REVIEWS ==================== */}
      <section className="relative overflow-hidden bg-brand-ink py-28 text-brand-cream">
        <span className="pointer-events-none absolute -left-10 bottom-0 select-none font-display text-[14rem] leading-none text-white/[0.03]">评价</span>
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-gold">{st("reviewsEyebrow")}</p>
            <TextReveal text={st("reviewsTitle")} className="font-display text-5xl text-brand-cream sm:text-6xl" />
            <div className="mx-auto mt-6 w-40"><div className="animated-line" /></div>
          </div>

          {reviews.length > 0 && (
            <>
              {/* katta featured sharh */}
              <Reveal>
                <div className="mx-auto mb-10 max-w-3xl rounded-[2rem] border border-brand-gold/20 bg-brand-ink-soft p-10 text-center sm:p-14">
                  <div className="mb-5 flex justify-center">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={20} className={i < reviews[0].rating ? "fill-brand-gold text-brand-gold" : "text-brand-cream/20"} />)}
                  </div>
                  {reviews[0].comment && <p className="font-display text-2xl leading-relaxed text-brand-cream sm:text-3xl">&ldquo;{reviews[0].comment}&rdquo;</p>}
                  <p className="mt-6 text-sm uppercase tracking-[0.2em] text-brand-gold">{reviews[0].authorName}</p>
                </div>
              </Reveal>

              {reviews.length > 1 && (
                <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1} y={40}>
                  {reviews.slice(1).map((r) => (
                    <div key={r.id} className="rounded-2xl border border-white/10 bg-brand-ink-soft/60 p-7">
                      <div className="mb-3 flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={15} className={i < r.rating ? "fill-brand-gold text-brand-gold" : "text-brand-cream/15"} />)}</div>
                      {r.comment && <p className="text-brand-cream/70">&ldquo;{r.comment}&rdquo;</p>}
                      <p className="mt-4 font-display text-lg text-brand-gold-light">{r.authorName}</p>
                    </div>
                  ))}
                </RevealGroup>
              )}
            </>
          )}

          <div className="mt-16"><Reveal><ReviewForm /></Reveal></div>
        </div>
      </section>

            <SiteFooter locale={locale} />
    </>
  );
}
