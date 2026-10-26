import { cn } from "@/lib/utils";
import { ui } from "./styles";

/** Yorliq + maydon (+ izoh) */
export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className={ui.label}>{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

/** Natija xabari: muvaffaqiyat yoki xato */
export function Notice({ ok, children, className }: { ok: boolean; children: React.ReactNode; className?: string }) {
  return (
    <p
      role={ok ? "status" : "alert"}
      className={cn(
        "rounded-xl px-3 py-2 text-sm",
        ok ? "bg-success-soft text-success" : "bg-fire/10 text-fire-ink",
        className
      )}
    >
      {children}
    </p>
  );
}
