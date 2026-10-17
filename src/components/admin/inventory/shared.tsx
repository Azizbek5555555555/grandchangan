"use client";

import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/primitives";
import { INVENTORY_LIMITS, type InvResult, type InventoryMovementRow, type StockStatus } from "@/lib/inventory/types";

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

const STATUS_COLOR: Record<StockStatus, string> = { OK: "green", LOW: "gold", SHORT: "red" };

/** Qoldiq holati: OK — yashil, LOW — oltin, SHORT — qizil */
export function StatusBadge({ status }: { status: StockStatus }) {
  const t = useTranslations("Inventory");
  return <Badge color={STATUS_COLOR[status]}>{t(`status.${status}`)}</Badge>;
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
    <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm text-muted">{label}</span>
        <Icon size={20} className="shrink-0 text-brand-red" />
      </div>
      <p className={cn("text-2xl font-bold", alert ? "text-danger" : "text-content")}>{value}</p>
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
        "rounded-full px-3 py-1 text-xs transition",
        active ? "bg-brand-red text-brand-cream" : "bg-surface-2 text-content hover:bg-line"
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
