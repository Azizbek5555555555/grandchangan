import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("Common");
  const st = await getTranslations("Site");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-ink text-brand-cream">
      <h1 className="mb-2 text-6xl font-bold text-brand-gold">404</h1>
      <p className="mb-6 text-brand-cream/70">{st("notFound")}</p>
      <Link href="/" className="rounded-full bg-brand-gold px-6 py-2 text-content">
        {t("home")}
      </Link>
    </main>
  );
}
