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

## 7. Railway (deploy)

Sayt Postgres turgan **o'sha Railway loyihasiga** alohida servis sifatida qo'shiladi.
`main` ga har merge'dan keyin Railway o'zi qayta deploy qiladi.

1. Loyiha → **+ Create** → **GitHub Repo** → `grandchangan` (birinchi marta Railway GitHub'ga
   ruxsat so'raydi — shu repo'ga ruxsat bering). Servis paydo bo'ladi va build boshlanadi —
   o'zgaruvchilar hali yo'q, birinchi deploy xato bersa normal.
2. Yangi servis → **Variables** → **Raw Editor** ga quyidagini qo'yib **Update Variables**:

   ```
   DATABASE_URL="${{Postgres.DATABASE_URL}}"
   AUTH_SECRET="BUNI_ALMASHTIRING_1"
   SUPABASE_URL="https://xxxx.supabase.co"
   SUPABASE_SECRET_KEY="BUNI_ALMASHTIRING_2"
   SUPABASE_BUCKET="images"
   ```

   - 1-qator **so'zma-so'z** qoladi: `${{Postgres.DATABASE_URL}}` — Railway'ning havolasi, u o'zi
     Postgres'ning ichki manziliga aylanadi. `${{ }}` ichiga **boshqa hech narsa yozmang** — ichidagi
     matn servis nomi deb tushuniladi va qiymat **bo'sh** bo'lib qoladi.
   - `BUNI_ALMASHTIRING_1` → 4-qadamdagi buyruq bergan **yangi** satr (lokal `.env` dagisi emas).
   - `BUNI_ALMASHTIRING_2` → `.env` dagi `sb_secret_...` qiymat.
   - Oxirida matnda `BUNI_ALMASHTIRING` va `<`, `>` belgilari qolmaganini tekshiring.
   - `SEED_*`, `CLOUDINARY_*` Railway'ga kerak emas. `TELEGRAM_*`, `ESKIZ_*`, to'lov kalitlari
     bo'lsa — qo'shing.
3. **Settings → Networking → Generate Domain** (port so'rasa — `8080`) → `xxxx.up.railway.app`
   link chiqadi.
4. **Deployments** → oxirgi deploy **Active** bo'lishini kuting (2–4 daqiqa), so'ng linkni oching.

Tekshirish: bosh sahifa, `/menu`, `/admin/login` → kirish, admin'da rasm yuklash.

| Deploy xatosi | Yechim |
|---|---|
| `AUTH_SECRET .env da aniqlanmagan` | Variables'da `AUTH_SECRET` yo'q |
| `Can't reach database server at postgres.railway.internal` | Sayt servisi Postgres bilan **bir loyiha/environment**da emas yoki `DATABASE_URL` noto'g'ri |
| `Application failed to respond` | Generate Domain'dagi port `8080` emasligini tekshiring (Settings → Networking) |
| Rasm yuklashda "Rasm saqlash sozlanmagan" | `SUPABASE_URL` / `SUPABASE_SECRET_KEY` yo'q |
| Saytda "Application error", **Digest: 3033133707**; logda `DATABASE_URL resolved to an empty string` | `DATABASE_URL` havolasi bo'sh — qiymat `${{ }}` ichiga yozilgan yoki servis nomi xato. Aynan `"${{Postgres.DATABASE_URL}}"` bo'lsin |
| Logda `the URL must start with the protocol postgresql://` | `DATABASE_URL` ga boshqa narsa (masalan, `AUTH_SECRET`) yozilgan |
| Admin: "Login yoki parol noto'g'ri" | Kompyuterda `npm run admin:password -- <email> <YangiParol>` — o'sha bazada parol yangilanadi, deploy kerak emas |
| Lokal'da rasm bor, saytda singan | Bazada hali `/uploads/...` manzillar: `npm run uploads:migrate -- --apply`. Supabase "Unhealthy" bo'lsa — biroz kuting |

Build paytida baza kerak emas (barcha bazali sahifalar so'rov vaqtida yaratiladi), Node 22
`package.json` dagi `engines` orqali tanlanadi. Schema o'zgarmagan bo'lsa `prisma db push` kerak emas.

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
