"use client";

import { useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ui } from "./styles";

/**
 * Admin modal oynasi. Telefonda pastdan chiqadigan varaq, katta ekranda markazda.
 * Escape va fonni bosish yopadi; ochilganda birinchi maydonga fokus beriladi.
 */
export default function Dialog({
  onClose,
  title,
  eyebrow,
  children,
  footer,
  wide,
}: {
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  /** Pastki tugmalar qatori */
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  const t = useTranslations("AdminUi.common");
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const first = panelRef.current?.querySelector<HTMLElement>("input:not([type=hidden]),select,textarea");
    (first ?? panelRef.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prevFocus?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-night/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
        className={cn(
          "flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-card text-content shadow-2xl outline-none sm:rounded-2xl",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {eyebrow && <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">{eyebrow}</p>}
            <h2 id={id} className="font-display text-xl leading-snug text-content">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={t("close")} title={t("close")} className={cn(ui.iconBtn, "-mr-2")}>
            <X size={18} aria-hidden />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface-2/50 px-5 py-3 sm:px-6">{footer}</div>
        )}
      </div>
    </div>
  );
}
