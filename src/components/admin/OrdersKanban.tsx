"use client";

import { useState } from "react";
import { Plus, ChevronRight, ChevronLeft, X, Trash2 } from "lucide-react";
import { Button, Modal } from "@/components/ui/primitives";
import { t, formatMoney } from "@/lib/utils";
import { createOrder, updateOrderStatus, deleteOrder } from "@/lib/order/actions";

const FLOW = ["NEW", "CONFIRMED", "PREPARING", "READY", "SERVED", "COMPLETED"] as const;
const TITLES: Record<string, string> = {
  NEW: "Yangi", CONFIRMED: "Tasdiqlangan", PREPARING: "Tayyorlanmoqda",
  READY: "Tayyor", SERVED: "Berilgan", COMPLETED: "Yakunlangan",
};

type OrderItem = { nameSnapshot: unknown; quantity: number };
type Order = {
  id: string; code: string; status: string; type: string; total: number;
  tableNumber?: string | null; guestName?: string | null; items: OrderItem[]; createdAt: string;
};
type MenuItem = { id: string; name: unknown; price: number };
type Table = { id: string; number: string };

export default function OrdersKanban({
  orders, menuItems, tables, locale,
}: { orders: Order[]; menuItems: MenuItem[]; tables: Table[]; locale: string }) {
  const [newOpen, setNewOpen] = useState(false);

  function next(status: string) { const i = FLOW.indexOf(status as never); return i >= 0 && i < FLOW.length - 1 ? FLOW[i + 1] : null; }
  function prev(status: string) { const i = FLOW.indexOf(status as never); return i > 0 ? FLOW[i - 1] : null; }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Buyurtmalar</h1>
        <Button onClick={() => setNewOpen(true)}><Plus size={16} /> Yangi buyurtma</Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {FLOW.map((col) => {
          const list = orders.filter((o) => o.status === col);
          return (
            <div key={col} className="w-64 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-sm font-semibold text-muted">{TITLES[col]}</span>
                <span className="rounded-full bg-surface-2 px-2 text-xs">{list.length}</span>
              </div>
              <div className="space-y-2">
                {list.map((o) => (
                  <div key={o.id} className="rounded-xl border border-line bg-card p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-muted">{o.code}</span>
                      <span className="text-xs">{o.tableNumber ? `Stol ${o.tableNumber}` : o.type}</span>
                    </div>
                    <ul className="mt-2 space-y-0.5 text-xs text-muted">
                      {o.items.slice(0, 4).map((it, idx) => (
                        <li key={idx}>{it.quantity}× {t(it.nameSnapshot, locale)}</li>
                      ))}
                      {o.items.length > 4 && <li className="text-muted">+{o.items.length - 4} ...</li>}
                    </ul>
                    <p className="mt-2 text-sm font-bold text-brand-red">{formatMoney(o.total)}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex gap-1">
                        {prev(o.status) && <button onClick={() => updateOrderStatus(o.id, prev(o.status) as never)} className="rounded p-1 hover:bg-surface-2"><ChevronLeft size={14} /></button>}
                        {next(o.status) && <button onClick={() => updateOrderStatus(o.id, next(o.status) as never)} className="rounded bg-brand-red/10 p-1 text-brand-red hover:bg-brand-red/20"><ChevronRight size={14} /></button>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => updateOrderStatus(o.id, "CANCELLED" as never)} className="rounded p-1 text-orange-500 hover:bg-orange-50"><X size={14} /></button>
                        <button onClick={() => confirm("O'chirilsinmi?") && deleteOrder(o.id)} className="rounded p-1 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {newOpen && <NewOrderModal menuItems={menuItems} tables={tables} locale={locale} onClose={() => setNewOpen(false)} />}
    </div>
  );
}

function NewOrderModal({
  menuItems, tables, locale, onClose,
}: { menuItems: MenuItem[]; tables: Table[]; locale: string; onClose: () => void }) {
  const [tableId, setTableId] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = menuItems.filter((m) => t(m.name, locale).toLowerCase().includes(q.toLowerCase()));
  const total = Object.entries(cart).reduce((sum, [id, qty]) => {
    const mi = menuItems.find((m) => m.id === id);
    return sum + (mi ? mi.price * qty : 0);
  }, 0);

  function add(id: string) { setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 })); }
  function sub(id: string) { setCart((c) => { const n = (c[id] || 0) - 1; const cc = { ...c }; if (n <= 0) delete cc[id]; else cc[id] = n; return cc; }); }

  return (
    <Modal open onClose={onClose} wide title="Yangi buyurtma">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <select value={tableId} onChange={(e) => setTableId(e.target.value)} className="mb-3 w-full rounded-lg border border-line px-3 py-2 text-sm">
            <option value="">Stol tanlang (ixtiyoriy)</option>
            {tables.map((t2) => <option key={t2.id} value={t2.id}>Stol {t2.number}</option>)}
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Taom qidirish..." className="mb-3 w-full rounded-lg border border-line px-3 py-2 text-sm" />
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {filtered.map((m) => (
              <button key={m.id} onClick={() => add(m.id)} className="flex w-full items-center justify-between rounded-lg border border-line px-3 py-2 text-left text-sm hover:border-brand-red">
                <span>{t(m.name, locale)}</span>
                <span className="text-brand-red">{formatMoney(m.price)}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Savat</p>
          <div className="space-y-2">
            {Object.entries(cart).map(([id, qty]) => {
              const mi = menuItems.find((m) => m.id === id)!;
              return (
                <div key={id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  <span className="flex-1">{t(mi.name, locale)}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => sub(id)} className="h-6 w-6 rounded bg-surface-2">−</button>
                    <span>{qty}</span>
                    <button onClick={() => add(id)} className="h-6 w-6 rounded bg-surface-2">+</button>
                  </div>
                </div>
              );
            })}
            {Object.keys(cart).length === 0 && <p className="text-sm text-muted">Bo'sh</p>}
          </div>
          <p className="mt-4 text-right text-lg font-bold text-brand-red">{formatMoney(total)}</p>
          <Button
            className="mt-3 w-full"
            disabled={saving || Object.keys(cart).length === 0}
            onClick={async () => {
              setSaving(true);
              await createOrder({
                type: "DINE_IN", tableId: tableId || undefined,
                items: Object.entries(cart).map(([menuItemId, quantity]) => ({ menuItemId, quantity })),
              });
              setSaving(false); onClose();
            }}
          >
            Buyurtmani yaratish
          </Button>
        </div>
      </div>
    </Modal>
  );
}
