# TEXNIK QARZLAR

Bilib turib qoldirilgan ishlar. Har biri **yozib qo'yiladi** — aks holda
ular unutiladi va bir kun xato bo'lib qaytadi.

CLAUDE.md §5: «TZ ga zid yozib "keyin tuzatamiz" — keyin kelmaydi.»
Shuning uchun bu ro'yxat qisqa bo'lishi va bo'shab borishi kerak.

| # | Qarz | Qachon yopiladi | Xavf |
|---|---|---|---|
| T-01 | Interfeys oqimlari avtomat sinalmagan | 2-bosqich | O'rta |
| T-02 | `docker compose up` tekshiruvi bajarilmagan | Docker o'rnatilganda | Past |
| T-03 | 14 ta qaror hujjatga ko'chirilmagan | Egasi tasdiqlagach | O'rta |

---

## T-01 · Interfeys oqimlari avtomat sinalmagan

**Bosqich:** 1 · **Tegadi:** QISM 1 §14.2

### Holat

`lib/kirish/cookie.ts` va `lib/kirish/joriy.ts` Next.js ga bog'langan —
sof funksiya sifatida chaqirib bo'lmaydi, shuning uchun ular qamrov
o'lchovidan chiqarilgan.

Ular **qo'lda tekshirilgan** (brauzer so'rovlari bilan, 13/13 o'tgan):
kirmagan odam himoyalangan sahifani ko'rmaydi, muddati tugagan va bekor
qilingan token kirish ekraniga yuboradi, sahifa chizilganda cookie
yozilmaydi.

Lekin bu tekshiruv **saqlanmagan** — regressiya ushlanmaydi.

### Nega hozir yopilmadi

QISM 1 §14.2 buni Playwright ga havola qiladi. Playwright brauzerlarni
yuklab olishni talab qiladi (~400 MB), tarmoq esa bu kompyuterda beqaror:
bugun `npm install` bir marta, PostgreSQL fayllari ikki marta uzilgan.

Interfeysi bo'lgan birinchi to'liq modul — 2-bosqich (spravochniklar).
Playwright o'sha yerda o'rnatiladi va bu qarz birdan yopiladi.

### Qanday yopiladi

`test/brauzer/kirish.spec.ts`:
· kirmagan odam `/boshqaruv` ga kirsa `/kirish` ga tushadi
· to'g'ri parol bilan kiradi, panel ochiladi
· 5 xato urinishdan keyin blok xabari chiqadi
· chiqish tugmasi sessiyani o'ldiradi
· usta parol bilan ham kira olmaydi

### Vaqtinchalik himoya

Bu qarz to'liq ochiq emas: kirish **tranzaksiyasi** va baza to'siqlari
`npm run test:baza` da 34 ta test bilan qoplangan. Yopilmagani —
Next.js qatlamining o'zi (cookie, redirect).

---

## T-02 · `docker compose up` tekshiruvi bajarilmagan

**Bosqich:** 0 · **Tegadi:** QISM 1 §2.3

«Loyiha loqal kompyuterda `docker compose up` bilan to'liq ishlashi shart.
Ishlamasa — platformaga bog'langan.»

`docker-compose.yml` va `Dockerfile` yozilgan, lekin **ishga tushirilmagan**:
egasining kompyuterida Docker yo'q (administrator huquqi va WSL2 kerak,
ikkalasi ham UAC oynasini ochadi).

Xavf past: loyiha oddiy `postgres.js` bilan oddiy `postgres://` manzilga
ulanadi, platforma SDK lari linterda bloklangan (P-12). Ya'ni §2.3 ning
maqsadi bajarilgan, faqat tekshiruvning o'zi qolgan.

Docker paydo bo'lgan kuni: `docker compose --profile toliq up` va natija
shu yerga yoziladi.

---

## T-03 · Qarorlar hujjatga ko'chirilmagan

**Bosqich:** 0–1 · **Tegadi:** QISM 1 §2.4

`docs/QARORLAR-KOD.md` da 14 ta qaror `⏳ tasdiq kutilmoqda` holatida.

QISM 1 §2.4: «Kod TZ dan chetga chiqsa — TZ yangilanadi, kod emas.»
Ya'ni egasi tasdiqlagach ular `LOYIHA.md` ga ko'chirilishi va u yerdagi
eski matn tuzatilishi kerak.

Ko'chirilmasa hujjat va kod bir-biridan uzoqlashib boradi — bu loyihaning
boshidagi muammoning aynan o'zi (TZ auditdan o'tgan, lekin matni
tuzatilmagan).

Eng muhim uchtasi:

| # | Hujjatda nima tuzatiladi |
|---|---|
| P-01 | QISM 1 §3.1 dagi `Som`/`Dollar` namunasi — u invariantni himoya qilmaydi |
| P-02 | QISM 1 §20 dagi «bitta ombor, bitta filial» qatori — Q-21 ga zid |
| P-05 | QISM 3 §1.2 dagi `rol_id` — TZ 10.3 bilan zid, `xodim_rol` bo'lishi kerak |
