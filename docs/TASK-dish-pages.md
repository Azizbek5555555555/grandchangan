# Vazifa: har bir taomning o'z sahifasi + taomga moslangan "qatlamli" 3D animatsiya

Aziz (mijoz talabi, 2026-10-28):
> Bosh sahifadagi "В одной пиале — целая история" (lag'mon kosasi scroll'da qatlamlarga ajraladi) animatsiyasi
> menyudagi HAMMA taomga kerak — har biriga o'z ovqatiga, ichidagi ingredientlarga moslab. Menyuda taomni bosganda
> taomning o'z sahifasi ochilsin: ma'lumotlari va shu animatsiya bilan.

Mijoz saytni qabul qilishda menyu to'liqligini tekshirgan — bu ish ham to'lovga bog'liq. Sifat birinchi o'rinda.

---

## 1. Hozirgi holat (bu vazifaga tegishli qismi)

- **Menyu bazada 130 pozitsiya** (prod'da bor, rasmlari bilan). Manba kod — Clopos POS'dan olingan:
  - `src/lib/menu/sample-dishes.ts` — 30 ta taom (rasmli, `SAMPLE_DISHES`), kategoriyalar (`SAMPLE_CATEGORIES`),
    hammasi birga `ALL_DISHES`, rasm yo'li `dishImage(slug)` → `/photos/dishes/<slug>.webp`.
  - `src/lib/menu/clopos-menu.ts` — qolgan 100 pozitsiya (`CLOPOS_REST`): nom va tavsif 4 tilda (`[uz, ru, en, zh]`),
    `spicy`, `veg`, `halal`. 34 tasi ichimlik (`cat: "drinks"`).
  - Kategoriya slug'lari: `signature, cold, hot, seafood, noodles, dimsum, rice, soup, sushi, drinks`.
  - `docs/clopos-map.json` — Clopos ID → slug (Clopos bilan solishtirish uchun).
  - Bazada `MenuItem.slug` unique; nom/tavsif `Json` ({uz,ru,en,zh}); `price` 0 = narx yashirin (`hasPrice()`),
    hozir **hech bir taomda narx ko'rsatilmaydi** (Aziz talabi).
- **Rasmlar**: `public/photos/dishes/<slug>.webp` (800×800 kvadrat, 126 ta). 4 ta ichimlik rasmini (borjomi,
  chinese-black-tea, draft-beer, wine) Aziz admin orqali yuklagan — bazadagi `imageUrl` dan oling, fayldan emas.
- **Menyu sahifasi**: `src/app/[locale]/menu/page.tsx` → `src/components/site/MenuBrowser.tsx` (kartalar
  `src/components/site/menu/DishCell.tsx`, `Plated.tsx`). Hozir taomni bosish hech qayerga olib bormaydi
  (`goDish` faqat ro'yxatda scroll qiladi). Taomning alohida sahifasi YO'Q: `/ru/menu/xyz` hozir
  `[locale]/[...rest]` orqali dizaynli 404 ga tushadi.
- **Namuna animatsiya (bosh sahifa)**:
  - `src/components/site/home/ExplodeSection.tsx` — sticky bo'lim (`data-explode-track`, `h-[230vh]`), chapda
    sarlavha + `ExplodeHud.tsx` (jonli qatlam ko'rsatkichi 01/06), o'ngda 3D.
  - `src/components/three/ExplodedBowl.tsx` → `scenes/ExplodedBowlScene.tsx` — three.js (@react-three/fiber 9,
    drei 10), **protsedural** (tashqi model/HDR yo'q). Scroll progress `[data-explode-track]` dan; qatlamlar
    `GAP` bilan ajraladi; har qatlam yonida chiziq + nom (`Html`). Jadval: `LABEL_START/STEP/FADE` (ExplodeHud bilan bir xil).
  - Modellar: `three/models/{Bowl,Noodles,BowlToppings,Ingredients,Dumpling,Steamer,Chopsticks}.tsx`;
    `useFoodKit()` (Ingredients.tsx) — chili, yulduz anis, piyoz halqasi, kunjut, murch, bok-choy bargi, kashnich,
    mol go'shti tilimi geometriya+materiallari. Yordamchilar: `three/lib/*` (SceneCanvas, StudioLights, BlobShadow,
    useFitCamera, motion: clamp01/smooth/enterProgress, Lazy3D, dispose). Ranglar: `three/palette.ts`.

## 2. Tavsiya etilgan yechim (Aziz bilan kelishilgan yo'nalish)

**130 ta alohida sahifa fayli EMAS** — bitta dinamik shablon: `src/app/[locale]/menu/[slug]/page.tsx`.
URL'lar 130 ta bo'ladi (SEO uchun ham yaxshi), kod esa bitta. Animatsiya ham **130 ta qo'lda yozilgan sahna emas** —
bitta umumiy sahna + har taom uchun kichik ma'lumot (retsept qatlamlari).

### 2.1 Taom sahifasi
- `src/app/[locale]/menu/[slug]/page.tsx` (server): `prisma.menuItem.findUnique({ where: { slug }, include: { category } })`;
  yo'q yoki `isAvailable=false` → `notFound()`.
- **MUHIM (Railway):** build paytida baza YO'Q. `generateStaticParams` bilan bazadan slug olmang, statik prerender
  qilinadigan joyda bazaga murojaat qilmang (bir marta build shu sabab yiqilgan — 404 sahifa header'i bazani so'ragan edi).
  Sahifa dinamik bo'lsin (`export const dynamic = "force-dynamic"` yoki `revalidate`), build'ni shunday tekshiring:
  `DATABASE_URL="postgresql://u:p@nohost.invalid:5432/gc" AUTH_SECRET=x npm run build` — o'tishi shart.
- `generateMetadata`: taom nomi (locale), tavsif, OG rasm = taom rasmi.
- Tarkib: hero (taom rasmi — saytdagi chinni tarelka uslubida, `Plated`/`SafeImg`), nom (tanlangan til + xitoycha
  `font-cn`), kategoriya, tavsif, belgilar (achchiqlik, vegetarian, halol — ichimliklarda halol yo'q), narx faqat
  `hasPrice()` bo'lsa (hozir yashirin), CTA: "Stol band qilish / oldindan buyurtma" → `/reservation`.
  Keyin **qatlamli animatsiya bo'limi**, keyin shu kategoriyadan 4–6 ta boshqa taom, oldingi/keyingi taom navigatsiyasi,
  "Menyuga qaytish".
- **Bog'lash**: menyu kartalari (`DishCell`, `MenuBrowser` dagi "招牌菜" qatori), bosh sahifa `Showcase.tsx`,
  `MenuPreview`, `pages/MenuSpecials.tsx` — taom nomi/rasmi `/menu/<slug>` ga `Link` (`@/i18n/navigation`).
  Kartaning boshqa tugmalari (oldindan buyurtma) ishlashda davom etsin.
- Sahifa header'i: `chrome/nav.ts` dagi qorong'i/krem hero qoidasiga qo'shing (`/menu/[slug]`).

### 2.2 Umumiy qatlamli sahna (data-driven)
- `ExplodedBowlScene` ni umumlashtiring → masalan `three/scenes/ExplodedDishScene.tsx` + `three/ExplodedDish.tsx`:
  props — retsept konfiguratsiyasi va 4 tildagi qatlam nomlari. Bosh sahifadagi lag'mon ham shu sahna orqali
  ishlasin (ko'rinishi O'ZGARMASIN — regressiya bo'lmasin).
- `ExplodeHud` va bo'lim kompozitsiyasini (`ExplodeSection`) qayta ishlatiladigan qiling: sarlavha/qatlamlar soni
  (3–6) prop orqali.
- **Retseptlar fayli**: `src/lib/menu/recipes.ts` — har slug uchun:
  ```ts
  { vessel: "bowl" | "deepPlate" | "plate" | "clayPot" | "steamer" | "mortar" | "board" | "fishPlatter"
            | "skewers" | "glass" | "bottle" | "cup",
    layers: [ { kind: IngredientKind, tint?: string, count?: number, label: { uz, ru, en, zh } } ] } // yuqoridan pastga, 3–6 ta
  ```
  Qatlam nomlari shu faylda 4 tilda (taom ma'lumotlari kabi); sahifa interfeysi matnlari (sarlavha, tugmalar) —
  `messages/{uz,ru,en,zh}.json`, 4 faylda bir xil kalit.
- **Ingredient "kit"ini kengaytiring** (`useFoodKit` uslubida, geometriya+material bir joyda, `dispose`):
  mavjud: lag'mon, mol go'shti tilimi, bok-choy, kashnich, piyoz halqasi, kunjut, chili, murch, anis, chuchvara, bambuk savat.
  Kerak bo'ladiganlar (taxminan): sho'rva/qayla diski (rang parametri), guruch tepaligi, tofu kubiklari, krevetka,
  baliq (butun/bo'lak), tovuq bo'laklari, go'shtli sharcha, tuxum (qovurilgan/bug'langan), kartoshka somonchasi,
  yashil loviya, baqlajon, bodring, pomidor/cherri, yeryong'oq/keshyu, salat bargi, qo'ziqorin, bambuk novdasi,
  qo'y go'shti/qovurg'a, o'rdak tilimi + blinchik, yassi non, sushi roll, kabob sixi, muz kubigi, suyuqlik (stakan),
  meva tilimi, yalpiz. Hammasi protsedural, mobil uchun yengil varianti bilan.
- Har taomning qatlamlarini **taom rasmi** (`public/photos/dishes/<slug>.webp`) va tavsifiga qarab tanlang — rang
  va masalliqlar rasmga mos bo'lsin.
- **Ichimliklar (34)**: soddaroq preset — stakan (suyuqlik + muz + bezak: limon/yalpiz/qulupnay) yoki shisha
  (cola, pivo, konyak, suv: shisha + stakan + muz). Sahifa ularda ham bo'lsin.
- Ishlash: sahifada bitta canvas, `Lazy3D` (ko'rinishda yuklash), mobil geometriya kamroq, `prefers-reduced-motion`
  da qatlamlar statik ajralgan holda; WebGL bo'lmasa — taom rasmi. 3D'siz holatda ham sahifa to'liq ma'lumotli.

### 2.3 Bosqichlar
1. Sahifa + bog'lash + metadata (animatsiyasiz ham to'liq ishlaydigan) → commit.
2. Umumiy sahna + kengaytirilgan kit + 6–8 ta vessel preset; bosh sahifa lag'moni shu sahnaga o'tadi (ko'rinish bir xil) → commit.
3. 130 ta retsept — kategoriya bo'yicha partiyalarda (kerak bo'lsa `.claude/skills/parallel-agents` bilan subagentlarga
   bo'lib: har biri o'z kategoriyasi, lead birlashtiradi) → commitlar.
4. QA: Playwright bilan 130 ta sahifaning hammasini aylanib chiqish (status 200, konsolda xato yo'q, 3D chizilgan),
   kontakt-varaq skrinshot bilan ko'z bilan tekshirish; 1440 va 390px; yorug' va qorong'i tema; `/uz /ru /en /zh`.
   Mustaqil review (alohida subagent). `npx tsc --noEmit` + bazasiz `npm run build`.

## 3. Qoidalar (qisqacha — to'liqi CLAUDE.md va docs/HANDOFF.md da)
- Aziz bilan o'zbekcha, qisqa. Mid-task tasdiq so'rama. `main` ga push yo'q — sessiya branchida; PR'ni Aziz ochadi.
- Commit: `<tur>(<soha>): o'zbekcha tavsif`. Schema o'zgarishi / `prisma db push` — faqat Aziz roziligi bilan
  (bu vazifa uchun schema kerak emas). Prod bazaga seed HECH QACHON. Sirlarni kodga/chatga yozma.
- Ranglar faqat tokenlar (three.js materiallari — `three/palette.ts`). Yorug' rejim dizayni o'zgarmasin.
- Qaytarilgan — qayta kiritma: sichqonchaga ergashuvchi 3D hero (HeroCinematic), diagonal "peel" o'tish.
- Lokal test: docs/HANDOFF.md "Lokal test" bo'limi. Lokal bazada menyu: seed'dan keyin admin → Menyu →
  "Clopos menyusi (130)" tugmasi (lokal admin: admin@grandchangan.uz / admin12345 — faqat lokal seed).
  WebGL skrinshot: `chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] })`.
- Prod sayt: https://www.grandchangan.uz (konteynerdan ochiladi — natijani curl/Playwright bilan tekshirsa bo'ladi).
