"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, MapIcon, RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { syncTablesFromMap } from "@/lib/floorplan/actions";
import type { FloorSyncStatus } from "@/lib/floorplan/sync-apply";

type Outcome = { ok: boolean; text: string };

/**
 * "Zallar va stollar" tepasidagi karta: bazadagi stollar restoran xaritasi bilan qanchalik
 * bog'langanini ko'rsatadi va (faqat ADMIN/SUPERADMIN uchun) xaritadan stollarni
 * yaratish / yangilash tugmasi. Natijadan keyin sahifa server tomonda yangilanadi
 * (revalidatePath) — holat matni o'zi yangilanadi.
 */
export default function FloorSyncCard({ status, canSync }: { status: FloorSyncStatus; canSync: boolean }) {
  const t = useTranslations("FloorSync");
  const [pending, startTransition] = useTransition();
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  function run() {
    if (pending) return;
    if (!window.confirm(t("confirm", { count: status.mapTables }))) return;
    setOutcome(null);
    startTransition(async () => {
      try {
        const r = await syncTablesFromMap();
        if (!r.ok) {
          setOutcome({ ok: false, text: r.error });
          return;
        }
        const changed = r.created + r.updated + r.deactivated + r.zonesCreated + r.zonesDeactivated > 0;
        setOutcome({
          ok: true,
          text: changed
            ? t("result", { created: r.created, updated: r.updated, deactivated: r.deactivated, zones: r.zonesCreated })
            : t("resultNone"),
        });
      } catch (e) {
        console.error("[floor-sync]", e);
        setOutcome({ ok: false, text: t("errFailed") });
      }
    });
  }

  const attention = status.needsSync;

  return (
    <section
      aria-labelledby="floor-sync-title"
      className={cn(
        "rounded-2xl border p-4 sm:p-5",
        attention ? "border-brand-gold bg-brand-gold/10" : "border-line bg-card"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <h2 id="floor-sync-title" className="flex items-center gap-2 font-semibold text-content">
            <MapIcon size={18} className="shrink-0 text-brand-gold" aria-hidden />
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-content">
            {t("status", { map: status.mapTables, linked: status.linked, extra: status.extraActive })}
          </p>
          {status.missing.length > 0 && (
            <p className="mt-1 break-words text-xs text-muted">
              {t("missing", { count: status.missing.length, codes: status.missing.join(", ") })}
            </p>
          )}
          {attention ? (
            <p className="mt-2 flex items-start gap-1.5 text-sm font-medium text-content">
              <TriangleAlert size={16} className="mt-0.5 shrink-0 text-brand-gold" aria-hidden />
              <span>{t("needsSync")}</span>
            </p>
          ) : (
            <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-gold" aria-hidden />
              <span>{t("inSync")}</span>
            </p>
          )}
          {!canSync && attention && <p className="mt-1 text-xs text-muted">{t("adminOnly")}</p>}
        </div>

        {canSync && (
          <Button
            type="button"
            onClick={run}
            disabled={pending}
            aria-busy={pending}
            variant={attention ? "primary" : "outline"}
            className="w-full shrink-0 sm:w-auto"
          >
            {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <RefreshCw size={16} aria-hidden />}
            {pending ? t("pending") : t("button")}
          </Button>
        )}
      </div>

      {outcome && (
        <p role="status" className={cn("mt-3 text-sm", outcome.ok ? "text-content" : "text-danger")}>
          {outcome.text}
        </p>
      )}
    </section>
  );
}
