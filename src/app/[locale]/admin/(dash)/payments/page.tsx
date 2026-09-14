import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

const COLOR: Record<string, string> = { PAID: "green", PENDING: "gold", FAILED: "red", REFUNDED: "blue", CANCELLED: "gray" };

export default async function AdminPaymentsPage() {
  const rows = await prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">To'lovlar</h1>
      <p className="mb-4 text-sm text-muted">
        Payme / Click / Uzum integratsiyasi skelet holatida. Ishga tushirish uchun merchant kalitlari
        (.env) va sandbox test kerak.
      </p>
      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-surface-2 text-left text-muted">
            <tr><th className="px-4 py-3">Sana</th><th className="px-4 py-3">Provayder</th><th className="px-4 py-3">Summa</th><th className="px-4 py-3">Holat</th><th className="px-4 py-3">Txn ID</th></tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-line">
                <td className="px-4 py-3 text-xs">{p.createdAt.toLocaleString("uz-UZ")}</td>
                <td className="px-4 py-3">{p.provider}</td>
                <td className="px-4 py-3">{formatMoney(Number(p.amount))}</td>
                <td className="px-4 py-3"><Badge color={COLOR[p.status]}>{p.status}</Badge></td>
                <td className="px-4 py-3 font-mono text-xs">{p.providerTxnId || "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Hozircha to'lov yo'q</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
