import { Link } from "@/i18n/navigation";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-ink text-brand-cream">
      <h1 className="mb-2 text-6xl font-bold text-brand-gold">404</h1>
      <p className="mb-6 text-brand-cream/70">Sahifa topilmadi</p>
      <Link href="/" className="rounded-full bg-brand-gold px-6 py-2 text-brand-ink">
        Bosh sahifa
      </Link>
    </main>
  );
}
