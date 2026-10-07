# GrandChangan — Restoran sayti + CRM

> 🚀 Kompyuterda ishga tushirish va Railway sozlash: **[SETUP.md](./SETUP.md)** (qadam-baqadam, o'zbekcha)

Xitoy restorani (Samarqand) uchun to'liq sayt va boshqaruv paneli.
Next.js 15 · TypeScript · Tailwind v4 · Prisma 6 · PostgreSQL · next-intl v4.

**Dine-in va oldindan buyurtma (pre-order). Yetkazib berish yo'q.**

## O'rnatish

```bash
npm install
cp .env.example .env          # qiymatlarni to'ldiring
npm run db:generate           # prisma client
npm run db:push               # bazani schema bilan sinxronlash
npm run db:seed               # admin + namuna ma'lumot
npm run dev
```

`.env` da kamida: `DATABASE_URL`, `AUTH_SECRET`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.

## Kirish

- Sayt: `/` (uz/ru/en/zh — `/ru`, `/en`, `/zh`)
- Admin panel: `/admin/login` (email + parol). Rollar: boshqaruv (menejer/admin/superadmin) — hamma bo'limlar;
  ofitsiant — bronlar va buyurtmalar; oshxona — buyurtmalar. Xodimlar admin → **Xodimlar** bo'limida qo'shiladi.
- Mijoz kabineti: `/account` (telefon + SMS OTP)

## Modullar (tayyor)

**Sayt (public):** bosh sahifa (banner + mashhur taomlar + sharhlar), menyu (qidiruv/filtr),
stol band qilish (3 qadam, vizual zal xaritasi), galereya, tadbir arizasi, blog, biz haqimizda, aloqa,
mijoz kabineti (OTP), 4 til, til almashtirgich.

**Admin CRM:** dashboard (7-kunlik daromad grafigi + statistikalar), menyu (kategoriya/taom CRUD),
zallar va stollar (drag-drop floor-plan muharrir), bronlar, buyurtmalar (kanban), sharh moderatsiyasi,
bannerlar, aksiya/kuponlar, galereya, tadbir so'rovlari, blog, mijozlar (bloklash), sozlamalar
(umumiy + ish vaqti), to'lovlar ro'yxati.

**Xizmatlar:** SMS (Eskiz.uz — kalitsiz DEV rejim), Telegram xabarnoma (kalitsiz DEV rejim),
rasm yuklash (`/api/upload`).

## Hali qoladi (keyingi bosqich)

- **To'lov (Payme/Click/Uzum):** skelet tayyor (`src/lib/payments`, `src/app/api/payments/*`).
  Ishga tushirish uchun merchant kalitlari (.env) va har bir provayder sandbox'ida webhook testi kerak.
- **Rasm saqlash:** Supabase Storage (`src/lib/storage/supabase.ts`, `.env`: `SUPABASE_URL`,
  `SUPABASE_SECRET_KEY`). Eski lokal rasmlarni ko'chirish: `npm run uploads:migrate`.
- **GSAP animatsiya / kengaytirilgan SEO (Bosqich 8):** dizayn sayqali, opsiyonel.

## Eslatma

Tailwind **v4** ishlatilgan (CSS-based `@theme`). Agar jamoa v3 da bo'lsa, `globals.css` va
`postcss.config` ni v3 ga moslash kerak.

## Dizayn (Bosqich 8 — boshlangan)

Reference: marakand-teatr.uz uslubidagi kinematik, elegant dizayn.

**Qo'shilgan texnologiyalar** (yangi `npm install` kerak):
- **GSAP + ScrollTrigger** — scroll animatsiyalari (`Reveal`, `RevealGroup`)
- **Lenis** — smooth scroll (`SmoothScroll` provider; admin panelda o'chirilgan)
- **Swiper** — mashhur taomlar slayderi (coverflow effekti)
- **next/font** — Playfair Display (serif display) + Inter (sans)

**Qayta dizayn qilingan:** bosh sahifa (to'liq kinematik: hero, story, slayder, CTA, sharhlar),
Header (transparent→solid scroll, mobil drawer), Footer, About, Contact, Menyu, Bron, Galereya,
Tadbirlar, Blog — barchasi `PageHero` + reveal animatsiyalari bilan.

Dizayn tokenlari `globals.css` da (`@theme`): ink/gold/red/cream palitra, serif shrift,
`.font-display`, `.hero-scrim`, `.hairline-gold`, `.gold-glow`.

> Eslatma: haqiqiy hero rasmi admin → Bannerlar (HERO) dan yuklanadi; hozir seed'dagi banner ishlaydi.
