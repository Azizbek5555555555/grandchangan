"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Boxes,
  CircleCheck,
  ClipboardCheck,
  Gauge,
  History,
  Map as MapIcon,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { InventoryOverview } from "@/lib/inventory/types";
import OverviewTab from "./OverviewTab";
import StockTab from "./StockTab";
import TablesTab from "./TablesTab";
import HistoryTab from "./HistoryTab";
import CountTab from "./CountTab";
import MapTab from "./MapTab";
import { TabIntro, viewStatus } from "./shared";

export type InvTab = "overview" | "stock" | "tables" | "count" | "history" | "map";

/** Bo'limlar tartibi: avval oddiy "Holat", eng kam ishlatiladigani (xarita) — oxirida */
const TABS: { key: InvTab; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { key: "overview", icon: Gauge },
  { key: "stock", icon: Boxes },
  { key: "tables", icon: UtensilsCrossed },
  { key: "count", icon: ClipboardCheck },
  { key: "history", icon: History },
  { key: "map", icon: MapIcon },
];
const TAB_KEYS = TABS.map((x) => x.key);

/**
 * Inventar (boshqaruv: MANAGER/ADMIN/SUPERADMIN): Holat · Ombor · Stollar · Sanoq · Tarix · Xarita.
 * Bo'limlar yashiriladi, lekin o'chirilmaydi — sanoqda kiritilgan saqlanmagan sonlar
 * boshqa bo'limga o'tib qaytganda yo'qolmasligi uchun.
 */
export default function InventoryManager({ data, initialTab }: { data: InventoryOverview; initialTab?: string }) {
  const t = useTranslations("Inventory");
  const [tab, setTab] = useState<InvTab>(TAB_KEYS.includes(initialTab as InvTab) ? (initialTab as InvTab) : "overview");
  const [notice, setNotice] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 7000);
    return () => window.clearTimeout(id);
  }, [notice]);

  // "Holat" yorlig'idagi son: yetishmaydigan yoki kam qolgan (soni kiritilganlar orasida)
  const problems = useMemo(() => {
    const unset = new Set(data.unsetIds);
    return data.items.filter((i) => {
      const s = viewStatus(i, unset);
      return s === "SHORT" || s === "LOW";
    }).length;
  }, [data.items, data.unsetIds]);

  const badge: Partial<Record<InvTab, string>> = {
    overview: problems > 0 ? String(problems) : undefined,
    count: data.draft ? t("tabDraftBadge") : undefined,
  };

  /** Boshqa bo'limga o'tish (yo'riqnoma tugmalari): sahifa tepasiga qaytadi */
  function goTo(next: InvTab) {
    setTab(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div ref={topRef} className="scroll-mt-4 p-4 sm:p-6 lg:p-8">
      <header className="mb-5">
        <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-fire-ink">
          <span lang="zh" aria-hidden="true" className="font-cn text-base normal-case tracking-normal">库存</span>
          {t("eyebrow")}
        </p>
        <h1 className="font-display text-3xl text-content sm:text-4xl">{t("title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">{t("subtitle")}</p>
      </header>

      {/* Telefonda 3×2 tugmalar, kattaroq ekranda — odatdagi yorliqlar qatori */}
      <div
        role="tablist"
        aria-label={t("title")}
        className="mb-5 grid grid-cols-3 gap-1.5 sm:flex sm:gap-1 sm:overflow-x-auto sm:border-b sm:border-line"
      >
        {TABS.map(({ key: k, icon: Icon }) => (
          <button
            key={k}
            type="button"
            role="tab"
            id={`inv-tab-${k}`}
            aria-selected={tab === k}
            aria-controls={`inv-panel-${k}`}
            onClick={() => setTab(k)}
            className={cn(
              "flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-2 py-2 text-sm font-medium transition",
              "sm:-mb-px sm:rounded-none sm:border-0 sm:border-b-2 sm:px-4",
              tab === k
                ? "border-danger bg-card text-danger sm:bg-transparent"
                : "border-line bg-card text-muted hover:text-content sm:border-transparent sm:bg-transparent"
            )}
          >
            <Icon size={15} className="hidden shrink-0 sm:block" />
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
            className="-m-2 p-2 text-muted hover:text-content"
            aria-label={t("close")}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {TABS.map(({ key: k, icon }) => (
        <div key={k} role="tabpanel" id={`inv-panel-${k}`} aria-labelledby={`inv-tab-${k}`} hidden={tab !== k}>
          <TabIntro icon={icon}>{t(`intro.${k}`)}</TabIntro>
          {k === "overview" && <OverviewTab data={data} onNotice={setNotice} goTo={goTo} />}
          {k === "stock" && <StockTab data={data} onNotice={setNotice} />}
          {k === "tables" && <TablesTab data={data} goTo={goTo} />}
          {k === "count" && <CountTab data={data} onNotice={setNotice} />}
          {k === "history" && <HistoryTab movements={data.movements} />}
          {k === "map" && <MapTab data={data} />}
        </div>
      ))}
    </div>
  );
}
