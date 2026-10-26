import { PHOTOS } from "@/lib/photos";

/**
 * Restoran haqidagi 3 ta blog posti (Aziz, 2026-10-26: test postlar o'rniga) — admin → Blog → "Restoran postlari (3)"
 * tugmasi qo'yadi. Matn oddiy matn: paragraflar bo'sh qator bilan ajratiladi (post sahifasi whitespace-pre-wrap).
 * Muqova — restoranning haqiqiy rasmlari (public/photos, o'rta o'lcham).
 */

type L = { uz: string; ru: string; en: string; zh: string };

export type SamplePost = { slug: string; cover: string; tags: string[]; title: L; excerpt: L; content: L };

const P = (...paragraphs: string[]) => paragraphs.join("\n\n");

export const SAMPLE_POSTS: SamplePost[] = [
  {
    slug: "changan-spirit-in-samarkand",
    cover: PHOTOS.extGate.md,
    tags: ["restoran", "tarix"],
    title: {
      uz: "Samarqand qalbida qadimiy Chang'an ruhi",
      ru: "Дух древнего Чанъаня в сердце Самарканда",
      en: "The spirit of ancient Chang'an in the heart of Samarkand",
      zh: "撒马尔罕城中的长安风韵",
    },
    excerpt: {
      uz: "GrandChangan — Buyuk Ipak yo'lining ikki qadimiy shahri, Chang'an va Samarqandni bir dasturxonda uchrashtiradigan xitoy restorani.",
      ru: "GrandChangan — китайский ресторан, где за одним столом встречаются два великих города Шёлкового пути: Чанъань и Самарканд.",
      en: "GrandChangan is a Chinese restaurant where two great cities of the Silk Road — Chang'an and Samarkand — meet at one table.",
      zh: "GrandChangan 是一家中餐厅，让丝绸之路上的两座古城——长安与撒马尔罕——在同一张餐桌上相遇。",
    },
    content: {
      uz: P(
        "Chang'an — bugungi Shi'an shahrining qadimiy nomi. Asrlar davomida Buyuk Ipak yo'li aynan shu yerdan boshlangan: karvonlar ipak, choy va chinni ortib, minglab chaqirim yo'l bosib Samarqandga yetib kelgan. GrandChangan — shu tarixiy yo'lning bugungi davomi: Samarqand markazida xitoy oshxonasining asl ta'mi va Chang'an saroylari ruhidagi muhit.",
        "Restoranga qadam qo'yishingiz bilan buni his qilasiz: qizil fonuslar, o'ymakor yog'och panjaralar, oltin naqshlar va chinni idishlar sizni boshqa bir dunyoga olib kiradi. Kirish darvozasidan tortib stoldagi likopchagacha har bir detal xitoy an'analariga hurmat bilan tanlangan.",
        "Oshxonamizda Shensi, Sichuan va Shanxay oshxonalarining mashhur taomlari tayyorlanadi: ziravorlarda dimlangan mol go'shti, qarsildoq dudlangan baliq, sichuan qalampirli tovuq, xamir taomlari va yengil sovuq gazaklar.",
        "GrandChangan faqat restoranning o'zida xizmat ko'rsatadi — yetkazib berish yo'q. Sababi oddiy: xitoy taomlari dasturxonga endigina tayyor bo'lib, issiq holda tortilganda eng mazali bo'ladi. Vaqtingizni tejash uchun esa oldindan buyurtma xizmati bor — kelishingizga taomlaringiz tayyor turadi.",
        "Bizni Samarqand, Ibn Xoldun ko'chasi 10B manzilida topasiz. Har kuni 10:00 dan 23:00 gacha ochiqmiz. Stolni saytimiz orqali bir necha daqiqada band qilishingiz yoki +998 77 507 06 43 raqamiga qo'ng'iroq qilishingiz mumkin.",
      ),
      ru: P(
        "Чанъань — древнее название нынешнего Сианя. Веками именно отсюда начинался Великий шёлковый путь: караваны с шёлком, чаем и фарфором проходили тысячи вёрст и добирались до Самарканда. GrandChangan — продолжение этого пути сегодня: настоящий вкус китайской кухни и атмосфера дворцов Чанъаня в центре Самарканда.",
        "Вы почувствуете это с первого шага: красные фонари, резные деревянные решётки, золотые орнаменты и фарфор переносят в другой мир. Каждая деталь — от входных ворот до тарелки на столе — подобрана с уважением к китайским традициям.",
        "На нашей кухне готовят знаменитые блюда шэньсийской, сычуаньской и шанхайской кухни: томлённую в пряностях говядину, хрустящую копчёную рыбу, курицу с сычуаньским перцем, блюда из теста и лёгкие холодные закуски.",
        "GrandChangan работает только в зале — доставки нет. Причина проста: китайские блюда вкуснее всего, когда их подают горячими, только что с огня. А чтобы сэкономить ваше время, есть предзаказ — к вашему приходу блюда будут готовы.",
        "Мы находимся в Самарканде, на улице Ибн Халдуна, 10Б. Открыты ежедневно с 10:00 до 23:00. Забронировать стол можно на сайте за пару минут или по телефону +998 77 507 06 43.",
      ),
      en: P(
        "Chang'an is the ancient name of today's Xi'an. For centuries the Great Silk Road began right there: caravans loaded with silk, tea and porcelain travelled thousands of miles to reach Samarkand. GrandChangan carries that road into the present — the true taste of Chinese cuisine and the atmosphere of Chang'an's palaces in the heart of Samarkand.",
        "You feel it from the very first step: red lanterns, carved wooden lattices, gold ornaments and fine porcelain carry you into another world. Every detail, from the entrance gate to the plate on your table, was chosen with respect for Chinese tradition.",
        "Our kitchen cooks signature dishes from Shaanxi, Sichuan and Shanghai cuisines: beef braised in aromatic spices, crisp smoked fish, chicken with Sichuan peppercorn, hand-made dough dishes and light cold starters.",
        "GrandChangan serves guests in the restaurant only — there is no delivery. The reason is simple: Chinese food is at its best when it reaches the table hot, straight from the wok. To save you time we offer pre-ordering, so your dishes are ready when you arrive.",
        "You will find us in Samarkand at 10B Ibn Khaldun Street. We are open every day from 10:00 to 23:00. Book a table on our website in a couple of minutes or call +998 77 507 06 43.",
      ),
      zh: P(
        "长安，是今日西安的古称。千百年来，丝绸之路正是从这里出发：满载丝绸、茶叶与瓷器的驼队跋涉万里，抵达撒马尔罕。GrandChangan 让这条古道延续至今——在撒马尔罕市中心，呈现地道的中华美味与长安宫阙般的氛围。",
        "踏入餐厅的那一刻，您便能感受到：红灯笼、木雕花窗、金色纹饰与精美瓷器，将您带入另一个世界。从入口门楼到餐桌上的一只碟子，每个细节都怀着对中华传统的敬意精心挑选。",
        "我们的厨房烹制陕西、四川与上海风味的招牌菜：香料卤牛肉、酥香熏鱼、椒麻鸡、手工面食以及清爽凉菜。",
        "GrandChangan 只提供堂食，不做外卖。原因很简单：中餐出锅即上桌时最为美味。为节省您的时间，我们提供预点餐服务——您到店时，菜品已准备就绪。",
        "地址：撒马尔罕市伊本·赫勒敦街 10B。每天 10:00 至 23:00 营业。您可以在网站上几分钟内预订餐桌，或致电 +998 77 507 06 43。",
      ),
    },
  },
  {
    slug: "halls-of-grandchangan",
    cover: PHOTOS.hallUmbrellas.md,
    tags: ["zallar", "bron"],
    title: {
      uz: "Har bir davra uchun o'z zali: umumiy zal, VIP xonalar va kabinalar",
      ru: "Свой зал для каждого случая: общий зал, VIP-комнаты и кабинки",
      en: "A room for every occasion: the main hall, VIP rooms and booths",
      zh: "每一场相聚都有专属空间：大厅、贵宾包间与雅座",
    },
    excerpt: {
      uz: "Do'stlar bilan kechki ovqat, oilaviy bayram yoki ishbilarmonlik uchrashuvi — GrandChangan'da har biriga mos joy bor.",
      ru: "Ужин с друзьями, семейный праздник или деловая встреча — в GrandChangan для каждого найдётся подходящее место.",
      en: "Dinner with friends, a family celebration or a business meeting — GrandChangan has the right place for each.",
      zh: "无论是好友小聚、家庭庆典还是商务宴请，GrandChangan 都有合适的空间。",
    },
    content: {
      uz: P(
        "GrandChangan'ni loyihalashda biz bitta savolga javob izladik: mehmon qanday davra bilan kelmasin, o'zini qulay his qilishi uchun nima kerak? Shu sababli restoranda bir nechta turdagi zal bor.",
        "Umumiy zal — restoranning yuragi. Tepada osilib turgan qizil soyabonlar, keng dumaloq stollar va o'ymakor to'siqlar katta davra uchun ham, ikki kishilik kechki ovqat uchun ham iliq muhit yaratadi. Dumaloq stol xitoy an'anasida bejiz tanlanmagan: uning atrofida hamma bir-birini ko'radi, taomlar esa o'rtaga qo'yilib, baham ko'riladi.",
        "VIP xonalar — alohida va sokin muhit kerak bo'lgan uchrashuvlar uchun. Billur qandillar, oltin bezaklar va katta dumaloq stol oilaviy bayramlar, yubileylar va ishbilarmonlik kechki ovqatlariga mos keladi.",
        "Kabinalar — dumaloq derazali, yumshoq divanli shinam burchaklar. Ikki-to'rt kishilik davra uchun, shoshilmasdan suhbatlashib o'tirish uchun ayni muddao.",
        "Har bir stolning o'rinlar soni saytdagi zal xaritasida ko'rsatilgan. Bron qilayotganda xaritadan o'zingizga yoqqan stolni tanlaysiz, xohlasangiz taomlarni ham oldindan buyurtma qilasiz. Katta tadbir rejalashtirayotgan bo'lsangiz, «Tadbirlar» bo'limida so'rov qoldiring — biz siz bilan bog'lanamiz.",
      ),
      ru: P(
        "Создавая GrandChangan, мы искали ответ на один вопрос: что нужно гостю, чтобы ему было уютно, с какой бы компанией он ни пришёл? Поэтому в ресторане есть залы нескольких типов.",
        "Общий зал — сердце ресторана. Красные зонты под потолком, просторные круглые столы и резные перегородки создают тёплую атмосферу и для большой компании, и для ужина вдвоём. Круглый стол в китайской традиции выбран не случайно: за ним все видят друг друга, а блюда ставят в центр и делят на всех.",
        "VIP-комнаты — для встреч, где нужны уединение и тишина. Хрустальные люстры, золотой декор и большой круглый стол подходят для семейных праздников, юбилеев и деловых ужинов.",
        "Кабинки — уютные уголки с круглыми окнами и мягкими диванами. Идеально для компании из двух–четырёх человек и неспешной беседы.",
        "Количество мест за каждым столом указано на схеме зала на сайте. При бронировании вы выбираете понравившийся стол прямо на схеме и при желании заранее заказываете блюда. Планируете крупное мероприятие? Оставьте заявку в разделе «Мероприятия» — мы с вами свяжемся.",
      ),
      en: P(
        "When we designed GrandChangan, we kept asking one question: whatever company a guest arrives with, what do they need to feel at ease? That is why the restaurant has several kinds of rooms.",
        "The main hall is the heart of the restaurant. Red parasols hanging overhead, generous round tables and carved screens create a warm setting for a large party as well as a dinner for two. The round table is a deliberate Chinese tradition: everyone can see each other, and dishes are placed in the middle to be shared.",
        "VIP rooms are for gatherings that call for privacy and calm. Crystal chandeliers, gold décor and a large round table suit family celebrations, anniversaries and business dinners.",
        "Booths are cosy corners with round windows and soft sofas — perfect for two to four guests and an unhurried conversation.",
        "The number of seats at every table is shown on the floor plan on our website. When booking, you pick the table you like right on the plan and can pre-order your dishes if you wish. Planning a larger event? Send a request in the Events section and we will get in touch.",
      ),
      zh: P(
        "设计 GrandChangan 时，我们一直在思考：无论客人与谁同来，怎样才能让他们感到自在？因此，餐厅设有多种不同的用餐空间。",
        "大厅是餐厅的心脏。头顶悬挂的红伞、宽敞的圆桌与木雕屏风，无论是大型聚会还是二人晚餐，都能营造温暖的氛围。圆桌是中华传统的用心之选：围桌而坐，彼此相望，菜肴放在中间，大家共享。",
        "贵宾包间适合需要私密与安静的聚会。水晶吊灯、金色装饰与大圆桌，非常适合家庭庆典、寿宴与商务宴请。",
        "雅座是带圆窗和软沙发的温馨角落，适合两至四人从容畅谈。",
        "网站上的餐厅平面图标明了每张桌子的座位数。预订时，您可以直接在平面图上选择心仪的餐桌，也可以提前点好菜。如需举办大型活动，请在「活动」页面提交需求，我们会与您联系。",
      ),
    },
  },
  {
    slug: "start-with-cold-dishes",
    cover: PHOTOS.vipTableTop.md,
    tags: ["menyu", "tavsiya"],
    title: {
      uz: "Sovuq gazaklardan boshlang: oshpazimiz tavsiya qiladigan 5 taom",
      ru: "Начните с холодных закусок: 5 блюд, которые советует наш шеф",
      en: "Start with cold dishes: 5 plates our chef recommends",
      zh: "从凉菜开始：主厨推荐的五道菜",
    },
    excerpt: {
      uz: "Xitoy dasturxoni an'anaga ko'ra sovuq gazaklardan boshlanadi. Menyumizdagi eng sevimli beshtasi bilan tanishing.",
      ru: "По традиции китайское застолье начинается с холодных закусок. Знакомьтесь с пятью любимыми блюдами нашего меню.",
      en: "A Chinese meal traditionally opens with cold dishes. Meet five favourites from our menu.",
      zh: "中式宴席向来以凉菜开场。来认识我们菜单上最受欢迎的五道凉菜。",
    },
    content: {
      uz: P(
        "Xitoyda ziyofat hech qachon birdaniga issiq taomdan boshlanmaydi. Avval stolga sovuq gazaklar qo'yiladi: ular ishtahani ochadi, suhbatni boshlab beradi va keyingi taomlar uchun ta'm ohangini belgilaydi. GrandChangan menyusidan boshlash uchun beshta tavsiyamiz:",
        "1. Chang'an «Dadao» mol go'shti. Ziravorlarda sekin dimlangan mol go'shti katta pichoqda yupqa tilimlanadi — restoranimizga nom bergan shaharning klassik taomi.",
        "2. Shanxaycha dudlangan baliq. Qarsildoq qovurilgan baliq bo'laklari shirin soya-ziravorli qaylaga botiriladi: shirin va sho'r ta'mning ajoyib uyg'unligi.",
        "3. Marakuyyali sovutilgan cherri pomidorlar. Po'sti archilgan pomidorlar marakuyya sharbatida, muz ustida tortiladi — yengil, tetiklantiruvchi va juda chiroyli.",
        "4. Shinjoncha sichuan qalampirli tovuq. Qo'lda titilgan yumshoq tovuq sichuan qalampiri bilan — tilni yoqimli uvishtiradigan mashhur ta'm.",
        "5. Ming yillik tuxumli baqlajon. Olovda pishirilgan baqlajon va qalampir tosh hovonchada yanchiladi: tutun hidi va boy ta'mga ega taom.",
        "Bu taomlarni o'rtaga qo'yib, davra bilan birga tatib ko'rish eng yaxshisi. To'liq menyu saytimizning «Menyu» bo'limida. Taomlarni oldindan buyurtma qilsangiz, ular stolingizga o'z vaqtida tortiladi.",
      ),
      ru: P(
        "В Китае застолье никогда не начинается сразу с горячего. Сначала на стол ставят холодные закуски: они пробуждают аппетит, задают тон беседе и вкусу всего ужина. Вот пять наших советов, с чего начать знакомство с меню GrandChangan:",
        "1. «Чанган Дадао» — ломтики говядины. Томлённую в пряностях говядину нарезают большим ножом тонкими ломтиками — классика города, давшего имя нашему ресторану.",
        "2. Шанхайская копчёная рыба. Хрустящие кусочки рыбы пропитывают сладким соево-пряным маринадом: изумительное сочетание сладкого и солёного.",
        "3. Охлаждённые томаты черри с маракуйей. Очищенные томаты в соке маракуйи подают на льду — легко, свежо и очень красиво.",
        "4. Курица по-синьцзянски с сычуаньским перцем. Нежная курица, разобранная вручную, с сычуаньским перцем — знаменитый вкус, приятно покалывающий язык.",
        "5. Баклажаны с тысячелетним яйцом. Печёные на огне баклажаны и перец толкут в каменной ступке: блюдо с дымным ароматом и богатым вкусом.",
        "Эти блюда лучше всего ставить в центр стола и пробовать всей компанией. Полное меню — в разделе «Меню» на сайте. Сделайте предзаказ, и блюда подадут к вашему столу вовремя.",
      ),
      en: P(
        "In China a feast never jumps straight to the hot dishes. Cold plates come first: they wake up the appetite, start the conversation and set the tone for everything that follows. Here are five suggestions for where to begin on the GrandChangan menu:",
        "1. Chang'an \"Dadao\" sliced beef. Beef slowly braised in spices and carved into thin slices with a broad cleaver — a classic from the city that gave our restaurant its name.",
        "2. Shanghai smoked fish. Crisp-fried fish soaked in a sweet soy and spice glaze: a wonderful balance of sweet and savoury.",
        "3. Chilled cherry tomatoes with passion fruit. Peeled tomatoes steeped in passion-fruit syrup and served on ice — light, refreshing and beautiful.",
        "4. Xinjiang-style Sichuan pepper chicken. Tender hand-torn chicken with Sichuan peppercorn — the famous flavour that pleasantly tingles on the tongue.",
        "5. Eggplant with century egg. Fire-roasted eggplant and peppers pounded in a stone mortar: smoky, deep and rich.",
        "These dishes are best placed in the middle of the table and shared. The full menu is in the Menu section of our website. Pre-order your dishes and they will be served to your table right on time.",
      ),
      zh: P(
        "在中国，宴席从不直接上热菜。先上桌的是凉菜：它们开胃、开启话题，也为整顿饭定下味道的基调。以下是我们推荐的五道开场菜：",
        "1. 长安大刀牛肉片。香料慢卤的牛肉，以大刀切成薄片——来自我们餐厅得名之城的经典风味。",
        "2. 上海熏鱼。鱼块炸至酥香，浸入甜咸五香汁，甜与咸的绝妙平衡。",
        "3. 冰镇百香果番茄。去皮圣女果浸百香果汁，冰镇上桌——清爽、解腻，颜值满分。",
        "4. 西域椒麻鸡。手撕嫩鸡配花椒，麻香在舌尖跳跃。",
        "5. 擂椒皮蛋茄子。烧茄子与青椒在石臼中擂碎，带着烟火香气，滋味浓郁。",
        "这些菜最适合放在餐桌中央，大家一同品尝。完整菜单请见网站「菜单」页面。提前点餐，菜品将准时送到您的餐桌。",
      ),
    },
  },
];
