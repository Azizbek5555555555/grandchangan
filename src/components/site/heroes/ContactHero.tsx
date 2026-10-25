import { Clock, MapPin, Phone } from "lucide-react";
import Wave from "@/components/site/kit/Wave";
import { cn } from "@/lib/utils";
import { ENTER, HeroTitle } from "./parts";

/** Xitoycha kompas (罗盘): aylanuvchi tashqi shkala, 北东南西 yo'nalishlari, markazda restoran belgisi */
function Compass({ place }: { place: string }) {
  const dirs = [
    { c: "北", x: 100, y: 30 },
    { c: "东", x: 170, y: 104 },
    { c: "南", x: 100, y: 178 },
    { c: "西", x: 30, y: 104 },
  ];
  return (
    <div aria-hidden="true" className="relative aspect-square w-full">
      {/* Tashqi shkala — sekin aylanadi */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full animate-spin-slow text-brand-gold-light [animation-duration:120s]">
        <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
        <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
        {Array.from({ length: 120 }).map((_, i) => (
          <line key={i} x1="100" y1="2" x2="100" y2={i % 10 === 0 ? 12 : i % 5 === 0 ? 9 : 6} stroke="currentColor" strokeWidth={i % 10 === 0 ? 0.8 : 0.4} opacity={i % 10 === 0 ? 0.9 : 0.5} transform={`rotate(${i * 3} 100 100)`} />
        ))}
      </svg>
      {/* Ichki doira: qorong'i "lak" va yo'nalishlar */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full">
        <circle cx="100" cy="100" r="80" className="fill-fire-deep" />
        <circle cx="100" cy="100" r="80" fill="none" className="stroke-brand-gold" strokeWidth="1.2" />
        <circle cx="100" cy="100" r="56" fill="none" className="stroke-brand-gold" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.7" />
        {/* 8 qirrali yulduz */}
        <path d="M100 26 L108 92 L174 100 L108 108 L100 174 L92 108 L26 100 L92 92 Z" className="fill-brand-gold" opacity="0.9" />
        <path d="M100 26 L108 92 L100 100 Z M174 100 L108 108 L100 100 Z M100 174 L92 108 L100 100 Z M26 100 L92 92 L100 100 Z" className="fill-brand-gold-light" />
        <path d="M100 52 L104 96 L148 100 L104 104 L100 148 L96 104 L52 100 L96 96 Z" transform="rotate(45 100 100)" className="fill-saffron" opacity="0.55" />
        <circle cx="100" cy="100" r="9" className="fill-fire stroke-brand-gold-light" strokeWidth="1.5" />
        {dirs.map((d) => (
          <text key={d.c} x={d.x} y={d.y} textAnchor="middle" dominantBaseline="middle" className="fill-brand-cream font-cn" style={{ fontSize: 15 }}>
            {d.c}
          </text>
        ))}
      </svg>
      {/* Joy yorlig'i */}
      <span className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-night/85 px-3 py-1.5 text-xs font-semibold text-brand-cream shadow-xl backdrop-blur-sm">
        <span className="size-2 rounded-full bg-saffron shadow-[0_0_10px_3px] shadow-saffron/60" />
        {place}
      </span>
    </div>
  );
}

/**
 * ALOQA hero'si — "kompas": qizil fon, o'ngda xitoycha kompas (aylanuvchi oltin shkala, 北东南西),
 * chapda afisha sarlavha va uchta tezkor aloqa qatori (telefon — bosiladigan, manzil, ish vaqti)
 * hamda Samarqand koordinatalari.
 */
export default function ContactHero({
  title, sub, phone, address, hours, labels,
}: {
  title: string;
  sub: string;
  phone: string;
  address: string;
  hours: string;
  labels: { phone: string; address: string; hours: string; place: string };
}) {
  const rows = [
    { icon: Phone, k: labels.phone, v: phone, href: `tel:${phone.replace(/\s/g, "")}` },
    { icon: MapPin, k: labels.address, v: address },
    { icon: Clock, k: labels.hours, v: hours },
  ];
  return (
    <section className="relative isolate overflow-hidden bg-fire pb-28 pt-28 text-brand-cream sm:pb-32 sm:pt-32">
      <span aria-hidden="true" className="lattice-bg pointer-events-none absolute inset-0 -z-10 text-fire-deep/50" />
      <span aria-hidden="true" className="pointer-events-none absolute -right-40 top-10 -z-10 size-[40rem] rounded-full bg-fire-deep/70 blur-3xl" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
        <div className="min-w-0">
          <p className={cn(ENTER, "flex items-center gap-3")}>
            <span aria-hidden="true" lang="zh" className="font-cn text-3xl leading-none text-saffron">联系</span>
            <span translate="no" className="text-[11px] font-semibold tracking-[0.3em] text-brand-cream/80 sm:text-xs">39.65° N · 66.96° E</span>
          </p>
          <HeroTitle text={title} className="mt-5 font-poster text-[clamp(2.4rem,9vw,6rem)] leading-[1.06] text-brand-cream" />
          <p className={cn(ENTER, "mt-5 max-w-md text-lg text-brand-cream/90 delay-200")}>{sub}</p>

          <dl className={cn(ENTER, "mt-10 max-w-lg divide-y divide-brand-cream/20 border-y border-brand-cream/20 delay-300")}>
            {rows.map((r) => (
              <div key={r.k} className="flex items-center gap-4 py-4">
                <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-brand-gold/60 text-saffron">
                  <r.icon size={18} />
                </span>
                <div className="min-w-0">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-cream/70">{r.k}</dt>
                  <dd className="mt-0.5 text-base font-semibold sm:text-lg">
                    {r.href ? <a href={r.href} translate="no" className="underline-offset-4 hover:underline">{r.v}</a> : r.v}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <div className={cn(ENTER, "mx-auto w-full max-w-[min(84vw,30rem)] delay-200")}>
          <Compass place={labels.place} />
        </div>
      </div>

      <Wave className="text-paper" />
    </section>
  );
}
