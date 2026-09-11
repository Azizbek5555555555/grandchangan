import { setRequestLocale } from "next-intl/server";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import PageHero from "@/components/site/PageHero";
import EventForm from "@/components/site/EventForm";
import Reveal from "@/components/motion/Reveal";
export default async function EventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <SiteHeader />
      <PageHero title="Tadbirlar va bazmlar" subtitle="To'y, yubiley, korporativ tadbirlar" />
      <div className="mx-auto max-w-4xl px-5 py-16">
        <Reveal className="mx-auto mb-10 max-w-lg text-center text-neutral-500">
          Zal va menyuni band qiling. Ariza qoldiring — biz siz bilan bog'lanamiz.
        </Reveal>
        <Reveal delay={0.1}><EventForm /></Reveal>
      </div>
      <SiteFooter locale={locale} />
    </>
  );
}
