"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, Eye, EyeOff, Flame, Leaf, Star, Tag, UtensilsCrossed, X, FolderPlus } from "lucide-react";
import { Button, Modal } from "@/components/ui/primitives";
import { LocalizedInput, type LocalizedValue } from "@/components/ui/LocalizedInput";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { cn, currencyOf, formatMoney, hasPrice, t as loc } from "@/lib/utils";
import {
  saveCategory,
  deleteCategory,
  saveItem,
  toggleItemAvailability,
  deleteItem,
  type MenuActionError,
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

const SPICY = ["NONE", "MILD", "MEDIUM", "HOT", "EXTRA_HOT"] as const;
const ERRORS: MenuActionError[] = ["CATEGORY_HAS_ITEMS", "ITEM_IN_ORDERS", "PRICE_NEGATIVE", "PRICE_INVALID"];

/** Asosiy tugma (sayt uslubi: olovli qizil) */
const FIRE_BTN = "bg-fire text-brand-cream hover:bg-fire-deep";
/** Forma maydoni */
const FIELD =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-content outline-none transition focus:border-fire disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted";

/** Narx matnini songa: bo'shliq va vergul ruxsat ("45 000", "12,5"); bo'sh — null, noto'g'ri — NaN */
function parseMoney(value: string): number | null {
  const s = value.replace(/\s/g, "").replace(",", ".");
  if (s === "") return null;
  return /^-?\d+(\.\d{1,2})?$/.test(s) ? Number(s) : NaN;
}

/** Server xato kodi → joriy tildagi matn */
function useErrorText() {
  const tr = useTranslations("AdminMenu");
  return (code?: string) => (code && (ERRORS as string[]).includes(code) ? tr(`err.${code}`) : tr("err.generic"));
}

/** Kamida bitta tilda nom yozilganmi */
const hasName = (v: LocalizedValue) => Object.values(v).some((s) => (s ?? "").trim() !== "");

/**
 * Admin → Menyu: kategoriyalar va taomlar. Narx ixtiyoriy: bo'sh qoldirilsa 0 saqlanadi va
 * saytda narx ko'rsatilmaydi (hasPrice). Barcha matnlar — AdminMenu namespace, 4 tilda.
 */
export default function MenuManager({ categories, items }: { categories: Cat[]; items: Item[] }) {
  const tr = useTranslations("AdminMenu");
  const locale = useLocale();
  const errorText = useErrorText();
  const money = (v: number) => formatMoney(v, currencyOf(locale));

  const [activeCat, setActiveCat] = useState<string>(categories[0]?.id ?? "");
  const [catModal, setCatModal] = useState<Cat | null>(null);
  const [itemModal, setItemModal] = useState<Item | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // O'chirilgan kategoriya tanlangan bo'lib qolmasin
  const current = categories.find((c) => c.id === activeCat) ?? categories[0];
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    items.forEach((i) => m.set(i.categoryId, (m.get(i.categoryId) ?? 0) + 1));
    return m;
  }, [items]);
  const noPriceCount = useMemo(() => items.filter((i) => !hasPrice(i.price)).length, [items]);
  const shownItems = current ? items.filter((i) => i.categoryId === current.id) : [];
  const nameOf = (v: LocalizedValue) => loc(v, locale) || loc(v, "en") || "—";

  async function run(id: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(id);
    setNotice(null);
    try {
      const r = await fn();
      if (!r.ok) setNotice(errorText(r.error));
    } catch (e) {
      console.error("[menu]", e);
      setNotice(errorText());
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Sarlavha */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-fire-ink">
            <span lang="zh" aria-hidden="true" className="font-cn text-base normal-case tracking-normal">菜单</span>
            {tr("eyebrow", { categories: categories.length, items: items.length })}
          </p>
          <h1 className="font-display text-3xl text-content sm:text-4xl">{tr("title")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{tr("subtitle")}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            className="min-h-11 flex-1 sm:min-h-10 sm:flex-none"
            onClick={() => setCatModal({ id: "", name: {}, sortOrder: 0, isActive: true })}
          >
            <FolderPlus size={16} /> {tr("addCategory")}
          </Button>
          <Button
            className={cn("min-h-11 flex-1 sm:min-h-10 sm:flex-none", FIRE_BTN)}
            onClick={() => current && setItemModal(emptyItem(current.id))}
            disabled={!current}
          >
            <Plus size={16} /> {tr("addItem")}
          </Button>
        </div>
      </header>

      {noPriceCount > 0 && (
        <p className="mb-4 flex items-start gap-2 rounded-xl border border-line bg-card px-4 py-3 text-sm text-muted shadow-sm">
          <Tag size={16} className="mt-0.5 shrink-0 text-brand-gold" />
          <span>{tr("noPriceNote", { count: noPriceCount })}</span>
        </p>
      )}

      {notice && (
        <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-danger/30 bg-card px-4 py-3 text-sm text-danger shadow-sm">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label={tr("close")} className="-m-2 p-2 text-muted hover:text-content">
            <X size={14} />
          </button>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-card px-6 py-12 text-center shadow-sm">
          <UtensilsCrossed size={28} className="mx-auto mb-3 text-brand-gold" />
          <p className="font-display text-xl text-content">{tr("noCategories")}</p>
          <p className="mt-1 text-sm text-muted">{tr("noCategoriesHint")}</p>
        </div>
      ) : (
        <>
          {/* Kategoriyalar: telefonda gorizontal aylantiriladi (faqat shu qator ichida) */}
          <div className="-mx-4 mb-6 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            <div role="tablist" aria-label={tr("categories")} className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
              {categories.map((c) => {
                const active = c.id === current?.id;
                return (
                  <div
                    key={c.id}
                    className={cn(
                      "flex items-center rounded-full border transition",
                      active ? "border-fire bg-fire text-brand-cream shadow-sm" : "border-line bg-card text-content hover:border-brand-gold/50"
                    )}
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveCat(c.id)}
                      className="flex min-h-11 items-center gap-2 whitespace-nowrap pl-4 pr-1 text-sm font-medium sm:min-h-9"
                    >
                      {nameOf(c.name)}
                      <span className={cn("text-xs tabular-nums", active ? "text-brand-cream/75" : "text-muted")}>
                        {counts.get(c.id) ?? 0}
                      </span>
                      {!c.isActive && (
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] uppercase", active ? "bg-brand-cream/15" : "bg-surface-2 text-muted")}>
                          {tr("hidden")}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatModal(c)}
                      aria-label={tr("editCategoryNamed", { name: nameOf(c.name) })}
                      title={tr("editCategory")}
                      className={cn(
                        "mr-1 flex h-9 w-9 items-center justify-center rounded-full transition",
                        active ? "text-brand-cream/80 hover:bg-brand-cream/15 hover:text-brand-cream" : "text-muted hover:bg-surface-2 hover:text-content"
                      )}
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Taomlar */}
          {shownItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-card px-6 py-10 text-center">
              <p className="text-content">{tr("emptyCategory")}</p>
              <p className="mt-1 text-sm text-muted">{tr("emptyCategoryHint")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {shownItems.map((it) => (
                <article
                  key={it.id}
                  className={cn(
                    "flex flex-col rounded-2xl border border-line bg-card p-4 shadow-sm transition hover:border-brand-gold/40",
                    !it.isAvailable && "bg-surface-2/60"
                  )}
                >
                  <div className="mb-3 flex gap-3">
                    {it.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.imageUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className={cn("h-20 w-20 shrink-0 rounded-xl object-cover", !it.isAvailable && "opacity-60 grayscale")}
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-muted">
                        <UtensilsCrossed size={20} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 font-medium leading-snug text-content">{nameOf(it.name)}</h3>
                      <div className="mt-1">
                        {hasPrice(it.price) ? (
                          it.discountPrice != null && hasPrice(it.discountPrice) && it.discountPrice < it.price ? (
                            <p className="flex flex-wrap items-baseline gap-x-2">
                              <span className="font-semibold tabular-nums text-fire-ink">{money(it.discountPrice)}</span>
                              <s className="text-xs tabular-nums text-muted">{money(it.price)}</s>
                            </p>
                          ) : (
                            <p className="font-semibold tabular-nums text-fire-ink">{money(it.price)}</p>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted">
                            <Tag size={11} /> {tr("noPrice")}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {it.isFeatured && (
                          <Pill className="bg-brand-gold/15 text-content">
                            <Star size={10} className="text-brand-gold" /> {tr("badge.top")}
                          </Pill>
                        )}
                        {it.isVegetarian && (
                          <Pill className="bg-success-soft text-success">
                            <Leaf size={10} /> {tr("badge.veg")}
                          </Pill>
                        )}
                        {it.spicyLevel !== "NONE" && (
                          <Pill className="bg-fire/10 text-fire-ink">
                            <Flame size={10} /> {tr(`spicy.${it.spicyLevel}`)}
                          </Pill>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
                    <button
                      type="button"
                      disabled={busy === it.id}
                      onClick={() => run(it.id, () => toggleItemAvailability(it.id, !it.isAvailable))}
                      title={it.isAvailable ? tr("toggleHide") : tr("toggleShow")}
                      aria-pressed={it.isAvailable}
                      className={cn(
                        "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition disabled:opacity-60 sm:min-h-8",
                        it.isAvailable ? "bg-success-soft text-success hover:opacity-80" : "bg-surface-2 text-muted hover:text-content"
                      )}
                    >
                      {it.isAvailable ? <Eye size={14} /> : <EyeOff size={14} />}
                      {it.isAvailable ? tr("available") : tr("hidden")}
                    </button>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setItemModal(it)}
                        aria-label={tr("editNamed", { name: nameOf(it.name) })}
                        title={tr("edit")}
                        className="flex h-11 w-11 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-content sm:h-9 sm:w-9"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        disabled={busy === it.id}
                        onClick={() => {
                          if (!confirm(tr("confirmDeleteItem", { name: nameOf(it.name) }))) return;
                          run(it.id, () => deleteItem(it.id));
                        }}
                        aria-label={tr("deleteNamed", { name: nameOf(it.name) })}
                        title={tr("delete")}
                        className="flex h-11 w-11 items-center justify-center rounded-full text-danger transition hover:bg-danger/10 disabled:opacity-60 sm:h-9 sm:w-9"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {catModal && <CategoryModal data={catModal} onClose={() => setCatModal(null)} />}
      {itemModal && (
        <ItemModal data={itemModal} categories={categories} nameOf={nameOf} onClose={() => setItemModal(null)} />
      )}
    </div>
  );
}

function Pill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", className)}>
      {children}
    </span>
  );
}

function emptyItem(categoryId: string): Item {
  return {
    id: "", categoryId, name: {}, description: {}, price: 0, discountPrice: null,
    imageUrl: null, spicyLevel: "NONE", isVegetarian: false, isHalal: true,
    isFeatured: false, isAvailable: true, weightGrams: null,
  };
}

/** Maydon yorlig'i + "ixtiyoriy" belgisi */
function FieldLabel({ htmlFor, children, optional }: { htmlFor?: string; children: React.ReactNode; optional?: boolean }) {
  const tr = useTranslations("AdminMenu");
  return (
    <label htmlFor={htmlFor} className="mb-1 flex items-center gap-2 text-sm font-medium text-content">
      {children}
      {optional && (
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
          {tr("optional")}
        </span>
      )}
    </label>
  );
}

function ModalActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">{children}</div>;
}

function FormError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
      {children}
    </p>
  );
}

function CategoryModal({ data, onClose }: { data: Cat; onClose: () => void }) {
  const tr = useTranslations("AdminMenu");
  const locale = useLocale();
  const errorText = useErrorText();
  const isNew = !data.id;
  const [name, setName] = useState<LocalizedValue>(data.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guard(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setSaving(true);
    setError(null);
    try {
      const r = await fn();
      if (r.ok) onClose();
      else setError(errorText(r.error));
    } catch (e) {
      console.error("[menu]", e);
      setError(errorText());
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={isNew ? tr("newCategory") : tr("editCategory")}>
      <LocalizedInput label={tr("fName")} value={name} onChange={setName} />
      <FormError>{error}</FormError>
      <ModalActions>
        {!isNew && (
          <Button
            variant="outline"
            className="mr-auto min-h-11 border-danger/40 text-danger hover:bg-danger/10 sm:min-h-10"
            disabled={saving}
            onClick={() => {
              if (!confirm(tr("confirmDeleteCategory", { name: loc(name, locale) || loc(name, "en") }))) return;
              guard(() => deleteCategory(data.id));
            }}
          >
            <Trash2 size={15} /> {tr("delete")}
          </Button>
        )}
        <Button variant="outline" className="min-h-11 sm:min-h-10" onClick={onClose}>
          {tr("cancel")}
        </Button>
        <Button
          className={cn("min-h-11 sm:min-h-10", FIRE_BTN)}
          disabled={saving}
          onClick={() => {
            if (!hasName(name)) return setError(tr("err.nameRequired"));
            guard(() => saveCategory({ id: data.id || undefined, name }));
          }}
        >
          {saving ? tr("saving") : tr("save")}
        </Button>
      </ModalActions>
    </Modal>
  );
}

function ItemModal({
  data, categories, nameOf, onClose,
}: { data: Item; categories: Cat[]; nameOf: (v: LocalizedValue) => string; onClose: () => void }) {
  const tr = useTranslations("AdminMenu");
  const locale = useLocale();
  const errorText = useErrorText();
  const currency = currencyOf(locale);
  const isNew = !data.id;

  const [categoryId, setCategoryId] = useState(data.categoryId);
  const [name, setName] = useState<LocalizedValue>(data.name);
  const [desc, setDesc] = useState<LocalizedValue>(data.description || {});
  // Narx 0 — "narx ko'rsatilmaydi": maydon bo'sh ko'rinadi
  const [price, setPrice] = useState(hasPrice(data.price) ? String(data.price) : "");
  const [discount, setDiscount] = useState(data.discountPrice != null && hasPrice(data.discountPrice) ? String(data.discountPrice) : "");
  const [image, setImage] = useState<string | null>(data.imageUrl || null);
  const [spicy, setSpicy] = useState(data.spicyLevel);
  const [veg, setVeg] = useState(data.isVegetarian);
  const [halal, setHalal] = useState(data.isHalal);
  const [featured, setFeatured] = useState(data.isFeatured);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceNum = parseMoney(price);
  const priceSet = priceNum !== null && Number.isFinite(priceNum) && priceNum > 0;
  const discountNum = priceSet ? parseMoney(discount) : null;

  async function submit() {
    if (!hasName(name)) return setError(tr("err.nameRequired"));
    if (priceNum !== null && Number.isNaN(priceNum)) return setError(tr("err.PRICE_INVALID"));
    if (priceNum !== null && priceNum < 0) return setError(tr("err.PRICE_NEGATIVE"));
    if (discountNum !== null && (Number.isNaN(discountNum) || discountNum <= 0 || discountNum >= (priceNum ?? 0))) {
      return setError(tr("err.discount"));
    }
    setSaving(true);
    setError(null);
    try {
      const r = await saveItem({
        id: data.id || undefined,
        categoryId,
        name, description: desc,
        // Bo'sh narx — 0 (saytda narx ko'rsatilmaydi); chegirma faqat narx bo'lsa
        price: priceNum ?? 0,
        discountPrice: discountNum,
        imageUrl: image, spicyLevel: spicy as never,
        isVegetarian: veg, isHalal: halal, isFeatured: featured,
      });
      if (r.ok) onClose();
      else setError(errorText(r.error));
    } catch (e) {
      console.error("[menu]", e);
      setError(errorText());
    } finally {
      setSaving(false);
    }
  }

  const preview = priceSet
    ? discountNum !== null && Number.isFinite(discountNum) && discountNum > 0 && discountNum < (priceNum ?? 0)
      ? tr("previewDiscount", { price: formatMoney(discountNum, currency), old: formatMoney(priceNum ?? 0, currency) })
      : tr("previewPrice", { price: formatMoney(priceNum ?? 0, currency) })
    : tr("previewNoPrice");

  return (
    <Modal open onClose={onClose} wide title={isNew ? tr("newItem") : tr("editItem")}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-4">
          <LocalizedInput label={tr("fName")} value={name} onChange={setName} />
          <LocalizedInput label={tr("fDescription")} value={desc} onChange={setDesc} textarea />
          <div>
            <FieldLabel htmlFor="menu-category">{tr("fCategory")}</FieldLabel>
            <select id="menu-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={FIELD}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{nameOf(c.name)}</option>
              ))}
            </select>
          </div>
          {/* Narx — ixtiyoriy */}
          <div className="rounded-xl border border-line bg-surface-2/50 p-3">
            <div className="space-y-3">
              <div>
                <FieldLabel htmlFor="menu-price" optional>{tr("fPrice", { currency })}</FieldLabel>
                <input
                  id="menu-price"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder={tr("fPricePh")}
                  value={price}
                  onChange={(e) => { setPrice(e.target.value); setError(null); }}
                  aria-describedby="menu-price-hint"
                  className={cn(FIELD, "tabular-nums")}
                />
                <p id="menu-price-hint" className="mt-1 text-xs text-muted">{tr("fPriceHint")}</p>
              </div>
              <div>
                <FieldLabel htmlFor="menu-discount" optional>{tr("fDiscount", { currency })}</FieldLabel>
                <input
                  id="menu-discount"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder={priceSet ? tr("fDiscountPh") : ""}
                  value={priceSet ? discount : ""}
                  onChange={(e) => { setDiscount(e.target.value); setError(null); }}
                  disabled={!priceSet}
                  aria-describedby="menu-discount-hint"
                  className={cn(FIELD, "tabular-nums")}
                />
                <p id="menu-discount-hint" className="mt-1 text-xs text-muted">
                  {priceSet ? tr("fDiscountHint") : tr("fDiscountNeedsPrice")}
                </p>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-2 text-xs font-medium text-content">
              <Tag size={12} className="text-brand-gold" /> {preview}
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <span className="mb-1 block text-sm font-medium text-content">{tr("fImage")}</span>
            <ImageUpload value={image} onChange={setImage} />
          </div>

          <div>
            <FieldLabel htmlFor="menu-spicy">{tr("fSpicy")}</FieldLabel>
            <select id="menu-spicy" value={spicy} onChange={(e) => setSpicy(e.target.value)} className={FIELD}>
              {SPICY.map((s) => <option key={s} value={s}>{tr(`spicy.${s}`)}</option>)}
            </select>
          </div>
          <fieldset>
            <legend className="mb-1 text-sm font-medium text-content">{tr("fFlags")}</legend>
            <div className="flex flex-wrap gap-2 text-sm">
              {[
                { label: tr("badge.veg"), checked: veg, set: setVeg },
                { label: tr("badge.halal"), checked: halal, set: setHalal },
                { label: tr("fFeatured"), checked: featured, set: setFeatured },
              ].map((f) => (
                <label
                  key={f.label}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3 transition sm:min-h-9",
                    f.checked ? "border-fire/40 bg-fire/10 text-content" : "border-line text-muted hover:text-content"
                  )}
                >
                  <input type="checkbox" checked={f.checked} onChange={(e) => f.set(e.target.checked)} className="accent-fire" />
                  {f.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </div>
      <FormError>{error}</FormError>
      <ModalActions>
        <Button variant="outline" className="min-h-11 sm:min-h-10" onClick={onClose}>{tr("cancel")}</Button>
        <Button className={cn("min-h-11 sm:min-h-10", FIRE_BTN)} disabled={saving} onClick={submit}>
          {saving ? tr("saving") : tr("save")}
        </Button>
      </ModalActions>
    </Modal>
  );
}
