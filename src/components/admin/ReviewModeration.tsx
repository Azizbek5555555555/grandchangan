"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Star, Check, X, Trash2, Reply, MessageSquareOff, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { moderateReview, replyReview, deleteReview } from "@/lib/review/actions";
import PageHeader from "@/components/admin/ui/PageHeader";
import FilterChips from "@/components/admin/ui/FilterChips";
import Pill, { STATUS_TONE } from "@/components/admin/ui/Pill";
import EmptyState from "@/components/admin/ui/EmptyState";
import { ui } from "@/components/admin/ui/styles";
import { fmtDate } from "@/components/admin/ui/format";

type Review = {
  id: string; authorName: string; rating: number; comment?: string | null;
  status: string; reply?: string | null; createdAt: string;
};

const FILTERS = ["PENDING", "APPROVED", "REJECTED", "all"] as const;

export default function ReviewModeration({ reviews }: { reviews: Review[] }) {
  const ta = useTranslations("Admin");
  const tr = useTranslations("AdminUi.reviews");
  const ts = useTranslations("AdminUi.reviewStatus");
  const tc = useTranslations("AdminUi.common");
  const locale = useLocale();
  const [filter, setFilter] = useState<string>("PENDING");
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [pending, startTransition] = useTransition();
  const shown = filter === "all" ? reviews : reviews.filter((r) => r.status === filter);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: reviews.length };
    reviews.forEach((r) => (c[r.status] = (c[r.status] || 0) + 1));
    return c;
  }, [reviews]);

  const run = (fn: () => Promise<unknown>) => startTransition(async () => { await fn(); });

  return (
    <div className={ui.page}>
      <PageHeader section="reviews" title={ta("reviews")} description={tr("subtitle")} />

      <FilterChips
        className="mb-5"
        label={tc("filterByStatus")}
        value={filter}
        onChange={setFilter}
        options={FILTERS.map((s) => ({ value: s, label: s === "all" ? tc("all") : ts(s), count: counts[s] || 0 }))}
      />

      {shown.length === 0 ? (
        <div className={ui.card}><EmptyState icon={MessageSquareOff} title={tr("empty")} /></div>
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => (
            <li key={r.id} className={cn(ui.card, ui.cardPad)}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="font-medium text-content">{r.authorName}</span>
                    <span className="flex" role="img" aria-label={tr("rating", { n: r.rating })}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} aria-hidden className={i < r.rating ? "fill-brand-gold text-brand-gold" : "text-line"} />
                      ))}
                    </span>
                    <Pill tone={STATUS_TONE[r.status]}>{ts(r.status)}</Pill>
                    <span className="text-xs text-muted">{fmtDate(r.createdAt, locale, { year: true, time: false })}</span>
                  </div>
                  {r.comment && <p className="mt-2 text-sm leading-relaxed text-content">{r.comment}</p>}
                  {r.reply && (
                    <div className="mt-3 rounded-xl border-l-2 border-brand-gold bg-surface-2 px-3 py-2 text-sm">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted">{tr("ourReply")}</span>
                      <p className="mt-0.5 text-content">{r.reply}</p>
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-1 border-t border-line pt-2 sm:border-0 sm:pt-0">
                  {r.status !== "APPROVED" && (
                    <button type="button" disabled={pending} onClick={() => run(() => moderateReview(r.id, "APPROVED" as never))} title={tr("approve")} aria-label={tr("approve")} className={cn(ui.iconBtn, "hover:text-success")}>
                      <Check size={17} aria-hidden />
                    </button>
                  )}
                  {r.status !== "REJECTED" && (
                    <button type="button" disabled={pending} onClick={() => run(() => moderateReview(r.id, "REJECTED" as never))} title={tr("reject")} aria-label={tr("reject")} className={ui.iconBtn}>
                      <X size={17} aria-hidden />
                    </button>
                  )}
                  <button type="button" onClick={() => { setReplyId(r.id); setReplyText(r.reply || ""); }} title={tr("reply")} aria-label={tr("reply")} className={ui.iconBtn}>
                    <Reply size={17} aria-hidden />
                  </button>
                  <button type="button" disabled={pending} onClick={() => confirm(tc("deleteConfirm")) && run(() => deleteReview(r.id))} title={tc("delete")} aria-label={tc("delete")} className={ui.iconBtnDanger}>
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
              </div>
              {replyId === r.id && (
                <form
                  className="mt-3 flex flex-col gap-2 sm:flex-row"
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(async () => { await replyReview(r.id, replyText); setReplyId(null); });
                  }}
                >
                  <label className="flex-1">
                    <span className="sr-only">{tr("reply")}</span>
                    <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={tr("replyPlaceholder")} className={ui.input} autoFocus />
                  </label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setReplyId(null)} className={ui.btnSecondary}>{tc("cancel")}</button>
                    <button type="submit" disabled={pending} className={ui.btnPrimary}><Send size={15} aria-hidden /> {tr("send")}</button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
