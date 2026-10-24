import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import Blob from "@/components/site/kit/Blob";
import ButtonLink from "@/components/site/kit/ButtonLink";
import SectionHead from "@/components/site/kit/SectionHead";
import Wave from "@/components/site/kit/Wave";
import Parallax from "@/components/motion/Parallax";
import Reveal from "@/components/motion/Reveal";
import RevealGroup from "@/components/motion/RevealGroup";
import CountUp from "./CountUp";
import SafeImg from "./SafeImg";
import { GlyphPanel, Seal } from "./Decor";

/**
 * 3-bo'lim: BIZ HAQIMIZDA (namuna 2 — qorong'i "saroy"): katta qizil bloblar, foto-kollaj
 * (arkali baland rasm + kvadrat + doira), nafis serif sarlavha, nom tarixi va raqamlar.
 */
export default async function About({
  locale, images, stats,
}: {
  locale: string;
  images: string[];
  stats: { tables: number; seats: number; vip: number };
}) {
  const st = await getTranslations({ locale, namespace: "Site" });
  const t = await getTranslations({ locale, namespace: "Home2" });
  const [a, b, c] = [images[0] ?? null, images[1] ?? null, images[2] ?? null];

  return (
    <section className="relative isolate overflow-hidden bg-night pb-28 pt-20 text-brand-cream sm:pb-32 sm:pt-24 lg:pb-40 lg:pt-32">
      {/* Katta qizil bloblar */}
      <Parallax speed={10} className="pointer-events-none absolute -left-48 top-16 -z-10 w-[34rem] sm:w-[44rem]">
        <Blob variant="a" className="w-full text-fire-deep/80 animate-spin-slow" />
      </Parallax>
      <Parallax speed={-14} className="pointer-events-none absolute -right-40 bottom-10 -z-10 w-[26rem] sm:w-[34rem]">
        <Blob variant="c" className="w-full text-fire/85" />
      </Parallax>
      <span aria-hidden="true" lang="zh" className="font-cn pointer-events-none absolute right-[4%] top-10 -z-10 select-none text-[9rem] leading-none text-brand-cream/[0.04] sm:text-[14rem]">
        长安
      </span>

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        {/* ---------- Foto-kollaj ---------- */}
        <div className="relative mx-auto h-[440px] w-full max-w-[540px] sm:h-[580px]">
          <Parallax speed={6} className="absolute left-0 top-0 h-[84%] w-[57%]">
            <SafeImg
              src={a}
              className="h-full w-full rounded-b-[28px] rounded-t-full border border-brand-gold/30 shadow-2xl shadow-night"
              fallback={<GlyphPanel char="长安" vertical tone="night" size="text-[clamp(3.5rem,30%,7rem)]" />}
            />
          </Parallax>
          <Parallax speed={-10} className="absolute right-0 top-[7%] aspect-square w-[39%]">
            <SafeImg
              src={b}
              className="h-full w-full rounded-[28px] shadow-2xl shadow-night"
              fallback={<GlyphPanel char="茶" tone="fire" />}
            />
          </Parallax>
          <Parallax speed={16} className="absolute bottom-0 right-[3%] aspect-square w-[47%]">
            <SafeImg
              src={c}
              className="h-full w-full rounded-full ring-8 ring-night shadow-2xl shadow-night"
              fallback={<GlyphPanel char="福" tone="saffron" />}
            />
          </Parallax>
          <Seal text="长安" className="absolute bottom-[10%] left-[44%] z-10 h-20 w-11 rotate-[-6deg] text-2xl" />
        </div>

        {/* ---------- Matn ---------- */}
        <div className="relative min-w-0">
          <SectionHead
            tone="dark"
            font="serif"
            cn="关于我们"
            eyebrow={st("storyEyebrow")}
            title={st("storyTitle1")}
            accent={st("storyTitle2")}
          />
          <RevealGroup className="mt-8 max-w-xl space-y-5 text-[17px] leading-relaxed text-brand-cream/80" stagger={0.12} y={24}>
            <p>{st("storyP1")}</p>
            <p>{st("storyP2")}</p>
            <p className="border-l-2 border-brand-gold/60 pl-5 font-display text-xl italic leading-snug text-brand-gold-light">
              {t("nameStory")}
            </p>
          </RevealGroup>

          <Reveal y={24} delay={0.1}>
            <dl className="mt-10 grid max-w-lg grid-cols-3 divide-x divide-brand-cream/15 rounded-[24px] border border-brand-cream/10 bg-night-2/80 py-6 backdrop-blur-sm">
              {[
                { v: stats.tables, l: t("statTables") },
                { v: stats.seats, l: t("statSeats") },
                { v: stats.vip, l: t("statVip") },
              ].map((s) => (
                <div key={s.l} className="px-3 text-center">
                  <dt className="sr-only">{s.l}</dt>
                  <dd className="font-display text-4xl text-saffron sm:text-5xl"><CountUp to={s.v} /></dd>
                  <dd aria-hidden="true" className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-cream/70">{s.l}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal y={20} delay={0.2}>
            <ButtonLink href="/about" variant="fire" blob className="group mt-10 px-10">
              {t("aboutBtn")}
              <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </ButtonLink>
          </Reveal>
        </div>
      </div>

      <Wave className="text-sand" variant="c" />
    </section>
  );
}
