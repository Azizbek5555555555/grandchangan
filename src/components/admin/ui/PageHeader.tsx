import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { AdminSection } from "@/lib/auth/permissions";
import { SECTION_GLYPH, groupOf } from "./sections";

type Props = {
  /** Bo'lim berilsa — xitoycha belgi va guruh nomi (eyebrow) o'zi olinadi */
  section?: AdminSection;
  /** Xitoycha bezak belgisi (section'dagidan ustun) */
  glyph?: string;
  /** Kichik ustki yozuv (section guruhi o'rniga) */
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  /** O'ng tomondagi amal tugmalari */
  actions?: React.ReactNode;
  className?: string;
};

/**
 * Admin sahifasining sarlavha bloki: xitoycha muhr-belgi + eyebrow, serif sarlavha,
 * izoh va o'ng tomonda amal tugmalari. Server va klient komponentlarida ishlaydi.
 */
export default function PageHeader({ section, glyph, eyebrow, title, description, actions, className }: Props) {
  const t = useTranslations("AdminUi.nav.groups");
  const g = glyph ?? (section ? SECTION_GLYPH[section] : undefined);
  const eb = eyebrow ?? (section ? t(groupOf(section)) : undefined);

  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-4 border-b border-line pb-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6",
        className
      )}
    >
      <div className="min-w-0">
        {(g || eb) && (
          <div className="mb-2.5 flex items-center gap-3">
            {g && (
              <span
                aria-hidden="true"
                lang="zh"
                className="font-cn inline-flex h-7 items-center rounded-[3px] border border-brand-gold/40 bg-fire px-1.5 text-[13px] leading-none tracking-wider text-brand-cream shadow-sm"
              >
                {g}
              </span>
            )}
            {eb && (
              <span className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                <span aria-hidden="true" className="h-px w-6 bg-brand-gold/60" />
                {eb}
              </span>
            )}
          </div>
        )}
        <h1 className="font-display text-[1.75rem] leading-tight text-content sm:text-[2.1rem]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">{actions}</div>}
    </header>
  );
}
