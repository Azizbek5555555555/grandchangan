"use client";

import { useState } from "react";
import { Star, Check, X, Trash2, Reply } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { moderateReview, replyReview, deleteReview } from "@/lib/review/actions";

type Review = {
  id: string; authorName: string; rating: number; comment?: string | null;
  status: string; reply?: string | null; createdAt: string;
};

export default function ReviewModeration({ reviews }: { reviews: Review[] }) {
  const [filter, setFilter] = useState("PENDING");
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const shown = filter === "all" ? reviews : reviews.filter((r) => r.status === filter);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Sharhlar</h1>
      <div className="mb-4 flex gap-2">
        {["PENDING", "APPROVED", "REJECTED", "all"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-xs ${filter === s ? "bg-brand-red text-white" : "bg-neutral-100"}`}>{s}</button>
        ))}
      </div>

      <div className="space-y-3">
        {shown.map((r) => (
          <div key={r.id} className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.authorName}</span>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className={i < r.rating ? "fill-brand-gold text-brand-gold" : "text-neutral-300"} />
                    ))}
                  </div>
                  <Badge color={r.status === "APPROVED" ? "green" : r.status === "REJECTED" ? "red" : "gold"}>{r.status}</Badge>
                </div>
                {r.comment && <p className="mt-2 text-sm text-neutral-600">{r.comment}</p>}
                {r.reply && <p className="mt-2 rounded bg-brand-cream p-2 text-sm"><b>Javob:</b> {r.reply}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => moderateReview(r.id, "APPROVED" as never)} className="rounded p-1.5 text-green-600 hover:bg-green-50"><Check size={16} /></button>
                <button onClick={() => moderateReview(r.id, "REJECTED" as never)} className="rounded p-1.5 text-orange-500 hover:bg-orange-50"><X size={16} /></button>
                <button onClick={() => { setReplyId(r.id); setReplyText(r.reply || ""); }} className="rounded p-1.5 text-blue-600 hover:bg-blue-50"><Reply size={16} /></button>
                <button onClick={() => confirm("O'chirilsinmi?") && deleteReview(r.id)} className="rounded p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
              </div>
            </div>
            {replyId === r.id && (
              <div className="mt-3 flex gap-2">
                <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Javob yozing..." className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm" />
                <button onClick={async () => { await replyReview(r.id, replyText); setReplyId(null); }} className="rounded-lg bg-brand-red px-4 text-sm text-white">Yuborish</button>
              </div>
            )}
          </div>
        ))}
        {shown.length === 0 && <p className="text-neutral-400">Sharh yo'q.</p>}
      </div>
    </div>
  );
}
