import FretBand from "@/components/site/kit/FretBand";
import { cn } from "@/lib/utils";
import { ENTER, HeroTitle } from "./parts";

/**
 * BLOG hero'si — gazeta "masthead"i: krem qog'oz, qo'sh chiziqlar orasida sana va "长安日报"
 * (Chang'an kundaligi) muhri, butun kenglikdagi ulkan afisha sarlavha, ostida uch ustunli qator
 * (izoh · mo'yqalam muhr · maqolalar soni). Rang — semantik tokenlar, qorong'i temada o'zi qorayadi.
 */
export default function BlogHero({
  title, sub, paperName, dateLine, countLine, city,
}: { title: string; sub: string; paperName: string; dateLine: string; countLine: string; city: string }) {
  return (
    <section className="relative isolate overflow-hidden bg-paper pb-10 pt-28 text-content sm:pt-32">
      <span aria-hidden="true" className="lattice-bg pointer-events-none absolute inset-0 -z-10 text-content/[0.03]" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Yuqori qator: sana · gazeta nomi · shahar */}
        <div className={cn(ENTER, "flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-y-[3px] border-double border-content/70 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted sm:text-xs")}>
          <span>{dateLine}</span>
          <span className="flex items-center gap-3 text-content">
            <span aria-hidden="true" lang="zh" className="font-cn text-xl normal-case tracking-[0.2em] text-fire-ink sm:text-2xl">长安日报</span>
            <span className="hidden sm:inline">{paperName}</span>
          </span>
          <span>{city}</span>
        </div>

        <HeroTitle
          text={title}
          className="mt-6 font-poster text-[clamp(3.4rem,15vw,12rem)] uppercase leading-[1.05] tracking-[-0.01em] text-content sm:mt-8"
        />

        <div className={cn(ENTER, "mt-6 grid gap-6 border-t border-content/70 pt-5 delay-200 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center")}>
          <p className="max-w-sm font-display text-xl italic leading-snug text-content">{sub}</p>
          <span aria-hidden="true" lang="zh" className="font-cn hidden size-16 items-center justify-center rounded-[4px] bg-fire text-2xl leading-[1.1] text-brand-cream [writing-mode:vertical-rl] sm:flex">
            文章
          </span>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted sm:text-right">{countLine}</p>
        </div>
        <FretBand className="mt-8 text-fire/25" />
      </div>
    </section>
  );
}
