import { getTranslations } from "next-intl/server";
import ReviewForm from "@/components/site/ReviewForm";
import Reveal from "@/components/motion/Reveal";
import Wave from "@/components/site/kit/Wave";
import { Birds, Mountains, SealStamp } from "@/components/site/pages/InkDecor";
import type { Pic } from "@/components/site/photos/pics";
import ReviewsStage, { type StageSlide } from "./ReviewsStage";
import type { HomeReview } from "./types";

/**
 * 10-bo'lim: SHARHLAR — faqat tasdiqlangan (APPROVED) haqiqiy sharhlar.
 * 1) "Kino sahnasi" (ReviewsStage): har sharh o'z fon rasmi bilan — mijoz rasmi, sharh qilingan taom
 *    yoki restoran interyeri (navbat bilan); rasm yuklanmasa tush uslubidagi manzara. Sharh bo'lmasa —
 *    bitta taklif sahnasi (interyer foni bilan).
 * 2) Krem lenta: "sizning hikoyangiz" matni + sharh qoldirish formasi.
 */
export default async function Reviews({
  locale, reviews, avg, total, backdrop, prevClass = "text-sand",
}: {
  locale: string;
  /** pic — sahna foni (page.tsx tayyorlaydi: mijoz rasmi → taom rasmi → interyer) */
  reviews: (HomeReview & { pic: Pic | null })[];
  avg: number | null;
  total: number;
  /** Sharh bo'lmaganda taklif sahnasining fon rasmi */
  backdrop: Pic | null;
  /** Oldingi bo'lim rangi (tepadagi to'lqin uchun) */
  prevClass?: string;
}) {
  const st = await getTranslations({ locale, namespace: "Site" });
  const t = await getTranslations({ locale, namespace: "Home2" });

  const slides: StageSlide[] = reviews.length
    ? reviews.map((r) => ({ id: r.id, author: r.author, rating: r.rating, comment: r.comment, img: r.pic, dish: r.dish }))
    : // Taklif slaydi: yulduz va muallifsiz (restoran o'zi haqida "sharh" yozgandek ko'rinmasin)
      [{ id: "invite", author: "", rating: 0, comment: t("reviewsFirst"), img: backdrop, dish: null }];

  return (
    <>
      <ReviewsStage
        slides={slides}
        avg={avg}
        topWaveClass={prevClass}
        labels={{
          eyebrow: st("reviewsEyebrow"),
          title: st("reviewsTitle"),
          prev: t("rvPrev"),
          next: t("rvNext"),
          goTo: t.raw("rvGoTo") as string,
          tasted: t("rvTasted"),
          avgLabel: t("rvAvg"),
          countLabel: t("reviewsCount", { count: total }),
          region: st("reviewsTitle"),
          pause: t("rvPause"),
          play: t("rvPlay"),
          slide: t("rvSlide"),
        }}
      />

      {/* ---------- Sharh qoldirish ---------- */}
      <section className="relative isolate overflow-hidden bg-paper pb-36 pt-24 sm:pb-44 sm:pt-28">
        <Wave top className="text-night" variant="c" />
        <Birds className="absolute left-[6%] top-28 -z-10 w-40 text-content/20 sm:w-52" />
        <Mountains className="absolute inset-x-0 bottom-0 -z-10 h-40 w-full text-sand sm:h-56" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
          <Reveal y={30} className="min-w-0">
            <div className="flex items-start gap-6">
              <SealStamp text="留言" className="hidden shrink-0 sm:inline-flex" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-fire-ink">{st("reviewsEyebrow")}</p>
                <h3 className="mt-4 text-balance font-display text-4xl leading-[1.08] text-content sm:text-5xl">
                  {t("rvWriteTitle")} <span className="italic text-fire-ink">{t("rvWriteAccent")}</span>
                </h3>
                <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">{t("rvWriteSub")}</p>
              </div>
            </div>
          </Reveal>
          <Reveal y={40} className="min-w-0">
            <ReviewForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
