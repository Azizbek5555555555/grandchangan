"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CircleCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InventoryOverview } from "@/lib/inventory/types";
import StockTab from "./StockTab";
import TablesTab from "./TablesTab";
import HistoryTab from "./HistoryTab";
import CountTab from "./CountTab";

type Tab = "stock" | "tables" | "history" | "count";
const TABS: Tab[] = ["stock", "tables", "history", "count"];

/**
 * Inventar (boshqaruv: MANAGER/ADMIN/SUPERADMIN): Qoldiq · Stollar · Tarix · Inventarizatsiya.
 * Bo'limlar yashiriladi, lekin o'chirilmaydi — inventarizatsiyada kiritilgan saqlanmagan sonlar
 * boshqa bo'limga o'tib qaytganda yo'qolmasligi uchun.
 */
export default function InventoryManager({ data }: { data: InventoryOverview }) {
  const t = useTranslations("Inventory");
  const [tab, setTab] = useState<Tab>("stock");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 7000);
    return () => window.clearTimeout(id);
  }, [notice]);

  const badge: Partial<Record<Tab, string>> = {
    stock: data.lowCount > 0 ? String(data.lowCount) : undefined,
    count: data.draft ? t("tabDraftBadge") : undefined,
  };

  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-bold">{t("title")}</h1>
      <p className="mb-6 max-w-3xl text-sm text-muted">{t("subtitle")}</p>

      <div role="tablist" aria-label={t("title")} className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            id={`inv-tab-${k}`}
            aria-selected={tab === k}
            aria-controls={`inv-panel-${k}`}
            onClick={() => setTab(k)}
            className={cn(
              "-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition",
              tab === k ? "border-danger text-danger" : "border-transparent text-muted hover:text-content"
            )}
          >
            {t(`tabs.${k}`)}
            {badge[k] && (
              <span className="rounded-full bg-brand-red px-1.5 py-0.5 text-[10px] leading-none text-brand-cream">
                {badge[k]}
              </span>
            )}
          </button>
        ))}
      </div>

      {notice && (
        <div
          role="status"
          className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-line bg-card px-4 py-3 text-sm text-content"
        >
          <span className="flex items-start gap-2">
            <CircleCheck size={16} className="mt-0.5 shrink-0 text-brand-gold" />
            {notice}
          </span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-muted hover:text-content"
            aria-label={t("close")}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div role="tabpanel" id="inv-panel-stock" aria-labelledby="inv-tab-stock" hidden={tab !== "stock"}>
        <StockTab data={data} onNotice={setNotice} />
      </div>
      <div role="tabpanel" id="inv-panel-tables" aria-labelledby="inv-tab-tables" hidden={tab !== "tables"}>
        <TablesTab data={data} />
      </div>
      <div role="tabpanel" id="inv-panel-history" aria-labelledby="inv-tab-history" hidden={tab !== "history"}>
        <HistoryTab movements={data.movements} />
      </div>
      <div role="tabpanel" id="inv-panel-count" aria-labelledby="inv-tab-count" hidden={tab !== "count"}>
        <CountTab data={data} onNotice={setNotice} />
      </div>
    </div>
  );
}
