"use client";

import { useCallback, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn, currencyOf, formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/primitives";
import {
  INVENTORY_CATEGORIES,
  INVENTORY_LIMITS,
  type InvResult,
  type InventoryCategory,
  type InventoryItemRow,
  type InventoryMovementRow,
  type ItemViewStatus,
} from "@/lib/inventory/types";

/**
 * Inventar UI uchun umumiy yordamchilar: server action chaqirish, forma maydonlari,
 * holat belgisi, son formatlash. Ranglar faqat semantik va brend tokenlari orqali.
 */

/**
 * Server action'ni useTransition ichida chaqirish.
 * Natija { ok:false } bo'lsa — xato matni ko'rsatiladi; kutilmagan xatoda (tarmoq va h.k.)
 * ham umumiy xato chiqadi, tugmalar "kutilmoqda" holatida qotib qolmaydi.
 */
export function useInvAction() {
  const t = useTranslations("Inventory");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    <T extends object>(fn: () => Promise<InvResult<T>>, onOk?: (r: { ok: true } & T) => void) => {
      setError(null);
      startTransition(async () => {
        try {
          const r = await fn();
          if (r.ok) onOk?.(r);
          else setError(r.error);
        } catch (e) {
          console.error("[inventory]", e);
          setError(t("errGeneric"));
        }
      });
    },
    [t]
  );

  return { pending, error, setError, run };
}

/** Butun son maydoni: bo'shliqlar olib tashlanadi; noto'g'ri yoki chegaradan tashqari bo'lsa null */
export function parseIntInput(value: string, min: number, max: number): number | null {
  const s = value.replace(/\s/g, "");
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n >= min && n <= max ? n : null;
}

/** Narx maydoni: bo'sh -> null (narxsiz), noto'g'ri -> undefined, aks holda son (2 xonagacha kasr) */
export function parsePriceInput(value: string): number | null | undefined {
  const s = value.replace(/\s/g, "").replace(",", ".");
  if (s === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return undefined;
  const n = Number(s);
  return n <= INVENTORY_LIMITS.maxPrice ? n : undefined;
}

/** Pul summasi joriy til valyutasi bilan: "12 000 so'm" / "12 000 сум" / "12 000 UZS" / "12 000 苏姆" */
export function useMoney() {
  const locale = useLocale();
  return useCallback((v: number | string) => formatMoney(v, currencyOf(locale)), [locale]);
}

/** Sonni bo'shliq bilan guruhlab chiqarish: 12 500 (server va klientda bir xil) */
export function fmtNum(n: number): string {
  const grouped = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (n < 0 ? "−" : "") + grouped;
}

/** Ishorali son: +5 / −3 / 0 (kirim — oddiy, chiqim — qizil) */
export function Delta({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        value < 0 ? "text-danger" : value > 0 ? "text-content" : "text-muted",
        className
      )}
    >
      {value > 0 ? `+${fmtNum(value)}` : fmtNum(value)}
    </span>
  );
}

const STATUS_COLOR: Record<ItemViewStatus, string> = { OK: "green", LOW: "gold", SHORT: "red", UNSET: "gray" };

/** Qoldiq holati: OK — yashil, LOW — oltin, SHORT — qizil, UNSET (soni kiritilmagan) — kulrang */
export function StatusBadge({ status }: { status: ItemViewStatus }) {
  const t = useTranslations("Inventory");
  return <Badge color={STATUS_COLOR[status]}>{t(`status.${status}`)}</Badge>;
}

/** Ko'rsatish holati: soni hali kiritilmagan buyum "yetishmaydi" emas, "kiritilmagan" */
export function viewStatus(item: Pick<InventoryItemRow, "id" | "status">, unset: Set<string>): ItemViewStatus {
  return unset.has(item.id) ? "UNSET" : item.status;
}

/** Stolga qo'yilish qoidasi oddiy so'z bilan: "har o'ringa 1 + har stolga 2" yoki "stolga qo'yilmaydi" */
export function useNormText() {
  const t = useTranslations("Inventory");
  return (i: Pick<InventoryItemRow, "perSeat" | "perTable">): string => {
    const parts: string[] = [];
    if (i.perSeat > 0) parts.push(t("normSeat", { n: i.perSeat }));
    if (i.perTable > 0) parts.push(t("normTable", { n: i.perTable }));
    return parts.length ? parts.join(" + ") : t("noNorm");
  };
}

/** Har bir bo'lim tepasidagi bir qatorli "bu yerda nima qilinadi" izohi */
export function TabIntro({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <p className="mb-5 flex items-start gap-2 text-sm text-muted">
      <Icon size={16} className="mt-0.5 shrink-0 text-brand-gold" />
      <span>{children}</span>
    </p>
  );
}

/** Select maydoni (primitives'dagi TextField uslubida) */
export function SelectField({
  label,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-content">{label}</span>}
      <select
        className={cn(
          "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-content outline-none focus:border-brand-red",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

/** Buyumni tanlash (guruhlar bo'yicha): kirim va yo'qotish oynalarida */
export function ItemSelect({
  items,
  value,
  onChange,
  autoFocus,
}: {
  items: { id: string; name: string; category: InventoryCategory }[];
  value: string;
  onChange: (id: string) => void;
  autoFocus?: boolean;
}) {
  const t = useTranslations("Inventory");
  return (
    <SelectField label={t("fItem")} value={value} onChange={(e) => onChange(e.target.value)} autoFocus={autoFocus} required>
      <option value="">{t("fItemPh")}</option>
      {INVENTORY_CATEGORIES.map((c) => {
        const group = items.filter((i) => i.category === c);
        if (!group.length) return null;
        return (
          <optgroup key={c} label={t(`category.${c}`)}>
            {group.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </optgroup>
        );
      })}
    </SelectField>
  );
}

/** Maydon ostidagi kichik izoh */
export function Hint({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("mt-1 text-xs text-muted", className)}>{children}</p>;
}

/** Server yoki forma xatosi */
export function ErrorText({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm text-danger">
      {children}
    </p>
  );
}

/** Ixcham statistik karta (dashboard StatCard uslubida) */
export function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
  alert,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  alert?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-card p-3 shadow-sm sm:p-5">
      <div className="mb-2 flex items-start justify-between gap-2 sm:mb-3">
        <span className="text-xs text-muted sm:text-sm">{label}</span>
        <Icon size={20} className="shrink-0 text-brand-red" />
      </div>
      <p className={cn("break-words text-lg font-bold sm:text-2xl", alert ? "text-danger" : "text-content")}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** Filtr tugmasi (ReservationsTable'dagi kabi "chip") */
export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-9 rounded-full border px-3 py-1.5 text-xs transition",
        active ? "border-brand-red bg-brand-red text-brand-cream" : "border-line bg-card text-content hover:bg-surface-2"
      )}
    >
      {children}
    </button>
  );
}

/**
 * Harakat izohi. Boshlang'ich son yozuvi bazada o'zbekcha matn bilan saqlanadi —
 * uni tarjima qilingan yorliq bilan almashtiramiz, qolgan izohlar foydalanuvchi yozgan matn.
 */
export function useMovementNote() {
  const t = useTranslations("Inventory");
  return (m: Pick<InventoryMovementRow, "type" | "note">): string | null =>
    m.type === "CORRECTION" && m.note === "Boshlang'ich son" ? t("noteInitial") : m.note;
}
