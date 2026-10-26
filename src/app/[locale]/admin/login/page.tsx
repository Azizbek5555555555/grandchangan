"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { adminLoginAction } from "@/lib/auth/actions";
import LocaleSwitcher from "@/components/site/LocaleSwitcher";
import { ui } from "@/components/admin/ui/styles";
import { cn } from "@/lib/utils";

export default function AdminLoginPage() {
  const t = useTranslations("Admin");
  const tu = useTranslations("AdminUi.login");
  const st = useTranslations("Site");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await adminLoginAction(email, password);
      if (res.ok) {
        router.replace("/admin");
        router.refresh();
      } else {
        setError(res.error || st("errGeneric"));
      }
    } catch {
      // Server/baza javob bermasa tugma "..." holatida qotib qolmasin
      setError(st("errGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-night text-brand-cream">
      {/* Yumshoq iliq yorug'lik (tokenlar orqali) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_55%_at_50%_-10%,color-mix(in_oklab,var(--color-brand-gold)_18%,transparent),transparent_60%),radial-gradient(60%_50%_at_100%_110%,color-mix(in_oklab,var(--color-fire)_30%,transparent),transparent_60%)]"
      />
      <div className="relative flex justify-end px-4 pt-4 sm:px-6">
        <LocaleSwitcher variant="inline" />
      </div>

      <main className="relative flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <span
              aria-hidden="true"
              lang="zh"
              className="font-cn mb-4 flex h-16 w-9 items-center justify-center rounded-[2px] border border-brand-gold/40 bg-fire text-base leading-[1.05] text-brand-cream shadow-lg shadow-night/60 [writing-mode:vertical-rl]"
            >
              长安
            </span>
            <p className="font-display text-3xl leading-tight text-brand-cream">GrandChangan</p>
            <p className="mt-2 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-brand-gold-light">
              <span aria-hidden="true" className="h-px w-6 bg-brand-gold/50" />
              {t("panel")}
              <span aria-hidden="true" className="h-px w-6 bg-brand-gold/50" />
            </p>
          </div>

          <form onSubmit={onSubmit} className="rounded-2xl border border-brand-gold/25 bg-card p-6 text-content shadow-2xl shadow-night/60 sm:p-8">
            <h1 className="font-display text-2xl leading-snug text-content">{tu("title")}</h1>
            <p className="mb-6 mt-1 text-sm text-muted">{t("login_title")}</p>

            <label className="mb-4 block">
              <span className={ui.label}>{t("email")}</span>
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={ui.input}
                placeholder="admin@grandchangan.uz"
              />
            </label>

            <label className="mb-5 block">
              <span className={ui.label}>{t("password")}</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={ui.input}
                placeholder="••••••••"
              />
            </label>

            {error && (
              <p role="alert" className="mb-4 rounded-xl bg-fire/10 px-3 py-2 text-sm text-fire-ink">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} aria-busy={loading} className={cn(ui.btnPrimary, "w-full min-h-12 text-base")}>
              {loading ? tu("signingIn") : t("signin")}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-brand-cream/45">{tu("staffOnly")}</p>
        </div>
      </main>
    </div>
  );
}
