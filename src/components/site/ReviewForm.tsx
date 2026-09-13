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

  if (done) return (
    <div className="mx-auto max-w-lg rounded-3xl border border-brand-gold/30 bg-brand-ink-soft p-10 text-center">
      <p className="font-display text-2xl text-brand-gold-light">Rahmat!</p>
      <p className="mt-2 text-brand-cream/60">Sharhingiz moderatsiyadan so&apos;ng saytda chop etiladi.</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-brand-gold/25 bg-brand-ink-soft p-8 sm:p-10">
      <h3 className="mb-1 text-center font-display text-2xl text-brand-cream">Fikringizni qoldiring</h3>
      <p className="mb-6 text-center text-sm text-brand-cream/40">Tashrifingiz qanday o&apos;tdi?</p>
      <div className="mb-6 flex justify-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <button key={i} onMouseEnter={() => setHover(i + 1)} onMouseLeave={() => setHover(0)} onClick={() => setRating(i + 1)}>
            <Star size={32} className={i < (hover || rating) ? "fill-brand-gold text-brand-gold" : "text-brand-cream/20"} />
          </button>
        ))}
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ismingiz"
        className="mb-3 w-full rounded-xl border border-white/10 bg-brand-ink/40 px-4 py-3 text-brand-cream placeholder:text-brand-cream/30 outline-none focus:border-brand-gold/50" />
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Fikringiz..." rows={3}
        className="mb-4 w-full rounded-xl border border-white/10 bg-brand-ink/40 px-4 py-3 text-brand-cream placeholder:text-brand-cream/30 outline-none focus:border-brand-gold/50" />
      <button
        onClick={async () => { setLoading(true); const r = await submitReview({ authorName: name, rating, comment }); setLoading(false); if (r.ok) setDone(true); }}
        disabled={loading}
        className="btn-gold-sheen w-full rounded-full bg-brand-red py-3.5 font-medium text-white transition hover:bg-brand-red-dark disabled:opacity-60"
      >
        {loading ? "..." : "Yuborish"}
      </button>
    </div>
  );
}
