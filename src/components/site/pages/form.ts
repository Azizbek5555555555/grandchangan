/**
 * Sayt formalari uchun umumiy klasslar (bron, tadbir, kirish).
 * Balandlik ≥ 48px, shrift 16px (iOS fokusda sahifani kattalashtirmasin), faqat tokenlar.
 */
export const fieldCls =
  "block h-12 w-full rounded-2xl border border-line bg-paper px-4 text-base text-content outline-none transition placeholder:text-muted focus:border-fire focus:ring-4 focus:ring-fire/15 disabled:opacity-60";

export const areaCls =
  "block w-full resize-y rounded-2xl border border-line bg-paper px-4 py-3 text-base text-content outline-none transition placeholder:text-muted focus:border-fire focus:ring-4 focus:ring-fire/15";

export const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-muted";

/** Xato xabari bloki */
export const errorCls = "rounded-2xl border border-fire/30 bg-fire/10 px-4 py-3 text-sm text-danger";
