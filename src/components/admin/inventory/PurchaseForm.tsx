"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Modal, TextArea, TextField } from "@/components/ui/primitives";
import { recordPurchase } from "@/lib/inventory/actions";
import { INVENTORY_LIMITS as L, type InventoryItemRow } from "@/lib/inventory/types";
import { ErrorText, Hint, ItemSelect, fmtNum, parseIntInput, parsePriceInput, useInvAction, useMoney } from "./shared";

/**
 * Kirim (sotib olindi / qo'shildi): son oshadi, narx kiritilsa buyum narxi ham yangilanadi.
 * item berilsa — o'sha buyum uchun; aks holda buyum oynaning o'zida tanlanadi (items).
 */
export default function PurchaseForm({
  item,
  items,
  onClose,
  onDone,
}: {
  item?: InventoryItemRow;
  items?: InventoryItemRow[];
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const t = useTranslations("Inventory");
  const money = useMoney();
  const [itemId, setItemId] = useState(item?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const { pending, error, setError, run } = useInvAction();
  const selected = item ?? items?.find((i) => i.id === itemId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return setError(t("errPickItem"));
    const qty = parseIntInput(quantity, 1, L.maxMove);
    if (qty === null) return setError(t("errQuantity"));
    const unitPrice = parsePriceInput(price);
    if (unitPrice === undefined) return setError(t("errPrice"));
    const { id, name } = selected;
    run(
      () => recordPurchase({ itemId: id, quantity: qty, unitPrice, note: note.trim() || undefined }),
      (r) => onDone(t("purchaseDone", { name, qty: fmtNum(r.quantity) }))
    );
  }

  return (
    <Modal open onClose={onClose} title={item ? t("purchaseTitle", { name: item.name }) : t("ov.purchaseTitleAny")}>
      <form onSubmit={submit} className="space-y-4 text-content">
        {!item && items && <ItemSelect items={items} value={itemId} onChange={setItemId} autoFocus />}
        {selected && (
          <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm">{t("currentStock", { qty: fmtNum(selected.quantity) })}</p>
        )}
        <TextField
          label={t("fQty")}
          type="number"
          inputMode="numeric"
          min={1}
          max={L.maxMove}
          step={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          autoFocus={!!item}
          required
        />
        <div>
          <TextField
            label={t("fPurchasePrice")}
            inputMode="decimal"
            value={price}
            placeholder={selected?.unitPrice != null ? String(selected.unitPrice) : "0"}
            onChange={(e) => setPrice(e.target.value)}
          />
          <Hint>
            {t("fPurchasePriceHint")}
            {selected?.unitPrice != null && ` ${t("currentPrice", { price: money(selected.unitPrice) })}`}
          </Hint>
        </div>
        <TextArea
          label={t("fNote")}
          rows={2}
          maxLength={L.noteMax}
          value={note}
          placeholder={t("fPurchaseNotePh")}
          onChange={(e) => setNote(e.target.value)}
        />
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? t("saving") : t("save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
