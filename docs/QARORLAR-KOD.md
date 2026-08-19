# QARORLAR — KOD

Kod yozilayotganda `docs/LOYIHA.md` dan chetga chiqilgan yoki hujjatda
aniqlanmagan joy uchun qabul qilingan texnik qarorlar.

QISM 1 §2.4: «Kod TZ dan chetga chiqsa — TZ yangilanadi, kod emas.»
Shu sabab bu yerdagi har qaror **egasi tasdig'idan keyin** `LOYIHA.md` ga
ko'chiriladi. Tasdiqlanmagani `⏳` bilan belgilanadi.

| # | Nima | Holat |
|---|---|---|
| P-01 | `Som` / `Dollar` yopiq tur qilindi | ⏳ tasdiq kutilmoqda |
| P-02 | `filial_id` boshidanoq qo'yiladi | ⏳ tasdiq kutilmoqda |
| P-03 | Kanonik testlar bosqichma-bosqich yoziladi | ⏳ tasdiq kutilmoqda |
| P-04 | Node 22 majburiy emas, tavsiya | ⏳ tasdiq kutilmoqda |
| P-05 | `xodim_rol` jadvali — xodimda bir nechta rol | ⏳ tasdiq kutilmoqda |
| P-06 | Audit jurnali baza darajasida o'zgarmas | ⏳ tasdiq kutilmoqda |
| P-07 | `yaratdi_id` tashqi kalitlari `DEFERRABLE` | ⏳ tasdiq kutilmoqda |
| P-08 | `rol.kod` — tizimli rollarning barqaror belgisi | ⏳ tasdiq kutilmoqda |
| P-09 | Auth.js ishlatilmaydi — kirish qo'lda yoziladi | ⏳ tasdiq kutilmoqda |
| P-10 | Parol eng kami 8 belgi | ⏳ tasdiq kutilmoqda |
| P-11 | Sessiya muddati soatiga bir marta suriladi | ⏳ tasdiq kutilmoqda |
| P-12 | Vaqtincha boshqariladigan Postgres (Neon), faqat `postgres://` orqali | ⏳ tasdiq kutilmoqda |
| P-13 | `BIGINT` ulanish darajasida songa o'giriladi | ⏳ tasdiq kutilmoqda |
| P-14 | Cookie faqat server amalida yoziladi | ⏳ tasdiq kutilmoqda |
| P-15 | Yetkazib beruvchiga TZ 9.3 maydonlari qo'shildi | ⏳ tasdiq kutilmoqda |
| P-16 | Transport aniq nisbat bo'yicha taqsimlanadi | ⏳ tasdiq kutilmoqda |
| P-17 | Brak tannarx bo'luvchisiga kirmaydi | ⏳ tasdiq kutilmoqda |
| P-18 | `band` tashqi kalitlari 4-bosqichda | ⏳ tasdiq kutilmoqda |
| P-19 | Band qilishda faqat bitta bo'lak qulflanadi | ⏳ tasdiq kutilmoqda |

---

## P-12 · Vaqtincha boshqariladigan Postgres

**Bosqich:** 1 · **Tegadi:** QISM 1 §2.3

### Vaziyat

Egasining kompyuterida Docker yo'q: administrator huquqi ham, WSL2 ham
yo'q, ikkalasi ham UAC oynasini ochadi. Ko'chma Postgres fayllarini
yuklab olish tarmoq uzilishi tufayli ikki marta yiqildi.

Bazasiz 4 migratsiya va butun kirish oqimi **sinalmagan** qolib turardi.

### §2.3 buzilyaptimi

Yo'q. Taqiq ro'yxati aynan shunday yozilgan:

| Taqiqlanadi | O'rniga |
|---|---|
| Neon serverless **driver**, branching | oddiy `postgres` (postgres.js) kutubxonasi |

Taqiq **drayverga**, bazaning qayerda turishiga emas. Loyiha `postgres.js`
orqali oddiy `postgres://` manzilga ulanadi — ya'ni «o'rniga» ustunidagi
yechim ishlatilyapti.

### Qaror

Ishlab chiqish davrida baza boshqariladigan Postgres'da turadi.

Qat'iy shart — faqat ulanish manzili ishlatiladi:
`@neondatabase/*` va `@vercel/*` importlari **linterda bloklangan**
(`eslint.config.mjs`), shuning uchun bu qoidani unutib qo'yish mumkin emas.

`docker-compose.yml` joyida qoladi va §2.3 tekshiruvi Docker paydo
bo'lganda bajariladi. Haqiqiy ma'lumot 10-bosqichda egasining serveriga
ko'chadi — `DATABASE_URL` ning bitta qatori.

### Kuzatilgan farq

Boshqariladigan xizmat PostgreSQL **18.4** berdi, `docker-compose.yml` da
**16** turibdi. Hujjat «16+» deydi, ya'ni ikkalasi ham mos. Migratsiyalar
oddiy DDL — 16 va 18 da bir xil ishlaydi.

---

## P-01 · `Som` va `Dollar` yopiq tur

**Bosqich:** 0 · **Tegadi:** QISM 1 §3.1 · 1.3-invariant

### Hujjatda nima yozilgan

```ts
export type Som    = Decimal & { readonly [brand]: 'SOM' };
export type Dollar = Decimal & { readonly [brand]: 'USD' };

a.plus(b);   // ❌ TypeScript xato beradi — 1.3-invariant kafolatlandi
```

### Muammo

Bu namuna **xato bermaydi**. Sabab:

- `plus()` ning imzosi — `plus(n: Decimal.Value): Decimal`
- `Decimal.Value = string | number | Decimal`
- `Dollar` — bu `Decimal` **va** brend. Ya'ni u `Decimal` ham hisoblanadi

Demak `Dollar` ni `plus()` ga berish mumkin va kompilyator jim qoladi.
Brend faqat funksiya parametrlarida ushlaydi, `Decimal` dan meros olgan
metodlarda emas.

Bu §1.1 ning butun asosini yo'qqa chiqaradi: «1.3-invariant TypeScript da
kompilyator darajasida ushlanadi» degan jumla amalda bajarilmagan bo'lardi.

### Qaror

`Som` va `Dollar` — **yopiq turlar**. Ular `Decimal` dan meros olmaydi,
ichki qiymat eksport qilinmagan simvol ostida turadi:

```ts
const QIYMAT: unique symbol = Symbol('pul.qiymat');
export interface Som { readonly [BREND]: 'SOM'; readonly [QIYMAT]: Decimal }
```

Har amal — `lib/domain/pul.ts` dagi funksiya orqali:

```ts
qosh(a, som(30_000))     // ✅
qosh(a, dollar(50))      // ❌ kompilyatsiya xatosi
a.plus(b)                // ❌ bunday metod umuman yo'q
```

`NoInfer<P>` ikkinchi argumentdan tur chiqarishni to'xtatadi — shusiz
TypeScript `Som | Dollar` deb umumlashtirib, xatoni o'tkazib yuborardi.

### Narxi

Kod biroz uzunroq: `a.plus(b)` o'rniga `qosh(a, b)`. Buning evaziga
valyuta aralashishi **umuman mumkin emas** bo'lib qoladi.

### Isboti

`test/turlar.tur-test.ts` — har qatorda `@ts-expect-error`. Agar himoya
bir kun buzilsa, TypeScript «ishlatilmagan `@ts-expect-error`» deb
`npm run typecheck` ni yiqitadi.

### Hujjatga o'zgartirish

QISM 1 §3.1 dagi namuna kod almashtirilishi kerak.

---

## P-02 · `filial_id` boshidanoq qo'yiladi

**Bosqich:** 0 (1-bosqichga tayyorgarlik) · **Tegadi:** QISM 1 §20 · Q-21 · Q-25

### Ziddiyat

| Qayerda | Nima yozilgan |
|---|---|
| QISM 1 §20 | «Tizim **bitta ombor va bitta filial** uchun quriladi. Jadvallarda `ombor_id` **qo'yilmaydi**» |
| Q-21 | «Filial **aniq ochiladi** — tizim ko'p filial uchun quriladi» |
| Q-25 | «Har filialda **o'z ombori**» |
| QISM 1 §21.2 | «**Filial asosi 1-bosqichda** — undan keyin har jadval `filial_id` bilan tug'iladi» |

QISM 1 §20 — 20-bo'lim (ko'p filial) yozilishidan oldingi qoldiq.

### Qaror

**0-qism ustun** (hujjatning o'z tartibi bo'yicha). Q-21 va Q-25 amal qiladi:
har jadval `filial_id` bilan yaratiladi, keyin migratsiya bilan qo'shilmaydi.

Sabab: §21.1 ning o'zi buni tushuntiradi — ko'p filial 24 bandga tegadi,
keyinroq qo'shish har modulni qayta ochishni talab qiladi.

### Hujjatga o'zgartirish

QISM 1 §20 dagi «Bitta ombor» qatori olib tashlanishi kerak.

---

## P-03 · Kanonik testlar bosqichma-bosqich yoziladi

**Bosqich:** 0 · **Tegadi:** QISM 1 §14.1 · CLAUDE.md §6

### Muammo

«Kanonik raqamlar — **birinchi haftada**» (CLAUDE.md §6). Lekin 11 raqamdan
9 tasi hali qurilmagan modullarga tayanadi:

| Raqam | Kerak bo'lgan modul | Bosqich |
|---|---|---|
| Transport taqsimoti, FIFO | `lib/domain/tannarx.ts` | 3 |
| Kesim uch qatori | `lib/domain/kesish.ts` | 3 |
| Kanonik buyurtma 678 400 | `lib/domain/narx.ts` | 4 |
| Kun yopish | `lib/domain/kassa.ts` | 5 |
| Usta balansi | `lib/domain/stavka.ts` + bot | 7 |
| ... | | |

Ularni hozir yozish faqat bitta yo'l bilan mumkin edi: `skip` qilish.
CLAUDE.md §5 buni **taqiqlaydi**.

### Qaror

- **Barcha 11 raqam hozir muzlatiladi** — `test/kanonik.ts`
- Testi moduli qurilgan bosqichda `test/kanonik.test.ts` ga qo'shiladi
- Hech qaysi test `skip` qilinmaydi — yozilgani o'tadi

Shunda raqamlar «kod chiqmayotgani uchun» sekin siljib ketmaydi:
`kanonik.ts` ni o'zgartirish uchun TZ o'zgarishi kerak.

### Hozirgi holat

| Bosqich | Raqam |
|---|---|
| 0 | K-01, K-02 — ✅ o'tadi |
| 2 | K-07 |
| 3 | K-04, K-05, K-06 |
| 4 | K-03 |
| 5 | K-09 |
| 6 | K-11 |
| 7 | K-10 |
| 8 | K-08 |

---

## P-04 · Node 22 — majburiy emas, tavsiya

**Bosqich:** 0 · **Tegadi:** QISM 1 §1

Stekda «Node.js 22 LTS» yozilgan. Egasining kompyuterida Node 24 turibdi
(u ham LTS). `package.json` da `"node": ">=22"`, `.nvmrc` da `22`,
Dockerfile da `node:22-alpine`.

Ya'ni **ishlab chiqarish 22 da**, loqal ishlab chiqish 24 da ham ishlaydi.
Node 22 ni o'rnatish tavsiya qilinadi, lekin ishni to'xtatmaydi.

---

## P-05 · `xodim_rol` — xodimda bir nechta rol

**Bosqich:** 1 · **Tegadi:** QISM 3 §1.2 · TZ 10.3, 13, 14.6, 14.10, EC-XOD-10

### Ziddiyat

Funksional TZ **besh joyda** ko'p rol deydi:

| Band | Nima yozilgan |
|---|---|
| 10.3 | «Xodimga bir vaqtning o'zida bir nechta rol berilishi mumkin. Ruxsatlar yig'indi» |
| 13 (bot) | «Bir nechta rol bo'lsa — panellar orasida almashish tugmasi chiqadi» |
| 14.6 | «Xodimda bir nechta rol bo'lsa (10.3) — ruxsatlar yig'indi bo'ladi» |
| 14.10 | Qarorlar jadvali: «Bir nechta rol → Ruxsatlar yig'indi» |
| EC-XOD-10 | «Bitta odam admin ham, omborchi ham» — **KELISHILDI** |

Ma'lumotlar modeli (QISM 3 §1.2) esa:

```sql
rol_id  BIGINT NOT NULL REFERENCES rol(id)   -- bitta rol
```

Audit bu ziddiyatni ushlamagan.

### Qaror

Funksional TZ ustun (14.10 buni **qaror** sifatida qayd etgan, EC-XOD-10
kelishilgan). `xodim.rol_id` olib tashlanadi, o'rniga `xodim_rol` bog'lovchi
jadvali:

```sql
xodim_rol (xodim_id, rol_id)  PRIMARY KEY (xodim_id, rol_id)
```

Ruxsat tekshiruvi barcha rollarning ruxsatlari **yig'indisi** bo'yicha ishlaydi.

Jadvallar soni: 44 → **45**.

### Nega bu muhim

10.3 ning o'z izohi: «Kichik korxonada adminning o'zi omborchi ham bo'ladi.
Bitta rol majburlansa, u ikkinchi hisob ochishga majbur bo'ladi va audit
jurnalida ikki xil odam ko'rinadi.» Ya'ni bitta rol modeli audit jurnalini
ishonchsiz qiladi.

### Hujjatga o'zgartirish

QISM 3 §1.2 dan `rol_id` olib tashlanadi, §1.2.1 qo'shiladi. §13 jadvallar
ro'yxati va bosh sahifadagi «44 jadval» raqami yangilanadi.

---

## P-06 · Audit jurnali baza darajasida o'zgarmas

**Bosqich:** 1 · **Tegadi:** QISM 1 §6.5, §10, §16 · TZ 2.4

### Muammo

§16: «Pul amallari — har biri audit jurnalida». Bu kafolat jurnal
o'zgartirilishi mumkin bo'lsa hech narsani anglatmaydi.

Hujjat §6.5 da `UPDATE`/`DELETE` taqiqini beshta harakat jadvaliga qo'ygan,
lekin `audit_jurnal` ro'yxatga kirmagan — u shu beshtasini nazorat qiladigan
jadval bo'lsa ham.

### Qaror

`audit_jurnal` ga `BEFORE UPDATE OR DELETE` trigger qo'yiladi
(`0002_audit_himoya.sql`). Bir xil `faqat_qoshiladi()` funksiyasi keyin
§6.5 dagi beshta jadvalga ham ishlatiladi.

Dastur kodidagi tekshiruv yetarli emas: bazaga to'g'ridan-to'g'ri ulangan
odam uni chetlab o'tadi.

---

## P-07 · `yaratdi_id` tashqi kalitlari `DEFERRABLE`

**Bosqich:** 1 · **Tegadi:** QISM 3 §0.1

### Muammo

§0.1: `yaratdi_id BIGINT NOT NULL REFERENCES xodim(id)` — har jadvalda.
Lekin bu halqa hosil qiladi:

```
filial.yaratdi_id  →  xodim.id
xodim.filial_id    →  filial.id      ← halqa
xodim.yaratdi_id   →  xodim.id       ← o'ziga o'zi
```

Birinchi filial va birinchi xodim bir-birisiz mavjud bo'la olmaydi. Oddiy
tashqi kalit bilan urug' (seed) hech qachon yozilmaydi.

### Qaror

`filial`, `xodim`, `rol`, `xodim_rol` jadvallarining `yaratdi_id` /
`ozgartirdi_id` / `filial_id` kalitlari **`DEFERRABLE INITIALLY DEFERRED`**
(`0001_izlar_fk.sql`). Tekshiruv har qatordan keyin emas, tranzaksiya
oxirida bajariladi.

Urug' birinchi filial va birinchi adminni **bitta tranzaksiyada** yozadi.

Qolgan jadvallarda oddiy tashqi kalit — ularda halqa yo'q.

`ON DELETE CASCADE` hech qayerda yo'q (§6.3).

---

## P-08 · `rol.kod` — tizimli rollarning barqaror belgisi

**Bosqich:** 1 · **Tegadi:** QISM 3 §1.3 · Q-04 · TZ 20.12.1

### Muammo

Q-04 va 20.12.1 to'rtta qattiq qoidani **kodda** talab qiladi:

1. Usta roli saytga kira olmaydi
2. Sotuvchi boshqa sotuvchi kassasini ko'rmaydi
3. Admin `sozlama.ozgartir` ni o'zidan olib qo'ya olmaydi
4. Filial xodimi boshqa filial kassasini ko'rmaydi

Birinchi va to'rtinchi qoida uchun kod «usta» va «admin» rolini **tanishi**
kerak. Modelda (§1.3) esa faqat `nom TEXT UNIQUE` bor.

`nom` ni admin sozlamalardan o'zgartira oladi. «Usta» ni «Tikuvchi» deb
nomlasa — qoida jimgina ishlamay qoladi va usta saytga kira boshlaydi.
Hech kim sezmaydi.

### Qaror

`rol` jadvaliga `kod TEXT UNIQUE` ustuni. Faqat tizimli rollarda to'ladi:

```
ADMIN · SOTUVCHI · OMBORCHI · USTA
```

`CHECK` bilan bog'landi: `tizimli = true` bo'lsa `kod` majburiy,
`tizimli = false` bo'lsa `kod` NULL.

Admin `nom` ni xohlaganicha o'zgartiradi, `kod` esa hech qachon o'zgarmaydi.

### Hujjatga o'zgartirish

QISM 3 §1.3 dagi `rol` jadvaliga `kod` qo'shiladi.

---

## P-09 · Auth.js ishlatilmaydi

**Bosqich:** 1 · **Tegadi:** QISM 1 §1 (stek) · §8

### Ziddiyat

Stekda «Auth.js (NextAuth) v5» yozilgan. §8 esa quyidagilarni talab qiladi:

| Talab | Auth.js nima beradi |
|---|---|
| Telefon + parol | Credentials provider — bor, lekin bo'sh qobiq |
| `argon2id` | yo'q, o'zimiz yozamiz |
| «JWT emas — bazadagi sessiya jadvali» | Auth.js ning asosiy yo'li JWT |
| 30 kun, har so'rovda uzayadi | o'zimiz yozamiz |
| 5 urinish → 15 daqiqa blok | yo'q |
| Darhol bekor qilish | o'z jadvalimiz kerak |

Ya'ni §8 ning har bandi baribir qo'lda yoziladi. Auth.js faqat ustiga
qatlam qo'shadi va uni o'z jadvalimizga majburlash uchun adapter yozish
kerak bo'ladi.

### Qaror

Auth.js ishlatilmaydi. Kirish §8 aynan yozilganidek quriladi:

```
lib/kirish/parol.ts    argon2id (@node-rs/argon2)
lib/kirish/sessiya.ts  256 bit token, bazada SHA-256 hash
lib/kirish/blok.ts     5 urinish / 15 daqiqa
```

Yangi kutubxona bittagina: `@node-rs/argon2` — u §8 da nomma-nom talab
qilingan algoritm.

### Hujjatga o'zgartirish

QISM 1 §1 stek jadvalidan «Auth.js (NextAuth) v5» qatori olib tashlanadi.

---

## P-10 · Parol eng kami 8 belgi

**Bosqich:** 1 · **Tegadi:** QISM 1 §8

§8 parolni talab qiladi, lekin **uzunligini belgilamagan**. Chegara qo'yilmasa
bir belgili parol ham qabul qilinadi.

**Qaror:** eng kami 8, eng ko'pi 128 belgi.

Sabab: 8 dan kamini taxmin qilib topsa bo'ladi; ko'pini talab qilsa xodimlar
parolni monitorga yopishtirib qo'yadi va himoya yomonlashadi. Murakkablik
talabi (katta harf, raqam, belgi) **qo'yilmagan** — u parolni kuchaytirmaydi,
faqat unutilishini oshiradi.

`parol_hash` NULL bo'lishi mumkin — usta saytga kirmaydi (Q-04).

---

## P-11 · Sessiya muddati soatiga bir marta suriladi

**Bosqich:** 1 · **Tegadi:** QISM 1 §8

§8: «Sessiya muddati 30 kun, **har so'rovda uzayadi**.»

So'zma-so'z bajarilsa har sahifa ochilishida bazaga `UPDATE` ketadi. Kuniga
20 foydalanuvchi × yuzlab so'rov — hech qanday foyda bermaydigan yozuv.

**Qaror:** muddat surilishi kerak bo'lsa ham, u **soatiga bir martadan
ko'p qayta yozilmaydi**.

Natija foydalanuvchi uchun bir xil: ishlab turgan odamning sessiyasi hech
qachon tugamaydi, ishlamay qo'ygandan 30 kun keyin tugaydi.

---

## P-13 · `BIGINT` ulanish darajasida songa o'giriladi

**Bosqich:** 1 · **Tegadi:** QISM 1 §1.3, §6.2 · TZ 2.4

### Qanday topilgan

Kirish oqimi haqiqiy bazada sinalganda hisoblagich shunday o'sdi:

```
xato #1: hisoblagich = 1
xato #2: hisoblagich = 11     ← 2 emas
```

Xodim ikkinchi urinishdayoq bloklandi. §8 esa beshinchisida deydi.

### Sabab

`xato_urinish` ustuni `BIGINT` edi. postgres.js `BIGINT` ni **matn** qilib
qaytaradi — 64 bitli son JavaScript `number` ga sig'masligi mumkin.

Natijada `holat.xatoUrinish` matn bo'lib chiqdi:

```js
"1" + 1   →   "11"      // qo'shish emas, birlashtirish
```

Sof mantiq testlari buni ushlay olmagan: ular `BlokHolati` ni **son** bilan
yasagan. Xato faqat baza bilan kod uchrashgan joyda tug'ilgan.

### Ikki tomonlama tuzatish

**1. Model to'g'rilandi.** 0..5 oralig'idagi hisoblagichga 64 bit keraksiz:

```
xato_urinish  BIGINT  →  INTEGER
```

**2. Ulanish bir joydan yasaladigan bo'ldi** — `lib/db/ulanish.ts`.
Har skript o'zicha `postgres(url)` chaqirganda tur sozlamalari har xil
bo'lib qolardi. Endi `int8` ulanish darajasida `number` ga o'giriladi va
**xavfsiz chegaradan oshsa xato otiladi** — jimgina aniqlik yo'qotilmaydi.

### Pulga tegishli emas

Pul `NUMERIC` da saqlanadi va **matn** bo'lib kelaveradi — §1.3 aynan
shuni talab qiladi. Uni `lib/domain/pul.ts` qabul qiladi va `Decimal` ga
o'giradi. Bu qaror faqat `int8` ga tegishli.

### Dars

Sof mantiq 100% qoplangan bo'lsa ham, **baza bilan kod chegarasi alohida
sinalishi kerak**. Shu sabab `test/amal/` integratsiya testlari qo'shildi.

---

## P-14 · Cookie faqat server amalida yoziladi

**Bosqich:** 1 · **Tegadi:** QISM 1 §8

### Qanday topilgan

Sessiyasi tugagan foydalanuvchi kirish ekraniga emas, **500 xato sahifasiga**
tushdi:

```
Error: Cookies can only be modified in a Server Action or Route Handler.
  at sessiyaCookieOchir (lib/kirish/cookie.ts)
  at async joriyFoydalanuvchi (lib/kirish/joriy.ts)
```

`joriyFoydalanuvchi()` sahifa chizilayotganda ikki joyda cookie yozmoqchi
bo'lardi: yaroqsiz sessiyani tozalash va muddatni surish. Next.js ikkalasini
ham taqiqlaydi.

Bu xatoni faqat brauzer darajasidagi sinov ko'rsatdi — baza testlari 21/21
o'tgan edi, chunki ular Next.js ni umuman ishga solmaydi.

### Qaror

**Cookie faqat `'use server'` amalida yoziladi** — ya'ni kirish va chiqishda.
Sahifa chizilayotganda faqat o'qiladi.

Buning uchun cookie ning vazifasi qisqartirildi: u endi faqat **tokenni
tashiydi**, muddatni emas.

| Nima | Qayerda |
|---|---|
| Haqiqiy muddat, uzayish, bekor qilish | **bazada** (`sessiya` jadvali) |
| Token | cookie da, uzoq muddat bilan |

§8 buzilmaydi:
· «har so'rovda uzayadi» — bazada uzayadi (P-11)
· «darhol bekor qilish» — baza yozuvi bekor qilinadi, cookie ahamiyatsiz
· Yaroqsiz cookie zararsiz: haqiqat bazada, token baribir ishlamaydi

### Dars

Baza testlari va sof mantiq testlari yetarli emas — freymvork chegarasi
alohida sinaladi. Shu sabab `npm run sinov:brauzer` qo'shildi.

---

## P-15 · Yetkazib beruvchiga TZ 9.3 maydonlari qo'shildi

**Bosqich:** 2 · **Tegadi:** QISM 3 §2.9 · TZ 9.2, 9.3

### Nomuvofiqlik

Ma'lumotlar modeli (§2.9) yetti maydon beradi: nom, telefon, manzil,
to'lov muddati, valyuta, eslatma.

TZ 9.3 esa quyidagilarni talab qiladi:

| Guruh | Maydonlar |
|---|---|
| Asosiy | nomi, **nima yetkazadi**, holati, izoh |
| Aloqa | **kontakt shaxs**, telefon, **qo'shimcha telefon**, manzil |
| To'lov rekvizitlari | **bank nomi, hisob raqami, INN/STIR, MFO** |
| To'lov shartlari | standart to'lov muddati |

Rekvizitlar haqida 9.3 aniq yozgan: «**To'lov oynasida avtomatik chiqadi.**»
Ular saqlanmasa to'lov oynasi (9.5) ishlamaydi.

### Qaror

Yetti maydon qo'shildi: `nima_yetkazadi`, `kontakt_shaxs`,
`qoshimcha_telefon`, `bank_nomi`, `hisob_raqam`, `inn`, `mfo`.

### Yana bir aniqlik: `valyuta` ustuni QARZ valyutasi EMAS

TZ 9.2: «So'm va dollar **alohida turadi**, hech qachon bitta summaga
qo'shilmaydi. Bitta yetkazib beruvchida **ikkala valyutada** qarz bo'lishi
mumkin.»

Ya'ni qarz valyutasi har HARAKAT yozuvida, yetkazib beruvchida emas.
`yetkazib_beruvchi.valyuta` — bu faqat yangi kirim hujjatiga qo'yiladigan
standart qiymat.

Buni sxemaga izoh qilib yozib qo'yildi va ekranda ham ko'rsatildi:
o'qigan odam qarzni bitta valyutada deb o'ylab qolmasin. Aks holda
5-bosqichda balans noto'g'ri hisoblanardi.

### Hujjatga o'zgartirish

QISM 3 §2.9 ga yetti ustun qo'shiladi va `valyuta` ustuniga izoh yoziladi.

---

## P-16 · Transport aniq nisbat bo'yicha taqsimlanadi

**Bosqich:** 3 · **Tegadi:** TZ 7.9 · CLAUDE.md §6 (K-04)

### TZ misoli o'z ichida ziddiyatli

```
Mato        3 744 000  (75.2%)  →  +1 504 000
Karniz        594 000  (11.9%)  →  +  238 000
Kronshteyn    640 000  (12.9%)  →  +  258 000
            ─────────              ──────────
            4 978 000               2 000 000
```

Foizlar to'g'ri (yaxlitlangan). Lekin natijalar **yaxlitlangan foizdan**
hisoblangan: `75.2% × 2 000 000 = 1 504 000`.

Aniq nisbat boshqacha beradi:

| Qator | Aniq nisbat | TZ misoli | Farq |
|---|---|---|---|
| Mato | 1 504 218.56 | 1 504 000 | 0.01% |
| Karniz | 238 650.06 | 238 000 | 0.27% |
| Kronshteyn | 257 131.38 | 258 000 | 0.34% |

Ikkalasining yig'indisi ham 2 000 000 — bu tasodif, foizlar yaxlitlanganda
100.0% chiqqani uchun.

### Qaror

Kod **aniq nisbatni** ishlatadi. Foizni oldin yaxlitlash sun'iy xato
kiritadi va u har doim ham yig'indini saqlamaydi: uchta qator o'rniga
o'nta bo'lsa yaxlitlangan foizlar 100% dan chetga chiqadi va pul yo'qoladi
yoki paydo bo'ladi.

### Yig'indi HAR DOIM aynan teng

Bu asosiy shart. Har ulush alohida yaxlitlansa bir-ikki tiyin yo'qoladi,
uni esa hech kim sezmaydi va tannarx sekin siljiydi.

Yechim — «eng katta qoldiq» usuli: ulushlar pastga yaxlitlanadi, qolgan
tiyinlar qoldig'i kattaroq qatorlarga bittadan qo'shiladi. Test buni
tekshiradi.

### Kanonik raqamga ta'siri

CLAUDE.md §6 dagi K-04 raqami (`1 504 000 + 238 000 + 258 000 = 2 000 000`)
**yig'indi sifatida to'g'ri** va test uni aynan shu ko'rinishda tekshiradi.
Alohida qatorlar 0.5% chegarasida solishtiriladi.

### Hujjatga o'zgartirish

TZ 7.9 misolidagi uch raqam aniq qiymatga almashtirilishi kerak, yoki
misol yoniga «raqamlar yaxlitlangan» izohi qo'yilishi kerak.

---

## P-17 · Brak tannarx bo'luvchisiga KIRMAYDI

**Bosqich:** 3 · **Tegadi:** QISM 3 §3.3 · TZ 7.9 · CLAUDE.md §6 (K-05)

### Model o'z ogohlantirishiga zid

QISM 3 §3.3 da ketma-ket ikki qator:

```
Tannarx: (narx_birlik * miqdor + transport_ulush) / (miqdor - defekt)
⚠️ AUDIT: brak bo'lgan qism bo'luvchiga KIRMAYDI (7.9 misoli: 660 000/10 = 66 000).
```

Formula `miqdor − defekt` deydi — ya'ni brak bo'luvchiga TA'SIR QILADI.
Ogohlantirish esa teskarisini aytadi.

Raqamlar bilan: 10 shtanga, 660 000 so'm, 1 tasi brak.

| Yo'l | Natija |
|---|---|
| Formula bo'yicha | 660 000 / 9 = **73 333** |
| Ogohlantirish bo'yicha | 660 000 / 10 = **66 000** |

### Qaror

Ogohlantirish to'g'ri. Bo'luvchi — **to'liq miqdor**.

TZ 7.9 ning o'zi buni tushuntiradi: «tannarx 66 000 bo'lib qolaveradi
(73 333 emas), 66 000 so'm esa "yetkazib beruvchi defekti" xarajati
bo'lib hisobotga tushadi».

Sabab: «Aks holda qaysi yetkazib beruvchi ko'p brak berayotgani hech
qayerda ko'rinmaydi, tannarx esa sekin-asta o'sib boraveradi.»

CLAUDE.md §6 dagi K-05 kanonik raqami ham 66 000.

### Hujjatga o'zgartirish

QISM 3 §3.3 dagi formula tuzatilishi kerak:

```
Tannarx: (narx_birlik * miqdor + transport_ulush) / miqdor
```

---

## P-18 · `band` tashqi kalitlari 4-bosqichda qo'shiladi

**Bosqich:** 3 · **Tegadi:** QISM 3 §3.2 · TZ 7.3 · QISM 1 §21.2

### Vaziyat

`band` jadvali ikki ustun orqali buyurtmaga bog'lanadi:

```
buyurtma_pozitsiya_id  → buyurtma_pozitsiya(id)
pozitsiya_material_id  → pozitsiya_material(id)
```

Bu jadvallar 4-bosqichda (sotuv va buyurtma) yaratiladi. QISM 1 §21.2
esa tartibni qat'iy belgilaydi: «**Ombor sotuvdan oldin** — sotuv band
qilishga tayanadi».

### Qaror

Ustunlar hozirdan `NOT NULL` bo'lib turadi, tashqi kalitlar 4-bosqichda
qo'shiladi.

### Nega bu xavfsiz

`band` jadvalining ASOSIY kafolati tashqi kalit emas:

```sql
CREATE UNIQUE INDEX band_bitta_faol ON band (bolak_id) WHERE holat = 'FAOL';
```

TZ 7.3 ning «ikki usta bitta bo'lakka da'vo qilsa — birinchisi oladi,
ikkinchisiga rad javobi» qoidasi **shu indeks** bilan ta'minlanadi va u
hozirdan ishlaydi. Integratsiya testi buni haqiqiy poyga bilan tekshiradi:
ikki `INSERT` bir vaqtda yuboriladi, aynan bittasi o'tadi.

Tashqi kalit esa boshqa narsani kafolatlaydi — mavjud bo'lmagan
pozitsiyaga band qo'yilmasligini. U 4-bosqichda qo'shiladi va o'sha
paytda mavjud yozuvlar tekshiriladi.

### 4-bosqichda bajariladigan ish

```sql
ALTER TABLE band ADD CONSTRAINT band_pozitsiya_fk
  FOREIGN KEY (buyurtma_pozitsiya_id) REFERENCES buyurtma_pozitsiya(id);
ALTER TABLE band ADD CONSTRAINT band_pozitsiya_material_fk
  FOREIGN KEY (pozitsiya_material_id) REFERENCES pozitsiya_material(id);
ALTER TABLE bolak ADD CONSTRAINT bolak_pozitsiya_fk
  FOREIGN KEY (buyurtma_pozitsiya_id) REFERENCES buyurtma_pozitsiya(id);
```

docs/QARZLAR.md, T-04 sifatida yozib qo'yildi.

---

## P-19 · Band qilishda faqat BITTA bo'lak qulflanadi

**Bosqich:** 3 · **Tegadi:** QISM 1 §7.2 · TZ 7.3

### Qanday topilgan

Birinchi yozilgan kodda nomzodlar `FOR UPDATE SKIP LOCKED` bilan
o'qilardi — bir yo'la 20 tagacha bo'lak qulflanardi.

Integratsiya testi buni ushladi: omborda **ikki** bo'lak bor, ikki usta
bir vaqtda so'raydi. Kutilgan natija — ikkalasi ham oladi. Haqiqiy
natija — birinchisi **ikkalasini ham qulflab qo'ydi**, ikkinchisiga
«Materialga kutmoqda» chiqdi.

QISM 1 §7.2 esa aynan buning teskarisini talab qiladi:

> «`FOR UPDATE SKIP LOCKED` — ikkinchi usta **bloklanmaydi, keyingi mos
>  bo'lakni oladi**.»

### Qaror

Tanlov ikki qadamga bo'lindi:

1. **Nomzodlar QULFSIZ o'qiladi** — hech kim bloklanmaydi
2. `lib/domain/kesish.ts` dagi algoritm eng mosini tanlaydi (§2.2 —
   qoida bir joyda qoladi, SQL ga ko'chirilmaydi)
3. **FAQAT tanlangan bitta bo'lak** qulflanadi (`FOR UPDATE SKIP LOCKED`)
4. Qulflab bo'lmasa — o'sha bo'lak ro'yxatdan chiqariladi va **keyingisi**
   tanlanadi

### Nega SQL ga ko'chirilmadi

Eng oson yechim `ORDER BY ... LIMIT 1 FOR UPDATE SKIP LOCKED` bo'lardi —
bitta so'rovda tanlash va qulflash. Lekin u holda TZ 7.6 algoritmi
(tartib, bag'rikenglik, eng kam chiqindi) SQL da takrorlanardi va
`lib/domain/kesish.ts` bilan ikki nusxa bo'lib qolardi.

QISM 1 §2.2 buni taqiqlaydi. Ikki qadamli yechim qoidani bir joyda
saqlaydi va qulflashni ham minimal qiladi.

### Dars

Bu xatoni faqat **bir vaqtda ikki so'rov** yuboradigan test ko'rsatdi.
Ketma-ket ishlaganda kod butunlay to'g'ri ishlardi.
