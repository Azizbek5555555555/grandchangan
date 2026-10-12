"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { requestOtpAction, verifyOtpAction } from "@/lib/auth/actions";

export default function CustomerLoginPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "uz";
  const router = useRouter();
  const ta = useTranslations("Account");
  const tc = useTranslations("Common");
  const st = useTranslations("Site");
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Server/baza javob bermasa tugma "..." holatida qotib qolmasin
  async function submit(action: () => Promise<{ ok: boolean; error?: string }>, onOk: () => void) {
    setError(null);
    setLoading(true);
    try {
      const r = await action();
      if (r.ok) onOk();
      else setError(r.error || st("errGeneric"));
    } catch {
      setError(st("errGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-2 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-content">{tc("login")}</h1>
        {step === 1 ? (
          <div className="space-y-4">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" className="w-full rounded-lg border border-line px-3 py-2.5" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={() => submit(() => requestOtpAction(phone), () => setStep(2))}
              disabled={loading || phone.length < 7}
              className="w-full rounded-lg bg-brand-red py-2.5 font-medium text-white hover:bg-brand-red-dark disabled:opacity-50"
            >
              {loading ? "..." : ta("sendCode")}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={st("rNamePh")} className="w-full rounded-lg border border-line px-3 py-2.5" />
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={ta("codePh")} className="w-full rounded-lg border border-line px-3 py-2.5 text-center text-lg tracking-widest" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={() => submit(() => verifyOtpAction(phone, name, code), () => router.replace("/account"))}
              disabled={loading || code.length < 4}
              className="w-full rounded-lg bg-brand-red py-2.5 font-medium text-white hover:bg-brand-red-dark disabled:opacity-50"
            >
              {loading ? "..." : ta("confirm")}
            </button>
            <button onClick={() => setStep(1)} className="w-full text-sm text-muted">{ta("changeNumber")}</button>
          </div>
        )}
      </div>
    </div>
  );
}
