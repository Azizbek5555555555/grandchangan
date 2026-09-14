"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";

export function ImageUpload({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (url: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      onChange(data.url);
    } else {
      let msg = "Yuklashda xatolik";
      try { const d = await res.json(); if (d?.error) msg = d.error; } catch {}
      alert(msg);
    }
  }

  return (
    <div>
      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-28 w-28 rounded-lg object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-line text-muted hover:border-brand-red">
          <Upload size={20} />
          <span className="text-xs">{loading ? "..." : "Rasm"}</span>
          <input type="file" accept="image/*" className="hidden" onChange={onFile} />
        </label>
      )}
    </div>
  );
}
