"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, Eye, EyeOff, Images, ExternalLink } from "lucide-react";
import { LocalizedInput, type LocalizedValue } from "@/components/ui/LocalizedInput";
import { saveBanner, toggleBanner, deleteBanner } from "@/lib/banner/actions";
import { t as tl, cn } from "@/lib/utils";
import PageHeader from "@/components/admin/ui/PageHeader";
import Dialog from "@/components/admin/ui/Dialog";
import ImageField from "@/components/admin/ui/ImageField";
import { Field } from "@/components/admin/ui/Field";
import Pill from "@/components/admin/ui/Pill";
import EmptyState from "@/components/admin/ui/EmptyState";
import { ui } from "@/components/admin/ui/styles";

type Banner = {
  id: string; title?: LocalizedValue | null; subtitle?: LocalizedValue | null;
  imageUrl: string; linkUrl?: string | null; position: string; isActive: boolean;
};
const POSITIONS = ["HERO", "HOME_SECONDARY", "MENU_TOP", "POPUP", "PROMO_STRIP"];

export default function BannerManager({ banners }: { banners: Banner[] }) {
  const ta = useTranslations("Admin");
  const tb = useTranslations("AdminUi.banners");
  const tc = useTranslations("AdminUi.common");
  const locale = useLocale();
  const [modal, setModal] = useState<Banner | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [pending, startTransition] = useTransition();

  const openNew = () => { setIsNew(true); setModal({ id: "", imageUrl: "", position: "HERO", isActive: true, title: {}, subtitle: {} }); };

  return (
    <div className={ui.page}>
      <PageHeader
        section="banners"
        title={ta("banners")}
        description={tb("subtitle")}
        actions={<button type="button" onClick={openNew} className={ui.btnPrimary}><Plus size={16} aria-hidden /> {tb("new")}</button>}
      />

      {banners.length === 0 ? (
        <div className={ui.card}><EmptyState icon={Images} title={tb("empty")} /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {banners.map((b) => (
            <article key={b.id} className={cn(ui.card, "overflow-hidden", !b.isActive && "opacity-70")}>
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {b.imageUrl ? <img src={b.imageUrl} alt="" className="h-40 w-full object-cover" /> : <div className="h-40 bg-surface-2" />}
                <span className="absolute left-3 top-3 rounded-full bg-night/75 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-cream backdrop-blur-sm">
                  {tb(`positions.${b.position}`)}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 font-medium text-content">{tl(b.title, locale) || "—"}</p>
                  <Pill tone={b.isActive ? "success" : "neutral"}>{b.isActive ? tc("active") : tc("hidden")}</Pill>
                </div>
                {b.linkUrl && (
                  <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted"><ExternalLink size={12} aria-hidden /> {b.linkUrl}</p>
                )}
                <div className="mt-3 flex gap-0.5 border-t border-line pt-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => startTransition(async () => { await toggleBanner(b.id, !b.isActive); })}
                    title={b.isActive ? tb("hide") : tb("show")}
                    aria-label={b.isActive ? tb("hide") : tb("show")}
                    className={ui.iconBtn}
                  >
                    {b.isActive ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                  </button>
                  <button type="button" onClick={() => { setIsNew(false); setModal(b); }} title={tc("edit")} aria-label={tc("edit")} className={ui.iconBtn}>
                    <Pencil size={16} aria-hidden />
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => confirm(tc("deleteConfirm")) && startTransition(async () => { await deleteBanner(b.id); })}
                    title={tc("delete")}
                    aria-label={tc("delete")}
                    className={cn(ui.iconBtnDanger, "ml-auto")}
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {modal && <BannerModal isNew={isNew} data={modal} onClose={() => setModal(null)} />}
    </div>
  );
}

function BannerModal({ isNew, data, onClose }: { isNew: boolean; data: Banner; onClose: () => void }) {
  const tb = useTranslations("AdminUi.banners");
  const tc = useTranslations("AdminUi.common");
  const [title, setTitle] = useState<LocalizedValue>(data.title || {});
  const [subtitle, setSubtitle] = useState<LocalizedValue>(data.subtitle || {});
  const [image, setImage] = useState<string | null>(data.imageUrl || null);
  const [position, setPosition] = useState(data.position);
  const [link, setLink] = useState(data.linkUrl || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!image) return;
    setSaving(true);
    try {
      await saveBanner({ id: data.id || undefined, title, subtitle, imageUrl: image, position: position as never, linkUrl: link });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      onClose={onClose}
      wide
      title={isNew ? tb("newTitle") : tb("editTitle")}
      footer={
        <>
          {!image && <span className="mr-auto text-xs text-muted">{tb("imageRequired")}</span>}
          <button type="button" onClick={onClose} className={ui.btnSecondary}>{tc("cancel")}</button>
          <button type="button" disabled={!image || saving} onClick={save} className={ui.btnPrimary}>{saving ? tc("saving") : tc("save")}</button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <span className={ui.label}>{tb("image")}</span>
          <ImageField value={image} onChange={setImage} size="wide" />
        </div>
        <LocalizedInput label={tb("title")} value={title} onChange={setTitle} />
        <LocalizedInput label={tb("subtitleField")} value={subtitle} onChange={setSubtitle} textarea />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={tb("position")}>
            <select value={position} onChange={(e) => setPosition(e.target.value)} className={ui.input}>
              {POSITIONS.map((p) => <option key={p} value={p}>{tb(`positions.${p}`)}</option>)}
            </select>
          </Field>
          <Field label={tb("link")}>
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" className={ui.input} />
          </Field>
        </div>
      </div>
    </Dialog>
  );
}
