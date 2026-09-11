"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { adminLoginAction } from "@/lib/auth/actions";

export default function AdminLoginPage() {
  const t = useTranslations("Admin");
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "uz";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    const res = await adminLoginAction(email, password);
    setLoading(false);
    if (res.ok) {
      router.replace(`/${locale}/admin/dashboard`);
      router.refresh();
    } else {
      setError(res.error || "Xatolik");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-ink px-4">
      <div className="w-full max-w-sm rounded-2xl border border-brand-gold/20 bg-white p-8 shadow-xl">
        <h1 className="mb-1 text-center text-2xl font-bold text-brand-ink">
          {t("panel")}
        </h1>
        <p className="mb-6 text-center text-sm text-neutral-500">
          {t("login_title")}
        </p>

        <label className="mb-1 block text-sm font-medium text-neutral-700">
          {t("email")}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-brand-red"
          placeholder="admin@grandchangan.uz"
        />

        <label className="mb-1 block text-sm font-medium text-neutral-700">
          {t("password")}
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          className="mb-4 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-brand-red"
          placeholder="••••••••"
        />

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={onSubmit}
          disabled={loading}
          className="w-full rounded-lg bg-brand-red py-2.5 font-medium text-white transition hover:bg-brand-red-dark disabled:opacity-60"
        >
          {loading ? "..." : t("signin")}
        </button>
      </div>
    </main>
  );
}
