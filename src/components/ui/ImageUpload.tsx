"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus, Loader2, X } from "lucide-react";

/** Rasm yuklash (/api/upload). Matnlar — AdminUi.upload (4 tilda) */
export function ImageUpload({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (url: string | null) => void;
}) {
  const t = useTranslations("AdminUi.upload");
  const [loading, setLoading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // o'sha faylni qayta tanlash mumkin bo'lsin
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        onChange(data.url);
      } else {
        let msg = t("failed");
        try { const d = await res.json(); if (d?.error) msg = d.error; } catch {}
        alert(msg);
      }
    } catch {
      alert(t("offline"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-28 w-28 rounded-xl border border-line object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={t("remove")}
            title={t("remove")}
            className="absolute -right-2 -top-2 inline-flex size-8 items-center justify-center rounded-full bg-fire text-brand-cream shadow-md transition hover:bg-fire-deep"
          >
            <X size={14} aria-hidden />
          </button>
        </div>
      ) : (
        <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-line bg-surface text-muted transition hover:border-brand-gold hover:text-content">
          {loading ? <Loader2 size={20} className="animate-spin" aria-hidden /> : <ImagePlus size={20} aria-hidden />}
          <span className="px-2 text-center text-xs">{loading ? t("uploading") : t("choose")}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="sr-only" onChange={onFile} />
        </label>
      )}
    </div>
  );
}
