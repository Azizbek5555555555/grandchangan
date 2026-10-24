import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import ButtonLink from "@/components/site/kit/ButtonLink";
import FretBand from "@/components/site/kit/FretBand";
import SectionHead from "@/components/site/kit/SectionHead";
import Parallax from "@/components/motion/Parallax";
import RevealGroup from "@/components/motion/RevealGroup";
import { cn } from "@/lib/utils";
import SafeImg from "./SafeImg";
import { GlyphPanel } from "./Decor";

// Ustunlar bo'yicha pog'onali joylashuv (balandlik va parallaks tezligi)
const SHAPES = [
  { h: "aspect-[3/4]", speed: 6, extra: "" },
  { h: "aspect-square", speed: 14, extra: "lg:mt-16" },
  { h: "aspect-[4/5]", speed: 8, extra: "" },
  { h: "aspect-[4/5]", speed: 12, extra: "" },
  { h: "aspect-[3/4]", speed: 5, extra: "lg:mt-16" },
  { h: "aspect-square", speed: 10, extra: "" },
];
const CHARS = ["宴", "茶", "福", "龙", "宴", "春"];

/** 9-bo'lim: GALEREYA (faqat ≥3 faol rasm bo'lsa) — pog'onali kollaj, parallaks */
export default async function GallerySection({ locale, images }: { locale: string; images: string[] }) {
  const st = await getTranslations({ locale, namespace: "Site" });
  const list = images.slice(0, 6);

  return (
    <section className="relative overflow-hidden bg-sand pb-24 pt-0 sm:pb-32">
      <FretBand className="text-fire/25" />
      <div className="mx-auto max-w-7xl px-5 pt-20 sm:px-8 sm:pt-24">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHead cn="画廊" eyebrow={st("atmoEyebrow")} title={st("atmoTitle")} />
          <ButtonLink href="/gallery" variant="ghost-dark" size="md" className="group shrink-0 self-start sm:self-auto">
            {st("fullGallery")}
            <ArrowRight size={16} className="transition group-hover:translate-x-1" />
          </ButtonLink>
        </div>

        <RevealGroup className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3" stagger={0.08} y={50}>
          {list.map((src, i) => {
            const s = SHAPES[i % SHAPES.length];
            return (
              <div key={src + i} className={cn("min-w-0", s.extra, i >= 4 && "hidden lg:block")}>
                <Parallax speed={s.speed}>
                  <div className={cn("group overflow-hidden rounded-[24px] shadow-lg shadow-content/10", s.h)}>
                    <SafeImg
                      src={src}
                      className="h-full w-full"
                      imgClassName="transition duration-[1200ms] ease-out-expo group-hover:scale-110"
                      fallback={<GlyphPanel char={CHARS[i % CHARS.length]} tone={i % 3 === 1 ? "fire" : "night"} />}
                    />
                  </div>
                </Parallax>
              </div>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
