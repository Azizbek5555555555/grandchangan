import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import ButtonLink from "@/components/site/kit/ButtonLink";
import SectionHead from "@/components/site/kit/SectionHead";
import Wave from "@/components/site/kit/Wave";
import Parallax from "@/components/motion/Parallax";
import Reveal from "@/components/motion/Reveal";
import RevealGroup from "@/components/motion/RevealGroup";
import { cn } from "@/lib/utils";
import CountUp from "./CountUp";
import Photo from "@/components/site/photos/Photo";
import { pic } from "@/components/site/photos/pics";
import { GlyphPanel, Seal } from "./Decor";
import LanternsDrop from "./LanternsDrop";
import { GoldCorners, IconBowl, IconLeaf, IconTeapot, IconWok, PoemScroll } from "./AboutArt";

/**
 * 3-bo'lim: BIZ HAQIMIZDA (namuna 2 — qorong'i "saroy"): osma fonarlar, oltin ramkali foto-kollaj
 * (arkali baland rasm + kvadrat + doira) va osma she'r o'ramasi, nafis serif sarlavha, nom tarixi,
 * oltin chiziqli raqamlar va pastda ingichka ikonli qadriyatlar lentasi (namuna 04).
 * Kollaj — restoranning uch xil joyi: arka — katta VIP zal (vertikal rasm, qandil arka gumbazida),
 * kvadrat — oy derazali kabinka, doira — asosiy zaldagi dumaloq stol.
 */
const COLLAGE = {
  arch: pic("vipGrandTall", "84% 50%"),
  square: pic("boothRoundWindow", "80% 50%"),
  circle: pic("hallRoundTable", "50% 55%"),
};

export default async function About({
  locale, stats,
}: {
  locale: string;
  stats: { tables: number; seats: number; vip: number };
}) {
  const st = await getTranslations({ locale, namespace: "Site" });
  const t = await getTranslations({ locale, namespace: "Home2" });
  const ph = await getTranslations({ locale, namespace: "Photos" });
  const values = [
    { Icon: IconLeaf, title: t("valFresh"), sub: t("valFreshS") },
    { Icon: IconBowl, title: t("valRecipe"), sub: t("valRecipeS") },
    { Icon: IconWok, title: t("valWok"), sub: t("valWokS") },
    { Icon: IconTeapot, title: t("valCare"), sub: t("valCareS") },
  ];

  return (
    <section data-home="about" className="relative isolate overflow-hidden bg-night pb-28 pt-40 text-brand-cream sm:pb-32 sm:pt-44 lg:pb-40 lg:pt-48">
      {/* Osilgan 2D fonarlar — bo'limga kelganda tepadan tushib, chayqalib yonadi */}
      <LanternsDrop
        items={[
          { left: "2%", size: 74, rope: 70, char: "福" },
          { left: "9%", size: 52, rope: 150, char: "喜" },
          { left: "86%", size: 64, rope: 40, char: "春" },
          { left: "93%", size: 46, rope: 120, char: "安" },
        ]}
        className="hidden md:block"
      />
      <LanternsDrop items={[{ left: "78%", size: 46, rope: 24, char: "福" }]} className="md:hidden" />
      <span aria-hidden="true" lang="zh" className="font-cn pointer-events-none absolute right-[4%] top-10 -z-10 select-none text-[9rem] leading-none text-brand-cream/[0.04] sm:text-[14rem]">
        长安
      </span>

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
        {/* ---------- Foto-kollaj ---------- */}
        <div className="relative mx-auto h-[520px] w-full max-w-[700px] sm:h-[700px] lg:h-[780px]">
          <Parallax speed={6} className="absolute left-[3%] top-[2%] h-[80%] w-[54%]">
            {/* oltin ramka — arka tashqarisida ingichka ikkinchi chiziq */}
            <span aria-hidden="true" className="absolute -inset-3 rounded-b-[36px] rounded-t-full border border-brand-gold/45" />
            <span aria-hidden="true" className="absolute -top-3 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-brand-gold" />
            <Photo
              pic={COLLAGE.arch}
              alt={ph("vip")}
              sizes="(min-width: 1024px) 380px, 54vw"
              className="h-full w-full rounded-b-[28px] rounded-t-full border border-brand-gold/30 bg-night-3 shadow-2xl shadow-night"
              fallback={<GlyphPanel char="长安" vertical tone="night" size="text-[5rem] sm:text-[6.5rem]" />}
            />
            {/* arka ichidagi nozik vinyetka — oq devor qorong'i bo'limda "yonib" ketmasin */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-b-[28px] rounded-t-full bg-gradient-to-t from-night/45 via-transparent to-night/15" />
          </Parallax>
          <Parallax speed={-10} className="absolute right-[2%] top-[7%] aspect-square w-[37%]">
            <GoldCorners />
            <Photo
              pic={COLLAGE.square}
              alt={ph("booth")}
              sizes="(min-width: 1024px) 260px, 37vw"
              className="h-full w-full rounded-[22px] bg-night-3 shadow-2xl shadow-night"
              fallback={<GlyphPanel char="茶" tone="fire" size="text-[3.5rem] sm:text-[5rem]" />}
            />
          </Parallax>
          <Parallax speed={16} className="absolute bottom-[2%] right-[4%] aspect-square w-[45%]">
            {/* aylanib turuvchi oltin nuqtali halqa */}
            <svg aria-hidden="true" viewBox="0 0 200 200" className="animate-spin-slow absolute -inset-[7%] text-brand-gold/60">
              <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="0.5 4.5" strokeLinecap="round" />
              <circle cx="100" cy="2" r="2.4" fill="currentColor" />
            </svg>
            <Photo
              pic={COLLAGE.circle}
              alt={ph("hall")}
              sizes="(min-width: 1024px) 320px, 45vw"
              className="h-full w-full rounded-full bg-night-3 ring-8 ring-night shadow-2xl shadow-night"
              fallback={<GlyphPanel char="福" tone="saffron" size="text-[4rem] sm:text-[5.5rem]" />}
            />
          </Parallax>
          {/* osma she'r o'ramasi (Li Bo) — kollajning chap pastida */}
          <Parallax speed={-6} className="absolute bottom-[1%] left-0 z-10 w-[17%] min-w-16 max-w-28 rotate-[-3deg]">
            <PoemScroll />
          </Parallax>
          <Seal text="长安" className="absolute bottom-[12%] left-[46%] z-10 h-20 w-11 rotate-[-6deg] text-2xl" />
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
            {/* Raqamlar — oltin chiziqlar orasida, har biri ustida ieroglif */}
            <div className="mt-11 max-w-lg">
              <Rule />
              <dl className="grid grid-cols-3 py-6">
                {[
                  { v: stats.tables, l: t("statTables"), cn: "桌" },
                  { v: stats.seats, l: t("statSeats"), cn: "座" },
                  { v: stats.vip, l: t("statVip"), cn: "雅" },
                ].map((s, i) => (
                  <div key={s.l} className="relative flex flex-col items-center px-2 text-center">
                    {i > 0 && (
                      <span aria-hidden="true" className="absolute inset-y-1 left-0 w-px bg-gradient-to-b from-transparent via-brand-gold/45 to-transparent" />
                    )}
                    <dt>
                      <span aria-hidden="true" lang="zh" className="font-cn block text-lg leading-none text-saffron/80">{s.cn}</span>
                      <span className="sr-only">{s.l}</span>
                    </dt>
                    <dd className="mt-2 font-display text-[2.6rem] leading-none text-brand-gold-light sm:text-5xl"><CountUp to={s.v} /></dd>
                    <dd aria-hidden="true" className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-cream/70">{s.l}</dd>
                  </div>
                ))}
              </dl>
              <Rule />
            </div>
          </Reveal>

          <Reveal y={20} delay={0.2}>
            <ButtonLink href="/about" variant="fire" blob className="group mt-10 px-10">
              {t("aboutBtn")}
              <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </ButtonLink>
          </Reveal>
        </div>
      </div>

      {/* ---------- Qadriyatlar lentasi (namuna 04) ---------- */}
      <div className="mx-auto mt-20 max-w-7xl px-5 sm:mt-24 sm:px-8">
        <RevealGroup
          className="grid grid-cols-1 overflow-hidden rounded-[24px] border border-brand-gold/25 bg-night-2/80 backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-4"
          stagger={0.1}
          y={24}
        >
          {values.map(({ Icon, title, sub }, i) => (
            <div
              key={title}
              className={cn(
                "flex items-start gap-4 px-6 py-6 sm:px-7 sm:py-7",
                i > 0 && "border-t border-brand-gold/15",
                i === 1 && "sm:border-l sm:border-t-0",
                i === 3 && "sm:border-l",
                i >= 2 && "lg:border-l lg:border-t-0"
              )}
            >
              <Icon className="size-11 shrink-0 text-brand-gold" />
              <div className="min-w-0">
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.18em] text-brand-cream">{title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-brand-cream/70">{sub}</p>
              </div>
            </div>
          ))}
        </RevealGroup>
      </div>

      <Wave className="text-sand" variant="c" />
    </section>
  );
}

/** Markazida romb bo'lgan ingichka oltin chiziq */
function Rule() {
  return (
    <div aria-hidden="true" className="relative flex items-center">
      <span className="hairline-gold flex-1" />
      <span className="mx-3 size-1.5 rotate-45 bg-brand-gold" />
      <span className="hairline-gold flex-1" />
    </div>
  );
}
