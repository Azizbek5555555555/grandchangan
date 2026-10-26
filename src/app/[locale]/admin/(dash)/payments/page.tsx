import { getTranslations, setRequestLocale } from "next-intl/server";
import { Info, Receipt } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatMoney, currencyOf, cn } from "@/lib/utils";
import { requireSection } from "@/lib/auth/guard";
import PageHeader from "@/components/admin/ui/PageHeader";
import Pill, { STATUS_TONE } from "@/components/admin/ui/Pill";
import EmptyState from "@/components/admin/ui/EmptyState";
import { ui } from "@/components/admin/ui/styles";
import { fmtDate } from "@/components/admin/ui/format";

export const dynamic = "force-dynamic";

/** Provayder brend nomlari tarjima qilinmaydi; faqat "naqd" */
const PROVIDER: Record<string, string> = { CLICK: "Click", PAYME: "Payme", UZUM: "Uzum", VISA: "Visa", MASTERCARD: "Mastercard" };

export default async function AdminPaymentsPage({ params }: { params: Promise<{ locale: string }> }) {
  await requireSection("payments");
  const { locale } = await params;
  setRequestLocale(locale);
  const cur = currencyOf(locale);
  const [ta, tp, ts] = await Promise.all([
    getTranslations("Admin"),
    getTranslations("AdminUi.payments"),
    getTranslations("AdminUi.paymentStatus"),
  ]);
  const rows = await prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const paidTotal = rows.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className={ui.page}>
      <PageHeader section="payments" title={ta("payments")} description={tp("subtitle")} />

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-brand-gold/40 bg-brand-gold/10 p-4 text-sm text-content">
        <Info size={18} aria-hidden className="mt-0.5 shrink-0 text-brand-gold" />
        <p className="leading-relaxed">{tp("integrationNote")}</p>
      </div>

      {rows.length === 0 ? (
        <div className={ui.card}><EmptyState icon={Receipt} title={tp("empty")} /></div>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">
            {tp("paidTotal")}: <span className="font-semibold text-content tabular-nums">{formatMoney(paidTotal, cur)}</span>
          </p>
          <div className={ui.tableWrap}>
            <table className={cn(ui.table, "min-w-[40rem]")}>
              <thead className={ui.thead}>
                <tr>
                  <th className={ui.th}>{tp("colDate")}</th>
                  <th className={ui.th}>{tp("colProvider")}</th>
                  <th className={cn(ui.th, "text-right")}>{tp("colAmount")}</th>
                  <th className={ui.th}>{tp("colStatus")}</th>
                  <th className={ui.th}>{tp("colTxn")}</th>
                </tr>
              </thead>
              <tbody className={ui.tbody}>
                {rows.map((p) => (
                  <tr key={p.id} className={ui.tr}>
                    <td className={cn(ui.td, "whitespace-nowrap text-muted")}>{fmtDate(p.createdAt, locale, { year: true })}</td>
                    <td className={cn(ui.td, "font-medium")}>{PROVIDER[p.provider] ?? tp("cash")}</td>
                    <td className={cn(ui.td, "text-right tabular-nums")}>{formatMoney(Number(p.amount), cur)}</td>
                    <td className={ui.td}><Pill tone={STATUS_TONE[p.status]}>{ts(p.status)}</Pill></td>
                    <td className={cn(ui.td, "font-mono text-xs text-muted")}>{p.providerTxnId || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
