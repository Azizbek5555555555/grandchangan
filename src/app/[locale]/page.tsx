import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/utils";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import HomeFloorSection from "@/components/site/HomeFloorSection";
import ButtonLink from "@/components/site/kit/ButtonLink";
import SectionHead from "@/components/site/kit/SectionHead";
import Wave from "@/components/site/kit/Wave";
import Hero from "@/components/site/home/Hero";
import SignatureGrid from "@/components/site/home/SignatureGrid";
import About from "@/components/site/home/About";
import Showcase from "@/components/site/home/Showcase";
import DimSumBand from "@/components/site/home/DimSumBand";
import MenuPreview from "@/components/site/home/MenuPreview";
import ReserveBlock from "@/components/site/home/ReserveBlock";
import GallerySection from "@/components/site/home/GallerySection";
import Reviews from "@/components/site/home/Reviews";
import ExplodeSection from "@/components/site/home/ExplodeSection";
import PanelShowcase from "@/components/site/home/PanelShowcase";
import { DISH_SELECT, glyphOf, splitHeadline, toDish, usable, zhOf } from "@/components/site/home/data";
import type { HomeCategory, HomeDish } from "@/components/site/home/types";
import { ROOMS, floorTotals } from "@/lib/floorplan/layout";
import { dayOfWeekOf, hoursFor, sameEveryDay } from "@/lib/hours";
import { RESTAURANT_TZ, restaurantDay } from "@/lib/time";
import { ArrowRight } from "lucide-react";
import { phoneOf } from "@/lib/contact";
import type { PhotoName } from "@/lib/photos";
import { pic, picGlyph, urlPic, type Pic } from "@/components/site/photos/pics";
import { photoText } from "@/components/site/photos/text";

export const dynamic = "force-dynamic";

const HAN = /\p{Script=Han}/u;

/** Bosh sahifa galereya lentasi — restoranning eng chiroyli joylari (har biri o'z izohi bilan) */
const HOME_GALLERY: PhotoName[] = [
  "hallBarView", "vipGrand", "boothWindow", "hallLongTable2", "bar", "privateRoom", "hallPartitions", "decorShelf",
];
/** Sharhlar sahnasi fonlari (mijoz/taom rasmi bo'lmaganda) — boshqa bo'limlarda takrorlanmaydigan interyerlar */
const STAGE: Pic[] = [
  pic("vipGrand2", "60% 45%"), pic("hallLongTable", "40% 55%"), pic("boothWindow2", "50% 55%"), pic("vipChandelier", "55% 55%"),
  pic("hallRedChairs", "55% 50%"), pic("hallWide", "50% 55%"), pic("vipTable", "50% 55%"),
];

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [h2, st, th, pt] = await Promise.all([
    getTranslations({ locale, namespace: "Home2" }),
    getTranslations({ locale, namespace: "Site" }),
    getTranslations({ locale, namespace: "Home" }),
    photoText(locale),
  ]);

  const [heroBanners, featuredRaw, latestRaw, catsRaw, reviewsRaw, reviewAgg, gallery, workingHours, generalSetting, menuCount] = await Promise.all([
    prisma.banner.findMany({ where: { position: "HERO", isActive: true }, orderBy: { sortOrder: "asc" }, take: 5 }),
    prisma.menuItem.findMany({ where: { isFeatured: true, isAvailable: true, category: { isActive: true } }, take: 6, orderBy: { sortOrder: "asc" }, select: DISH_SELECT }),
    prisma.menuItem.findMany({ where: { isAvailable: true, category: { isActive: true } }, take: 6, orderBy: { createdAt: "desc" }, select: DISH_SELECT }),
    // Menyu bo'limi: mavjud taomi bor faol kategoriyalar (8 tagacha), har biridan 6 tagacha taom
    prisma.menuCategory.findMany({
      where: { isActive: true, items: { some: { isAvailable: true } } },
      orderBy: { sortOrder: "asc" },
      take: 8,
      select: {
        id: true,
        name: true,
        _count: { select: { items: { where: { isAvailable: true } } } },
        items: { where: { isAvailable: true }, take: 6, orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }], select: DISH_SELECT },
      },
    }),
    prisma.review.findMany({
      where: { status: "APPROVED" },
      take: 7,
      orderBy: { createdAt: "desc" },
      select: { id: true, authorName: true, rating: true, comment: true, images: true, menuItem: { select: { name: true, imageUrl: true } } },
    }),
    prisma.review.aggregate({ _avg: { rating: true }, _count: true, where: { status: "APPROVED" } }),
    prisma.galleryImage.findMany({ where: { isActive: true }, take: 8, orderBy: { sortOrder: "asc" } }),
    // Ish vaqti (hero, bron bloki va xarita bo'limi) va telefon (Header bilan bir xil manba)
    prisma.workingHour.findMany({ select: { dayOfWeek: true, openTime: true, closeTime: true, isClosed: true } }),
    prisma.siteSetting.findUnique({ where: { key: "general" } }),
    // Mashhur taomlar taxtasidagi "to'liq menyu" katagi uchun — mavjud taomlar soni
    prisma.menuItem.count({ where: { isAvailable: true } }),
  ]);

  const general = (generalSetting?.value as Record<string, unknown>) || {};
  const phone = phoneOf(general);
  const today = restaurantDay();
  // Restoran vaqti (server hisoblaydi — xarita bo'limi SSR va hydration'da bir xil boshlanadi)
  const nowHM = new Intl.DateTimeFormat("en-GB", { timeZone: RESTAURANT_TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());

  // ---------- Hero ----------
  const now = Date.now();
  const hero = heroBanners.find(
    (b) => t(b.title, locale).trim() && (!b.startAt || b.startAt.getTime() <= now) && (!b.endAt || b.endAt.getTime() >= now)
  );
  const heroTitle = hero ? t(hero.title, locale).trim() : "";
  const lines = heroTitle ? splitHeadline(heroTitle) : [h2("heroLine1"), h2("heroLine2"), h2("heroLine3")];
  // Standart sarlavhada rangli qator tilga qarab (1–3), banner sarlavhasida — oxirgi qator
  const accentLine = heroTitle ? lines.length - 1 : Math.min(2, Math.max(0, (parseInt(h2("heroAccent"), 10) || 2) - 1));
  const heroSub = hero?.subtitle ? t(hero.subtitle, locale) : h2("heroSub");

  // Raqamlar — zal xaritasidan (22 stol, 199 o'rin, 5 VIP xona)
  const totals = floorTotals();
  const vipRooms = ROOMS.filter((r) => r.kind === "vip").length;
  const every = sameEveryDay(workingHours);
  const todayHours = hoursFor(workingHours, dayOfWeekOf(today));
  const hoursValue = every
    ? `${every.openTime}–${every.closeTime}`
    : todayHours.isClosed ? st("closed") : `${todayHours.openTime}–${todayHours.closeTime}`;
  const hoursLabel = every ? st("fOpen") : h2("today");

  // ---------- Taomlar ----------
  const featured = featuredRaw.map((d) => toDish(d, locale));
  const latest = latestRaw.map((d) => toDish(d, locale));
  // Mashhur taomlar bo'lmasa — eng yangi mavjud taomlar; ular ham bo'lmasa bo'lim yashiriladi
  const signature = featured.length ? featured : latest;
  // Oshpaz tanlovi: avval rasmlilari, keyin TOP taomlar (3 ta)
  const pool: HomeDish[] = [...featured, ...latest.filter((d) => !featured.some((f) => f.id === d.id))];
  const showcase = pool
    .map((d, i) => ({ d, i }))
    .sort((a, b) => Number(!!b.d.img) - Number(!!a.d.img) || a.i - b.i)
    .slice(0, 3)
    .map((x) => x.d);
  const pick = featured[0] ?? null;
  const sticker = pick ? { ring: h2("chefPick"), center: pick.zh ?? pick.name } : null;

  const cats: HomeCategory[] = catsRaw.map((c) => ({
    id: c.id,
    name: t(c.name, locale),
    zh: locale === "zh" ? null : zhOf(c.name),
    count: c._count.items,
    glyph: glyphOf(c.name),
    dishes: c.items.map((d) => toDish(d, locale)),
  }));

  // ---------- Rasmlar (restoranning haqiqiy rasmlari — src/lib/photos.ts) va sharhlar ----------
  // Galereya lentasi: avval haqiqiy rasmlar (izohi bilan), bazadagilar — ulardan keyin (lenta 8 tagacha)
  const galleryItems = [
    ...HOME_GALLERY.map((n) => {
      const p = pic(n);
      return { pic: p, caption: pt.caption(p), glyph: picGlyph(p), alt: pt.alt(p) };
    }),
    ...gallery.flatMap((x) => {
      const p = urlPic(usable(x.url));
      return p ? [{ pic: p, caption: x.caption ? t(x.caption, locale).trim() : "" }] : [];
    }),
  ];
  // Sharh sahnasi foni: mijoz rasmi → sharh qilingan taom rasmi → interyer rasmlari navbat bilan
  const reviews = reviewsRaw.map((r, i) => {
    const img = usable(r.images[0]) ?? usable(r.menuItem?.imageUrl) ?? null;
    return {
      id: r.id,
      author: r.authorName,
      rating: r.rating,
      comment: r.comment ?? "",
      img,
      pic: urlPic(img) ?? STAGE[i % STAGE.length],
      dish: r.menuItem ? t(r.menuItem.name, locale) : null,
    };
  });
  const reviewTotal = reviewAgg._count || 0;
  const avgRating = reviewTotal > 0 ? Number(reviewAgg._avg.rating ?? 0) : null;

  return (
    <>
      <SiteHeader />

      <main id="main">
        {/* 1. HERO */}
        <Hero
          tag={st("heroTag")}
          lines={lines}
          accentLine={accentLine}
          sub={heroSub}
          cnHeadline={locale === "zh" && HAN.test(lines.join(""))}
          bookLabel={th("book_table")}
          menuLabel={th("view_menu")}
          facts={[
            { value: String(totals.tables), label: h2("factTables") },
            { value: String(totals.seats), label: h2("factSeats") },
            { value: String(vipRooms), label: h2("factVip") },
          ]}
          hours={{ value: hoursValue, label: hoursLabel }}
          sticker={sticker}
          waveClass={signature.length > 0 ? "text-paper" : "text-night"}
        />

        {/* 2. MASHHUR TAOMLAR */}
        {signature.length > 0 && (
          <section data-home="signature" className="relative bg-paper pb-28 pt-14 sm:pb-32 sm:pt-16 lg:pb-36">
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <SectionHead cn="招牌菜" eyebrow={st("dishesEyebrow")} title={st("dishesTitle1")} accent={st("dishesTitle2")} sub={h2("sigSub")} />
                <ButtonLink href="/menu" variant="ghost-dark" size="md" className="group shrink-0 self-start sm:self-auto">
                  {st("fullMenu")}
                  <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </ButtonLink>
              </div>
              <SignatureGrid dishes={signature} menuCount={menuCount} />
            </div>
            <Wave className="text-night" variant="b" />
          </section>
        )}

        {/* 3. BIZ HAQIMIZDA */}
        <About locale={locale} stats={{ tables: totals.tables, seats: totals.seats, vip: vipRooms }} />

        {/* 4. OSHPAZ TANLOVI */}
        {showcase.length > 0 ? <Showcase locale={locale} dishes={showcase} /> : <div className="h-16 bg-sand" />}

        {/* 4.5 BIR KOSADA — qatlamli 3D kosa (sticky scroll) */}
        <ExplodeSection locale={locale} />

        {/* 5. DIM SUM */}
        <DimSumBand locale={locale} />

        {/* 6. MENYU */}
        {cats.length > 0 && (
          <section className="relative isolate overflow-hidden bg-night pb-32 pt-16 text-brand-cream sm:pb-40 sm:pt-20">
            <span aria-hidden="true" className="pointer-events-none absolute -right-40 top-20 -z-10 size-[30rem] rounded-full bg-fire-deep/25 blur-3xl" />
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <SectionHead tone="dark" font="serif" cn="菜单" eyebrow={h2("menuEyebrow")} title={h2("menuTitle")} accent={h2("menuAccent")} />
                <ButtonLink href="/menu" variant="gold-outline" size="md" className="group shrink-0 self-start sm:self-auto">
                  {st("fullMenu")}
                  <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </ButtonLink>
              </div>
              <MenuPreview cats={cats} />
            </div>
            <Wave className="text-paper" variant="c" />
          </section>
        )}

        {/* 7. RESTORAN XARITASI (stol tanlash va bron) */}
        <HomeFloorSection hours={workingHours} phone={phone} today={today} nowHM={nowHM} />

        {/* 7.5 KASHF ETING — 4 panelli lenta */}
        <PanelShowcase
          heading={<SectionHead tone="dark" font="serif" cn="特色" eyebrow={h2("panelEyebrow")} title={h2("panelTitle")} accent={h2("panelAccent")} />}
          panels={[
            // Muhit — soyabonli asosiy zal; taomlar — taom rasmi, bo'lmasa taomli VIP dasturxon (tepadan);
            // oshxona — tayyor dasturxon; VIP xonalar — qandilli VIP zal
            { title: h2("panel1t"), sub: h2("panel1s"), href: "/gallery", img: pic("hallUmbrellas", "50% 62%") },
            { title: h2("panel2t"), sub: h2("panel2s"), href: "/menu", img: pic("vipTableTop", "45% 42%") },
            { title: h2("panel3t"), sub: h2("panel3s"), href: "/about", img: pic("hallRoundTable2", "50% 70%") },
            { title: h2("panel4t"), sub: h2("panel4s"), href: "/reservation", img: pic("vipLounge", "40% 52%") },
          ]}
        />

        {/* 8. STOL BAND QILING */}
        <ReserveBlock locale={locale} image={pic("boothTall", "50% 58%")} hours={`${hoursLabel} · ${hoursValue}`} />

        {/* 9. GALEREYA */}
        <GallerySection locale={locale} items={galleryItems} />

        {/* 10. SHARHLAR */}
        <Reviews locale={locale} reviews={reviews} avg={avgRating} total={reviewTotal} backdrop={STAGE[0]} prevClass="text-sand" />
      </main>

      <SiteFooter locale={locale} />
    </>
  );
}
