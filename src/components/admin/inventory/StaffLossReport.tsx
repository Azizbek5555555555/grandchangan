"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CircleCheck, X } from "lucide-react";
import type { InventoryItemOption, InventoryMovementRow } from "@/lib/inventory/types";
import { LossFormBody } from "./LossForm";
import { MovementsTable } from "./HistoryTab";
import { fmtNum } from "./shared";

/**
 * Ofitsiant va oshxona ko'rinishi: faqat "sindi / yo'qoldi" xabari va o'zining oxirgi 10 ta xabari.
 * Mas'ul sifatida server tomonda avtomatik o'zi yoziladi.
 */
export default function StaffLossReport({
  items,
  reports,
}: {
  items: InventoryItemOption[];
  reports: InventoryMovementRow[];
}) {
  const t = useTranslations("Inventory");
  const [formKey, setFormKey] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!success) return;
    const id = window.setTimeout(() => setSuccess(null), 6000);
    return () => window.clearTimeout(id);
  }, [success]);

  return (
    // Telefonda ixchamroq chekka (ofitsiantlar asosan telefondan xabar beradi)
    <div className="p-4 sm:p-6">
      <h1 className="mb-2 text-2xl font-bold">{t("staffTitle")}</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted">{t("staffIntro")}</p>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <section className="rounded-2xl border border-line bg-card p-4 sm:p-5 xl:col-span-2">
          {success && (
            <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-content">
              <span className="flex items-start gap-2">
                <CircleCheck size={16} className="mt-0.5 shrink-0 text-brand-gold" />
                {success}
              </span>
              <button
                type="button"
                onClick={() => setSuccess(null)}
                className="text-muted hover:text-content"
                aria-label={t("close")}
              >
                <X size={14} />
              </button>
            </div>
          )}
          {items.length === 0 ? (
            <p className="text-sm text-muted">{t("staffNoItems")}</p>
          ) : (
            <>
              {/* key: muvaffaqiyatli yuborilgandan keyin forma tozalanadi */}
              <LossFormBody
                key={formKey}
                items={items}
                onDone={(r) => {
                  setSuccess(t("staffDone", { name: r.name, qty: fmtNum(r.qty) }));
                  setFormKey((k) => k + 1);
                }}
              />
              <p className="mt-4 text-xs text-muted">{t("staffStockHint")}</p>
            </>
          )}
        </section>

        <section className="xl:col-span-3">
          <h2 className="mb-3 font-semibold text-content">{t("myReports")}</h2>
          {reports.length === 0 ? (
            <div className="rounded-xl border border-line bg-card px-4 py-8 text-center text-sm text-muted">
              {t("myReportsEmpty")}
            </div>
          ) : (
            <MovementsTable movements={reports} compact />
          )}
        </section>
      </div>
    </div>
  );
}
