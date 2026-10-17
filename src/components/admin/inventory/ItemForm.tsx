"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Modal, TextField } from "@/components/ui/primitives";
import { saveInventoryItem } from "@/lib/inventory/actions";
import { tableQty } from "@/lib/inventory/calc";
import {
  INVENTORY_CATEGORIES,
  INVENTORY_LIMITS as L,
  type InventoryCategory,
  type InventoryItemRow,
} from "@/lib/inventory/types";
import { Delta, ErrorText, Hint, SelectField, parseIntInput, parsePriceInput, useInvAction } from "./shared";

/**
 * Buyum qo'shish / tahrirlash oynasi.
 * Tahrirda "Jami son" — qo'lda tuzatish: o'zgartirilsa tarixga CORRECTION yoziladi,
 * o'zgartirilmasa umuman yuborilmaydi (parallel kirim/yo'qotishni bosib ketmaslik uchun).
 */
export default function ItemForm({
  item,
  onClose,
  onSaved,
}: {
  item?: InventoryItemRow;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const t = useTranslations("Inventory");
  const isNew = !item;
  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState<InventoryCategory>(item?.category ?? "TABLEWARE");
  const [perSeat, setPerSeat] = useState(String(item?.perSeat ?? 0));
  const [perTable, setPerTable] = useState(String(item?.perTable ?? 0));
  const [minReserve, setMinReserve] = useState(String(item?.minReserve ?? 0));
  const [price, setPrice] = useState(item?.unitPrice != null ? String(item.unitPrice) : "");
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 0));
  const { pending, error, setError, run } = useInvAction();

  // Jonli ko'rinish: 4 kishilik stolga normaga ko'ra nechta kerak
  const ps = parseIntInput(perSeat, 0, L.maxQty);
  const pt = parseIntInput(perTable, 0, L.maxQty);
  const preview = ps !== null && pt !== null ? tableQty({ perSeat: ps, perTable: pt }, 4) : null;
  const q = parseIntInput(quantity, 0, L.maxQty);
  const correction = !isNew && q !== null && item ? q - item.quantity : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = name.trim().replace(/\s+/g, " ");
    if (!cleanName || cleanName.length > L.nameMax) return setError(t("errName"));
    const mr = parseIntInput(minReserve, 0, L.maxQty);
    if (ps === null || pt === null || mr === null || q === null) return setError(t("errNumber"));
    const unitPrice = parsePriceInput(price);
    if (unitPrice === undefined) return setError(t("errPrice"));

    run(
      () =>
        saveInventoryItem({
          id: item?.id,
          name: cleanName,
          category,
          perSeat: ps,
          perTable: pt,
          minReserve: mr,
          unitPrice,
          // Yangi buyumda — boshlang'ich son; tahrirda faqat o'zgargan bo'lsa
          quantity: !item ? q : q !== item.quantity ? q : undefined,
        }),
      () => onSaved(t(isNew ? "itemCreated" : "itemUpdated", { name: cleanName }))
    );
  }

  return (
    <Modal open onClose={onClose} title={t(isNew ? "itemNew" : "itemEdit")}>
      <form onSubmit={submit} className="space-y-4 text-content">
        <TextField
          label={t("fName")}
          value={name}
          maxLength={L.nameMax}
          placeholder={t("fNamePh")}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
        <SelectField label={t("fCategory")} value={category} onChange={(e) => setCategory(e.target.value as InventoryCategory)}>
          {INVENTORY_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`category.${c}`)}
            </option>
          ))}
        </SelectField>

        <div>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label={t("fPerSeat")}
              type="number"
              inputMode="numeric"
              min={0}
              max={L.maxQty}
              step={1}
              value={perSeat}
              onChange={(e) => setPerSeat(e.target.value)}
            />
            <TextField
              label={t("fPerTable")}
              type="number"
              inputMode="numeric"
              min={0}
              max={L.maxQty}
              step={1}
              value={perTable}
              onChange={(e) => setPerTable(e.target.value)}
            />
          </div>
          <Hint>{t("fNormHint")}</Hint>
          {preview !== null && <Hint className="font-medium text-content">{t("fNormPreview", { qty: preview })}</Hint>}
        </div>

        <div>
          <TextField
            label={t("fMinReserve")}
            type="number"
            inputMode="numeric"
            min={0}
            max={L.maxQty}
            step={1}
            value={minReserve}
            onChange={(e) => setMinReserve(e.target.value)}
          />
          <Hint>{t("fMinReserveHint")}</Hint>
        </div>

        <div>
          <TextField
            label={t("fUnitPrice")}
            inputMode="decimal"
            value={price}
            placeholder="0"
            onChange={(e) => setPrice(e.target.value)}
          />
          <Hint>{t("fUnitPriceHint")}</Hint>
        </div>

        <div>
          <TextField
            label={t(isNew ? "fQuantityNew" : "fQuantityEdit")}
            type="number"
            inputMode="numeric"
            min={0}
            max={L.maxQty}
            step={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <Hint>{t(isNew ? "fQuantityNewHint" : "fQuantityEditHint")}</Hint>
          {correction !== 0 && (
            <Hint className="text-content">
              {t("fCorrectionPreview")} <Delta value={correction} />
            </Hint>
          )}
        </div>

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
