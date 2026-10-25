/**
 * Bosh sahifa bo'limlari uchun tayyorlangan (serializatsiya qilinadigan) ma'lumot turlari.
 * Server (page.tsx) bazadan o'qib, shu shaklga keltiradi — klient komponentlariga Decimal/Json o'tmaydi.
 */

export type HomeDish = {
  id: string;
  /** Sahifa tilidagi nom */
  name: string;
  /** Xitoycha nom (bezak uchun) — sahifa tili zh bo'lsa yoki nom bo'lmasa null */
  zh: string | null;
  desc: string;
  /** Amaldagi narx (chegirma bo'lsa — chegirmali) */
  price: number;
  /** Chegirma bo'lsa — eski narx (ustidan chiziladi) */
  oldPrice: number | null;
  img: string | null;
  /** Achchiqlik darajasi: 0 (yo'q) … 4 (juda achchiq) */
  spicy: number;
  veg: boolean;
  halal: boolean;
  grams: number | null;
  mins: number | null;
  catId: string;
  catName: string;
  /** Rasm yo'q bo'lganda zaxira panelidagi belgi (kategoriyaning xitoycha nomidan) */
  glyph: string;
};

export type HomeCategory = {
  id: string;
  name: string;
  zh: string | null;
  /** Kategoriyadagi mavjud taomlar soni */
  count: number;
  glyph: string;
  dishes: HomeDish[];
};

export type HomeReview = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  /** Sahna foni: mijoz rasmi → sharh qilingan taom rasmi → galereya rasmi */
  img: string | null;
  /** Sharh bog'langan taom nomi (sahifa tilida) */
  dish: string | null;
};
