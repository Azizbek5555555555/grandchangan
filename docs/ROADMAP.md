# GrandChangan — ish rejasi (ROADMAP)

Bu fayl sessiya/limit uzilib qolsa ham ish qayerda turganini bilish uchun.
Yangi sessiyada Claude avval shu faylni o'qisin.

## 1-bosqich: Admin inventar xaritasi (2D)
Holat: **tayyor** (branch `claude/pensive-gauss-fqg6hx`, PR kutilmoqda) — review o'tdi, `npm run build` o'tdi.
Aziz javobi kerak: Xona 1 va Xona 2 da nechta stol/o'rin bor? (hozir xaritada stol belgilanmagan)

- Admin → Inventar ochilganda birinchi bo'lim **"Xarita"**: restoranning 2D rejasi
  (Aziz yuborgan "RESTORAN REJASI" rasmi asosida, kodda SVG sifatida chizilgan).
- Xaritani surish (drag), kattalashtirish (g'ildirak / pinch / +− tugmalar), "moslash" tugmasi.
- Xona/bo'limga bosilganda: sichqoncha yonida qisqa oyna + yon panelda (telefonda pastdan)
  shu xonadagi stollar, o'rinlar va buyumlar soni (inventar normasi × xaritadagi o'rinlar).
- Tuzatish: rasmda qizil bilan belgilangan joydagi hojatxonalar **yashil joyga** ko'chirildi,
  qizil joy — **yo'lak (koridor)**.
- Xarita 100% aniq emas — keyin inventar sonlari bilan birga to'g'rilanadi.
- Fayllar: `src/lib/floorplan/layout.ts` (xarita ma'lumoti), `src/components/floorplan/FloorMap.tsx`
  (umumiy pan/zoom komponent — mijoz sayti uchun ham qayta ishlatiladi),
  `src/components/admin/inventory/MapTab.tsx` (admin paneli).

## Hozirgi — 2-bosqich: Mijozlar uchun 2D xarita (saytda) + xarita orqali bron
Holat: **tayyor** (branch `claude/pensive-gauss-fqg6hx`) — review + E2E test o'tdi, `npm run build` o'tdi.
- Xaritadagi har bir stolning kodi bor: VIP-1..5, Z-1..9 (katta zal), K-1..6 (kabinalar), A-1 (alohida stol)
  = bazadagi `Table.number`. Bog'lanish shu orqali (schema o'zgarmaydi).
- Admin → Zallar va stollar: "Xaritadan stollarni yaratish" tugmasi (ADMIN/SUPERADMIN) —
  zallar/stollarni xaritadan yaratadi, xaritada yo'q eski stollarni o'chirmasdan nofaol qiladi.
  **Production'da merge'dan keyin Aziz bir marta bosishi kerak.**
- Bosh sahifa: "Restoran xaritasi" bo'limi (bron bo'limidan oldin): sana, vaqt, kishi soni →
  xaritada bo'sh/band stollar → stolni tanlash → /reservation?date&time&guests&table → ma'lumot formasi.
- Bron sahifasi: 4-qadam (stol tanlash) ham shu xarita bilan.
- Xona 1/2 da stol yo'q — "qo'ng'iroq qiling".

## Keyin — 3-bosqich: Sayt dizaynini yaxshilash (frontend)
E2E testda topilgan (bu ishdan oldin ham bo'lgan) kamchiliklar — dizayn bosqichida tuzatiladi:
- Bosh sahifa "Mashhur taomlar" bo'limi foni shaffof — orqadagi sticky hero ko'rinadi, sarlavha o'qilmaydi
- Telefonda (390px) header logosi "Joy band qilish" tugmasini bosadi
- PageHero sarlavhalarida pastki harf qismlari kesiladi ("Joy band qilish")
- Telefonda xaritadagi kabina/stol bosish joylari kichik (kattalashtirish bilan ishlaydi)
- seed.ts hali eski "Asosiy zal" 1–4 stollarini yaratadi (faqat lokal/yangi baza uchun)

## Qoidalar (Aziz)
- Og'ir vazifada parallel-agents skill: avval variant + sabab bir qatorda; bir faylni ikki agent
  tahrirlamaydi; implementatsiyadan keyin alohida subagent review (bug, type, xavfsizlik,
  uz/ru tarjima, mobil); oxirida `npm run build` o'tishi shart.
- Effort darajasi: Extra.
