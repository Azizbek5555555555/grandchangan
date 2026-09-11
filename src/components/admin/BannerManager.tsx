"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Button, Modal, Badge } from "@/components/ui/primitives";
import { LocalizedInput, type LocalizedValue } from "@/components/ui/LocalizedInput";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { saveBanner, toggleBanner, deleteBanner } from "@/lib/banner/actions";

type Banner = {
  id: string; title?: LocalizedValue | null; subtitle?: LocalizedValue | null;
  imageUrl: string; linkUrl?: string | null; position: string; isActive: boolean;
};
const POSITIONS = ["HERO", "HOME_SECONDARY", "MENU_TOP", "POPUP", "PROMO_STRIP"];

export default function BannerManager({ banners }: { banners: Banner[] }) {
  const [modal, setModal] = useState<Banner | null>(null);
  const [isNew, setIsNew] = useState(false);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bannerlar</h1>
        <Button onClick={() => { setIsNew(true); setModal({ id: "", imageUrl: "", position: "HERO", isActive: true, title: {}, subtitle: {} }); }}>
          <Plus size={16} /> Banner
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((b) => (
          <div key={b.id} className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {b.imageUrl ? <img src={b.imageUrl} alt="" className="h-32 w-full object-cover" /> : <div className="h-32 bg-neutral-100" />}
            <div className="p-3">
              <div className="mb-2 flex items-center justify-between">
                <Badge color="blue">{b.position}</Badge>
                <button onClick={() => toggleBanner(b.id, !b.isActive)} className={b.isActive ? "text-green-600" : "text-neutral-400"}>
                  {b.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
              <p className="text-sm font-medium">{b.title?.uz || "—"}</p>
              <div className="mt-2 flex gap-1">
                <button onClick={() => { setIsNew(false); setModal(b); }} className="rounded p-1 hover:bg-neutral-100"><Pencil size={14} /></button>
                <button onClick={() => confirm("O'chirilsinmi?") && deleteBanner(b.id)} className="rounded p-1 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && <BannerModal isNew={isNew} data={modal} onClose={() => setModal(null)} />}
    </div>
  );
}

function BannerModal({ isNew, data, onClose }: { isNew: boolean; data: Banner; onClose: () => void }) {
  const [title, setTitle] = useState<LocalizedValue>(data.title || {});
  const [subtitle, setSubtitle] = useState<LocalizedValue>(data.subtitle || {});
  const [image, setImage] = useState<string | null>(data.imageUrl || null);
  const [position, setPosition] = useState(data.position);
  const [link, setLink] = useState(data.linkUrl || "");

  return (
    <Modal open onClose={onClose} wide title={isNew ? "Yangi banner" : "Bannerni tahrirlash"}>
      <div className="space-y-4">
        <div>
          <span className="mb-1 block text-sm font-medium">Rasm</span>
          <ImageUpload value={image} onChange={setImage} />
        </div>
        <LocalizedInput label="Sarlavha" value={title} onChange={setTitle} />
        <LocalizedInput label="Tavsif" value={subtitle} onChange={setSubtitle} textarea />
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Joylashuv</span>
          <select value={position} onChange={(e) => setPosition(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm">
            {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Havola (ixtiyoriy)</span>
          <input value={link} onChange={(e) => setLink(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
        </label>
        <div className="flex justify-end">
          <Button
            disabled={!image}
            onClick={async () => {
              if (!image) return;
              await saveBanner({ id: data.id || undefined, title, subtitle, imageUrl: image, position: position as never, linkUrl: link });
              onClose();
            }}
          >
            Saqlash
          </Button>
        </div>
      </div>
    </Modal>
  );
}
