"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
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
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-fire px-4 py-16">
      <span aria-hidden="true" className="lattice-bg absolute inset-0 -z-10 text-fire-deep/60" />
      <span aria-hidden="true" lang="zh" className="font-cn pointer-events-none absolute -right-8 bottom-0 -z-10 select-none text-[16rem] leading-none text-fire-deep sm:text-[24rem]">长安</span>
      <Link href="/" className="mb-8 flex items-center gap-3 text-brand-cream">
        <span lang="zh" className="font-cn text-4xl text-saffron">长安</span>
        <span className="font-poster text-lg leading-none">GRAND<br />CHANGAN</span>
      </Link>
      <div className="w-full max-w-sm rounded-3xl bg-card p-8 shadow-2xl shadow-night/40">
        <h1 className="mb-6 text-center font-display text-3xl text-content">{tc("login")}</h1>
        {step === 1 ? (
          <div className="space-y-4">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" className="h-12 w-full rounded-xl border border-line bg-paper px-4 text-base text-content outline-none transition focus:border-fire focus:ring-2 focus:ring-fire/20" />
            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              onClick={() => submit(() => requestOtpAction(phone), () => setStep(2))}
              disabled={loading || phone.length < 7}
              className="h-12 w-full rounded-full bg-fire font-semibold text-brand-cream transition hover:bg-fire-deep disabled:opacity-50"
            >
              {loading ? "..." : ta("sendCode")}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={st("rNamePh")} className="h-12 w-full rounded-xl border border-line bg-paper px-4 text-base text-content outline-none transition focus:border-fire focus:ring-2 focus:ring-fire/20" />
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={ta("codePh")} className="h-12 w-full rounded-xl border border-line bg-paper px-4 text-base text-content outline-none transition focus:border-fire focus:ring-2 focus:ring-fire/20 text-center text-lg tracking-widest" />
            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              onClick={() => submit(() => verifyOtpAction(phone, name, code), () => router.replace("/account"))}
              disabled={loading || code.length < 4}
              className="h-12 w-full rounded-full bg-fire font-semibold text-brand-cream transition hover:bg-fire-deep disabled:opacity-50"
            >
              {loading ? "..." : ta("confirm")}
            </button>
            <button onClick={() => setStep(1)} className="min-h-11 w-full text-sm text-muted hover:text-content">{ta("changeNumber")}</button>
          </div>
        )}
      </div>
    </div>
  );
}
