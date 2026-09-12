"use client";

export default function Marquee({
  items, className, reverse,
}: { items: string[]; className?: string; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className={"overflow-hidden " + (className || "")}>
      <div className={`flex w-max flex-nowrap ${reverse ? "animate-marquee-rev" : "animate-marquee"}`}>
        {doubled.map((it, i) => (
          <span key={i} className="mx-8 flex items-center gap-8 whitespace-nowrap">
            {it}
            <span className="text-brand-gold">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
