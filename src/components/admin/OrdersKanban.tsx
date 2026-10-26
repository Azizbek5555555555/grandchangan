"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, ChevronRight, ChevronLeft, Ban, Trash2, Search, Minus, Inbox } from "lucide-react";
import { t, formatMoney, currencyOf, cn } from "@/lib/utils";
import { createOrder, updateOrderStatus, deleteOrder } from "@/lib/order/actions";
import { MANAGEMENT } from "@/lib/auth/permissions";
import PageHeader from "@/components/admin/ui/PageHeader";
import Dialog from "@/components/admin/ui/Dialog";
import { Field, Notice } from "@/components/admin/ui/Field";
import { STATUS_TONE } from "@/components/admin/ui/Pill";
import { ui } from "@/components/admin/ui/styles";
import { fmtTime } from "@/components/admin/ui/format";
import type { UserRole } from "@prisma/client";

const FLOW = ["NEW", "CONFIRMED", "PREPARING", "READY", "SERVED", "COMPLETED"] as const;

/** Ustun sarlavhasidagi rangli nuqta (Pill bilan bir xil ma'no) */
const DOT: Record<string, string> = {
  gold: "bg-brand-gold", saffron: "bg-saffron-deep", jade: "bg-leaf", success: "bg-success", neutral: "bg-muted", fire: "bg-fire-ink",
};

type OrderItem = { nameSnapshot: unknown; quantity: number };
type Order = {
  id: string; code: string; status: string; type: string; total: number;
  tableNumber?: string | null; guestName?: string | null; items: OrderItem[]; createdAt: string;
};
type MenuItem = { id: string; name: unknown; price: number };
type Table = { id: string; number: string };

export default function OrdersKanban({
  orders, menuItems, tables, locale, role,
}: { orders: Order[]; menuItems: MenuItem[]; tables: Table[]; locale: string; role: UserRole }) {
  const ta = useTranslations("Admin");
  const to = useTranslations("AdminUi.orders");
  const ts = useTranslations("AdminUi.orderStatus");
  const tc = useTranslations("AdminUi.common");
  const cur = currencyOf(locale);
  const [newOpen, setNewOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  // Oshxona faqat holatni o'zgartiradi; buyurtma yaratish — ofitsiant va boshqaruv; o'chirish — boshqaruv
  const canCreate = role !== "KITCHEN";
  const canDelete = MANAGEMENT.includes(role);

  function next(status: string) { const i = FLOW.indexOf(status as never); return i >= 0 && i < FLOW.length - 1 ? FLOW[i + 1] : null; }
  function prev(status: string) { const i = FLOW.indexOf(status as never); return i > 0 ? FLOW[i - 1] : null; }
  const move = (id: string, status: string) => startTransition(async () => { await updateOrderStatus(id, status as never); });

  return (
    <div className={ui.page}>
      <PageHeader
        section="orders"
        title={ta("orders")}
        description={to("subtitle")}
        actions={
          canCreate && (
            <button type="button" onClick={() => setNewOpen(true)} className={ui.btnPrimary}>
              <Plus size={16} aria-hidden /> {to("new")}
            </button>
          )
        }
      />

      {/* Ustunlar faqat o'z ichida gorizontal suriladi */}
      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-4">
          {FLOW.map((col) => {
            const list = orders.filter((o) => o.status === col);
            return (
              <section key={col} aria-label={ts(col)} className="flex w-[17rem] shrink-0 flex-col rounded-2xl border border-line bg-surface-2/50 p-2.5">
                <div className="mb-2.5 flex items-center justify-between px-1.5 pt-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-content">
                    <span aria-hidden="true" className={cn("size-2 rounded-full", DOT[STATUS_TONE[col]])} />
                    {ts(col)}
                  </span>
                  <span className="min-w-6 rounded-full bg-card px-2 py-0.5 text-center text-xs font-semibold tabular-nums text-muted">{list.length}</span>
                </div>
                <div className="space-y-2.5">
                  {list.map((o) => {
                    const nx = next(o.status);
                    const pv = prev(o.status);
                    return (
                      <article key={o.id} className={cn(ui.card, "p-3.5")}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs text-muted">{o.code}</span>
                          <span className="text-xs text-muted tabular-nums">{fmtTime(o.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-content">
                          {o.tableNumber ? to("table", { n: o.tableNumber }) : to(`type.${o.type === "PREORDER" ? "PREORDER" : "DINE_IN"}`)}
                          {o.guestName ? <span className="font-normal text-muted"> · {o.guestName}</span> : null}
                        </p>
                        <ul className="mt-2 space-y-0.5 text-xs text-muted">
                          {o.items.slice(0, 4).map((it, idx) => (
                            <li key={idx} className="flex gap-1.5"><span className="tabular-nums text-content">{it.quantity}×</span> <span className="min-w-0 truncate">{t(it.nameSnapshot, locale)}</span></li>
                          ))}
                          {o.items.length > 4 && <li>{to("more", { count: o.items.length - 4 })}</li>}
                        </ul>
                        <p className="mt-2.5 font-display text-lg leading-none text-fire-ink lining-nums tabular-nums">{formatMoney(o.total, cur)}</p>
                        <div className="mt-3 flex items-center gap-1 border-t border-line pt-2.5">
                          {pv && (
                            <button type="button" disabled={pending} onClick={() => move(o.id, pv)} title={to("back", { status: ts(pv) })} aria-label={to("back", { status: ts(pv) })} className={ui.iconBtn}>
                              <ChevronLeft size={16} aria-hidden />
                            </button>
                          )}
                          {nx && (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => move(o.id, nx)}
                              aria-label={to("forward", { status: ts(nx) })}
                              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl bg-fire/10 px-2 text-xs font-medium text-fire-ink transition hover:bg-fire/15 disabled:opacity-50 sm:min-h-9"
                            >
                              <span className="truncate">{ts(nx)}</span> <ChevronRight size={14} aria-hidden className="shrink-0" />
                            </button>
                          )}
                          <div className={cn("flex gap-0.5", !nx && "ml-auto")}>
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => confirm(to("cancelConfirm", { code: o.code })) && move(o.id, "CANCELLED")}
                              title={to("cancel")}
                              aria-label={to("cancel")}
                              className={ui.iconBtn}
                            >
                              <Ban size={15} aria-hidden />
                            </button>
                            {canDelete && (
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => confirm(tc("deleteConfirm")) && startTransition(async () => { await deleteOrder(o.id); })}
                                title={tc("delete")}
                                aria-label={tc("delete")}
                                className={ui.iconBtnDanger}
                              >
                                <Trash2 size={15} aria-hidden />
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                  {list.length === 0 && (
                    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
                      <Inbox size={18} aria-hidden />
                      {to("emptyColumn")}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {newOpen && <NewOrderModal menuItems={menuItems} tables={tables} locale={locale} onClose={() => setNewOpen(false)} />}
    </div>
  );
}

function NewOrderModal({
  menuItems, tables, locale, onClose,
}: { menuItems: MenuItem[]; tables: Table[]; locale: string; onClose: () => void }) {
  const to = useTranslations("AdminUi.orders");
  const tc = useTranslations("AdminUi.common");
  const cur = currencyOf(locale);
  const [tableId, setTableId] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = menuItems.filter((m) => t(m.name, locale).toLowerCase().includes(q.toLowerCase()));
  const total = Object.entries(cart).reduce((sum, [id, qty]) => {
    const mi = menuItems.find((m) => m.id === id);
    return sum + (mi ? mi.price * qty : 0);
  }, 0);
  const count = Object.values(cart).reduce((s, n) => s + n, 0);

  function add(id: string) { setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 })); }
  function sub(id: string) { setCart((c) => { const n = (c[id] || 0) - 1; const cc = { ...c }; if (n <= 0) delete cc[id]; else cc[id] = n; return cc; }); }

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const r = await createOrder({
        type: "DINE_IN", tableId: tableId || undefined,
        items: Object.entries(cart).map(([menuItemId, quantity]) => ({ menuItemId, quantity })),
      });
      if (r && "ok" in r && !r.ok) { setError(("error" in r && r.error) || tc("error")); return; }
      onClose();
    } catch {
      setError(tc("error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      onClose={onClose}
      wide
      title={to("new")}
      footer={
        <>
          <span className="mr-auto font-display text-xl text-fire-ink lining-nums tabular-nums">{formatMoney(total, cur)}</span>
          <button type="button" onClick={onClose} className={ui.btnSecondary}>{tc("cancel")}</button>
          <button type="button" className={ui.btnPrimary} disabled={saving || count === 0} onClick={submit}>
            {saving ? tc("saving") : to("create")}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Field label={to("tableLabel")} className="mb-3">
            <select value={tableId} onChange={(e) => setTableId(e.target.value)} className={ui.input}>
              <option value="">{to("noTable")}</option>
              {tables.map((t2) => <option key={t2.id} value={t2.id}>{to("table", { n: t2.number })}</option>)}
            </select>
          </Field>
          <label className="relative mb-3 block">
            <span className="sr-only">{to("searchDish")}</span>
            <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={to("searchDish")} className={cn(ui.input, "pl-9")} />
          </label>
          <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => add(m.id)}
                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2 text-left text-sm transition hover:border-brand-gold"
              >
                <span className="min-w-0">{t(m.name, locale)}</span>
                <span className="shrink-0 tabular-nums text-fire-ink">{formatMoney(m.price, cur)}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="py-4 text-center text-sm text-muted">{to("noDishes")}</p>}
          </div>
        </div>
        <div>
          <p className={ui.label}>{to("cart", { count })}</p>
          <div className="space-y-2">
            {Object.entries(cart).map(([id, qty]) => {
              const mi = menuItems.find((m) => m.id === id)!;
              return (
                <div key={id} className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1">{t(mi.name, locale)}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => sub(id)} aria-label={to("decrease")} className={ui.iconBtn}><Minus size={14} aria-hidden /></button>
                    <span className="w-6 text-center tabular-nums">{qty}</span>
                    <button type="button" onClick={() => add(id)} aria-label={to("increase")} className={ui.iconBtn}><Plus size={14} aria-hidden /></button>
                  </div>
                </div>
              );
            })}
            {count === 0 && <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-sm text-muted">{to("cartEmpty")}</p>}
          </div>
          {error && <Notice ok={false} className="mt-3">{error}</Notice>}
        </div>
      </div>
    </Dialog>
  );
}
