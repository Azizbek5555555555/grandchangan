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

## Hozirgi/keyingi — 2-bosqich: Mijozlar uchun 2D xarita (saytda)
Holat: Aziz buyrug'ini kutmoqda
- Saytda mijoz restoran xaritasini ko'radi, xona/stolni tanlab bron qiladi.
- Buning uchun xaritadagi stollarni bazadagi Zone/Table bilan birlashtirish kerak
  (hozir "Zallar va stollar"dagi stollar xaritadan alohida).

## Keyin — 3-bosqich: Sayt dizaynini yaxshilash (frontend)

## Qoidalar (Aziz)
- Og'ir vazifada parallel-agents skill: avval variant + sabab bir qatorda; bir faylni ikki agent
  tahrirlamaydi; implementatsiyadan keyin alohida subagent review (bug, type, xavfsizlik,
  uz/ru tarjima, mobil); oxirida `npm run build` o'tishi shart.
- Effort darajasi: Extra.
