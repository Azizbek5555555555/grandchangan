import Parallax from "@/components/motion/Parallax";
import FretBand from "@/components/site/kit/FretBand";
import Wave from "@/components/site/kit/Wave";
import SafeImg from "@/components/site/home/SafeImg";
import { Birds, Mountains, SealStamp } from "@/components/site/pages/InkDecor";
import { cn } from "@/lib/utils";
import { ENTER, HeroTitle } from "./parts";

/** Oy darvoza ichidagi zaxira manzara: qizil quyosh, tumanli tog'lar, qushlar */
function GateScene() {
  return (
    <div aria-hidden="true" className="absolute inset-0 bg-paper">
      <span className="absolute left-[56%] top-[20%] size-[26%] rounded-full bg-fire" />
      <Birds className="absolute left-[16%] top-[28%] w-[34%] text-content/40" />
      <Mountains className="absolute inset-x-0 bottom-0 h-[55%] w-full text-content/50" />
    </div>
  );
}

/**
 * BIZ HAQIMIZDA hero'si — "oy darvoza" (月亮门): qum rangli panjarali devor, uning o'rtasida dumaloq
 * darvoza (vino hoshiya + oltin halqa), ichida restoran rasmi yoki tush manzarasi. Chapda vertikal
 * xitoycha yozuv va muhr, nafis serif sarlavha. Darvoza scroll'da sekin siljiydi (parallaks).
 */
export default function AboutHero({
  title, sub, eyebrow, image,
}: { title: string; sub: string; eyebrow: string; image: string | null }) {
  return (
    <section className="relative isolate overflow-hidden bg-sand pb-28 pt-28 sm:pb-32 sm:pt-32">
      <span aria-hidden="true" className="lattice-bg pointer-events-none absolute inset-0 -z-10 text-fire/[0.07]" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
        <div className="flex min-w-0 gap-6 sm:gap-8">
          <div aria-hidden="true" className="hidden shrink-0 flex-col items-center gap-4 pt-2 sm:flex">
            <span lang="zh" className="font-cn text-3xl leading-[1.2] tracking-[0.15em] text-fire-ink [writing-mode:vertical-rl]">长安至撒马尔罕</span>
            <SealStamp text="丝路" />
          </div>
          <div className="min-w-0">
            <p className={cn(ENTER, "text-[11px] font-semibold uppercase tracking-[0.32em] text-fire-ink sm:text-xs")}>{eyebrow}</p>
            <HeroTitle text={title} className="mt-5 font-display text-[clamp(3rem,10vw,6.8rem)] font-normal leading-[1.05] text-content" />
            <p className={cn(ENTER, "mt-6 max-w-md font-display text-2xl italic leading-snug text-muted delay-200")}>{sub}</p>
          </div>
        </div>

        {/* Oy darvoza */}
        <Parallax speed={6} className="relative mx-auto w-full max-w-[34rem]">
          <div className={cn(ENTER, "relative aspect-[4/5] overflow-hidden rounded-t-[3rem] bg-wine p-5 shadow-[0_40px_80px_-40px] shadow-wine delay-200 sm:p-7")}>
            <span aria-hidden="true" className="lattice-bg absolute inset-0 text-brand-gold/25" />
            <span aria-hidden="true" className="absolute inset-3 rounded-t-[2.4rem] border border-brand-gold/40" />
            <div className="relative flex h-full items-center justify-center">
              <div className="relative aspect-square w-[86%] rounded-full bg-brand-gold/70 p-[2.5%] shadow-2xl shadow-night/60">
                <SafeImg src={image} className="h-full w-full rounded-full" fallback={<GateScene />} eager />
                <span aria-hidden="true" className="pointer-events-none absolute inset-[2.5%] rounded-full shadow-[inset_0_0_40px_10px] shadow-night/40" />
              </div>
            </div>
            <FretBand className="absolute inset-x-6 bottom-5 w-auto text-brand-gold/50" />
          </div>
          {/* Darvoza oldidagi tosh zinapoya */}
          <span aria-hidden="true" className="mx-auto block h-3 w-[92%] rounded-b-md bg-wine-deep" />
          <span aria-hidden="true" className="mx-auto block h-3 w-[100%] rounded-b-md bg-night-3" />
        </Parallax>
      </div>
      <Wave className="text-paper" variant="b" />
    </section>
  );
}
