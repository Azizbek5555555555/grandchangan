# GrandChangan — "Olovli Chang'an" dizayn qoidalari (3-bosqich)

Mijoz eski dizaynni rad etdi. Yangi dizayn Aziz yuborgan 3 namunaga asoslanadi:

1. **Qizil lag'mon namunasi (hero)** — yorqin qizil fon, katta kosa + palochka, havoda uchayotgan
   masalliqlar, katta jasur sarlavha, sariq-zafar tugma; ostida krem bo'limlar, to'lqinli chegaralar,
   xitoycha chiziqli naqsh, to'q-qizil (vino) to'lqinli bo'lim.
2. **Qorong'i "ATXONDO" namunasi** — deyarli qora fon, katta qizil organik "blob" shakllar va blob tugmalar,
   nafis ingichka serif oq sarlavha, "Biz haqimizda" foto-kollaj, chapda kategoriyalar ro'yxati + qizil
   narxli taom kartalari, "Stol band qiling" bloki (interyer rasmi + matn + qizil tugma), galereya.
3. **Krem "sakuri" namunasi** — krem fon, ingichka nafis serif sarlavha ustida ieroglif, katta dumaloq
   taom rasmlari barglar bilan chap/o'ng almashib turadi, nomi + xitoycha nomi, narx, qizil tugma.

Bularga **Xitoy taomlarining 3D modellari** (three.js) va boy animatsiyalar qo'shiladi.

## Ranglar (faqat tokenlar — hex yozish TAQIQLANADI)

`src/app/globals.css` `@theme` da:

| Token klass | Qiymat | Qayerda |
|---|---|---|
| `bg-fire` / `text-fire` | #c8161d | hero foni, asosiy tugma, krem fondagi aksent |
| `fire-deep` | #9e0f14 | qizil ustidagi to'qroq shakllar, hover |
| `wine` / `wine-deep` | #5e0a0d / #430709 | to'q-qizil to'lqinli bo'limlar |
| `saffron` / `saffron-deep` | #f4a62a / #d98a12 | qizil/qorong'i fondagi CTA va aksent |
| `night` / `night-2` / `night-3` | #0e0a09 / #17110f / #241b18 | "tungi saroy" bloklari (namuna 2), footer |
| `paper` / `sand` | tema bo'yicha (yorug': #fbf1e1 / #f3e2c7) | krem bo'limlar — qorong'i temada o'zi qorayadi |
| `brand-cream` | #f7f1e6 | qizil/vino/tungi fon ustidagi matn |
| `brand-ink` | #14100e | saffron tugma matni |
| `brand-gold` / `brand-gold-light` | #c8a24b / #e3c67e | tungi bloklardagi ingichka chiziq, kursiv aksent |
| `jade`, `leaf` | #2f7a3a, #6fa83a | "bo'sh" holati, barg bezaklari |
| `text-content`, `text-muted`, `border-line`, `bg-card`, `bg-surface` | semantik | paper/sand bo'limlardagi matn/chegara |

Qoidalar:
- Doim bir xil rangli bo'limlar (hero `bg-fire`, `bg-wine`, `bg-night`) — matni `text-brand-cream` (+ `/70`…`/85`).
- Krem bo'limlar — `bg-paper` yoki `bg-sand`, matn `text-content`/`text-muted`. Shunda qorong'i tema ishlaydi.
- Shaffof foni bor karta/bo'lim qilmang (eski "Mashhur taomlar" xatosi) — har bir bo'limning aniq foni bo'lsin.
- Kontrast ≥ 4.5:1. `text-fire` faqat krem fonda; qorong'i fonda narx/aksent uchun `text-saffron`.

## Shriftlar (layout.tsx da ulangan)

- `font-poster` — **Dela Gothic One**: hero va asosiy bo'lim sarlavhalari (jasur, afisha). Faqat 400 vazn.
- `font-display` — **Playfair Display**: nafis serif sarlavhalar, `italic` aksent so'zlar (namuna 2/3).
- `font-sans` — **Inter**: matn, tugmalar.
- `font-cn` — **Ma Shan Zheng** (mo'yqalam): xitoycha bezak yozuvlari: 长安, 招牌菜, 菜单, 点心, 订座… Har doim `lang="zh"`.
  Xitoycha matn faqat bezak — asosiy ma'no o'zbekcha matnda bo'lsin.

## Umumiy komponentlar (`src/components/site/kit/`, egasi — lead)

- `Wave` — to'lqinli chegara. `<Wave className="text-paper" />` — bo'lim pastida keyingi bo'lim rangida. Ota `relative`.
- `Blob` — organik shakl (`variant` a|b|c), rang `text-*`.
- `ButtonLink` / `btnClass(variant, size, blob)` — tugmalar: `saffron | fire | night | ghost-light | ghost-dark | gold-outline`; `blob` — organik shakl.
- `SectionHead` — bo'lim sarlavhasi: `cn` (xitoycha), `eyebrow`, `title`, `accent`, `sub`, `tone` light|dark, `font` poster|serif.
- `DishFallback` — taom rasmi yo'q bo'lganda chiroyli zaxira (hech qachon "Rasm yo'q"/bo'sh kulrang quti emas).
- `FretBand` — xitoycha "huiwen" naqsh lentasi (`text-fire/40` kabi).
- CSS yordamchilar (globals.css): `.font-poster`, `.font-cn`, `.rounded-blob`, `.rounded-blob-2`, `.fret-band`,
  `.lattice-bg` (fon naqshi, rang `text-*`), `.animate-bob`, `.animate-spin-slow`, `.animate-steam`.

Kit'ga yangi narsa kerak bo'lsa — lead'ga yozing, o'zingiz tahrirlamang. O'z papkangizda shaxsiy komponent yaratish mumkin.

## Animatsiya

- Mavjud: `src/components/motion/*` — `Reveal`, `RevealGroup`, `TextReveal`, `Parallax`, `ZoomImage`, `Counter`,
  `HorizontalScroll`, `RotateOnScroll`, `Reveal3D`. GSAP + ScrollTrigger + Lenis (SmoothScroll) ulangan.
- Har bir bo'lim kirishda jonlansin (reveal, stagger, parallax), lekin kontent JS'siz ham ko'rinsin.
- `prefers-reduced-motion` — animatsiyalar o'chadi/soddalashadi.
- **Qaytarilgan — qayta kiritma:** sichqonchaga ergashuvchi 3D hero (HeroCinematic) va diagonal "peel" varaq o'tishi.
  3D modellar vaqt + scroll bilan harakatlanadi, sichqonchaga qarab egilish asosiy mexanika bo'lmasin.

## 3D (`src/components/three/`, egasi — "three" agenti)

API (o'zgarmaydi, boshqalar shunday import qiladi):
- `HeroBowl` `{ className?: string }` — lag'mon kosasi, palochkalar lag'monni ko'tarib turadi, atrofida uchib yurgan
  masalliqlar (qalampir, yulduz-anis, ko'k piyoz halqalari, kunjut, bok-choy bargi). Shaffof fon (qizil hero ustida).
- `DimSumSteamer` `{ className?: string }` — bambuk bug'latgich, ko'rinishga kirganda qopqog'i ko'tariladi, ichida
  chuchvaralar, bug' chiqadi.
- `Lanterns` `{ className?: string }` — suzib yurgan qizil xitoy fonarlari (oltin uchlari, popuklari bilan).
Talablar: SSR yo'q (dynamic import), ko'rinmaganda render to'xtaydi, telefonda yengil (dpr ≤ 1.75), WebGL bo'lmasa
yoki reduced-motion bo'lsa — statik zaxira. Tashqi CDN'dan model/HDR yuklanmaydi (hammasi kodda, protsedural).

## Joylashuv va mobil

- Konteyner: `mx-auto max-w-7xl px-5 sm:px-8`. Bo'lim vertikal oralig'i: `py-20 sm:py-28 lg:py-36`.
- 360px kenglikda gorizontal scroll bo'lmasin. Bosish joylari ≥ 44px.
- Telefonda header logosi "Stol band qilish" tugmasini bosib qo'ymasin (eski xato).
- Sarlavhalar kesilmasin (eski PageHero xatosi): `leading-[1.05]` dan kichik qilmang, `overflow-hidden` ga ehtiyot.

## Matnlar (i18n)

- Barcha yangi matnlar 4 tilda: uz, ru, en, zh. `messages/*.json` ning egasi — lead.
- Agentlar yangi kalitlarni `useTranslations`/`getTranslations` bilan ishlatadi va ularni
  `<scratchpad>/i18n/<agent>.json` ga yozadi:
  `{ "uz": { "Namespace": { "key": "..." } }, "ru": {…}, "en": {…}, "zh": {…} }` — lead birlashtiradi.
- Mavjud kalitlarni o'zgartirmang/o'chirmang (admin ham ishlatadi). Yangi namespace: `Home2`, `Chrome`, `Pages2`.
- Ma'lumot to'qima: manzil/telefon/ish vaqti — bazadan (siteSetting, workingHour). Raqamlar: 21 stol, 128 o'rin,
  5 VIP xona (6–8 kishilik), asosiy zal 9 stol (62 o'rin), 6 kabinka (4 kishilik), alohida xona (6 kishilik) —
  `floorTotals()`/`ROOMS` dan hisoblang. "GrandChangan" nomi qadimiy Chang'an (Ipak yo'lining boshi) dan.
