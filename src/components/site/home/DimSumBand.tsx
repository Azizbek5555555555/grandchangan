import { getTranslations } from "next-intl/server";
import { ChefHat, Lamp, ShieldCheck, Soup } from "lucide-react";
import DimSumSteamer from "@/components/three/DimSumSteamer";
import SectionHead from "@/components/site/kit/SectionHead";
import Wave from "@/components/site/kit/Wave";
import RevealGroup from "@/components/motion/RevealGroup";
import Reveal from "@/components/motion/Reveal";

const MARQUEE = "点心 · 小笼包 · 虾饺 · 烧卖 · 叉烧包 · 蒸饺 · 春卷 · ";

/**
 * 5-bo'lim: DIM SUM (vino rangli to'lqinli lenta): 3D bambuk bug'latgich + oshxonamizning
 * 4 ta xususiyati. Orqada sekin suzuvchi xitoycha yozuvlar lentasi.
 */
export default async function DimSumBand({ locale }: { locale: string }) {
  const st = await getTranslations({ locale, namespace: "Site" });
  const features = [
    { icon: ChefHat, title: st("sc1t"), text: st("sc1x") },
    { icon: Soup, title: st("sc2t"), text: st("sc2x") },
    { icon: Lamp, title: st("sc3t"), text: st("sc3x") },
    { icon: ShieldCheck, title: st("sc4t"), text: st("sc4x") },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-wine py-32 text-brand-cream sm:py-36 lg:py-44">
      <Wave top className="text-night" variant="b" />

      {/* Xitoycha yozuvlar lentasi */}
      <div aria-hidden="true" lang="zh" className="pointer-events-none absolute inset-x-0 top-[14%] -z-10 flex select-none overflow-hidden">
        <div className="font-cn flex shrink-0 animate-marquee whitespace-nowrap text-[7rem] leading-none text-brand-cream/[0.06] sm:text-[10rem]">
          <span>{MARQUEE}</span>
          <span>{MARQUEE}</span>
        </div>
      </div>
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-40 -z-10 size-[36rem] rounded-full bg-fire-deep/40 blur-3xl" />

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
        {/* ---------- 3D bug'latgich ---------- */}
        <Reveal y={50} className="relative mx-auto w-[min(84vw,340px)] sm:w-[460px] lg:w-full lg:max-w-[560px]">
          <div className="relative aspect-square">
            <span aria-hidden="true" className="absolute inset-[6%] rounded-full bg-wine-deep shadow-2xl shadow-night/60" />
            <span aria-hidden="true" className="absolute inset-[12%] rounded-full border-2 border-dashed border-saffron/25 animate-spin-slow" />
            {/* Bug' (CSS) — 3D yuklanmaguncha ham jonli */}
            <span aria-hidden="true" className="absolute left-[38%] top-[16%] h-24 w-6 rounded-full bg-brand-cream/25 blur-md animate-steam" />
            <span aria-hidden="true" className="absolute left-[52%] top-[12%] h-28 w-7 rounded-full bg-brand-cream/20 blur-md animate-steam [animation-delay:1.2s]" />
            <span aria-hidden="true" className="absolute left-[62%] top-[18%] h-20 w-5 rounded-full bg-brand-cream/20 blur-md animate-steam [animation-delay:2.4s]" />
            <DimSumSteamer className="absolute inset-0 z-10 h-full w-full" />
            <span aria-hidden="true" lang="zh" className="font-cn absolute -right-2 top-[6%] z-20 flex size-20 items-center justify-center rounded-full bg-saffron text-3xl text-fire-deep shadow-xl shadow-night/40 sm:size-24 sm:text-4xl">
              点心
            </span>
          </div>
        </Reveal>

        {/* ---------- Matn va xususiyatlar ---------- */}
        <div className="min-w-0">
          <SectionHead tone="dark" cn="点心" eyebrow={st("scEyebrow")} title={st("scTitle1")} accent={st("scTitle2")} />
          <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2" stagger={0.1} y={30}>
            {features.map((f) => (
              <div key={f.title} className="group rounded-[24px] border border-brand-cream/10 bg-wine-deep/60 p-6 transition-[translate,background-color,border-color] duration-500 hover:-translate-y-1 hover:border-saffron/40 hover:bg-wine-deep">
                <span className="flex size-12 items-center justify-center rounded-full bg-saffron text-brand-ink transition duration-500 group-hover:rotate-[-10deg] group-hover:scale-110">
                  <f.icon size={22} aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold text-brand-cream">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-brand-cream/75">{f.text}</p>
              </div>
            ))}
          </RevealGroup>
        </div>
      </div>

      <Wave className="text-night" variant="a" />
    </section>
  );
}
