"use client";
import { Badge } from "@/components/ui/primitives";
import { Ban, Check } from "lucide-react";
import { toggleBlock } from "@/lib/customer/actions";

type Customer = { id: string; name?: string | null; phone?: string | null; role: string; isBlocked: boolean; ordersCount: number; reservationsCount: number; createdAt: string };

export default function CustomersTable({ customers }: { customers: Customer[] }) {
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Mijozlar</h1>
      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-surface-2 text-left text-muted">
            <tr><th className="px-4 py-3">Ism</th><th className="px-4 py-3">Telefon</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Bron</th><th className="px-4 py-3">Buyurtma</th><th className="px-4 py-3">Holat</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-line">
                <td className="px-4 py-3">{c.name || "—"}</td>
                <td className="px-4 py-3">{c.phone || "—"}</td>
                <td className="px-4 py-3"><Badge color={c.role === "CUSTOMER" ? "gray" : "gold"}>{c.role}</Badge></td>
                <td className="px-4 py-3">{c.reservationsCount}</td>
                <td className="px-4 py-3">{c.ordersCount}</td>
                <td className="px-4 py-3"><Badge color={c.isBlocked ? "red" : "green"}>{c.isBlocked ? "Bloklangan" : "Faol"}</Badge></td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleBlock(c.id, !c.isBlocked)} className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${c.isBlocked ? "text-green-600" : "text-red-500"}`}>
                    {c.isBlocked ? <><Check size={12} /> Ochish</> : <><Ban size={12} /> Bloklash</>}
                  </button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Mijoz yo'q</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
