import type { Kind, L4, Recipe, RecipeLayer, SceneRecipe, Tint, Vessel } from "./recipe-types";

/**
 * Har bir taomning qatlamli 3D sahnasi uchun "retsept": idish + yuqoridan pastga 2–5 qatlam (masalliq turi, rangi,
 * soni, 4 tildagi nomi). Taom rasmi (public/photos/dishes/<slug>.webp) va tavsifiga qarab tanlangan.
 * Ro'yxatda yo'q taom (admin keyin qo'shgan) — kategoriyasi bo'yicha umumiy retsept (FALLBACK).
 * Ranglar — three/palette.ts kalitlari (hex bu yerda yozilmaydi).
 */

const W = (uz: string, ru: string, en: string, zh: string): L4 => ({ uz, ru, en, zh });

/** Idish nomlari (eng pastki qatlam) */
const VESSEL_LABEL: Record<Vessel, L4> = {
  bowl: W("Chinni kosa", "Фарфоровая пиала", "Porcelain bowl", "瓷碗"),
  deepPlate: W("Chuqur chinni lagan", "Глубокое фарфоровое блюдо", "Deep porcelain dish", "瓷深盘"),
  plate: W("Chinni tarelka", "Фарфоровая тарелка", "Porcelain plate", "瓷盘"),
  fishPlatter: W("Uzun baliq lagani", "Длинное блюдо для рыбы", "Long fish platter", "长鱼盘"),
  clayPot: W("Sopol xumcha", "Глиняный горшочек", "Clay pot", "砂锅"),
  steamer: W("Bambuk bug'latgich", "Бамбуковая пароварка", "Bamboo steamer", "竹蒸笼"),
  mortar: W("Tosh hovoncha", "Каменная ступка", "Stone mortar", "石臼"),
  board: W("Yog'och taxta", "Деревянная доска", "Wooden board", "木板"),
  skewers: W("Yog'och taxta", "Деревянная доска", "Wooden board", "木板"),
  glass: W("Stakan", "Стакан", "Glass", "玻璃杯"),
  bottle: W("Stakan", "Стакан", "Glass", "玻璃杯"),
  cup: W("Chinni piyola", "Фарфоровая чашка", "Porcelain cup", "瓷杯"),
};

/** Qatlam nomlari lug'ati (bir xil masalliq — bir xil nom, 4 tilda) */
const LBL: Record<string, L4> = {
  // ko'kat, ziravor
  scallion: W("Ko'k piyoz", "Зелёный лук", "Spring onion", "葱花"),
  scallionSesame: W("Ko'k piyoz va kunjut", "Зелёный лук и кунжут", "Spring onion & sesame", "葱花与芝麻"),
  scallionChili: W("Ko'k piyoz va qalampir", "Зелёный лук и перец", "Spring onion & chili", "葱丝与辣椒"),
  cilantro: W("Kashnich", "Кинза", "Coriander", "香菜"),
  cilantroChili: W("Kashnich va qalampir", "Кинза и перец", "Coriander & chili", "香菜与辣椒"),
  herbs: W("Yangi ko'katlar", "Свежая зелень", "Fresh herbs", "香草"),
  chili: W("Qizil qalampir", "Красный перец", "Red chili", "红辣椒"),
  chiliDry: W("Quritilgan qalampir", "Сушёный перец чили", "Dried chilies", "干辣椒"),
  greenChili: W("Ko'k achchiq qalampir", "Зелёный острый перец", "Green chili", "青椒"),
  sichuanPepper: W("Sichuan qalampiri", "Сычуаньский перец", "Sichuan pepper", "花椒"),
  chiliPepper: W("Qalampir va Sichuan murchi", "Чили и сычуаньский перец", "Chili & Sichuan pepper", "辣椒与花椒"),
  cumin: W("Zira va qalampir", "Зира и перец", "Cumin & chili", "孜然与辣椒"),
  garlic: W("Sarimsoq", "Чеснок", "Garlic", "蒜蓉"),
  sesame: W("Kunjut", "Кунжут", "Sesame", "芝麻"),
  peanuts: W("Qovurilgan yeryong'oq", "Жареный арахис", "Roasted peanuts", "花生"),
  mint: W("Yalpiz", "Мята", "Mint", "薄荷"),
  // qaylalar, sho'rvalar
  chiliOil: W("Qalampir yog'i", "Перечное масло", "Chili oil", "红油"),
  soySauce: W("Soya qaylasi", "Соевый соус", "Soy sauce", "酱油汁"),
  sweetSour: W("Shirin-nordon qayla", "Кисло-сладкий соус", "Sweet & sour sauce", "糖醋汁"),
  spicedSauce: W("Ziravorli qayla", "Пряный соус", "Spiced sauce", "卤汁"),
  braiseSauce: W("Dimlama qaylasi", "Соус для томления", "Braising sauce", "红烧汁"),
  gongbao: W("Gunbao qaylasi", "Соус гунбао", "Kung pao sauce", "宫保汁"),
  sourSpicy: W("Nordon-achchiq qayla", "Кисло-острый соус", "Hot & sour dressing", "酸辣汁"),
  sesameOil: W("Kunjut yog'i", "Кунжутное масло", "Sesame oil", "香油"),
  vinegar: W("Qora sirka", "Чёрный уксус", "Black vinegar", "陈醋"),
  tomatoBroth: W("Pomidorli sho'rva", "Томатный бульон", "Tomato broth", "番茄汤"),
  redBroth: W("Qalampirli sho'rva", "Острый бульон", "Spicy broth", "红汤"),
  chickenBroth: W("Tovuq sho'rvasi", "Куриный бульон", "Chicken broth", "鸡汤"),
  // asos
  noodles: W("Qo'lda cho'zilgan lag'mon", "Лапша ручной вытяжки", "Hand-pulled noodles", "手工拉面"),
  wideNoodles: W("Keng lag'mon", "Широкая лапша", "Broad noodles", "宽面"),
  vermicelli: W("Funchoza", "Фунчоза", "Glass noodles", "粉丝"),
  rice: W("Bug'da pishgan guruch", "Рис на пару", "Steamed rice", "米饭"),
  friedRice: W("Qovurilgan guruch", "Жареный рис", "Fried rice", "炒饭"),
  dough: W("Yupqa xamir", "Тонкое тесто", "Thin dough", "薄皮"),
  pancakes: W("Yupqa blinchiklar", "Тонкие блинчики", "Thin pancakes", "薄饼"),
  // go'sht, baliq
  beef: W("Mol go'shti", "Говядина", "Beef", "牛肉"),
  lamb: W("Qo'y go'shti", "Баранина", "Lamb", "羊肉"),
  chicken: W("Tovuq go'shti", "Курица", "Chicken", "鸡肉"),
  mince: W("Go'sht qiymasi", "Мясной фарш", "Minced meat", "肉末"),
  meatballs: W("Go'shtli sharchalar", "Мясные шарики", "Meatballs", "肉丸"),
  shrimp: W("Krevetka", "Креветки", "Shrimp", "虾仁"),
  // sabzavot
  tofu: W("Tofu", "Тофу", "Tofu", "豆腐"),
  egg: W("Tuxum", "Яйцо", "Egg", "鸡蛋"),
  tomato: W("Pomidor", "Помидоры", "Tomato", "番茄"),
  potato: W("Kartoshka", "Картофель", "Potato", "土豆"),
  potatoStrips: W("Kartoshka somonchasi", "Картофельная соломка", "Potato strips", "土豆丝"),
  cucumber: W("Bodring", "Огурец", "Cucumber", "黄瓜"),
  lettuce: W("Salat barglari", "Листья салата", "Lettuce leaves", "生菜"),
  greenBeans: W("Yashil loviya", "Стручковая фасоль", "Green beans", "四季豆"),
  eggplant: W("Baqlajon", "Баклажаны", "Eggplant", "茄子"),
  mushroom: W("Qo'ziqorin", "Грибы", "Mushrooms", "香菇"),
  woodEar: W("Qora qo'ziqorin", "Древесные грибы", "Wood ear mushrooms", "木耳"),
  onion: W("Piyoz", "Лук", "Onion", "洋葱"),
  redOnion: W("Qizil piyoz", "Красный лук", "Red onion", "紫洋葱"),
  peasCarrot: W("No'xat va sabzi", "Горошек и морковь", "Peas & carrot", "青豆与胡萝卜"),
  // sushi
  roll: W("Nori, guruch va to'ldirma", "Нори, рис и начинка", "Nori, rice & filling", "紫菜、米饭与馅料"),
  ginger: W("Marinadlangan zanjabil", "Маринованный имбирь", "Pickled ginger", "腌姜"),
  // ichimlik
  ice: W("Muz", "Лёд", "Ice", "冰块"),
  straw: W("Naycha", "Трубочка", "Straw", "吸管"),
  lemon: W("Limon tilimi", "Долька лимона", "Lemon slice", "柠檬片"),
  foam: W("Ko'pik", "Пена", "Foam", "泡沫"),
  cream: W("Ko'pirtirilgan qaymoq", "Взбитые сливки", "Whipped cream", "奶油"),
  teaLeaves: W("Choy barglari", "Чайные листья", "Tea leaves", "茶叶"),
  bottle: W("Shisha", "Бутылка", "Bottle", "瓶"),
};

const lbl = (l: RecipeLayer["label"]): L4 => (typeof l === "string" ? LBL[l] ?? W(l, l, l, l) : l);
const pickL = (v: L4, locale: string) => v[(["uz", "ru", "en", "zh"].includes(locale) ? locale : "uz") as keyof L4];

/* ---------------- Retseptlar ---------------- */

type Extra = Pick<RecipeLayer, "count" | "with">;
/** Qatlam: tur, nom, rang, qo'shimcha (soni, yonidagi masalliqlar) */
const l = (kind: Kind, label: string | L4, tint?: Tint, o: Extra = {}): RecipeLayer => ({ kind, label, tint, ...o });
/** Qatlamdagi qo'shimcha masalliq */
const w = (kind: Kind, tint?: Tint, count?: number) => ({ kind, tint, count });
const R = (vessel: Vessel, ...layers: RecipeLayer[]): Recipe => ({ vessel, layers });
/** Ichimlik shishada: shisha + muz (ixtiyoriy) + suyuqlik */
const bottled = (bottle: Tint, liquid: Tint, name: L4, drink: L4, ice = true): Recipe =>
  R("bottle", l("bottle", name, bottle), ...(ice ? [l("ice", "ice")] : []), l("liquid", drink, liquid));

export const RECIPES: Record<string, Recipe> = {
  /* ---------- Sovuq taomlar ---------- */
  "changan-dadao-beef": R("plate", l("herb", "cilantroChili", undefined, { with: [w("chili", undefined, 3)] }), l("beef", W("Dimlangan mol go'shti tilimlari", "Томлёная говядина ломтиками", "Braised beef slices", "卤牛肉片"), undefined, { count: 12 }), l("sauce", "spicedSauce", "sauceSoy")),
  "shanghai-smoked-fish": R("plate", l("herb", "herbs"), l("chunk", W("Dudlangan baliq bo'laklari", "Кусочки копчёной рыбы", "Smoked fish pieces", "熏鱼块"), "glazeBrown", { count: 10 }), l("sauce", W("Shirin soya qaylasi", "Сладкий соевый маринад", "Sweet soy glaze", "甜酱汁"), "sauceSweet")),
  "sour-spicy-lamb-tripe": R("deepPlate", l("herb", "cilantroChili", undefined, { with: [w("chili", "chiliDry", 6)] }), l("strips", W("Qo'y qorni tasmalari", "Рубцы ягнёнка", "Lamb tripe strips", "羊肚丝"), "tripe", { count: 50 }), l("sauce", "sourSpicy", "sauceRed")),
  "xiyu-pepper-chicken": R("deepPlate", l("chili", W("Qalampir va qizil piyoz", "Перец и красный лук", "Chili & red onion", "辣椒与紫洋葱"), undefined, { with: [w("onion", "onionRed", 8)] }), l("strips", W("Qo'lda titilgan tovuq", "Курица, разобранная вручную", "Hand-torn chicken", "手撕鸡"), "chickenPale", { count: 44 }), l("sauce", "chiliOil", "sauceRed")),
  "jiangshui-potato-slices": R("deepPlate", l("herb", "herbs"), l("strips", W("Tuzlangan sabzavot", "Квашеные овощи", "Pickled greens", "浆水菜"), "celery", { count: 30 }), l("slice", W("Kartoshka tilimlari", "Ломтики картофеля", "Potato slices", "土豆片"), "potato", { count: 14 }), l("sauce", W("Nordon tuzlama suvi", "Кисловатый рассол", "Tangy pickling broth", "浆水"), "brothClear")),
  "fried-beef-balls": R("plate", l("herb", W("Ko'kat va qizil piyoz", "Зелень и красный лук", "Herbs & red onion", "香草与紫洋葱"), undefined, { with: [w("onion", "onionRed", 5)] }), l("meatball", W("Qovurilgan mol go'shti sharchalari", "Жареные говяжьи шарики", "Fried beef balls", "炸牛肉丸"), "chickenFried", { count: 10 }), l("pepper", W("Ziravorli tuz", "Пряная соль", "Spiced salt", "椒盐"), "pepper")),
  "changan-garden-salad": R("deepPlate", l("onion", "redOnion", "onionRed"), l("cucumber", W("Yangi sabzavotlar", "Свежие овощи", "Fresh vegetables", "时蔬"), undefined, { with: [w("tomato", undefined, 5)] }), l("leaf", "lettuce", "lettuce", { count: 7 }), l("sauce", W("Kunjutli sous", "Кунжутная заправка", "Sesame dressing", "麻酱汁"), "sesame")),
  "passion-fruit-tomatoes": R("deepPlate", l("herb", "mint", "mint", { count: 6 }), l("tomato", W("Cherri pomidorlar", "Томаты черри", "Cherry tomatoes", "圣女果"), undefined, { count: 12 }), l("ice", "ice", undefined, { count: 7 }), l("sauce", W("Marakuyya sharbati", "Сок маракуйи", "Passion fruit juice", "百香果汁"), "mango")),
  "sichuan-pepper-beef-tongue": R("plate", l("scallion", "scallion"), l("beef", W("Mol tili tilimlari", "Ломтики говяжьего языка", "Beef tongue slices", "牛舌片"), "tongue", { count: 10 }), l("sauce", W("Sichuan qalampirli qayla", "Соус с сычуаньским перцем", "Sichuan pepper sauce", "椒麻汁"), "sauceGreen")),
  "eggplant-century-egg": R("mortar", l("chili", "chili", undefined, { count: 8 }), l("dice", W("Ming yillik tuxum", "Тысячелетнее яйцо", "Century egg", "皮蛋"), "centuryEgg"), l("strips", W("Ko'mirda pishgan qalampir", "Печёный острый перец", "Charred green chili", "烧椒"), "chiliGreen", { count: 30 }), l("eggplant", "eggplant")),
  "great-harvest-platter": R("plate", l("onion", "redOnion", "onionRed"), l("strips", W("Sabzi va bodring", "Морковь и огурец", "Carrot & cucumber", "胡萝卜与黄瓜"), "carrot", { count: 20, with: [w("beans", "cucumber", 8)] }), l("tomato", W("Cherri pomidor", "Томаты черри", "Cherry tomatoes", "圣女果"), undefined, { count: 6 }), l("leaf", "lettuce", "lettuce", { count: 6 })),
  "fennel-pancakes": R("plate", l("herb", W("Fenxel ko'kati", "Зелень фенхеля", "Fennel greens", "茴香"), "cilantro", { count: 16 }), l("strips", W("Fenxelli blin tasmalari", "Блинная лапша с фенхелем", "Fennel pancake ribbons", "茴香饼丝"), "pancake", { count: 60 }), l("pancake", "pancakes", "pancake", { count: 2 })),
  "crispy-duck-bones": R("deepPlate", l("sesame", W("Kunjut va qalampir", "Кунжут и перец", "Sesame & chili", "芝麻与辣椒"), undefined, { with: [w("chili", undefined, 6)] }), l("rib", W("Qarsildoq o'rdak suyaklari", "Хрустящие утиные косточки", "Crispy duck bones", "香酥鸭架"), "glazeBrown", { count: 8 }), l("sauce", "sweetSour", "sauceSweet")),
  "sichuan-glazed-peanuts": R("deepPlate", l("chili", "chiliDry", "chiliDry", { count: 12 }), l("nut", "peanuts", "peanut", { count: 40 }), l("pepper", "sichuanPepper", "pepper")),
  "uzbek-salad": R("plate", l("herb", "herbs"), l("cucumber", "cucumber", undefined, { count: 10 }), l("wedge", "tomato", "tomato", { count: 7 }), l("leaf", "lettuce", "lettuce", { count: 5 })),
  "avocado-arugula-shrimp-salad": R("plate", l("shrimp", "shrimp", undefined, { count: 6 }), l("dice", W("Avokado va zaytun", "Авокадо и оливки", "Avocado & olives", "牛油果与橄榄"), "avocado", { count: 18, with: [w("pea", "olive", 8)] }), l("herb", W("Rukola", "Руккола", "Arugula", "芝麻菜"), "arugula", { count: 22 })),
  "celery-tofu-skin": R("deepPlate", l("chili", "chili", undefined, { count: 5 }), l("strips", W("Tofu po'stlog'i", "Тофу-пенка (юба)", "Tofu skin", "腐竹"), "tofuSkin", { count: 40 }), l("beans", W("Selderey", "Сельдерей", "Celery", "芹菜"), "celery", { count: 12 })),
  "tiger-skin-chicken-feet": R("deepPlate", l("herb", "cilantro"), l("chunk", W("Tovuq panjalari", "Куриные лапки", "Chicken feet", "鸡爪"), "chickenFried", { count: 12 }), l("sauce", "sourSpicy", "sauceRed")),
  "tofu-spring-onion": R("plate", l("scallion", "scallion", undefined, { count: 40 }), l("tofu", W("Yumshoq tofu", "Нежный тофу", "Silken tofu", "嫩豆腐"), undefined, { count: 20 }), l("sauce", "sesameOil", "oil")),
  "scallion-oil-chicken": R("plate", l("scallion", "scallion", undefined, { count: 40 }), l("chunk", W("Qaynatilgan tovuq", "Отварная курица", "Poached chicken", "白切鸡"), "chickenPale", { count: 10 }), l("sauce", W("Ko'k piyoz yog'i", "Луковое масло", "Spring onion oil", "葱油"), "oil")),
  "changan-chicken": R("plate", l("herb", "herbs"), l("roast", W("Butun pishirilgan tovuq", "Цельная запечённая курица", "Whole roast chicken", "整鸡"), "chickenFried"), l("sauce", "spicedSauce", "sauceBrown")),
  "gansu-shouzhua-lamb": R("plate", l("pepper", W("Achchiq qalampir va tuz", "Острый перец и соль", "Chili salt", "椒盐"), "chiliDry"), l("rib", W("Qo'y qovurg'alari", "Бараньи рёбрышки", "Lamb ribs", "羊排"), "lamb", { count: 8 }), l("dice", "garlic", "garlic", { count: 20 })),
  "braised-uzbek-carp": R("fishPlatter", l("chili", "cilantroChili", undefined, { count: 5, with: [w("herb")] }), l("fish", W("Butun sazan", "Целый карп", "Whole carp", "整条鲤鱼"), "fishGold"), l("sauce", "braiseSauce", "sauceBrown")),
  "dapanji-with-noodles": R("deepPlate", l("chili", "chiliDry", undefined, { count: 8, with: [w("herb", undefined, 8)] }), l("chunk", W("Tovuq bo'laklari", "Кусочки курицы", "Chicken pieces", "鸡块"), "glazeBrown", { count: 10 }), l("chunk", "potato", "potato", { count: 8 }), l("noodles", "wideNoodles")),
  "gongbao-chicken": R("deepPlate", l("nut", "peanuts", "peanut", { count: 26 }), l("chili", "scallionChili", "chiliDry", { count: 8, with: [w("scallion", undefined, 14)] }), l("chunk", W("Tovuq kubiklari", "Курица кубиками", "Diced chicken", "鸡丁"), "chickenFried", { count: 14 }), l("sauce", "gongbao", "sauceSweet")),
  "sichuan-dry-chili-chicken": R("plate", l("chili", "chiliDry", "chiliRed", { count: 22 }), l("pepper", "sichuanPepper"), l("chunk", W("Qarsildoq tovuq", "Хрустящая курица", "Crispy chicken", "辣子鸡"), "chickenFried", { count: 16 })),
  "gongbao-shrimp": R("deepPlate", l("nut", "peanuts", "peanut", { count: 24 }), l("chili", "scallionChili", "chiliDry", { count: 7, with: [w("scallion", undefined, 12)] }), l("shrimp", "shrimp", undefined, { count: 9 }), l("sauce", "gongbao", "sauceSweet")),
  "hunan-chili-beef": R("deepPlate", l("beans", "greenChili", "chiliGreen", { count: 14 }), l("beef", "beef", "glazeBrown", { count: 10 }), l("sauce", "soySauce", "sauceSoy")),
  "changan-three-delicacies": R("deepPlate", l("leaf", W("Bok-choy", "Бок-чой", "Bok choy", "青菜"), undefined, { count: 3 }), l("meatball", "meatballs", "glazeBrown", { count: 8 }), l("mushroom", W("Shiitake qo'ziqorini", "Грибы шиитаке", "Shiitake mushrooms", "香菇")), l("slice", W("Bambuk novdalari", "Побеги бамбука", "Bamboo shoots", "笋片"), "bambooShoot", { count: 12 }), l("sauce", "braiseSauce", "sauceBrown")),
  "sweet-sour-meatballs": R("plate", l("herb", "mint", "mint", { count: 6 }), l("meatball", "meatballs", "glazeBrown", { count: 12 }), l("sauce", "sweetSour", "sauceSweet")),

  /* ---------- Firma taomlari ---------- */
  "beijing-roast-duck": R("plate", l("strips", W("Bodring va ko'k piyoz", "Огурец и зелёный лук", "Cucumber & spring onion", "黄瓜条与葱丝"), "cucumber", { count: 18, with: [w("strips", "scallionLight", 14)] }), l("roast", W("Qarsildoq terili o'rdak", "Утка с хрустящей кожицей", "Crisp-skinned duck", "烤鸭"), "duckSkin"), l("pancake", "pancakes", "pancake", { count: 4 }), l("sauce", W("Shirin loviya qaylasi", "Сладкий бобовый соус", "Sweet bean sauce", "甜面酱"), "sauceSoy")),
  "longmen-sizzling-fish": R("clayPot", l("chili", "chiliPepper", "chiliRed", { count: 16, with: [w("pepper")] }), l("chunk", W("Oq baliq bo'laklari", "Кусочки белой рыбы", "White fish fillet", "鱼片"), "scallopMeat", { count: 10 }), l("leaf", W("Sabzavot yostig'i", "Овощная подушка", "Vegetable bed", "时蔬"), "cabbage", { count: 4 }), l("broth", W("Qaynoq qalampir yog'i", "Кипящее перечное масло", "Sizzling chili oil", "热红油"), "chiliOil")),
  "songshu-fish": R("fishPlatter", l("pea", "peasCarrot", undefined, { count: 18, with: [w("dice", "carrot", 12)] }), l("fish", W("«Sincap» baliq", "Рыба «белка»", "Squirrel-cut fish", "松鼠鱼"), "fishRed"), l("sauce", "sweetSour", "sauceSweet")),
  "xinjiang-guoyourou-noodles": R("deepPlate", l("chili", W("Bulg'or qalampiri", "Сладкий перец", "Bell peppers", "彩椒"), "chiliRed", { count: 7, with: [w("chili", "chiliGreen", 5)] }), l("beef", W("Qovurilgan go'sht", "Обжаренное мясо", "Stir-fried meat", "过油肉"), "glazeBrown", { count: 10 }), l("mushroom", "woodEar", "woodEar", { count: 7 }), l("noodles", "noodles")),

  /* ---------- Sovuq (Clopos) ---------- */
  "sesame-oil-cucumber": R("deepPlate", l("nut", "peanuts", "peanut", { count: 18 }), l("chili", "chili", undefined, { count: 4 }), l("beans", "cucumber", "cucumber", { count: 12 }), l("sauce", "sesameOil", "oil")),
  "apple-arugula-salad": { vessel: "deepPlate", vesselTint: "glazeRed", layers: [l("pea", W("Zaytun", "Оливки", "Olives", "橄榄"), "olive", { count: 10 }), l("slice", W("Olma tilimlari", "Ломтики яблока", "Apple slices", "苹果片"), "apple", { count: 12 }), l("herb", W("Rukola", "Руккола", "Arugula", "芝麻菜"), "arugula", { count: 24 })] },

  /* ---------- Issiq taomlar ---------- */
  "shrimp-steamed-egg": R("deepPlate", l("scallion", "scallion", undefined, { count: 12 }), l("shrimp", "shrimp", undefined, { count: 3 }), l("sauce", W("Bug'da pishgan tuxum", "Паровой омлет", "Silky steamed egg", "蒸蛋"), "custard")),
  "crispy-sweet-sour-chicken": R("deepPlate", l("sesame", "sesame"), l("chunk", W("Qarsildoq tovuq", "Хрустящая курица", "Crispy chicken", "脆皮鸡"), "redBraise", { count: 12 }), l("sauce", "sweetSour", "sauceSweet")),
  "shuizhu-beef": R("bowl", l("herb", "cilantro", undefined, { count: 14 }), l("chili", "chiliPepper", "chiliDry", { count: 10, with: [w("pepper")] }), l("beef", W("Mol go'shti tilimlari", "Ломтики говядины", "Beef slices", "牛肉片"), undefined, { count: 10 }), l("leaf", W("Sabzavot yostig'i", "Овощная подушка", "Vegetable bed", "时蔬"), "cabbage", { count: 4 }), l("broth", "redBroth", "brothRed")),
  "beef-brisket-chickpea-tomato": R("bowl", l("herb", "cilantro"), l("chunk", W("Mol go'shti to'shi", "Говяжья грудинка", "Beef brisket", "牛腩"), "glazeBrown", { count: 9 }), l("wedge", "tomato", "tomato", { count: 7 }), l("pea", W("No'xat", "Нут", "Chickpeas", "鹰嘴豆"), "chickpea", { count: 22 }), l("broth", "tomatoBroth", "brothTomato")),
  "stir-fried-beef-liver": R("deepPlate", l("beans", "greenChili", "chiliGreen", { count: 8 }), l("cucumber", "cucumber", undefined, { count: 8 }), l("beef", W("Mol jigari", "Говяжья печень", "Beef liver", "牛肝"), "liver", { count: 10 }), l("sauce", "soySauce", "sauceSoy")),
  "laoganma-potato-strips": R("plate", l("scallion", "scallion"), l("strips", "potatoStrips", "potatoFried", { count: 70 }), l("sauce", W("Laoganma qalampir qaylasi", "Перечный соус «Лаоганьма»", "Lao Gan Ma chili sauce", "老干妈辣酱"), "sauceRed")),
  "dry-fried-green-beans": R("plate", l("chili", "chiliDry", "chiliDry", { count: 8 }), l("dice", "mince", "glazeBrown", { count: 26 }), l("beans", "greenBeans", undefined, { count: 22 })),
  "eggplant-green-beans": R("plate", l("chili", "chili", undefined, { count: 6 }), l("beans", "greenBeans", undefined, { count: 12 }), l("eggplant", "eggplant", undefined, { count: 12 }), l("sauce", "soySauce", "sauceBrown")),
  "lamb-with-onion": R("plate", l("scallion", "scallion"), l("onion", "onion", "onionWhite", { count: 14 }), l("beef", "lamb", "lamb", { count: 10 }), l("sauce", "spicedSauce", "sauceSoy")),
  "dry-fried-shredded-beef": R("plate", l("sesame", "sesame"), l("chili", "chiliDry", undefined, { count: 6 }), l("strips", W("Qarsildoq go'sht tasmalari", "Хрустящая говяжья соломка", "Crispy shredded beef", "干煸牛肉丝"), "redBraise", { count: 80 })),
  "hunan-chopped-chili-fish-head": R("fishPlatter", l("scallion", "scallion"), l("dice", W("To'g'ralgan qizil qalampir", "Рубленый красный перец", "Chopped red chili", "剁椒"), "chiliRed", { count: 40 }), l("fish", W("Baliq boshi", "Рыбья голова", "Fish head", "鱼头"), "fishDark"), l("sauce", "chiliOil", "sauceRed")),
  "yuxiang-chicken": R("deepPlate", l("scallion", W("Ko'k piyoz va sarimsoq", "Зелёный лук и чеснок", "Spring onion & garlic", "葱蒜"), undefined, { with: [w("dice", "garlic", 12)] }), l("strips", W("Qo'ziqorin va sabzi", "Грибы и морковь", "Mushroom & carrot", "木耳与胡萝卜"), "woodEar", { count: 20, with: [w("strips", "carrot", 16)] }), l("strips", W("Tovuq tasmalari", "Куриная соломка", "Shredded chicken", "鸡丝"), "chickenFried", { count: 40 }), l("sauce", W("Yuxiang qaylasi", "Соус юйсян", "Yuxiang sauce", "鱼香汁"), "sauceRed")),
  "golden-sour-soup-beef": R("bowl", l("chili", W("Qalampir halqalari", "Колечки перца", "Chili rings", "辣椒圈"), "chiliGreen", { count: 6, with: [w("chili", undefined, 4)] }), l("beef", "beef", undefined, { count: 10 }), l("strips", W("Enoki qo'ziqorini", "Грибы эноки", "Enoki mushrooms", "金针菇"), "onionWhite", { count: 40 }), l("broth", W("Oltin nordon sho'rva", "Золотистый кислый бульон", "Golden sour broth", "金汤"), "brothYellow")),
  "blanched-lettuce": R("deepPlate", l("dice", "garlic", "garlic", { count: 30 }), l("leaf", "lettuce", "lettuce", { count: 8 }), l("sauce", W("Ustritsa qaylasi", "Устричный соус", "Oyster sauce", "蚝油汁"), "sauceSoy")),
  "mapo-doufu": R("deepPlate", l("scallion", W("Ko'k piyoz va Sichuan murchi", "Зелёный лук и сычуаньский перец", "Spring onion & Sichuan pepper", "葱花与花椒"), undefined, { with: [w("pepper")] }), l("dice", "mince", "glazeBrown", { count: 24 }), l("tofu", W("Yumshoq tofu", "Нежный тофу", "Silken tofu", "嫩豆腐"), undefined, { count: 16 }), l("sauce", W("Qalampirli loviya qaylasi", "Острый бобовый соус", "Chili bean sauce", "豆瓣酱汁"), "sauceRed")),
  "hot-sour-potato-strips": R("plate", l("chili", "chiliDry", "chiliDry", { count: 10 }), l("strips", "potatoStrips", "potato", { count: 80 }), l("sauce", W("Sirka va kunjut yog'i", "Уксус и кунжутное масло", "Vinegar & sesame oil", "醋与香油"), "oil")),
  "tomato-scrambled-eggs": R("deepPlate", l("scallion", "scallion", undefined, { count: 14 }), l("egg", W("Yumshoq tuxum", "Нежный омлет", "Soft scrambled egg", "炒鸡蛋"), undefined, { count: 14 }), l("wedge", "tomato", "tomato", { count: 10 }), l("sauce", W("Pomidor sharbati", "Томатный сок", "Tomato juices", "番茄汁"), "brothTomato")),
  "tea-fragrant-beef": R("plate", l("herb", "cilantro", undefined, { count: 10 }), l("chunk", "beef", "glazeBrown", { count: 10 }), l("leaf", W("Qovurilgan choy barglari", "Обжаренные чайные листья", "Crisp tea leaves", "炸茶叶"), "arugula", { count: 8 })),
  "cashew-chili-chicken": R("deepPlate", l("cashew", W("Keshyu", "Кешью", "Cashews", "腰果")), l("chili", "chiliDry", "chiliDry", { count: 14 }), l("chunk", W("Tovuq bo'laklari", "Кусочки курицы", "Chicken pieces", "鸡块"), "glazeBrown", { count: 14 })),
  "jujube-braised-beef": R("clayPot", l("herb", W("Brokkoli", "Брокколи", "Broccoli", "西兰花"), "chiliGreen", { count: 8 }), l("pea", W("Unabi (jujuba)", "Финики унаби", "Jujubes", "红枣"), "jujube", { count: 10 }), l("chunk", W("Dimlangan mol go'shti", "Томлёная говядина", "Braised beef", "红烧牛肉"), "glazeBrown", { count: 12 }), l("broth", "braiseSauce", "sauceBrown")),
  "five-herb-fish-head": R("fishPlatter", l("herb", "herbs"), l("mushroom", "mushroom", undefined, { count: 8 }), l("fish", W("Baliq boshi", "Рыбья голова", "Fish head", "鱼头"), "fishDark"), l("sauce", "braiseSauce", "sauceBrown")),
  "vinegar-cabbage": R("plate", l("chili", "chiliDry", "chiliDry", { count: 8 }), l("leaf", W("Karam barglari", "Листья капусты", "Cabbage leaves", "白菜"), "cabbage", { count: 9 }), l("sauce", "vinegar", "brothDark")),
  "bifengtang-eggplant": R("board", l("dice", W("Qarsildoq sarimsoq uvog'i", "Хрустящая чесночная крошка", "Crispy garlic crumbs", "避风塘蒜酥"), "potatoFried", { count: 40 }), l("chili", "chili", undefined, { count: 6 }), l("eggplant", "eggplant", undefined, { count: 10 })),
  "cumin-lamb": R("plate", l("herb", W("Zira va kashnich", "Зира и кинза", "Cumin & coriander", "孜然与香菜"), undefined, { with: [w("pepper", "anise", 16)] }), l("chunk", W("Zirali qo'y go'shti", "Баранина с зирой", "Cumin lamb", "孜然羊肉"), "lamb", { count: 12 }), l("dumpling", W("Bug'da pishgan bulochkalar", "Паровые булочки", "Steamed buns", "馒头"), undefined, { count: 7 })),
  "lamb-ribs-potatoes": R("plate", l("herb", "herbs"), l("rib", W("Qo'y qovurg'alari", "Бараньи рёбрышки", "Lamb ribs", "羊排"), "glazeBrown", { count: 6 }), l("chunk", "potato", "potatoFried", { count: 10 })),
  "altay-fat-tail-lamb": R("bowl", l("herb", "cilantro", undefined, { count: 12 }), l("chunk", "lamb", "tongue", { count: 10 }), l("slice", W("Oq turp", "Белая редька", "White radish", "白萝卜"), "tofu", { count: 8 }), l("broth", W("Oq sho'rva", "Белый бульон", "Milky broth", "清汤"), "brothMilky")),
  "xinjiang-lamb-skewers": R("skewers", l("pepper", "cumin", "chiliDry", { with: [w("sesame")] }), l("scallion", "scallion", undefined, { count: 18 }), l("skewer", W("Qo'y go'shti kaboblari", "Шашлычки из баранины", "Lamb skewers", "羊肉串"), "lamb")),

  /* ---------- Lag'mon va non ---------- */
  "shaanxi-saozi-noodles": R("bowl", l("scallion", W("Ko'k piyoz va sabzavot", "Зелёный лук и овощи", "Spring onion & vegetables", "葱花与配菜"), undefined, { with: [w("dice", "carrot", 12)] }), l("dice", "mince", "glazeBrown", { count: 20 }), l("noodles", "noodles"), l("broth", W("Nordon-achchiq sho'rva", "Кисло-острый бульон", "Hot & sour broth", "酸辣汤"), "brothRed")),
  "youpo-chemian": { vessel: "bowl", vesselTint: "porcelainBlue", layers: [l("chili", W("Qalampir, sarimsoq, ko'k piyoz", "Перец, чеснок, зелёный лук", "Chili, garlic & spring onion", "辣椒、蒜与葱"), "chiliDry", { count: 6, with: [w("dice", "garlic", 14), w("scallion", undefined, 12)] }), l("noodles", "wideNoodles"), l("broth", W("Qaynoq yog'", "Горячее масло", "Sizzling oil", "热油"), "chiliOil")] },
  "changan-guokui-chili": R("plate", l("sesame", "sesame"), l("dice", W("Qalampir pastasi", "Перечная паста", "Chili paste", "油泼辣子"), "chiliRed", { count: 30 }), l("pancake", W("Guokui noni", "Лепёшка гоукуй", "Guokui flatbread", "锅盔"), "flatbread", { count: 3 })),
  "tomato-egg-noodles": R("bowl", l("scallion", "scallion"), l("wedge", "tomato", "tomato"), l("egg", "egg"), l("noodles", "noodles"), l("broth", "tomatoBroth", "brothTomato")),
  "beijing-zhajiang-noodles": R("bowl", l("strips", W("Bodring va ko'k piyoz", "Огурец и зелёный лук", "Cucumber & spring onion", "黄瓜丝与葱花"), "cucumber", { count: 24, with: [w("scallion", undefined, 12)] }), l("dice", W("Zhajiang qaylasi va qiyma", "Соус чжацзян с фаршем", "Zhajiang sauce & mince", "炸酱"), "sauceBrown", { count: 30 }), l("noodles", "noodles")),
  "bread": R("board", l("bread", W("Yangi yopilgan non", "Свежий хлеб", "Fresh bread", "面包"), undefined, { count: 4 }), l("bread", W("Bug'da pishgan bulochkalar", "Паровые булочки", "Steamed buns", "馒头"), "pancake", { count: 4 })),

  /* ---------- Dim sum ---------- */
  "beef-celery-jiaozi": R("steamer", l("dumpling", "dough"), l("dice", W("Mol go'shti va selderey", "Говядина и сельдерей", "Beef & celery", "牛肉芹菜馅"), "glazeBrown", { count: 24, with: [w("dice", "celery", 20)] })),
  "chive-egg-jiaozi": R("steamer", l("dumpling", "dough"), l("egg", W("Tuxum va ko'k piyoz", "Яйцо и черемша", "Egg & chives", "韭菜鸡蛋馅"), undefined, { count: 10, with: [w("strips", "chiliGreen", 24)] })),
  "beef-potstickers": R("plate", l("scallion", "scallion"), l("dumpling", W("Qovurilgan chuchvara", "Жареные пельмени", "Pan-fried dumplings", "锅贴"), "potatoFried"), l("dice", "mince", "glazeBrown", { count: 24 }), l("sauce", W("Sirka-soya qaylasi", "Уксусно-соевый соус", "Vinegar soy dip", "醋汁"), "sauceSoy")),

  /* ---------- Guruch ---------- */
  "shrimp-egg-fried-rice": R("plate", l("pea", W("No'xat va ko'k piyoz", "Горошек и зелёный лук", "Peas & spring onion", "青豆与葱花"), undefined, { count: 18, with: [w("scallion", undefined, 10)] }), l("shrimp", "shrimp", undefined, { count: 6 }), l("egg", "egg", undefined, { count: 10 }), l("rice", "friedRice", "riceFried")),
  "yangzhou-rice": R("plate", l("pea", "peasCarrot", undefined, { count: 18, with: [w("dice", "carrot", 14)] }), l("shrimp", "shrimp", undefined, { count: 4 }), l("egg", "egg", undefined, { count: 10 }), l("rice", "friedRice", "riceFried")),
  "steamed-rice": R("bowl", l("rice", W("Uzun donli guruch", "Длиннозёрный рис", "Long-grain rice", "香米"), "rice")),

  /* ---------- Dengiz mahsulotlari ---------- */
  "garlic-vermicelli-prawns": R("plate", l("scallion", "scallionChili", undefined, { with: [w("chili", undefined, 4)] }), l("shrimp", W("Yirik krevetkalar", "Крупные креветки", "King prawns", "大虾"), undefined, { count: 8 }), l("dice", "garlic", "garlic", { count: 30 }), l("noodles", "vermicelli", "vermicelli")),
  "steamed-sea-bass": R("fishPlatter", l("strips", W("Ko'k piyoz va qalampir tasmalari", "Соломка лука и перца", "Shredded spring onion & chili", "葱丝与辣椒丝"), "scallion", { count: 30, with: [w("chili", undefined, 4)] }), l("fish", W("Dengiz olabug'asi", "Морской окунь", "Sea bass", "鲈鱼"), "fishSilver"), l("sauce", "soySauce", "sauceSoy")),
  "steamed-yellow-croaker": R("fishPlatter", l("strips", W("Ko'k piyoz tasmalari", "Соломка зелёного лука", "Shredded spring onion", "葱丝"), "scallion", { count: 30 }), l("fish", W("Sariq kroker", "Жёлтый горбыль", "Yellow croaker", "黄鱼"), "fishGold"), l("sauce", "soySauce", "sauceSoy")),
  "yellow-croaker-tofu": R("fishPlatter", l("herb", "cilantro"), l("tofu", "tofu", undefined, { count: 10 }), l("fish", W("Sariq kroker", "Жёлтый горбыль", "Yellow croaker", "黄鱼"), "fishGold"), l("sauce", "braiseSauce", "brothYellow")),
  "clay-pot-abalone": R("plate", l("scallion", "scallionChili", undefined, { with: [w("chili", undefined, 3)] }), l("abalone", W("Abalon", "Морское ушко", "Abalone", "鲍鱼")), l("shell", W("Chig'anoqlar", "Раковины", "Shells", "贝壳"), "abalone", { count: 5 }), l("sauce", "braiseSauce", "sauceBrown")),
  "garlic-vermicelli-scallops": R("plate", l("scallion", "scallionChili", undefined, { with: [w("chili", undefined, 3)] }), l("dice", "garlic", "garlic", { count: 30 }), l("shell", W("Taroqcha", "Гребешки", "Scallops", "扇贝"))),
  "pickled-pepper-baby-squid": R("deepPlate", l("herb", "cilantro"), l("chili", W("Tuzlangan qalampir", "Маринованный перец", "Pickled chilies", "泡椒"), "chiliRed", { count: 10 }), l("squid", W("Yosh kalmar", "Молодые кальмары", "Baby squid", "小鱿鱼"), undefined, { count: 12 }), l("sauce", "sourSpicy", "sauceRed")),
  "soy-king-prawns": { vessel: "plate", vesselTint: "porcelainBlue", layers: [l("scallion", "scallion"), l("shrimp", W("Qirol krevetkalari", "Королевские креветки", "King prawns", "大虾"), undefined, { count: 9 }), l("sauce", "soySauce", "sauceSoy")] },
  "sea-cucumber-beef": R("deepPlate", l("chili", "chili", undefined, { count: 6 }), l("beans", "greenChili", "chiliGreen", { count: 12 }), l("seaCucumber", W("Dengiz bodringi", "Трепанг", "Sea cucumber", "海参")), l("beef", "beef", undefined, { count: 8 })),

  /* ---------- Sho'rvalar ---------- */
  "tofu-chicken-broth": R("bowl", l("scallion", "scallion"), l("tofu", "tofu", undefined, { count: 10 }), l("chunk", "chicken", "chickenPale", { count: 8 }), l("broth", "chickenBroth", "brothMilky")),
  "fermented-rice-egg-soup": R("bowl", l("pea", W("Godji", "Ягоды годжи", "Goji berries", "枸杞"), "goji", { count: 14 }), l("egg", W("Tuxum parchalari", "Яичные хлопья", "Egg ribbons", "蛋花"), "eggWhite", { count: 10 }), l("dice", W("Achitilgan guruch", "Ферментированный рис", "Fermented rice", "醪糟"), "rice", { count: 30 }), l("broth", W("Shirin guruch sho'rvasi", "Сладкий рисовый суп", "Sweet rice broth", "甜汤"), "brothMilky")),
  "tomato-egg-soup": R("bowl", l("scallion", "scallion"), l("egg", W("Tuxum lentasi", "Яичные хлопья", "Egg ribbons", "蛋花"), undefined, { count: 12 }), l("wedge", "tomato", "tomato", { count: 8 }), l("broth", "tomatoBroth", "brothTomato")),
  "hot-sour-tripe-soup": R("clayPot", l("scallion", "scallionChili", undefined, { with: [w("chili", undefined, 3)] }), l("strips", W("Qorin tasmalari", "Рубец соломкой", "Tripe strips", "肚丝"), "tripe", { count: 30 }), l("strips", "woodEar", "woodEar", { count: 20 }), l("broth", W("Nordon-achchiq sho'rva", "Кисло-острый суп", "Hot & sour soup", "酸辣汤"), "brothDark")),
  "cordyceps-scallop-chicken-soup": R("bowl", l("strips", W("Kordiseps gullari", "Цветы кордицепса", "Cordyceps flowers", "虫草花"), "carrot", { count: 24 }), l("pea", W("Quritilgan taroqcha", "Сушёный гребешок", "Dried scallops", "干贝"), "bambooShoot", { count: 10 }), l("chunk", "chicken", "chickenPale", { count: 8 }), l("broth", "chickenBroth", "brothYellow")),
  "meatball-tomato-soup": R("clayPot", l("herb", "herbs"), l("meatball", "meatballs", "glazeBrown", { count: 6 }), l("tomato", "tomato", undefined, { count: 6 }), l("chunk", "potato", "potato", { count: 6 }), l("broth", "tomatoBroth", "brothTomato")),

  /* ---------- Sushi ---------- */
  "grilled-shrimp-sushi": R("board", l("sushiTop", W("Pishirilgan krevetka", "Запечённая креветка", "Baked shrimp topping", "烤虾"), "shrimp"), l("sushi", "roll", "crab")),
  "grilled-chicken-sushi": R("board", l("sushiTop", W("Pishirilgan tovuq", "Запечённая курица", "Baked chicken topping", "烤鸡"), "chickenFried"), l("sushi", "roll", "chickenPale")),
  "crab-sushi": R("board", l("sushiTop", W("Qisqichbaqa salati", "Крабовый салат", "Crab topping", "蟹肉"), "crab"), l("sushi", "roll", "crab")),
  "unagi-sushi": R("board", l("sesame", "sesame"), l("sushi", W("Ugor, guruch va nori", "Угорь, рис и нори", "Eel, rice & nori", "鳗鱼、米饭与紫菜"), "unagi"), l("slice", "ginger", "ginger", { count: 6 })),
  "tempura-sushi": R("board", l("slice", "ginger", "ginger", { count: 6 }), l("sushi", W("Tempura rulet", "Темпура-ролл", "Tempura roll", "天妇罗卷"), "tempura")),
  "red-caviar-sushi": R("board", l("caviar", W("Qizil ikra", "Красная икра", "Salmon roe", "三文鱼籽")), l("sushi", "roll", "salmon")),
  "salmon-sushi": R("board", l("slice", "ginger", "ginger", { count: 6 }), l("sushiTop", W("Losos", "Лосось", "Salmon", "三文鱼"), "salmon"), l("sushi", "roll", "salmon")),

  /* ---------- Ichimliklar ---------- */
  "coca-cola": bottled("cola", "cola", W("Coca-Cola shishasi", "Бутылка Coca-Cola", "Coca-Cola bottle", "可乐瓶"), W("Coca-Cola", "Coca-Cola", "Coca-Cola", "可乐")),
  "fanta": bottled("fanta", "fanta", W("Fanta shishasi", "Бутылка Fanta", "Fanta bottle", "芬达瓶"), W("Fanta", "Fanta", "Fanta", "芬达")),
  "sprite": bottled("sprite", "sprite", W("Sprite shishasi", "Бутылка Sprite", "Sprite bottle", "雪碧瓶"), W("Sprite", "Sprite", "Sprite", "雪碧")),
  "mineral-water": R("bottle", l("bottle", W("Mineral suv shishasi", "Бутылка минеральной воды", "Mineral water bottle", "矿泉水瓶"), "bottleClear"), l("citrus", "lemon", "lemon"), l("liquid", W("Mineral suv", "Минеральная вода", "Mineral water", "矿泉水"), "water")),
  "borjomi": bottled("bottleGreen", "water", W("Borjomi shishasi", "Бутылка «Боржоми»", "Borjomi bottle", "博尔若米瓶"), W("Shifobaxsh mineral suv", "Лечебная минеральная вода", "Mineral spring water", "矿泉水")),
  "fruit-juice": R("glass", l("citrus", W("Apelsin tilimi", "Долька апельсина", "Orange slice", "橙片"), "orange"), l("ice", "ice"), l("liquid", W("Meva sharbati", "Фруктовый сок", "Fruit juice", "果汁"), "juiceOrange")),
  "apple-juice": R("glass", l("slice", W("Olma tilimlari", "Ломтики яблока", "Apple slices", "苹果片"), "apple", { count: 3 }), l("ice", "ice"), l("liquid", W("Olma sharbati", "Яблочный сок", "Apple juice", "苹果汁"), "juiceApple")),
  "orange-juice": R("glass", l("citrus", W("Apelsin tilimi", "Долька апельсина", "Orange slice", "橙片"), "orange"), l("ice", "ice"), l("liquid", W("Apelsin sharbati", "Апельсиновый сок", "Orange juice", "橙汁"), "juiceOrange")),
  "pomegranate-juice": R("glass", l("pea", W("Anor donalari", "Зёрна граната", "Pomegranate seeds", "石榴籽"), "pomegranate", { count: 16 }), l("ice", "ice"), l("liquid", W("Anor sharbati", "Гранатовый сок", "Pomegranate juice", "石榴汁"), "pomegranate")),
  "tarkhun-lemonade": bottled("bottleGreen", "tarkhun", W("«Tarxun» shishasi", "Бутылка «Тархун»", "Tarkhun bottle", "塔尔昆瓶"), W("Tarxun limonadi", "Лимонад «Тархун»", "Tarragon lemonade", "龙蒿柠檬水")),
  "duchess-lemonade": bottled("bottleClear", "duchess", W("«Dyushes» shishasi", "Бутылка «Дюшес»", "Duchess bottle", "杜莎瓶"), W("Nok limonadi", "Грушевый лимонад", "Pear lemonade", "梨子柠檬水")),
  "classic-mojito": R("glass", l("citrus", W("Laym va yalpiz", "Лайм и мята", "Lime & mint", "青柠与薄荷"), "lime", { with: [w("herb", "mint", 10)] }), l("straw", "straw"), l("ice", "ice"), l("liquid", W("Laym sharbati va soda", "Сок лайма и содовая", "Lime juice & soda", "青柠汁与苏打"), "mojito")),
  "strawberry-mojito": R("glass", l("berry", W("Qulupnay va yalpiz", "Клубника и мята", "Strawberry & mint", "草莓与薄荷"), "strawberry", { with: [w("herb", "mint", 8)] }), l("straw", "straw"), l("ice", "ice"), l("liquid", W("Qulupnay siropi va soda", "Клубничный сироп и содовая", "Strawberry syrup & soda", "草莓糖浆与苏打"), "milkPink")),
  "mango-passion-mojito": R("glass", l("herb", "mint", "mint", { count: 10 }), l("straw", "straw"), l("ice", "ice"), l("liquid", W("Mango va marakuyya", "Манго и маракуйя", "Mango & passion fruit", "芒果与百香果"), "mango")),
  "ice-tea-lemon-raspberry": R("glass", l("citrus", "lemon", "lemon", { with: [w("herb", "mint", 6)] }), l("berry", W("Malina", "Малина", "Raspberries", "树莓"), "raspberry", { count: 3 }), l("ice", "ice"), l("liquid", W("Sovuq choy", "Холодный чай", "Iced tea", "冰茶"), "iceTea")),
  "ice-tea-mango-strawberry": R("glass", l("herb", "mint", "mint", { count: 8 }), l("berry", W("Mango va qulupnay", "Манго и клубника", "Mango & strawberry", "芒果与草莓"), "strawberry", { count: 2, with: [w("dice", "mango", 10)] }), l("ice", "ice"), l("liquid", W("Sovuq choy", "Холодный чай", "Iced tea", "冰茶"), "iceTea")),
  "chocolate-milkshake": R("glass", l("strips", W("Shokolad qirindisi", "Шоколадная стружка", "Chocolate shavings", "巧克力碎"), "chocolate", { count: 22 }), l("cream", "cream", "vanilla"), l("liquid", W("Shokoladli sut", "Шоколадное молоко", "Chocolate milk", "巧克力奶"), "chocolate")),
  "vanilla-milkshake": R("glass", l("straw", "straw"), l("cream", "cream", "vanilla"), l("liquid", W("Vanilli sut", "Ванильное молоко", "Vanilla milk", "香草奶"), "vanilla")),
  "banana-milkshake": R("glass", l("slice", W("Banan tilimlari", "Ломтики банана", "Banana slices", "香蕉片"), "banana", { count: 3 }), l("straw", "straw"), l("liquid", W("Bananli sut", "Банановое молоко", "Banana milk", "香蕉奶"), "banana")),
  "strawberry-milkshake": R("glass", l("berry", W("Qulupnay", "Клубника", "Strawberry", "草莓"), "strawberry", { count: 1 }), l("straw", "straw"), l("cream", "cream", "milkPink"), l("liquid", W("Qulupnayli sut", "Клубничное молоко", "Strawberry milk", "草莓奶"), "milkPink")),
  "watermelon-milkshake": R("glass", l("wedge", W("Tarvuz bo'lagi", "Долька арбуза", "Watermelon wedge", "西瓜块"), "watermelon", { count: 2 }), l("straw", "straw"), l("liquid", W("Tarvuzli sut", "Арбузное молоко", "Watermelon milk", "西瓜奶"), "milkPink")),
  "tea": R("cup", l("pepper", "teaLeaves", "teaDark", { count: 14 }), l("liquid", W("Damlangan choy", "Заваренный чай", "Brewed tea", "热茶"), "teaAmber")),
  "lemon-tea": R("cup", l("citrus", "lemon", "lemon"), l("liquid", W("Limonli choy", "Чай с лимоном", "Lemon tea", "柠檬茶"), "teaAmber")),
  "chinese-black-tea": R("cup", l("pepper", W("Inxun choy barglari", "Листья чая Инхун", "Yinghong tea leaves", "英红茶叶"), "teaDark", { count: 16 }), l("liquid", W("Qora choy", "Чёрный чай", "Black tea", "红茶"), "teaDark")),
  "beer": R("bottle", l("can", W("Pivo bankasi", "Банка пива", "Beer can", "啤酒罐"), "can"), l("cream", "foam", "foam"), l("liquid", W("Pivo", "Пиво", "Beer", "啤酒"), "beer")),
  "draft-beer": R("glass", l("cream", "foam", "foam"), l("liquid", W("Quyma pivo", "Разливное пиво", "Draft beer", "生啤"), "beer")),
  "zatecky-gus-beer": R("bottle", l("bottle", W("«Žatecký Gus» shishasi", "Бутылка «Жатецкий Гусь»", "Žatecký Gus bottle", "扎特茨跨瓶"), "bottleGreen"), l("cream", "foam", "foam"), l("liquid", W("Chex pivosi", "Чешское пиво", "Czech lager", "捷克啤酒"), "beer")),
  "wine": bottled("wineRed", "wineRed", W("Vino shishasi", "Бутылка вина", "Wine bottle", "葡萄酒瓶"), W("Qizil vino", "Красное вино", "Red wine", "红葡萄酒"), false),
  "guojiao-1573": bottled("bottleClear", "baijiu", W("Guojiao 1573 shishasi", "Бутылка «Гоцзяо 1573»", "Guojiao 1573 bottle", "国窖1573酒瓶"), W("Baijiu (xitoy arog'i)", "Байцзю", "Baijiu", "白酒"), false),
  "luzhou-laojiao-zisha-daqu": bottled("bottleClay", "baijiu", W("Sopol shisha «Zisha Daqu»", "Глиняная бутылка «Цзыша Дацюй»", "Zisha Daqu clay bottle", "紫砂大曲酒瓶"), W("Baijiu (xitoy arog'i)", "Байцзю", "Baijiu", "白酒"), false),
  "vodka-new-uzbekistan": bottled("bottleClear", "baijiu", W("«New Uzbekistan» shishasi", "Бутылка «New Uzbekistan»", "New Uzbekistan bottle", "伏特加酒瓶"), W("Aroq", "Водка", "Vodka", "伏特加")),
  "cognac": bottled("bottleAmber", "cognac", W("Konyak shishasi", "Бутылка коньяка", "Cognac bottle", "白兰地酒瓶"), W("Konyak", "Коньяк", "Cognac", "白兰地"), false),
  "tanbour-cognac": bottled("bottleAmber", "cognac", W("«Tanbour» shishasi", "Бутылка «Tanbour»", "Tanbour bottle", "Tanbour酒瓶"), W("Konyak", "Коньяк", "Cognac", "白兰地"), false),
};

/** Ro'yxatda yo'q taom — kategoriyasi bo'yicha */
const FALLBACK: Record<string, Recipe> = {
  hot: { vessel: "deepPlate", layers: [{ kind: "scallion", with: [{ kind: "sesame" }], label: "scallionSesame" }, { kind: "chunk", tint: "glazeBrown", label: "beef" }, { kind: "sauce", label: "chiliOil" }] },
  noodles: { vessel: "bowl", layers: [{ kind: "scallion", label: "scallionSesame" }, { kind: "beef", label: "beef" }, { kind: "noodles", label: "noodles" }, { kind: "broth", tint: "brothRed", label: "chiliOil" }] },
  rice: { vessel: "bowl", layers: [{ kind: "scallion", label: "scallionSesame" }, { kind: "rice", label: "rice" }] },
  drinks: { vessel: "glass", layers: [{ kind: "ice", label: "ice" }, { kind: "liquid", tint: "juiceOrange", label: W("Ichimlik", "Напиток", "Drink", "饮品") }] },
};
const CAT_FALLBACK: Record<string, keyof typeof FALLBACK> = {
  signature: "hot", cold: "hot", hot: "hot", seafood: "hot", dimsum: "hot", sushi: "hot", soup: "noodles",
  noodles: "noodles", rice: "rice", drinks: "drinks", tea: "drinks", dessert: "drinks",
};

export function recipeFor(slug: string, catSlug: string): Recipe {
  return RECIPES[slug] ?? FALLBACK[CAT_FALLBACK[catSlug] ?? "hot"];
}

/** Sahnaga beriladigan shakl: pastdan yuqoriga, idish — 0-qatlam */
export function sceneOf(r: Recipe): SceneRecipe {
  return {
    vessel: r.vessel,
    vesselTint: r.vesselTint,
    layers: [{ kind: "vessel" }, ...[...r.layers].reverse().map(({ kind, tint, count, with: w }) => ({ kind, tint, count, with: w }))],
  };
}

/** Nomlar — yuqoridan pastga, oxirgisi idish */
export function labelsOf(r: Recipe, locale: string): string[] {
  return [...r.layers.map((l) => pickL(lbl(l.label), locale)), pickL(VESSEL_LABEL[r.vessel], locale)];
}

/* ---------------- Bosh sahifa lag'moni (asl modellar va kadr) ---------------- */

export const HOME_LAGMAN: SceneRecipe = {
  vessel: "bowl",
  layers: [{ kind: "vessel" }, { kind: "bowlBroth" }, { kind: "bowlNoodles" }, { kind: "bowlBeef" }, { kind: "bowlGreens" }, { kind: "bowlGarnish" }],
};
export const HOME_LAGMAN_VIEW = { target: 2.35, fitW: 6.6, fitWm: 4.2, fitH: 6.6, lift: 1.75 };
