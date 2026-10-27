import type { SpicyLevel } from "@prisma/client";

/**
 * Clopos menyusidagi 30 ta taom, rasmlari bilan (Aziz: 2026-10-26 — ro'yxat boshidagi 15 tasi, 2026-10-27 — yana 15 tasi) —
 * admin → Menyu → "Namuna taomlar (30)" tugmasi bazaga qo'shadi (bor taomlar o'tkazib yuboriladi). Narx QO'YILMAYDI (0 = saytda narx ko'rinmaydi;
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
  { slug: "signature", name: { uz: "Firma taomlari", ru: "Фирменные блюда", en: "Signature dishes", zh: "招牌菜" } },
  { slug: "cold", name: { uz: "Sovuq taomlar", ru: "Холодные блюда", en: "Cold dishes", zh: "凉菜" } },
  { slug: "hot", name: { uz: "Issiq taomlar", ru: "Горячие блюда", en: "Hot dishes", zh: "热菜" } },
];

/**
 * Oldingi namuna ro'yxatining slug'lari (Clopos'ning boshqa 15 taomi, rasmsiz). Bazada qolgan bo'lsa,
 * tugma ularni shu tartibda (SAMPLE_DISHES'ning birinchi 15 tasiga) aylantiradi — id saqlanadi, bron/buyurtma
 * bog'lanishlari buzilmaydi. Yangi taomlarga bu slug'larni bermang.
 */
export const LEGACY_SAMPLE_SLUGS = [
  "peking-duck", "gansu-hand-lamb", "squirrel-fish", "xinjiang-noodles", "kung-pao-chicken",
  "xinjiang-big-plate-chicken", "mapo-tofu", "sweet-sour-chicken", "sichuan-boiled-beef", "tomato-egg",
  "changan-beef-slices", "yangzhou-fried-rice", "youpo-noodles", "beef-celery-dumplings", "tofu-chicken-soup",
];

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

  // ---- 2-qism (2026-10-27): Clopos ro'yxatidagi navbatdagi 15 taom ----
  {
    slug: "avocado-arugula-shrimp-salad", cat: "cold", spicy: "NONE",
    name: { uz: "Avokado, rukkola va krevetkali salat", ru: "Салат с авокадо, рукколой и креветками", en: "Avocado, arugula & shrimp salad", zh: "牛油果芝麻菜拌大虾" },
    description: {
      uz: "Yangi rukkola, avokado va krevetkalar — cherri pomidor, zaytun va yengil kunjutli sous bilan.",
      ru: "Свежая руккола, авокадо и креветки с томатами черри, оливками и лёгкой кунжутной заправкой.",
      en: "Fresh arugula, avocado and shrimp with cherry tomatoes, olives and a light sesame dressing.",
      zh: "芝麻菜、牛油果与大虾，配圣女果、橄榄和清爽芝麻汁。",
    },
  },
  {
    slug: "celery-tofu-skin", cat: "cold", spicy: "MILD", veg: true,
    name: { uz: "Selderey va soya qatlamasi (fuju)", ru: "Сельдерей с соевой спаржей (фучжу)", en: "Celery with tofu skin (fuzhu)", zh: "西芹拌腐竹" },
    description: {
      uz: "Qarsildoq selderey, yumshoq soya qatlamasi va qizil qalampir — sarimsoqli yengil sous bilan.",
      ru: "Хрустящий сельдерей, нежная соевая спаржа и красный перец в лёгкой чесночной заправке.",
      en: "Crisp celery, tender tofu skin and red pepper in a light garlic dressing.",
      zh: "爽脆西芹、腐竹与红椒，蒜香清拌。",
    },
  },
  {
    slug: "tiger-skin-chicken-feet", cat: "cold", spicy: "MEDIUM",
    name: { uz: "Limonli tovuq panjalari «Yo'lbars terisi»", ru: "Куриные лапки «Тигровая шкура» в соевом соусе", en: "\"Tiger skin\" chicken feet with lemon", zh: "柠檬凤爪" },
    description: {
      uz: "Qovurilib, soya-limonli achchiq qaylaga botirilgan tovuq panjalari — terisi yo'lbars terisidek burishadi.",
      ru: "Обжаренные куриные лапки в остром соево-лимонном соусе — кожица становится похожей на тигровую шкуру.",
      en: "Fried chicken feet soaked in a spicy soy-lemon sauce — the skin wrinkles like a tiger's.",
      zh: "凤爪炸后浸入酸辣柠檬酱汁，外皮起皱如虎皮。",
    },
  },
  {
    slug: "tofu-spring-onion", cat: "cold", spicy: "NONE", veg: true,
    name: { uz: "Ko'k piyozli tofu", ru: "Тофу с зелёным луком", en: "Tofu with spring onion", zh: "斯坦小葱拌豆腐" },
    description: {
      uz: "Yumshoq tofu kubiklari va mayda to'g'ralgan ko'k piyoz — kunjut yog'i bilan; sodda va yengil.",
      ru: "Нежные кубики тофу с мелко нарезанным зелёным луком и кунжутным маслом — просто и легко.",
      en: "Silky tofu cubes with finely chopped spring onion and sesame oil — simple and light.",
      zh: "嫩豆腐丁拌小葱，淋香油，清爽简单。",
    },
  },
  {
    slug: "scallion-oil-chicken", cat: "cold", spicy: "NONE",
    name: { uz: "Piyoz yog'li tuzli sho'rvada pishgan tovuq", ru: "Курица в солёном бульоне с луковым маслом", en: "Poached chicken with scallion oil", zh: "葱油盐水鸡" },
    description: {
      uz: "Tuzli sho'rvada sekin pishirilgan yumshoq tovuq — ustidan qaynoq ko'k piyoz yog'i quyiladi.",
      ru: "Нежная курица, томлённая в солёном бульоне и политая горячим маслом с зелёным луком.",
      en: "Tender chicken gently poached in salted broth, finished with sizzling scallion oil.",
      zh: "盐水慢浸嫩鸡，淋上热葱油。",
    },
  },
  {
    slug: "changan-chicken", cat: "hot", spicy: "NONE",
    name: { uz: "Chang'ancha tovuq", ru: "Курица по-Чангански", en: "Chang'an-style chicken", zh: "长安鸡" },
    description: {
      uz: "Butun tovuq ziravorlarda dimlanib, tilla rang va qarsildoq bo'lguncha qovuriladi — restoranimizning nomdosh taomi.",
      ru: "Целая курица, томлённая в пряностях и обжаренная до золотистой хрустящей корочки, — блюдо-тёзка нашего ресторана.",
      en: "A whole chicken braised in spices, then fried until golden and crisp — our restaurant's namesake dish.",
      zh: "整鸡香料卤制后炸至金黄酥脆，与餐厅同名的招牌菜。",
    },
  },
  {
    slug: "gansu-shouzhua-lamb", cat: "signature", spicy: "NONE", featured: true,
    name: { uz: "Gansucha qo'y go'shti «Qo'l bilan»", ru: "Ганьсуйская баранина «Ручной захват»", en: "Gansu \"hand-held\" lamb", zh: "甘肃手抓羊肉" },
    description: {
      uz: "Ziravorlar bilan sekin qaynatilgan yumshoq qo'y go'shti suyagi bilan tortiladi — an'anaga ko'ra qo'lda yeyiladi.",
      ru: "Нежная баранина на косточке, томлённая со специями, — по традиции её едят руками.",
      en: "Tender lamb on the bone, slowly simmered with spices — traditionally eaten by hand.",
      zh: "带骨羊肉以香料慢炖，鲜嫩不膻，传统手抓而食。",
    },
  },
  {
    slug: "braised-uzbek-carp", cat: "signature", spicy: "NONE", featured: true,
    name: { uz: "Soya qaylasida dimlangan o'zbek karpi", ru: "Узбекский карп, тушёный в соевом соусе", en: "Uzbek carp braised in soy sauce", zh: "红烧乌兹三尺鲤" },
    description: {
      uz: "Butun karp baliq soya, zanjabil va ziravorli qaylada dimlanadi — katta davra uchun bayramona taom.",
      ru: "Целый карп, тушённый в соевом соусе с имбирём и пряностями, — праздничное блюдо для большой компании.",
      en: "A whole carp braised in soy sauce with ginger and spices — a festive dish for a large table.",
      zh: "整条鲤鱼以酱油、姜与香料红烧，适合多人共享的宴席大菜。",
    },
  },
  {
    slug: "dapanji-with-noodles", cat: "hot", spicy: "MEDIUM",
    name: { uz: "Lag'monli Shinjoncha katta laganda tovuq", ru: "Курица по-синьцзянски с лапшой", en: "Xinjiang big-plate chicken with noodles", zh: "新疆大盘鸡" },
    description: {
      uz: "Tovuq, kartoshka va qalampir achchiq-xushbo'y qaylada dimlanadi va keng qo'l lag'moni bilan tortiladi.",
      ru: "Курица с картофелем и перцем, тушённая в пряном соусе, подаётся с широкой лапшой ручной работы.",
      en: "Chicken, potato and peppers stewed in a spicy, aromatic sauce, served over wide hand-pulled noodles.",
      zh: "鸡块、土豆与青椒香辣炖煮，配手工宽面。",
    },
  },
  {
    slug: "gongbao-chicken", cat: "hot", spicy: "MEDIUM",
    name: { uz: "Gunbao tovuq", ru: "Курица Кунг Пао", en: "Kung Pao chicken", zh: "宫保鸡丁" },
    description: {
      uz: "Tovuq bo'lakchalari yeryong'oq, quritilgan qalampir va ko'k piyoz bilan shirin-achchiq qaylada qovuriladi.",
      ru: "Кусочки курицы, обжаренные с арахисом, сушёным перцем и зелёным луком в кисло-сладко-остром соусе.",
      en: "Diced chicken wok-fried with peanuts, dried chili and spring onion in a sweet-spicy sauce.",
      zh: "鸡丁与花生、干辣椒、葱段同炒，糊辣荔枝味。",
    },
  },
  {
    slug: "sichuan-dry-chili-chicken", cat: "hot", spicy: "HOT",
    name: { uz: "Sichuancha quruq qovurilgan achchiq tovuq", ru: "Сухой обжаренный острый цыплёнок по-сычуаньски", en: "Sichuan dry-fried chili chicken", zh: "川香干煸辣子鸡" },
    description: {
      uz: "Mayda tovuq bo'laklari qarsildoq bo'lguncha qovurilib, ko'p quritilgan qalampir va sichuan qalampiri bilan aralashtiriladi.",
      ru: "Кусочки курицы, обжаренные до хруста, с горой сушёного чили и сычуаньским перцем.",
      en: "Bite-sized chicken fried until crisp and tossed with a mountain of dried chilies and Sichuan peppercorn.",
      zh: "鸡块干煸至酥香，与大量干辣椒和花椒同炒。",
    },
  },
  {
    slug: "gongbao-shrimp", cat: "hot", spicy: "MEDIUM",
    name: { uz: "Gunbao krevetkalar", ru: "Креветки «Гунбао»", en: "Kung Pao shrimp", zh: "宫保虾球" },
    description: {
      uz: "Yirik krevetkalar yeryong'oq va quritilgan qalampir bilan shirin-achchiq Gunbao qaylasida qovuriladi.",
      ru: "Крупные креветки, обжаренные с арахисом и сушёным перцем в кисло-сладко-остром соусе гунбао.",
      en: "Plump shrimp wok-fried with peanuts and dried chili in a sweet-spicy Kung Pao sauce.",
      zh: "大虾球与花生、干辣椒同炒，宫保酱汁甜辣适口。",
    },
  },
  {
    slug: "hunan-chili-beef", cat: "hot", spicy: "HOT",
    name: { uz: "Xunancha achchiq mol go'shti", ru: "Острая говядина по-хунаньски", en: "Hunan-style chili beef", zh: "湘味辣椒小炒肉" },
    description: {
      uz: "Yupqa to'g'ralgan mol go'shti yashil achchiq qalampir bilan baland olovda tez qovuriladi.",
      ru: "Тонко нарезанная говядина, быстро обжаренная на сильном огне с острым зелёным перцем.",
      en: "Thinly sliced beef stir-fried over high heat with hot green chilies.",
      zh: "牛肉薄片与青辣椒大火快炒，香辣下饭。",
    },
  },
  {
    slug: "changan-three-delicacies", cat: "hot", spicy: "MILD",
    name: { uz: "Chang'ancha «Uch noz-ne'mat»", ru: "Три деликатеса по-чангански", en: "Chang'an \"three delicacies\"", zh: "长安三鲜" },
    description: {
      uz: "Go'shtli sharchalar, bambuk novdalari va qo'ziqorinlar xushbo'y qaylada dimlanadi — Chang'an oshxonasining an'anaviy taomi.",
      ru: "Мясные шарики, побеги бамбука и грибы, тушённые в ароматном соусе, — традиционное блюдо чанъаньской кухни.",
      en: "Meatballs, bamboo shoots and mushrooms braised in a fragrant sauce — a traditional Chang'an dish.",
      zh: "肉丸、笋片与香菇同烩，汤汁鲜香，长安传统风味。",
    },
  },
  {
    slug: "sweet-sour-meatballs", cat: "hot", spicy: "NONE",
    name: { uz: "Shirin-nordon go'shtli sharchalar", ru: "Кисло-сладкие мясные шарики", en: "Sweet & sour meatballs", zh: "糖醋丸子" },
    description: {
      uz: "Qovurilgan go'shtli sharchalar yaltiroq shirin-nordon qaylaga o'raladi.",
      ru: "Обжаренные мясные шарики в глянцевом кисло-сладком соусе.",
      en: "Fried meatballs coated in a glossy sweet-and-sour sauce.",
      zh: "肉丸炸后裹上亮泽的糖醋汁，酸甜可口。",
    },
  },
];
