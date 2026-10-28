import { ArrowLeft, ArrowRight, UtensilsCrossed } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import SectionHead from "@/components/site/kit/SectionHead";
import ButtonLink from "@/components/site/kit/ButtonLink";
import Reveal from "@/components/motion/Reveal";
import SafeImg from "@/components/site/home/SafeImg";
import { PorcelainPlate } from "@/components/site/home/ShowcaseArt";
import DishCell, { type CellDish } from "@/components/site/menu/DishCell";
import { FillerCell } from "@/components/site/menu/Cells";
import { rowFill } from "@/components/site/menu/grid";

export type PagerDish = { slug: string; name: string; img: string | null; glyph: string };

/**
 * Taom sahifasi pasti (krem fon): shu bo'limdan boshqa taomlar (menyu katakchalari, oxirgi qator doim to'la),
 * oldingi/keyingi taom kartalari va "Menyuga qaytish".
 */
export default function DishMore({
  related, prev, next, l,
}: {
  related: CellDish[];
  prev: PagerDish | null;
  next: PagerDish | null;
  l: { eyebrow: string; title: string; accent: string; prev: string; next: string; back: string };
}) {
  const fill = rowFill(related.length);
  return (
    <section className="relative isolate bg-paper px-4 pb-28 pt-6 text-content sm:px-8 sm:pb-36">
      <span aria-hidden="true" className="lattice-bg absolute inset-0 -z-10 text-fire/[0.03]" />
      <div className="mx-auto max-w-7xl">
        {related.length > 0 && (
          <>
            <div className="px-1 sm:px-0">
              <SectionHead font="serif" cn="同类" eyebrow={l.eyebrow} title={l.title} accent={l.accent} />
            </div>
            <Reveal y={30} className="mt-10 overflow-clip rounded-[1.75rem] border border-line bg-sand shadow-xl shadow-content/5 sm:mt-14">
              <div className="-mb-px -mr-px grid sm:grid-cols-2 xl:grid-cols-3">
                {related.map((d, i) => (
                  <DishCell key={d.id} d={d} tone="paper" className={i === related.length - 1 ? fill.last : undefined} />
                ))}
                {fill.filler && <FillerCell kind="motto" tone="paper" cnText="一品一味" className="hidden xl:flex" />}
              </div>
            </Reveal>
          </>
        )}

        {/* Oldingi / keyingi taom */}
        <nav aria-label={l.back} className="mt-16 grid gap-4 sm:mt-20 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          {prev ? <PagerCard d={prev} label={l.prev} dir="prev" /> : <span className="hidden sm:block" />}
          <ButtonLink href="/menu" variant="ghost-dark" size="md" className="justify-self-center">
            <UtensilsCrossed size={16} aria-hidden="true" /> {l.back}
          </ButtonLink>
          {next ? <PagerCard d={next} label={l.next} dir="next" /> : <span className="hidden sm:block" />}
        </nav>
      </div>
    </section>
  );
}

function PagerCard({ d, label, dir }: { d: PagerDish; label: string; dir: "prev" | "next" }) {
  const isNext = dir === "next";
  const Icon = isNext ? ArrowRight : ArrowLeft;
  return (
    <Link
      href={`/menu/${d.slug}`}
      rel={dir}
      className={cn(
        "group flex min-w-0 items-center gap-4 rounded-2xl border border-line bg-card p-3 pr-5 transition duration-300 hover:-translate-y-0.5 hover:border-fire/40 hover:shadow-lg hover:shadow-content/5",
        isNext && "flex-row-reverse pl-5 pr-3 text-right"
      )}
    >
      <SafeImg
        src={d.img}
        alt=""
        className="size-16 shrink-0 rounded-full ring-1 ring-brand-gold/30 sm:size-20"
        imgClassName="rounded-full"
        fallback={<PorcelainPlate char={d.glyph} glyph="text-2xl" />}
      />
      <span className="min-w-0 flex-1">
        <span className={cn("flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-fire-ink", isNext && "justify-end")}>
          {!isNext && <Icon size={13} aria-hidden="true" className="transition group-hover:-translate-x-1" />}
          {label}
          {isNext && <Icon size={13} aria-hidden="true" className="transition group-hover:translate-x-1" />}
        </span>
        <span className="mt-1 line-clamp-2 block font-display text-lg leading-snug text-content">{d.name}</span>
      </span>
    </Link>
  );
}
