import { getTranslations } from "next-intl/server";
import { ArrowRight, Clock, Flame, Leaf as LeafIcon, Scale, ShieldCheck } from "lucide-react";
import ButtonLink from "@/components/site/kit/ButtonLink";
import DishFallback from "@/components/site/kit/DishFallback";
import SectionHead from "@/components/site/kit/SectionHead";
import Parallax from "@/components/motion/Parallax";
import Reveal from "@/components/motion/Reveal";
import RevealGroup from "@/components/motion/RevealGroup";
import RotateOnScroll from "@/components/motion/RotateOnScroll";
import { cn, formatMoney } from "@/lib/utils";
import SafeImg from "./SafeImg";
import { Sprig } from "./Decor";
import { SPICY_KEYS } from "./data";
import type { HomeDish } from "./types";

/**
 * 4-bo'lim: OSHPAZ TANLOVI (namuna 3 — krem "sakuri"): katta dumaloq taom rasmlari bambuk
 * barglari bilan chap/o'ng almashib turadi; xitoycha nom, nafis serif nom, ma'lumot chiplari, narx.
 */
export default async function Showcase({ locale, dishes }: { locale: string; dishes: HomeDish[] }) {
  const t = await getTranslations({ locale, namespace: "Home2" });
  const st = await getTranslations({ locale, namespace: "Site" });

  return (
    <section className="relative overflow-hidden bg-sand pb-28 pt-16 sm:pb-36 sm:pt-20 lg:pb-44">
      <span aria-hidden="true" className="lattice-bg pointer-events-none absolute inset-0 text-fire/[0.05]" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead
          align="center"
          font="serif"
          cn="主厨推荐"
          eyebrow={t("showEyebrow")}
          title={t("showTitle")}
          accent={t("showAccent")}
          sub={t("showSub")}
        />

        <div className="mt-16 space-y-24 sm:mt-24 sm:space-y-32">
          {dishes.map((d, i) => {
            const flip = i % 2 === 1;
            const chips = [
              d.grams ? { icon: Scale, label: t("grams", { n: d.grams }) } : null,
              d.mins ? { icon: Clock, label: t("minutes", { n: d.mins }) } : null,
              d.spicy > 0 ? { icon: Flame, label: t(`spicy.${SPICY_KEYS[d.spicy]}`) } : null,
              d.veg ? { icon: LeafIcon, label: t("veg") } : null,
              d.halal ? { icon: ShieldCheck, label: st("halal") } : null,
            ].filter(Boolean) as { icon: typeof Scale; label: string }[];

            return (
              <article key={d.id} className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
                {/* ---------- Tarelka ---------- */}
                <div className={cn("relative mx-auto w-[min(78vw,300px)] sm:w-[400px] lg:w-[460px]", flip && "lg:order-2")}>
                  <div className="relative aspect-square">
                    <span aria-hidden="true" className="absolute -inset-[7%] rounded-full border-2 border-dashed border-fire/25" />
                    <span aria-hidden="true" className="absolute -inset-[15%] rounded-full bg-paper/60" />
                    <Parallax speed={18} className={cn("absolute z-10 w-[42%]", flip ? "-right-[16%] -top-[10%]" : "-left-[16%] -top-[10%]")}>
                      <Sprig className={cn("aspect-[4/3] w-full", flip && "-scale-x-100")} tone="leaf" />
                    </Parallax>
                    <Parallax speed={-14} className={cn("absolute z-10 w-[36%]", flip ? "-bottom-[6%] -left-[12%]" : "-bottom-[6%] -right-[12%]")}>
                      <Sprig className={cn("aspect-[4/3] w-full rotate-180", flip && "-scale-x-100")} tone="jade" />
                    </Parallax>
                    <RotateOnScroll deg={flip ? -45 : 45} scaleFrom={0.88} className="relative h-full w-full">
                      <div className="h-full w-full rounded-full bg-paper p-3 shadow-2xl shadow-content/20 sm:p-4">
                        <SafeImg
                          src={d.img}
                          alt={d.name}
                          className="h-full w-full rounded-full"
                          fallback={<DishFallback char={d.glyph} className="rounded-full" />}
                        />
                      </div>
                    </RotateOnScroll>
                    {/* Narx yorlig'i */}
                    <span className={cn(
                      "absolute bottom-[6%] z-20 flex size-24 flex-col items-center justify-center rounded-full bg-fire text-center text-brand-cream shadow-xl shadow-fire/30 sm:size-28",
                      flip ? "right-[2%]" : "left-[2%]"
                    )}>
                      <span className="font-poster text-lg leading-none sm:text-xl">{formatMoney(d.price, "").trim()}</span>
                      <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-cream/80">so&apos;m</span>
                    </span>
                  </div>
                </div>

                {/* ---------- Matn ---------- */}
                <Reveal y={40} className={cn("min-w-0 text-center lg:text-left", flip && "lg:order-1")}>
                  <div className={cn("flex items-baseline justify-center gap-4 lg:justify-start")}>
                    <span aria-hidden="true" className="font-poster text-5xl leading-none text-fire/15 sm:text-6xl">0{i + 1}</span>
                    {d.zh && <span lang="zh" className="font-cn text-4xl leading-none text-fire sm:text-5xl">{d.zh}</span>}
                  </div>
                  <h3 className="mt-4 font-display text-4xl leading-[1.08] text-content sm:text-5xl">{d.name}</h3>
                  <p className="mx-auto mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-muted lg:mx-0">{d.catName}</p>
                  {d.desc && <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-muted lg:mx-0">{d.desc}</p>}
                  {chips.length > 0 && (
                    <RevealGroup className="mt-7 flex flex-wrap justify-center gap-2 lg:justify-start" stagger={0.07} y={14}>
                      {chips.map((c) => (
                        <span key={c.label} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-paper px-4 text-sm font-medium text-content">
                          <c.icon size={15} aria-hidden="true" className="text-fire" />
                          {c.label}
                        </span>
                      ))}
                    </RevealGroup>
                  )}
                  <div className="mt-9 flex flex-wrap items-center justify-center gap-5 lg:justify-start">
                    <span className="inline-flex flex-wrap items-baseline gap-x-3">
                      <span className="font-poster text-3xl text-fire sm:text-4xl">{formatMoney(d.price)}</span>
                      {d.oldPrice != null && <s className="text-lg text-muted">{formatMoney(d.oldPrice)}</s>}
                    </span>
                    <ButtonLink href="/reservation" variant="fire" className="group">
                      {t("preorder")}
                      <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                    </ButtonLink>
                  </div>
                </Reveal>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
