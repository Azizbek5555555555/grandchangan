import type { AdminSection } from "@/lib/auth/permissions";

/**
 * Admin bo'limlarining bezak xitoycha belgisi (PageHeader eyebrow'i va Sidebar uchun)
 * va qaysi guruhga tegishliligi. Guruh nomlari: messages → AdminUi.nav.groups.<group>.
 */
export const SECTION_GLYPH: Record<AdminSection, string> = {
  dashboard: "总览",
  reservations: "订座",
  orders: "点单",
  menu: "菜单",
  tables: "座位",
  inventory: "库存",
  reviews: "评价",
  blog: "文章",
  banners: "横幅",
  promotions: "优惠",
  customers: "宾客",
  staff: "员工",
  payments: "收款",
  events: "宴会",
  gallery: "图库",
  settings: "设置",
};

export type SectionGroup = "operations" | "catalog" | "guests" | "content" | "management";

/** Sidebar tartibi: guruh → bo'limlar */
export const SECTION_GROUPS: { group: SectionGroup; sections: AdminSection[] }[] = [
  { group: "operations", sections: ["dashboard", "reservations", "orders", "tables"] },
  { group: "catalog", sections: ["menu", "inventory"] },
  { group: "guests", sections: ["customers", "events", "reviews", "promotions"] },
  { group: "content", sections: ["blog", "banners", "gallery"] },
  { group: "management", sections: ["staff", "payments", "settings"] },
];

export function groupOf(section: AdminSection): SectionGroup {
  return SECTION_GROUPS.find((g) => g.sections.includes(section))?.group ?? "operations";
}
