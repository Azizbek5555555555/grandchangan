import { ArrowRight, Clock } from "lucide-react";
import ButtonLink from "@/components/site/kit/ButtonLink";
import { cn } from "@/lib/utils";

/**
 * Hero matni (hook'siz — server'da render bo'ladi): eyebrow, sarlavha, tavsif, tugmalar va raqamlar lentasi.
 * Kirish animatsiyasi — sof CSS (@starting-style): JS'siz ham ishlaydi, kontent JS'siz ham ko'rinadi.
 * Sarlavha so'zlari niqob ichidan pastdan ko'tariladi (zh — har ieroglif alohida).
 */

/** Pastdan chiqib keluvchi blok (kechikish — style transitionDelay orqali) */
export const ENTER =
  "transition-[opacity,translate] duration-[1200ms] ease-out-expo starting:translate-y-6 starting:opacity-0 motion-reduce:transition-none";

const delay = (ms: number) => ({ transitionDelay: `${ms}ms` });

export type HeroFact = { value: string; label: string };

type CopyProps = {
  tag: string;
  lines: string[];
  accentLine: number;
  sub: string;
  cnHeadline: boolean;
  bookLabel: string;
  menuLabel: string;
};

export function HeroCopy({ tag, lines, accentLine, sub, cnHeadline, bookLabel, menuLabel }: CopyProps) {
  // So'zlar ketma-ket (qatorlar bo'ylab) chiqadi
  let w = 0;
  return (
    <div className="min-w-0 max-w-[42rem]">
      {/* ---------- Eyebrow: oltin chiziq + teg ---------- */}
      <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.38em] text-brand-gold-light sm:gap-4 sm:text-xs">
        <span
          aria-hidden="true"
          className="h-px w-10 origin-left bg-gradient-to-r from-brand-gold to-brand-gold-light transition-[scale] duration-[1400ms] ease-out-expo starting:scale-x-0 motion-reduce:transition-none sm:w-16"
        />
        <span className={ENTER} style={delay(150)}>{tag}</span>
      </p>

      {/* ---------- Sarlavha ---------- */}
      <h1
        lang={cnHeadline ? "zh" : undefined}
        className={cn(
          "mt-4 text-brand-cream sm:mt-5",
          cnHeadline
            ? "font-cn text-[clamp(3.25rem,min(7.4vw,11svh),6.75rem)] leading-[1.14]"
            : "font-display text-[clamp(2.5rem,min(6.2vw,8.8svh),5.6rem)] font-normal leading-[1.06] tracking-[-0.015em]"
        )}
      >
        {lines.map((line, i) => {
          const parts = cnHeadline ? Array.from(line) : line.split(/\s+/).filter(Boolean);
          return (
            // Niqob: padding + manfiy margin — kursiv/diakritik belgilar kesilmaydi, qator oralig'i o'zgarmaydi
            <span key={i} className="-mx-[0.12em] -mb-[0.16em] -mt-[0.08em] block overflow-clip px-[0.12em] pb-[0.16em] pt-[0.08em]">
              {parts.map((p, j) => (
                <span key={j}>
                  <span
                    className={cn(
                      "inline-block transition-[translate,opacity] duration-[1300ms] ease-out-expo starting:translate-y-[125%] starting:opacity-0 motion-reduce:transition-none",
                      i === accentLine && "italic text-brand-gold-light"
                    )}
                    style={delay(260 + Math.min(w++, 12) * 75)}
                  >
                    {p}
                  </span>
                  {!cnHeadline && j < parts.length - 1 ? " " : null}
                </span>
              ))}
            </span>
          );
        })}
      </h1>

      {/* ---------- Tavsif + tugmalar ---------- */}
      <p className={cn(ENTER, "mt-4 max-w-md text-[15px] leading-relaxed text-brand-cream/85 sm:mt-6 sm:text-lg lg:max-w-lg")} style={delay(620)}>
        {sub}
      </p>
      <div data-hero-cta className={cn(ENTER, "mt-6 flex flex-wrap gap-3 sm:mt-7")} style={delay(760)}>
        <ButtonLink href="/reservation" variant="fire" blob className="group h-12 px-6 text-sm shadow-lg shadow-night/50 sm:h-14 sm:px-8 sm:text-base">
          {bookLabel}
          <ArrowRight size={18} className="transition group-hover:translate-x-1" />
        </ButtonLink>
        <ButtonLink href="/menu" variant="gold-outline" className="h-12 bg-night/45 px-6 text-sm sm:h-14 sm:px-8 sm:text-base">
          {menuLabel}
        </ButtonLink>
      </div>
    </div>
  );
}

/** Raqamlar lentasi (oltin chiziq ustida): stollar, o'rinlar, VIP xonalar va ish vaqti */
export function HeroFacts({ facts, hours }: { facts: HeroFact[]; hours: { value: string; label: string } }) {
  return (
    <dl
      translate="no"
      className="grid grid-cols-3 gap-x-4 gap-y-5 border-t border-brand-gold/25 pt-5 sm:flex sm:gap-0 lg:pt-6"
    >
      {facts.map((f, i) => (
        <div
          key={f.label}
          className={cn(ENTER, "min-w-0 sm:border-r sm:border-brand-gold/15 sm:px-5 sm:first:pl-0 xl:px-7")}
          style={delay(900 + i * 90)}
        >
          <dt className="sr-only">{f.label}</dt>
          <dd className="font-display text-3xl leading-none tabular-nums text-brand-gold-light sm:text-4xl xl:text-5xl">{f.value}</dd>
          <dd aria-hidden="true" className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-cream/80 sm:text-[11px]">
            {f.label}
          </dd>
        </div>
      ))}
      <div
        className={cn(ENTER, "col-span-3 flex min-w-0 items-center gap-3 sm:block sm:px-5 xl:px-7")}
        style={delay(900 + facts.length * 90)}
      >
        <dt className="sr-only">{hours.label}</dt>
        <dd className="flex items-center gap-2 whitespace-nowrap font-display text-2xl leading-none tabular-nums text-brand-gold-light sm:text-3xl xl:text-4xl">
          <Clock size={18} className="shrink-0 text-saffron" aria-hidden="true" />
          {hours.value}
        </dd>
        <dd aria-hidden="true" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-cream/80 sm:mt-2 sm:text-[11px]">
          {hours.label}
        </dd>
      </div>
    </dl>
  );
}
