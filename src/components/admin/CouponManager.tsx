"use client";
import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Trash2, Power, TicketPercent } from "lucide-react";
import { saveCoupon, toggleCoupon, deleteCoupon } from "@/lib/coupon/actions";
import { formatMoney, currencyOf, cn } from "@/lib/utils";
import PageHeader from "@/components/admin/ui/PageHeader";
import Dialog from "@/components/admin/ui/Dialog";
import { Field } from "@/components/admin/ui/Field";
import Pill from "@/components/admin/ui/Pill";
import EmptyState from "@/components/admin/ui/EmptyState";
import { ui } from "@/components/admin/ui/styles";

type Coupon = { id: string; code: string; type: string; value: number; minOrder?: number | null; usedCount: number; usageLimit?: number | null; isActive: boolean };

export default function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const ta = useTranslations("Admin");
  const tp = useTranslations("AdminUi.promotions");
  const tc = useTranslations("AdminUi.common");
  const locale = useLocale();
  const cur = currencyOf(locale);
  const [modal, setModal] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState("PERCENT");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [saving, setSaving] = useState(false);
  const [pending, startTransition] = useTransition();

  const fmtValue = (c: Coupon) => (c.type === "PERCENT" ? `${c.value}%` : c.type === "FIXED" ? formatMoney(c.value, cur) : tp("types.FREE_ITEM"));

  async function save() {
    setSaving(true);
    try {
      await saveCoupon({ code, type: type as never, value: Number(value) || 0, minOrder: minOrder ? Number(minOrder) : null });
      setModal(false); setCode(""); setValue(""); setMinOrder("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={ui.page}>
      <PageHeader
        section="promotions"
        title={ta("promotions")}
        description={tp("subtitle")}
        actions={<button type="button" onClick={() => setModal(true)} className={ui.btnPrimary}><Plus size={16} aria-hidden /> {tp("new")}</button>}
      />
      {coupons.length === 0 ? (
        <div className={ui.card}><EmptyState icon={TicketPercent} title={tp("empty")} /></div>
      ) : (
        <div className={ui.tableWrap}>
          <table className={cn(ui.table, "min-w-[44rem]")}>
            <thead className={ui.thead}>
              <tr>
                <th className={ui.th}>{tp("colCode")}</th>
                <th className={ui.th}>{tp("colType")}</th>
                <th className={ui.th}>{tp("colValue")}</th>
                <th className={ui.th}>{tp("colMinOrder")}</th>
                <th className={ui.th}>{tp("colUsed")}</th>
                <th className={ui.th}>{tc("status")}</th>
                <th className={cn(ui.th, "text-right")}>{tc("actions")}</th>
              </tr>
            </thead>
            <tbody className={ui.tbody}>
              {coupons.map((c) => (
                <tr key={c.id} className={ui.tr}>
                  <td className={ui.td}><span className="rounded-lg border border-dashed border-brand-gold/60 bg-brand-gold/10 px-2 py-1 font-mono text-sm font-semibold tracking-wider">{c.code}</span></td>
                  <td className={cn(ui.td, "text-muted")}>{tp(`types.${c.type}`)}</td>
                  <td className={cn(ui.td, "font-medium tabular-nums")}>{fmtValue(c)}</td>
                  <td className={cn(ui.td, "tabular-nums")}>{c.minOrder ? formatMoney(c.minOrder, cur) : "—"}</td>
                  <td className={cn(ui.td, "tabular-nums")}>{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                  <td className={ui.td}><Pill tone={c.isActive ? "success" : "neutral"}>{c.isActive ? tc("active") : tc("inactive")}</Pill></td>
                  <td className={ui.td}>
                    <div className="flex justify-end gap-0.5">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => startTransition(async () => { await toggleCoupon(c.id, !c.isActive); })}
                        title={c.isActive ? tp("deactivate") : tp("activate")}
                        aria-label={c.isActive ? tp("deactivate") : tp("activate")}
                        className={ui.iconBtn}
                      >
                        <Power size={15} aria-hidden />
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => confirm(tc("deleteConfirm")) && startTransition(async () => { await deleteCoupon(c.id); })}
                        title={tc("delete")}
                        aria-label={tc("delete")}
                        className={ui.iconBtnDanger}
                      >
                        <Trash2 size={15} aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Dialog
          onClose={() => setModal(false)}
          title={tp("newTitle")}
          footer={
            <>
              <button type="button" onClick={() => setModal(false)} className={ui.btnSecondary}>{tc("cancel")}</button>
              <button type="button" disabled={saving || !code.trim()} onClick={save} className={ui.btnPrimary}>{saving ? tc("saving") : tc("save")}</button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label={tp("colCode")}>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="WELCOME10" className={cn(ui.input, "font-mono uppercase")} />
            </Field>
            <Field label={tp("colType")}>
              <select value={type} onChange={(e) => setType(e.target.value)} className={ui.input}>
                <option value="PERCENT">{tp("types.PERCENT")} (%)</option>
                <option value="FIXED">{tp("types.FIXED")}</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={tp("colValue")}>
                <input type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} className={ui.input} />
              </Field>
              <Field label={tp("minOrderOptional")}>
                <input type="number" min={0} value={minOrder} onChange={(e) => setMinOrder(e.target.value)} className={ui.input} />
              </Field>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
