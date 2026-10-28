import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import DishHero from "@/components/site/dish/DishHero";
import DishMore, { type PagerDish } from "@/components/site/dish/DishMore";
import type { CellDish } from "@/components/site/menu/DishCell";
import { SPICY_KEYS, usable } from "@/components/site/home/data";
import { cleanSlug, getDish, getMenuOrder, type MenuOrderItem } from "@/lib/menu/dish";
import { currencyOf, t } from "@/lib/utils";
import { labelsOf, recipeFor, sceneOf } from "@/lib/menu/recipes";
import ExplodeStage from "@/components/site/explode/ExplodeStage";
import SafeImg from "@/components/site/home/SafeImg";
import { PorcelainPlate } from "@/components/site/home/ShowcaseArt";
import { Hand, Layers, Leaf, ShieldCheck, Sprout } from "lucide-react";

// Har so'rovda bazadan (Railway build paytida baza yo'q — statik prerender qilinmaydi)
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.grandchangan.uz";
const SPICY: Record<string, number> = { NONE: 0, MILD: 1, MEDIUM: 2, HOT: 3, EXTRA_HOT: 4 };
const HAN = /\p{Script=Han}/u;
const zhOf = (v: unknown) => (v && typeof v === "object" ? String((v as Record<string, string>).zh || "").trim() : "");
const firstHan = (s: string) => Array.from(s).find((c) => HAN.test(c)) ?? "";

type Params = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const item = await getDish(cleanSlug(slug));
  if (!item) return {};
  const tr = await getTranslations({ locale, namespace: "Dish" });
  const name = t(item.name, locale);
  const desc = t(item.description, locale);
  const img = usable(item.imageUrl);
  return {
    metadataBase: new URL(SITE),
    title: `${name} — GrandChangan`,
    description: desc ? `${desc} — ${tr("metaSuffix")}` : `${name} — ${tr("metaSuffix")}`,
    openGraph: { title: name, description: desc || undefined, images: img ? [{ url: img, width: 800, height: 800, alt: name }] : undefined },
  };
}

function toCell(it: MenuOrderItem, locale: string): CellDish {
  const price = Number(it.price);
  const disc = it.discountPrice != null ? Number(it.discountPrice) : null;
  const hasDisc = disc != null && disc > 0 && disc < price;
  const zh = zhOf(it.name);
  return {
    id: it.id,
    slug: it.slug,
    name: t(it.name, locale),
    zh: locale === "zh" ? null : zh || null,
    desc: t(it.description, locale),
    price: hasDisc ? disc! : price,
    oldPrice: hasDisc ? price : null,
    img: usable(it.imageUrl),
    glyph: firstHan(zh) || firstHan(zhOf(it.category.name)) || "菜",
    spicy: SPICY[it.spicyLevel] ?? 0,
    veg: it.isVegetarian,
    halal: it.isHalal,
    grams: it.weightGrams,
    mins: it.prepTimeMin,
    isNew: it.isNew,
    featured: it.isFeatured,
  };
}

const toPager = (it: MenuOrderItem | undefined, locale: string): PagerDish | null =>
  it ? { slug: it.slug, name: t(it.name, locale), img: usable(it.imageUrl), glyph: firstHan(zhOf(it.name)) || "菜" } : null;

export default async function DishPage({ params }: Params) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const item = await getDish(cleanSlug(slug));
  if (!item) notFound();

  const [order, tr, tc, th, h2, p2, st, m2] = await Promise.all([
    getMenuOrder(),
    getTranslations({ locale, namespace: "Dish" }),
    getTranslations({ locale, namespace: "Common" }),
    getTranslations({ locale, namespace: "Home" }),
    getTranslations({ locale, namespace: "Home2" }),
    getTranslations({ locale, namespace: "Pages2" }),
    getTranslations({ locale, namespace: "Site" }),
    getTranslations({ locale, namespace: "Menu2" }),
  ]);

  const price = Number(item.price);
  const disc = item.discountPrice != null ? Number(item.discountPrice) : null;
  const hasDisc = disc != null && disc > 0 && disc < price;
  const zh = zhOf(item.name);
  const catZh = zhOf(item.category.name);
  const spicy = SPICY[item.spicyLevel] ?? 0;

  // Oldingi/keyingi — menyu tartibida (aylanma); o'xshashlar — shu kategoriyadan, avval rasmlilari
  const idx = order.findIndex((o) => o.id === item.id);
  const prev = idx >= 0 && order.length > 1 ? order[(idx - 1 + order.length) % order.length] : undefined;
  const next = idx >= 0 && order.length > 1 ? order[(idx + 1) % order.length] : undefined;
  const same = order
    .filter((o) => o.categoryId === item.categoryId && o.id !== item.id)
    .sort((a, b) => Number(!!usable(b.imageUrl)) - Number(!!usable(a.imageUrl)));
  const take = same.length >= 6 ? 6 : same.length >= 3 ? 3 : same.length;
  const related = same.slice(0, take).map((o) => toCell(o, locale));

  // Qatlamli 3D bo'lim — taomning retsepti (recipes.ts), nomlar sahifa tilida
  const recipe = recipeFor(item.slug, item.category.slug);
  const labels = labelsOf(recipe, locale);
  const name = t(item.name, locale);
  const glyph = firstHan(zh) || firstHan(catZh) || "菜";
  const img = usable(item.imageUrl);

  return (
    <>
      <SiteHeader />
      <main id="main">
        <DishHero
          d={{
            name,
            zh: locale === "zh" ? null : zh || null,
            desc: t(item.description, locale),
            composition: t(item.ingredients, locale),
            img,
            glyph,
            catName: t(item.category.name, locale),
            catZh: locale === "zh" ? null : catZh || null,
            catHref: `/menu#cat-${item.categoryId}`,
            spicy,
            veg: item.isVegetarian,
            halal: item.isHalal,
            grams: item.weightGrams,
            mins: item.prepTimeMin,
            price: hasDisc ? disc! : price,
            oldPrice: hasDisc ? price : null,
            currency: currencyOf(locale),
          }}
          l={{
            home: tc("home"),
            menu: tc("menu"),
            book: th("book_table"),
            preorder: tr("preorder"),
            back: tr("back"),
            dineIn: tr("dineIn"),
            composition: m2("composition"),
            spicy: spicy ? h2(`spicy.${SPICY_KEYS[spicy]}`) : "",
            veg: p2("veg"),
            halal: st("halal"),
            grams: item.weightGrams ? p2("grams", { n: item.weightGrams }) : "",
            mins: item.prepTimeMin ? p2("minutes", { n: item.prepTimeMin }) : "",
          }}
        />
        <ExplodeStage
          cn="层层"
          eyebrow={h2("explodeEyebrow")}
          title={tr("layersTitle")}
          accent={tr("layersAccent")}
          sub={tr("layersSub", { name })}
          labels={labels}
          facts={[
            { icon: Layers, label: tr("layersN", { n: labels.length }) },
            item.isHalal
              ? { icon: ShieldCheck, label: h2("explodeFact3") }
              : item.isVegetarian
                ? { icon: Leaf, label: p2("veg") }
                : { icon: Hand, label: tr("factCrafted") },
            { icon: Sprout, label: tr("factFresh") },
          ]}
          fig={name}
          figCn="一品一味"
          glyph={glyph}
          poem="一菜一味 · 层层入味"
          recipe={sceneOf(recipe)}
          waveTop="text-night"
          fallback={
            <div className="flex h-full items-center justify-center">
              <SafeImg src={img} alt="" className="aspect-square h-[80%] max-h-full rounded-full ring-1 ring-brand-gold/30" imgClassName="rounded-full" fallback={<PorcelainPlate char={glyph} glyph="text-8xl" />} />
            </div>
          }
        />
        <DishMore
          waveTop="text-night"
          related={related}
          prev={toPager(prev, locale)}
          next={toPager(next, locale)}
          l={{ eyebrow: tr("relEyebrow"), title: tr("relTitle"), accent: tr("relAccent"), prev: tr("prev"), next: tr("next"), back: tr("back") }}
        />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
