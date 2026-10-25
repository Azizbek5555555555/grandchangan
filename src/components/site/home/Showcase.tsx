import { getTranslations } from "next-intl/server";
import { ArrowRight, Flame, Leaf as LeafIcon, ShieldCheck } from "lucide-react";
import ButtonLink from "@/components/site/kit/ButtonLink";
import SectionHead from "@/components/site/kit/SectionHead";
import Parallax from "@/components/motion/Parallax";
import Reveal from "@/components/motion/Reveal";
import RevealGroup from "@/components/motion/RevealGroup";
import { Birds, Mountains } from "@/components/site/pages/InkDecor";
import { cn, formatMoney } from "@/lib/utils";
import SafeImg from "./SafeImg";
import { Sprig } from "./Decor";
import ShowcaseArt, { PorcelainPlate } from "./ShowcaseArt";
import { SPICY_KEYS } from "./data";
import type { HomeDish } from "./types";

/** Xitoycha "rasmiy" raqamlar — bob raqami bezagi */
const CN_NUM = ["壹", "贰", "叁", "肆", "伍", "陆"];

/**
 * 4-bo'lim: OSHPAZ TANLOVI — "degustatsiya kitobi" (namunalar: 08 sakuri, 09 3D detallar, 10 vertikal yorliq).
 * Har taom — alohida bob: chinni tarelka atrofida scroll'da chiziladigan tush "enso" halqasi va aylanuvchi
 * oltin shkala, chetida vertikal qizil yorliq va muhr, ortida ulkan konturli raqam; matn tomonda —
 * bob belgisi, mo'yqalam nom, nafis serif sarlavha, nuqtali spetsifikatsiya ro'yxati va narx.
 */
export default async function Showcase({ locale, dishes }: { locale: string; dishes: HomeDish[] }) {
  const t = await getTranslations({ locale, namespace: "Home2" });
  const st = await getTranslations({ locale, namespace: "Site" });

  return (
    <section className="relative isolate overflow-hidden bg-sand pb-40 pt-16 sm:pb-48 sm:pt-20 lg:pb-56">
      {/* Fon: nozik panjara, tush tog'lari va qushlar */}
      <span aria-hidden="true" className="lattice-bg pointer-events-none absolute inset-0 -z-10 text-fire/[0.035]" />
      <Birds className="absolute right-[7%] top-24 -z-10 w-32 text-content/20 sm:w-48" />
      <Mountains className="absolute inset-x-0 bottom-0 -z-10 h-40 w-full text-paper sm:h-56" />

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
        {/* Boblar mundarijasi: 壹 — 贰 — 叁 */}
        <Reveal y={12} className="mt-8 flex items-center justify-center gap-4">
          <span aria-hidden="true" className="h-px w-16 bg-gradient-to-r from-transparent to-brand-gold sm:w-28" />
          <span aria-hidden="true" lang="zh" className="font-cn flex gap-5 text-xl text-fire-ink">
            {dishes.map((d, i) => <span key={d.id}>{CN_NUM[i]}</span>)}
          </span>
          <span aria-hidden="true" className="h-px w-16 bg-gradient-to-l from-transparent to-brand-gold sm:w-28" />
        </Reveal>

        <div className="mt-20 space-y-28 sm:mt-28 sm:space-y-36 lg:space-y-44">
          {dishes.map((d, i) => {
            const flip = i % 2 === 1;
            const n = String(i + 1).padStart(2, "0");
            const specs = [
              d.grams ? { k: t("specWeight"), v: t("grams", { n: d.grams }) } : null,
              d.mins ? { k: t("specTime"), v: t("minutes", { n: d.mins }) } : null,
              d.spicy > 0 ? { k: t("specSpice"), v: t(`spicy.${SPICY_KEYS[d.spicy]}`), heat: d.spicy } : null,
            ].filter(Boolean) as { k: string; v: string; heat?: number }[];
            const tags = [
              d.halal ? { icon: ShieldCheck, label: st("halal") } : null,
              d.veg ? { icon: LeafIcon, label: t("veg") } : null,
            ].filter(Boolean) as { icon: typeof ShieldCheck; label: string }[];
            const label = d.zh ?? d.glyph;

            return (
              <article key={d.id} className="relative grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
                {/* ---------- Tarelka ---------- */}
                <div className={cn("relative mx-auto w-[min(70vw,290px)] sm:w-[380px] lg:w-[430px]", flip && "lg:order-2")}>
                  {/* Ulkan konturli bob raqami */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "font-poster pointer-events-none absolute -top-[42%] z-0 select-none text-[clamp(5.5rem,16vw,10rem)] leading-none text-transparent opacity-35 [-webkit-text-stroke:1.5px_var(--color-fire)]",
                      flip ? "-right-[6%]" : "-left-[10%]"
                    )}
                  >
                    {n}
                  </span>

                  {/* Bug' */}
                  <span aria-hidden="true" className="pointer-events-none absolute -top-[14%] left-1/2 z-20 flex -translate-x-1/2 gap-5">
                    {[0, 1.2, 2.4].map((delay) => (
                      <span key={delay} className="animate-steam block h-16 w-4 rounded-full bg-paper/80 blur-md" style={{ animationDelay: `${delay}s` }} />
                    ))}
                  </span>

                  <Parallax speed={16} className={cn("absolute z-20 w-[34%]", flip ? "-left-[14%] bottom-[2%]" : "-right-[12%] bottom-[0%]")}>
                    <Sprig className={cn("aspect-[4/3] w-full rotate-180", flip && "-scale-x-100")} tone="jade" />
                  </Parallax>

                  <ShowcaseArt flip={flip} className="z-10">
                    <div className="h-full w-full rounded-full bg-paper p-[3.5%] shadow-[0_40px_70px_-30px] shadow-content/45">
                      <SafeImg
                        src={d.img}
                        alt={d.name}
                        className="h-full w-full rounded-full ring-1 ring-fire/20"
                        fallback={<PorcelainPlate char={d.glyph} glyph="text-[6rem] sm:text-[8rem] lg:text-[9rem]" />}
                      />
                    </div>
                  </ShowcaseArt>

                  {/* Vertikal qizil yorliq (namuna 10) + muhr */}
                  <div
                    aria-hidden="true"
                    className={cn("absolute top-[6%] z-30 flex flex-col items-center gap-2", flip ? "-left-[6%] sm:-left-[10%]" : "-right-[4%] sm:-right-[8%]")}
                  >
                    <span className="rounded-[3px] bg-fire p-1 shadow-xl shadow-fire/30">
                      <span lang="zh" className="font-cn block border border-brand-gold/70 px-1 py-2 text-base leading-[1.15] tracking-[0.12em] text-brand-cream [writing-mode:vertical-rl] sm:px-1.5 sm:py-3 sm:text-2xl">
                        {label}
                      </span>
                    </span>
                    <span lang="zh" className="font-cn flex size-7 items-center justify-center rounded-[3px] border-2 border-fire text-sm sm:size-9 sm:text-lg leading-none text-fire-ink">
                      {CN_NUM[i]}
                    </span>
                  </div>
                </div>

                {/* ---------- Matn ---------- */}
                <Reveal y={40} className={cn("relative min-w-0", flip && "lg:order-1")}>
                  {/* Bob belgisi */}
                  <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-muted">
                    <span className="text-fire-ink">{t("showCourse", { n: i + 1 })}</span>
                    <span aria-hidden="true" className="h-px w-10 bg-brand-gold" />
                    <span translate="no">{n} / {String(dishes.length).padStart(2, "0")}</span>
                  </p>

                  <div className="mt-6 border-l border-brand-gold/60 pl-6 sm:pl-8">
                    {d.zh && <p lang="zh" className="font-cn text-4xl leading-none text-fire-ink sm:text-5xl">{d.zh}</p>}
                    <h3 className="mt-4 text-balance font-display text-[2.6rem] leading-[1.06] text-content sm:text-6xl">{d.name}</h3>
                    <p className="mt-3 font-display text-lg italic text-muted">{d.catName}</p>
                    {d.desc && <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-muted">{d.desc}</p>}

                    {/* Spetsifikatsiya — menyu kartasidagi nuqtali qatorlar */}
                    {specs.length > 0 && (
                      <RevealGroup className="mt-8 max-w-md" stagger={0.08} y={12}>
                        {specs.map((s) => (
                          <dl key={s.k} className="flex items-baseline gap-3 py-2 text-[15px]">
                            <dt className="shrink-0 text-muted">{s.k}</dt>
                            <dd className="flex min-w-0 flex-1 items-center gap-1.5 font-semibold text-content">
                              <span aria-hidden="true" className="mr-1.5 min-w-6 flex-1 translate-y-[3px] self-center border-b border-dotted border-content/30" />
                              {s.heat ? (
                                <span aria-hidden="true" className="flex">
                                  {Array.from({ length: s.heat }).map((_, k) => <Flame key={k} size={14} className="fill-fire text-fire" />)}
                                </span>
                              ) : null}
                              {s.v}
                            </dd>
                          </dl>
                        ))}
                      </RevealGroup>
                    )}
                    {tags.length > 0 && (
                      <ul className="mt-5 flex flex-wrap gap-2">
                        {tags.map((c) => (
                          <li key={c.label} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-jade/40 px-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-content">
                            <c.icon size={14} aria-hidden="true" className="text-jade" />
                            {c.label}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
                      <span className="inline-flex flex-wrap items-baseline gap-x-3">
                        <span translate="no" className="font-display text-4xl text-fire-ink sm:text-5xl">{formatMoney(d.price)}</span>
                        {d.oldPrice != null && <s className="text-lg text-muted">{formatMoney(d.oldPrice)}</s>}
                      </span>
                      <ButtonLink href="/reservation" variant="fire" className="group">
                        {t("preorder")}
                        <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                      </ButtonLink>
                    </div>
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
