"use client";
import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2, ImageOff } from "lucide-react";
import { addImage, deleteImage } from "@/lib/gallery/actions";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/admin/ui/PageHeader";
import ImageField from "@/components/admin/ui/ImageField";
import FilterChips from "@/components/admin/ui/FilterChips";
import { Field } from "@/components/admin/ui/Field";
import EmptyState from "@/components/admin/ui/EmptyState";
import { ui } from "@/components/admin/ui/styles";

type Img = { id: string; url: string; category?: string | null };
const CATS = ["interior", "food", "event"] as const;

export default function GalleryManager({ images }: { images: Img[] }) {
  const ta = useTranslations("Admin");
  const tg = useTranslations("AdminUi.gallery");
  const tc = useTranslations("AdminUi.common");
  const [cat, setCat] = useState<string>("interior");
  const [filter, setFilter] = useState("all");
  const [pending, startTransition] = useTransition();
  const catLabel = (c?: string | null) => (c && (CATS as readonly string[]).includes(c) ? tg(`cats.${c}`) : c || "—");
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    images.forEach((im) => { const k = im.category || ""; m[k] = (m[k] || 0) + 1; });
    return m;
  }, [images]);
  const shown = filter === "all" ? images : images.filter((im) => im.category === filter);

  return (
    <div className={ui.page}>
      <PageHeader section="gallery" title={ta("gallery")} description={tg("subtitle")} />

      <section aria-labelledby="gal-add" className={cn(ui.card, ui.cardPad, "mb-6 flex flex-col gap-4 sm:flex-row sm:items-end")}>
        <div>
          <h2 id="gal-add" className={ui.label}>{tg("add")}</h2>
          <ImageField value={null} onChange={(url) => url && startTransition(async () => { await addImage(url, cat); })} />
        </div>
        <Field label={tg("category")} className="sm:w-56">
          <select value={cat} onChange={(e) => setCat(e.target.value)} className={ui.input}>
            {CATS.map((c) => <option key={c} value={c}>{tg(`cats.${c}`)}</option>)}
          </select>
        </Field>
        <p className="text-xs text-muted sm:mb-3 sm:flex-1">{tg("addHint")}</p>
      </section>

      <FilterChips
        className="mb-4"
        label={tg("category")}
        value={filter}
        onChange={setFilter}
        options={[{ value: "all", label: tc("all"), count: images.length }, ...CATS.map((c) => ({ value: c, label: tg(`cats.${c}`), count: counts[c] || 0 }))]}
      />

      {shown.length === 0 ? (
        <div className={ui.card}><EmptyState icon={ImageOff} title={tg("empty")} /></div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {shown.map((im) => (
            <li key={im.id} className="group relative overflow-hidden rounded-2xl border border-line bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={im.url} alt="" loading="lazy" className="aspect-square w-full object-cover" />
              <span className="absolute bottom-2 left-2 rounded-full bg-night/70 px-2 py-0.5 text-[11px] text-brand-cream backdrop-blur-sm">{catLabel(im.category)}</span>
              {/* Telefonda doim ko'rinadi, kompyuterda — sichqoncha ustida */}
              <button
                type="button"
                disabled={pending}
                onClick={() => confirm(tc("deleteConfirm")) && startTransition(async () => { await deleteImage(im.id); })}
                title={tc("delete")}
                aria-label={tc("delete")}
                className="absolute right-2 top-2 inline-flex size-10 items-center justify-center rounded-full bg-night/70 text-brand-cream backdrop-blur-sm transition hover:bg-fire focus-visible:opacity-100 sm:size-9 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <Trash2 size={15} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
