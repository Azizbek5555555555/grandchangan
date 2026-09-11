"use client";

import { usePathname, useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  CalendarClock,
  ClipboardList,
  UtensilsCrossed,
  Grid3x3,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/auth/actions";

const items = [
  { key: "dashboard", href: "dashboard", icon: LayoutDashboard },
  { key: "reservations", href: "reservations", icon: CalendarClock },
  { key: "orders", href: "orders", icon: ClipboardList },
  { key: "menu", href: "menu", icon: UtensilsCrossed },
  { key: "tables", href: "tables", icon: Grid3x3 },
  { key: "reviews", href: "reviews", icon: Star },
  { key: "blog", href: "blog", icon: Newspaper },
  { key: "banners", href: "banners", icon: Images },
  { key: "promotions", href: "promotions", icon: Tag },
  { key: "customers", href: "customers", icon: Users },
  { key: "payments", href: "payments", icon: CreditCard },
  { key: "events", href: "events", icon: PartyPopper },
  { key: "gallery", href: "gallery", icon: ImageIcon },
  { key: "settings", href: "settings", icon: Settings },
] as const;

export default function AdminSidebar({ userName }: { userName: string }) {
  const t = useTranslations("Admin");
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "uz";

  async function onLogout() {
    await logoutAction();
    router.replace(`/${locale}/admin/login`);
    router.refresh();
  }

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-neutral-200 bg-brand-ink text-brand-cream">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-lg font-bold text-brand-gold-light">GrandChangan</p>
        <p className="text-xs text-brand-cream/50">{t("panel")}</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {items.map(({ key, href, icon: Icon }) => {
          const full = `/${locale}/admin/${href}`;
          const active = pathname === full;
          return (
            <button
              key={key}
              onClick={() => router.push(full)}
              className={cn(
                "mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-brand-red text-white"
                  : "text-brand-cream/70 hover:bg-white/5 hover:text-brand-cream"
              )}
            >
              <Icon size={18} />
              <span>{t(key)}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <p className="mb-2 px-3 text-xs text-brand-cream/50">{userName}</p>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-brand-cream/70 transition hover:bg-white/5 hover:text-brand-cream"
        >
          <LogOut size={18} />
          <span>{t("logout") ?? "Chiqish"}</span>
        </button>
      </div>
    </aside>
  );
}
