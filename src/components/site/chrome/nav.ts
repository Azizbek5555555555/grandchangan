/**
 * Sayt navigatsiyasi — header, mobil menyu va footer bir xil ro'yxatdan foydalanadi.
 * `ns` + `key` — mavjud tarjima kalitlari (Common.* / Site.*), `cn` — xitoycha bezak yozuvi.
 */
export type NavItem = {
  href: string;
  ns: "Common" | "Site";
  key: string;
  cn: string;
  /** Faqat xl ekranda header'da ko'rinadi (lg da CTA tugmasi shu vazifani bajaradi) */
  xlOnly?: boolean;
};

export const NAV: NavItem[] = [
  { href: "/menu", ns: "Common", key: "menu", cn: "菜单" },
  { href: "/reservation", ns: "Site", key: "hBooking", cn: "订座", xlOnly: true },
  { href: "/gallery", ns: "Common", key: "gallery", cn: "画廊" },
  { href: "/events", ns: "Common", key: "events", cn: "宴会" },
  { href: "/blog", ns: "Common", key: "blog", cn: "博客" },
  { href: "/about", ns: "Common", key: "about", cn: "关于" },
  { href: "/contact", ns: "Common", key: "contact", cn: "联系" },
];

/** Bosh sahifa — faqat mobil menyuda va footer'da (header'da logo shu vazifada) */
export const HOME_ITEM: NavItem = { href: "/", ns: "Common", key: "home", cn: "首页" };

/**
 * Tepasida qizil/tungi hero bor sahifalar — header u yerda shaffof boshlanadi.
 * Qolganlarida (krem hero'li bron/blog/biz haqimizda, blog maqolasi, kabinet va h.k.) header doim to'q.
 */
const HERO_ROUTES = new Set(["/", "/menu", "/gallery", "/events", "/contact"]);

export function hasDarkHero(pathname: string) {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return HERO_ROUTES.has(p);
}

/** Havola faolmi: aniq mos yoki bo'lim ichidagi sahifa (/blog/maqola -> /blog) */
export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** "+998 90 503 15 68" -> "tel:+998905031568" */
export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Header/mobil menyudagi aloqa ma'lumotlari (admin Sozlamalar'idan) */
export type HeaderContact = { phone: string; address: string; instagram?: string; telegram?: string };
