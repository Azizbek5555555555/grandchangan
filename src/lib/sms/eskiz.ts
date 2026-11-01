import "server-only";

/*
 * Eskiz.uz SMS shlyuzi (https://notify.eskiz.uz). Railway o'zgaruvchilari:
 *   ESKIZ_EMAIL, ESKIZ_PASSWORD — Eskiz kabinetiga kirish; ESKIZ_FROM — yuboruvchi nomi (standart "4546").
 * Muhim: Eskiz faqat moderatsiyadan o'tgan matn shablonlarini yuboradi (kabinet → "Shablonlar").
 * Shartnoma tuzilmaguncha akkaunt sinov rejimida — faqat Eskiz'ning sinov matni yuboriladi.
 */

const BASE = "https://notify.eskiz.uz/api";

let cached: { token: string; exp: number } | null = null;

export const eskizConfigured = () => !!(process.env.ESKIZ_EMAIL && process.env.ESKIZ_PASSWORD);

/** Eskiz javobidan odam o'qiydigan xato matni */
function errorText(data: unknown, status: number): string {
  const d = data as { message?: unknown; status?: unknown; data?: unknown } | null;
  const msg = typeof d?.message === "string" ? d.message : d?.message ? JSON.stringify(d.message) : "";
  return msg || `HTTP ${status}`;
}

async function login(): Promise<{ token: string | null; error?: string }> {
  const form = new FormData();
  form.append("email", process.env.ESKIZ_EMAIL || "");
  form.append("password", process.env.ESKIZ_PASSWORD || "");
  try {
    const res = await fetch(`${BASE}/auth/login`, { method: "POST", body: form, signal: AbortSignal.timeout(8000) });
    const data = await res.json().catch(() => null);
    const token = data?.data?.token;
    if (!res.ok || !token) return { token: null, error: errorText(data, res.status) };
    // Token 30 kun amal qiladi — 20 kun keshlanadi
    cached = { token, exp: Date.now() + 1000 * 60 * 60 * 24 * 20 };
    return { token };
  } catch (e) {
    return { token: null, error: `network: ${String(e).slice(0, 120)}` };
  }
}

async function getToken(fresh = false): Promise<{ token: string | null; error?: string }> {
  if (!fresh && cached && cached.exp > Date.now()) return { token: cached.token };
  cached = null;
  return login();
}

export type SmsResult = { ok: boolean; dev?: boolean; error?: string; id?: string };

/**
 * SMS yuborish (raqam: 998XXXXXXXXX). ESKIZ kalitlari bo'lmasa — konsolga chiqaradi (dev rejim).
 * Token eskirgan bo'lsa (401) — qayta kirib, bir marta qayta yuboradi.
 * Hech qachon xato otmaydi: SMS ketmasa ham bron saqlanib qolishi kerak.
 */
export async function sendSms(phone: string, message: string): Promise<SmsResult> {
  const to = phone.replace(/\D/g, "");
  if (!eskizConfigured()) {
    console.log(`[SMS:DEV] -> ${to}: ${message}`);
    return { ok: true, dev: true };
  }
  const attempt = async (fresh: boolean): Promise<SmsResult & { unauthorized?: boolean }> => {
    const { token, error } = await getToken(fresh);
    if (!token) return { ok: false, error: `login: ${error}` };
    const form = new FormData();
    form.append("mobile_phone", to);
    form.append("message", message);
    form.append("from", process.env.ESKIZ_FROM || "4546");
    try {
      const res = await fetch(`${BASE}/message/sms/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) return { ok: false, unauthorized: true, error: errorText(data, res.status) };
      if (!res.ok) return { ok: false, error: errorText(data, res.status) };
      return { ok: true, id: data?.id ? String(data.id) : undefined };
    } catch (e) {
      return { ok: false, error: `network: ${String(e).slice(0, 120)}` };
    }
  };
  let r = await attempt(false);
  if (r.unauthorized) r = await attempt(true);
  if (!r.ok) console.error("[SMS] yuborilmadi:", to, r.error);
  return { ok: r.ok, error: r.error, id: r.id };
}

/** Admin uchun: Eskiz ulanganmi, kirish ishlayaptimi, balans */
export async function eskizStatus(): Promise<{ configured: boolean; auth: boolean; balance: number | null; error?: string }> {
  if (!eskizConfigured()) return { configured: false, auth: false, balance: null };
  const { token, error } = await getToken(true);
  if (!token) return { configured: true, auth: false, balance: null, error };
  try {
    const res = await fetch(`${BASE}/user/get-limit`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) });
    const data = await res.json().catch(() => null);
    const balance = Number(data?.data?.balance);
    return { configured: true, auth: true, balance: Number.isFinite(balance) ? balance : null };
  } catch {
    return { configured: true, auth: true, balance: null };
  }
}
