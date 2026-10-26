"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Check, ChevronDown, ChevronRight, CircleCheck, ClipboardCheck, X } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import {
  cancelInventoryCount,
  completeInventoryCount,
  saveInventoryCount,
  startInventoryCount,
} from "@/lib/inventory/actions";
import { countLineDiff } from "@/lib/inventory/calc";
import { cn } from "@/lib/utils";
import { formatRestaurant } from "@/lib/time";
import {
  INVENTORY_LIMITS as L,
  type InventoryCountSummary,
  type InventoryDraftCount,
  type InventoryOverview,
} from "@/lib/inventory/types";
import { Delta, ErrorText, fmtNum, parseIntInput, useInvAction, useMoney } from "./shared";

/**
 * Tugatilgan sanoq natijasi (server javobidan) — sahifada kartochka bo'lib qoladi.
 * firstItems/firstPieces — soni birinchi marta kiritilgan buyumlar: server ularni "ortiqcha"ga
 * qo'shadi, lekin egasi uchun bu ortiqcha emas, boshlang'ich son — alohida ko'rsatiladi.
 */
type CountResult = {
  adjusted: number;
  shortagePieces: number;
  shortageSum: number;
  surplusPieces: number;
  firstItems: number;
  firstPieces: number;
};

/**
 * Sanoq (inventarizatsiya): ochiq bo'lmasa — 3 qadamli tushuntirish va boshlash tugmasi,
 * ochiq bo'lsa — sanash ro'yxati (farq darhol rangli ko'rinadi). Pastda — oldingi sanoqlar.
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
  // Yakunlash xatosi: sahifa yangilanganda sanoq yopilgan bo'lsa ham xabar ko'rinib qolsin
  const [draftError, setDraftError] = useState<string | null>(null);
  const [result, setResult] = useState<CountResult | null>(null);
  const unset = useMemo(() => new Set(data.unsetIds), [data.unsetIds]);

  return (
    <div className="space-y-6">
      {result && <ResultCard result={result} onClose={() => setResult(null)} />}

      {data.draft ? (
        // key: yangi sanoq boshlansa kiritilgan qiymatlar tozalanadi
        <DraftCount
          key={data.draft.id}
          draft={data.draft}
          unset={unset}
          onNotice={onNotice}
          onError={setDraftError}
          onCompleted={setResult}
        />
      ) : (
        <section className="rounded-2xl border border-line bg-card p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-content">{t("cnt.howTitle")}</h2>
          <ol className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            {([1, 2, 3] as const).map((n) => (
              <li key={n} className="flex gap-3 rounded-xl border border-line p-4">
                <span
                  aria-hidden
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-bold text-content"
                >
                  {n}
                </span>
                <span>
                  <span className="block font-semibold text-content">{t(`cnt.step${n}Title`)}</span>
                  <span className="mt-0.5 block text-sm text-muted">{t(`cnt.step${n}Text`)}</span>
                </span>
              </li>
            ))}
          </ol>
          <Button
            className="min-h-11 w-full sm:w-auto"
            disabled={pending || data.items.length === 0}
            onClick={() => {
              setDraftError(null);
              setResult(null);
              run(() => startInventoryCount());
            }}
          >
            <ClipboardCheck size={16} /> {pending ? t("saving") : t("countStart")}
          </Button>
          {data.items.length === 0 && <p className="mt-3 text-sm text-muted">{t("errNoItems")}</p>}
          {(error || draftError) && (
            <div className="mt-3">
              <ErrorText>{error ?? draftError}</ErrorText>
            </div>
          )}
        </section>
      )}

      <PastCounts counts={data.counts} />
    </div>
  );
}

/** Tugatish natijasi: nechta buyum yangilandi, kam/ortiqcha chiqqani */
function ResultCard({ result: r, onClose }: { result: CountResult; onClose: () => void }) {
  const t = useTranslations("Inventory");
  const money = useMoney();
  const surplus = Math.max(0, r.surplusPieces - r.firstPieces);
  const none = r.shortagePieces === 0 && surplus === 0 && r.firstItems === 0;
  return (
    <section role="status" className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-content">
          <CircleCheck size={20} className="shrink-0 text-success" />
          {t("cnt.resultTitle")}
        </h2>
        <button type="button" onClick={onClose} aria-label={t("close")} className="-m-2 p-2 text-muted hover:text-content">
          <X size={16} />
        </button>
      </div>
      <p className="mt-2 text-sm text-content">{t("cnt.resultUpdated", { count: r.adjusted })}</p>
      {none ? (
        <p className="mt-1 text-sm text-content">{t("countNoDiff")}</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {r.shortagePieces > 0 && (
            <li className="font-semibold text-danger">
              {r.shortageSum > 0
                ? t("cnt.resultShort", { pieces: fmtNum(r.shortagePieces), sum: money(r.shortageSum) })
                : t("cnt.resultShortPcs", { pieces: fmtNum(r.shortagePieces) })}
            </li>
          )}
          {surplus > 0 && <li className="text-content">{t("cnt.resultMore", { pieces: fmtNum(surplus) })}</li>}
          {r.firstItems > 0 && (
            <li className="text-content">{t("cnt.resultFirst", { count: r.firstItems, pieces: fmtNum(r.firstPieces) })}</li>
          )}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">{t("cnt.resultWhere")}</p>
    </section>
  );
}

const LINE_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 md:grid-cols-[minmax(0,1fr)_6rem_7.5rem_11rem]";

/** Ochiq sanoq: sanalgan sonlarni kiritish, jonli farq, saqlash / tugatish / bekor qilish */
function DraftCount({
  draft,
  unset,
  onNotice,
  onError,
  onCompleted,
}: {
  draft: InventoryDraftCount;
  unset: Set<string>;
  onNotice: (message: string) => void;
  onError: (message: string | null) => void;
  onCompleted: (r: CountResult) => void;
}) {
  const t = useTranslations("Inventory");
  const money = useMoney();
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
    // Soni hali umuman kiritilmagan buyum: musbat farq — ortiqcha emas, boshlang'ich son
    const first = l.expected === 0 && unset.has(l.itemId);
    return { line: l, raw, parsed, invalid, first, ...d };
  });

  const invalidCount = rows.filter((r) => r.invalid).length;
  const countedCount = rows.filter((r) => !r.invalid && r.parsed !== null).length;
  const matchCount = rows.filter((r) => r.diff === 0).length;
  const dirty = rows.some((r) => !r.invalid && r.parsed !== r.line.counted) || invalidCount > 0;
  const shortage = rows.reduce((s, r) => s + r.shortage, 0);
  const shortageSum = rows.reduce((s, r) => s + r.shortageSum, 0);
  const surplus = rows.reduce((s, r) => s + (r.first ? 0 : r.surplus), 0);
  const firstRows = rows.filter((r) => r.first && r.surplus > 0);
  const firstPieces = firstRows.reduce((s, r) => s + r.surplus, 0);
  const percent = rows.length ? Math.round((countedCount / rows.length) * 100) : 0;

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
      (r) => {
        onCompleted({
          adjusted: r.adjusted,
          shortagePieces: r.shortagePieces,
          shortageSum: r.shortageSum,
          surplusPieces: r.surplusPieces,
          firstItems: firstRows.length,
          firstPieces,
        });
        // Natija — kartochkada (umumiy qisqa xabar takror bo'lmasin)
      }
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
      <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-content">{t("countDraftTitle")}</h2>
            <p className="text-sm text-muted">
              {t("countDraftMeta", { date: formatRestaurant(draft.createdAt), by: draft.createdByName ?? "—" })}
            </p>
          </div>
          <p className="text-sm font-semibold tabular-nums text-content">
            {t("countProgress", { counted: countedCount, total: rows.length })}
          </p>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={rows.length}
          aria-valuenow={countedCount}
          aria-label={t("countProgress", { counted: countedCount, total: rows.length })}
        >
          <div className="h-full rounded-full bg-brand-red transition-all" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1 text-content">
            <Check size={14} className="text-success" /> {t("cnt.sumMatch", { count: matchCount })}
          </span>
          <span className={cn(shortage > 0 ? "font-semibold text-danger" : "text-muted")}>
            {shortageSum > 0
              ? t("cnt.sumShort", { pieces: fmtNum(shortage), sum: money(shortageSum) })
              : t("cnt.sumShortPcs", { pieces: fmtNum(shortage) })}
          </span>
          <span className={cn(surplus > 0 ? "text-content" : "text-muted")}>{t("cnt.sumMore", { pieces: fmtNum(surplus) })}</span>
          {firstRows.length > 0 && (
            <span className="text-content">{t("cnt.sumFirst", { count: firstRows.length })}</span>
          )}
        </div>
        <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-xs text-content">{t("countExpectedHint")}</p>
      </section>

      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <div className={cn(LINE_GRID, "hidden border-b border-line bg-surface-2 py-2 text-xs text-muted md:grid")}>
          <span>{t("colItem")}</span>
          <span className="text-right">{t("colExpected")}</span>
          <span className="text-right">{t("colCounted")}</span>
          <span className="text-right">{t("colDiff")}</span>
        </div>
        {rows.map((r) => {
          const header = r.line.category !== lastCategory;
          lastCategory = r.line.category;
          const first = r.first;
          return (
            <Fragment key={r.line.itemId}>
              {header && (
                <p className="border-b border-line bg-surface-2/60 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                  {t(`category.${r.line.category}`)}
                </p>
              )}
              <div
                className={cn(
                  LINE_GRID,
                  "border-b border-line last:border-0",
                  r.diff !== null && r.diff < 0 && "bg-danger/5",
                  r.diff !== null && r.diff > 0 && !first && "bg-brand-gold/10"
                )}
              >
                <label htmlFor={`inv-count-${r.line.itemId}`} className="col-span-2 font-medium text-content md:col-span-1">
                  {r.line.name}
                </label>
                <p className="text-sm tabular-nums text-muted md:text-right">
                  <span className="mr-1 text-xs md:hidden">{t("colExpected")}:</span>
                  {fmtNum(r.line.expected)}
                </p>
                <div className="row-span-2 justify-self-end md:row-span-1">
                  <input
                    id={`inv-count-${r.line.itemId}`}
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
                      "h-11 w-28 rounded-lg border bg-card px-3 text-right text-base tabular-nums text-content outline-none focus:border-brand-red",
                      r.invalid ? "border-danger" : "border-line"
                    )}
                  />
                </div>
                <div className="text-sm md:text-right">
                  <DiffText diff={r.diff} sum={r.shortageSum} first={first} />
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>

      <ErrorText>{error}</ErrorText>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted">{dirty ? t("countUnsaved") : t("countCompleteHint")}</span>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <Button variant="ghost" className="order-last col-span-2 min-h-11 sm:order-none" onClick={cancel} disabled={pending}>
              {t("countCancel")}
            </Button>
            <Button variant="outline" className="min-h-11 bg-card" onClick={save} disabled={pending || !dirty}>
              {t("save")}
            </Button>
            <Button className="min-h-11" onClick={complete} disabled={pending || countedCount === 0}>
              <ClipboardCheck size={16} className="hidden sm:block" /> {pending ? t("saving") : t("countComplete")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Farq so'z bilan: "to'g'ri" / "3 ta kam" / "2 ta ortiq" / birinchi sanoqda — "boshlang'ich son" */
function DiffText({ diff, sum, first }: { diff: number | null; sum: number; first: boolean }) {
  const t = useTranslations("Inventory");
  const money = useMoney();
  if (diff === null) return <span className="text-xs text-muted">{t("cnt.notCounted")}</span>;
  if (diff === 0)
    return (
      <span className="inline-flex items-center gap-1 text-content">
        <Check size={14} className="text-success" /> {t("cnt.diffOk")}
      </span>
    );
  if (diff < 0)
    return (
      <span className="font-semibold text-danger">
        {t("cnt.diffShort", { n: fmtNum(-diff) })}
        {sum > 0 && <span className="block text-xs font-normal">{money(sum)}</span>}
      </span>
    );
  return (
    <span className="text-content">
      <Delta value={diff} /> <span className="text-xs">{first ? t("cnt.diffFirst") : t("cnt.diffMore")}</span>
    </span>
  );
}

const PAST_GRID =
  "grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-x-3 px-4 md:grid-cols-[1.25rem_minmax(0,1fr)_minmax(0,10rem)_6rem_minmax(0,12rem)_6rem]";

/** Oldingi (tugatilgan) sanoqlar: kam/ortiqcha chiqqani va farqi bor buyumlar */
function PastCounts({ counts }: { counts: InventoryCountSummary[] }) {
  const t = useTranslations("Inventory");
  const money = useMoney();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section>
      <h2 className="mb-3 font-semibold text-content">{t("countPast")}</h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <div className={cn(PAST_GRID, "hidden border-b border-line bg-surface-2 py-2 text-xs text-muted md:grid")}>
          <span />
          <span>{t("colDate")}</span>
          <span>{t("colCountBy")}</span>
          <span className="text-right">{t("colCounted")}</span>
          <span className="text-right">{t("cnt.colShort")}</span>
          <span className="text-right">{t("colSurplus")}</span>
        </div>
        {counts.map((c) => {
          const isOpen = open === c.id;
          // "Hisobda 0" bo'lgan buyumlarda topilgani — odatda birinchi sanoqdagi boshlang'ich son
          const first = c.lines.reduce((s, l) => s + (l.expected === 0 && l.diff > 0 ? l.diff : 0), 0);
          const surplus = Math.max(0, c.surplusPieces - first);
          return (
            <Fragment key={c.id}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : c.id)}
                aria-expanded={isOpen}
                className={cn(PAST_GRID, "min-h-14 w-full border-b border-line py-3 text-left text-sm hover:bg-surface-2")}
              >
                <span className="text-muted">{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
                <span className="min-w-0">
                  <span className="block text-content">{formatRestaurant(c.completedAt ?? c.createdAt)}</span>
                  <span className="block text-xs text-muted md:hidden">
                    {c.createdByName ?? "—"} · {t("countProgress", { counted: c.countedCount, total: c.lineCount })}
                  </span>
                </span>
                <span className="hidden truncate text-muted md:block">{c.createdByName ?? "—"}</span>
                <span className="hidden text-right tabular-nums text-muted md:block">
                  {c.countedCount} / {c.lineCount}
                </span>
                <span className={cn("text-right tabular-nums", c.shortagePieces > 0 ? "font-semibold text-danger" : "text-muted")}>
                  {c.shortagePieces > 0 ? (
                    <>
                      {t("cnt.pieces", { n: fmtNum(c.shortagePieces) })}
                      <span className="block text-xs font-normal">{money(c.shortageSum)}</span>
                    </>
                  ) : (
                    "0"
                  )}
                  {surplus > 0 && (
                    <span className="block text-xs font-normal text-content md:hidden">
                      {t("cnt.sumMore", { pieces: fmtNum(surplus) })}
                    </span>
                  )}
                </span>
                <span className="hidden text-right tabular-nums text-muted md:block">
                  {surplus > 0 ? `+${fmtNum(surplus)}` : "0"}
                  {first > 0 && <span className="block text-xs">{t("cnt.pastFirst", { pieces: fmtNum(first) })}</span>}
                </span>
              </button>
              {isOpen && (
                <div className="border-b border-line bg-surface-2/40 px-4 py-3">
                  {c.lines.length === 0 ? (
                    <p className="text-sm text-muted">{t("countNoDiff")}</p>
                  ) : (
                    <ul className="divide-y divide-line text-sm">
                      {c.lines.map((l) => (
                        <li key={l.itemId} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2">
                          <span className="min-w-0 font-medium text-content">{l.name}</span>
                          <span className="flex flex-wrap items-baseline gap-x-4 tabular-nums">
                            <span className="text-xs text-muted">
                              {t("colExpected")} {fmtNum(l.expected)} → {t("colCounted")} {fmtNum(l.counted)}
                            </span>
                            <Delta value={l.diff} />
                            {l.amount > 0 && <span className="text-danger">{money(l.amount)}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {c.note && <p className="mt-2 text-xs text-muted">{c.note}</p>}
                </div>
              )}
            </Fragment>
          );
        })}
        {counts.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">{t("countPastEmpty")}</p>}
      </div>
    </section>
  );
}
