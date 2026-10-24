"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { submitReview } from "@/lib/review/actions";
import { btnClass } from "@/components/site/kit/ButtonLink";
import { cn } from "@/lib/utils";

/**
 * Sharh qoldirish formasi (bosh sahifa). Krem/karta uslubida — yorug' va qorong'i temada
 * semantik tokenlar bilan ishlaydi. Sharh moderatsiyadan keyin chiqadi.
 */
export default function ReviewForm() {
  const T = useTranslations("Site");
  const H = useTranslations("Home2");
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shell = "relative mx-auto max-w-lg overflow-hidden rounded-[28px] border border-line bg-card p-7 shadow-xl shadow-content/5 sm:p-10";

  if (done) return (
    <div className={cn(shell, "text-center")} role="status">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-fire text-brand-cream">
        <CheckCircle2 size={30} />
      </span>
      <p className="mt-5 font-display text-3xl text-content">{T("rvThanks")}</p>
      <p className="mt-2 text-muted">{T("rvModeration")}</p>
    </div>
  );

  const field = "w-full rounded-2xl border border-line bg-paper px-4 py-3.5 text-content outline-none transition placeholder:text-muted focus:border-fire focus:ring-4 focus:ring-fire/10";

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await submitReview({ authorName: name, rating, comment });
      if (r.ok) setDone(true);
      else setError(r.error || T("errGeneric"));
    } catch {
      setError(T("errGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={send} className={shell}>
      <span aria-hidden="true" className="fret-band absolute inset-x-0 top-0 text-fire/20" />
      <p lang="zh" aria-hidden="true" className="font-cn mt-3 text-center text-2xl leading-none text-fire">留言</p>
      <h3 className="mt-2 text-center font-display text-3xl text-content">{T("rvTitle")}</h3>
      <p className="mt-1 text-center text-sm text-muted">{T("rvSub")}</p>

      <div role="radiogroup" aria-label={T("rvSub")} className="my-6 flex justify-center gap-1" onMouseLeave={() => setHover(0)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={rating === i + 1}
            aria-label={H("rateStar", { n: i + 1 })}
            onMouseEnter={() => setHover(i + 1)}
            onFocus={() => setHover(i + 1)}
            onBlur={() => setHover(0)}
            onClick={() => setRating(i + 1)}
            className="flex size-11 items-center justify-center rounded-full transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-fire"
          >
            <Star size={30} className={i < (hover || rating) ? "fill-saffron text-saffron" : "text-line"} />
          </button>
        ))}
      </div>

      <label className="sr-only" htmlFor="rv-name">{T("rNamePh")}</label>
      <input id="rv-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={T("rNamePh")} autoComplete="name" className={cn(field, "mb-3")} />
      <label className="sr-only" htmlFor="rv-comment">{T("rvComment")}</label>
      <textarea id="rv-comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder={T("rvComment")} rows={4} className={cn(field, "mb-4 resize-none")} />
      {error && <p role="alert" className="mb-3 text-center text-sm text-danger">{error}</p>}
      <button type="submit" disabled={loading} className={cn(btnClass("fire", "lg"), "w-full disabled:opacity-60")}>
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} />}
        {T("rvSend")}
      </button>
    </form>
  );
}
