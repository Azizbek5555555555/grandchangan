import type { RefObject } from "react";

// Har bir lazy sahna oladigan props (Lazy3D uzatadi)
export type SceneProps = {
  /** viewport yaqinida — true bo'lsa render qilinadi, aks holda frameloop "never" */
  active: boolean;
  /** prefers-reduced-motion — bitta statik kadr */
  reduced: boolean;
  /** window.innerWidth < 768 — kamroq zarracha/segment */
  mobile: boolean;
  /** scroll progress hisoblash uchun konteyner */
  trackRef: RefObject<HTMLDivElement | null>;
  /** WebGL konteksti yo'qoldi — hech narsa ko'rsatilmaydi */
  onFail: () => void;
  /** birinchi kadr tayyor — konteyner ko'rinadi */
  onReady: () => void;
};
