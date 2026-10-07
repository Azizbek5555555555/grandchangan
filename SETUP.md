# GrandChangan — kompyuterda sozlash (Windows)

Bu qo'llanma Windows + VS Code + PowerShell uchun. Buyruqlarni VS Code terminalida
(**Terminal → New Terminal**) loyiha papkasida bajaring:

```powershell
cd C:\Users\Concept\Desktop\grandchangan
```

---

## 0. Nega `git status` "up to date" deydi?

`git status` faqat **oxirgi marta yuklab olingan** holat bilan solishtiradi — GitHub'ga o'zi
murojaat qilmaydi. Shuning uchun GitHub'da yangi PR merge qilingan bo'lsa ham "up to date"
ko'rinadi. Haqiqiy holatni ko'rish uchun:

```powershell
git fetch origin
git status        # endi "behind 'origin/main' by N commits" deb ko'rsatadi
```

---

## 1. Kerakli dasturlar (bir marta)

| Dastur | Qayerdan | Tekshirish |
|---|---|---|
| **Node.js 22 LTS** | https://nodejs.org (LTS tugmasi) | `node -v` → `v22.x` |
| **Git for Windows** | https://git-scm.com/download/win | `git --version` |
| **VS Code** | o'rnatilgan | — |

> PowerShell'da `npm` "running scripts is disabled" xatosini bersa, bir marta:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` (so'raganda `Y`).

---

## 2. Kodni yangilash

```powershell
git checkout main
git pull origin main
```

Agar "Your local changes would be overwritten" desa — sizda saqlanmagan o'zgarish bor.
`git status` bilan ko'ring; kerak bo'lmasa `git stash`, keyin qayta `git pull`.

---

## 3. Paketlarni o'rnatish

```powershell
npm install
npx prisma generate
```

`prisma generate` faqat kod uchun tiplarni yaratadi, bazaga tegmaydi.
Bu safargi o'zgarishlarda **schema o'zgarmagan** — `prisma db push` kerak emas.

> `EPERM ... query_engine` xatosi chiqsa: ishlab turgan `npm run dev` ni to'xtating
> (terminalda `Ctrl+C`) va qayta urining.

---

## 4. `.env` fayli

Agar `.env` hali yo'q bo'lsa:

```powershell
Copy-Item .env.example .env
```

`.env` ni VS Code'da oching va to'ldiring. Mavjud `.env` bo'lsa — faqat **yangi qatorlarni**
qo'shing (pastdagi Supabase bo'limi).

| O'zgaruvchi | Qiymat |
|---|---|
| `DATABASE_URL` | Railway → Postgres → **Connect** → *Public network* URL (`...proxy.rlwy.net:PORT/railway`) |
| `AUTH_SECRET` | uzun tasodifiy satr (pastdagi buyruq bilan yarating) |
| `SUPABASE_URL` | 5-qadamdan |
| `SUPABASE_SECRET_KEY` | 5-qadamdan |
| `SUPABASE_BUCKET` | `images` |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | ixtiyoriy (bo'lmasa xabarlar terminalga yoziladi) |
| `ESKIZ_EMAIL`, `ESKIZ_PASSWORD` | ixtiyoriy (bo'lmasa SMS terminalga yoziladi) |

`AUTH_SECRET` yaratish:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

> ⚠️ `.env` — maxfiy fayl. Git'ga tushmaydi (`.gitignore`da), uni hech kimga yubormang,
> chatga ham yozmang.

---

## 5. Supabase (rasm saqlash) — bir marta

1. https://supabase.com → **Start your project** → GitHub yoki email bilan kiring.
2. **New project**: nom `grandchangan`, parolni saqlab qo'ying, **Region: Central EU (Frankfurt)**
   (O'zbekistonga eng yaqin), tarif **Free**.
3. Loyiha ochilgach: **Project Settings → API Keys**:
   - **Project URL** → `.env` dagi `SUPABASE_URL` — faqat `https://xxxx.supabase.co`
     (oxiriga `/rest/v1/` qo'shilgan bo'lsa ham kod o'zi tozalaydi)
   - **Secret key** (`sb_secret_...`) → `SUPABASE_SECRET_KEY`
     (eski loyihalarda "service_role" kaliti — u ham ishlaydi)
4. Bucket yaratish **shart emas** — birinchi rasm yuklanganda `images` bucket o'zi yaratiladi.

### Eski rasmlarni ko'chirish (bir marta)

Avval admin orqali yuklangan rasmlar faqat **shu kompyuterdagi** `public\uploads` papkasida.
Ularni Supabase'ga ko'chirish va bazadagi havolalarni yangilash:

```powershell
npm run uploads:migrate              # sinov: nima ko'chishini ko'rsatadi, hech narsa o'zgarmaydi
npm run uploads:migrate -- --apply   # haqiqatan ko'chiradi
```

"Kompyuterda topilmadi" ro'yxatidagi rasmlarni admin paneldan qayta yuklang.

---

## 6. Ishga tushirish va tekshirish

```powershell
npm run dev
```

Brauzerda: http://localhost:3000 — sayt, http://localhost:3000/admin/login — admin.

Tekshirish ro'yxati:

- [ ] Admin'ga kiring → chap pastda **Parolni o'zgartirish** → standart `admin12345` ni almashtiring
- [ ] **Xodimlar** → ofitsiant va oshpaz qo'shing → boshqa brauzerda (yoki inkognito) ular bilan kiring:
      oshpaz faqat *Buyurtmalar*ni, ofitsiant *Bronlar* va *Buyurtmalar*ni ko'radi
- [ ] **Galereya** yoki **Menyu** → rasm yuklang → rasm havolasi `supabase.co` bilan boshlanadi
- [ ] **Sozlamalar → Ish vaqti** → bir kunni "Yopiq" qiling → saytdagi bron kalendarida o'sha kun o'chiq,
      footer'da kunma-kun jadval
- [ ] Saytda bron qiling → admin **Bronlar**da vaqt to'g'ri (Toshkent vaqti) ko'rinadi
- [ ] Bosh sahifada pastga suring → "Stolingizni band qiling" bo'limi varaqdek buklanib, ostidan sharhlar ochiladi
- [ ] **Menyu** sahifasi tepasida TOP taomlar slayderi (admin'da taomga "TOP" belgisi qo'ying)

> ⚠️ `npm run db:seed` ni **production bazada qayta ishlatmang**: u admin parolini `.env` dagi
> qiymatga qaytaradi, Sozlamalar'dagi kontakt ma'lumotlarini va menyu kategoriyalarining
> nomi/tartibini standartga yozib yuboradi.

---

## 7. Railway (deploy) sozlamalari

Railway → servis → **Variables** ga qo'shing (lokal `.env` dan farqi — `DATABASE_URL` **ichki** manzil):

| O'zgaruvchi | Qiymat |
|---|---|
| `DATABASE_URL` | Postgres → *Private network* URL (`postgres.railway.internal`) |
| `AUTH_SECRET` | lokal bilan bir xil bo'lishi shart emas |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_BUCKET` | 5-qadamdagi qiymatlar |
| `TELEGRAM_*`, `ESKIZ_*`, to'lov kalitlari | bor bo'lsa |

Build/Start buyruqlari o'zgarmaydi (`npm run build` → `npm run start`). Supabase o'zgaruvchilari
bo'lmasa, admin'da rasm yuklash "Rasm saqlash sozlanmagan" xatosini beradi — bu ataylab
(aks holda rasm yuklanib, darhol yo'qolardi).

---

## 8. Claude Code'ni kompyuterda ishlatish (ixtiyoriy)

O'rnatish (rasmiy qo'llanma: https://docs.claude.com/en/docs/claude-code — usul yangilangan bo'lishi mumkin):

```powershell
irm https://claude.ai/install.ps1 | iex     # rasmiy o'rnatuvchi (PowerShell)
# yoki: npm install -g @anthropic-ai/claude-code
claude --version
```

Ishlatish:

```powershell
cd C:\Users\Concept\Desktop\grandchangan
git checkout -B claude/work origin/main   # har yangi ish oldidan: main'dan toza branch
claude
```

Claude Code repo ildizidagi `CLAUDE.md` qoidalarini o'zi o'qiydi. Ish tugagach u
`claude/work` ga push qiladi → GitHub'da PR ochasiz → merge → keyin lokalda:

```powershell
git checkout main
git pull origin main
```

---

## Tez-tez uchraydigan muammolar

| Xato | Yechim |
|---|---|
| `Can't reach database server` | `DATABASE_URL` da *Public network* (proxy.rlwy.net) URL ishlating, internal emas |
| `Port 3000 is in use` | boshqa `npm run dev` ochiq — uni yoping yoki `npm run dev -- -p 3001` |
| Admin'ga kirib bo'lmaydi: "Juda ko'p urinish" | 5 marta noto'g'ri parol — 15 daqiqa kuting (himoya) |
| Admin'ga kirib bo'lmaydi: "Login yoki parol noto'g'ri" | `npm run admin:password` — bazadagi xodim emaillari; `npm run admin:password -- <email> <YangiParol>` — parolni tiklaydi (boshqa ma'lumotlarga tegmaydi) |
| `Next.js inferred your workspace root ... multiple lockfiles` | `C:\Users\Concept\Desktop` papkasida (loyihadan **tashqarida**) tasodifan qolgan `package-lock.json` (va `package.json`, `node_modules`) bor — ularni o'chiring |
| `PGRST125 Invalid path specified in request URL` | `SUPABASE_URL` noto'g'ri — `https://xxxx.supabase.co` bo'lishi kerak (yangi kodda avtomatik tuzatiladi) |
| `package-lock.json` VS Code'da **M** (o'zgargan) | `npm install` dan keyin bo'ladi — commit qilmang: `git restore package-lock.json` |
| Rasm yuklanmaydi | `.env` da `SUPABASE_URL` / `SUPABASE_SECRET_KEY` to'g'riligini tekshiring, `npm run dev` ni qayta ishga tushiring |
