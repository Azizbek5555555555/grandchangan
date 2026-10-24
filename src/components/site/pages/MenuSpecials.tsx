import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn, formatMoney, t } from "@/lib/utils";
import SectionHead from "@/components/site/kit/SectionHead";
import Wave from "@/components/site/kit/Wave";
import Reveal from "@/components/motion/Reveal";
import RevealGroup from "@/components/motion/RevealGroup";
import Parallax from "@/components/motion/Parallax";
import SafeImg from "@/components/site/home/SafeImg";
import { PlateFallback } from "@/components/site/home/Decor";

export type SpecialItem = {
  id: string;
  name: unknown;
  description: unknown;
  ingredients: unknown;
  imageUrl: string | null;
  price: number;
  discountPrice: number | null;
  weightGrams: number | null;
  prepTimeMin: number | null;
  spicyLevel: string;
  isVegetarian: boolean;
  isHalal: boolean;
  isNew: boolean;
  categoryId: string;
};

const usable = (u?: string | null) => (u && (u.startsWith("/uploads") || u.startsWith("http")) ? u : null);
const zh = (v: unknown) => (v && typeof v === "object" ? String((v as Record<string, string>).zh || "") : "");
const SPICY: Record<string, number> = { NONE: 0, MILD: 1, MEDIUM: 2, HOT: 3, EXTRA_HOT: 4 };

/**
 * Menyu tepasi — "Oshpaz tanlovi" (namuna: 湯包家): qorong'i fon, tarelkalar chap/o'ng almashadi,
 * har birida vertikal xitoycha yorliq, xususiyatlar ro'yxati (zafar nuqtalar), tarkibi va "Buyurtma" havolasi.
 */
export async function ChefSignature({ items, locale }: { items: SpecialItem[]; locale: string }) {
  if (!items.length) return null;
  const m = await getTranslations({ locale, namespace: "Menu2" });
  const p = await getTranslations({ locale, namespace: "Pages2" });
  const st = await getTranslations({ locale, namespace: "Site" });

  return (
    <section className="relative isolate overflow-hidden bg-night pb-32 pt-24 text-brand-cream sm:pb-40">
      <Wave top className="text-paper" variant="b" />
      <span aria-hidden="true" className="lattice-bg absolute inset-0 -z-10 text-brand-gold/[0.04]" />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHead align="center" tone="dark" font="serif" cn="招牌菜" eyebrow={m("sigEyebrow")} title={m("sigTitle")} accent={m("sigAccent")} />
        <div className="mt-16 space-y-20 sm:space-y-28">
          {items.map((it, i) => {
            const flip = i % 2 === 1;
            const name = t(it.name, locale);
            const cnName = zh(it.name);
            const comp = t(it.ingredients, locale);
            const feats = [
              it.isHalal ? st("halal") : null,
              it.isVegetarian ? p("veg") : null,
              SPICY[it.spicyLevel] ? p("spicy", { n: SPICY[it.spicyLevel] }) : null,
              it.weightGrams ? p("grams", { n: it.weightGrams }) : null,
              it.prepTimeMin ? m("prep", { n: it.prepTimeMin }) : null,
            ].filter(Boolean) as string[];
            return (
              <article key={it.id} className={cn("grid items-center gap-10 md:grid-cols-2 md:gap-16", flip && "md:[&>*:first-child]:order-2")}>
                <Reveal y={40} className="relative mx-auto w-full max-w-[24rem]">
                  <span aria-hidden="true" className="absolute inset-[-10%] rounded-full bg-fire-deep/25 blur-3xl" />
                  <Parallax speed={flip ? -6 : 6}>
                    <div className="relative aspect-square overflow-hidden rounded-full border-[10px] border-night-3 shadow-2xl shadow-night">
                      <SafeImg src={usable(it.imageUrl)} alt={name} className="h-full w-full" imgClassName="h-full w-full object-cover" fallback={<PlateFallback char={(cnName || name).slice(0, 1)} glyph="text-8xl" />} />
                    </div>
                  </Parallax>
                  {cnName && locale !== "zh" && (
                    <span
                      lang="zh"
                      aria-hidden="true"
                      className={cn(
                        "font-cn absolute top-4 flex items-center rounded-md border border-saffron/40 bg-fire-deep px-2 py-4 text-2xl leading-tight text-brand-cream shadow-lg [writing-mode:vertical-rl] sm:text-3xl",
                        flip ? "-left-2 sm:-left-4" : "-right-2 sm:-right-4"
                      )}
                    >
                      {cnName}
                    </span>
                  )}
                </Reveal>
                <Reveal y={30} delay={0.1}>
                  <p className="font-poster text-5xl text-saffron/30">0{i + 1}</p>
                  <h3 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">{name}</h3>
                  {it.description ? <p className="mt-4 max-w-md text-lg leading-relaxed text-brand-cream/75">{t(it.description, locale)}</p> : null}
                  {feats.length > 0 && (
                    <>
                      <p className="mt-8 inline-block rounded-full bg-night-3 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-light">{m("features")}</p>
                      <ul className="mt-4 grid gap-2.5 text-brand-cream/85 sm:grid-cols-2">
                        {feats.map((f) => (
                          <li key={f} className="flex items-start gap-3"><span className="mt-2 size-2 shrink-0 rounded-full bg-saffron" />{f}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {comp && (
                    <>
                      <p className="mt-6 inline-block rounded-full bg-night-3 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-light">{m("composition")}</p>
                      <p className="mt-3 max-w-md text-brand-cream/75">{comp}</p>
                    </>
                  )}
                  <div className="mt-8 flex flex-wrap items-center gap-6">
                    <p className="font-display text-3xl text-saffron">{formatMoney(it.discountPrice ?? it.price)}</p>
                    <Link href="/reservation" className="inline-flex min-h-11 items-center gap-2 font-semibold text-saffron transition hover:gap-3">
                      {m("order")} <ArrowRight size={18} />
                    </Link>
                  </div>
                </Reveal>
              </article>
            );
          })}
        </div>
      </div>
      <Wave className="text-paper" variant="c" />
    </section>
  );
}

/**
 * Menyu pasti — "Choy marosimi" (namuna: matcha menyusi): ramkali katta panel, chapda kirish ustuni,
 * o'ngda taomlar qorong'i "tosh lagan" ustida: teg, nom, oltin xitoycha nom, tavsif, chiplar, narx.
 */
export async function TeaRitual({ items, locale, anchorId }: { items: SpecialItem[]; locale: string; anchorId: string | null }) {
  if (!items.length) return null;
  const m = await getTranslations({ locale, namespace: "Menu2" });
  const p = await getTranslations({ locale, namespace: "Pages2" });

  return (
    <section className="bg-paper px-5 pb-28 pt-6 sm:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-brand-gold/25 bg-night text-brand-cream shadow-2xl shadow-content/20">
        <span aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 size-[30rem] rounded-full bg-jade/20 blur-3xl" />
        <div className="relative grid lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="flex flex-col justify-between gap-10 border-b border-brand-gold/15 p-8 lg:border-b-0 lg:border-r lg:p-10">
            <div>
              <span lang="zh" aria-hidden="true" className="font-cn flex size-14 items-center justify-center rounded-full border border-brand-gold/40 text-2xl text-brand-gold-light">茶</span>
              <h2 className="mt-6 font-display text-4xl leading-tight">{m("teaTitle")} <i className="text-brand-gold-light">{m("teaAccent")}</i></h2>
              <span className="mt-4 block h-px w-full bg-brand-gold/30" />
              <p className="mt-4 text-sm leading-relaxed text-brand-cream/70">{m("teaSub")}</p>
              {anchorId && (
                <a href={`#cat-${anchorId}`} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-cream/40 px-5 text-sm font-semibold transition hover:border-saffron hover:text-saffron">
                  {m("teaExplore")} <ArrowRight size={16} />
                </a>
              )}
            </div>
            <p lang="zh" aria-hidden="true" className="font-cn hidden text-5xl leading-[1.15] text-brand-gold/25 [writing-mode:vertical-rl] lg:block">一杯清茶</p>
          </div>
          <RevealGroup className="grid sm:grid-cols-2 xl:grid-cols-3" stagger={0.08} y={30}>
            {items.map((it) => {
              const name = t(it.name, locale);
              const cnName = zh(it.name);
              return (
                <article key={it.id} className="flex flex-col border-b border-brand-gold/15 p-7 sm:[&:nth-child(odd)]:border-r xl:[&:nth-child(odd)]:border-r-0 xl:[&:not(:nth-child(3n))]:border-r">
                  <div className="relative mx-auto mb-6 mt-2 h-40 w-full max-w-[13rem]">
                    <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-12 rounded-[50%] bg-night-3 shadow-[0_18px_30px_-12px] shadow-night" />
                    <div className="absolute inset-x-6 bottom-5 top-0 overflow-hidden rounded-full border-4 border-night-2">
                      <SafeImg src={usable(it.imageUrl)} alt={name} className="h-full w-full" imgClassName="h-full w-full object-cover" fallback={<PlateFallback char={(cnName || name).slice(0, 1)} glyph="text-5xl" />} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {it.isNew && <span className="rounded-full border border-saffron/60 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-saffron">{m("new")}</span>}
                    {it.isVegetarian && <span className="rounded-full border border-brand-cream/40 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-cream/85">{p("veg")}</span>}
                  </div>
                  <h3 className="mt-3 font-display text-2xl">{name}</h3>
                  {cnName && locale !== "zh" && <p lang="zh" className="font-cn mt-1 text-sm text-brand-gold-light">{cnName}</p>}
                  {it.description ? <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-brand-cream/65">{t(it.description, locale)}</p> : null}
                  <div className="mt-auto flex items-center justify-between pt-5">
                    <p className="font-semibold text-saffron">{formatMoney(it.discountPrice ?? it.price)}</p>
                    {it.weightGrams ? <span className="rounded-full bg-night-3 px-3 py-1 text-xs text-brand-cream/70">{p("grams", { n: it.weightGrams })}</span> : null}
                  </div>
                </article>
              );
            })}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
