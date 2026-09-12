"use client";

import { useState, useMemo } from "react";
import { Flame, Leaf, Search } from "lucide-react";
import { t, formatMoney } from "@/lib/utils";

type Cat = { id: string; name: unknown; slug: string };
type Item = {
  id: string; categoryId: string; name: unknown; description?: unknown;
  price: number; discountPrice?: number | null; imageUrl?: string | null;
  spicyLevel: string; isVegetarian: boolean; isHalal: boolean; isNew: boolean;
};

const spicyDots = (level: string) => {
  const map: Record<string, number> = { NONE: 0, MILD: 1, MEDIUM: 2, HOT: 3, EXTRA_HOT: 4 };
  return map[level] || 0;
};

export default function MenuBrowser({
  categories, items, locale,
}: { categories: Cat[]; items: Item[]; locale: string }) {
  const [active, setActive] = useState<string>("all");
  const [q, setQ] = useState("");
  const [vegOnly, setVegOnly] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (active !== "all" && i.categoryId !== active) return false;
      if (vegOnly && !i.isVegetarian) return false;
      if (q) {
        const name = t(i.name, locale).toLowerCase();
        if (!name.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [items, active, vegOnly, q, locale]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-6 flex flex-col items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Taom qidirish..."
            className="w-full rounded-full border border-neutral-300 py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-red"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <input type="checkbox" checked={vegOnly} onChange={(e) => setVegOnly(e.target.checked)} />
          <Leaf size={14} className="text-green-600" /> Faqat vegetarian
        </label>
      </div>

      <div className="mb-8 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setActive("all")}
          className={`rounded-full px-4 py-1.5 text-sm ${active === "all" ? "bg-brand-red text-white" : "bg-neutral-100"}`}
        >
          Barchasi
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c.id)}
            className={`rounded-full px-4 py-1.5 text-sm ${active === c.id ? "bg-brand-red text-white" : "bg-neutral-100"}`}
          >
            {t(c.name, locale)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((it) => (
          <div key={it.id} className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-brand-gold/40 hover:shadow-xl">
            <div className="relative h-44 w-full overflow-hidden bg-neutral-100">
              <div className="absolute inset-0 flex items-center justify-center text-neutral-300">GrandChangan</div>
              {it.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={it.imageUrl}
                  alt=""
                  className="relative h-44 w-full object-cover transition duration-700 group-hover:scale-110"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              ) : null}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-brand-ink">{t(it.name, locale)}</h3>
                {it.isNew && <span className="rounded bg-brand-gold px-1.5 py-0.5 text-[10px] font-bold text-brand-ink">NEW</span>}
              </div>
              {it.description ? <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{t(it.description, locale)}</p> : null}
              <div className="mt-2 flex items-center gap-2">
                {Array.from({ length: spicyDots(it.spicyLevel) }).map((_, i) => (
                  <Flame key={i} size={13} className="text-brand-red" />
                ))}
                {it.isVegetarian && <Leaf size={13} className="text-green-600" />}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-brand-red">{formatMoney(it.price)}</span>
                {it.isHalal && <span className="text-xs text-green-600">Halal</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="mt-10 text-center text-neutral-400">Hech narsa topilmadi.</p>}
    </div>
  );
}
