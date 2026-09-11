import "server-only";

const BASE = "https://notify.eskiz.uz/api";

let cached: { token: string; exp: number } | null = null;

async function getToken(): Promise<string | null> {
  const email = process.env.ESKIZ_EMAIL;
  const password = process.env.ESKIZ_PASSWORD;
  if (!email || !password) return null;
  if (cached && cached.exp > Date.now()) return cached.token;

  const form = new FormData();
  form.append("email", email);
  form.append("password", password);

  const res = await fetch(`${BASE}/auth/login`, { method: "POST", body: form });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const token = data?.data?.token;
  if (!token) return null;
  cached = { token, exp: Date.now() + 1000 * 60 * 60 * 24 * 20 };
  return token;
}

/**
 * SMS yuborish. ESKIZ kalitlari bo'lmasa — konsolga chiqaradi (dev rejim).
 * Eslatma: Eskiz'da faqat moderatsiyadan o'tgan shablonlar yuboriladi.
 */
export async function sendSms(phone: string, message: string) {
  const to = phone.replace(/\D/g, "");
  const token = await getToken();
  if (!token) {
    console.log(`[SMS:DEV] -> ${to}: ${message}`);
    return { ok: true, dev: true };
  }
  const form = new FormData();
  form.append("mobile_phone", to);
  form.append("message", message);
  form.append("from", process.env.ESKIZ_FROM || "4546");

  const res = await fetch(`${BASE}/message/sms/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}
