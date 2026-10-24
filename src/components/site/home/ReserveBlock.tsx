import { getTranslations } from "next-intl/server";
import { ArrowRight, Clock } from "lucide-react";
import Lanterns from "@/components/three/Lanterns";
import Blob from "@/components/site/kit/Blob";
import ButtonLink from "@/components/site/kit/ButtonLink";
import Reveal from "@/components/motion/Reveal";
import TextReveal from "@/components/motion/TextReveal";
import Parallax from "@/components/motion/Parallax";
import SafeImg from "./SafeImg";
import { GlyphPanel } from "./Decor";

/**
 * 8-bo'lim: "STOL BAND QILING" (namuna 2 — "Receive a table"): katta qorong'i karta, interyer rasmi,
 * qizil blob bezaklar va yon tomonda suzib yuruvchi 3D fonarlar.
 */
export default async function ReserveBlock({ locale, image, hours }: { locale: string; image: string | null; hours: string }) {
  const st = await getTranslations({ locale, namespace: "Site" });

  return (
    <section className="relative bg-paper pb-24 pt-8 sm:pb-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal y={60}>
          <div className="relative isolate overflow-hidden rounded-[32px] bg-night-2 text-brand-cream shadow-2xl shadow-content/20 sm:rounded-[44px] lg:grid lg:min-h-[560px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            {/* Bloblar */}
            <Blob variant="b" className="absolute -bottom-32 -left-28 -z-10 hidden w-[30rem] text-fire-ink lg:block" />
            <Blob variant="c" className="absolute -right-28 -top-36 -z-10 w-[20rem] text-fire-deep/80 sm:w-[24rem]" />

            {/* Interyer rasmi — arkali ramkada */}
            <div className="relative p-4 sm:p-6 lg:p-8 lg:pr-0">
              <div className="relative h-72 overflow-hidden rounded-[24px] sm:h-96 lg:h-full lg:rounded-t-[999px] lg:rounded-b-[28px]">
                <Parallax speed={8} className="absolute -inset-y-[12%] inset-x-0">
                  <SafeImg
                    src={image}
                    className="h-full w-full"
                    fallback={<GlyphPanel char="订座" vertical tone="night" size="text-[clamp(4rem,18vw,9rem)]" />}
                  />
                </Parallax>
              </div>
            </div>

            {/* Matn */}
            <div className="relative px-6 pb-12 pt-6 sm:px-12 sm:pb-16 lg:py-20 lg:pl-14 lg:pr-48 xl:pr-56">
              <p className="flex items-center gap-3">
                <span lang="zh" className="font-cn text-3xl leading-none text-saffron">订座</span>
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cream/75">{st("reserveEyebrow")}</span>
              </p>
              <TextReveal
                as="h2"
                text={st("reserveTitle")}
                className="mt-4 font-display text-[2.6rem] leading-[1.05] text-brand-cream sm:text-6xl"
              />
              <Reveal y={16} delay={0.15}>
                <p className="mt-6 max-w-md text-lg leading-relaxed text-brand-cream/80">{st("reserveSub")}</p>
              </Reveal>
              <Reveal y={16} delay={0.25}>
                <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
                  <ButtonLink href="/reservation" variant="fire" blob className="group px-10 shadow-xl shadow-fire/30">
                    {st("reserveBtn")}
                    <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                  </ButtonLink>
                  <span className="inline-flex items-center gap-2 text-sm text-brand-cream/75">
                    <Clock size={16} className="text-saffron" aria-hidden="true" /> {hours}
                  </span>
                </div>
              </Reveal>
            </div>

            {/* 3D fonarlar ("three" agenti) */}
            <Lanterns className="pointer-events-none absolute right-0 top-0 z-10 h-64 w-28 sm:h-full sm:w-44 lg:w-52 xl:w-60" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
