"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Rasm yuklash maydoni (admin, 4 tilda). /api/upload ga yuboradi va URL qaytaradi —
 * mantiq src/components/ui/ImageUpload bilan bir xil, faqat matnlar tarjima qilingan.
 */
export default function ImageField({
  value,
  onChange,
  className,
  size = "md",
}: {
  value?: string | null;
  onChange: (url: string | null) => void;
  className?: string;
  size?: "md" | "wide";
}) {
  const t = useTranslations("AdminUi.upload");
  const [loading, setLoading] = useState(false);
  const box = size === "wide" ? "h-36 w-full sm:w-64" : "h-28 w-28";

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
    <div className={className}>
      {value ? (
        <div className={cn("relative inline-block overflow-hidden rounded-xl border border-line", box)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={t("remove")}
            title={t("remove")}
            className="absolute right-1.5 top-1.5 inline-flex size-9 items-center justify-center rounded-full bg-night/70 text-brand-cream transition hover:bg-fire"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      ) : (
        <label
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-line bg-surface text-muted transition hover:border-brand-gold hover:text-content",
            box,
            loading && "pointer-events-none opacity-70"
          )}
        >
          {loading ? <Loader2 size={20} className="animate-spin" aria-hidden /> : <ImagePlus size={20} aria-hidden />}
          <span className="px-2 text-center text-xs">{loading ? t("uploading") : t("choose")}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="sr-only" onChange={onFile} />
        </label>
      )}
    </div>
  );
}
