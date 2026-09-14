"use client";
import { useState } from "react";
import { Plus, Pencil, Trash2, Globe, EyeOff } from "lucide-react";
import { Button, Modal, Badge } from "@/components/ui/primitives";
import { LocalizedInput, type LocalizedValue } from "@/components/ui/LocalizedInput";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { savePost, togglePublish, deletePost } from "@/lib/blog/actions";

type Post = { id: string; title: LocalizedValue; excerpt?: LocalizedValue | null; content: LocalizedValue; coverImage?: string | null; status: string };

export default function BlogManager({ posts }: { posts: Post[] }) {
  const [modal, setModal] = useState<Post | null>(null);
  const [isNew, setIsNew] = useState(false);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blog</h1>
        <Button onClick={() => { setIsNew(true); setModal({ id: "", title: {}, excerpt: {}, content: {}, coverImage: null, status: "DRAFT" }); }}>
          <Plus size={16} /> Maqola
        </Button>
      </div>
      <div className="space-y-2">
        {posts.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-xl border border-line bg-card p-4">
            <div className="flex items-center gap-3">
              {p.coverImage && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.coverImage} alt="" className="h-12 w-16 rounded object-cover" />}
              <div>
                <p className="font-medium">{p.title.uz || p.title.en || "—"}</p>
                <Badge color={p.status === "PUBLISHED" ? "green" : "gray"}>{p.status}</Badge>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => togglePublish(p.id, p.status !== "PUBLISHED")} className="rounded p-1.5 hover:bg-surface-2">{p.status === "PUBLISHED" ? <EyeOff size={16} /> : <Globe size={16} />}</button>
              <button onClick={() => { setIsNew(false); setModal(p); }} className="rounded p-1.5 hover:bg-surface-2"><Pencil size={16} /></button>
              <button onClick={() => confirm("O'chirilsinmi?") && deletePost(p.id)} className="rounded p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
        {posts.length === 0 && <p className="text-muted">Maqola yo'q.</p>}
      </div>
      {modal && <PostModal isNew={isNew} data={modal} onClose={() => setModal(null)} />}
    </div>
  );
}

function PostModal({ isNew, data, onClose }: { isNew: boolean; data: Post; onClose: () => void }) {
  const [title, setTitle] = useState<LocalizedValue>(data.title);
  const [excerpt, setExcerpt] = useState<LocalizedValue>(data.excerpt || {});
  const [content, setContent] = useState<LocalizedValue>(data.content);
  const [cover, setCover] = useState<string | null>(data.coverImage || null);
  const [publish, setPublish] = useState(data.status === "PUBLISHED");

  return (
    <Modal open onClose={onClose} wide title={isNew ? "Yangi maqola" : "Maqolani tahrirlash"}>
      <div className="space-y-4">
        <div><span className="mb-1 block text-sm font-medium">Muqova rasmi</span><ImageUpload value={cover} onChange={setCover} /></div>
        <LocalizedInput label="Sarlavha" value={title} onChange={setTitle} />
        <LocalizedInput label="Qisqa tavsif" value={excerpt} onChange={setExcerpt} textarea />
        <LocalizedInput label="Matn" value={content} onChange={setContent} textarea />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} /> Darhol chop etish</label>
        <div className="flex justify-end">
          <Button onClick={async () => { await savePost({ id: data.id || undefined, title, excerpt, content, coverImage: cover, status: publish ? "PUBLISHED" : "DRAFT" }); onClose(); }}>Saqlash</Button>
        </div>
      </div>
    </Modal>
  );
}
