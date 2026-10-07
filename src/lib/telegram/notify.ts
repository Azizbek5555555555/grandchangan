import "server-only";

/** Telegram HTML rejimi uchun foydalanuvchi kiritgan matnni xavfsiz qilish (<, >, &) */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Admin guruhiga/chatga Telegram xabari. Token bo'lmasa konsolga chiqaradi.
 * Hech qachon xato otmaydi: bildirishnoma yuborilmasa ham bron/buyurtma saqlanib qolishi kerak.
 * Foydalanuvchi kiritgan qismlarni escapeHtml() bilan o'rab yuboring.
 */
export async function notifyTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log("[TG:DEV]", text);
    return { ok: true, dev: true };
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error("[TG] xabar yuborilmadi:", res.status, await res.text().catch(() => ""));
    }
    return { ok: res.ok };
  } catch (e) {
    console.error("[TG] tarmoq xatosi:", e);
    return { ok: false };
  }
}
