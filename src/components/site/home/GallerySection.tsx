import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import ButtonLink from "@/components/site/kit/ButtonLink";
import FretBand from "@/components/site/kit/FretBand";
import SectionHead from "@/components/site/kit/SectionHead";
import { Birds, Mountains } from "@/components/site/pages/InkDecor";
import GalleryStrip, { type GalleryItem } from "./GalleryStrip";

/**
 * 9-bo'lim: GALEREYA (faqat ≥3 faol rasm bo'lsa) — tush rasmi uslubidagi qog'oz fon (namuna 11):
 * tumanli tog'lar, qushlar, vertikal sarlavha + muhr va vertikal panellar lentasi (3–8 rasm).
 */
export default async function GallerySection({ locale, items }: { locale: string; items: GalleryItem[] }) {
  const st = await getTranslations({ locale, namespace: "Site" });
  const t = await getTranslations({ locale, namespace: "Home2" });
  const list = items.slice(0, 8);

  return (
    <section data-home="gallery" className="relative isolate overflow-hidden bg-sand pb-28 pt-0 sm:pb-36">
      <FretBand className="text-fire/25" />
      {/* tush rasmi bezaklari */}
      <Mountains className="absolute inset-x-0 bottom-0 -z-10 h-56 w-full text-content/[0.07] sm:h-72" />
      <Birds className="absolute right-[24%] top-24 -z-10 w-32 text-content/25 sm:w-40" />

      <div className="mx-auto max-w-7xl px-5 pt-20 sm:px-8 sm:pt-24">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHead cn="画廊" eyebrow={st("atmoEyebrow")} title={st("atmoTitle")} sub={st("gallerySub")} />
          <div className="flex items-end gap-6 self-start sm:self-auto">
            {/* vertikal sarlavha + muhr (namuna 11) */}
            <div aria-hidden="true" className="hidden items-start gap-2 lg:flex">
              <span lang="zh" className="font-cn text-[1.7rem] leading-[1.12] text-content/80 [writing-mode:vertical-rl]">长安雅集</span>
              <span lang="zh" className="font-cn mt-1 flex size-9 items-center justify-center rounded-[4px] bg-fire text-sm leading-none text-brand-cream [writing-mode:vertical-rl]">
                画
              </span>
            </div>
            <ButtonLink href="/gallery" variant="ghost-dark" size="md" className="group shrink-0">
              {st("fullGallery")}
              <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </ButtonLink>
          </div>
        </div>

        <div className="mt-12 sm:mt-14">
          <GalleryStrip items={list} openLabel={t("galOpen")} pauseLabel={t("rvPause")} playLabel={t("rvPlay")} />
        </div>
      </div>
    </section>
  );
}
