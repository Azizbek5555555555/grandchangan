import { getTranslations } from "next-intl/server";
import { Quote, Star } from "lucide-react";
import SectionHead from "@/components/site/kit/SectionHead";
import Reveal from "@/components/motion/Reveal";
import RevealGroup from "@/components/motion/RevealGroup";
import ReviewForm from "@/components/site/ReviewForm";
import { cn } from "@/lib/utils";
import type { HomeReview } from "./types";

function Stars({ n, size = 16, className }: { n: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className={i < n ? "fill-saffron text-saffron" : "text-line"} />
      ))}
    </span>
  );
}

/**
 * 10-bo'lim: SHARHLAR — faqat tasdiqlangan (APPROVED) haqiqiy sharhlar: bittasi katta, qolgani
 * kichik kartalar; yonida sharh qoldirish formasi. Sharh bo'lmasa — faqat forma bloki.
 */
export default async function Reviews({
  locale, reviews, avg, total,
}: { locale: string; reviews: HomeReview[]; avg: number | null; total: number }) {
  const st = await getTranslations({ locale, namespace: "Site" });
  const t = await getTranslations({ locale, namespace: "Home2" });
  const [top, ...rest] = reviews;

  if (!top) {
    return (
      <section className="relative overflow-hidden bg-paper py-24 sm:py-32">
        <span aria-hidden="true" lang="zh" className="font-cn pointer-events-none absolute -left-6 bottom-0 select-none text-[12rem] leading-none text-fire/[0.06] sm:text-[18rem]">评价</span>
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHead align="center" cn="评价" eyebrow={st("reviewsEyebrow")} title={st("rvTitle")} sub={t("reviewsFirst")} />
          <Reveal y={40} className="mt-12"><ReviewForm /></Reveal>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-paper py-24 sm:py-32">
      <span aria-hidden="true" lang="zh" className="font-cn pointer-events-none absolute -right-6 top-6 select-none text-[12rem] leading-none text-fire/[0.06] sm:text-[18rem]">评价</span>
      <div className="relative mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16">
        <div className="min-w-0">
          <SectionHead cn="评价" eyebrow={st("reviewsEyebrow")} title={st("reviewsTitle")} />
          {avg !== null && (
            <Reveal y={16} delay={0.1}>
              <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-content">
                <span className="font-poster text-3xl text-fire">{avg.toFixed(1)}</span>
                <Stars n={Math.round(avg)} size={18} />
                <span className="text-sm text-muted">{t("reviewsCount", { count: total })}</span>
              </p>
            </Reveal>
          )}

          {/* Katta sharh */}
          <Reveal y={40} className="mt-10">
            <figure className="relative overflow-hidden rounded-[28px] bg-fire p-8 text-brand-cream shadow-xl shadow-fire/20 sm:p-10">
              <Quote aria-hidden="true" size={96} className="absolute -right-2 -top-2 rotate-180 text-fire-deep" />
              <Stars n={top.rating} size={18} className="relative" />
              {top.comment && (
                <blockquote className="relative mt-5 font-display text-2xl italic leading-snug sm:text-3xl">
                  &ldquo;{top.comment}&rdquo;
                </blockquote>
              )}
              <figcaption className="relative mt-6 flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-saffron font-poster text-brand-ink">
                  {top.author.trim().charAt(0).toUpperCase() || "G"}
                </span>
                <span className="font-semibold tracking-wide">{top.author}</span>
              </figcaption>
            </figure>
          </Reveal>

          {rest.length > 0 && (
            <RevealGroup className="mt-5 grid gap-5 sm:grid-cols-2" stagger={0.1} y={30}>
              {rest.map((r) => (
                <figure key={r.id} className="flex flex-col rounded-[24px] border border-line bg-card p-6">
                  <Stars n={r.rating} size={14} />
                  {r.comment && <blockquote className="mt-3 line-clamp-5 text-content/85">&ldquo;{r.comment}&rdquo;</blockquote>}
                  <figcaption className="mt-auto flex items-center gap-2.5 pt-5 text-sm font-semibold text-content">
                    <span className="flex size-8 items-center justify-center rounded-full bg-sand font-poster text-xs text-fire">
                      {r.author.trim().charAt(0).toUpperCase() || "G"}
                    </span>
                    {r.author}
                  </figcaption>
                </figure>
              ))}
            </RevealGroup>
          )}
        </div>

        <div className="min-w-0 lg:pt-4">
          <Reveal y={40} className="lg:sticky lg:top-28"><ReviewForm /></Reveal>
        </div>
      </div>
    </section>
  );
}
