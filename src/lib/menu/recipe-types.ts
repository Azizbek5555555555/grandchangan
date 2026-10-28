import type { P } from "@/components/three/palette";

/**
 * Taomning qatlamli 3D sahnasi uchun "retsept" turlari (recipes.ts — ma'lumot, ExplodedDishScene — chizish).
 * Faqat turlar: three.js'ga bog'liq emas, server ham import qiladi.
 */

/** Idish (eng pastki qatlam) */
export type Vessel =
  | "bowl" | "deepPlate" | "plate" | "clayPot" | "steamer" | "mortar" | "board" | "fishPlatter"
  | "skewers" | "glass" | "bottle" | "cup";

/** Masalliq turi — har biri protsedural model (three/models/DishKit.tsx) */
export type Kind =
  // bosh sahifa lag'mon kosasining asl qatlamlari (kosa koordinatasida, ko'rinishi o'zgarmaydi)
  | "bowlBroth" | "bowlNoodles" | "bowlBeef" | "bowlGreens" | "bowlGarnish"
  // asos / yuza
  | "broth" | "sauce" | "rice" | "noodles" | "liquid" | "cream" | "pancake"
  // go'sht, baliq, dengiz
  | "beef" | "chunk" | "meatball" | "rib" | "skewer" | "roast" | "fish" | "shrimp" | "squid"
  | "shell" | "abalone" | "seaCucumber"
  // tuxum, tofu, xamir
  | "egg" | "tofu" | "dumpling" | "bread" | "sushi" | "sushiTop" | "caviar"
  // sabzavot
  | "strips" | "beans" | "eggplant" | "cucumber" | "slice" | "tomato" | "wedge" | "leaf" | "mushroom"
  | "onion" | "dice" | "pea" | "nut" | "cashew"
  // ziravor va ko'kat
  | "chili" | "scallion" | "sesame" | "herb" | "anise" | "pepper"
  // ichimlik
  | "ice" | "citrus" | "berry" | "straw" | "bottle" | "can";

export type Tint = keyof typeof P;

/** 4 tildagi nom */
export type L4 = { uz: string; ru: string; en: string; zh: string };

export type RecipeLayer = {
  kind: Kind;
  /** Asosiy rang (palette.ts kaliti) — berilmasa masalliqning o'z rangi */
  tint?: Tint;
  /** Bo'laklar soni (berilmasa — masalliq odatiy soni) */
  count?: number;
  /** Shu qatlamda yana bir masalliq (masalan ko'k piyoz + kunjut) — bitta nom ostida */
  with?: { kind: Kind; tint?: Tint; count?: number }[];
  /** Nom: recipes.ts lug'atidagi kalit yoki to'g'ridan-to'g'ri 4 tilda */
  label: string | L4;
};

export type Recipe = {
  vessel: Vessel;
  /** Idish urg'u rangi (lab/hoshiya) yoki ichimlik shishasi va h.k. */
  vesselTint?: Tint;
  /** Yuqoridan pastga, 2–5 ta (idish — avtomatik oxirgi, 6-qatlam) */
  layers: RecipeLayer[];
};

/** Sahnaga beriladigan tayyor shakl: qatlamlar pastdan yuqoriga (idish — 0) */
export type SceneLayer = { kind: Kind | "vessel"; tint?: Tint; count?: number; with?: { kind: Kind; tint?: Tint; count?: number }[] };
export type SceneRecipe = { vessel: Vessel; vesselTint?: Tint; layers: SceneLayer[] };
