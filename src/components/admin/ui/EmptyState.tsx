import { cn } from "@/lib/utils";

/** Bo'sh holat: ikonka + matn (+ ixtiyoriy izoh/tugma) */
export default function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
  className,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      {Icon && (
        <span className="mb-3 inline-flex size-12 items-center justify-center rounded-full border border-brand-gold/30 bg-brand-gold/10 text-brand-gold">
          <Icon size={20} aria-hidden />
        </span>
      )}
      <p className="font-medium text-content">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
