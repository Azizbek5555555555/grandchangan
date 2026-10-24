import type { Metadata } from "next";
import { Playfair_Display, Inter, Dela_Gothic_One, Ma_Shan_Zheng } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import SmoothScroll from "@/components/motion/SmoothScroll";
import CustomCursor from "@/components/site/CustomCursor";
import "../globals.css";

const serif = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif-var",
  display: "swap",
});
const sans = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans-var",
  display: "swap",
});
// Afisha uslubidagi jasur sarlavhalar (hero va bo'lim sarlavhalari)
const poster = Dela_Gothic_One({
  subsets: ["latin", "cyrillic"],
  weight: "400",
  variable: "--font-poster-var",
  display: "swap",
});
// Xitoycha mo'yqalam yozuvi — faqat bezak (长安, 招牌菜). Brauzer faqat kerakli belgilar bo'lagini yuklaydi
const cn = Ma_Shan_Zheng({
  weight: "400",
  variable: "--font-cn-var",
  display: "swap",
  preload: false,
});

// Sarlavha va tavsif sahifa tilida — Google'da turistlar o'z tilida ko'radi
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale, namespace: "Meta" });
  return { title: t("title"), description: t("description") };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning className={`${serif.variable} ${sans.variable} ${poster.variable} ${cn.variable}`}>
      <body className="min-h-screen antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark');}catch(e){}`,
          }}
        />
        <CustomCursor />
        <NextIntlClientProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
