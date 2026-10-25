import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ROOMS, floorTotals, roomSeats } from "@/lib/floorplan/layout";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import EventsHero from "@/components/site/heroes/EventsHero";
import EventForm from "@/components/site/EventForm";
import SectionHead from "@/components/site/kit/SectionHead";
import Wave from "@/components/site/kit/Wave";
import Reveal from "@/components/motion/Reveal";
import Parallax from "@/components/motion/Parallax";
import { PlateFallback } from "@/components/site/home/Decor";
import SafeImg from "@/components/site/home/SafeImg";
import { CloudLine } from "@/components/site/pages/Ornament";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
const usable = (u?: string | null) => (u && (u.startsWith("/uploads") || u.startsWith("http")) ? u : null);

// Har tadbir turi: xitoycha vertikal yorliq va mos joy (zal xaritasidan)
const KINDS = [
  { key: "k1", tag: "寿宴", char: "寿", place: "vip" },
  { key: "k2", tag: "商务宴", char: "商", place: "hall" },
  { key: "k3", tag: "周年庆", char: "庆", place: "private" },
  { key: "k4", tag: "喜宴", char: "囍", place: "all" },
] as const;

export default async function EventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [te, e2] = await Promise.all([
    getTranslations({ locale, namespace: "Events" }),
    getTranslations({ locale, namespace: "Events2" }),
  ]);
  const [gallery, setting] = await Promise.all([
    prisma.galleryImage.findMany({ where: { isActive: true }, take: 5, orderBy: { sortOrder: "asc" } }),
    prisma.siteSetting.findUnique({ where: { key: "general" } }),
  ]);
  const imgs = gallery.map((x) => usable(x.url)).filter(Boolean) as string[];
  const g = (setting?.value as Record<string, unknown>) || {};
  const phone = Array.isArray(g.phones) && g.phones[0] ? String(g.phones[0]) : null;

  // Sig'im — haqiqiy zal rejasidan
  const seatsOf = (kind: string) => ROOMS.filter((r) => r.kind === kind).reduce((s, r) => s + roomSeats(r).seats, 0);
  const vipMax = Math.max(...ROOMS.filter((r) => r.kind === "vip").map((r) => roomSeats(r).seats));
  const vipMin = Math.min(...ROOMS.filter((r) => r.kind === "vip").map((r) => roomSeats(r).seats));
  const placeText = {
    vip: e2("placeVip", { min: vipMin, max: vipMax }),
    hall: e2("placeHall", { seats: seatsOf("hall") }),
    private: e2("placePrivate", { seats: seatsOf("private") }),
    all: e2("placeAll", { seats: floorTotals().seats }),
  };

  return (
    <>
      <SiteHeader />
      <EventsHero title={te("heroTitle")} sub={te("heroSub")} kinds={KINDS.map((k) => te(`${k.key}t`))} bgImage={imgs[0] ?? null} />

      <main id="main" className="overflow-x-clip">
        {/* ===== Tadbir turlari — qorong'i, vertikal yorliqli (namuna: 湯包家) ===== */}
        <section className="relative isolate overflow-hidden bg-night pb-32 pt-20 text-brand-cream sm:pb-40">
          <Wave top className="text-wine" variant="b" />
          <span aria-hidden="true" className="lattice-bg absolute inset-0 -z-10 text-brand-gold/[0.04]" />
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <SectionHead align="center" tone="dark" font="serif" cn="宴会厅" eyebrow={te("eyebrow")} title={te("title")} />
            <div className="mt-16 space-y-20 sm:mt-20 sm:space-y-28">
              {KINDS.map((k, i) => {
                const flip = i % 2 === 1;
                return (
                  <article key={k.key} className={cn("grid items-center gap-10 md:grid-cols-2 md:gap-16", flip && "md:[&>*:first-child]:order-2")}>
                    <Reveal y={40} className="relative mx-auto w-full max-w-[26rem]">
                      <span aria-hidden="true" className="absolute inset-[-8%] rounded-full bg-fire-deep/20 blur-3xl" />
                      <Parallax speed={flip ? -6 : 6}>
                        <div className="relative aspect-square overflow-hidden rounded-full border-[10px] border-night-3 shadow-2xl shadow-night">
                          <SafeImg src={imgs[i + 1] ?? null} className="h-full w-full" imgClassName="h-full w-full object-cover" fallback={<PlateFallback char={k.char} glyph="text-8xl" />} />
                        </div>
                      </Parallax>
                      <span
                        lang="zh"
                        aria-hidden="true"
                        className={cn(
                          "font-cn absolute top-6 flex items-center rounded-md border border-saffron/40 bg-fire-deep px-2 py-4 text-2xl leading-tight text-brand-cream shadow-lg [writing-mode:vertical-rl] sm:text-3xl",
                          flip ? "-left-2 sm:-left-4" : "-right-2 sm:-right-4"
                        )}
                      >
                        {k.tag}
                      </span>
                    </Reveal>
                    <Reveal y={30} delay={0.1}>
                      <p className="font-poster text-5xl text-saffron/30">0{i + 1}</p>
                      <h3 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">{te(`${k.key}t`)}</h3>
                      <p className="mt-4 max-w-md text-lg leading-relaxed text-brand-cream/75">{te(`${k.key}x`)}</p>
                      <p className="mt-8 inline-block rounded-full bg-night-3 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-light">{e2("features")}</p>
                      <ul className="mt-4 space-y-2.5 text-brand-cream/85">
                        {[placeText[k.place], e2("featMenu"), e2("featPreorder")].map((f) => (
                          <li key={f} className="flex items-start gap-3">
                            <span className="mt-2 size-2 shrink-0 rounded-full bg-saffron" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <a href="#ariza" className="mt-8 inline-flex min-h-11 items-center gap-2 font-semibold text-saffron transition hover:gap-3">
                        {e2("apply")} <ArrowRight size={18} />
                      </a>
                    </Reveal>
                  </article>
                );
              })}
            </div>
          </div>
          <Wave className="text-paper" variant="c" />
        </section>

        {/* ===== Ariza ===== */}
        <section id="ariza" className="scroll-mt-24 bg-paper pb-28 pt-12">
          <div className="mx-auto grid max-w-6xl items-start gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="lg:sticky lg:top-28">
              <SectionHead font="serif" cn="预约" eyebrow={e2("formEyebrow")} title={te("formTitle")} sub={te("formSub")} />
              <CloudLine className="mt-8 w-40 text-fire/40" />
              {phone && (
                <Reveal delay={0.2}>
                  <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="mt-8 inline-flex min-h-11 items-center gap-3 rounded-full border border-line bg-card px-5 py-3 font-semibold text-content transition hover:border-fire">
                    <Phone size={18} className="text-fire-ink" /> {e2("orCall")} {phone}
                  </a>
                </Reveal>
              )}
            </div>
            <Reveal y={30}>
              <EventForm />
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter locale={locale} />
    </>
  );
}
