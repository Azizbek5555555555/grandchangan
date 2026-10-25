import { setRequestLocale, getTranslations } from "next-intl/server";
import { MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/utils";
import { ROOMS, floorTotals, roomSeats } from "@/lib/floorplan/layout";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import AboutHero from "@/components/site/heroes/AboutHero";
import SectionHead from "@/components/site/kit/SectionHead";
import Wave from "@/components/site/kit/Wave";
import Reveal from "@/components/motion/Reveal";
import RevealGroup from "@/components/motion/RevealGroup";
import Parallax from "@/components/motion/Parallax";
import CountUp from "@/components/site/home/CountUp";
import { GlyphPanel } from "@/components/site/home/Decor";
import SafeImg from "@/components/site/home/SafeImg";
import CtaBand from "@/components/site/pages/CtaBand";
import { Birds, Mountains, Pavilion, SealStamp, VerticalTitle } from "@/components/site/pages/InkDecor";

export const dynamic = "force-dynamic";
const usable = (u?: string | null) => (u && (u.startsWith("/uploads") || u.startsWith("http")) ? u : null);

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [st, tc, a, p2] = await Promise.all([
    getTranslations({ locale, namespace: "Site" }),
    getTranslations({ locale, namespace: "Common" }),
    getTranslations({ locale, namespace: "About2" }),
    getTranslations({ locale, namespace: "Pages2" }),
  ]);
  const [setting, gallery] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: "general" } }),
    prisma.galleryImage.findMany({ where: { isActive: true }, take: 4, orderBy: { sortOrder: "asc" } }),
  ]);
  const g = (setting?.value as Record<string, unknown>) || {};
  const imgs = gallery.map((x) => usable(x.url)).filter(Boolean) as string[];
  const address = t(g.address, locale);

  // Joylar — zal xaritasidan (to'qima raqam yo'q)
  const totals = floorTotals();
  const sum = (kind: string) =>
    ROOMS.filter((r) => r.kind === kind).reduce((acc, r) => {
      const s = roomSeats(r);
      return { rooms: acc.rooms + 1, tables: acc.tables + s.tables, seats: acc.seats + s.seats };
    }, { rooms: 0, tables: 0, seats: 0 });
  const vip = sum("vip");
  const hall = sum("hall");
  const booth = sum("booth");
  const priv = sum("private");
  const spaces = [
    { n: vip.rooms, title: a("vip"), text: a("vipX") },
    { n: hall.tables, title: a("hall"), text: a("hallX", { seats: hall.seats }) },
    { n: booth.rooms, title: a("booth"), text: a("boothX") },
    { n: priv.rooms, title: a("privateRoom"), text: a("privateX", { seats: priv.seats }) },
  ];
  const road = [
    { cn: "一", title: a("road1t"), text: a("road1x") },
    { cn: "二", title: a("road2t"), text: a("road2x") },
    { cn: "三", title: a("road3t"), text: a("road3x") },
  ];

  return (
    <>
      <SiteHeader />
      <AboutHero title={tc("about")} sub={st("aboutSub")} eyebrow={p2("heroAboutEyebrow")} image={imgs[0] ?? null} />

      <main id="main" className="overflow-x-clip bg-paper">
        {/* ===== 1. Hikoya — tush rasmi uslubida ===== */}
        <section className="relative isolate overflow-hidden pb-48 pt-16 sm:pb-56 sm:pt-24">
          <Birds className="absolute right-[8%] top-10 w-40 text-content/25 sm:w-56" />
          <Parallax className="absolute -right-6 bottom-16 -z-10 hidden w-56 sm:block lg:w-72" speed={-8}>
            <Pavilion className="w-full text-content/[0.13]" />
          </Parallax>
          <Mountains className="absolute inset-x-0 bottom-0 -z-10 h-40 w-full text-sand sm:h-56" />

          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
            <Reveal y={30} className="hidden flex-col items-center gap-4 lg:flex">
              <VerticalTitle text="长安至撒马尔罕" className="text-4xl text-fire-ink" />
              <SealStamp text="丝路" />
            </Reveal>
            <div>
              <SectionHead font="serif" cn="丝绸之路" eyebrow={a("storyEyebrow")} title={a("storyTitle")} accent={a("storyAccent")} />
              <RevealGroup className="mt-8 space-y-5 text-base leading-relaxed text-muted sm:text-lg" stagger={0.12} y={20}>
                <p>{a("storyP1")}</p>
                <p>{st("aboutP1")}</p>
                <p>{st("aboutP2")}</p>
              </RevealGroup>
              {address && (
                <Reveal delay={0.2}>
                  <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm text-content">
                    <MapPin size={16} className="text-fire-ink" /> {address}
                  </p>
                </Reveal>
              )}
            </div>
            <Reveal y={40} className="relative">
              <div className="ink-mask relative aspect-[4/5] w-full overflow-hidden">
                <SafeImg src={imgs[0] ?? null} className="h-full w-full" imgClassName="h-full w-full object-cover" fallback={<GlyphPanel char="宴" tone="fire" size="text-[11rem]" />} />
              </div>
              <div className="absolute -bottom-6 -left-6 flex items-center gap-3 rounded-2xl bg-card px-5 py-4 shadow-xl shadow-content/10">
                <SealStamp text="长安" className="size-11 text-sm" />
                <p className="font-display text-lg leading-tight text-content">{a("sealCaption")}</p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ===== 2. Joylar — raqamlarda ===== */}
        <section className="relative isolate overflow-hidden bg-night pb-36 pt-28 text-brand-cream sm:pb-44 sm:pt-32">
          <Wave top className="text-paper" variant="a" />
          <span aria-hidden="true" className="lattice-bg absolute inset-0 -z-10 text-brand-gold/[0.05]" />
          <span aria-hidden="true" lang="zh" className="font-cn pointer-events-none absolute -left-6 bottom-0 -z-10 select-none text-[12rem] leading-none text-brand-cream/[0.04] sm:text-[20rem]">座</span>
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <SectionHead tone="dark" font="serif" cn="座位" eyebrow={a("spacesEyebrow")} title={a("spacesTitle")} accent={a("spacesAccent")} />
              <Reveal className="flex gap-10">
                <div>
                  <p className="font-poster text-5xl text-saffron sm:text-6xl"><CountUp to={totals.tables} /></p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-brand-cream/70">{a("tables")}</p>
                </div>
                <div>
                  <p className="font-poster text-5xl text-saffron sm:text-6xl"><CountUp to={totals.seats} /></p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-brand-cream/70">{a("seats")}</p>
                </div>
              </Reveal>
            </div>
            <RevealGroup className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-brand-gold/20 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1} y={30}>
              {spaces.map((s, i) => (
                <div key={i} className="bg-night-2 p-8 transition hover:bg-night-3">
                  <p className="font-display text-6xl text-brand-gold-light">{String(s.n).padStart(2, "0")}</p>
                  <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-cream/70">{s.text}</p>
                </div>
              ))}
            </RevealGroup>
          </div>
          <Wave className="text-sand" variant="c" />
        </section>
        {/* ===== 3. Ipak yo'li: uch bekat ===== */}
        <section className="relative bg-sand pb-28 pt-12 sm:pb-36">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <SectionHead align="center" font="serif" cn="一路" eyebrow={a("roadEyebrow")} title={a("roadTitle")} accent={a("roadAccent")} />
            <div className="relative mt-16">
              <svg aria-hidden="true" viewBox="0 0 1200 60" preserveAspectRatio="none" className="absolute inset-x-[8%] top-9 hidden h-12 w-[84%] text-fire/40 md:block">
                <path d="M0 30 C 200 0, 400 60, 600 30 C 800 0, 1000 60, 1200 30" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" />
              </svg>
              <RevealGroup className="relative grid gap-10 md:grid-cols-3" stagger={0.15} y={30}>
                {road.map((r) => (
                  <div key={r.cn} className="text-center">
                    <span lang="zh" className="font-cn mx-auto flex size-20 items-center justify-center rounded-full border-2 border-fire/30 bg-paper text-4xl text-fire-ink shadow-lg shadow-fire/10">{r.cn}</span>
                    <h3 className="mt-6 font-display text-2xl text-content sm:text-3xl">{r.title}</h3>
                    <p className="mx-auto mt-3 max-w-xs text-muted">{r.text}</p>
                  </div>
                ))}
              </RevealGroup>
            </div>
          </div>
        </section>

      </main>

      <CtaBand
        cnText="欢迎"
        eyebrow={a("ctaEyebrow")}
        title={st("aboutCta")}
        sub={st("aboutCtaSub")}
        primary={{ href: "/reservation", label: tc("reservation") }}
        secondary={{ href: "/menu", label: tc("menu") }}
        image={imgs[1] ?? null}
        waveFrom="sand"
        className="-mt-px"
      />
      <SiteFooter locale={locale} />
    </>
  );
}
