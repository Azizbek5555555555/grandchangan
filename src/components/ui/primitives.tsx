"use client";

import { cn } from "@/lib/utils";

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
}) {
  const styles = {
    primary: "bg-brand-red text-white hover:bg-brand-red-dark",
    outline: "border border-neutral-300 text-brand-ink hover:bg-neutral-50",
    ghost: "text-neutral-600 hover:bg-neutral-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-60",
        styles,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TextField({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>}
      <input
        className={cn(
          "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-red",
          className
        )}
        {...props}
      />
    </label>
  );
}

export function TextArea({
  label,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>}
      <textarea
        className={cn(
          "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-red",
          className
        )}
        {...props}
      />
    </label>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className={cn(
          "max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-xl",
          wide ? "max-w-3xl" : "max-w-lg"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="mb-4 text-lg font-bold text-brand-ink">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export function Badge({ children, color = "gray" }: { children: React.ReactNode; color?: string }) {
  const map: Record<string, string> = {
    gray: "bg-neutral-100 text-neutral-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    gold: "bg-amber-100 text-amber-800",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", map[color] || map.gray)}>
      {children}
    </span>
  );
}
