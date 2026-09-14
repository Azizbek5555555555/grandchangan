"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { addImage, deleteImage } from "@/lib/gallery/actions";

type Img = { id: string; url: string; category?: string | null };
const CATS = ["interior", "food", "event"];

export default function GalleryManager({ images }: { images: Img[] }) {
  const [cat, setCat] = useState("interior");
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Galereya</h1>
      <div className="mb-6 flex items-end gap-4">
        <div>
          <span className="mb-1 block text-sm font-medium">Yangi rasm</span>
          <ImageUpload value={null} onChange={(url) => url && addImage(url, cat)} />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-lg border border-line px-3 py-2 text-sm">
          {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {images.map((im) => (
          <div key={im.id} className="group relative overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={im.url} alt="" className="h-32 w-full object-cover" />
            <button onClick={() => deleteImage(im.id)} className="absolute right-1 top-1 hidden rounded-full bg-red-600 p-1 text-white group-hover:block"><Trash2 size={12} /></button>
          </div>
        ))}
        {images.length === 0 && <p className="text-muted">Rasm yo'q.</p>}
      </div>
    </div>
  );
}
