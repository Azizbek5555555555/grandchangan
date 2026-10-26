"use client";

import { useEffect, useRef, useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  CalendarClock,
  ClipboardList,
  UtensilsCrossed,
  Grid3x3,
  Package,
  Star,
  Newspaper,
  Images,
  Tag,
  Users,
  CreditCard,
  PartyPopper,
  Image as ImageIcon,
  Settings,
  LogOut,
  UserCog,
  KeyRound,
  Languages,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction, changeOwnPasswordAction } from "@/lib/auth/actions";
import { canAccess, type AdminSection } from "@/lib/auth/permissions";
import ThemeToggle from "@/components/site/ThemeToggle";
import Dialog from "@/components/admin/ui/Dialog";
import { Field, Notice } from "@/components/admin/ui/Field";
import { SECTION_GROUPS } from "@/components/admin/ui/sections";
import { ui } from "@/components/admin/ui/styles";
import type { UserRole } from "@prisma/client";

const ICONS: Record<AdminSection, React.ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>> = {
  dashboard: LayoutDashboard,
  reservations: CalendarClock,
  orders: ClipboardList,
  menu: UtensilsCrossed,
  tables: Grid3x3,
  inventory: Package,
  reviews: Star,
  blog: Newspaper,
  banners: Images,
  promotions: Tag,
  customers: Users,
  staff: UserCog,
  payments: CreditCard,
  events: PartyPopper,
  gallery: ImageIcon,
  settings: Settings,
};

const LOCALE_SHORT: Record<string, string> = { uz: "UZ", ru: "RU", en: "EN", zh: "中文" };
const LOCALE_NAME: Record<string, string> = { uz: "O'zbekcha", ru: "Русский", en: "English", zh: "中文" };

/** Tungi fon ustidagi kichik tugma (telefonda 44px) */
const railBtn =
  "flex h-11 w-full items-center justify-center gap-3 rounded-xl px-3 text-sm text-brand-cream/70 transition hover:bg-brand-cream/[0.06] hover:text-brand-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60 md:h-10 md:justify-start";

export default function AdminSidebar({ userName, role }: { userName: string; role: UserRole }) {
  const t = useTranslations("Admin");
  const tu = useTranslations("AdminUi");
  const [pwdOpen, setPwdOpen] = useState(false);
  // next-intl navigatsiyasi: pathname til prefiksisiz keladi (uz standart tilda URL'da /uz yo'q)
  const pathname = usePathname();
  const router = useRouter();

  async function onLogout() {
    await logoutAction();
    router.replace("/admin/login");
    router.refresh();
  }

  const groups = SECTION_GROUPS.map((g) => ({ ...g, sections: g.sections.filter((s) => canAccess(role, s)) })).filter(
    (g) => g.sections.length > 0
  );

  return (
    // Telefonda (md dan kichik) — faqat ikonkalar paneli (w-16), kontentga joy qoladi; md+ — to'liq (w-64)
    <aside className="sticky top-0 z-30 flex h-dvh w-16 shrink-0 flex-col border-r border-brand-gold/15 bg-night text-brand-cream md:w-64">
      {/* Brend: xitoycha muhr + nom */}
      <div className="flex items-center justify-center gap-3 border-b border-brand-gold/15 px-2 py-4 md:justify-start md:px-5 md:py-5">
        <span
          aria-hidden="true"
          lang="zh"
          className="font-cn flex h-12 w-7 shrink-0 items-center justify-center rounded-[2px] border border-brand-gold/40 bg-fire text-[13px] leading-[1.05] text-brand-cream shadow-md shadow-night/50 [writing-mode:vertical-rl]"
        >
          长安
        </span>
        <div className="hidden min-w-0 md:block">
          <p className="font-display text-lg leading-tight text-brand-cream">GrandChangan</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-gold-light/80">{t("panel")}</p>
        </div>
      </div>

      <nav aria-label={tu("nav.label")} className="flex-1 overflow-y-auto overscroll-contain px-2 py-4 md:px-3">
        {groups.map(({ group, sections }, gi) => (
          <div key={group} className="mb-4 last:mb-0">
            <p className="mb-1.5 hidden px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-cream/40 md:block">
              {tu(`nav.groups.${group}`)}
            </p>
            {gi > 0 && <div aria-hidden="true" className="mx-auto mb-3 h-px w-6 bg-brand-gold/25 md:hidden" />}
            <ul className="space-y-0.5">
              {sections.map((key) => {
                const Icon = ICONS[key];
                const full = `/admin/${key}`;
                const active = pathname === full || pathname.startsWith(`${full}/`);
                return (
                  <li key={key}>
                    <Link
                      href={full}
                      title={t(key)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex h-11 items-center justify-center gap-3 rounded-xl px-3 text-sm transition md:h-10 md:justify-start",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60",
                        active
                          ? "bg-fire text-brand-cream shadow-sm shadow-night/40"
                          : "text-brand-cream/70 hover:bg-brand-cream/[0.06] hover:text-brand-cream"
                      )}
                    >
                      {active && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-brand-gold-light" />}
                      <Icon
                        size={18}
                        aria-hidden
                        className={cn("shrink-0", active ? "text-brand-gold-light" : "text-brand-cream/50 group-hover:text-brand-gold-light")}
                      />
                      <span className="sr-only md:not-sr-only md:truncate">{t(key)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-brand-gold/15 px-2 py-3 md:px-3">
        <LocaleSwitch />

        <div className="flex flex-col items-center gap-1 md:flex-row md:gap-3 md:px-1 md:py-1.5">
          <span
            aria-hidden="true"
            className="hidden size-9 shrink-0 items-center justify-center rounded-full border border-brand-gold/30 bg-night-3 font-display text-brand-gold-light md:flex"
          >
            {(userName.trim()[0] || "A").toUpperCase()}
          </span>
          <div className="hidden min-w-0 flex-1 md:block">
            <p className="truncate text-sm text-brand-cream">{userName}</p>
            <p className="text-[10px] uppercase tracking-wider text-brand-cream/45">{tu(`roles.${role}`)}</p>
          </div>
          <ThemeToggle className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-brand-cream/70 transition hover:bg-brand-cream/10 hover:text-brand-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60 md:size-9" />
        </div>

        <button type="button" onClick={() => setPwdOpen(true)} title={tu("password.title")} className={railBtn}>
          <KeyRound size={18} className="shrink-0" aria-hidden />
          <span className="sr-only md:not-sr-only md:truncate">{tu("password.title")}</span>
        </button>
        <button type="button" onClick={onLogout} title={t("logout")} className={railBtn}>
          <LogOut size={18} className="shrink-0" aria-hidden />
          <span className="sr-only md:not-sr-only md:truncate">{t("logout")}</span>
        </button>
      </div>
      {pwdOpen && <PasswordModal onClose={() => setPwdOpen(false)} />}
    </aside>
  );
}

/**
 * Til almashtirgich: md+ — 4 ta tugma qatori; telefonda — bitta tugma, yonida ro'yxat ochiladi.
 * Haqiqiy havolalar (next-intl Link + locale), joriy sahifa saqlanadi.
 */
function LocaleSwitch() {
  const tu = useTranslations("AdminUi.nav");
  const pathname = usePathname();
  const current = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {/* md+ : qator */}
      <ul aria-label={tu("language")} className="hidden grid-cols-4 gap-1 rounded-xl border border-brand-gold/15 bg-night-2 p-1 md:grid">
        {routing.locales.map((l) => {
          const active = l === current;
          return (
            <li key={l}>
              <Link
                href={pathname}
                locale={l}
                replace
                lang={l}
                hrefLang={l}
                title={LOCALE_NAME[l]}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex h-8 items-center justify-center rounded-lg text-[12px] font-semibold tracking-wider transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60",
                  active ? "bg-brand-cream text-brand-ink" : "text-brand-cream/65 hover:bg-brand-cream/10 hover:text-brand-cream"
                )}
              >
                {LOCALE_SHORT[l]}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* telefon: bitta tugma */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`${tu("language")}: ${LOCALE_NAME[current] ?? current}`}
        className="flex h-11 w-full flex-col items-center justify-center rounded-xl text-brand-cream/80 transition hover:bg-brand-cream/[0.06] md:hidden"
      >
        <Languages size={16} aria-hidden />
        <span className="text-[10px] font-semibold tracking-wider">{LOCALE_SHORT[current]}</span>
      </button>
      {open && (
        <ul
          aria-label={tu("language")}
          className="absolute bottom-0 left-full z-40 ml-2 w-44 rounded-2xl border border-brand-gold/25 bg-night-2 p-1.5 shadow-2xl md:hidden"
        >
          {routing.locales.map((l) => {
            const active = l === current;
            return (
              <li key={l}>
                <Link
                  href={pathname}
                  locale={l}
                  replace
                  lang={l}
                  hrefLang={l}
                  aria-current={active ? "true" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex h-11 items-center justify-between gap-3 rounded-xl px-3 text-sm transition",
                    active ? "text-brand-gold-light" : "text-brand-cream/85 hover:bg-brand-cream/10"
                  )}
                >
                  <span>{LOCALE_NAME[l]}</span>
                  {active ? <Check size={15} aria-hidden /> : <span className="text-[11px] tracking-wider text-brand-cream/45">{LOCALE_SHORT[l]}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PasswordModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("AdminUi.password");
  const tc = useTranslations("AdminUi.common");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      const r = await changeOwnPasswordAction(current, next);
      setMsg(r.ok ? { ok: true, text: t("changed") } : { ok: false, text: r.error || tc("error") });
      if (r.ok) { setCurrent(""); setNext(""); }
    } catch {
      setMsg({ ok: false, text: tc("error") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      onClose={onClose}
      title={t("title")}
      footer={
        <>
          <button type="button" onClick={onClose} className={ui.btnSecondary}>{tc("close")}</button>
          <button type="button" disabled={saving || !current || !next} onClick={submit} className={ui.btnPrimary}>
            {saving ? tc("saving") : tc("save")}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t("current")}>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" className={ui.input} />
        </Field>
        <Field label={t("new")} hint={t("newHint")}>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" className={ui.input} />
        </Field>
        {msg && <Notice ok={msg.ok}>{msg.text}</Notice>}
      </div>
    </Dialog>
  );
}
