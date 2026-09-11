"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { submitReview } from "@/lib/review/actions";

export default function ReviewForm() {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  if (done) return <p className="rounded-lg bg-green-50 p-4 text-center text-green-700">Rahmat! Sharhingiz moderatsiyadan so'ng chop etiladi.</p>;

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white p-6">
      <h3 className="mb-4 text-center text-lg font-semibold">Sharh qoldiring</h3>
      <div className="mb-4 flex justify-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button key={i} onMouseEnter={() => setHover(i + 1)} onMouseLeave={() => setHover(0)} onClick={() => setRating(i + 1)}>
            <Star size={28} className={i < (hover || rating) ? "fill-brand-gold text-brand-gold" : "text-neutral-300"} />
          </button>
        ))}
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ismingiz" className="mb-3 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Fikringiz..." rows={3} className="mb-3 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
      <button
        onClick={async () => { setLoading(true); const r = await submitReview({ authorName: name, rating, comment }); setLoading(false); if (r.ok) setDone(true); }}
        disabled={loading}
        className="w-full rounded-lg bg-brand-red py-2.5 font-medium text-white hover:bg-brand-red-dark disabled:opacity-60"
      >
        {loading ? "..." : "Yuborish"}
      </button>
    </div>
  );
}
