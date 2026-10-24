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

## Hozirgi — 3-bosqich: Saytni BUTUNLAY qayta dizayn qilish (frontend)
Holat: **asosiy qism tayyor (commit 2bae0f7), mustaqil review kutilmoqda** — namunalar: qizil lag'mon hero /
qorong'i ATXONDO / krem sakuri + 2-to'plam (湯包家 qorong'i, 冶春 tush rasmi va 4 panel, exploded salat/banan, matcha menyu).
- Joylashuv: bosh sahifa — exploded 3D kosa (ExplodeSection) + 4 panelli lenta (PanelShowcase); menyu — qorong'i
  "Oshpaz tanlovi" (ChefSignature) + "Choy marosimi" (TeaRitual); biz haqimizda — tush rasmi (InkDecor);
  tadbirlar — qorong'i vertikal yorliqlar; galereya — lightbox.
- Agentlar limitga urilib to'xtadi (Aziz to'xtatdi) — qolganini lead bitta sessiyada tugatdi.
- Aziz: 3 xil variant KERAK EMAS (webz-design-variants skilini ishlatma!). To'g'ridan-to'g'ri saytning o'zini
  namunalar asosida yasash, animatsiyalar + Xitoy taomlarining 3D modellari (three.js) bilan. "Bomba" bo'lsin.
- Dizayn qoidalari: **docs/DESIGN.md** ("Olovli Chang'an": fire/wine/saffron/night/paper/sand tokenlari,
  Dela Gothic One + Playfair + Inter + Ma Shan Zheng, kit: src/components/site/kit/*).
- Poydevor commit'lari: 5a2261a (tokenlar, shriftlar, kit, three.js), eaefdde (PageHero cn/tone).
- Agent team (har birining fayllari alohida):
  - three — src/components/three/** (HeroBowl, DimSumSteamer, Lanterns — protsedural 3D)
  - home — bosh sahifa + src/components/site/home/** + HomeFloorSection
  - chrome — Header/HeaderClient/Footer/PageHero/LocaleSwitcher/ThemeToggle/CustomCursor/not-found
  - pages — menu, reservation(+ReservationFlow, FloorAvailabilityMap), about, gallery, blog, events, contact, account
  - lead — globals.css, kit, layout, messages/*.json (agentlarning i18n kalitlari scratchpad/i18n/*.json da,
    lead birlashtiradi), package.json, oxirida build + mustaqil review.
- Magnific: hisob bepul (0 kredit), konteyner tarmog'i magnific.com'ni bloklaydi → stock rasm ishlatilmadi;
  taom rasmlari bazadan (admin yuklaydi), yo'q bo'lsa DishFallback. Aziz tarmoqqa *.magnific.com qo'shsa — rasm olish mumkin.
- Lokal test: Postgres :55432 (lokal bazaga 14 ta test taom qo'shilgan), dev server :3100.
- Eski kamchiliklar (shu bosqichda tuzatiladi): "Mashhur taomlar" foni shaffof; telefonda logo
  "Joy band qilish" tugmasini bosadi; PageHero sarlavhalarida harflar kesiladi (TextReveal tuzatildi);
  mobil xaritada kichik bosish joylari; seed.ts eski stollar.

## Kutilmoqda — domen
- www.grandchangan.uz ishlayapti (Railway, SSL). grandchangan.uz (www siz) uchun Eskiz'ga tiket
  yuborilgan: 301 yo'naltirish yoki ALIAS so'ralgan. Bo'lmasa — Cloudflare (NS o'zgartirish).
  Railway'da ikkala domen qo'shilgan; TXT tasdiq yozuvlari Eskiz DNS'da bor.

## Qoidalar (Aziz)
- Og'ir vazifada parallel-agents skill: avval variant + sabab bir qatorda; bir faylni ikki agent
  tahrirlamaydi; implementatsiyadan keyin alohida subagent review (bug, type, xavfsizlik,
  uz/ru tarjima, mobil); oxirida `npm run build` o'tishi shart.
- Effort darajasi: Extra.
