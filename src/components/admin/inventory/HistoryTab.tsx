"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/primitives";
import { formatRestaurant } from "@/lib/time";
import { MOVEMENT_TYPES, type InventoryMovementRow, type InventoryMovementType } from "@/lib/inventory/types";
import { Chip, Delta, fmtNum, useMovementNote, useMoney } from "./shared";

const TYPE_COLOR: Record<InventoryMovementType, string> = {
  PURCHASE: "green",
  LOSS: "red",
  COUNT_ADJUST: "blue",
  CORRECTION: "gray",
};

/** Tarix: oxirgi 100 ta harakat (kirim, yo'qotish, sanoq farqi, qo'lda tuzatish) */
export default function HistoryTab({ movements }: { movements: InventoryMovementRow[] }) {
  const t = useTranslations("Inventory");
  const money = useMoney();
  const [type, setType] = useState<"all" | InventoryMovementType>("all");
  const shown = type === "all" ? movements : movements.filter((m) => m.type === type);
  const lossTotal = shown.reduce((s, m) => s + m.lossAmount, 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Chip active={type === "all"} onClick={() => setType("all")}>
          {t("filterAll")}
        </Chip>
        {MOVEMENT_TYPES.map((k) => (
          <Chip key={k} active={type === k} onClick={() => setType(k)}>
            {t(`movementType.${k}`)}
          </Chip>
        ))}
      </div>
      <MovementsTable movements={shown} />
      {lossTotal > 0 && (
        <p className="mt-3 text-right text-sm text-muted">
          {t("historyLossTotal")} <span className="font-semibold text-danger">{money(lossTotal)}</span>
        </p>
      )}
    </div>
  );
}

/**
 * Harakatlar jadvali — xodim ko'rinishidagi "mening xabarlarim" ham shuni ishlatadi.
 * Telefonda — kartalar ro'yxati, kattaroq ekranda — jadval.
 */
export function MovementsTable({ movements, compact }: { movements: InventoryMovementRow[]; compact?: boolean }) {
  return (
    <>
      <MovementCards movements={movements} compact={compact} />
      <div className="hidden md:block">
        <MovementsGrid movements={movements} compact={compact} />
      </div>
    </>
  );
}

/**
 * Sabab matni: yo'qotish sababi, sanoq natijasi (kam/ortiqcha) yoki "—".
 * Sanoqda 0 dan oshgan son (oldin 0 edi) — odatda birinchi sanoq, "boshlang'ich son" deb ko'rsatiladi.
 */
function useReasonText() {
  const t = useTranslations("Inventory");
  return (m: InventoryMovementRow): string => {
    if (m.reason) return t(`reason.${m.reason}`);
    if (m.type !== "COUNT_ADJUST") return "—";
    if (m.delta > 0 && m.quantityAfter === m.delta) return t("cnt.diffFirst");
    return t(m.delta < 0 ? "countShortage" : "countSurplus");
  };
}

function MovementCards({ movements, compact }: { movements: InventoryMovementRow[]; compact?: boolean }) {
  const t = useTranslations("Inventory");
  const money = useMoney();
  const noteOf = useMovementNote();
  const reasonOf = useReasonText();
  if (movements.length === 0)
    return (
      <p className="rounded-xl border border-line bg-card px-4 py-8 text-center text-sm text-muted md:hidden">
        {t("historyEmpty")}
      </p>
    );
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-card md:hidden">
      {movements.map((m) => {
        const note = noteOf(m);
        const reason = reasonOf(m);
        return (
          <li key={m.id} className="px-4 py-3 text-sm">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
              {!compact && <Badge color={TYPE_COLOR[m.type]}>{t(`movementType.${m.type}`)}</Badge>}
              {formatRestaurant(m.createdAt)}
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 font-medium text-content">{m.itemName}</span>
              <Delta value={m.delta} className="shrink-0" />
            </div>
            {reason !== "—" && <p className="text-content">{reason}</p>}
            {note && <p className="break-words text-xs text-muted">{note}</p>}
            {!compact && (
              <p className="mt-1 text-xs text-muted">
                {t("colAfter")}: {fmtNum(m.quantityAfter)}
                {m.createdByName && ` · ${t("colBy")}: ${m.createdByName}`}
                {m.responsibleName && ` · ${t("colResponsible")}: ${m.responsibleName}`}
                {m.lossAmount > 0 && (
                  <>
                    {" · "}
                    <span className="text-danger">{money(m.lossAmount)}</span>
                  </>
                )}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function MovementsGrid({ movements, compact }: { movements: InventoryMovementRow[]; compact?: boolean }) {
  const t = useTranslations("Inventory");
  const money = useMoney();
  const noteOf = useMovementNote();
  const reasonOf = useReasonText();

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-line bg-surface-2 text-left text-muted">
          <tr>
            <th className="px-4 py-3">{t("colDate")}</th>
            <th className="px-4 py-3">{t("colItem")}</th>
            {!compact && <th className="px-4 py-3">{t("colType")}</th>}
            <th className="px-4 py-3 text-right">{t("colQty")}</th>
            {!compact && <th className="px-4 py-3 text-right">{t("colAfter")}</th>}
            <th className="px-4 py-3">{t("colReason")}</th>
            {!compact && <th className="px-4 py-3">{t("colBy")}</th>}
            {!compact && <th className="px-4 py-3">{t("colResponsible")}</th>}
            {!compact && <th className="px-4 py-3 text-right">{t("colAmount")}</th>}
          </tr>
        </thead>
        <tbody>
          {movements.map((m) => {
            const note = noteOf(m);
            return (
              <tr key={m.id} className="border-b border-line align-top last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">{formatRestaurant(m.createdAt)}</td>
                <td className="px-4 py-3 font-medium text-content">{m.itemName}</td>
                {!compact && (
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge color={TYPE_COLOR[m.type]}>{t(`movementType.${m.type}`)}</Badge>
                  </td>
                )}
                <td className="px-4 py-3 text-right">
                  <Delta value={m.delta} />
                </td>
                {!compact && <td className="px-4 py-3 text-right tabular-nums text-muted">{fmtNum(m.quantityAfter)}</td>}
                <td className="min-w-36 px-4 py-3">
                  <div className="text-content">{reasonOf(m)}</div>
                  {note && <div className="mt-0.5 break-words text-xs text-muted">{note}</div>}
                </td>
                {!compact && <td className="whitespace-nowrap px-4 py-3 text-muted">{m.createdByName ?? "—"}</td>}
                {!compact && <td className="whitespace-nowrap px-4 py-3 text-content">{m.responsibleName ?? "—"}</td>}
                {!compact && (
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                    {m.lossAmount > 0 ? (
                      <span className="text-danger">{money(m.lossAmount)}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
          {movements.length === 0 && (
            <tr>
              <td colSpan={compact ? 4 : 9} className="px-4 py-8 text-center text-muted">
                {t("historyEmpty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
