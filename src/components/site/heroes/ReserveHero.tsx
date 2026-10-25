import { Clock, Phone } from "lucide-react";
import FretBand from "@/components/site/kit/FretBand";
import { cn } from "@/lib/utils";
import { ENTER, HeroTitle } from "./parts";

/**
 * BRON hero'si — "taklifnoma-chipta": krem fonda qizil chipta (oltin ramka, huiwen lenta), o'ng tomonida
 * perforatsiya chizig'i bilan ajratilgan "qirqma" qism va muhr 订座; ostida bron qadamlari (1 → 2 → 3).
 * Chipta kirishda biroz qiyshiq holatdan tekislanadi (sof CSS).
 */
export default function ReserveHero({
  title, sub, ticketLabel, steps, hours, phone,
}: {
  title: string;
  sub: string;
  ticketLabel: string;
  steps: string[];
  hours: string;
  phone: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-paper pb-14 pt-28 sm:pt-32">
      <span aria-hidden="true" className="lattice-bg pointer-events-none absolute inset-0 -z-10 text-fire/[0.045]" />
      <span aria-hidden="true" lang="zh" className="font-cn pointer-events-none absolute -left-6 top-24 -z-10 select-none text-[11rem] leading-none text-fire/[0.06] sm:text-[16rem]">
        请
      </span>
      <span aria-hidden="true" lang="zh" className="font-cn pointer-events-none absolute -right-6 bottom-0 -z-10 select-none text-[11rem] leading-none text-fire/[0.06] sm:text-[16rem]">
        坐
      </span>

      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        {/* ---------- Chipta ---------- */}
        <div
          className={cn(
            "relative grid overflow-hidden rounded-[26px] bg-fire text-brand-cream shadow-[0_40px_80px_-40px] shadow-fire/60 sm:grid-cols-[minmax(0,1fr)_auto]",
            "transition-[opacity,rotate,translate] duration-[1200ms] ease-out-expo starting:-rotate-2 starting:translate-y-8 starting:opacity-0 motion-reduce:transition-none"
          )}
        >
          <span aria-hidden="true" className="lattice-bg pointer-events-none absolute inset-0 text-fire-deep/50" />
          <span aria-hidden="true" className="pointer-events-none absolute inset-3 rounded-[18px] border border-brand-gold/50" />

          {/* Asosiy qism */}
          <div className="relative min-w-0 px-7 pb-10 pt-8 sm:px-12 sm:pb-12 sm:pt-10">
            <FretBand className="max-w-[16rem] text-brand-gold/60" />
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.36em] text-brand-cream">{ticketLabel}</p>
            <HeroTitle text={title} className="mt-3 font-poster text-[clamp(1.5rem,6.6vw,4.6rem)] leading-[1.08] text-brand-cream" />
            <p className={cn(ENTER, "mt-4 max-w-md text-base leading-relaxed text-brand-cream/90 delay-200 sm:text-lg")}>{sub}</p>
            <div className={cn(ENTER, "mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold delay-300")}>
              <span className="inline-flex items-center gap-2"><Clock size={16} aria-hidden="true" className="text-saffron" />{hours}</span>
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline">
                <Phone size={16} aria-hidden="true" className="text-saffron" />{phone}
              </a>
            </div>
          </div>

          {/* Qirqma qism: perforatsiya + muhr */}
          <div aria-hidden="true" className="relative flex items-center justify-center gap-4 border-t-2 border-dashed border-brand-cream/40 px-8 py-6 sm:w-48 sm:flex-col sm:border-l-2 sm:border-t-0 sm:py-10">
            {/* Chipta o'yiqlari */}
            <span className="absolute -left-4 -top-4 size-8 rounded-full bg-paper sm:-left-4 sm:-top-4" />
            <span className="absolute -right-4 -top-4 size-8 rounded-full bg-paper sm:-bottom-4 sm:-left-4 sm:right-auto sm:top-auto" />
            <span lang="zh" className="font-cn flex h-28 w-14 items-center justify-center rounded-[4px] border-2 border-brand-cream/85 text-3xl leading-[1.15] text-brand-cream [writing-mode:vertical-rl] sm:h-36 sm:w-16 sm:text-4xl">
              订座
            </span>
            <span translate="no" className="font-display text-sm italic tracking-[0.2em] text-brand-gold-light sm:[writing-mode:vertical-rl]">
              GRAND · CHANGAN
            </span>
          </div>
        </div>

        {/* ---------- Qadamlar ---------- */}
        <ol className={cn(ENTER, "mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-3 delay-500")}>
          {steps.map((s, i) => (
            <li key={s} className="relative flex flex-col items-center text-center">
              {i > 0 && <span aria-hidden="true" className="absolute right-[calc(50%+1.6rem)] top-5 w-[calc(100%-2.45rem)] border-t border-dashed border-fire/40" />}
              <span className="relative flex size-10 items-center justify-center rounded-full border border-fire/40 bg-paper font-display text-lg text-fire-ink">{i + 1}</span>
              <span className="mt-3 max-w-full break-words text-[12px] font-semibold leading-snug text-content sm:text-sm sm:uppercase sm:tracking-[0.16em]">{s}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
