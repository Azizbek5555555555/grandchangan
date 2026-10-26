import type { SpicyLevel } from "@prisma/client";

/**
 * Clopos eksportidan (Aziz, 2026-10-26) tanlangan 15 ta taom — admin → Menyu → "Namuna taomlarni qo'shish"
 * tugmasi bazaga bir marta qo'shadi (slug bo'yicha: bor taom qayta yaratilmaydi). Narxlar — Clopos'dagi narx.
 * Rasm yo'q (admin yuklaydi) — saytda chiroyli tarelka zaxirasi chiqadi.
 */

type L = { uz: string; ru: string; en: string; zh: string };

export type SampleCategory = { slug: string; name: L };

export type SampleDish = {
  slug: string;
  cat: string;
  name: L;
  description: L;
  price: number;
  spicy: SpicyLevel;
  veg?: boolean;
  featured?: boolean;
};

/** Seed'dagi kategoriyalar bilan bir xil slug'lar; bazada bo'lmasa yaratiladi */
export const SAMPLE_CATEGORIES: SampleCategory[] = [
  { slug: "signature", name: { uz: "Firma taomlari", ru: "Фирменные блюда", en: "Signature dishes", zh: "招牌菜" } },
  { slug: "cold", name: { uz: "Sovuq taomlar", ru: "Холодные блюда", en: "Cold dishes", zh: "凉菜" } },
  { slug: "hot", name: { uz: "Issiq taomlar", ru: "Горячие блюда", en: "Hot dishes", zh: "热菜" } },
  { slug: "soup", name: { uz: "Sho'rvalar", ru: "Супы", en: "Soups", zh: "汤类" } },
  { slug: "dimsum", name: { uz: "Dim sum", ru: "Дим сам", en: "Dim sum", zh: "点心" } },
  { slug: "noodles", name: { uz: "Lag'mon va noodle", ru: "Лапша", en: "Noodles", zh: "面食" } },
  { slug: "rice", name: { uz: "Guruch taomlari", ru: "Рис", en: "Rice", zh: "米饭" } },
];

export const SAMPLE_DISHES: SampleDish[] = [
  {
    slug: "peking-duck", cat: "signature", price: 880000, spicy: "NONE", featured: true,
    name: { uz: "Pekincha o'rdak (butun)", ru: "Утка по-пекински (целая)", en: "Peking duck (whole)", zh: "北京烤鸭（整只）" },
    description: {
      uz: "Qarsildoq terili, tandirda pishgan o'rdak — yupqa blinchiklar, bodring, ko'k piyoz va shirin sous bilan.",
      ru: "Утка с хрустящей кожицей — с тонкими блинчиками, огурцом, зелёным луком и сладким соусом.",
      en: "Roast duck with crisp skin, served with thin pancakes, cucumber, spring onion and sweet bean sauce.",
      zh: "皮脆肉嫩的烤鸭，配薄饼、黄瓜、葱丝和甜面酱。",
    },
  },
  {
    slug: "gansu-hand-lamb", cat: "signature", price: 226000, spicy: "NONE", featured: true,
    name: { uz: "Gansucha qo'lda yeyiladigan qo'y go'shti", ru: "Баранина по-ганьсуйски «ручной захват»", en: "Gansu hand-held lamb", zh: "甘肃手抓羊肉" },
    description: {
      uz: "Ziravorlar bilan sekin qaynatilgan yumshoq qo'y go'shti — sarimsoqli sous bilan, qo'lda yeyiladi.",
      ru: "Нежная баранина, томлённая со специями, подаётся с чесночным соусом — едят руками.",
      en: "Tender lamb slowly simmered with spices, served with garlic dip — traditionally eaten by hand.",
      zh: "香料慢炖的嫩羊肉，配蒜泥蘸料，传统手抓食用。",
    },
  },
  {
    slug: "squirrel-fish", cat: "signature", price: 300000, spicy: "NONE",
    name: { uz: "Shirin-nordon qaylada \"Olmaxon\" baliq", ru: "Рыба «Белочка» в кисло-сладком соусе", en: "\"Squirrel\" fish in sweet & sour sauce", zh: "糖醋乌兹松鼠鱼" },
    description: {
      uz: "Kesilib, qarsildoq qilib qovurilgan karp baliq — yorqin shirin-nordon pomidor qaylasi bilan.",
      ru: "Надрезанный и обжаренный до хруста карп под ярким кисло-сладким томатным соусом.",
      en: "Scored carp fried until crisp, glazed with a bright sweet-and-sour tomato sauce.",
      zh: "鲤鱼切花炸至酥脆，浇上酸甜番茄汁。",
    },
  },
  {
    slug: "xinjiang-noodles", cat: "signature", price: 78000, spicy: "MILD",
    name: { uz: "Shinjoncha go'shtli lag'mon", ru: "Лапша по-синьцзянски с жареным мясом", en: "Xinjiang noodles with stir-fried meat", zh: "新疆过油肉拌面" },
    description: {
      uz: "Qo'lda cho'zilgan lag'mon — qovurilgan go'sht, bulg'or qalampiri va pomidor bilan.",
      ru: "Тянутая вручную лапша с обжаренным мясом, болгарским перцем и томатами.",
      en: "Hand-pulled noodles topped with stir-fried meat, bell peppers and tomatoes.",
      zh: "手工拉面配过油肉、青椒和番茄。",
    },
  },
  {
    slug: "kung-pao-chicken", cat: "hot", price: 108000, spicy: "MEDIUM", featured: true,
    name: { uz: "Gunbao tovuq", ru: "Курица Кунг Пао", en: "Kung Pao chicken", zh: "宫保鸡丁" },
    description: {
      uz: "Tovuq bo'laklari yeryong'oq, quritilgan qalampir va shirin-achchiq qayla bilan.",
      ru: "Кусочки курицы с арахисом, сушёным перцем и кисло-сладким пряным соусом.",
      en: "Diced chicken with peanuts, dried chilli and a sweet, tangy, gently numbing glaze.",
      zh: "鸡丁配花生、干辣椒，酸甜微麻。",
    },
  },
  {
    slug: "xinjiang-big-plate-chicken", cat: "hot", price: 228000, spicy: "MEDIUM", featured: true,
    name: { uz: "Shinjoncha katta laganda tovuq", ru: "Курица по-синьцзянски с лапшой", en: "Xinjiang big-plate chicken", zh: "新疆大盘鸡" },
    description: {
      uz: "Kartoshka va qalampir bilan dimlangan tovuq, tagida keng lag'mon — davra uchun katta lagan.",
      ru: "Тушёная курица с картофелем и перцем на широкой лапше — большое блюдо на компанию.",
      en: "Chicken braised with potatoes and peppers over wide noodles — a big plate to share.",
      zh: "鸡块与土豆、青椒同炖，配宽面，适合多人分享。",
    },
  },
  {
    slug: "mapo-tofu", cat: "hot", price: 88000, spicy: "HOT",
    name: { uz: "Mapo tofu", ru: "Тофу «Ма По»", en: "Mapo tofu", zh: "麻婆豆腐" },
    description: {
      uz: "Yumshoq tofu achchiq loviya pastasi va sichuan qalampiri qaylasida.",
      ru: "Нежный тофу в остром соусе из бобовой пасты с сычуаньским перцем.",
      en: "Silky tofu in a fiery bean-paste sauce with Sichuan peppercorn.",
      zh: "嫩豆腐配豆瓣酱与花椒，麻辣鲜香。",
    },
  },
  {
    slug: "sweet-sour-chicken", cat: "hot", price: 126000, spicy: "NONE",
    name: { uz: "Shirin-nordon qarsildoq tovuq", ru: "Хрустящая курица в кисло-сладком соусе", en: "Crispy sweet & sour chicken", zh: "糖醋里脊" },
    description: {
      uz: "Qarsildoq qovurilgan tovuq filesi yaltiroq shirin-nordon qaylada.",
      ru: "Хрустящее куриное филе в глянцевом кисло-сладком соусе.",
      en: "Crispy fried chicken fillet tossed in a glossy sweet-and-sour sauce.",
      zh: "外酥里嫩的里脊，裹上亮泽的糖醋汁。",
    },
  },
  {
    slug: "sichuan-boiled-beef", cat: "hot", price: 228000, spicy: "EXTRA_HOT",
    name: { uz: "Sichuancha qaynatilgan achchiq mol go'shti", ru: "Острая отварная говядина по-сычуаньски", en: "Sichuan boiled beef", zh: "水煮牛肉" },
    description: {
      uz: "Yupqa mol go'shti bo'laklari qalampirli achchiq sho'rvada, ustidan qizdirilgan moy quyiladi.",
      ru: "Тонкие ломтики говядины в остром бульоне с перцем, политые раскалённым маслом.",
      en: "Tender beef slices poached in a fiery chilli broth and finished with sizzling oil.",
      zh: "嫩牛肉片浸于麻辣红汤，淋热油激香。",
    },
  },
  {
    slug: "tomato-egg", cat: "hot", price: 68000, spicy: "NONE", veg: true,
    name: { uz: "Pomidorli tuxum qovurmasi", ru: "Яичница с помидорами", en: "Stir-fried tomato and egg", zh: "西红柿炒鸡蛋" },
    description: {
      uz: "Xitoyning eng sevimli uy taomi — yumshoq tuxum va shirali pomidor.",
      ru: "Любимое домашнее блюдо Китая — нежные яйца и сочные томаты.",
      en: "China's favourite home dish — fluffy eggs with juicy tomatoes.",
      zh: "中国家常名菜——嫩滑鸡蛋配多汁番茄。",
    },
  },
  {
    slug: "changan-beef-slices", cat: "cold", price: 160000, spicy: "MILD",
    name: { uz: "Chang'ancha \"Dadao\" mol go'shti bo'laklari", ru: "Ломтики говядины «Чанган Дадао»", en: "Chang'an \"Dadao\" beef slices", zh: "长安大刀牛肉片" },
    description: {
      uz: "Ziravorlarda pishirilgan mol go'shti, yupqa to'g'ralib, sovuq tortiladi — sarimsoq va chilli moyi bilan.",
      ru: "Говядина, томлённая в специях, тонко нарезанная и подаваемая холодной — с чесноком и маслом чили.",
      en: "Spice-braised beef, thinly sliced and served cold with garlic and chilli oil.",
      zh: "卤制牛肉切薄片冷食，配蒜泥红油。",
    },
  },
  {
    slug: "yangzhou-fried-rice", cat: "rice", price: 98000, spicy: "NONE",
    name: { uz: "Yanchjoucha qovurilgan guruch", ru: "Янчжоуский жареный рис", en: "Yangzhou fried rice", zh: "扬州蛋炒饭" },
    description: {
      uz: "Tuxum, qisqichbaqa, sabzavotlar va ko'k no'xat bilan qovurilgan guruch.",
      ru: "Жареный рис с яйцом, креветками, овощами и зелёным горошком.",
      en: "Wok-fried rice with egg, shrimp, vegetables and green peas.",
      zh: "鸡蛋、虾仁、蔬菜和青豆同炒的米饭。",
    },
  },
  {
    slug: "youpo-noodles", cat: "noodles", price: 68000, spicy: "MEDIUM",
    name: { uz: "Yupo cho'zma lag'mon", ru: "Юпо чэмянь", en: "Youpo hand-pulled noodles", zh: "油泼扯面" },
    description: {
      uz: "Keng qo'lda cho'zilgan lag'mon — chilli, sarimsoq va qaynoq moy quyib tayyorlanadi, Shensi uslubida.",
      ru: "Широкая тянутая лапша, политая горячим маслом с чили и чесноком, по-шэньсийски.",
      en: "Wide hand-pulled noodles dressed with chilli, garlic and sizzling hot oil, Shaanxi style.",
      zh: "陕西宽扯面，泼上热油、辣椒面和蒜末。",
    },
  },
  {
    slug: "beef-celery-dumplings", cat: "dimsum", price: 86000, spicy: "NONE",
    name: { uz: "Mol go'shti va selderey chuchvarasi", ru: "Пельмени с говядиной и сельдереем", en: "Beef and celery dumplings", zh: "牛肉芹菜饺子" },
    description: {
      uz: "Qo'lda tugilgan chuchvaralar — shirali mol go'shti va yangi selderey bilan.",
      ru: "Пельмени ручной лепки с сочной говядиной и свежим сельдереем.",
      en: "Hand-folded dumplings filled with juicy beef and fresh celery.",
      zh: "手工包制，牛肉多汁，芹菜清香。",
    },
  },
  {
    slug: "tofu-chicken-soup", cat: "soup", price: 108000, spicy: "NONE",
    name: { uz: "Tofuli tovuq sho'rva", ru: "Куриный бульон с тофу", en: "Chicken soup with tofu", zh: "豆腐鸡汤" },
    description: {
      uz: "Uzoq qaynatilgan tiniq tovuq sho'rvasi — yumshoq tofu va ko'katlar bilan.",
      ru: "Прозрачный долго томлёный куриный бульон с нежным тофу и зеленью.",
      en: "Clear, slow-simmered chicken broth with silky tofu and greens.",
      zh: "慢炖清鸡汤，配嫩豆腐与青菜。",
    },
  },
];
