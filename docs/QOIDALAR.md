# QOIDALAR — batafsil

`CLAUDE.md` ning uzun izohlari. Claude Code buni **kerak bo'lganda** o'qiydi,
har sessiyada emas.

---

## 1. NOANIQ TALAB — misollar

### 1.1. Taxmin qilmaslik

❌ **Yomon**
> Egasi: "ombor sahifasini qil"
> Claude: [darhol kod yozadi, o'zi tanlagan ko'rinishda]

✅ **Yaxshi**
> Egasi: "ombor sahifasini qil"
> Claude: "TZ 7.1 da ombor 5 ta ekrandan iborat: qoldiq, kirim hujjati,
> material kartochkasi, hisobdan chiqarish, inventarizatsiya.
> Qaysi biridan boshlaymiz? Tavsiyam — qoldiq ro'yxati, chunki qolganlari
> unga tayanadi."

### 1.2. Talabni qayta aytib berish

```
TUSHUNDIM:
  Siz: "usta ishni olganda material tekshirilsin"

  Men shunday tushundim:
  · Usta botdan ish olayotganda tizim materialni tekshiradi
  · Yetmasa ish berilmaydi

  ⚠️ LEKIN bu Qaror Q-03 ga zid.
  Q-03 bo'yicha material buyurtma BERILAYOTGANDA tekshiriladi.
  Sabab: usta bosib-bosib rad javob olmasin.

  Q-03 ni o'zgartiramizmi yoki men noto'g'ri tushundimmi?
```

### 1.3. "O'zing tanla" deyilganda

```
Siz "o'zing tanla" dedingiz — men shunday qildim:

Ostatka ro'yxati sanasi bo'yicha emas, O'LCHAMI bo'yicha saralanadi.
Sabab: omborchi "3 metrlik bormi?" deb qidiradi, "kecha nima keldi?" deb emas.
Kerak bo'lsa sana bo'yicha saralashni bir bosishda qo'shamiz.
```

### 1.4. Texnik jihatdan noto'g'ri talab

```
❌ Siz so'raganingiz: "qoldiqni jadvalga yozib qo'yaylik, tez bo'ladi"

Buni qila olmayman. Sabab:
  Qoldiq saqlansa, u haqiqiy yozuvlardan chetga chiqadi. Bir marta xato
  bo'lsa abadiy qoladi va topib bo'lmaydi. 2.2-invariant taqiqlaydi.

✅ O'rniga:
  Qoldiq yozuvlardan hisoblanadi. Sekin bo'lsa keshlaymiz, kesh har kecha
  qayta hisoblanadi. Tezlik bir xil, xato xavfi yo'q.
```

---

## 2. RUXSAT SO'RASH — namuna

Faqat "ruxsat beringmi?" deyish foydasiz. Variant va tavsiya ber:

```
⚠️ RUXSAT KERAK

Nima:    `bolak` jadvaliga `yolda_kochirish_id` ustuni qo'shish
Nega:    20.7.4 — yo'ldagi bo'lak qaysi hujjatda ekanini bilish kerak
Xavf:    Yo'q — yangi ustun, NULL bo'lishi mumkin, eski ma'lumot tegilmaydi

Variantlar:
  A) Ustun qo'shish              ← tavsiyam
  B) `kochirish_qator` dan JOIN  — ustun yo'q, har so'rovda qo'shimcha JOIN

Davom etaymi?
```

---

## 3. REJA VA HISOBOT — namuna

### 3.1. Reja (kod yozishdan oldin)

```
VAZIFA: Material kartochkasi
TZ: 5.3, 5.4, 5.5 + Q-01, Q-14

TUSHUNGANIM:
  Material qo'shish/tahrirlash ekrani. Birliklar, koeffitsient, narx,
  chegaralar. Filial narxi istisnosi ham shu yerda.

YARATILADI:
  lib/db/schema/material.ts        jadval
  lib/domain/birlik.ts             konversiya
  app/(panel)/material/page.tsx    ro'yxat
  app/(panel)/material/[id]/       kartochka

TESTLAR:
  · karniz 210 sm → 4.20 m → 147 000 so'm  (Q-01)
  · koeffitsient 300, shtanga → sm

ANIQLIK KERAK:
  · "Standart rulon eni" majburiymi? Q-14 bo'yicha yo'q. Tasdiqlaysizmi?

Davom etaymi?
```

### 3.2. Hisobot (ish tugagach)

```
✅ MATERIAL MODULI TAYYOR

Endi nima ishlaydi:
  · Material qo'shish, tahrirlash, nofaol qilish
  · Kirim va sarflash birliklari, koeffitsient
  · Sotuv narxi, minimal ustama chegarasi
  · Filial narxi istisnosi

Qanday tekshirasiz:
  1. Saytda "Material" bo'limiga kiring
  2. "Yangi material" bosing
  3. Nom: "Alyuminiy karniz", hisob turi: "Chiziqli"
  4. Kirim birligi "shtanga", sarflash "sm", koeffitsient 300
  5. Sotuv narxi 35 000 (1 metr uchun)
  6. Saqlang → ro'yxatda `35 000 so'm/m` bo'lib ko'rinishi kerak

Testlar: 14/14 ✅
Keyingi qadam: Konstruktor (TZ 4)
```

### 3.3. Xato haqida

```
⚠️ XATO TOPDIM

Nima bo'ldi:
  Kirim hujjatida transport taqsimoti noto'g'ri hisoblangan —
  brak bo'lgan qism bo'luvchiga kirib ketgan.

Oqibati:
  Tannarx 66 000 o'rniga 73 333 chiqqan. Sinov ma'lumotida, zarar yo'q.

Tuzatdim:
  lib/domain/tannarx.ts — brak miqdori endi ayiriladi
  Test qo'shildi: TZ 7.9 misoli (660 000 / 10 = 66 000)

Testlar: 16/16 ✅
```

---

## 4. ENG XAVFLI ODAT — ROZILIK

Egasi noto'g'ri narsa aytsa va Claude "ha, to'g'ri" desa — bu **eng katta
zarar**. U rozilikka ishonib qaror qabul qiladi.

```
❌ Egasi: "qoldiqni tez bo'lishi uchun jadvalga yozib qo'yaylik"
   Claude: "Yaxshi fikr, shunday qilamiz"

✅ Egasi: "qoldiqni tez bo'lishi uchun jadvalga yozib qo'yaylik"
   Claude: "Buni qila olmayman — 2.2-invariant taqiqlaydi.
           Saqlangan qoldiq bir marta xato bo'lsa abadiy qoladi.
           Tezlik uchun kesh ishlatamiz — natija bir xil, xavf yo'q."
```

**Kelishuvchan bo'lma. To'g'ri bo'l.**

---

## 5. MULOQOT — nima yozilmaydi

❌ "Refaktoring qildim va abstraksiya qatlamini optimallashtirdim"
❌ "`useMemo` bilan render optimizatsiya qilindi"
❌ 50 qator kod ko'chirilgan javob

✅ "Ombor ro'yxati endi 3 barobar tez ochiladi"
✅ "Material qo'shish ishlaydi — quyidagicha tekshiring: ..."

Odatiy javob — 10–20 qator. Jadval va ro'yxat ishlat, uzun matn emas.

---

## 6. BAZA TESTI — HAR SAFAR O'TISHI SHART

**2026-08-20 da olingan dars.** Baza testlari birinchi yurishda o'tdi,
ikkinchisida oltita test yiqildi. Kodda bironta xato yo'q edi — testlar
o'zining oldingi yurishlarini ko'rib turgan edi.

### Uch xil buzilish

| Namuna | Nima bo'ladi | Xatoning ko'rinishi |
|---|---|---|
| Qat'iy `id` (`9600`, `9601`) | Ikkinchi yurishda o'sha qator turibdi | `duplicate key value violates unique constraint` |
| Qat'iy noyob nom (`'K-USD-1'`, `'Amal sinov mijozi'`) | Ikkinchi yurishda dublikat | `duplicate key` yoki kutilmagan `DUBLIKAT` javobi |
| `COUNT(*)` bilan aniq son (`toBe(4)`) | Har yurish yana 4 ta qo'shadi | `expected 20 to be 4` |

Uchalasi ham «kod buzildi» bo'lib o'qiladi va vaqt kodni qidirishga
ketadi. Aslida test tuzatilishi kerak.

### Qoida

Baza testida ishlatilgan **har qanday noyob qiymat** ikki yo'ldan biri
bilan yozilsin:

```ts
// 1. Har yurishda yangi belgi — yurish ICHIDA bir xil
const BELGI = String(Date.now()).slice(-8);
const kod = `R-NOYOB-${BELGI}`;

// 2. Yoki test o'zidan oldin tozalaydi
await sql`DELETE FROM xodim WHERE id = 9601`;
```

Belgi **yurish ichida bir xil** bo'lishi muhim: «kod takrorlanmasin»
degan testlar aynan shu takrorlanishga tayanadi.

### Sanashda

`COUNT(*)` ni butun jadval bo'yicha emas, **shu yurish yozgan qatorlar**
bo'yicha sana:

```ts
// ❌ WHERE nom LIKE 'Sinov %'
// ✅ WHERE nom LIKE ${`Sinov %${BELGI}`}
```

### Tekshirish

Modul tugadi deyishdan oldin `npm run test:baza` **ikki marta** ketma-ket
yurgiziladi. Ikkinchi yurish qizil bo'lsa — modul tayyor emas.

### Bir vaqtda IKKI yurish — taqiq

**2026-08-22 da olingan dars.** To'liq to'plam fonda yurib turganda
alohida bitta fayl yurgizildi. Ikkalasi bir xil masofadagi bazaga
tegdi va qat'iy `id` li testlar (`9600`/`9601`) bir-birining qatorini
o'chirdi:

```
insert or update on table "xodim_rol" violates foreign key constraint
```

Kodda xato yo'q edi — ikki yurish poyga qildi.

**Qoida:** baza testining ikki nusxasi bir vaqtda yurmaydi. Fonda
yurgan to'plam tugamaguncha yangi yurish boshlanmaydi; shoshilinch
bo'lsa avvalgisi to'xtatiladi.

### Tarmoq uzilishini xatodan ajratish

Masofadagi baza (T-08) uzilsa test qizil bo'ladi, lekin kod sog'.
Ajratish:

```bash
grep -cE "CONNECT_TIMEOUT|ENOTFOUND|ECONNRESET" natija.log
```

Son noldan katta bo'lsa — **tarmoq**. Ulanish tiklanganini bitta
yengil fayl bilan tekshirib, to'plam qaytadan yurgiziladi. Tarmoq
uzilishi «o'tdi» deb yozilmaydi va kod tuzatilmaydi.

### Qachon to'liq to'plam yuriladi

To'liq baza to'plami ~50 daqiqa oladi: baza masofada, har so'rov
tarmoqdan o'tadi (T-08, P-12). Har qadamdan keyin uni ikki marta
yurgizish vaqtning deyarli hammasini **o'zgarmagan kodni qayta
sinashga** sarflaydi.

| Qachon | Nima yuriladi | Vaqt |
|---|---|---|
| Har qadamdan keyin | `npm test` + o'sha qadamning test fayli | 1–3 daq |
| **Bosqich** oxirida | to'liq baza, ikki marta | ~100 daq |

Sifat pasaymaydi: o'zgarmagan kodni qayta sinash yangi xato topmaydi.

### To'plam yurayotganda ishlash

Kutib o'tirilmaydi — ish davom etadi. Lekin **nimaga tegilishi**
cheklangan:

| Tegiladi | Tegilmaydi |
|---|---|
| `app/` — ekranlar va formalar | `lib/` — mantiq va tranzaksiya |
| `docs/` | mavjud `test/` fayllari |
| **yangi** fayllar | `vitest.baza.config.ts` dan boshqa sozlama |

Sabab: vitest test faylini **navbati kelganda** o'qiydi. Yurish
ketayotganda `lib/` o'zgartirilsa, test yarim yozilgan kodni o'qib
qolishi va **soxta qizil** natija berishi mumkin. `app/` ni testlar
import qilmaydi (`server-only`), yangi faylni esa yurish ko'rmaydi —
ular xavfsiz.

Yurish ketayotganda bog'lanmagan **boshqa sohada** ishlanadi: baza
mantiqi sinalayotganda ekran chiziladi. Aks holda natija qizil
chiqqanda ustiga qurilgan ish ham qayta ishlanadi.

---

## 7. EKRAN SO'ROVLARI BAZADA SINALADI

`tsc` SQL ni ko'rmaydi — u shunchaki matn. Xato ustun nomi qurishdan
o'tadi, testlardan o'tadi va faqat **ekranni ochgan odam** oldida
yiqiladi.

Shu sabab `app/**/malumot.ts` dagi har bir eksport qilingan funksiya
`test/integratsiya/ekran-sorovlari.test.ts` da haqiqiy bazada bir
marta chaqiriladi. Natija tekshirilmaydi — **yiqilmasligi**
tekshiriladi.

```ts
await expect(sotuvEkrani.sotuvTurlari(filialId)).resolves.toBeDefined();
```

Mavjud bo'lmagan id berilsa funksiya `null` yoki `[]` qaytarishi
kerak, yiqilmasligi — bu ham shu yerda tekshiriladi.

**Yangi `malumot.ts` funksiyasi yozilsa — shu testga qatori
qo'shiladi.** Aks holda uning SQL i hech qachon sinalmaydi.

⚠️ Shart bo'yicha ikki xil SQL beradigan funksiya **ikkala shart
bilan** chaqiriladi (masalan `kassaKitobi` da admin va sotuvchi
ko'rinishi) — aks holda yarim so'rov sinalmay qoladi.
