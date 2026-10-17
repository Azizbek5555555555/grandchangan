"use client";

import { useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction, changeOwnPasswordAction } from "@/lib/auth/actions";
import { canAccess, ROLE_LABELS } from "@/lib/auth/permissions";
import ThemeToggle from "@/components/site/ThemeToggle";
import { Button, Modal, TextField } from "@/components/ui/primitives";
import type { UserRole } from "@prisma/client";

const items = [
  { key: "dashboard", href: "dashboard", icon: LayoutDashboard },
  { key: "reservations", href: "reservations", icon: CalendarClock },
  { key: "orders", href: "orders", icon: ClipboardList },
  { key: "menu", href: "menu", icon: UtensilsCrossed },
  { key: "tables", href: "tables", icon: Grid3x3 },
  { key: "inventory", href: "inventory", icon: Package },
  { key: "reviews", href: "reviews", icon: Star },
  { key: "blog", href: "blog", icon: Newspaper },
  { key: "banners", href: "banners", icon: Images },
  { key: "promotions", href: "promotions", icon: Tag },
  { key: "customers", href: "customers", icon: Users },
  { key: "staff", href: "staff", icon: UserCog },
  { key: "payments", href: "payments", icon: CreditCard },
  { key: "events", href: "events", icon: PartyPopper },
  { key: "gallery", href: "gallery", icon: ImageIcon },
  { key: "settings", href: "settings", icon: Settings },
] as const;

export default function AdminSidebar({ userName, role }: { userName: string; role: UserRole }) {
  const t = useTranslations("Admin");
  const [pwdOpen, setPwdOpen] = useState(false);
  // next-intl navigatsiyasi: pathname til prefiksisiz keladi (uz standart tilda URL'da /uz yo'q)
  const pathname = usePathname();
  const router = useRouter();

  async function onLogout() {
    await logoutAction();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    // Telefonda (md dan kichik) — faqat ikonkalar paneli (w-16), kontentga joy qoladi; md+ — avvalgidek w-64
    <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col border-r border-line bg-brand-ink text-brand-cream md:w-64">
      <div className="border-b border-white/10 px-2 py-5 text-center md:px-5 md:text-left">
        <p className="text-lg font-bold text-brand-gold-light">
          <span className="md:hidden">GC</span>
          <span className="hidden md:inline">GrandChangan</span>
        </p>
        <p className="hidden text-xs text-brand-cream/50 md:block">{t("panel")}</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 md:px-3">
        {items.filter(({ key }) => canAccess(role, key)).map(({ key, href, icon: Icon }) => {
          const full = `/admin/${href}`;
          const active = pathname === full;
          return (
            <button
              key={key}
              onClick={() => router.push(full)}
              title={t(key)}
              className={cn(
                "mb-1 flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm transition md:justify-start",
                active
                  ? "bg-brand-red text-white"
                  : "text-brand-cream/70 hover:bg-white/5 hover:text-brand-cream"
              )}
            >
              <Icon size={18} className="shrink-0" />
              <span className="sr-only md:not-sr-only">{t(key)}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-2 py-4 md:px-3">
        <div className="mb-2 flex items-center justify-center md:justify-between md:px-3">
          <div className="hidden md:block">
            <p className="text-xs text-brand-cream/70">{userName}</p>
            <p className="text-[10px] uppercase tracking-wider text-brand-cream/40">{ROLE_LABELS[role]}</p>
          </div>
          <ThemeToggle className="flex h-8 w-8 items-center justify-center rounded-full text-brand-cream/70 transition hover:bg-white/10" />
        </div>
        <button
          onClick={() => setPwdOpen(true)}
          className="flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm text-brand-cream/70 transition hover:bg-white/5 hover:text-brand-cream md:justify-start"
        >
          <KeyRound size={18} className="shrink-0" />
          <span className="sr-only md:not-sr-only">Parolni o&apos;zgartirish</span>
        </button>
        <button
          onClick={onLogout}
          title={t("logout")}
          className="flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm text-brand-cream/70 transition hover:bg-white/5 hover:text-brand-cream md:justify-start"
        >
          <LogOut size={18} className="shrink-0" />
          <span className="sr-only md:not-sr-only">{t("logout") ?? "Chiqish"}</span>
        </button>
      </div>
      {pwdOpen && <PasswordModal onClose={() => setPwdOpen(false)} />}
    </aside>
  );
}

function PasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  return (
    <Modal open onClose={onClose} title="Parolni o'zgartirish">
      <div className="space-y-4 text-content">
        <TextField label="Joriy parol" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        <TextField label="Yangi parol (kamida 8 belgi)" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
        {msg && <p className={`text-sm ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Yopish</Button>
          <Button
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              const r = await changeOwnPasswordAction(current, next);
              setSaving(false);
              setMsg(r.ok ? { ok: true, text: "Parol o'zgartirildi ✓" } : { ok: false, text: r.error || "Xatolik" });
              if (r.ok) { setCurrent(""); setNext(""); }
            }}
          >
            Saqlash
          </Button>
        </div>
      </div>
    </Modal>
  );
}
