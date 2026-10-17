"use client";

import { Fragment, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ChevronDown, ChevronRight, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import {
  cancelInventoryCount,
  completeInventoryCount,
  saveInventoryCount,
  startInventoryCount,
} from "@/lib/inventory/actions";
import { countLineDiff } from "@/lib/inventory/calc";
import { cn, formatMoney } from "@/lib/utils";
import { formatRestaurant } from "@/lib/time";
import {
  INVENTORY_LIMITS as L,
  type InventoryCountSummary,
  type InventoryDraftCount,
  type InventoryOverview,
} from "@/lib/inventory/types";
import { Delta, ErrorText, fmtNum, parseIntInput, useInvAction } from "./shared";

/**
 * Inventarizatsiya (sanash): ochiq bo'lsa — sanash jadvali, aks holda boshlash tugmasi
 * va oldingi inventarizatsiyalar ro'yxati.
 */
export default function CountTab({
  data,
  onNotice,
}: {
  data: InventoryOverview;
  onNotice: (message: string) => void;
}) {
  const t = useTranslations("Inventory");
  const { pending, error, run } = useInvAction();
  // Yakunlash xatosi: sahifa yangilanganda inventarizatsiya yopilgan bo'lsa ham xabar ko'rinib qolsin
  const [draftError, setDraftError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {data.draft ? (
        // key: yangi inventarizatsiya boshlansa kiritilgan qiymatlar tozalanadi
        <DraftCount key={data.draft.id} draft={data.draft} onNotice={onNotice} onError={setDraftError} />
      ) : (
        <div className="rounded-2xl border border-line bg-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="mb-1 font-semibold text-content">{t("countIntroTitle")}</h2>
              <p className="text-sm text-muted">{t("countIntro")}</p>
            </div>
            <Button
              className="shrink-0"
              disabled={pending || data.items.length === 0}
              onClick={() => {
                setDraftError(null);
                run(() => startInventoryCount());
              }}
            >
              <ClipboardCheck size={16} /> {pending ? t("saving") : t("countStart")}
            </Button>
          </div>
          {data.items.length === 0 && <p className="mt-3 text-sm text-muted">{t("errNoItems")}</p>}
          {(error || draftError) && (
            <div className="mt-3">
              <ErrorText>{error ?? draftError}</ErrorText>
            </div>
          )}
        </div>
      )}

      <PastCounts counts={data.counts} />
    </div>
  );
}

/** Ochiq inventarizatsiya: sanalgan sonlarni kiritish, jonli farq, saqlash / yakunlash / bekor qilish */
function DraftCount({
  draft,
  onNotice,
  onError,
}: {
  draft: InventoryDraftCount;
  onNotice: (message: string) => void;
  onError: (message: string | null) => void;
}) {
  const t = useTranslations("Inventory");
  const { pending, error, setError, run } = useInvAction();
  const router = useRouter();
  // Faqat foydalanuvchi o'zgartirgan qiymatlar; qolganlari serverdagi "counted"dan olinadi
  const [edits, setEdits] = useState<Record<string, string>>({});

  const valueOf = (itemId: string, counted: number | null) => edits[itemId] ?? (counted === null ? "" : String(counted));

  // Har bir qator: kiritilgan qiymat, tekshiruv va jonli farq (ro'yxat kichik — har renderda hisoblanadi)
  const rows = draft.lines.map((l) => {
    const raw = valueOf(l.itemId, l.counted);
    const trimmed = raw.trim();
    const parsed = trimmed === "" ? null : parseIntInput(trimmed, 0, L.maxQty);
    const invalid = trimmed !== "" && parsed === null;
    const d = countLineDiff(l.expected, invalid ? null : parsed, l.unitPrice);
    return { line: l, raw, parsed, invalid, ...d };
  });

  const invalidCount = rows.filter((r) => r.invalid).length;
  const countedCount = rows.filter((r) => !r.invalid && r.parsed !== null).length;
  const dirty = rows.some((r) => !r.invalid && r.parsed !== r.line.counted) || invalidCount > 0;
  const shortage = rows.reduce((s, r) => s + r.shortage, 0);
  const shortageSum = rows.reduce((s, r) => s + r.shortageSum, 0);
  const surplus = rows.reduce((s, r) => s + r.surplus, 0);

  // Saqlanmagan o'zgarish bilan sahifadan chiqishda ogohlantirish
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  /**
   * Yuboriladigan qatorlar — faqat shu sahifada o'zgartirilganlari (boshqa qurilma yoki tabdan
   * saqlangan sonlar eski nusxa bilan ustidan yozilmasligi uchun); noto'g'ri qiymat bo'lsa null
   */
  function payload() {
    if (invalidCount > 0) {
      setError(t("errCounted"));
      return null;
    }
    return rows
      .filter((r) => r.parsed !== r.line.counted)
      .map((r) => ({ itemId: r.line.itemId, counted: r.parsed }));
  }

  function save() {
    const lines = payload();
    if (!lines) return;
    onError(null);
    run(
      () => saveInventoryCount(draft.id, lines),
      () => onNotice(t("countSaved"))
    );
  }

  function complete() {
    const lines = payload();
    if (!lines) return;
    if (countedCount === 0) return setError(t("errCountEmpty"));
    if (!window.confirm(t("countCompleteConfirm", { counted: countedCount, total: rows.length }))) return;
    // Foydalanuvchi ko'rgan holat: server hisob o'zgarganini aniqlasa, yakunlash rad etiladi
    const seen = rows.map((r) => ({ itemId: r.line.itemId, expected: r.line.expected, counted: r.parsed }));
    run(
      async () => {
        onError(null);
        const r = await completeInventoryCount(draft.id, lines, seen);
        // Xatoda (masalan, hisob o'zgargan) — yangi "kutilgan" sonlarni olish; kiritilganlar saqlanib qoladi
        if (!r.ok) {
          onError(r.error);
          router.refresh();
        }
        return r;
      },
      (r) =>
        onNotice(
          t("countCompleted", {
            adjusted: r.adjusted,
            pieces: fmtNum(r.shortagePieces),
            sum: formatMoney(r.shortageSum),
            surplus: fmtNum(r.surplusPieces),
          })
        )
    );
  }

  function cancel() {
    if (!window.confirm(t("countCancelConfirm"))) return;
    onError(null);
    run(
      () => cancelInventoryCount(draft.id),
      () => onNotice(t("countCancelled"))
    );
  }

  let lastCategory: string | null = null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-content">{t("countDraftTitle")}</h2>
            <p className="text-sm text-muted">
              {t("countDraftMeta", { date: formatRestaurant(draft.createdAt), by: draft.createdByName ?? "—" })}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="text-content">{t("countProgress", { counted: countedCount, total: rows.length })}</p>
            {shortage > 0 && (
              <p className="font-semibold text-danger">
                {t("countShortageTotal", { pieces: fmtNum(shortage), sum: formatMoney(shortageSum) })}
              </p>
            )}
            {surplus > 0 && <p className="text-muted">{t("countSurplusTotal", { pieces: fmtNum(surplus) })}</p>}
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">{t("countExpectedHint")}</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface-2 text-left text-muted">
            <tr>
              <th className="px-4 py-3">{t("colItem")}</th>
              <th className="px-4 py-3 text-right">{t("colExpected")}</th>
              <th className="px-4 py-3">{t("colCounted")}</th>
              <th className="px-4 py-3 text-right">{t("colDiff")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const header = r.line.category !== lastCategory;
              lastCategory = r.line.category;
              return (
                <Fragment key={r.line.itemId}>
                  {header && (
                    <tr className="border-b border-line bg-surface-2/60">
                      <td colSpan={4} className="px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                        {t(`category.${r.line.category}`)}
                      </td>
                    </tr>
                  )}
                  <tr className="border-b border-line last:border-0">
                    <td className="px-4 py-2 font-medium text-content">{r.line.name}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted">{fmtNum(r.line.expected)}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={L.maxQty}
                        step={1}
                        value={r.raw}
                        placeholder="—"
                        aria-label={t("countInputLabel", { name: r.line.name })}
                        aria-invalid={r.invalid || undefined}
                        onChange={(e) => {
                          const v = e.target.value;
                          setEdits((prev) => ({ ...prev, [r.line.itemId]: v }));
                        }}
                        className={cn(
                          "w-24 rounded-lg border bg-card px-2 py-1 text-right text-sm tabular-nums text-content outline-none focus:border-brand-red",
                          r.invalid ? "border-danger" : "border-line"
                        )}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right">
                      {r.diff === null ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <>
                          <Delta value={r.diff} />
                          {r.shortageSum > 0 && (
                            <span className="ml-1 text-xs text-danger">({formatMoney(r.shortageSum)})</span>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <ErrorText>{error}</ErrorText>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Bo'sh qator = "o'zgarmaydi" (yakunlashda tegilmaydi), shuning uchun "kutilgan bilan to'ldirish" yo'q */}
        <div className="flex flex-wrap items-center gap-2">
          {dirty && <span className="text-xs text-muted">{t("countUnsaved")}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={cancel} disabled={pending}>
            {t("countCancel")}
          </Button>
          <Button variant="outline" onClick={save} disabled={pending || !dirty}>
            {t("save")}
          </Button>
          <Button onClick={complete} disabled={pending || countedCount === 0}>
            <ClipboardCheck size={16} /> {pending ? t("saving") : t("countComplete")}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted">{t("countCompleteHint")}</p>
    </div>
  );
}

/** Oldingi (yakunlangan) inventarizatsiyalar: kamomad va farqi bor qatorlar */
function PastCounts({ counts }: { counts: InventoryCountSummary[] }) {
  const t = useTranslations("Inventory");
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section>
      <h2 className="mb-3 font-semibold text-content">{t("countPast")}</h2>
      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface-2 text-left text-muted">
            <tr>
              <th className="w-8 px-2 py-3" />
              <th className="px-4 py-3">{t("colDate")}</th>
              <th className="px-4 py-3">{t("colCountBy")}</th>
              <th className="px-4 py-3 text-right">{t("colCounted")}</th>
              <th className="px-4 py-3 text-right">{t("colShortPieces")}</th>
              <th className="px-4 py-3 text-right">{t("colShortSum")}</th>
              <th className="px-4 py-3 text-right">{t("colSurplus")}</th>
            </tr>
          </thead>
          <tbody>
            {counts.map((c) => {
              const isOpen = open === c.id;
              return (
                <Fragment key={c.id}>
                  <tr
                    className="cursor-pointer border-b border-line hover:bg-surface-2"
                    onClick={() => setOpen(isOpen ? null : c.id)}
                    aria-expanded={isOpen}
                  >
                    <td className="px-2 py-3 text-muted">{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-content">
                      {formatRestaurant(c.completedAt ?? c.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{c.createdByName ?? "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">
                      {c.countedCount} / {c.lineCount}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right tabular-nums",
                        c.shortagePieces > 0 ? "font-semibold text-danger" : "text-muted"
                      )}
                    >
                      {fmtNum(c.shortagePieces)}
                    </td>
                    <td
                      className={cn(
                        "whitespace-nowrap px-4 py-3 text-right tabular-nums",
                        c.shortageSum > 0 ? "text-danger" : "text-muted"
                      )}
                    >
                      {formatMoney(c.shortageSum)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">
                      {c.surplusPieces > 0 ? `+${fmtNum(c.surplusPieces)}` : "0"}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-line bg-surface-2/40">
                      <td colSpan={7} className="px-4 py-3">
                        {c.lines.length === 0 ? (
                          <p className="text-sm text-muted">{t("countNoDiff")}</p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead className="text-left text-xs text-muted">
                              <tr>
                                <th className="py-1 pr-4">{t("colItem")}</th>
                                <th className="py-1 pr-4 text-right">{t("colExpected")}</th>
                                <th className="py-1 pr-4 text-right">{t("colCounted")}</th>
                                <th className="py-1 pr-4 text-right">{t("colDiff")}</th>
                                <th className="py-1 text-right">{t("colAmount")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {c.lines.map((l) => (
                                <tr key={l.itemId} className="border-t border-line">
                                  <td className="py-1.5 pr-4 text-content">{l.name}</td>
                                  <td className="py-1.5 pr-4 text-right tabular-nums text-muted">{fmtNum(l.expected)}</td>
                                  <td className="py-1.5 pr-4 text-right tabular-nums text-content">{fmtNum(l.counted)}</td>
                                  <td className="py-1.5 pr-4 text-right">
                                    <Delta value={l.diff} />
                                  </td>
                                  <td className="whitespace-nowrap py-1.5 text-right tabular-nums">
                                    {l.amount > 0 ? (
                                      <span className="text-danger">{formatMoney(l.amount)}</span>
                                    ) : (
                                      <span className="text-muted">—</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        {c.note && <p className="mt-2 text-xs text-muted">{c.note}</p>}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {counts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  {t("countPastEmpty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
