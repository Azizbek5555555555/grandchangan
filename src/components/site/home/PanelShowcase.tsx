"use client";

import { useState } from "react";
import { ArrowUpRight, ChefHat, Crown, Lamp, UtensilsCrossed } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { GlyphPanel } from "./Decor";
import SafeImg from "./SafeImg";

export type Panel = { title: string; sub: string; href: "/gallery" | "/menu" | "/about" | "/reservation"; img: string | null };

const ICONS = [Lamp, UtensilsCrossed, ChefHat, Crown];
const CHARS = ["境", "菜", "厨", "贵"];
const TONES = ["night", "wine", "night", "wine"] as const;

/**
 * 4 panelli lenta (namuna: 冶春 sayti): bitta katta fon rasmi ustida 4 ta vertikal ustun.
 * Ustunga sichqoncha/fokus kelganda u qorong'i panelga aylanadi va fon shu ustun rasmiga almashadi.
 * Telefonda — gorizontal suriladigan kartalar.
 */
export default function PanelShowcase({ heading, panels }: { heading: React.ReactNode; panels: Panel[] }) {
  const [active, setActive] = useState(1);

  return (
    <section className="relative bg-night text-brand-cream">
      {/* ---------- Kompyuter: 4 ustun ---------- */}
      <div className="relative hidden h-[82svh] min-h-[560px] overflow-hidden md:block">
        {panels.map((p, i) => (
          <div
            key={i}
            aria-hidden="true"
            className={cn("absolute inset-0 transition-[opacity,transform] duration-700 ease-out", active === i ? "scale-100 opacity-100" : "scale-105 opacity-0")}
          >
            <SafeImg src={p.img} className="h-full w-full" imgClassName="h-full w-full object-cover" fallback={<GlyphPanel char={CHARS[i]} tone={TONES[i]} size="text-[18rem]" />} />
          </div>
        ))}
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-night via-night/45 to-night/60" />

        <div className="absolute left-0 top-0 z-10 max-w-xl p-10 lg:p-14">{heading}</div>

        <div className="absolute inset-0 grid grid-cols-4">
          {panels.map((p, i) => {
            const Icon = ICONS[i];
            const on = active === i;
            return (
              <Link
                key={i}
                href={p.href}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className="group relative flex flex-col justify-end border-l border-brand-cream/15 first:border-l-0 focus-visible:outline-none"
              >
                <div
                  className={cn(
                    "m-0 flex min-h-[44%] flex-col justify-end p-8 transition-all duration-500 lg:p-10",
                    on ? "bg-night-2/90 backdrop-blur-sm" : "bg-transparent"
                  )}
                >
                  <div className="mb-auto flex items-center justify-between">
                    <span className="font-poster text-2xl text-saffron">0{i + 1}</span>
                    <Icon size={26} strokeWidth={1.4} className={cn("transition", on ? "text-saffron" : "text-brand-cream/70")} />
                  </div>
                  <p className="mt-10 font-display text-2xl leading-tight lg:text-3xl">{p.title}</p>
                  <p className="mt-2 text-sm text-brand-cream/70">{p.sub}</p>
                  <span
                    className={cn(
                      "mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-saffron transition",
                      on ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                    )}
                  >
                    <ArrowUpRight size={14} />
                  </span>
                </div>
                <span className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-saffron transition-transform duration-500 group-hover:scale-x-100 group-focus-visible:scale-x-100" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* ---------- Telefon: suriladigan kartalar ---------- */}
      <div className="py-16 md:hidden">
        <div className="px-5">{heading}</div>
        <div className="mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none]">
          {panels.map((p, i) => {
            const Icon = ICONS[i];
            return (
              <Link key={i} href={p.href} className="relative h-80 w-[76vw] max-w-[300px] shrink-0 snap-start overflow-hidden rounded-3xl">
                <SafeImg src={p.img} className="absolute inset-0" imgClassName="h-full w-full object-cover" fallback={<GlyphPanel char={CHARS[i]} tone={TONES[i]} size="text-[9rem]" />} />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-night via-night/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-poster text-xl text-saffron">0{i + 1}</span>
                    <Icon size={22} strokeWidth={1.4} className="text-brand-cream/80" />
                  </div>
                  <p className="mt-4 font-display text-2xl leading-tight">{p.title}</p>
                  <p className="mt-1 text-sm text-brand-cream/75">{p.sub}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
