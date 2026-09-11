import { setRequestLocale } from "next-intl/server";
import ReservationFlow from "@/components/site/ReservationFlow";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import PageHero from "@/components/site/PageHero";

export default async function ReservationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <SiteHeader />
      <PageHero title="Stol band qilish" subtitle="Zal xaritasidan stolingizni tanlang" />
      <ReservationFlow locale={locale} />
      <SiteFooter locale={locale} />
    </>
  );
}
