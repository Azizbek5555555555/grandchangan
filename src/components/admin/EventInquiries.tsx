"use client";
import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Trash2, PartyPopper, Phone, Users, CalendarDays } from "lucide-react";
import { updateInquiryStatus, deleteInquiry } from "@/lib/event/actions";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/admin/ui/PageHeader";
import FilterChips from "@/components/admin/ui/FilterChips";
import Pill, { STATUS_TONE } from "@/components/admin/ui/Pill";
import EmptyState from "@/components/admin/ui/EmptyState";
import { ui } from "@/components/admin/ui/styles";
import { fmtDate } from "@/components/admin/ui/format";

type Inquiry = { id: string; name: string; phone: string; eventType: string; guestCount: number; preferredDate?: string | null; message?: string | null; status: string; createdAt: string };
const STATUSES = ["NEW", "CONTACTED", "CONFIRMED", "CLOSED"] as const;
/** Saytdagi forma bazaga o'zbekcha nom yozadi (EventForm.tsx TYPES) — admin'da tilga o'giramiz */
const EVENT_TYPE_KEY: Record<string, string> = {
  "To'y": "wedding", "Tug'ilgan kun": "birthday", Korporativ: "corporate", Yubiley: "anniversary", Boshqa: "other",
};

export default function EventInquiries({ inquiries }: { inquiries: Inquiry[] }) {
  const ta = useTranslations("Admin");
  const te = useTranslations("AdminUi.events");
  const ts = useTranslations("AdminUi.eventStatus");
  const tc = useTranslations("AdminUi.common");
  const locale = useLocale();
  const [filter, setFilter] = useState("all");
  const [pending, startTransition] = useTransition();
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    inquiries.forEach((q) => (c[q.status] = (c[q.status] || 0) + 1));
    return c;
  }, [inquiries]);
  const shown = filter === "all" ? inquiries : inquiries.filter((q) => q.status === filter);
  const typeLabel = (v: string) => (EVENT_TYPE_KEY[v] ? te(`types.${EVENT_TYPE_KEY[v]}`) : v);

  return (
    <div className={ui.page}>
      <PageHeader section="events" title={ta("events")} description={te("subtitle")} />
      <FilterChips
        className="mb-5"
        label={tc("filterByStatus")}
        value={filter}
        onChange={setFilter}
        options={[{ value: "all", label: tc("all"), count: inquiries.length }, ...STATUSES.map((s) => ({ value: s, label: ts(s), count: counts[s] || 0 }))]}
      />
      {shown.length === 0 ? (
        <div className={ui.card}><EmptyState icon={PartyPopper} title={te("empty")} /></div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {shown.map((q) => (
            <li key={q.id} className={cn(ui.card, ui.cardPad, "flex flex-col")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fire-ink">{typeLabel(q.eventType)}</p>
                  <p className="mt-1 font-display text-lg leading-snug text-content">{q.name}</p>
                </div>
                <Pill tone={STATUS_TONE[q.status]}>{ts(q.status)}</Pill>
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted">
                <li className="flex items-center gap-1.5"><Phone size={14} aria-hidden /> <a href={`tel:+${q.phone.replace(/\D/g, "")}`} className="hover:text-content">{q.phone}</a></li>
                <li className="flex items-center gap-1.5"><Users size={14} aria-hidden /> {te("guests", { count: q.guestCount })}</li>
                {q.preferredDate && (
                  <li className="flex items-center gap-1.5"><CalendarDays size={14} aria-hidden /> {fmtDate(q.preferredDate, locale, { year: true, time: false })}</li>
                )}
              </ul>
              {q.message && <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-sm leading-relaxed text-content">{q.message}</p>}
              <div className="mt-auto pt-4"><div className="flex items-center gap-2 border-t border-line pt-3">
                <span className="mr-auto text-xs text-muted">{te("received", { date: fmtDate(q.createdAt, locale) })}</span>
                <select
                  value={q.status}
                  disabled={pending}
                  onChange={(e) => { const v = e.target.value; startTransition(async () => { await updateInquiryStatus(q.id, v); }); }}
                  aria-label={te("changeStatus")}
                  className={cn(ui.inputSm, "text-xs")}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{ts(s)}</option>)}
                </select>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => confirm(tc("deleteConfirm")) && startTransition(async () => { await deleteInquiry(q.id); })}
                  title={tc("delete")}
                  aria-label={tc("delete")}
                  className={ui.iconBtnDanger}
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </div></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
