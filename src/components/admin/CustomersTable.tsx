"use client";
import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Ban, Check, Search, Users } from "lucide-react";
import { toggleBlock } from "@/lib/customer/actions";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/admin/ui/PageHeader";
import Pill from "@/components/admin/ui/Pill";
import EmptyState from "@/components/admin/ui/EmptyState";
import { ui } from "@/components/admin/ui/styles";
import { fmtDate } from "@/components/admin/ui/format";

type Customer = { id: string; name?: string | null; phone?: string | null; role: string; isBlocked: boolean; ordersCount: number; reservationsCount: number; createdAt: string };

export default function CustomersTable({ customers }: { customers: Customer[] }) {
  const ta = useTranslations("Admin");
  const tu = useTranslations("AdminUi.customers");
  const tc = useTranslations("AdminUi.common");
  const locale = useLocale();
  const [q, setQ] = useState("");
  const [pending, startTransition] = useTransition();
  const needle = q.trim().toLowerCase();
  const shown = needle
    ? customers.filter((c) => (c.name || "").toLowerCase().includes(needle) || (c.phone || "").includes(needle))
    : customers;

  function toggle(c: Customer) {
    startTransition(async () => {
      const r = await toggleBlock(c.id, !c.isBlocked);
      if (!r.ok) alert(r.error);
    });
  }

  return (
    <div className={ui.page}>
      <PageHeader
        section="customers"
        title={ta("customers")}
        description={tu("subtitle", { count: customers.length })}
        actions={
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">{tu("search")}</span>
            <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tu("search")} className={cn(ui.input, "pl-9")} />
          </label>
        }
      />
      {shown.length === 0 ? (
        <div className={ui.card}><EmptyState icon={Users} title={tu("empty")} /></div>
      ) : (
        <div className={ui.tableWrap}>
          <table className={cn(ui.table, "min-w-[46rem]")}>
            <thead className={ui.thead}>
              <tr>
                <th className={ui.th}>{tc("name")}</th>
                <th className={ui.th}>{tc("phone")}</th>
                <th className={ui.th}>{tu("colReservations")}</th>
                <th className={ui.th}>{tu("colOrders")}</th>
                <th className={ui.th}>{tu("colJoined")}</th>
                <th className={ui.th}>{tc("status")}</th>
                <th className={cn(ui.th, "text-right")}>{tc("actions")}</th>
              </tr>
            </thead>
            <tbody className={ui.tbody}>
              {shown.map((c) => (
                <tr key={c.id} className={ui.tr}>
                  <td className={cn(ui.td, "font-medium")}>{c.name || "—"}</td>
                  <td className={cn(ui.td, "whitespace-nowrap text-muted")}>{c.phone || "—"}</td>
                  <td className={cn(ui.td, "tabular-nums")}>{c.reservationsCount}</td>
                  <td className={cn(ui.td, "tabular-nums")}>{c.ordersCount}</td>
                  <td className={cn(ui.td, "whitespace-nowrap text-muted")}>{fmtDate(c.createdAt, locale, { year: true, time: false })}</td>
                  <td className={ui.td}><Pill tone={c.isBlocked ? "fire" : "success"}>{c.isBlocked ? tc("blocked") : tc("active")}</Pill></td>
                  <td className={cn(ui.td, "text-right")}>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => toggle(c)}
                      className={cn(ui.btnGhost, "min-h-11 px-3 text-xs sm:min-h-9", c.isBlocked ? "hover:text-success" : "hover:text-fire-ink")}
                    >
                      {c.isBlocked ? <><Check size={14} aria-hidden /> {tc("unblock")}</> : <><Ban size={14} aria-hidden /> {tc("block")}</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
