# GrandChangan — Claude Code uchun qoidalar

## Loyiha
Samarqanddagi xitoy restorani uchun sayt + CRM. Faqat dine-in (yetkazib berish yo'q), pre-order bor.
Next.js 15 (App Router) · TS · Tailwind v4 · Prisma 6 · PostgreSQL (Railway)
· next-intl v4 (uz/ru/en/zh) · GSAP + Lenis · jose JWT.

## Til
Men bilan va kod izohlarida O'ZBEK tilida gaplash.

## Git
- `main`ga HECH QACHON to'g'ridan-to'g'ri push qilma. Ish branchida ishla
  (odatda `claude/work`; sessiya boshqa branch belgilagan bo'lsa — o'sha branch).
- Commit: `<tur>(<soha>): o'zbekcha tavsif` — turlar: feat, fix, refactor, style, chore;
  soha: admin, site, i18n, db, api.
- Bir commit = bir mantiqiy o'zgarish. PR'ni Aziz ochadi va merge qiladi.

## Qoidalar
- Commit'dan oldin tekshir: `npx tsc --noEmit` (kerak bo'lsa avval `npx prisma generate` —
  u faqat tiplarni yaratadi, bazaga tegmaydi). Iloji bo'lsa `npm run build` ham.
- Schema'ni o'zgartirish yoki `prisma db push` — faqat Aziz roziligi bilan.
  Schema o'zgarsa, commit xabarida aniq yoz.
- Yorug' rejim dizaynini o'zgartirma.
- Rang faqat semantik tokenlar orqali: bg-surface, bg-card, text-content,
  text-muted, border-line. Hardcode rang yozma.
- Matn qo'shsang — messages/{uz,ru,en,zh}.json ning TO'RTTASINI ham bir xil kalit bilan yangila.
- Mid-task tasdiq so'rama — ketma-ket, autonom bajar.

## Tuzilma
src/app/[locale]/        sahifalar (public + admin/(dash))
src/components/{site,admin,motion,ui}/
src/lib/<domen>/actions.ts   Server Actions (CRUD shu yerda)
src/i18n/                routing.ts (uz default, localePrefix: as-needed)
messages/                4 ta til fayli

## Qaytarilgan — qayta kiritma
3D sichqonchali hero (HeroCinematic), diagonal "peel" varaq o'tishi.
