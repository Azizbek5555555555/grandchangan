import type { SpicyLevel } from "@prisma/client";

/**
 * Clopos menyusidagi 15 ta taom (Aziz, 2026-10-26: Clopos ro'yxatining boshidagi 15 tasi, rasmlari bilan) —
 * admin → Menyu → "Namuna taomlar (15)" tugmasi bazaga qo'shadi. Narx QO'YILMAYDI (0 = saytda narx ko'rinmaydi;
 * admin xohlasa keyin o'zi qo'yadi). Rasmlar — Clopos'dagi rasmlar, Real-ESRGAN bilan 4x kattalashtirilgan,
 * kvadrat qilib kesilgan (burchakdagi Clopos raqami olib tashlangan): public/photos/dishes/<slug>.webp.
 */

type L = { uz: string; ru: string; en: string; zh: string };

export type SampleCategory = { slug: string; name: L };

export type SampleDish = {
  slug: string;
  cat: string;
  name: L;
  description: L;
  spicy: SpicyLevel;
  veg?: boolean;
  featured?: boolean;
};

export const sampleImage = (slug: string) => `/photos/dishes/${slug}.webp`;

/** Seed'dagi kategoriyalar bilan bir xil slug'lar; bazada bo'lmasa yaratiladi */
export const SAMPLE_CATEGORIES: SampleCategory[] = [
  { slug: "cold", name: { uz: "Sovuq taomlar", ru: "Холодные блюда", en: "Cold dishes", zh: "凉菜" } },
  { slug: "hot", name: { uz: "Issiq taomlar", ru: "Горячие блюда", en: "Hot dishes", zh: "热菜" } },
];

/**
 * Oldingi namuna ro'yxatining slug'lari (Clopos'ning boshqa 15 taomi, rasmsiz). Bazada qolgan bo'lsa,
 * tugma ularni shu tartibda yangi taomlarga aylantiradi (id saqlanadi — bron/buyurtma bog'lanishlari buzilmaydi).
 */
export const LEGACY_SAMPLE_SLUGS = [
  "peking-duck", "gansu-hand-lamb", "squirrel-fish", "xinjiang-noodles", "kung-pao-chicken",
  "xinjiang-big-plate-chicken", "mapo-tofu", "sweet-sour-chicken", "sichuan-boiled-beef", "tomato-egg",
  "changan-beef-slices", "yangzhou-fried-rice", "youpo-noodles", "beef-celery-dumplings", "tofu-chicken-soup",
];

/** Oldingi ro'yxatda yaratilgan, endi bo'sh qolishi mumkin bo'lgan kategoriya — bo'sh bo'lsa o'chiriladi */
export const LEGACY_SAMPLE_CATEGORY = "signature";

export const SAMPLE_DISHES: SampleDish[] = [
  {
    slug: "changan-dadao-beef", cat: "cold", spicy: "NONE", featured: true,
    name: { uz: "Chang'an \"Dadao\" mol go'shti tilimlari", ru: "«Чанган Дадао» — ломтики говядины", en: "Chang'an \"Dadao\" sliced beef", zh: "长安大刀牛肉片" },
    description: {
      uz: "Ziravorlarda sekin dimlangan mol go'shti — katta pichoqda yupqa tilimlanib, sovuq holda tortiladi.",
      ru: "Говядина, томлённая в пряностях, нарезается большим ножом тонкими ломтиками и подаётся холодной.",
      en: "Beef braised in aromatic spices, carved into thin slices with a broad cleaver and served cold.",
      zh: "香料卤制的牛肉，大刀切成薄片，冷盘上桌。",
    },
  },
  {
    slug: "shanghai-smoked-fish", cat: "cold", spicy: "NONE", featured: true,
    name: { uz: "Shanxaycha dudlangan baliq", ru: "Шанхайская копчёная рыба", en: "Shanghai smoked fish", zh: "上海熏鱼" },
    description: {
      uz: "Qarsildoq qovurilib, shirin soya-ziravorli qaylaga botirilgan baliq bo'laklari — Shanxayning mashhur sovuq taomi.",
      ru: "Хрустящие кусочки рыбы, пропитанные сладким соево-пряным маринадом, — знаменитая холодная закуска Шанхая.",
      en: "Crisp-fried fish pieces soaked in a sweet soy and spice glaze — a classic Shanghai cold starter.",
      zh: "鱼块炸至酥香，浸入甜咸五香汁，经典上海冷菜。",
    },
  },
  {
    slug: "sour-spicy-lamb-tripe", cat: "cold", spicy: "MEDIUM",
    name: { uz: "Nordon-achchiq qaylada qo'y qorni", ru: "Острые рубцы ягнёнка в кисло-пряном соусе", en: "Hot & sour lamb tripe", zh: "酸辣羊肚丝" },
    description: {
      uz: "Ingichka to'g'ralgan qo'y qorni — qora sirka, qalampir yog'i, kashnich va qizil qalampir bilan.",
      ru: "Тонко нарезанные рубцы ягнёнка с чёрным уксусом, перечным маслом, кинзой и красным перцем.",
      en: "Thinly shredded lamb tripe tossed with black vinegar, chili oil, coriander and red pepper.",
      zh: "羊肚切丝，拌香醋、红油、香菜与辣椒。",
    },
  },
  {
    slug: "xiyu-pepper-chicken", cat: "cold", spicy: "MEDIUM",
    name: { uz: "Shinjoncha sichuan qalampirli tovuq", ru: "Курица по-синьцзянски с сычуаньским перцем", en: "Xinjiang-style Sichuan pepper chicken", zh: "西域椒麻鸡" },
    description: {
      uz: "Qo'lda titilgan yumshoq tovuq — sichuan qalampiri, qizil qalampir va piyoz bilan; tilni yoqimli uvishtiradi.",
      ru: "Нежная курица, разобранная вручную, с сычуаньским перцем, чили и луком — приятно покалывает язык.",
      en: "Tender hand-torn chicken with Sichuan peppercorn, chili and onion — pleasantly tingling.",
      zh: "手撕嫩鸡，配花椒、辣椒与洋葱，麻香爽口。",
    },
  },
  {
    slug: "jiangshui-potato-slices", cat: "cold", spicy: "NONE", veg: true,
    name: { uz: "Achitilgan ko'katli kartoshka tilimlari", ru: "Картофельные ломтики с ферментированными овощами", en: "Potato slices with fermented greens", zh: "浆水菜拌土豆片" },
    description: {
      uz: "Yupqa kartoshka tilimlari Shi'an uslubidagi achitilgan ko'katlar (tszyanshuy) bilan — yengil nordon ta'mli.",
      ru: "Тонкие ломтики картофеля с квашеной зеленью цзяншуй по-сианьски — с лёгкой кислинкой.",
      en: "Thin potato slices with Xi'an-style jiangshui fermented greens — light and tangy.",
      zh: "土豆薄片拌西安浆水菜，酸爽开胃。",
    },
  },
  {
    slug: "fried-beef-balls", cat: "hot", spicy: "NONE", featured: true,
    name: { uz: "Qovurilgan mol go'shti sharchalari", ru: "Говяжьи шарики, жаренные во фритюре", en: "Crispy fried beef balls", zh: "煎牛肉丸子" },
    description: {
      uz: "Ziravorli mol go'shti qiymasidan sharchalar — tilla rang va qarsildoq bo'lguncha qovuriladi, ichi shirali.",
      ru: "Шарики из пряного говяжьего фарша, обжаренные до золотистой хрустящей корочки, — сочные внутри.",
      en: "Spiced minced beef balls fried golden and crisp outside, juicy inside.",
      zh: "五香牛肉馅团成丸子，炸至外酥里嫩。",
    },
  },
  {
    slug: "changan-garden-salad", cat: "cold", spicy: "NONE", veg: true,
    name: { uz: "Chang'ancha sabzavot va mevali salat", ru: "Чанганский салат из овощей и фруктов", en: "Chang'an vegetable & fruit salad", zh: "蔬果大拌菜" },
    description: {
      uz: "Yangi salat barglari, sabzavotlar va mevalar — yengil kunjut-sirkali sous bilan.",
      ru: "Свежие листья салата, овощи и фрукты с лёгкой кунжутно-уксусной заправкой.",
      en: "Fresh leaves, vegetables and fruit with a light sesame vinaigrette.",
      zh: "新鲜生菜、时蔬与水果，配清爽芝麻醋汁。",
    },
  },
  {
    slug: "passion-fruit-tomatoes", cat: "cold", spicy: "NONE", veg: true, featured: true,
    name: { uz: "Marakuyyali sovutilgan cherri pomidorlar", ru: "Охлаждённые томаты черри с маракуйей", en: "Chilled cherry tomatoes with passion fruit", zh: "冰镇百香果番茄" },
    description: {
      uz: "Po'sti archilgan cherri pomidorlar marakuyya sharbatida — muz ustida, sovuq holda tortiladi.",
      ru: "Очищенные томаты черри, вымоченные в соке маракуйи, подаются на льду.",
      en: "Peeled cherry tomatoes steeped in passion-fruit syrup, served on ice.",
      zh: "去皮圣女果浸百香果汁，冰镇上桌。",
    },
  },
  {
    slug: "sichuan-pepper-beef-tongue", cat: "cold", spicy: "MILD",
    name: { uz: "Sichuan qalampirli mol tili", ru: "Говяжий язык с сычуаньским перцем", en: "Beef tongue with Sichuan pepper", zh: "炖牛肉舌" },
    description: {
      uz: "Ziravorlarda dimlangan mol tili — yupqa tilimlanib, sichuan qalampirli sous bilan tortiladi.",
      ru: "Тушёный в пряностях говяжий язык, тонко нарезанный, с соусом из сычуаньского перца.",
      en: "Spice-braised beef tongue, thinly sliced, with a Sichuan pepper dressing.",
      zh: "香料炖制牛舌，切薄片，淋花椒汁。",
    },
  },
  {
    slug: "eggplant-century-egg", cat: "cold", spicy: "MEDIUM", veg: true,
    name: { uz: "Ming yillik tuxum va yanchilgan qalampirli baqlajon", ru: "Баклажаны с тысячелетним яйцом и толчёным перцем", en: "Eggplant with century egg & pounded peppers", zh: "擂椒皮蛋茄子" },
    description: {
      uz: "Olovda pishirilgan baqlajon va qalampir hovonchada yanchiladi va ming yillik tuxum bilan aralashtiriladi.",
      ru: "Печёные баклажаны и перец, растолчённые в ступке, с тысячелетним яйцом.",
      en: "Fire-roasted eggplant and peppers pounded in a stone mortar with century egg.",
      zh: "烧茄子与青椒入石臼擂碎，拌皮蛋。",
    },
  },
  {
    slug: "great-harvest-platter", cat: "cold", spicy: "NONE", veg: true,
    name: { uz: "\"Mo'l hosil\" sabzavot assortisi", ru: "Овощное ассорти «Великое изобилие»", en: "\"Great Harvest\" vegetable platter", zh: "蔬菜大拼盘" },
    description: {
      uz: "Yangi sabzavotlar: bodring, sabzi, turp, cherri, ko'k piyoz, qalampir va tofu — maxsus sous bilan.",
      ru: "Свежие овощи — огурец, морковь, редис, черри, зелёный лук, перец и тофу — с фирменным соусом.",
      en: "Fresh crudités — cucumber, carrot, radish, cherry tomatoes, spring onion, peppers and tofu — with house dip.",
      zh: "黄瓜、胡萝卜、萝卜、圣女果、小葱、青椒与豆腐，配特制蘸酱。",
    },
  },
  {
    slug: "fennel-pancakes", cat: "hot", spicy: "NONE", veg: true,
    name: { uz: "Fenxel ko'katli yassi non", ru: "Лепёшки с фенхелем", en: "Fennel flatbreads", zh: "茴香煎饼" },
    description: {
      uz: "Yangi fenxel ko'kati qo'shilgan yupqa yassi non — tovada qizartirib pishiriladi.",
      ru: "Тонкие лепёшки с молодой зеленью фенхеля, обжаренные на сковороде до румяности.",
      en: "Thin pan-fried flatbreads made with fresh fennel greens.",
      zh: "鲜茴香入面，煎至两面金黄。",
    },
  },
  {
    slug: "crispy-duck-bones", cat: "hot", spicy: "MEDIUM",
    name: { uz: "Xushbo'y qarsildoq o'rdak suyaklari", ru: "Ароматное рагу из утиных костей", en: "Crispy aromatic duck bones", zh: "香酥鸭骨" },
    description: {
      uz: "O'rdak bo'laklari quritilgan qizil qalampir, sarimsoq va kunjut bilan xushbo'y bo'lguncha qovuriladi.",
      ru: "Кусочки утки, обжаренные с сушёным красным перцем, чесноком и кунжутом.",
      en: "Duck pieces wok-fried with dried red chili, garlic and sesame until fragrant.",
      zh: "鸭骨以干辣椒、蒜与芝麻爆炒，酥香入味。",
    },
  },
  {
    slug: "sichuan-glazed-peanuts", cat: "cold", spicy: "MEDIUM", veg: true,
    name: { uz: "Sichuan qaylasidagi qarsildoq yeryong'oq", ru: "Арахис в пряной сычуаньской глазури", en: "Crispy peanuts in Sichuan chili glaze", zh: "油炸香酥小花生" },
    description: {
      uz: "Qarsildoq qovurilgan yeryong'oq — quritilgan qizil qalampir va sichuan qalampiri bilan.",
      ru: "Хрустящий жареный арахис с сушёным красным перцем и сычуаньским перцем.",
      en: "Crunchy fried peanuts tossed with dried red chili and Sichuan peppercorn.",
      zh: "花生炸至酥脆，拌干辣椒与花椒。",
    },
  },
  {
    slug: "uzbek-salad", cat: "cold", spicy: "NONE", veg: true,
    name: { uz: "O'zbek salati", ru: "Узбекский салат", en: "Uzbek salad", zh: "乌兹别克斯坦沙拉" },
    description: {
      uz: "Pomidor, bodring, piyoz va yangi ko'katlar — sodda va tetiklantiruvchi.",
      ru: "Помидоры, огурцы, лук и свежая зелень — просто и свежо.",
      en: "Tomato, cucumber, onion and fresh herbs — simple and refreshing.",
      zh: "番茄、黄瓜、洋葱与香草，清新爽口。",
    },
  },
];
