import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import ExplodedDish from "@/components/three/ExplodedDish";
import type { ExplodeView } from "@/components/three/scenes/ExplodedDishScene";
import SectionHead from "@/components/site/kit/SectionHead";
import Wave from "@/components/site/kit/Wave";
import type { SceneRecipe } from "@/lib/menu/recipe-types";
import ExplodeHud from "./ExplodeHud";

/** Kadr burchagi (oltin "viewfinder" chizig'i) */
function Corner({ className }: { className: string }) {
  return <span aria-hidden="true" className={`absolute size-7 border-brand-gold/55 sm:size-10 ${className}`} />;
}

export type ExplodeStageProps = {
  /** Sarlavha oldidagi xitoycha yozuv */
  cn: string;
  eyebrow: string;
  title: string;
  accent: string;
  sub: string;
  /** Qatlam nomlari — yuqoridan pastga (oxirgisi — idish) */
  labels: string[];
  facts: { icon: LucideIcon; label: string }[];
  /** Kadr yorlig'i (taom nomi) */
  fig: string;
  /** Kadr pastidagi xitoycha yozuv */
  figCn: string;
  /** Ortidagi ulkan konturli ieroglif */
  glyph: string;
  /** O'ng chetdagi vertikal she'r */
  poem: string;
  recipe: SceneRecipe;
  view?: ExplodeView;
  /** Tepadagi to'lqin rangi (oldingi bo'lim rangi) */
  waveTop: string;
  /** WebGL bo'lmasa — 3D o'rniga */
  fallback?: ReactNode;
};

/**
 * Qatlamli bo'lim ("Bir kosada — butun hikoya"): baland bo'lim, ichida yopishqoq (sticky) ekran. Scroll qilinganda
 * 3D taom qatlamlarga ajraladi va har qatlam nomi chiqadi. Bosh sahifa lag'moni va har bir taom sahifasi shu bo'limdan
 * foydalanadi. Premium detallar: ortida ulkan konturli ieroglif, oltin kadr burchaklari va yorliq, chap tomonda jonli
 * qatlam ko'rsatkichi (ExplodeHud) va uch fakt, o'ng chetda vertikal she'r, pastda masalliqlar lentasi.
 */
export default function ExplodeStage(p: ExplodeStageProps) {
  const ticker = [...p.labels, ...p.labels];
  return (
    <section data-explode-track className="relative h-[230vh] bg-night text-brand-cream lg:h-[260vh]">
      <Wave top className={p.waveTop} variant="c" />
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <span aria-hidden="true" className="lattice-bg pointer-events-none absolute inset-0 text-brand-gold/[0.04]" />
        <span aria-hidden="true" className="pointer-events-none absolute -left-40 top-1/3 size-[32rem] rounded-full bg-fire-deep/25 blur-3xl" />
        <span aria-hidden="true" className="pointer-events-none absolute right-[8%] top-1/2 size-[36rem] -translate-y-1/2 rounded-full bg-saffron/[0.06] blur-3xl" />

        {/* Ulkan konturli ieroglif — taom ortida */}
        <span
          aria-hidden="true"
          lang="zh"
          className="font-cn pointer-events-none absolute right-[2%] top-1/2 hidden -translate-y-1/2 select-none text-[34rem] leading-none text-transparent opacity-[0.16] [-webkit-text-stroke:1px_var(--color-brand-gold)] lg:block xl:right-[8%]"
        >
          {p.glyph}
        </span>

        {/* O'ng chetda vertikal she'r */}
        <div aria-hidden="true" className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-4 2xl:flex">
          <span className="h-20 w-px bg-gradient-to-b from-transparent to-brand-gold/50" />
          <span lang="zh" className="font-cn text-lg tracking-[0.4em] text-brand-gold/60 [writing-mode:vertical-rl]">{p.poem}</span>
          <span className="h-20 w-px bg-gradient-to-t from-transparent to-brand-gold/50" />
        </div>

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-2 px-5 pt-16 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8 lg:pt-0">
          <div className="min-w-0">
            <SectionHead tone="dark" font="serif" cn={p.cn} eyebrow={p.eyebrow} title={p.title} accent={p.accent} sub={p.sub} />
            <ExplodeHud labels={p.labels} className="mt-10 hidden lg:block" />
            <ul className="mt-10 hidden max-w-md grid-cols-3 border-t border-brand-cream/10 pt-6 lg:grid">
              {p.facts.map((f) => (
                <li key={f.label} className="flex flex-col gap-2 border-l border-brand-cream/10 px-4 first:border-l-0 first:pl-0">
                  <f.icon size={18} aria-hidden="true" className="text-saffron" />
                  <span className="text-[13px] font-medium leading-snug text-brand-cream/75">{f.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            {/* Oltin kadr burchaklari va "rasm" yorlig'i */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-[4%] inset-y-[6%] hidden md:block">
              <Corner className="left-0 top-0 border-l border-t" />
              <Corner className="right-0 top-0 border-r border-t" />
              <Corner className="bottom-0 left-0 border-b border-l" />
              <Corner className="bottom-0 right-0 border-b border-r" />
              <span className="absolute left-12 right-12 top-2.5 flex items-center gap-2 truncate text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-gold/70">
                <span lang="zh" className="font-cn text-sm tracking-normal text-saffron">图一</span>
                <span className="truncate">{p.fig}</span>
              </span>
              <span lang="zh" className="font-cn absolute bottom-2 right-12 text-sm text-brand-gold/60">{p.figCn}</span>
            </div>
            <ExplodedDish recipe={p.recipe} labels={p.labels} view={p.view} fallback={p.fallback} className="h-[40svh] w-full sm:h-[60svh] lg:h-[86svh]" />
            {/* Telefon: qatlam nomlari ro'yxat ko'rinishida (3D yorliqlar tor ekranda sig'maydi) */}
            <ol className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-brand-cream/80 md:hidden">
              {p.labels.map((l, i) => (
                <li key={`${i}-${l}`} className="flex items-start gap-2">
                  <span className="font-poster text-xs leading-5 text-saffron">0{i + 1}</span>
                  <span className="font-display italic leading-5">{l}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Pastki masalliqlar lentasi */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-5 hidden overflow-hidden border-y border-brand-gold/15 py-2.5 md:block">
          <div className="animate-marquee flex w-max gap-10 whitespace-nowrap [animation-duration:60s]">
            {[0, 1].map((k) => (
              <span key={k} className="flex gap-10">
                {ticker.map((l, i) => (
                  <span key={`${k}-${i}`} className="flex items-center gap-10 font-display text-sm italic text-brand-cream/45">
                    {l}
                    <span className="text-[8px] not-italic text-saffron/70">◆</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
