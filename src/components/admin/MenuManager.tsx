"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Flame } from "lucide-react";
import { Button, Modal, Badge } from "@/components/ui/primitives";
import { LocalizedInput, type LocalizedValue } from "@/components/ui/LocalizedInput";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { formatMoney } from "@/lib/utils";
import {
  saveCategory,
  deleteCategory,
  saveItem,
  toggleItemAvailability,
  deleteItem,
} from "@/lib/menu/actions";

type Cat = { id: string; name: LocalizedValue; sortOrder: number; isActive: boolean };
type Item = {
  id: string;
  categoryId: string;
  name: LocalizedValue;
  description?: LocalizedValue | null;
  price: number;
  discountPrice?: number | null;
  imageUrl?: string | null;
  spicyLevel: string;
  isVegetarian: boolean;
  isHalal: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
  weightGrams?: number | null;
};

const SPICY = ["NONE", "MILD", "MEDIUM", "HOT", "EXTRA_HOT"];

export default function MenuManager({ categories, items }: { categories: Cat[]; items: Item[] }) {
  const [activeCat, setActiveCat] = useState<string>(categories[0]?.id ?? "");
  const [catModal, setCatModal] = useState<Cat | null>(null);
  const [catNew, setCatNew] = useState(false);
  const [itemModal, setItemModal] = useState<Item | null>(null);
  const [itemNew, setItemNew] = useState(false);

  const shownItems = items.filter((i) => i.categoryId === activeCat);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Menyu</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setCatNew(true); setCatModal({ id: "", name: {}, sortOrder: 0, isActive: true }); }}>
            <Plus size={16} /> Kategoriya
          </Button>
          <Button
            onClick={() => { setItemNew(true); setItemModal(emptyItem(activeCat)); }}
            disabled={!activeCat}
          >
            <Plus size={16} /> Taom
          </Button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <div key={c.id} className="group relative">
            <button
              onClick={() => setActiveCat(c.id)}
              className={`rounded-full px-4 py-1.5 text-sm ${
                activeCat === c.id ? "bg-brand-red text-white" : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {c.name.uz || c.name.en}
            </button>
            <button
              onClick={() => { setCatNew(false); setCatModal(c); }}
              className="absolute -right-1 -top-1 hidden rounded-full bg-white p-1 shadow group-hover:block"
            >
              <Pencil size={10} />
            </button>
          </div>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shownItems.map((it) => (
          <div key={it.id} className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex gap-3">
              {it.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-neutral-100" />
              )}
              <div className="flex-1">
                <p className="font-medium">{it.name.uz || it.name.en}</p>
                <p className="text-sm text-brand-red">{formatMoney(it.price)}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {it.isFeatured && <Badge color="gold">TOP</Badge>}
                  {it.isVegetarian && <Badge color="green">Veg</Badge>}
                  {it.spicyLevel !== "NONE" && (
                    <Badge color="red">
                      <Flame size={10} className="inline" /> {it.spicyLevel}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
              <button
                onClick={() => toggleItemAvailability(it.id, !it.isAvailable)}
                className={`flex items-center gap-1 text-xs ${it.isAvailable ? "text-green-600" : "text-neutral-400"}`}
              >
                {it.isAvailable ? <Eye size={14} /> : <EyeOff size={14} />}
                {it.isAvailable ? "Mavjud" : "Yashirin"}
              </button>
              <div className="flex gap-1">
                <button onClick={() => { setItemNew(false); setItemModal(it); }} className="rounded p-1 hover:bg-neutral-100">
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => confirm("O'chirilsinmi?") && deleteItem(it.id)}
                  className="rounded p-1 text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {shownItems.length === 0 && <p className="text-neutral-400">Bu kategoriyada taom yo'q.</p>}
      </div>

      {catModal && (
        <CategoryModal
          isNew={catNew}
          data={catModal}
          onClose={() => setCatModal(null)}
        />
      )}
      {itemModal && (
        <ItemModal
          isNew={itemNew}
          data={itemModal}
          categoryId={activeCat}
          onClose={() => setItemModal(null)}
        />
      )}
    </div>
  );
}

function emptyItem(categoryId: string): Item {
  return {
    id: "", categoryId, name: {}, description: {}, price: 0, discountPrice: null,
    imageUrl: null, spicyLevel: "NONE", isVegetarian: false, isHalal: true,
    isFeatured: false, isAvailable: true, weightGrams: null,
  };
}

function CategoryModal({ isNew, data, onClose }: { isNew: boolean; data: Cat; onClose: () => void }) {
  const [name, setName] = useState<LocalizedValue>(data.name);
  const [saving, setSaving] = useState(false);
  return (
    <Modal open onClose={onClose} title={isNew ? "Yangi kategoriya" : "Kategoriyani tahrirlash"}>
      <div className="space-y-4">
        <LocalizedInput label="Nomi" value={name} onChange={setName} />
        <div className="flex justify-between">
          {!isNew && (
            <Button
              variant="danger"
              onClick={async () => {
                if (!confirm("O'chirilsinmi?")) return;
                const r = await deleteCategory(data.id);
                if (!r.ok) alert(r.error);
                else onClose();
              }}
            >
              O'chirish
            </Button>
          )}
          <Button
            className="ml-auto"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await saveCategory({ id: data.id || undefined, name });
              setSaving(false);
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

function ItemModal({
  isNew, data, categoryId, onClose,
}: { isNew: boolean; data: Item; categoryId: string; onClose: () => void }) {
  const [name, setName] = useState<LocalizedValue>(data.name);
  const [desc, setDesc] = useState<LocalizedValue>(data.description || {});
  const [price, setPrice] = useState(String(data.price || ""));
  const [image, setImage] = useState<string | null>(data.imageUrl || null);
  const [spicy, setSpicy] = useState(data.spicyLevel);
  const [veg, setVeg] = useState(data.isVegetarian);
  const [halal, setHalal] = useState(data.isHalal);
  const [featured, setFeatured] = useState(data.isFeatured);
  const [saving, setSaving] = useState(false);

  return (
    <Modal open onClose={onClose} wide title={isNew ? "Yangi taom" : "Taomni tahrirlash"}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-4">
          <LocalizedInput label="Nomi" value={name} onChange={setName} />
          <LocalizedInput label="Tavsif" value={desc} onChange={setDesc} textarea />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">Narxi (so'm)</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-red"
            />
          </label>
        </div>
        <div className="space-y-4">
          <div>
            <span className="mb-1 block text-sm font-medium text-neutral-700">Rasm</span>
            <ImageUpload value={image} onChange={setImage} />
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">Achchiqlik</span>
            <select
              value={spicy}
              onChange={(e) => setSpicy(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              {SPICY.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <div className="flex flex-wrap gap-3 text-sm">
            <label className="flex items-center gap-1"><input type="checkbox" checked={veg} onChange={(e) => setVeg(e.target.checked)} /> Vegetarian</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={halal} onChange={(e) => setHalal(e.target.checked)} /> Halal</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> TOP</label>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Bekor</Button>
        <Button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await saveItem({
              id: data.id || undefined,
              categoryId: categoryId,
              name, description: desc, price: Number(price) || 0,
              imageUrl: image, spicyLevel: spicy as never,
              isVegetarian: veg, isHalal: halal, isFeatured: featured,
            });
            setSaving(false);
            onClose();
          }}
        >
          Saqlash
        </Button>
      </div>
    </Modal>
  );
}
