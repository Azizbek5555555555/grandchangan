"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarX2, Search, Trash2, UtensilsCrossed } from "lucide-react";
import { t, formatMoney, currencyOf, cn } from "@/lib/utils";
import { deleteReservation, updateReservationStatus } from "@/lib/reservation/actions";
import PageHeader from "@/components/admin/ui/PageHeader";
import FilterChips from "@/components/admin/ui/FilterChips";
import Pill, { STATUS_TONE } from "@/components/admin/ui/Pill";
import EmptyState from "@/components/admin/ui/EmptyState";
import Dialog from "@/components/admin/ui/Dialog";
import { ui } from "@/components/admin/ui/styles";
import { fmtDate } from "@/components/admin/ui/format";

type PreOrderItem = { name: unknown; quantity: number; unitPrice: number };
type PreOrder = { code: string; status: string; total: number; items: PreOrderItem[] };
type Res = {
  id: string; code: string; guestName: string; guestPhone: string; partySize: number;
  date: string; startTime: string; status: string; tableNumber?: string | null;
  occasion?: string | null; preOrder?: PreOrder | null;
};

const STATUSES = ["PENDING", "CONFIRMED", "SEATED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;

export default function ReservationsTable({ reservations, canDelete = false }: { reservations: Res[]; canDelete?: boolean }) {
  const ta = useTranslations("Admin");
  const tr = useTranslations("AdminUi.reservations");
  const ts = useTranslations("AdminUi.resStatus");
  const tc = useTranslations("AdminUi.common");
  const locale = useLocale();
  const cur = currencyOf(locale);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [pending, startTransition] = useTransition();
  const [detail, setDetail] = useState<Res | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    reservations.forEach((r) => (c[r.status] = (c[r.status] || 0) + 1));
    return c;
  }, [reservations]);

  const needle = q.trim().toLowerCase();
  const shown = reservations.filter(
    (r) =>
      (filter === "all" || r.status === filter) &&
      (!needle || r.guestName.toLowerCase().includes(needle) || r.guestPhone.includes(needle) || r.code.toLowerCase().includes(needle))
  );

  function remove(r: Res) {
    if (!window.confirm(ta("resDeleteConfirm", { code: r.code }))) return;
    startTransition(async () => {
      const res = await deleteReservation(r.id);
      if (!res.ok) window.alert(res.error);
    });
  }

  function setStatus(r: Res, status: string) {
    startTransition(async () => {
      await updateReservationStatus(r.id, status as never);
    });
  }

  const statusSelect = (r: Res, className?: string) => (
    <select
      value={r.status}
      onChange={(e) => setStatus(r, e.target.value)}
      disabled={pending}
      aria-label={tr("changeStatus", { code: r.code })}
      className={cn(ui.inputSm, "text-xs", className)}
    >
      {STATUSES.map((s) => <option key={s} value={s}>{ts(s)}</option>)}
    </select>
  );

  const preorderBtn = (r: Res) =>
    r.preOrder ? (
      <button
        type="button"
        onClick={() => setDetail(r)}
        className="inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-fire/20 bg-fire/10 px-3 py-1 text-xs font-medium text-fire-ink transition hover:bg-fire/15"
      >
        <UtensilsCrossed size={13} aria-hidden />
        {tr("dishes", { count: r.preOrder.items.length })} · {formatMoney(r.preOrder.total, cur)}
      </button>
    ) : (
      <span className="text-xs text-muted">—</span>
    );

  const deleteBtn = (r: Res) =>
    canDelete && (
      <button type="button" onClick={() => remove(r)} disabled={pending} title={ta("delete")} aria-label={`${ta("delete")} ${r.code}`} className={ui.iconBtnDanger}>
        <Trash2 size={16} aria-hidden />
      </button>
    );

  return (
    <div className={ui.page}>
      <PageHeader section="reservations" title={ta("reservations")} description={tr("subtitle")} />

      <div className="mb-5 flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <FilterChips
          label={tc("filterByStatus")}
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: tc("all"), count: reservations.length },
            ...STATUSES.map((s) => ({ value: s, label: ts(s), count: counts[s] || 0 })),
          ]}
        />
        <label className="relative block sm:max-w-sm 2xl:w-72">
          <span className="sr-only">{tr("search")}</span>
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("search")} className={cn(ui.input, "pl-9")} />
        </label>
      </div>

      {shown.length === 0 ? (
        <div className={ui.card}>
          <EmptyState icon={CalendarX2} title={tr("empty")} hint={filter !== "all" || needle ? tr("emptyHint") : undefined} />
        </div>
      ) : (
        <>
          {/* md+ : jadval */}
          <div className={cn(ui.tableWrap, "hidden md:block")}>
            <table className={ui.table}>
              <thead className={ui.thead}>
                <tr>
                  <th className={ui.th}>{tr("colCode")}</th>
                  <th className={ui.th}>{tr("colGuest")}</th>
                  <th className={ui.th}>{tr("colParty")}</th>
                  <th className={ui.th}>{tr("colTime")}</th>
                  <th className={ui.th}>{tr("colTable")}</th>
                  <th className={ui.th}>{tr("colPreorder")}</th>
                  <th className={ui.th}>{tr("colStatus")}</th>
                  <th className={cn(ui.th, "text-right")}>{tc("actions")}</th>
                </tr>
              </thead>
              <tbody className={ui.tbody}>
                {shown.map((r) => (
                  <tr key={r.id} className={ui.tr}>
                    <td className={cn(ui.td, "font-mono text-xs text-muted")}>{r.code}</td>
                    <td className={ui.td}>
                      <div className="font-medium">{r.guestName}</div>
                      <a href={`tel:+${r.guestPhone.replace(/\D/g, "")}`} className="text-xs text-muted hover:text-content">{r.guestPhone}</a>
                    </td>
                    <td className={cn(ui.td, "tabular-nums")}>{r.partySize}</td>
                    <td className={cn(ui.td, "whitespace-nowrap text-sm")}>{fmtDate(r.startTime, locale)}</td>
                    <td className={ui.td}>{r.tableNumber || "—"}</td>
                    <td className={ui.td}>{preorderBtn(r)}</td>
                    <td className={ui.td}><Pill tone={STATUS_TONE[r.status]}>{ts(r.status)}</Pill></td>
                    <td className={ui.td}>
                      <div className="flex items-center justify-end gap-1">
                        {statusSelect(r)}
                        {deleteBtn(r)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* telefon: kartalar */}
          <ul className="space-y-3 md:hidden">
            {shown.map((r) => (
              <li key={r.id} className={cn(ui.card, "p-4")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-content">{r.guestName}</p>
                    <a href={`tel:+${r.guestPhone.replace(/\D/g, "")}`} className="text-xs text-muted">{r.guestPhone}</a>
                  </div>
                  <Pill tone={STATUS_TONE[r.status]}>{ts(r.status)}</Pill>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <dt className="text-muted">{tr("colTime")}</dt>
                    <dd className="mt-0.5 text-content">{fmtDate(r.startTime, locale)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">{tr("colParty")}</dt>
                    <dd className="mt-0.5 text-content tabular-nums">{r.partySize}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">{tr("colTable")}</dt>
                    <dd className="mt-0.5 text-content">{r.tableNumber || "—"}</dd>
                  </div>
                </dl>
                {r.preOrder && <div className="mt-3">{preorderBtn(r)}</div>}
                <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                  <span className="mr-auto font-mono text-[11px] text-muted">{r.code}</span>
                  {statusSelect(r)}
                  {deleteBtn(r)}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {detail?.preOrder && (
        <Dialog onClose={() => setDetail(null)} eyebrow={tr("preorder")} title={detail.code}>
          <dl className="mb-4 grid grid-cols-1 gap-2 rounded-xl bg-surface-2 p-3 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-muted">{tr("colGuest")}</dt><dd>{detail.guestName} · {detail.guestPhone}</dd></div>
            <div><dt className="text-xs text-muted">{tr("colTime")}</dt><dd>{fmtDate(detail.startTime, locale, { year: true })}</dd></div>
            <div><dt className="text-xs text-muted">{tr("colTable")}</dt><dd>{detail.tableNumber || "—"}</dd></div>
            <div><dt className="text-xs text-muted">{tr("orderCode")}</dt><dd className="font-mono">{detail.preOrder.code}</dd></div>
          </dl>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-line">
              {detail.preOrder.items.map((it, i) => (
                <tr key={i}>
                  <td className="py-2.5 pr-2">{t(it.name, locale)}</td>
                  <td className="py-2.5 text-center text-muted tabular-nums">×{it.quantity}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatMoney(it.unitPrice * it.quantity, cur)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line">
                <td className="pt-3 font-semibold" colSpan={2}>{tc("total")}</td>
                <td className="pt-3 text-right font-display text-lg text-fire-ink lining-nums tabular-nums">{formatMoney(detail.preOrder.total, cur)}</td>
              </tr>
            </tfoot>
          </table>
          <p className="mt-4 text-xs text-muted">{tr("payAtVenue")}</p>
        </Dialog>
      )}
    </div>
  );
}
