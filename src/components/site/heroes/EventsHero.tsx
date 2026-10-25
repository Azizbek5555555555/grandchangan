import LanternsDrop from "@/components/site/home/LanternsDrop";
import { cn } from "@/lib/utils";
import { ENTER, HeroTitle } from "./parts";

/**
 * TADBIRLAR hero'si — "bazm zali": to'q vino fon, tepadan tushib chayqaladigan 2D fonarlar, markazda
 * oltin halqali 囍 (qo'sh baxt) medalyoni, uning ostida sarlavha va izoh; fon rasmi bo'lsa — xira qatlam
 * ostida. Pastki chetda oltin chiziq; keyingi bo'lim (qorong'i) shu rangdan to'lqin bilan boshlanadi.
 */
export default function EventsHero({
  title, sub, kinds, bgImage,
}: { title: string; sub: string; kinds: string[]; bgImage: string | null }) {
  return (
    <section className="relative isolate overflow-hidden bg-wine pb-20 pt-40 text-center text-brand-cream sm:pb-24 sm:pt-44">
      {bgImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bgImage} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-30 mix-blend-luminosity" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-wine/70 via-wine/85 to-wine" />
        </>
      )}
      <span aria-hidden="true" className="lattice-bg pointer-events-none absolute inset-0 -z-10 text-wine-deep/80" />
      <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/3 -z-10 size-[40rem] -translate-x-1/2 rounded-full bg-fire/25 blur-[110px]" />

      {/* Fonarlar header ostidan osiladi */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-20 sm:top-24">
        <LanternsDrop
          items={[
            { left: "4%", size: 70, rope: 60, char: "囍" },
            { left: "15%", size: 50, rope: 150, char: "福" },
            { left: "80%", size: 54, rope: 120, char: "寿" },
            { left: "90%", size: 72, rope: 40, char: "喜" },
          ]}
          className="hidden md:block"
        />
        <LanternsDrop items={[{ left: "6%", size: 44, rope: 20, char: "囍" }, { left: "82%", size: 44, rope: 40, char: "福" }]} className="md:hidden" />
      </div>

      <div className="relative mx-auto max-w-4xl px-5 sm:px-8">
        {/* 囍 medalyoni */}
        <div aria-hidden="true" className={cn(ENTER, "relative mx-auto size-32 sm:size-40")}>
          <span className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-brand-gold/50" />
          <span className="absolute inset-[8%] rounded-full border-2 border-brand-gold/80 bg-fire shadow-[0_0_60px_-10px] shadow-saffron/50" />
          <span className="absolute inset-[16%] rounded-full border border-brand-gold/50" />
          <span lang="zh" className="font-cn absolute inset-0 flex items-center justify-center text-6xl leading-none text-saffron sm:text-7xl">囍</span>
        </div>

        <HeroTitle text={title} className="mt-8 font-poster text-[clamp(2.2rem,8vw,5.6rem)] leading-[1.08] text-brand-cream" />
        <p className={cn(ENTER, "mx-auto mt-5 max-w-xl text-lg leading-relaxed text-brand-cream/85 delay-200")}>{sub}</p>

        {kinds.length > 0 && (
          <ul className={cn(ENTER, "mt-9 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 delay-300")}>
            {kinds.map((k, i) => (
              <li key={k} className="flex items-center gap-4 font-display text-lg italic text-brand-gold-light sm:text-xl">
                {i > 0 && <span aria-hidden="true" className="text-[9px] not-italic text-saffron">◆</span>}
                {k}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
