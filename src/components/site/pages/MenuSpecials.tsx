import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn, currencyOf, formatMoney, hasPrice, t } from "@/lib/utils";
import SectionHead from "@/components/site/kit/SectionHead";
import Wave from "@/components/site/kit/Wave";
import Reveal from "@/components/motion/Reveal";
import Parallax from "@/components/motion/Parallax";
import { Seal } from "@/components/site/home/Decor";
import { cnShort } from "@/components/site/home/data";
import { PlatedDish } from "@/components/site/menu/Plated";
import DishCell, { type CellDish } from "@/components/site/menu/DishCell";
import { FillerCell } from "@/components/site/menu/Cells";
import { rowFill } from "@/components/site/menu/grid";

export type SpecialItem = {
  id: string;
  slug: string;
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

const usable = (u?: string | null) => (u && (u.startsWith("/uploads") || u.startsWith("/photos/") || u.startsWith("http")) ? u : null);
const zh = (v: unknown) => (v && typeof v === "object" ? cnShort(String((v as Record<string, string>).zh || "")) : "");
const firstHan = (s: string) => Array.from(s).find((c) => /\p{Script=Han}/u.test(c)) ?? "";
const SPICY: Record<string, number> = { NONE: 0, MILD: 1, MEDIUM: 2, HOT: 3, EXTRA_HOT: 4 };

/** Bazadagi taom → menyu katakchasi ma'lumoti */
function toCell(it: SpecialItem, locale: string, fallbackGlyph: string): CellDish {
  const cnName = zh(it.name);
  const hasDisc = it.discountPrice != null && it.discountPrice > 0 && it.discountPrice < it.price;
  return {
    id: it.id,
    slug: it.slug,
    name: t(it.name, locale),
    zh: locale === "zh" ? null : cnName || null,
    desc: t(it.description, locale),
    price: hasDisc ? it.discountPrice! : it.price,
    oldPrice: hasDisc ? it.price : null,
    img: usable(it.imageUrl),
    glyph: firstHan(cnName) || fallbackGlyph,
    spicy: SPICY[it.spicyLevel] ?? 0,
    veg: it.isVegetarian,
    halal: it.isHalal,
    grams: it.weightGrams,
    mins: it.prepTimeMin,
    isNew: it.isNew,
  };
}

/**
 * Menyu tepasi — "Oshpaz tanlovi" (namuna 08 + 10): krem fon (qorong'i hero va qorong'i menyu orasida
 * nafas oladigan joy), tosh tagcha ustidagi katta tarelkalar chap/o'ng almashadi, har birida vertikal
 * qizil xitoycha yorliq, xususiyatlar ro'yxati, tarkibi va "Oldindan buyurtma" havolasi.
 * Pastda to'lqin — keyingi qorong'i menyu rangida.
 */
export async function ChefSignature({ items, locale }: { items: SpecialItem[]; locale: string }) {
  if (!items.length) return null;
  const m = await getTranslations({ locale, namespace: "Menu2" });
  const p = await getTranslations({ locale, namespace: "Pages2" });
  const st = await getTranslations({ locale, namespace: "Site" });

  return (
    <section className="relative isolate overflow-hidden bg-paper pb-32 pt-12 text-content sm:pb-40 sm:pt-16">
      <span aria-hidden="true" className="lattice-bg absolute inset-0 -z-10 text-fire/[0.035]" />
      <span aria-hidden="true" className="pointer-events-none absolute -left-40 top-1/3 -z-10 size-[32rem] rounded-full bg-saffron/10 blur-3xl" />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHead align="center" font="serif" cn="招牌菜" eyebrow={m("sigEyebrow")} title={m("sigTitle")} accent={m("sigAccent")} />
        <div className="mt-14 space-y-20 sm:mt-20 sm:space-y-28">
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
              <article key={it.id} className={cn("grid items-center gap-8 md:grid-cols-2 md:gap-16", flip && "md:[&>*:first-child]:order-2")}>
                <Reveal y={40} className="relative mx-auto w-full max-w-[26rem]">
                  {/* Tagcha ortidagi oltin halqa */}
                  <span aria-hidden="true" className="absolute left-1/2 top-[2%] aspect-square w-[78%] -translate-x-1/2 rounded-full border border-brand-gold/40" />
                  <span aria-hidden="true" className="absolute left-1/2 top-[-4%] aspect-square w-[90%] -translate-x-1/2 animate-spin-slow rounded-full border border-dashed border-brand-gold/25" />
                  <Parallax speed={flip ? -5 : 5}>
                    <div className="group">
                      <PlatedDish img={usable(it.imageUrl)} alt={name} glyph={firstHan(cnName) || name.slice(0, 1)} glyphClass="text-[5rem] sm:text-[6.5rem]" />
                    </div>
                  </Parallax>
                  {cnName && locale !== "zh" && (
                    <span
                      lang="zh"
                      aria-hidden="true"
                      className={cn(
                        "font-cn absolute top-0 flex items-center rounded-md border border-saffron/40 bg-fire-deep px-2 py-4 text-2xl leading-tight text-brand-cream shadow-lg [writing-mode:vertical-rl] sm:text-3xl",
                        flip ? "left-0 sm:-left-4" : "right-0 sm:-right-4"
                      )}
                    >
                      {cnName}
                    </span>
                  )}
                </Reveal>
                <Reveal y={30} delay={0.1}>
                  <p className="flex items-center gap-4">
                    <span className="font-display text-5xl italic leading-none text-fire-ink/30">0{i + 1}</span>
                    <span aria-hidden="true" className="h-px w-16 bg-brand-gold/60" />
                  </p>
                  <h3 className="mt-4 font-display text-4xl leading-[1.08] sm:text-5xl">
                    <Link href={`/menu/${it.slug}`} className="transition-colors hover:text-fire-ink">{name}</Link>
                  </h3>
                  {it.description ? <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">{t(it.description, locale)}</p> : null}
                  {feats.length > 0 && (
                    <>
                      <p className="mt-8 inline-block rounded-full bg-sand px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-fire-ink">{m("features")}</p>
                      <ul className="mt-4 grid gap-2.5 text-content sm:grid-cols-2">
                        {feats.map((f) => (
                          <li key={f} className="flex items-start gap-3"><span className="mt-2 size-2 shrink-0 rotate-45 bg-fire" />{f}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {comp && (
                    <>
                      <p className="mt-6 inline-block rounded-full bg-sand px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-fire-ink">{m("composition")}</p>
                      <p className="mt-3 max-w-md text-muted">{comp}</p>
                    </>
                  )}
                  <div className="mt-8 flex flex-wrap items-center gap-6 border-t border-line pt-6">
                    {hasPrice(it.discountPrice ?? it.price) && <p className="font-display text-3xl tabular-nums text-fire-ink">{formatMoney(it.discountPrice ?? it.price, currencyOf(locale))}</p>}
                    <Link href="/reservation" className="inline-flex min-h-11 items-center gap-2 font-semibold text-fire-ink transition hover:gap-3">
                      {m("order")} <ArrowRight size={18} aria-hidden="true" />
                    </Link>
                  </div>
                </Reveal>
              </article>
            );
          })}
        </div>
      </div>
      <Wave className="text-night" variant="c" />
    </section>
  );
}

/**
 * Menyu pasti — "Choy marosimi" (namuna 03 ning krem varianti): qorong'i menyudan keyin yorug' choyxona.
 * Ramkali panel: chapda kirish ustuni (茶 belgisi, sarlavha, "Barchasini ko'rish"), o'ngda taomlar
 * menyudagi kabi katakchalarda (tosh tagcha, teglar, narx). Oxirgi qator doim to'la.
 */
export async function TeaRitual({ items, locale, anchorId }: { items: SpecialItem[]; locale: string; anchorId: string | null }) {
  if (!items.length) return null;
  const m = await getTranslations({ locale, namespace: "Menu2" });
  const fill = rowFill(items.length);

  return (
    <section className="relative isolate bg-paper px-4 pb-24 pt-10 sm:px-8 sm:pb-32 sm:pt-14">
      <span aria-hidden="true" className="lattice-bg absolute inset-0 -z-10 text-fire/[0.03]" />
      <div className="relative mx-auto max-w-7xl overflow-clip rounded-[1.75rem] border border-line bg-sand shadow-xl shadow-content/5">
        <span aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 size-[30rem] rounded-full bg-jade/10 blur-3xl" />
        <div className="relative grid lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="flex flex-col justify-between gap-10 border-b border-line p-8 lg:border-b-0 lg:border-r lg:p-10">
            <div>
              <span lang="zh" aria-hidden="true" className="font-cn flex size-14 items-center justify-center rounded-full border border-fire/30 text-2xl text-fire-ink">茶</span>
              <h2 className="mt-6 font-display text-4xl leading-[1.08] text-content">{m("teaTitle")} <i className="text-fire-ink">{m("teaAccent")}</i></h2>
              <span aria-hidden="true" className="mt-5 block h-px w-full bg-gradient-to-r from-brand-gold/60 to-transparent" />
              <p className="mt-5 text-sm leading-relaxed text-muted">{m("teaSub")}</p>
              {anchorId && (
                <a href={`#cat-${anchorId}`} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-content/25 px-5 text-sm font-semibold text-content transition hover:border-fire hover:text-fire-ink">
                  {m("teaExplore")} <ArrowRight size={16} aria-hidden="true" />
                </a>
              )}
            </div>
            <Seal text="一杯清茶" className="hidden self-start px-1.5 py-3 text-xl lg:inline-flex" />
          </div>
          <div className="-mb-px min-w-0">
            <div className="-mr-px grid h-full sm:grid-cols-2 xl:grid-cols-3">
              {items.map((it, i) => (
                <DishCell
                  key={it.id}
                  d={toCell(it, locale, "茶")}
                  tone="paper"
                  className={i === items.length - 1 ? fill.last : undefined}
                />
              ))}
              {fill.filler && <FillerCell kind="motto" tone="paper" cnText="以茶会友" className="hidden xl:flex" />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
