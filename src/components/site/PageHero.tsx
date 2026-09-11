export default function PageHero({
  title, subtitle,
}: { title: string; subtitle?: string }) {
  return (
    <section className="relative overflow-hidden bg-brand-ink pt-32 pb-16 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "radial-gradient(circle at 50% 0%, #c8a24b 0%, transparent 60%)" }}
      />
      <div className="relative z-10 mx-auto max-w-3xl px-5">
        <h1 className="font-display text-4xl text-brand-cream sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 text-brand-cream/60">{subtitle}</p>}
        <div className="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-transparent via-brand-gold to-transparent" />
      </div>
    </section>
  );
}
