"use client";
import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, Globe, EyeOff, Newspaper, ImageOff, Sparkles, X } from "lucide-react";
import { LocalizedInput, type LocalizedValue } from "@/components/ui/LocalizedInput";
import { savePost, togglePublish, deletePost, importRestaurantPosts } from "@/lib/blog/actions";
import { t as tl, cn } from "@/lib/utils";
import PageHeader from "@/components/admin/ui/PageHeader";
import Dialog from "@/components/admin/ui/Dialog";
import ImageField from "@/components/admin/ui/ImageField";
import Pill, { STATUS_TONE } from "@/components/admin/ui/Pill";
import EmptyState from "@/components/admin/ui/EmptyState";
import { ui } from "@/components/admin/ui/styles";

type Post = { id: string; slug?: string; title: LocalizedValue; excerpt?: LocalizedValue | null; content: LocalizedValue; coverImage?: string | null; status: string };

export default function BlogManager({ posts, sampleSlugs }: { posts: Post[]; sampleSlugs: string[] }) {
  const ta = useTranslations("Admin");
  const tb = useTranslations("AdminUi.blog");
  const ts = useTranslations("AdminUi.postStatus");
  const tc = useTranslations("AdminUi.common");
  const locale = useLocale();
  const [modal, setModal] = useState<Post | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [pending, startTransition] = useTransition();

  const [done, setDone] = useState<string | null>(null);

  // Test postlar o'rniga restoran haqidagi 3 ta post (uchalasi bor bo'lsa tugma ko'rinmaydi)
  const others = posts.filter((p) => !sampleSlugs.includes(p.slug ?? "")).length;
  const canImport = posts.filter((p) => sampleSlugs.includes(p.slug ?? "")).length < sampleSlugs.length;
  const importPosts = () => {
    if (!window.confirm(tb("sampleConfirm", { n: others }))) return;
    startTransition(async () => {
      const r = await importRestaurantPosts();
      setDone(tb("sampleDone", { removed: r.removed, created: r.created }));
    });
  };

  const openNew = () => { setIsNew(true); setModal({ id: "", title: {}, excerpt: {}, content: {}, coverImage: null, status: "DRAFT" }); };

  return (
    <div className={ui.page}>
      <PageHeader
        section="blog"
        title={ta("blog")}
        description={tb("subtitle")}
        actions={
          <>
            {canImport && (
              <button type="button" onClick={importPosts} disabled={pending} className={ui.btnSecondary}>
                <Sparkles size={16} aria-hidden /> {tb("sampleImport")}
              </button>
            )}
            <button type="button" onClick={openNew} className={ui.btnPrimary}><Plus size={16} aria-hidden /> {tb("new")}</button>
          </>
        }
      />
      {done && (
        <p role="status" className="flex items-start justify-between gap-3 rounded-xl border border-line bg-card px-4 py-3 text-sm text-content shadow-sm">
          <span className="flex items-start gap-2"><Sparkles size={16} aria-hidden className="mt-0.5 shrink-0 text-brand-gold" />{done}</span>
          <button type="button" onClick={() => setDone(null)} aria-label={tc("close")} className="-m-2 p-2 text-muted hover:text-content"><X size={16} aria-hidden /></button>
        </p>
      )}
      {posts.length === 0 ? (
        <div className={ui.card}><EmptyState icon={Newspaper} title={tb("empty")} /></div>
      ) : (
        <ul className={cn(ui.card, "divide-y divide-line overflow-hidden")}>
          {posts.map((p) => {
            const published = p.status === "PUBLISHED";
            return (
              <li key={p.id} className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                {p.coverImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={p.coverImage} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted"><ImageOff size={18} aria-hidden /></span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-content">{tl(p.title, locale) || p.title.en || "—"}</p>
                  <div className="mt-1"><Pill tone={STATUS_TONE[p.status]}>{ts(p.status)}</Pill></div>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => startTransition(async () => { await togglePublish(p.id, !published); })}
                    title={published ? tb("unpublish") : tb("publish")}
                    aria-label={published ? tb("unpublish") : tb("publish")}
                    className={ui.iconBtn}
                  >
                    {published ? <EyeOff size={16} aria-hidden /> : <Globe size={16} aria-hidden />}
                  </button>
                  <button type="button" onClick={() => { setIsNew(false); setModal(p); }} title={tc("edit")} aria-label={tc("edit")} className={ui.iconBtn}>
                    <Pencil size={16} aria-hidden />
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => confirm(tc("deleteConfirm")) && startTransition(async () => { await deletePost(p.id); })}
                    title={tc("delete")}
                    aria-label={tc("delete")}
                    className={ui.iconBtnDanger}
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {modal && <PostModal isNew={isNew} data={modal} onClose={() => setModal(null)} />}
    </div>
  );
}

function PostModal({ isNew, data, onClose }: { isNew: boolean; data: Post; onClose: () => void }) {
  const tb = useTranslations("AdminUi.blog");
  const tc = useTranslations("AdminUi.common");
  const [title, setTitle] = useState<LocalizedValue>(data.title);
  const [excerpt, setExcerpt] = useState<LocalizedValue>(data.excerpt || {});
  const [content, setContent] = useState<LocalizedValue>(data.content);
  const [cover, setCover] = useState<string | null>(data.coverImage || null);
  const [publish, setPublish] = useState(data.status === "PUBLISHED");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await savePost({ id: data.id || undefined, title, excerpt, content, coverImage: cover, status: publish ? "PUBLISHED" : "DRAFT" });
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
          <button type="button" onClick={onClose} className={ui.btnSecondary}>{tc("cancel")}</button>
          <button type="button" disabled={saving} onClick={save} className={ui.btnPrimary}>{saving ? tc("saving") : tc("save")}</button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <span className={ui.label}>{tb("cover")}</span>
          <ImageField value={cover} onChange={setCover} size="wide" />
        </div>
        <LocalizedInput label={tb("title")} value={title} onChange={setTitle} />
        <LocalizedInput label={tb("excerpt")} value={excerpt} onChange={setExcerpt} textarea />
        <LocalizedInput label={tb("content")} value={content} onChange={setContent} textarea />
        <label className="flex min-h-11 items-center gap-3 rounded-xl border border-line px-3 text-sm">
          <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className={ui.checkbox} /> {tb("publishNow")}
        </label>
      </div>
    </Dialog>
  );
}
