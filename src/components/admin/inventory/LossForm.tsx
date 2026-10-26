"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Modal, TextArea, TextField } from "@/components/ui/primitives";
import { reportLoss } from "@/lib/inventory/actions";
import {
  INVENTORY_LIMITS as L,
  LOSS_REASONS,
  type InventoryItemOption,
  type InventoryLossReason,
  type InventoryStaffOption,
} from "@/lib/inventory/types";
import { ErrorText, Hint, ItemSelect, SelectField, fmtNum, parseIntInput, useInvAction, useMoney } from "./shared";

type FixedItem = { id: string; name: string; quantity: number; unitPrice: number | null };
/** Tanlanadigan buyum: narx bo'lsa taxminiy zarar ham ko'rsatiladi (boshqaruv oynasida) */
type PickItem = InventoryItemOption & { unitPrice?: number | null };
export type LossDone = { name: string; qty: number; left: number };

/**
 * "Sindi / yo'qoldi" formasi.
 *  - Boshqaruv: buyum oldindan tanlangan (fixedItem), mas'ul xodimni tanlash mumkin (staff).
 *  - Ofitsiant/oshxona: buyum ro'yxatdan tanlanadi (items), mas'ul — server tomonda o'zi.
 */
export function LossFormBody({
  items,
  fixedItem,
  staff,
  onDone,
  onCancel,
}: {
  items?: PickItem[];
  fixedItem?: FixedItem;
  staff?: InventoryStaffOption[];
  onDone: (r: LossDone) => void;
  onCancel?: () => void;
}) {
  const t = useTranslations("Inventory");
  const money = useMoney();
  const [itemId, setItemId] = useState(fixedItem?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState<InventoryLossReason>("BROKEN");
  const [responsibleId, setResponsibleId] = useState("");
  const [note, setNote] = useState("");
  const { pending, error, setError, run } = useInvAction();

  const picked = items?.find((i) => i.id === itemId);
  const selected: Omit<FixedItem, "id"> | undefined =
    fixedItem ?? (picked ? { name: picked.name, quantity: picked.quantity, unitPrice: picked.unitPrice ?? null } : undefined);
  const qty = parseIntInput(quantity, 1, L.maxMove);
  const estimate = selected?.unitPrice != null && qty !== null ? qty * selected.unitPrice : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!itemId || !selected) return setError(t("errPickItem"));
    if (qty === null) return setError(t("errQuantity"));
    const name = selected.name;
    run(
      () =>
        reportLoss({
          itemId,
          quantity: qty,
          reason,
          note: note.trim() || undefined,
          responsibleId: staff ? responsibleId || null : undefined,
        }),
      (r) => onDone({ name, qty, left: r.quantity })
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 text-content">
      {fixedItem ? (
        <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm">{t("currentStock", { qty: fmtNum(fixedItem.quantity) })}</p>
      ) : (
        <>
          <ItemSelect items={items ?? []} value={itemId} onChange={setItemId} />
          {/* Hisobdagi son — faqat boshqaruv oynasida (xodim ko'rinishi o'zgarmaydi) */}
          {selected && staff && (
            <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm">{t("currentStock", { qty: fmtNum(selected.quantity) })}</p>
          )}
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label={t("fQty")}
          type="number"
          inputMode="numeric"
          min={1}
          max={L.maxMove}
          step={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
        <SelectField label={t("fReason")} value={reason} onChange={(e) => setReason(e.target.value as InventoryLossReason)}>
          {LOSS_REASONS.map((r) => (
            <option key={r} value={r}>
              {t(`reason.${r}`)}
            </option>
          ))}
        </SelectField>
      </div>
      {selected && selected.quantity === 0 && <Hint className="text-danger">{t("zeroStockLoss")}</Hint>}

      {staff && (
        <div>
          <SelectField label={t("fResponsible")} value={responsibleId} onChange={(e) => setResponsibleId(e.target.value)}>
            <option value="">{t("fResponsibleNone")}</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {t(`role.${s.role}`)}
              </option>
            ))}
          </SelectField>
          <Hint>{t("fResponsibleHint")}</Hint>
        </div>
      )}

      <TextArea
        label={t("fNote")}
        rows={2}
        maxLength={L.noteMax}
        value={note}
        placeholder={t("fLossNotePh")}
        onChange={(e) => setNote(e.target.value)}
      />

      {estimate > 0 && <p className="text-sm text-muted">{t("lossEstimate", { sum: money(estimate) })}</p>}
      <ErrorText>{error}</ErrorText>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? t("saving") : t("lossSubmit")}
        </Button>
      </div>
    </form>
  );
}

/**
 * Boshqaruv uchun oyna: ombor jadvalidagi qatordan (item) yoki "Holat"dagi umumiy tugmadan
 * (items — buyum oynaning o'zida tanlanadi) ochiladi
 */
export default function LossModal({
  item,
  items,
  staff,
  onClose,
  onDone,
}: {
  item?: FixedItem;
  items?: PickItem[];
  staff: InventoryStaffOption[];
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const t = useTranslations("Inventory");
  return (
    <Modal open onClose={onClose} title={item ? t("lossTitle", { name: item.name }) : t("ov.lossTitleAny")}>
      <LossFormBody
        fixedItem={item}
        items={item ? undefined : items}
        staff={staff}
        onCancel={onClose}
        onDone={(r) => onDone(t("lossDone", { name: r.name, qty: fmtNum(r.qty), left: fmtNum(r.left) }))}
      />
    </Modal>
  );
}
