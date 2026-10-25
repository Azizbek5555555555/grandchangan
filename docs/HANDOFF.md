# GrandChangan — yangi Claude sessiyasiga topshirish (HANDOFF)

Bu fayl ishni boshqa Claude Code akkauntida (yoki yangi sessiyada) uzilishsiz davom ettirish uchun.
**Yangi Claude: avval shu faylni, keyin `CLAUDE.md`, `docs/ROADMAP.md`, `docs/DESIGN.md` ni o'qi.**

---

## 1. Aziz uchun: yangi akkauntga loyihani qanday ulash

GitHub repo: **https://github.com/Azizbek5555555555/grandchangan** (egasi — Aziz'ning GitHub akkaunti).
Google akkaunt boshqa bo'lishi muammo emas: Claude'ga **GitHub akkauntingiz** ulanadi.

### A variant — Claude Code (veb/ilova, hozirgidek ishlash) — tavsiya
1. Yangi akkaunt bilan https://claude.ai/code ga kiring.
2. **GitHub'ni ulang**: chiqqan oynada "Connect GitHub" → GitHub'ga `Azizbek5555555555` bilan kiring → ruxsat bering.
   - Agar repo ro'yxatda ko'rinmasa: https://github.com/apps/claude/installations/select_target → akkauntingizni tanlang →
     "Only select repositories" → **grandchangan** ni belgilang → Save.
3. **Environment** (muhit) yarating/tanlang:
   - Network access: hech bo'lmaganda paket menejerlari (npm) ochiq bo'lsin. Rasm/stock kerak bo'lsa
     Allowed domains'ga `*.supabase.co`, `*.magnific.com`, `*.freepik.com` qo'shing.
   - Environment variables (ixtiyoriy, faqat lokal test uchun, prod sirlarini YOZMANG):
     `AUTH_SECRET=test-secret-123`
4. Repo sifatida **Azizbek5555555555/grandchangan** ni tanlab, yangi sessiya oching.
5. Birinchi xabarga quyidagi **"Birinchi xabar"** matnini yuboring (namuna rasmlar repo ichida — `docs/references/`).

### B variant — o'z kompyuteringizda (Windows) Claude Code CLI
1. Node.js 22 o'rnating (nodejs.org) va Git (git-scm.com).
2. Terminal (PowerShell):
   ```
   npm install -g @anthropic-ai/claude-code
   git clone https://github.com/Azizbek5555555555/grandchangan.git
   cd grandchangan
   claude
   ```
   `claude` birinchi ishga tushganda yangi akkaunt bilan login qiling.
3. Lokal ishga tushirish uchun `SETUP.md` ga qarang (Postgres, `.env`). Push uchun GitHub login so'raladi.

### Birinchi xabar (yangi Claude'ga nusxa qilib yuboring)
```
Sen GrandChangan loyihasida ishlayapsan (Samarqanddagi xitoy restorani sayti + CRM).
Avval docs/HANDOFF.md, CLAUDE.md, docs/ROADMAP.md, docs/DESIGN.md fayllarini o'qi.
Keyin HANDOFF.md dagi "Navbatdagi ishlar" ro'yxatini tartib bilan bajar.
Ish branchi: claude/pensive-gauss-fqg6hx (main'ga to'g'ridan-to'g'ri push qilma).
Har bir tugagan ishdan keyin: npx tsc --noEmit, npm run build, commit, push.
Men bilan o'zbek tilida gaplash. Namuna rasmlar: docs/references/ (README.md da izohlar).
```

### Ish tartibi (har doim shunday)
1. Claude ish branchida ishlaydi → commit → **push**.
2. Aziz GitHub'da PR ochadi: https://github.com/Azizbek5555555555/grandchangan/compare/main...claude/pensive-gauss-fqg6hx
   → **Create pull request** → **Merge pull request** → **Confirm merge**.
3. Railway `main` ni avtomatik deploy qiladi (3–5 daqiqa) → https://www.grandchangan.uz yangilanadi.
4. PR merge bo'lgandan keyin Claude yangi ishni yana shu branchda, `main` ning oxirgi holatidan boshlaydi.

---

## 2. Yangi Claude uchun: loyiha holati (2026-10-25)

- Stack: Next.js 15.5 App Router · TS · Tailwind v4 (tokenlar `src/app/globals.css` @theme) · Prisma 6 · PostgreSQL (Railway)
  · next-intl v4 (uz default prefixsiz, ru, en, zh) · GSAP + ScrollTrigger + Lenis · three.js + @react-three/fiber 9 + drei 10.
- Deploy: Railway (Railpack, Node 22). Domen: www.grandchangan.uz ishlaydi; apex `grandchangan.uz` uchun Eskiz'ga tiket yuborilgan.
- Dizayn: **docs/DESIGN.md** ("Olovli Chang'an": fire/wine/saffron/night/paper/sand tokenlari, Dela Gothic One + Playfair +
  Inter + Ma Shan Zheng; kit: `src/components/site/kit/*`). Ranglar faqat tokenlar orqali (hex yozilmaydi, three.js
  materiallari bundan mustasno — `src/components/three/palette.ts`). Krem/karta fondagi qizil matn — `text-fire-ink`.
- 3D: `src/components/three/` — HeroBowl, ExplodedBowl (scroll'da qatlamlarga ajraladi), DimSumSteamer, Lanterns;
  hammasi protsedural (tashqi model/HDR yo'q), `Lazy3D` orqali faqat ko'rinishda yuklanadi.
- Bosh sahifa bo'limlari: `src/components/site/home/*` (Hero, SignatureGrid, About, Showcase, ExplodeSection, DimSumBand,
  MenuPreview, PanelShowcase, ReserveBlock, GallerySection, Reviews) — `src/app/[locale]/page.tsx`.
- Ichki sahifalar: `src/app/[locale]/{menu,reservation,about,events,gallery,blog,contact,account}` + `src/components/site/pages/*`.
- Matnlar: `messages/{uz,ru,en,zh}.json` — kalitlar 4 faylda BIR XIL bo'lishi shart.
- Admin panel (`src/app/[locale]/admin`, `src/components/admin`) — dizayni o'zgartirilmaydi.

### Qat'iy qoidalar (CLAUDE.md + Aziz)
- `main` ga to'g'ridan-to'g'ri push YO'Q. PR'ni Aziz ochadi va merge qiladi.
- Commit: `<tur>(<soha>): o'zbekcha tavsif` (feat/fix/refactor/style/chore; admin/site/i18n/db/api).
- Schema o'zgarishi / `prisma db push` — faqat Aziz roziligi bilan. Prod bazaga `db:seed` HECH QACHON.
- Sirlarni (parol, kalit, DATABASE_URL) chatga/kodga yozma. Railway — faqat o'qish, o'zgartirish Aziz so'rasa.
- Qaytarilgan — qayta kiritma: sichqonchaga ergashuvchi 3D hero (HeroCinematic), diagonal "peel" varaq o'tishi.
- Har ishdan keyin `npx tsc --noEmit` + `npm run build`; mustaqil review (alohida subagent) va telefon (360–390px) tekshiruvi.
- Aziz bilan o'zbekcha, qisqa va aniq. Mid-task tasdiq so'rama.

### Lokal test (bulutli sessiyada)
- Postgres: `su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D /var/lib/postgresql/gcdata -o '-p 55432 -k /tmp' -l /var/lib/postgresql/pg.log start"`
  (yangi konteynerda bu baza bo'lmaydi — kerak bo'lsa Postgres o'rnatib, `npx prisma db push` (lokal!) + `npm run db:seed` (lokal!)).
- `DATABASE_URL="postgresql://postgres@localhost:55432/gc?host=/tmp" AUTH_SECRET=test-secret-123 npx next dev -p 3100`
- Playwright: `NODE_PATH=/opt/node22/lib/node_modules node script.js`, WebGL uchun
  `chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] })`. Lenis bosishlarga
  xalaqit beradi — `scrollIntoViewIfNeeded()` + kutish.

---

## 3. Navbatdagi ishlar (Aziz, 2026-10-25) — tartib bilan

Aziz fikri: "sayt yosh bolaga o'xshab qolgan, juda oddiy va detskiy; yaxshi joylari ham ko'p". Premium bo'lishi kerak.
Namuna rasmlar repo ichida: **`docs/references/`** (README.md da har birining izohi). Qayta yuklash shart emas.

1. ✅ BAJARILDI (commit df2eb88) — **Bosh sahifa HERO** (birinchi ekran) — butunlay almashtirish. Hozirgi qizil fon + matn + 3D kosa "juda oddiy".
   Premium, 3D, kinematik bo'lsin (Aziz namuna tashlashi mumkin; bo'lmasa o'zing qil). Mavjud 3D modellardan foydalanish mumkin
   (`HeroBowlScene`), lekin kompozitsiya/yorug'lik/tipografiya butunlay yangi, "Awwwards" darajasida.
2. ✅ BAJARILDI (LanternsDrop.tsx, rasmlar kattalashtirildi) — **"Biz haqimizda" bo'limi (bosh sahifa, `home/About.tsx`)** — 2 ta katta qizil blob (chap tepa va o'ng past) yoqmadi.
   Ularning o'rniga footer tepasidagi "Dasturxonimizga marhamat" bo'limidagi kabi **xitoy fonarlari**, lekin 3D emas — **2D**
   (SVG/CSS), bo'limga scroll qilib kelganda chiroyli ochilish animatsiyasi bilan (ScrollTrigger). Kollaj **rasmlarini kattaroq**
   qil — sahifaning ko'p joyini egallasa ham chiroyli.
3. ✅ BAJARILDI (6d40323, `home/ShowcaseArt.tsx`) — **"Har tarelkada — bir hikoya" (Oshpaz tanlovi, `home/Showcase.tsx`)** — juda oddiy. Premium detallar qo'sh yoki
   mavjudini premium ko'rinishga keltir (oddiy "yosh bola sayti"dek turmasin).
4. ✅ BAJARILDI (155a044, `home/ExplodeHud.tsx`) — **"Bir kosada — butun hikoya" (`home/ExplodeSection.tsx`)** — yaxshi chiqqan, lekin bo'sh joy ko'p. Premium detallar bilan to'ldir.
5. ✅ BAJARILDI (ab8f1ec, `home/ReviewsStage.tsx`; fon: mijoz rasmi → sharh taomi → galereya) — **Sharhlar (`home/Reviews.tsx`)** — almashtir: premium, birinchi qarashda odamga hikoya aytadigan; **background rasmlar**dan foydalan.
6. ✅ BAJARILDI (7b07eab, `src/components/site/heroes/*`; PageHero faqat blog maqolasida) — **Barcha sahifalarning hero'lari** (`PageHero.tsx` — hamma ichki sahifa bir xil boshlanyapti) — har biri **noodatiy va bir-biriga
   o'xshamaydigan** bo'lsin (menyu, bron, galereya, tadbirlar, blog, biz haqimizda, aloqa — har biriga o'z kompozitsiyasi).
7. ✅ BAJARILDI (`src/components/site/chrome/ScrollRail.tsx`, SmoothScroll ichida; `window.__lenis`) — **Maxsus scroll ko'rsatkich** — o'ng tomonda doim turadigan, saytga moslab qilingan scroll: tepaga/pastga tugmalari,
   sahifadagi bo'limlar (nuqtalar/raqamlar), hozir qaysi bo'limdaligini ko'rsatadi, bosganda o'sha bo'limga o'tadi.
   Oddiy brauzer scroll'i emas. (Lenis bilan ishlashi kerak: `lenis.scrollTo`.)

### Sessiya eslatmasi (2026-10-25, 2-sessiya)
- `claude/pensive-gauss-fqg6hx` PR #31 bilan merge bo'lgan; 3–6-ishlar sessiya belgilagan
  `claude/sen-grandchangan-project-ib5c95` branchida (main'ning oxirgi holatidan) qilindi — PR shu branchdan ochiladi.
- Konteyner tarmog'i unsplash/pexels/wikimedia va prod saytni bloklaydi — stock rasm olinmadi; fonlar bazadagi
  rasmlardan (galereya, taom, mijoz sharhi rasmi), bo'lmasa protsedural SVG (tush manzarasi, chinni tarelka).
- Krem hero'li sahifalarda (bron, blog, biz haqimizda) header doim to'q (`chrome/nav.ts` HERO_ROUTES).

### Aziz 2-xabari (2026-10-25) — bajarildi
- Qizil to'qlashtirildi: fire #9f0f17, fire-deep #740a10, wine #4a080b (globals.css + three/palette.ts + DESIGN.md).
- Header/mobil menyu/footer butunlay yangi (`HeaderClient.tsx`, `chrome/*`, `Footer.tsx`): markazda 匾额 lavha-logo,
  desktop header'da "Bron" havolasi yo'q (CTA bajaradi; mobil menyu va footer'da bor).
- 3D tezligi: sahna chunk'lari oldindan yuklanadi, canvas ~1.5 ekran oldin o'rnatiladi; birinchi ekran sahnalari
  (hero kosasi, menyu bug'latgichi) uchun `public/3d/*.webp` poster — 3D modeli o'zgarsa posterni qayta olish kerak
  (Playwright bilan shaffof fonli skrinshot, scratchpad'dagi poster.js usuli).
- Mashhur taomlar, Biz haqimizda, galereya (ustma-ust tushish xatosi), zal xaritasi, menyu sahifasi + bosh sahifa
  menyusi (namuna 03) — premium qayta qilindi. `.lattice-bg` mask xatosi tuzatildi (naqsh endi ko'rinadi).
- `parallel-agents` skill `.claude/skills/` ga o'rnatildi (agent teams o'chiq — subagentlar ishlatiladi).
- Aziz eslatmasi: `docs/references/` — sayt QANDAY ko'rinishi haqida namunalar, saytga qo'yiladigan rasm EMAS.

### Aziz 3-xabari (2026-10-25) — bajarildi
- Haqiqiy rasmlar: `public/photos/*.webp` (44 ta, har biri + `-md`), yagona manba `src/lib/photos.ts`;
  joylash yordamchilari `src/components/site/photos/*`. Tashqi 4 ta rasm Real-ESRGAN x4 (ncnn, CPU) bilan
  kattalashtirilgan (skript: scratchpad'da edi — kerak bo'lsa github.com/xinntao/Real-ESRGAN ncnn modeli).
- Bosh sahifa hero — tashqi rasmlar slayd-shousi (`home/Hero.tsx`, `home/hero/*`), 3D kosa hero'da yo'q.
- O'rinlar (layout.ts): VIP 12/12/13/10/10, zal 8×10 + Z-9 (14) + Z-10/Z-11 (6), kabinalar 5×6 — 22 stol, 199 o'rin.
  **Prod'da admin → Zallar va stollar → "Xaritadan stollarni yaratish" bir marta bosilishi kerak.**
- Telefon +998 77 507 06 43 (`src/lib/contact.ts` zaxira), ish vaqti 10:00–23:00 — prod'da admin → Sozlamalar.
- Xarita bo'limni to'ldiradi + xona rasmlari; admin inventar soddalashtirildi ("Holat" yorlig'i, yo'riqnoma).

### Ma'lum muammolar / eslatmalar
- Aziz saytni `/en` da Chrome avto-tarjimasi bilan ko'rgan — "21" "двадцать один" ga, "GrandChangan" "Отель ..." ga tarjima bo'lgan.
  Ruscha uchun `/ru` ochish kerak, Chrome tarjimasini o'chirish. Raqam/brendga `translate="no"` qo'yish foydali.
- Admin'dagi HERO banner matni (title/subtitle) bosh sahifa hero'sida chiqadi — prodda subtitle'da noto'g'ri ("Hindiston" haqida)
  matn bor; Aziz admin → Bannerlar'dan to'g'rilashi yoki o'chirishi kerak (yoki hero bannerni e'tiborsiz qoldirish).
- Review'dan qolgan kichik ishlar: bron sahifasidagi oldindan buyurtma pastki panelining kirish animatsiyasidagi siljish;
  telefon menyusidagi zafar rang kontrasti.
- Magnific hisobi bepul (0 kredit); konteyner tarmog'i magnific.com'ni bloklagan edi.
