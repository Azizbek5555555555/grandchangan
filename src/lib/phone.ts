/**
 * Telefon raqamlari: O'zbekiston mobil raqamini tekshirish (operator kodlari bo'yicha), chet ellik mehmon uchun
 * WhatsApp/Telegram aloqasi. Klient (forma) va server (actions) bir xil qoidadan foydalanadi.
 *
 * Bronda raqam bazadagi `guestPhone` maydonida saqlanadi (schema o'zgarmagan):
 *   mahalliy — "998901234567" (SMS boradi);
 *   chet ellik — "wa:+447700900123" (WhatsApp) yoki "tg:+447700900123" / "tg:@username" (Telegram) — SMS yuborilmaydi
 *   (Eskiz chet el raqamlariga yubora olmaydi), menejer messenjer orqali bog'lanadi;
 *   admin kiritgan xalqaro raqam — "+447700900123".
 */

/**
 * O'zbekiston mobil operatorlari kodlari (+998 dan keyingi 2 raqam):
 * Beeline 90, 91 · Ucell 93, 94, 50 · Mobiuz 97, 88, 87 · Uzmobile 99, 95, 77, 55 · Humans 33 · OQ 20 · Perfectum 98, 80.
 * Yangi kod paydo bo'lsa — shu ro'yxatga qo'shing.
 */
export const UZ_MOBILE_CODES = ["20", "33", "50", "55", "77", "80", "87", "88", "90", "91", "93", "94", "95", "97", "98", "99"];

/** O'zbekiston mobil raqami → "998XXXXXXXXX" yoki null (operator kodi noma'lum / uzunligi noto'g'ri) */
export function parseUzPhone(input: string): string | null {
  let d = (input || "").replace(/\D/g, "");
  if (d.startsWith("998")) d = d.slice(3);
  else if (d.startsWith("8") && d.length === 10) d = d.slice(1); // eski "8 90 ..." yozuvi
  if (d.length !== 9) return null;
  if (!UZ_MOBILE_CODES.includes(d.slice(0, 2))) return null;
  return `998${d}`;
}

/** Xalqaro raqam (E.164: + davlat kodi, jami 8–15 raqam) → "+digits" yoki null */
export function parseIntlPhone(input: string): string | null {
  const s = (input || "").trim();
  const d = s.replace(/\D/g, "").replace(/^00/, "");
  if (d.length < 8 || d.length > 15 || d.startsWith("0")) return null;
  return `+${d}`;
}

/** Telegram: xalqaro raqam yoki @username (5–32 belgi) → "+digits" / "@username" yoki null */
export function parseTelegram(input: string): string | null {
  const s = (input || "").trim();
  const user = s.replace(/^https?:\/\/t\.me\//i, "").replace(/^@/, "");
  if (/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(user)) return `@${user}`;
  return parseIntlPhone(s);
}

export type Residency = "local" | "foreign";
export type Messenger = "whatsapp" | "telegram";

/** Bron formasi qiymatlaridan saqlanadigan qiymat (yoki null — noto'g'ri) */
export function encodeGuestContact(residency: Residency, messenger: Messenger, input: string): string | null {
  if (residency === "local") return parseUzPhone(input);
  if (messenger === "telegram") {
    const v = parseTelegram(input);
    return v ? `tg:${v}` : null;
  }
  const v = parseIntlPhone(input);
  return v ? `wa:${v}` : null;
}

export type GuestContact = {
  kind: "sms" | "whatsapp" | "telegram" | "intl";
  /** Ko'rsatish uchun: "+998 90 123 45 67", "+44 7700900123", "@username" */
  display: string;
  /** Bog'lanish havolasi: tel:, https://wa.me/, https://t.me/ */
  href: string;
  /** Eskiz SMS yuborsa bo'ladimi (faqat O'zbekiston raqami) */
  sms: boolean;
};

const fmtUz = (d: string) => `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`;

/** Saqlangan qiymat → aloqa turi, ko'rinishi va havolasi */
export function guestContact(stored: string): GuestContact {
  const s = stored || "";
  if (s.startsWith("wa:")) {
    const v = s.slice(3);
    return { kind: "whatsapp", display: v, href: `https://wa.me/${v.replace(/\D/g, "")}`, sms: false };
  }
  if (s.startsWith("tg:")) {
    const v = s.slice(3);
    return { kind: "telegram", display: v, href: v.startsWith("@") ? `https://t.me/${v.slice(1)}` : `https://t.me/+${v.replace(/\D/g, "")}`, sms: false };
  }
  if (s.startsWith("+") && !s.startsWith("+998")) {
    return { kind: "intl", display: s, href: `tel:${s.replace(/[^\d+]/g, "")}`, sms: false };
  }
  const d = s.replace(/\D/g, "");
  return { kind: "sms", display: d.length === 12 ? fmtUz(d) : s, href: `tel:+${d}`, sms: d.length === 12 && d.startsWith("998") };
}
