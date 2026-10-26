import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["uz", "ru", "en", "zh"],
  defaultLocale: "uz",
  localePrefix: "as-needed",
  // Til faqat manzildan olinadi ("/" — uz, "/ru", "/en", "/zh"). Cookie/brauzer tili bo'yicha avtomatik
  // yo'naltirish o'chiq: aks holda /en dan "UZ" bosilganda NEXT_LOCALE=en cookie "/" ni yana /en ga qaytarardi
  // va til almashmasdi (Aziz, 2026-10-26).
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
