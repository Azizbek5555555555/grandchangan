import TextReveal from "@/components/motion/TextReveal";
import Parallax from "@/components/motion/Parallax";
import Reveal from "@/components/motion/Reveal";

export default function PageHero({
  title, subtitle, bgImage,
}: { title: string; subtitle?: string; bgImage?: string | null }) {
  return (
    <section className="relative flex min-h-[34vh] items-end overflow-hidden bg-brand-ink pb-12 pt-28">
      {bgImage ? (
        <Parallax className="absolute -inset-y-[15%] inset-x-0" speed={12}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bgImage} alt="" className="h-full w-full object-cover opacity-40 animate-kenburns" />
        </Parallax>
      ) : (
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(60% 90% at 50% 0%, rgba(200,162,75,0.12) 0%, transparent 60%)" }} />
      )}
      <div className="absolute inset-0 hero-scrim" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 text-center">
        <TextReveal as="h1" trigger="load" text={title} className="font-display text-4xl text-brand-cream sm:text-6xl" />
        {subtitle && (
          <Reveal delay={0.25}>
            <p className="mt-4 text-brand-cream/60">{subtitle}</p>
          </Reveal>
        )}
        <div className="mx-auto mt-5 h-px w-20 bg-gradient-to-r from-transparent via-brand-gold to-transparent" />
      </div>
    </section>
  );
}
