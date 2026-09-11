"use client";
import { useState } from "react";
import { Plus, Trash2, Power } from "lucide-react";
import { Button, Modal, Badge } from "@/components/ui/primitives";
import { saveCoupon, toggleCoupon, deleteCoupon } from "@/lib/coupon/actions";

type Coupon = { id: string; code: string; type: string; value: number; minOrder?: number | null; usedCount: number; usageLimit?: number | null; isActive: boolean };

export default function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const [modal, setModal] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState("PERCENT");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Aksiyalar / kuponlar</h1>
        <Button onClick={() => setModal(true)}><Plus size={16} /> Kupon</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-neutral-50 text-left text-neutral-500">
            <tr><th className="px-4 py-3">Kod</th><th className="px-4 py-3">Turi</th><th className="px-4 py-3">Qiymat</th><th className="px-4 py-3">Min buyurtma</th><th className="px-4 py-3">Ishlatilgan</th><th className="px-4 py-3">Holat</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-neutral-100">
                <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                <td className="px-4 py-3">{c.type}</td>
                <td className="px-4 py-3">{c.type === "PERCENT" ? `${c.value}%` : c.value.toLocaleString()}</td>
                <td className="px-4 py-3">{c.minOrder ? c.minOrder.toLocaleString() : "—"}</td>
                <td className="px-4 py-3">{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ""}</td>
                <td className="px-4 py-3"><Badge color={c.isActive ? "green" : "gray"}>{c.isActive ? "Faol" : "O'chiq"}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => toggleCoupon(c.id, !c.isActive)} className="rounded p-1 hover:bg-neutral-100"><Power size={14} /></button>
                    <button onClick={() => confirm("O'chirilsinmi?") && deleteCoupon(c.id)} className="rounded p-1 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-400">Kupon yo'q</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal open onClose={() => setModal(false)} title="Yangi kupon">
          <div className="space-y-4">
            <label className="block"><span className="mb-1 block text-sm font-medium">Kod</span>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="WELCOME10" className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm uppercase" /></label>
            <label className="block"><span className="mb-1 block text-sm font-medium">Turi</span>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm">
                <option value="PERCENT">Foiz (%)</option><option value="FIXED">Belgilangan summa</option>
              </select></label>
            <label className="block"><span className="mb-1 block text-sm font-medium">Qiymat</span>
              <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" /></label>
            <label className="block"><span className="mb-1 block text-sm font-medium">Min buyurtma (ixtiyoriy)</span>
              <input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" /></label>
            <Button className="w-full" onClick={async () => {
              await saveCoupon({ code, type: type as never, value: Number(value) || 0, minOrder: minOrder ? Number(minOrder) : null });
              setModal(false); setCode(""); setValue(""); setMinOrder("");
            }}>Saqlash</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
