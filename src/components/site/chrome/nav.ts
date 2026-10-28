/**
 * Sayt navigatsiyasi — header, mobil menyu va footer bir xil ro'yxatdan foydalanadi.
 * `ns` + `key` — mavjud tarjima kalitlari (Common.* / Site.*), `cn` — xitoycha bezak yozuvi.
 */
export type NavItem = {
  href: string;
  ns: "Common" | "Site";
  key: string;
  cn: string;
  /** Desktop header'da ko'rsatilmaydi — "Stol band qilish" CTA tugmasi shu vazifani bajaradi (mobil menyu va footer'da bor) */
  headerHidden?: boolean;
};

export const NAV: NavItem[] = [
  { href: "/menu", ns: "Common", key: "menu", cn: "菜单" },
  { href: "/reservation", ns: "Site", key: "hBooking", cn: "订座", headerHidden: true },
  { href: "/gallery", ns: "Common", key: "gallery", cn: "画廊" },
  { href: "/events", ns: "Common", key: "events", cn: "宴会" },
  { href: "/blog", ns: "Common", key: "blog", cn: "博客" },
  { href: "/about", ns: "Common", key: "about", cn: "关于" },
  { href: "/contact", ns: "Common", key: "contact", cn: "联系" },
];

/**
 * Desktop header'da havolalar logo-lavhaning ikki tomoniga 3 tadan bo'linadi:
 * chapda — menyu, galereya, tadbirlar; o'ngda — blog, biz haqimizda, aloqa (bron — CTA tugmasida).
 */
const HEADER_NAV = NAV.filter((n) => !n.headerHidden);
export const NAV_LEFT = HEADER_NAV.slice(0, 3);
export const NAV_RIGHT = HEADER_NAV.slice(3);

/** Bosh sahifa — faqat mobil menyuda va footer'da (header'da logo shu vazifada) */
export const HOME_ITEM: NavItem = { href: "/", ns: "Common", key: "home", cn: "首页" };

/**
 * Tepasida qizil/tungi hero bor sahifalar — header u yerda shaffof boshlanadi.
 * Qolganlarida (krem hero'li bron/blog/biz haqimizda, blog maqolasi, kabinet va h.k.) header doim to'q.
 */
const HERO_ROUTES = new Set(["/", "/menu", "/gallery", "/events", "/contact"]);

export function hasDarkHero(pathname: string) {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  // Taom sahifasi (/menu/<slug>) — qorong'i hero
  return HERO_ROUTES.has(p) || /^\/menu\/[^/]+$/.test(p);
}

/** Havola faolmi: aniq mos yoki bo'lim ichidagi sahifa (/blog/maqola -> /blog) */
export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** "+998 77 507 06 43" -> "tel:+998775070643" */
export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Header/mobil menyudagi aloqa ma'lumotlari (admin Sozlamalar'idan) */
export type HeaderContact = { phone: string; address: string; instagram?: string; telegram?: string };
