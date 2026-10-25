import Wave from "@/components/site/kit/Wave";
import { GlyphPanel } from "@/components/site/home/Decor";
import { cn } from "@/lib/utils";
import { ENTER, HeroTitle } from "./parts";

const TILES = [
  { char: "宴", tone: "fire" },
  { char: "茶", tone: "night" },
  { char: "福", tone: "saffron" },
  { char: "春", tone: "wine" },
  { char: "龙", tone: "night" },
  { char: "喜", tone: "fire" },
] as const;

/** Bir qator "kinolenta": kadrlar ikki marta takrorlanadi (uzluksiz aylanish uchun) */
function Strip({ urls, reverse, offset = 0 }: { urls: string[]; reverse?: boolean; offset?: number }) {
  type Frame = { u: string | null; tile: (typeof TILES)[number] };
  const base: Frame[] = urls.length
    ? urls.map((u, i) => ({ u, tile: TILES[i % TILES.length] }))
    : TILES.map((_, i) => ({ u: null, tile: TILES[(i + offset) % TILES.length] }));
  // keng ekranni to'ldirish uchun kamida 8 kadr
  let row = base;
  while (row.length < 8) row = [...row, ...base];
  return (
    <div className={cn("flex w-max gap-4 sm:gap-5", reverse ? "animate-marquee-rev" : "animate-marquee", "[animation-duration:70s]")}>
      {[0, 1].map((k) => (
        <div key={k} className="flex gap-4 sm:gap-5">
          {row.map((f, i) => (
            <div key={`${k}-${i}`} className="relative h-36 w-52 shrink-0 overflow-hidden rounded-[18px] border border-brand-gold/25 bg-night-3 sm:h-48 sm:w-72">
              {f.u ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.u} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              ) : (
                <GlyphPanel char={f.tile.char} tone={f.tile.tone} size="text-6xl" />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * GALEREYA hero'si — "kinolenta": qorong'i fonda markazda sarlavha, ostida ikki qator qiya lenta
 * qarama-qarshi tomonga oqadi (galereya rasmlari; rasm bo'lmasa — ieroglif panellari). Qatorlar
 * chetlarda xira tortadi, tepa-pastida huiwen naqsh lentasi.
 */
export default function GalleryHero({ title, sub, urls }: { title: string; sub: string; urls: string[] }) {
  const pics = urls.slice(0, 10);
  return (
    <section className="relative isolate overflow-hidden bg-night pb-28 pt-28 text-brand-cream sm:pb-36 sm:pt-32">
      <span aria-hidden="true" className="lattice-bg pointer-events-none absolute inset-0 -z-10 text-brand-gold/[0.03]" />
      <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-24 -z-10 h-80 w-[60rem] -translate-x-1/2 rounded-[50%] bg-fire-deep/25 blur-[100px]" />

      <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
        <p aria-hidden="true" className={cn(ENTER, "flex items-center justify-center gap-4")}>
          <span className="h-px w-12 bg-brand-gold/60" />
          <span lang="zh" className="font-cn text-3xl leading-none text-saffron">画廊</span>
          <span className="h-px w-12 bg-brand-gold/60" />
        </p>
        <HeroTitle text={title} className="mt-5 font-display text-[clamp(3rem,11vw,7.5rem)] font-normal italic leading-[1.05] text-brand-cream" />
        <p className={cn(ENTER, "mx-auto mt-5 max-w-lg text-lg text-brand-cream/80 delay-200")}>{sub}</p>
      </div>

      {/* Qiya kinolenta */}
      <div aria-hidden="true" className={cn(ENTER, "relative -mx-[6vw] mt-14 -rotate-3 space-y-4 delay-300 sm:mt-16 sm:space-y-5 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]")}>
        <div className="fret-band h-3 text-brand-gold/20" />
        <Strip urls={pics.filter((_, i) => i % 2 === 0)} />
        <Strip urls={pics.length > 1 ? pics.filter((_, i) => i % 2 === 1) : pics} reverse offset={3} />
        <div className="fret-band h-3 text-brand-gold/20" />
      </div>

      <Wave className="text-paper" />
    </section>
  );
}
