# JALYUZI ERP — LOYIHA HUJJATI

**Versiya:** 2.0 (birlashtirilgan)
**Sana:** 16.08.2026

| O'lchov | Son |
|---|---|
| Bo'limlar | 22 |
| Edge case | 167 |
| Ma'lumot jadvallari | 44 |
| Qabul qilingan qarorlar | 35 |
| Tekshiruv invariantlari | 13 |
| Ochiq savol | **0** |

---

## BU HUJJATNI QANDAY O'QISH

Besh qismdan iborat. **Tartibi muhim** — yuqoridagi qism pastdagisini bekor qiladi.

| Qism | Nima | Ustunligi |
|---|---|---|
| **0** | Qabul qilingan qarorlar (35 ta) | **eng yuqori** |
| **1** | Texnik talablar — qanday quriladi | texnik masalada ustun |
| **2** | Funksional TZ — nima quriladi | funksional masalada ustun |
| **3** | Ma'lumotlar modeli — 44 jadval | — |
| **4** | Audit topilmalari | ma'lumot |

### ⚠️ Muhim ogohlantirish

**2-qismning asosiy matni (TZ v1.14) auditdan o'tgan, lekin tuzatilmagan.**
Unda 16 ziddiyat, 14 uzilgan bog'liqlik va 11 bo'shliq bor — 4-qismda sanalgan.

**TZ ni o'qiyotganda har doim 0-qismdagi qarorni tekshiring.**
TZ bir narsa desa, 0-qism boshqa narsa desa — **0-qism to'g'ri**.

Eng ko'p adashtiradigan joylar ro'yxati 0-qismning oxirida (0.8-band).

### 2-qismning tuzilishi

| Qism | Manba | Holati |
|---|---|---|
| 1–19 bo'lim | TZ v1.14 | auditdan o'tgan, matni tuzatilmagan |
| 20-bo'lim | Ko'p filial | yangi, tekshirilgan |
| 21-bo'lim, 8.17, 3.15, soliq | Rejalar va bo'shliqlar | yangi, tekshirilgan |
| 22-bo'lim | Filiallararo hisob-kitob | yangi, tekshirilgan |

---

# QISM 0 — QABUL QILINGAN QARORLAR

> Bu qarorlar **TZ dan ustun**. Ziddiyat bo'lsa shu jadval to'g'ri.
> 35 ta qaror, ikki audit davomida qabul qilingan.

---

## 0.1. Ombor va material

| # | Qaror | Tegadigan bandlar |
|---|---|---|
| **Q-01** | Chiziqli material: saqlash va sarflash **smda**, narx **1 metr uchun**, tizim ÷100 qiladi. Koeffitsient = 1 kirim birligida nechta sm (metr→100, shtanga→300, quti→3000) | 3.7 · 4.5 · 5.3 · 5.4 · 18 |
| **Q-02** | Band **aniq bo'lakka** qo'yiladi. Usta "Tugatdim"da bo'lakni tasdiqlaydi (rejadagi oldindan tanlangan) | 7.3 · 7.4 · 7.6 · EC-OMB-21 · 19.2 |
| **Q-05** | Ombor qoldig'i **har doim `eni × bo'yi`, metrda**. Kv.m — faqat hisoblanadigan chiqish qiymati, hech qachon kiritilmaydi | 5.2 · 7.3 · 7.4 · 11.7.1 · 11.11 · 15.1 |
| **Q-06** | Usta boshqa bo'lakni tanlasa — eski band **darhol bo'shaydi**, sabab ro'yxatdan tanlanadi (iflos · topa olmadim · rang · boshqa) | 7.3 · 7.6 · 11.7.7 |
| **Q-09** | Kv.m — **hisoblanadigan qiymat**. Yig'ma ko'rsatiladi, lekin sanashda, chegarada, xaridda ishlatilmaydi | 5.2 · 11.7.1 · 11.7.6 · 11.11 |
| **Q-10** | Kam qoldiq chegarasi — **uzunlik bo'yicha, metrda** | 5.5 · 14.4 · 15.3 |
| **Q-13** | Birlashtirib kesish — **faqat hisob-kitob tavsiyasi**. Band va ombor hisobi har pozitsiyaga alohida | 7.6 · 8.5 · EC-OMB-02 |
| **Q-14** | Material kartochkasiga **"standart rulon eni"** maydoni. Kam qoldiq chegarasi (metr) shu orqali kv.m ga o'giriladi. Bo'sh bo'lsa oxirgi kirimdan olinadi | 5.3 · 5.5 · 15.3 |

## 0.2. Buyurtma va ishlab chiqarish

| # | Qaror | Tegadigan bandlar |
|---|---|---|
| **Q-03** | Material yetishmasligi **buyurtma berilayotgan payt** aytiladi — sotuv ekranida ham, botda ham. Tasdiqlashda ikkinchi tekshiruv saqlanadi | 3.4 · 7.7 · 8.3 · 8.12 · 13.4 |
| **Q-11** | Botda ham yetishmaslik ogohlantirishi chiqadi | 13.4 · 13.6 |
| **Q-12** | Sayt buyurtmasi **darhol "Tasdiqlangan"**, admin tasdig'i yo'q. 3.14 tuzatiladi | 3.14 · 8.4 |
| **Q-15** | Qayta kesish uchun **haq to'lanmaydi**. Birinchi "Tugatdim" haqi bekor qilinadi. Istisno: material defekti bo'lsa admin qo'lda qo'shadi | 8.17 · 10.13 · 10.14 |
| **Q-16** | Tayyor mahsulot **o'z narxi va o'z tannarxi** bilan sotiladi. Material qayta yechilmaydi | 3.15 · 7.13 · 11.4.1 |

## 0.3. Narx, pul, kassa

| # | Qaror | Tegadigan bandlar |
|---|---|---|
| **Q-17** | Kassa kuni **20:00** da tugaydi, filial sozlamasida o'zgartiriladi | 12.17 · 14.4 · 20.2 |
| **Q-18** | Chek — **80 mm termo printer** | 3.14 |
| **Q-28** | Narx: **standart umumiy**, filial o'zi o'zgartirishi mumkin (istisno) | 5.4 · 20.9 |
| **Q-07** | Stavka: **standart + istisno** (narx bilan bir xil naqsh). Filial o'z stavkasini qo'yishi mumkin | 10.8 · 10.9 · 20.11.3 |

## 0.4. Ko'p filial

| # | Qaror | Tegadigan bandlar |
|---|---|---|
| **Q-21** | Filial **aniq ochiladi** — tizim ko'p filial uchun quriladi | 20 (butun bo'lim) |
| **Q-24** | Har filial ikki rejimda: `Sotadi ☑` va `Ishlab chiqaradi ☑`. To'rt holat kelib chiqadi | 20.2 · 20.4 |
| **Q-25** | Har filialda **o'z ombori**. Material alohida hisoblanadi + filiallar orasida ko'chirish | 20.6 · 20.7 |
| **Q-26** | **Umumiy:** material nomlari, mahsulot turlari, formulalar, mijozlar, mijoz qarzi, yetkazib beruvchilar. **Filialga:** qoldiq, kassa, xodimlar | 20.3 |
| **Q-29** | Xodim **bitta filialda**. Sotuvchi pulini istalgan filialga topshirishi mumkin — qarz o'sha yo'nalishda yoziladi | 20.11 · 22.5 |
| **Q-31** | Xarid — **har filial o'zi** qiladi | 15.3 · 20.6 |
| **Q-32** | Material boshqa filialda bo'lsa — **sotuvchi tanlaydi**: kutish yoki o'sha filialga yuborish | 3.4 · 20.6.4 |
| **Q-08** | Material ko'chirish so'rovini **beruvchi filial omborchisi** hal qiladi. Admin tasdig'i yo'q, chegara yo'q. Nazorat: audit jurnali + haftalik hisobot | 20.7 |

## 0.5. Filiallararo hisob-kitob

| # | Qaror | Tegadigan bandlar |
|---|---|---|
| **Q-30** | Pul qaysi filialga tushsa **o'sha yerda qoladi**. Filiallar o'rtasida **qarz** paydo bo'ladi — uchinchi qarz turi | 22 (butun bo'lim) |
| **Q-33** | Tayyor mahsulot qarzi = **tannarx + ish haqi + tikkan filialning foyda ulushi**. Zarar bo'lsa qarz tushumdan oshmaydi | 22.3 |
| **Q-34** | Qarz **oy oxirida o'zaro hisoblanadi**, faqat farq o'tkaziladi. Oraliq to'lov ham mumkin | 22.6 |
| **Q-35** | Material ko'chirish qarzi — **tannarx bo'yicha standart**, qo'lda o'zgartirish mumkin (sabab majburiy, jurnalga tushadi) | 22.4 |
| **Q-27** | Foyda filiallar kesimida **50/50** bo'linadi. Bu faqat hisobot — pul harakati 22-bo'limda | 20.17 |

## 0.6. Rejalar va hisobotlar

| # | Qaror | Tegadigan bandlar |
|---|---|---|
| **Q-22** | **Rejalar moduli** kerak — yangi 21-bo'lim | 21 (butun bo'lim) |
| **Q-04** | **14.6 ruxsatlar matritsasi — yagona manba.** 11.10 va 12.14 jadvallari boshlang'ich **preset** | 1.2 · 9.5 · 10.15 · 11.10 · 12.14 · 14.6 · 20.12 |

Reja qamrovi: **sotuvchi · filial · korxona**. Ustaga reja qo'yilmaydi —
jalyuzi o'lchami har xil, dona bo'yicha reja adolatsiz chiqadi.

## 0.7. Boshqa

| # | Qaror | Tegadigan bandlar |
|---|---|---|
| **Q-19** | Boshlang'ich ma'lumot — **Excel import** | — |
| **Q-20** | Maketlar kerak emas — ekranlar TZ dan quriladi | — |
| **Q-23** | Soliq maydonlari **hozirdan yig'iladi**, elektron faktura keyin ulanadi. NDS **chegirmadan keyin** ajratiladi | 6.7 · 8.14 · 11.4 |

---

## 0.8. ENG KO'P ADASHTIRADIGAN JOYLAR

TZ ning asosiy qismi (v1.14) auditdan o'tgan, **lekin matni tuzatilmagan**.
Quyidagi joylarda TZ **eski** ma'lumot beradi:

| TZ da yozilgan (eski) | To'g'risi |
|---|---|
| Karniz metrda sarflanadi (3.7) | **smda** sarflanadi, narx 1 metr uchun (Q-01) |
| Aniq bo'lak kuzatilmaydi (7.4, 7.6) | **kuzatiladi** — usta "Tugatdim"da tasdiqlaydi (Q-02) |
| Usta ishga olmoqchi, material yetmadi (8.3, 8.12) | **buyurtma berilayotganda** aytiladi (Q-03) |
| Ombor qoldig'i kv.m da (15.1) | **eni × bo'yi, metrda** (Q-05) |
| Sayt buyurtmasi admin tasdig'ini kutadi (3.14) | **kutmaydi** (Q-12) |
| Omborchi faqat ombor hisobotlarini ko'radi (11.10) | Bu **preset**, matritsa boshqaradi (Q-04) |
| Bitta ostatka chegarasi (14.4) | **ikkita** — yaroqsiz va kam ishlatiladigan |
| 7-bo'limga havolalar (7.5, 7.8, 7.9, 7.10, 7.11, 7.12) | **bir raqamga surilgan** — Qism 4, U-02 ga qarang |
| Kunlik yopish varaqasi keyinroqqa qoldirilgan (11.12) | **bajarilgan** — 15.4 |
| "Kutilmoqda" ko'rsatkichi (17.2) | **bekor** — `bo'sh / band` ajratmasi |

---

*Qarorlar oxiri. 35 ta.*


---

# QISM 1 — TEXNIK TALABLAR

> Qanday quriladi. Texnik masalada bu qism TZ dan ustun.

---



**Loyiha:** Jalyuzi ishlab chiqarish korxonasi uchun ERP
**Funksional TZ:** `TZ-v1.14.md` + `AUDIT.md` (14 ta qaror)
**Sana:** 15.08.2026

Bu hujjat **qanday qurilishini** belgilaydi. Nima qurilishi — TZ da.
Ziddiyat chiqsa: funksional masalada TZ ustun, texnik masalada bu hujjat ustun.

---

## 1. STEK

| Qatlam | Tanlov | Versiya |
|---|---|---|
| Til | **TypeScript** (`strict: true`) | 5.x |
| Freymvork | **Next.js** (App Router) | 15.x |
| Ish muhiti | Node.js | 22 LTS |
| Baza | **PostgreSQL** | 16+ |
| Baza vositasi | **Drizzle ORM** + toza SQL (hisobotlar) | — |
| Interfeys | Tailwind CSS + shadcn/ui | — |
| Formalar | React Hook Form + **Zod** | — |
| Pul | **decimal.js** | — |
| Sana | **date-fns** + `date-fns-tz` | — |
| Kirish | Auth.js (NextAuth) v5 | — |
| Bot | Telegraf (shu monorepo ichida) | — |
| Testlar | Vitest + Playwright | — |

### 1.1. Nega TypeScript

TZ ning uchta invarianti — 1.3 (valyuta aralashmasligi), 5.3 (barcha uzunlik smda), 2.3 (snapshot o'zgarmasligi) — TypeScript da **kompilyator darajasida** ushlanadi. Auditdagi Z-01 (karniz 100× narx xatosi) va B-01 (formula birligi noaniq) shu yo'l bilan takrorlanmaydi.

Boshqa tillarda bu qoidalar faqat hujjatda qoladi va vaqt o'tib buziladi.

### 1.2. Nega Next.js

Sayt, API va bot **bitta loyiha, bitta til**. Narx hisoblash, kesish algoritmi, band qilish — har biri **bitta fayl**. TZ auditidagi ziddiyatlarning ko'pi bir narsa ikki joyda yozilganidan chiqqan; kodda bu naqsh takrorlanmaydi.

### 1.3. Nega Drizzle

27 ta hisobot (11-bo'lim) baribir SQL da yoziladi. Drizzle SQL dan uzoqlashtirmaydi va `NUMERIC` ni **matn** qilib qaytaradi — bu pul aniqligi uchun to'g'ri xatti-harakat.

---

## 2. ASOSIY PRINSIPLAR

### 2.1. Har invariant — kodda

TZ ning 2-bo'limidagi har invariant uchun **kod darajasida to'siq** bo'lishi shart. Hujjatdagi jumla yetarli emas.

| TZ invarianti | Kodda qanday kafolatlanadi |
|---|---|
| 1.3 So'm va dollar qo'shilmaydi | `Som` va `Dollar` — alohida turlar (§3) |
| 5.3 Barcha uzunlik smda | `Santimetr` va `Metr` — alohida turlar (§4) |
| 2.1 Yarim bajarilgan amal yo'q | Tranzaksiya chegaralari (§7) |
| 2.2 Balans yozuvlardan hisoblanadi | Balans ustuni **saqlanmaydi**, `SUM()` bilan olinadi |
| 2.3 Snapshot o'zgarmaydi | Snapshot ustunlari `UPDATE` dan himoyalanadi (§6.6) |
| 12.1 Xarajat ≠ kassa chiqimi | Ikki jadval: `xarajat` va `kassa_yozuv` — bog'lanmagan |

### 2.2. Bir mantiq — bir joyda

Quyidagi mantiq **faqat `lib/domain/` ichida** yoziladi va sayt, bot, test — uchalasi shuni chaqiradi. Nusxa ko'chirish taqiqlanadi:

```
lib/domain/narx.ts        →  3.8 narx · 6.3 offset · 13.5 bot narxi
lib/domain/formula.ts     →  4.5 sarflash formulasi · 4.8 test kalkulyatori
lib/domain/birlik.ts      →  5.3 konversiya · B-01 formula natijasi
lib/domain/kesish.ts      →  7.6 algoritm · 7.3 band qilish
lib/domain/tannarx.ts     →  7.8 FIFO · 7.9 transport taqsimoti
lib/domain/stavka.ts      →  10.8 stavka · 10.10 snapshot
lib/domain/kassa.ts       →  12.3 manba qoidasi · 12.19 yaxlitlash
```

### 2.3. Platformaga bog'lanmaslik

Kod **oddiy Next.js + oddiy Postgres** bo'lib qoladi. Quyidagilar **taqiqlanadi**:

| Taqiqlanadi | O'rniga |
|---|---|
| Vercel KV / Blob / Edge Config | Postgres jadval · `/uploads` yoki S3 |
| Vercel Cron | `/api/cron/*` yo'llari (§13) |
| Neon serverless driver, branching | oddiy `postgres` (postgres.js) kutubxonasi |
| Har qanday platforma SDK si | standart kutubxona |

**Tekshiruv:** loyiha loqal kompyuterda `docker compose up` bilan to'liq ishlashi shart. Ishlamasa — platformaga bog'langan.

### 2.4. TZ tirik qoladi

Kod TZ dan chetga chiqsa — **TZ yangilanadi**, kod emas. Har PR da: qaysi band bajarildi, TZ o'zgardimi.

Kommit xabari formatida band raqami bo'lishi shart:

```
feat(ombor): band qilish algoritmi — TZ 7.3, 7.6
fix(kassa): yaxlitlash 100 so'mgacha — AUDIT Z-08
```

---

## 3. PUL

### 3.1. Qat'iy qoidalar

1. Pul **hech qachon** JavaScript `number` bo'lmaydi
2. Bazada — `NUMERIC(14,2)`
3. Koddan chiqqanda — `string`
4. Hisoblashda — `Decimal` (decimal.js)
5. Valyuta har doim summa bilan birga yuradi

```ts
// lib/domain/pul.ts
import Decimal from 'decimal.js';

export type Valyuta = 'SOM' | 'USD';

// Brand — bu turlarni bir-biriga almashtirib bo'lmaydi
declare const brand: unique symbol;
export type Som    = Decimal & { readonly [brand]: 'SOM' };
export type Dollar = Decimal & { readonly [brand]: 'USD' };

export const som    = (v: string | number): Som    => new Decimal(v) as Som;
export const dollar = (v: string | number): Dollar => new Decimal(v) as Dollar;
```

Natijada:

```ts
const a = som(120_000);
const b = dollar(50);

a.plus(b);   // ❌ TypeScript xato beradi — 1.3-invariant kafolatlandi
```

### 3.2. Valyuta konversiyasi — faqat bitta funksiya

```ts
export function ogir(
  summa: Dollar,
  kurs: Kurs,          // { qiymat: Decimal, sana: Date, manba: 'JORIY' | 'SNAPSHOT' }
): Som
```

Kursni **parametr sifatida uzatish majburiy**. Funksiya ichida sozlamadan o'qish taqiqlanadi — aks holda snapshot buziladi (2.3-invariant).

### 3.3. Yaxlitlash

| Joy | Qadam | Band |
|---|---|---|
| Narx (offset qo'llangandan keyin) | 100 so'm | 6.3 |
| Bot narxi | **100 so'm** (Z-08 qarori) | 13.5 |
| Kassa to'lovi | 1 000 so'm, farq chegirmaga | 12.19 |
| Dollar | 0.01 | — |

Yaxlitlash rejimi: `Decimal.ROUND_HALF_UP`.

### 3.4. Balans hech qachon saqlanmaydi

Mijoz qarzi, yetkazib beruvchi qarzi, xodim balansi, kassa qoldig'i — **hammasi yozuvlardan hisoblanadi** (2.2-invariant).

Tezlik uchun kerak bo'lsa — `MATERIALIZED VIEW` yoki keshlangan ustun, lekin u **manba emas, nusxa** va har doim qayta hisoblanishi mumkin bo'lishi kerak.

---

## 4. O'LCHOV BIRLIKLARI

### 4.1. Turlar

```ts
// lib/domain/birlik.ts
export type Santimetr    = number & { readonly [brand]: 'CM' };
export type Metr         = number & { readonly [brand]: 'M' };
export type KvadratMetr  = number & { readonly [brand]: 'M2' };
export type Dona         = number & { readonly [brand]: 'PCS' };

export const sm = (v: number): Santimetr => v as Santimetr;
export const m  = (v: number): Metr      => v as Metr;

export const smToM = (v: Santimetr): Metr => (v / 100) as Metr;
export const mToSm = (v: Metr): Santimetr => (v * 100) as Santimetr;
```

### 4.2. Saqlash qoidalari (AUDIT Q-01, Q-05)

| Nima | Bazada | Kodda | Ko'rsatishda |
|---|---|---|---|
| Buyurtma o'lchami (eni, bo'yi) | `INTEGER` sm | `Santimetr` | sm |
| Bo'lak o'lchami (eni × bo'yi) | `NUMERIC(8,2)` **metr** | `Metr` | `3.00 × 28.00 m` |
| Chiziqli material sarflashi | `NUMERIC(10,2)` **sm** | `Santimetr` | metr (`4.20 m`) |
| Mato sarflashi | `NUMERIC(10,4)` **kv.m** | `KvadratMetr` | kv.m |
| Kam qoldiq chegarasi | `NUMERIC(6,2)` **metr** | `Metr` | metr |
| Aksessuar | `INTEGER` dona | `Dona` | dona |

**Kv.m hech qachon kiritilmaydi** — u `eni × bo'yi` dan hisoblanadi (Q-05).

### 4.3. Formula natijasining birligi (AUDIT B-01)

Formula kirishi doim smda. Natija materialning **sarflash birligiga** qarab talqin qilinadi:

```ts
export function formulaNatijasi(
  xom: number,                        // formuladan chiqqan raqam
  sarflashBirligi: SarflashBirligi,
): Santimetr | KvadratMetr | Dona {
  switch (sarflashBirligi) {
    case 'KV_M':  return (xom / 10_000) as KvadratMetr;  // kv.sm → kv.m
    case 'SM':    return xom as Santimetr;               // shundayligicha
    case 'DONA':  return Math.ceil(xom) as Dona;         // yuqoriga yaxlitlanadi
  }
}
```

`MAYDON` o'zgaruvchisi formulaga **kv.sm da** beriladi (`ENI × BO'YI`).

Test kalkulyatori (TZ 4.8) natijani **birligi bilan** ko'rsatishi shart.

---

## 5. LOYIHA TUZILISHI

```
jalyuzi-erp/
├─ app/
│  ├─ (auth)/                      kirish sahifalari
│  ├─ (panel)/                     asosiy interfeys
│  │  ├─ sotuv/                    TZ 3
│  │  ├─ konstruktor/              TZ 4
│  │  ├─ material/                 TZ 5
│  │  ├─ mijozlar/                 TZ 6
│  │  ├─ ombor/                    TZ 7
│  │  ├─ buyurtmalar/              TZ 8
│  │  ├─ yetkazib-beruvchilar/     TZ 9
│  │  ├─ xodimlar/                 TZ 10
│  │  ├─ hisobotlar/               TZ 11
│  │  ├─ kassa/                    TZ 12
│  │  ├─ sozlamalar/               TZ 14
│  │  └─ qoshimcha/                TZ 15 (inventarizatsiya, xarid)
│  └─ api/
│     ├─ bot/                      Telegraf webhook
│     └─ cron/                     rejalashtirilgan vazifalar
│
├─ lib/
│  ├─ domain/                      ⚠️ SOF MANTIQ — bazaga tegmaydi
│  │  ├─ pul.ts  birlik.ts  narx.ts  formula.ts
│  │  ├─ kesish.ts  tannarx.ts  stavka.ts  kassa.ts
│  │  └─ invariant.ts              ishga tushishda tekshiruvlar
│  ├─ db/
│  │  ├─ schema/                   Drizzle jadvallar
│  │  ├─ migratsiya/
│  │  ├─ soorov/                   murakkab SQL (hisobotlar)
│  │  └─ index.ts
│  ├─ amal/                        ⚠️ TRANZAKSIYALAR shu yerda
│  │  ├─ buyurtma-yarat.ts
│  │  ├─ band-qil.ts
│  │  ├─ tugatdim.ts
│  │  └─ ...
│  ├─ ruxsat/                      TZ 14.6 matritsasi
│  └─ audit/                       TZ 2.4 jurnal
│
├─ bot/                            Telegraf mantiqi
├─ komponent/                      UI
├─ test/
└─ docs/  TZ-v1.15.md · AUDIT.md · TEXNIK-TALABLAR.md
```

### 5.1. Qatlamlar qoidasi

```
app/  →  lib/amal/  →  lib/db/
             ↓
        lib/domain/     ← bazaga TEGMAYDI, sof funksiya, test qilish oson
```

- `lib/domain/` — **hech qachon** bazani chaqirmaydi. Kiruvchi ma'lumot parametr bo'lib keladi
- `lib/amal/` — tranzaksiya ochadi, `domain` ni chaqiradi, natijani yozadi
- `app/` — faqat ko'rsatish va `amal` ni chaqirish. Biznes mantiqi bo'lmaydi

Bu qoida buzilsa, testlar yozib bo'lmaydi.

---

## 6. MA'LUMOTLAR BAZASI QOIDALARI

### 6.1. Nomlash

- Jadval va ustun — **`snake_case`, o'zbekcha**: `buyurtma_pozitsiya`, `band_qilingan_bolak_id`
- Kodda — `camelCase` (Drizzle o'zi o'giradi)
- Birinchi kalit — `id BIGSERIAL`
- Tashqi kalit — `<jadval>_id`

### 6.2. Turlar

| Nima | Tur |
|---|---|
| Pul | `NUMERIC(14,2)` |
| O'lcham (metr) | `NUMERIC(8,2)` |
| Maydon (kv.m) | `NUMERIC(10,4)` |
| O'lcham (sm) | `INTEGER` |
| Telegram ID | `BIGINT` |
| Sana va vaqt | `TIMESTAMPTZ` |
| Faqat sana | `DATE` |
| Holat / turlar | `TEXT` + `CHECK` (enum emas — o'zgartirish qiyin) |

**`FLOAT` va `REAL` taqiqlanadi.**

### 6.3. O'chirish yo'q

`DELETE` ishlatilmaydi. Har jadvalda:

```sql
faol       BOOLEAN     NOT NULL DEFAULT true
ochirildi  TIMESTAMPTZ
```

`ON DELETE CASCADE` **taqiqlanadi** — pul va ombor tarixi hech qachon yo'qolmasligi kerak.

### 6.4. Har jadvalda majburiy ustunlar

```sql
yaratildi     TIMESTAMPTZ NOT NULL DEFAULT now()
yaratdi_id    BIGINT      NOT NULL REFERENCES foydalanuvchi(id)
ozgartirildi  TIMESTAMPTZ
ozgartirdi_id BIGINT      REFERENCES foydalanuvchi(id)
```

### 6.5. Pul jadvallari — faqat qo'shiladi

`kassa_yozuv`, `mijoz_harakat`, `yetkazib_beruvchi_harakat`, `xodim_harakat`, `ombor_harakat` — bu jadvallarda **`UPDATE` va `DELETE` taqiqlanadi**.

Tuzatish — teskari yozuv (storno) qo'shish orqali. Baza darajasida trigger bilan himoyalanadi.

### 6.6. Snapshot ustunlari

TZ 2.3 bo'yicha o'tmish o'zgarmaydi. Snapshot ustunlari nomi `_snapshot` bilan tugaydi va `UPDATE` dan trigger bilan himoyalanadi:

| Ustun | Qachon yoziladi | Band |
|---|---|---|
| `narx_snapshot` | buyurtma saqlanganda | 3.9 |
| `kurs_snapshot` | buyurtma saqlanganda | 8.13 |
| `stavka_snapshot` | "Tugatdim" bosilganda | 10.10 |
| `tannarx_snapshot` | material yechilganda | 7.8 |
| `formula_snapshot` | pozitsiya tasdiqlanganda | 4.10 |

### 6.7. Indekslar — birinchi kundan

```sql
-- Ombor: band qilish algoritmi eng ko'p ishlatadigan so'rov
CREATE INDEX ON bolak (material_id, holat, eni) WHERE faol = true;

-- Buyurtma navbati
CREATE INDEX ON buyurtma_pozitsiya (holat, yaratildi);

-- Kassa hisoboti
CREATE INDEX ON kassa_yozuv (kassa_id, sana);

-- Balans hisoblari
CREATE INDEX ON mijoz_harakat (mijoz_id, sana);
CREATE INDEX ON xodim_harakat (xodim_id, sana);
```

### 6.8. Migratsiyalar

- Faqat `drizzle-kit` orqali, fayl sifatida, git da
- Qo'lda `ALTER TABLE` **taqiqlanadi**
- Har migratsiya orqaga qaytariladigan bo'lishi kerak
- Ishlab chiqarish bazasida migratsiya — **zaxira olgandan keyin**

---

## 7. TRANZAKSIYALAR VA LOCK

### 7.1. Bitta tranzaksiya bo'lishi shart bo'lgan amallar

| Amal | Ichida nima bo'ladi | Band |
|---|---|---|
| **Buyurtma tasdiqlash** | pozitsiyalar yaratiladi + bo'laklar band qilinadi + qarz yoziladi | 3.14, 7.3 |
| **"Tugatdim"** | bo'lak yechiladi + ostatka yaratiladi + haq hisoblanadi + status | 7.6, 10.10 |
| **Kirim hujjati** | bo'laklar yaratiladi + transport taqsimlanadi + qarz yoziladi | 7.9, 9.2 |
| **Kassa to'lovi** | kassa yozuvi + mijoz harakati + buyurtma to'lov qatori | 12.5 |
| **Storno** | teskari yozuv + bog'liq balanslar | 12.15, 7.12 |
| **Inventarizatsiya yakuni** | barcha bo'laklar tuzatiladi + xarajat yoziladi | 15.1 |
| **Qayta kesish** | eski band bo'shaydi + yangi band + material yechiladi | 8.17 |

Yarim bajarilish 2.1-invariantni buzadi.

### 7.2. Lock qoidalari

Bo'lak band qilishda (TZ 7.3, "ikki usta bitta bo'lakka da'vo qilsa"):

```ts
await db.transaction(async (tx) => {
  const bolak = await tx
    .select().from(bolakJadval)
    .where(/* mos bo'lak sharti */)
    .for('update', { skipLocked: true })   // ⚠️ majburiy
    .limit(1);

  if (!bolak) return { holat: 'MATERIAL_YOQ' };
  // band qo'yiladi
});
```

`FOR UPDATE SKIP LOCKED` — ikkinchi usta bloklanmaydi, keyingi mos bo'lakni oladi.

### 7.3. Tranzaksiya darajasi

Standart: `READ COMMITTED`.

`SERIALIZABLE` talab qilinadigan uch joy — ular takroriy urinish bilan o'raladi:
- kun yopish (12.17)
- inventarizatsiya yakuni (15.1)
- xarid ro'yxati hisobi (15.3)

### 7.4. Idempotentlik

Bot va tashqi chaqiruvlar takrorlanishi mumkin (TZ 13.10). Har o'zgartiruvchi amal `idempotency_key` qabul qiladi:

```sql
CREATE TABLE amal_kaliti (
  kalit      TEXT PRIMARY KEY,
  natija     JSONB NOT NULL,
  yaratildi  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Bir xil kalit ikkinchi marta kelsa — saqlangan natija qaytariladi, amal takrorlanmaydi.

---

## 8. AUTENTIFIKATSIYA

TZ da bu bo'lim yo'q. Quyidagicha belgilanadi:

| Nima | Qaror |
|---|---|
| Kirish | telefon raqami + parol |
| Parol saqlash | `argon2id` |
| Sessiya | JWT emas — **bazadagi sessiya jadvali** (darhol bekor qilish uchun) |
| Sessiya muddati | 30 kun, har so'rovda uzayadi |
| Bir vaqtda | bir foydalanuvchi bir necha qurilmada |
| Parolni tiklash | faqat admin qo'lda o'zgartiradi (SMS xarajati yo'q) |
| Usta | **saytga umuman kirmaydi** — faqat Telegram bot (Q-04 qattiq qoidasi) |
| Bot bog'lanishi | admin xodim kartochkasida Telegram ID ni kiritadi (13.1) |

Muvaffaqiyatsiz urinish: 5 martadan keyin 15 daqiqa bloklanadi.

---

## 9. RUXSATLAR

AUDIT Q-04 bo'yicha: **14.6 matritsasi yagona manba.**

### 9.1. Tuzilma

```sql
CREATE TABLE ruxsat (
  kod   TEXT PRIMARY KEY,   -- 'ombor.kirim.yarat'
  nom   TEXT NOT NULL,
  guruh TEXT NOT NULL       -- 'Ombor'
);

CREATE TABLE rol_ruxsat (
  rol_id    BIGINT REFERENCES rol(id),
  ruxsat_kod TEXT REFERENCES ruxsat(kod),
  PRIMARY KEY (rol_id, ruxsat_kod)
);
```

### 9.2. Qattiq qoidalar (matritsadan tashqari)

Uchtasi kodda, o'zgartirib bo'lmaydi:

1. Usta roli saytga kira olmaydi
2. Sotuvchi boshqa sotuvchining kassasini ko'ra olmaydi
3. Admin o'zining `sozlama.ozgartir` ruxsatini olib qo'ya olmaydi

### 9.3. Boshlang'ich preset

TZ 11.10 va 12.14 jadvallari **seed** sifatida yuklanadi — ular qoida emas, boshlang'ich qiymat.

### 9.4. Tekshiruv har qatlamda

```ts
// ❌ Faqat interfeysda yashirish yetarli emas
{ruxsatBor('kassa.chiqim') && <Tugma />}

// ✅ Server tomonda ham majburiy
export async function kassaChiqim(input) {
  await ruxsatTalab('kassa.chiqim');
  // ...
}
```

---

## 10. AUDIT JURNALI

TZ 2.4 + AUDIT U-08 (ro'yxat to'ldirildi).

```sql
CREATE TABLE audit_jurnal (
  id             BIGSERIAL PRIMARY KEY,
  sana           TIMESTAMPTZ NOT NULL DEFAULT now(),
  foydalanuvchi_id BIGINT NOT NULL,
  amal           TEXT NOT NULL,      -- 'STORNO', 'QOLDA_TUZATISH', ...
  obyekt_turi    TEXT NOT NULL,      -- 'buyurtma', 'kassa_yozuv'
  obyekt_id      BIGINT NOT NULL,
  eski_qiymat    JSONB,
  yangi_qiymat   JSONB,
  izoh           TEXT,
  ip             TEXT
);
```

**Teskari qoida** (U-08 tavsiyasi): quyidagi turdagi **har qanday** amal jurnalga tushadi —
storno · qo'lda korrektsiya · chegaradan oshish · hisobdan chiqarish · sozlama o'zgarishi · ruxsat o'zgarishi.

Jurnal yozuvi **o'sha tranzaksiya ichida** yoziladi.

---

## 11. VALIDATSIYA

Zod sxemasi **bir marta** yoziladi, uch joyda ishlatiladi: forma, API, bot.

```ts
// lib/sxema/buyurtma.ts
export const pozitsiyaSxema = z.object({
  mahsulotTuriId: z.number().int().positive(),
  eni:  z.number().int().min(10).max(600),    // sm
  boyi: z.number().int().min(10).max(600),    // sm
  soni: z.number().int().min(1).max(999),
});
```

Server **hech qachon** mijoz tomonidagi tekshiruvga ishonmaydi — API da qayta tekshiriladi.

---

## 12. XATOLAR

### 12.1. Ikki turi

```ts
// Biznes xatosi — foydalanuvchiga ko'rsatiladi
export class BiznesXato extends Error {
  constructor(public kod: string, message: string) { super(message); }
}

throw new BiznesXato('MATERIAL_YOQ', 'Bu matodan mos bo\'lak topilmadi');
```

Texnik xato (baza, tarmoq) — foydalanuvchiga umumiy xabar, batafsili logga.

### 12.2. Xato kodlari

Har biznes xatosi **kodga** ega bo'ladi va u TZ bandiga bog'lanadi:

| Kod | Ma'nosi | Band |
|---|---|---|
| `MATERIAL_YOQ` | mos bo'lak topilmadi | 7.6, 8.12 |
| `LIMIT_OSHDI` | mijoz qarz limiti | 6.4 |
| `CHEGIRMA_LIMITI` | chegirma chegaradan oshdi | 3.11 |
| `STAVKA_YOQ` | mahsulot turiga stavka belgilanmagan | 10.12 |
| `KUN_YOPILGAN` | yopilgan kunga yozuv | 12.17 |
| `BOLAK_BAND` | bo'lak boshqa pozitsiyaga band | 7.3 |

---

## 13. CRON (rejalashtirilgan vazifalar)

Oddiy API yo'llari qilib yoziladi — kim chaqirishi muhim emas (§2.3):

| Yo'l | Vaqt | Nima qiladi | Band |
|---|---|---|---|
| `/api/cron/zaxira` | 03:00 | `pg_dump` + Telegram | §17 |
| `/api/cron/band-muddati` | 04:00 | 30 kundan oshgan band — adminga | 7.3, EC-OMB-18 |
| `/api/cron/kun-eslatma` | 20:00 | kassani yopmaganlarga eslatma | 12.17 |
| `/api/cron/muddat-nazorat` | 09:00 | muddati o'tgan buyurtmalar | 8.16 |
| `/api/cron/qarz-eslatma` | 10:00 | mijozga qarz eslatmasi | 13.6 |
| `/api/cron/kam-qoldiq` | 08:00 | chegaradan past materiallar | 5.5, 14.7 |

Himoya: har chaqiruv `CRON_SECRET` sarlavhasi bilan keladi.

Bepul davrda chaqiruvchi — `cron-job.org`. Serverga o'tganda — `crontab`. **Kod o'zgarmaydi.**

---

## 14. TESTLAR

### 14.1. Majburiy testlar — TZ dagi kanonik raqamlar

Bular birinchi haftada yoziladi:

| Test | Kutilgan natija | Band |
|---|---|---|
| Kanonik buyurtma hisobi | `678 400` | 3.8 |
| Slot formulalari | `0.66 + 0.66 + 2.64 = 3.96` | 3.5 |
| Transport taqsimoti | `1 504 000 + 238 000 + 258 000 = 2 000 000` | 7.9 |
| FIFO brak bilan | `660 000 / 10 = 66 000` | 7.9 |
| Kesim uch qatori | `3.60 = 1.20 + 2.40 + 0` | 7.6 |
| Kurs farqi | `39 600 000 − 37 950 000 = 1 650 000` | 9.6 |
| Ustama eroziyasi | `(120 000 − 87 333) / 87 333 = 37.4%` | 11.7.5 |
| Kun yopish | `850 000 + 4 200 000 − 1 850 000 = 3 200 000` | 12.17 |
| Usta balansi | `2 180 000 − 940 000 − 100 000 = 1 140 000` | 13.8 (Z-12) |
| Karniz narxi | `210 sm → 4.20 m × 35 000 = 147 000` | Q-01 |

### 14.2. Qamrov talabi

| Qatlam | Talab |
|---|---|
| `lib/domain/` | **90%+** — bu sof mantiq, testi oson |
| `lib/amal/` | tranzaksiya chegaralari, har biri kamida 1 test |
| Interfeys | asosiy oqimlar Playwright da |

### 14.3. Edge case testlari

TZ 16-bo'limdagi 126 edge case dan **kamida KRITIK va JIDDIY belgilanganlari** test bo'lib yoziladi. Har test nomida kod bo'ladi:

```ts
test('EC-OMB-18: band qilingan bo\'lak 30 kun qimirlamadi', ...)
```

---

## 15. UNUMDORLIK

Loyiha hajmi kichik, shuning uchun talablar oddiy:

| O'lchov | Talab |
|---|---|
| Sahifa ochilishi | < 1 sek |
| Buyurtma saqlash | < 2 sek |
| Oddiy hisobot | < 3 sek |
| Yillik foyda-zarar | < 10 sek |
| Bir vaqtda foydalanuvchi | 20 gacha |

Optimizatsiya **oldindan qilinmaydi**. Sekin bo'lgan joy o'lchanadi, keyin tuzatiladi.

Ma'lumot hajmi taxmini (3 yil): ~50 000 buyurtma pozitsiya, ~200 000 kassa yozuvi, ~30 000 bo'lak. Postgres uchun bu kichik hajm.

---

## 16. XAVFSIZLIK

| Nima | Qaror |
|---|---|
| Parol | `argon2id`, hech qachon logga tushmaydi |
| SQL injection | Drizzle parametrlashtiradi; toza SQL da faqat parametr |
| Fayl yuklash | tur va hajm tekshiriladi, bajariladigan fayl taqiqlanadi |
| Sirlar | faqat `.env`, git ga tushmaydi |
| HTTPS | majburiy |
| Bot webhook | `secret_token` bilan tekshiriladi |
| Baza | tashqi IP dan ochiq emas |
| Pul amallari | har biri audit jurnalida |

---

## 17. ZAXIRA NUSXA

### 17.1. Uch qatlam

| Qatlam | Qayerda | Chastota |
|---|---|---|
| 1 | Telegram (yopiq kanal) | kunlik |
| 2 | Tashqi omborxona (Backblaze B2 / Storage Box) | haftalik |
| 3 | Server snapshot | kunlik (provayder) |

### 17.2. Skript talablari

```bash
pg_dump $DATABASE_URL | gzip > /tmp/erp-$(date +%F).sql.gz
```

Majburiy shartlar:
- Fayl hajmi tekshiriladi (10 KB dan kichik bo'lsa — xato xabari)
- Muvaffaqiyatsiz bo'lsa adminga Telegram xabar
- 30 kundan eski nusxalar o'chiriladi

### 17.3. Tiklashni sinash

**Oyiga bir marta** zaxira alohida bazaga tiklanadi va kanonik testlar (§14.1) o'sha bazada ishga tushiriladi.

Tekshirilmagan zaxira — zaxira emas.

---

## 18. MUHIT O'ZGARUVCHILARI

```
DATABASE_URL=
AUTH_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=
CRON_SECRET=
BACKUP_CHANNEL_ID=
TZ=Asia/Tashkent
```

Barchasi ishga tushishda Zod bilan tekshiriladi — biri yetishmasa dastur **ishga tushmaydi**.

---

## 19. VAQT VA TIL

| Nima | Qaror |
|---|---|
| Vaqt zonasi | `Asia/Tashkent` (UTC+5) |
| Bazada saqlash | `TIMESTAMPTZ`, UTC |
| Ish kuni chegarasi | 00:00 dan 23:59 gacha, mahalliy vaqt |
| Interfeys tili | **o'zbek (lotin)** |
| Matnlar | `lib/matn/uz.ts` — kodga yozilmaydi |
| Sana formati | `DD.MM.YYYY` |
| Son formati | `1 234 567.89` (probel bilan) |

Ikkinchi til hozir qo'shilmaydi, lekin matnlar alohida faylda turgani uchun keyin qo'shish oson.

---

## 20. TZ DA YO'Q, LEKIN BELGILANISHI SHART

| Mavzu | Qaror |
|---|---|
| **Bitta ombor** | Tizim **bitta ombor va bitta filial** uchun qurilади. Jadvallarda `ombor_id` **qo'yilmaydi** — keyin kerak bo'lsa migratsiya bilan qo'shiladi |
| **Chop etish** | Brauzer chop etishi (`window.print` + CSS). Termo printer birinchi bosqichda yo'q |
| **Boshlang'ich yuklash** | CSV import: material, mijoz, yetkazib beruvchi, boshlang'ich qoldiq |
| **Excel eksport** | Har hisobotda tugma, `xlsx` kutubxonasi |
| **Rasm saqlash** | Serverdagi `/uploads` papka, zaxiraga kiradi |
| **Qurilma** | Sayt — kompyuter (1280px+). Omborchi ham saytdan ishlaydi (kirim, hisobdan chiqarish, inventarizatsiya — 7.1, 15.1). **Faqat usta** botdan ishlaydi |
| **Brauzer** | Chrome, Edge, Firefox — oxirgi 2 versiya |
| **Soliq hujjatlari** | Birinchi bosqichda yo'q |

---

## 21. QURISH TARTIBI

| № | Bosqich | Nima kiradi | Muddat |
|---|---|---|---|
| 0 | **Poydevor** | Loyiha, baza, `pul.ts`, `birlik.ts`, kanonik testlar | 1 hafta |
| 1 | **Kirish, ruxsat, filial asosi** | Auth, rollar, matritsa + filial qamrovi, `filial` jadvali, audit jurnali | 2 hafta |
| 2 | **Spravochniklar** | Material (5), Konstruktor (4), Mijozlar (6), Yetkazib beruvchilar (9) + filial narx istisnosi | 3 hafta |
| 3 | **Ombor** | Bo'laklar, kirim, band qilish, kesish algoritmi (7) + filial qoldig'i (20.6) | 4 hafta |
| 4 | **Sotuv va buyurtma** | 3, 8 + 8.17, 3.15 + filial marshruti va uch yangi status (20.4, 20.5) | 5 hafta |
| 5 | **Xodimlar va kassa** | 10, 12 + filial kassalari, kun yopish vaqti (20.10) | 3 hafta |
| 6 | **Filiallararo** | Material ko'chirish, jo'natma, qarz, o'zaro balans, transport (20.7, 20.8, 22) | 3 hafta |
| 7 | **Bot** | 13 — mijoz, usta, admin panellari + filial tanlash | 2 hafta |
| 8 | **Hisobotlar va rejalar** | 11 (27 hisobot) + 21 (rejalar) + filial kesimlari va taqqoslash | 3.5 hafta |
| 9 | **Qo'shimcha** | 15 — inventarizatsiya, xarid ro'yxati, kunlik varaqa | 1.5 hafta |
| 10 | **Sozlash va topshirish** | Excel import, sinov, o'qitish, zaxira | 2 hafta |

**Jami: ~30 hafta (7 oy)** — bir kishi to'liq ish vaqtida.

### 21.1. Nega filial alohida bosqich emas

Ko'p filial **butun tizimga singib ketadi** — 24 bandga tegadi (20.15).
Uni keyinroq qo'shish har modulni qayta ochishni talab qiladi.

Shuning uchun har bosqich **filial bilan birga** quriladi. Yagona alohida
bosqich — 6-si: ko'chirish, jo'natma va qarz mexanizmi. Ular mustaqil
funksiya bo'lgani uchun kassa tayyor bo'lgandan keyin quriladi.

### 21.2. Tartib majburiy

- **Filial asosi 1-bosqichda** — undan keyin har jadval `filial_id` bilan tug'iladi
- **Ombor sotuvdan oldin** — sotuv band qilishga tayanadi
- **Kassa filiallararodan oldin** — qarz to'lovi kassa amali
- **Hisobotlar oxirida** — ular hamma ma'lumotga tayanadi

## 22. TAYYOR DEB HISOBLASH MEZONI

Bosqich tugadi deyish uchun:

- [ ] TZ dagi tegishli bandlar bajarilgan
- [ ] Kanonik raqamlar testi o'tadi
- [ ] KRITIK va JIDDIY edge case'lar test bilan qoplangan
- [ ] Ruxsatlar server tomonda tekshiriladi
- [ ] Pul amallari tranzaksiyada
- [ ] Audit jurnaliga tushadi
- [ ] TZ o'zgargan bo'lsa hujjat yangilangan

---

*Hujjat oxiri. Versiya 1.0.*


---

# QISM 2 — FUNKSIONAL TEXNIK TOPSHIRIQ

> Nima quriladi. Asosiy matn (1–19) tuzatilmagan — QISM 0 ni tekshiring.

---

# JALYUZI BOSHQARUV TIZIMI — TEXNIK TOPSHIRIQ

**Versiya:** 1.14
**Sana:** 13.08.2026
**Holati:** barcha modul yopilgan, ochiq savol qolmadi. Keyingi bosqichga qoldirilganlar 18.2-bandda

---

## 0. HUJJAT HAQIDA

### 0.1. Bu hujjat nima

Bu — jalyuzi ishlab chiqarish va sotish biznesi uchun boshqaruv tizimining texnik topshirig'i. Hujjat bo'lim-ma-bo'lim to'ldirib boriladi: har bir bo'lim muhokama qilinadi, kelishiladi, maketi chiziladi, keyin shu yerga yoziladi va yopiladi.

### 0.2. Bo'limlar holati

| № | Bo'lim | Holati | Ekranlar |
|---|---|---|---|
| 3 | Sotuv (yangi buyurtma) | **YOPILGAN** | 1 |
| 4 | Mahsulot turi konstruktori | **YOPILGAN** | 1 |
| 5 | Material qo'shish | **YOPILGAN** | 1 |
| 6 | Mijozlar | **YOPILGAN** | 4 |
| 7 | Ombor | **YOPILGAN** | 6 |
| 8 | Buyurtma hayoti | **YOPILGAN** | 3 |
| 9 | Yetkazib beruvchilar | **YOPILGAN** | 4 |
| 10 | Xodimlar va ish haqi | **YOPILGAN** | 5 |
| 11 | Hisobotlar va dashboard | **YOPILGAN** | 1 + 22 hisobot |
| 12 | Kassa | **YOPILGAN** | 7 |
| 13 | Telegram bot | **YOPILGAN** | 3 panel |
| 14 | Sozlamalar va ruxsatlar | **YOPILGAN** | 7 |
| 15 | Qo'shimcha modullar | **YOPILGAN** | 4 |

**Barcha modul yopildi.** 44 ta ekran va 3 bot paneli.

### 0.3. Hujjatni qanday o'qish kerak

- **Qalin** yozilgan qoidalar — o'zgartirib bo'lmaydigan qarorlar. Ular buzilsa boshqa bo'limlar ishlamay qoladi.
- `[OCHIQ]` belgisi — hali kelishilmagan joy. Dasturchi bu joyni o'zi hal qilmaydi, so'raydi.
- Har bo'lim oxirida **edge case** ro'yxati bor. Ular asosiy matndan kam ahamiyatli emas — aksincha, aynan o'sha joylarda tizim buziladi.
- 9-bo'limda avvalgi versiyaga nisbatan nima o'zgargani sanalgan. Eski hujjat bo'yicha ish boshlagan bo'lsangiz, avval o'sha ro'yxatni ko'ring.

---

## 1. LOYIHA KONTEKSTI

### 1.1. Biznes

Jalyuzi (parda) ishlab chiqarish va sotish. Har bir buyurtma individual o'lchamda tayyorlanadi — omborda tayyor mahsulot turmaydi, faqat xomashyo.

Bugungi mahsulot turlari: Rollo, Kombo, Plisse, Dikke, Zashitka. Bu ro'yxat qat'iy emas — admin dasturchisiz yangi tur qo'sha oladi (4-bo'lim).

### 1.2. Foydalanuvchi rollari

| Rol | Nima qiladi |
|---|---|
| **Admin** | Hamma narsaga kirish. Narx, mahsulot turi, xodim, hisobot, storno. |
| **Sotuvchi** | Buyurtma yaratadi, mijoz qo'shadi, kassa bilan ishlaydi. |
| **Omborchi** | Kirim, qoldiq, hisobdan chiqarish. |
| **Ishlab chiqaruvchi (usta)** | Faqat Telegram bot orqali. O'z ishini ko'radi, "Tugatdim" bosadi. |

### 1.3. Valyuta

Tizim **ikki valyutada** ishlaydi: so'm va dollar. Kurs sozlamalarda turadi va qo'lda yangilanadi.

**So'm va dollar hech qachon bitta summaga qo'shilmaydi.** Ular alohida hisoblanadi, alohida ko'rsatiladi, alohida to'lanadi.

Yagona istisno — mijozning qarz limitini tekshirish (6.4-band). U yerda dollar qarzi joriy kursda so'mga o'girilib qo'shiladi.

---

## 2. UMUMIY INVARIANTLAR

Bu qoidalar butun tizimga tegishli. Har qanday yangi bo'lim ularga bo'ysunadi.

### 2.1. Ma'lumot yo'qolmaydi

- **Hech narsa o'chirilmaydi.** Xato yozuv storno qilinadi — teskari yozuv qo'shiladi, asli joyida qoladi.
- **Harakati bo'lmagan yozuv** (hech qachon ishlatilmagan material, buyurtmasiz mijoz) butunlay o'chiriladi. Bu xato kiritilgan qatorni tozalash uchun.
- **Harakati bor yozuv** o'chirilmaydi, faqat **nofaol** qilinadi. Nofaol yozuv yangi ishda ko'rinmaydi, lekin eski yozuvlarda ishlashda davom etadi.

### 2.2. Balans saqlanmaydi

Mijozning qarzi, ombordagi qoldiq, kassadagi pul — bularning hech biri alohida maydonda saqlanmaydi. Ularning har biri **harakatlar yig'indisi** sifatida hisoblanadi.

Shundan kelib chiqadi: tizimga o'tishda eski qarz va eski qoldiq ham **harakat sifatida** yozilishi shart ("Boshlang'ich qoldiq"). Aks holda balans nolga teng chiqadi.

### 2.3. O'tmish o'zgarmaydi

Saqlangan buyurtma o'z paytidagi tarkib, o'lcham va narx bilan qotib qoladi. Keyinchalik mahsulot turi tahrirlansa, mato narxi o'zgarsa, sarflash formulasi almashtirilsa — **eski buyurtmalar o'zgarmaydi**.

Sabab: aks holda o'tgan oyning hisoboti bugun o'zgarib ketadi.

### 2.4. Audit jurnali

Quyidagi amallar jurnalda qayd etiladi va o'chirilmaydi: storno, narx qo'lda o'zgartirilishi, chegirma limitidan oshish, qarzni hisobdan chiqarish, ombordan hisobdan chiqarish, qo'lda korrektsiya, ruxsat o'zgarishi, mahsulot turi tahriri, kurs o'zgarishi, material birligi o'zgarishi, mijoz nofaol qilinishi.

Har yozuvda: sana-vaqt, kim, nima, eski qiymat, yangi qiymat, sabab.

### 2.5. Ombor qoldig'i

**Avtomatik operatsiyalarda** ("Tugatdim", kesish) qoldiq hech qachon manfiyga tushmaydi. Buni atomar lock kafolatlaydi.

**Qo'lda amallarda** (brakni bekor qilish, korrektsiya) manfiy qoldiq vaqtincha paydo bo'lishi mumkin. U qizil bilan belgilanadi va admin tuzatgunicha shunday turadi.

> **v1.13 ga nisbatan o'zgarish.** Avval "qoldiq hech qachon manfiyga tushmasligi kerak" deb yozilgan edi. Endi bu talab faqat avtomatik operatsiyalarga tegishli — sabab 7.6-bandda.

---

## 3. SOTUV EKRANI (YANGI BUYURTMA)

### 3.1. Ekranning vazifasi

Sotuvchi mijoz oldida turib buyurtma rasmiylashtiradi. Ekran bitta — boshqa sahifaga o'tish shart emas.

### 3.2. Mahsulot turi

Yuqorida barcha faol mahsulot turlari qator bo'lib turadi. Admin sozlamalardan yangi tur qo'shsa — **avtomatik shu qatorga qo'shiladi**, dasturchiga murojaat qilish shart emas.

### 3.3. Mato slotlari

Mahsulot turi tanlangach, o'sha turning **slotlari** qator bo'lib ochiladi. Slotlar konstruktorda belgilanadi (4.4-band).

Misol:

| Tur | Slotlar |
|---|---|
| Kombo | Asosiy mato |
| Rollo | Old mato (to'r) · Orqa mato (zashitka) |
| Dikke | Oq mato (chet) · Ko'k mato (chet) · Ko'k mato (o'rta) |

**Har slot qatorida faqat o'sha slotga bog'langan matolar chiqadi.** Ya'ni "Orqa mato" qatorida to'r matolar ko'rinmaydi va sotuvchi adashib qo'ya olmaydi.

Har mato yonida qoldiq ko'rinadi. "Katalog" tugmasi rasmli katalogni ochadi — mijozga ekranni burib ko'rsatish uchun.

### 3.4. O'lcham

Eni va bo'yi **santimetrda** kiritiladi (210 × 140) — mijoz va usta shunday gapiradi. Tizim kvadrat metrga o'zi o'giradi.

### 3.5. Sarflash — har slot alohida

Har slot uchun sarflash formulasi bo'yicha miqdor hisoblanadi. Formula konstruktorda yozilgan (4.5-band).

Dikke, 180 × 220, CHET = 30 sm:

| Slot | Formula | Hisoblangan |
|---|---|---|
| Oq mato (chet) | `CHET × BO'YI` | 0.66 kv.m |
| Ko'k mato (chet) | `CHET × BO'YI` | 0.66 kv.m |
| Ko'k mato (o'rta) | `(ENI − 2×CHET) × BO'YI` | 2.64 kv.m |

**Har slot qatorida tahrirlanadigan input bo'ladi.** Sotuvchi hisoblangan sonni ko'radi va yoniga o'zi kiritadi:

```
Oq mato (chet)      0.66  →  [1.00]  × 85 000
Ko'k mato (chet)    0.66  →  [2.00]  × 120 000
Ko'k mato (o'rta)   2.64  →  [1.00]  × 120 000
```

**Umumiy maydon tahrirlanmaydi** — u faqat yig'indi bo'lib ko'rinadi. Aks holda ikki joydan bir narsa o'zgartiriladi va qaysi biri ustun ekani noaniq bo'lib qoladi.

### 3.6. Tuzatilgan son nimaga ta'sir qiladi

| Nimaga | Qaysi raqam |
|---|---|
| **Narx** | Sotuvchi kiritgan son |
| **Ombordan yechish** | Hisoblangan kesim |
| **Ustaga ketadigan o'lcham** | Original o'lcham (210 × 140 sm) |

Ya'ni sotuvchining tuzatishi faqat mijoz bilan kelishilgan narxga tegadi. Ombor haqiqiy kesimni yechadi, usta esa original o'lchamda kesadi.

### 3.7. Aksessuarlar

Mahsulot turi tanlangan zahoti komplekt avtomatik ro'yxatga tushadi — nomi va soni bilan. Komplekt konstruktorda belgilanadi (4.6-band).

Soni **statik son** yoki **formula** bo'lishi mumkin (`ENI × 2`). Formulali bo'lsa, o'lcham o'zgarganda qayta hisoblanadi.

Sotuvchi buni erkin o'zgartira oladi:
- sonini o'zgartirish
- narxini o'zgartirish
- keraksizini o'chirish
- turini almashtirish — dropdownda **faqat o'sha almashtirish guruhidagi** variantlar chiqadi
- komplektda yo'q aksessuarni qo'shish

**Sotuvchi sonini qo'lda tuzatgan bo'lsa — formula uni ustidan yozmaydi.** O'lcham keyin o'zgartirilsa ham qo'lda kiritilgan son saqlanadi.

Aksessuarning **o'lchov birligi** material qo'shishda belgilanadi (dona / metr / sm). Karniz metrda kirim qilinadi va metrda sarflanadi, shuning uchun ustunda `4.2 m` deb birligi bilan ko'rinadi.

### 3.8. Pozitsiya narxi

```
pozitsiya = Σ(slot sarflashi × o'sha slot matosining narxi)
          + Σ(aksessuar soni × narxi)
          + xizmat haqi
```

**Har slot o'z narxi bilan hisoblanadi.** Umumiy maydonni bitta mato narxiga ko'paytirish **noto'g'ri** — Dikke'da uch xil mato uch xil narxda.

Kanonik misol — Rollo 210 × 140:

```
old mato    120 000 × 2.94  =  352 800
orqa mato    90 000 × 2.94  =  264 600
mexanizm     45 000 × 1     =   45 000
kronshteyn    5 000 × 2     =   10 000
brelok        3 000 × 2     =    6 000
                               ────────
                                678 400
```

Xizmat haqi bu misolda kiritilmagan (ixtiyoriy maydon — 4.7-band).

Narx inputda chiqadi va **o'zgartirish mumkin**. So'mda ham, dollarda ham ko'rish va kiritish mumkin.

### 3.9. Savat

"Savatga qo'shish" bosilsa pozitsiya buyurtmaga tushadi. Bitta buyurtmada bir nechta xona va mahsulot bo'lishi mumkin (Rollo + Kombo + Plisse birga).

Buyurtma narxi — savatdagi pozitsiyalar yig'indisi.

### 3.10. Mijoz

Mijoz tanlash **majburiy emas** — ko'chadagi tasodifiy xaridor uchun mijozsiz sotish mumkin.

Qidiruv ism yoki telefon bo'yicha ishlaydi. Topilmasa — o'sha yerning o'zidan yangi mijoz qo'shiladi (qisqa forma: ism, telefon, turi).

Mijoz tanlangach uning **qarzi, limiti va offseti** darhol ko'rinadi va narx qayta hisoblanadi.

**Mahsulot qarzga berilayotgan bo'lsa — mijoz tanlash majburiy bo'lib qoladi.** Tizim qarzni kimdan undirishni bilishi kerak.

### 3.11. Jami narx va chegirma

Mijoz bilan kelishilgan narx hisoblangan narxdan farq qilishi mumkin. Jami summa **erkin o'zgartiriladi**, tizim farqni o'zi hisoblab izoh yozadi:

- summa kamaytirilsa → "chegirma 26 400 so'm"
- summa oshirilsa → "qo'shimcha haq"

Chegirma belgilangan limitdan oshsa — ogohlantirish chiqadi, lekin sotuvchi davom eta oladi. Bu harakat jurnalga tushadi.

### 3.12. To'lov

Bir nechta usul birga: naqd + karta. Har qator — usul, summa, valyuta. Har valyuta va usul kassada alohida hisoblanadi.

To'lov to'liq bo'lmasa, qolgan summa qarzga yoziladi va yangi qarz ko'rsatiladi.

### 3.13. Tayyorlik sanasi

**Ixtiyoriy maydon.** Sotuvchi xohlasa yozadi (mijozga muddat aytish uchun), xohlamasa bo'sh qoldiradi.

> Eski TZ 5.4-bandda "majburiy" deb yozilgan edi — u qoida **bekor qilindi**.

**Oqibati:** sanasi kiritilmagan buyurtma "kechikkan buyurtmalar" hisobotiga (11.8.3), admin paneldagi qizil belgiga va kechikish bildirishnomasiga **tushmaydi**. Ular umuman kechikmagan hisoblanadi.

Hisobotda alohida ustun bo'ladi: *"sanasi kiritilmagan — 14 ta"*. Shunda ular ko'zdan yo'qolmaydi.

### 3.14. Saqlash

Chek chop etiladi, buyurtma admin tasdig'iga jo'naydi.

---

## 4. MAHSULOT TURI KONSTRUKTORI

### 4.1. Vazifasi

Admin dasturchisiz yangi mahsulot turi yarata oladi. Yaratilgan tur darhol sotuvda ishlay boshlaydi.

### 4.2. Asosiy ma'lumot

Nomi, rasm (katalog uchun), qisqa tavsif, sotuv ekranidagi tartib raqami, holati.

**O'chirish tugmasi yo'q.** Keraksiz tur nofaol qilinadi — sotuvda chiqmaydi, eski buyurtmalar joyida qoladi.

### 4.3. Mahsulot parametrlari

Formulalarda ishlatiladigan nomlangan qiymatlar. Misol: Dikke uchun `CHET = 30` sm.

Qiymat bitta joydan o'zgartiriladi va butun hisob qayta ishlaydi.

**Formulada ishlatilayotgan parametrni o'chirish bloklanadi** — sababi ko'rsatiladi ("`CHET` 2 ta formulada ishlatilmoqda").

### 4.4. Mato slotlari

Har mahsulotda nechta mato ishlatilishi shu yerda belgilanadi. Har slotda: **nomi**, **sarflash formulasi**, **majburiy/ixtiyoriy**.

Material omborga kiritilayotganda **aynan shu slotga** bog'lanadi — mahsulot turiga emas. Shuning uchun sotuvda har slot qatorida faqat o'ziga tegishli matolar chiqadi.

**Bog'langan materiali bor slotni o'chirish bloklanadi** — avval materiallarni boshqa slotga ko'chirish kerak.

### 4.5. Formula

Ishlatiladi: `ENI`, `BO'YI`, `MAYDON`, `SONI` va qo'shilgan parametrlar. Amallar: `+ − × /` va qavslar.

Misollar:

```
o'rta qism:     (ENI − 2×CHET) × BO'YI
Plisse matosi:  MAYDON × 1.5
stepler lenta:  ENI × 2
```

Formula kiritilganda darhol tekshiriladi — xato bo'lsa saqlanmaydi.

### 4.6. Aksessuar komplekti

Jadval: aksessuar / soni yoki formula / majburiy yoki ixtiyoriy.

Ixtiyoriy aksessuar sotuvda avtomatik kelmaydi — mijoz so'ragandagina qo'shiladi.

**Bu jadval material kartochkasidagi bog'lanish bilan bitta ma'lumot** — ikki ekrandan tahrirlanadi, ikki nusxa saqlanmaydi.

### 4.7. Xizmat haqi

Har mahsulotga qo'shiladigan qat'iy summa (ishlov yoki o'rnatish haqi).

**Ixtiyoriy maydon.** Bo'sh qoldirilsa narxga hech narsa qo'shilmaydi.

### 4.8. Test kalkulyatori

**Saqlashdan oldin** o'lcham kiritib tekshiriladi: qaysi materialdan qancha ketishi va narx qancha chiqishi darhol ko'rinadi.

Formuladagi xato shu yerda ko'rinadi — mijozga sotgandan keyin emas.

### 4.9. Stavka ogohlantirishi

Yangi tur yaratilgach ishlab chiqaruvchilarning bu turga stavkasi 0 bo'lib qoladi. Tizim ogohlantiradi va stavka belgilash havolasini beradi — aks holda usta bu mahsulotni yasab haq olmaydi.

### 4.10. Keyin tahrirlash

Tur tahrirlansa eski buyurtmalar o'zgarmaydi (2.3-invariant).

**Tasdiqlangan, lekin hali kesilmagan buyurtmalar ham eski formula bo'yicha yechiladi.** Sabab: narx eski formula bo'yicha hisoblangan, sarf yangisi bo'yicha bo'lsa — ikkisi bir-biriga mos kelmaydi.

---

## 5. MATERIAL QO'SHISH

### 5.1. Kategoriyalar

Mato, aksessuar, karniz. Kategoriya tanlanganda kerakli maydonlar ochiladi.

### 5.2. Hisob turlari

To'rt xil: **rulon**, **kv.metr**, **chiziqli**, **dona**.

> **v1.13 ga nisbatan tuzatish.** Eski hujjatning 2.6.5-bandida faqat ikkitasi ("RULON yoki KV.METR") sanalgan edi.

### 5.3. Birliklar va konversiya

Ikkita alohida birlik:

- **Kirim birligi** — ombor qanday qabul qiladi (rulon, shtanga, quti, dona)
- **Sarflash birligi** — buyurtmada qanday yechiladi (kv.m, metr, sm, dona)

Ikkalasi har xil bo'lsa — **konversiya koeffitsienti** kiritiladi. Misol: karniz kirimda "shtanga", sarflashda "metr", koeffitsient 3.

**Barcha uzunlik o'lchovi — santimetrda.** Sotuv ekranida ham, konstruktorda ham, sarflash formulasida ham.

Karniz kirimda "shtanga" bo'lib keladi, sarflashda **sm**. Koeffitsient: 1 shtanga = 300 sm.

> Metr va sm aralashsa formulada xato chiqadi: `ENI × 1` da ENI smda, natija esa metrda kutilardi.

**Qoldiq 0 dan katta bo'lsa** hisob turi va birliklar o'zgartirilmaydi — tugma bloklanadi va sabab ko'rsatiladi.

### 5.4. Narx

**Tannarx qo'lda kiritilmaydi** — har kirim hujjatidan avtomatik keladi. Har kirim o'z narxini saqlaydi.

Istisno: tizim birinchi marta ishga tushirilganda boshlang'ich tannarx import orqali kiritiladi. Bu holda **har rulonga alohida narx** beriladi.

**Sotuv narxi** — mato uchun 1 kv.m, karniz uchun 1 metr, aksessuar uchun 1 dona.

**Minimal ustama chegarasi.** Ustama = `(sotuv narxi − tannarx) ÷ tannarx`.

Sozlamalarda **umumiy standart** turadi (masalan 30%) va barcha materialga qo'llanadi. Material kartochkasida maydon bo'sh qolsa standart ishlaydi; boshqacha kerak bo'lsa — o'sha yerda alohida yoziladi.

Chegaradan past tushsa kirimda ogohlantirish chiqadi (7.8).

> Tannarx **o'z-o'zidan** o'sadi — yetkazib beruvchi narx ko'taradi. Sotuv narxi esa faqat admin qo'l bilan o'zgartirganda o'zgaradi. Ya'ni ustama jimgina yeyilib boradi va bu ogohlantirishsiz sezilmaydi.

### 5.5. Chegaralar

**Kam qoldiq chegarasi** — barcha hisob turlariga qo'llanadi, materialning o'z birligida. Qoldiq shundan past tushsa ogohlantirish chiqadi.

**Ostatka chegaralari** — faqat rulon va chiziqli uchun, **eni bo'yicha, metrda**. Ikkita chegara belgilanadi va ular uchta daraja beradi (7.5):

| Maydon | Standart | Ma'nosi |
|---|---|---|
| **Yaroqsiz chegarasi** | 0.5 m | Bundan kichigi chiqindiga taklif qilinadi |
| **Kam ishlatiladigan chegarasi** | 1.0 m | Oralig'i saqlanadi, lekin belgi bilan |

**Chegara — taklif, qaror emas.** Usta ishni olayotganda o'zgartira oladi (7.6).

> Maydon emas, aynan eni. `0.20 × 6` bo'lak 1.2 kv.m bo'lsa ham hech narsaga yaramaydi.

Tavsiya etilgan oraliq: 0.3–1 m. 0 qo'yilsa ombor mayda qirqimlar bilan to'lib ketadi, juda katta qo'yilsa hamma narsa chiqindiga chiqadi.

### 5.6. Almashtirish guruhi

**Majburiy maydon.** Sotuvda dropdown ochilganda faqat shu guruhdagi variantlar chiqadi — mexanizm bosilganda kronshteyn chiqmaydi.

### 5.7. Slotlarga bog'lanish

Mato **aniq slotga** bog'lanadi: "Rollo" emas, "Rollo → Orqa mato (zashitka)".

Bitta mato bir nechta slotga bog'lanishi mumkin — zashitka matosi ham "Rollo → Orqa mato", ham "Zashitka → Asosiy mato" slotiga.

Aksessuar mahsulot turiga bog'lanadi, har turi uchun alohida sarflash qoidasi va majburiy/ixtiyoriy holati bilan.

### 5.8. Saqlashdagi ogohlantirishlar

**Bloklamaydi, faqat ogohlantiradi:**
- Sotuv narxi tannarxdan past (farq summasi ko'rsatiladi)
- O'xshash nomli material bor (nomi va qoldig'i ko'rsatiladi)
- Hech qaysi slotga bog'lanmagan ("sotuvda hech qachon ko'rinmaydi")
- Ogohlantirish chegarasi joriy qoldiqdan yuqori

**Bloklaydi:** majburiy maydon bo'sh, sotuv narxi manfiy, koeffitsient 0 yoki manfiy.

### 5.9. Material holati

- Harakati bo'lmagan material butunlay o'chiriladi
- Harakati bori nofaol qilinadi
- **Nofaol material ochiq buyurtmalarda ishlashda davom etadi** — usta "Tugatdim" bosa oladi. Aks holda ish yarim yo'lda to'xtab qoladi
- Nofaol materialning qoldig'i ombor hisobotida ko'rinib turadi

**Nofaol qilish bloklanadi**, agar material biror faol mahsulot turining **majburiy** komplektida bo'lsa va almashtirish guruhida boshqa faol variant qolmasa.

Sabab ko'rsatiladi: *"Rollo uchun majburiy, 'Mexanizm' guruhida boshqa faol variant yo'q"*.

> Aks holda sotuvchi Rollo tanlaganda mexanizm qatorida bo'sh dropdown chiqadi — muammo mijoz oldida ma'lum bo'ladi. Bloklash uni admin ekraniga ko'chiradi.

---

## 6. MIJOZLAR

### 6.1. Ekranlar

1. Mijozlar ro'yxati
2. Mijoz qo'shish / tahrirlash
3. Mijoz kartochkasi
4. Qarzni to'lash oynasi

### 6.2. Mijoz turlari

**Oddiy mijoz** va **B2B (do'konchi)**. B2B tanlansa kontakt shaxslar jadvali ochiladi (F.I.SH., lavozimi, telefoni).

### 6.3. Narx offseti

Mijozga beriladigan narx farqi. **Barcha matolarga bir xil qo'llanadi** — har materialga alohida narx belgilanmaydi.

Uch xil bo'lishi mumkin:

| Turi | Formula | 120 000 so'm/kv.m matoda |
|---|---|---|
| **So'm** | `baza + offset` | −1 500 → 118 500 |
| **Foiz** | `baza × (1 + offset)` | −3% → 116 400 |
| **Dollar** | `baza + (offset × kurs)` | −1 $ → 107 350 |

Formada ikkita maydon: **offset turi** (dropdown) va **qiymati**. Ostida jonli jadval — shu offset bilan bir necha matoning narxi qanday chiqishi ko'rsatiladi, admin saqlashdan oldin ko'radi.

Offset **faqat matoga** qo'llanadi, aksessuarga tegmaydi.

Sotuvda mijoz tanlangach narx qayta hisoblanadi, keyin sotuvchi uni yana qo'lda o'zgartira oladi.

**Yaxlitlash — 100 so'mgacha.** Foizli offsetda narx kasr chiqadi:

```
118 750 × 0.97 = 115 187.5  →  115 200
```

**Dollar offsetida sozlamadagi joriy kurs ishlatiladi** (14.3), buyurtmadagi kurs emas.

> Buyurtmadagi kurs olinsa, sotuvchi kursni ko'tarib mijozga bilvosita chegirma bera oladi va bu chegirma limitida (3.11) ko'rinmaydi.

> **v1.13 ga nisbatan o'zgarish.** Eski hujjatning 5.2-bandida "% chegirma KERAK EMAS" deb yozilgan edi. Endi foiz offset turlaridan biri.

### 6.4. Qarz limiti

Limit **doim so'mda** belgilanadi.

Mijozning qarzi ikki valyutada alohida turadi (masalan 5 000 000 so'm + 150 $). **Limitni tekshirishda dollar qarzi joriy kursda so'mga o'girilib qo'shiladi:**

```
5 000 000 + (150 × 12 650) = 6 897 500 so'm
limit: 6 500 000  →  limitdan oshgan
```

Ro'yxatda ustun `joriy qarz / limit` ko'rinishida chiqadi, ikkalasi ham so'mda — sotuvchi raqam qayerdan kelganini ko'radi.

> **Ma'lum oqibat.** Kurs o'zgarganda bu son ham o'zgaradi. Mijoz hech narsa olmasdan "limitdan oshgan" ro'yxatiga tushishi mumkin. Bu ongli qabul qilingan xavf.

Limitdan oshsa — sotuvchi mustaqil qaror qabul qiladi, tizim bloklamaydi.

### 6.5. Dublikat nazorati

**Bir xil telefon yoki bir xil ism kiritilsa saqlanmaydi.** Ogohlantirish oynasi chiqadi va mavjud mijozning telefoni, oxirgi xaridi, qarzi ko'rsatiladi.

Uch yo'l taklif qilinadi: mavjud mijozni ochish, unga kontakt shaxs sifatida qo'shish, ismni o'zgartirish.

### 6.6. Holati

Mijoz o'chirilmaydi, nofaol qilinadi (2.1-invariant).

**Qarzi 0 dan farq qilsa nofaol qilish bloklanadi.** Sabab ko'rsatiladi ("Qarzi bor: 1 340 000 so'm"). Aks holda qarz ro'yxatdan g'oyib bo'ladi.

Hech qanday buyurtmasi va to'lovi bo'lmagan mijoz butunlay o'chiriladi.

### 6.7. Mijoz kartochkasi

Sarlavhada: ism, turi, telefon, manzil, kontakt shaxslar, offset, limit, mijoz bo'lgan sana. O'ng tomonda joriy balans (manfiy — qarz, musbat — avans) va limit holati.

Ko'rsatkichlar: jami xarid, buyurtmalar soni, o'rtacha chek, o'rtacha to'lov muddati, qaytarishlar, xarid chastotasi, eng ko'p olgan mahsulot, hisobdan chiqarilgan qarz.

Beshta tab: **qarz harakati**, **buyurtmalar**, **to'lovlar**, **eslatmalar**, **izohlar**.

### 6.8. Qarz harakati

Jadval: sana, sabab, summa, valyuta, oldingi balans, keyingi balans, kim.

**Birinchi qator — "Boshlang'ich qoldiq"** (2.2-invariant). Tizimga o'tishda import qilingan eski qarz shu yerda ko'rinadi, aks holda balans 0 chiqadi.

### 6.9. Qarzni to'lash

Bu **kassa kirim oynasining bir turi**, alohida oyna emas. Mijoz kartochkasidan ochilganda mijoz maydoni oldindan to'ldirilgan holda chiqadi.

**Bitta operatsiyada bitta valyuta.** Mijozda so'm ham, dollar ham qarz bo'lsa — ikkita alohida yozuv.

Standart holatda **eng eski buyurtmadan** yopiladi. Sotuvchi boshqasini tanlashi yoki umumiy balansdan yopishi mumkin.

Saqlanganda: kassaga kirim yoziladi, mijozning qarz harakatiga qator qo'shiladi, buyurtmaning qarzi kamayadi, kvitansiya taklif qilinadi.

### 6.10. Umidsiz qarz

Admin qarzni hisobdan chiqara oladi. Sabab majburiy, audit jurnaliga tushadi.

**Mijoz keyin kelib to'lasa** — pul kassaga **"boshqa kirim"** sifatida kiritiladi. Mijoz kartochkasida "hisobdan chiqarilgan qarz qaytdi" deb ko'rinadi, lekin **balansiga qo'shilmaydi** — qarz allaqachon yopilgan.

### 6.11. Telegram ID

Mijoz botga `/start` bosganda avtomatik saqlanadi. Qo'lda ham kiritish mumkin.

Bo'sh bo'lsa ro'yxatda belgi chiqadi ("qo'ng'iroq qiling") — bunday mijozga bildirishnoma yuborib bo'lmaydi.

Bot mijozni **telefon raqami** bo'yicha taniydi: `/start` da Telegram tugmasi orqali raqam so'raladi, bazada topilsa mavjud mijozga bog'lanadi, topilmasa yangisi yaratiladi (13.2).

---

## 7. OMBOR

### 7.1. Ekranlar

1. Materiallar ro'yxati
2. Material qo'shish / tahrirlash *(5-bo'limga qarang)*
3. Material kartochkasi
4. Kirim hujjati
5. Rulon va ostatka
6. Hisobdan chiqarish (brak)

### 7.2. Umumiy tuzilma

Ombor ikki qism bilan ishlaydi: materiallar spravochnigi va har mahsulot turi uchun retsept (BOM).

**Kirimda faqat xomashyo kiritiladi** — tayyor mahsulot emas, chunki har buyurtma individual o'lchamda tayyorlanadi.

### 7.3. Band qilish

**Pozitsiya "Tasdiqlangan" bo'lgan zahoti tizim mos bo'lakni topadi va uni band qiladi.**

Ombor qoldig'i ikkiga ajraladi:

```
Ko'k mato · to'r      jami 48.0 kv.m
                      bo'sh 31.4  ·  band 16.6
```

> Bu qoida **o'zgartirilgan**. Avval band qilish yo'q edi va bir nechta buyurtma bitta bo'lakka da'vogar bo'lishi mumkin edi — muammo faqat "Tugatdim" bosilganda ma'lum bo'lardi.

**Band muddati — 30 kun.** Pozitsiya shu vaqt ichida bajarilmasa band avtomatik bo'shaydi va adminga xabar ketadi.

**Band bo'shatiladi:** pozitsiya bekor qilinganda · rad etilganda · muddat o'tganda.

**Bo'lak raqami ustaga ko'rsatilmaydi.** Tizim faqat **manbani** biladi: ostatkadan yoki rulondan. Ustaga aytiladi: *"Ostatkadan kesing — mos bo'lak bor"*. Qaysi birini olishini u omborda o'zi topadi.

**Texnik talab:** "Tugatdim" va band qilish operatsiyalari **atomar** bajariladi. Ikki usta bir vaqtda bitta bo'lakka da'vo qilsa — birinchi so'rov oladi, ikkinchisiga rad javobi qaytariladi.

Lock **omborchi bilan usta orasida ham** ishlaydi: omborchi bo'lakni brakka chiqarayotganda usta o'shanga "Tugatdim" bosa olmaydi.

### 7.4. Rulon va qoldiq kesma

Mato rulon holida, **aniq o'lchamlar bilan** omborga kiradi (eni × bo'yi). Rulonlar standart enida kelmaydi — o'lcham har kirimda alohida kiritiladi.

**Rulonning eni hech qachon o'zgarmaydi.** Kesilganda faqat **bo'yi** kamayadi.

Misol: rulon `3.00 × 30.00`. Buyurtma `1.20 × 2.00`. Usta 2 m tasma ochadi, undan 1.20 enlik bo'lakni kesadi.

```
R-118   rulon           3.00 × 28.00 m    ← bo'yi 30 dan 28 ga tushdi
O-207   qoldiq kesma    1.80 × 2.00 m     ← R-118 dan, buyurtma №1247
```

**Ikki xil bo'lak bor:**

| Turi | Nima |
|---|---|
| **Rulon** | Butun yoki qisman ochilgan. Eni doim asl eni |
| **Qoldiq kesma** | Kesimdan ortgan to'rtburchak. O'z eni va bo'yi bilan |

**Har bo'lak `eni × bo'yi` bo'lib saqlanadi**, faqat kvadrat metr bo'lib emas.

> **Nega maydon yetarli emas.** Bo'lakning maydoni 5.00 kv.m, kerak bo'lgani 2.94. Maydon bo'yicha "yetadi" chiqadi, lekin eni 1.00 m — undan 210 sm parda kesib bo'lmaydi.

Har bo'lak **o'z kirimini va tannarxini** eslab qoladi. Qoldiq kesma otasidan meros oladi.

Bo'lak doim **to'rtburchak** — usta doim to'liq kenglikda kesadi.

**Pozitsiyada faqat manba saqlanadi** — ostatkadan yoki rulondan. Aniq bo'lak raqami emas.

Ish varaqasida usta shuni ko'radi: *"Mato: ostatkadan kesing"*. Qaysi bo'lakni olishini omborda o'zi hal qiladi.

### 7.5. Uch daraja: yaroqli, kam ishlatiladigan, yaroqsiz

Admin har materialga **ikkita chegara** belgilaydi va ular uchta daraja beradi:

| Eni | Daraja | Nima bo'ladi |
|---|---|---|
| < 0.5 m | **Yaroqsiz** | Chiqindi. Tizim shuni taklif qiladi |
| 0.5 – 1.0 m | **Kam ishlatiladigan** | Qoldiq kesma bo'lib saqlanadi, belgi bilan |
| > 1.0 m | **To'liq yaroqli** | Oddiy qoldiq kesma |

**O'rta daraja nima uchun kerak:** bunday bo'laklar yig'ilib qoladi va "muzlab qolgan pul" hisobotida (11.7.6) alohida ko'rinadi. Yiliga bir marta ularni ko'rib chiqib tozalash mumkin.

**Chegaralar har materialda alohida** — qimmat matoda 0.3 m ham saqlanadi, arzonida 0.8 m ham chiqindi. Bo'sh qolsa sozlamadagi standart ishlaydi (14.4).

**Chegara — taklif, qaror emas.** Tizim hisoblab tavsiya beradi, usta o'zgartira oladi.

### 7.6. Kesish oqimi

Kesish qarori **usta ishni olayotganda** ko'rsatiladi va **"Tugatdim" da tasdiqlanadi**.

```
1. Pozitsiya "Tasdiqlangan"
   → tizim mos bo'lakni topadi va band qiladi (7.3)

2. Usta ishni oladi — rejani ko'radi:

     Kesiladi:  1.20 × 2.00
     Manba:     OSTATKADAN — mos bo'lak bor (1.80 × 2.00)
     Qoladi:    0.60 × 2.00  → kam ishlatiladigan

3. Usta omborga boradi, mos ostatkani o'zi topib kesadi

4. "Tugatdim" — manba tasdiqlanadi:

     ✔️ TUGATDIM — #1247 poz. 1
     Kesildi: 1.20 × 2.00

     Qayerdan kesdingiz?
       ⦿ Ostatkadan        ← rejadagi, oldindan tanlangan
       ○ Rulondan

     Qoldi:  [ 0.60 ] × [ 2.00 ]     ← tuzatish mumkin
       [ Ostatka ]   [ Chiqindi ]

              [ Tasdiqlash ]
```

**Usta odatda shunchaki "Tasdiqlash" bosadi** — bir bosish, qo'shimcha ish yo'q. Reja to'g'ri bo'lsa hech narsa o'zgartirilmaydi.

**Usta uch narsani o'zgartira oladi:**

| Nima | Qachon kerak |
|---|---|
| **Manba** — ostatka yoki rulon | Rejada ostatka turgan edi, u rulondan kesdi (yoki teskarisi) |
| **Qolgan bo'lak o'lchami** | Kesim egri chiqdi, cheti yaroqsiz. Egrilik uchun 5–10 sm tuzatish oddiy holat |
| **Ostatka yoki chiqindi** | Tizim taklifini bekor qilib o'zi tanlaydi |

**Aniq bo'lak raqami kuzatilmaydi.** Ostatkalar omborda alohida-alohida saqlanadi (o'lchamlari bilan), lekin usta qaysi birini olganini aytmaydi. Tizim o'lchami mos keladiganini o'zi topib hisobdan chiqaradi.

> Usta o'nlab bo'lak orasidan qaysi birini olganini har safar qayd etsa — bu ortiqcha ish va u baribir bajarmaydi. Muhimi manba: rulon kamaydimi yoki yo'qmi.

**Nima uchun manba muhim.** Usta ostatkadan kesgan bo'lsa, tizim rulondan yechmasligi kerak. Aks holda omborda rulon kamayadi, ostatka esa turaveradi — ikki-uch marta takrorlansa hisob butunlay buziladi.

**Ostatka bor turib rulon tanlansa — ogohlantirish:**

> *"Bu buyurtmaga mos ostatka bor edi (1.80 × 2.00). Baribir rulondan kesdingizmi?"*

Bloklamaydi — bo'lak iflos yoki yirtiq bo'lishi mumkin. Lekin qaror ongli bo'ladi va jurnalga yoziladi.

**Hisobot: "Ostatka turgan holda rulon ochildi"** (11.7.7). Bitta hodisa — tasodif. Oyiga o'n marta — ostatkalar yig'ilib qolayotgani va pul o'lik yotayotgani demak.

---

**Algoritm bo'lakni qanday topadi:**

**0. Birlashtirish.** Bitta buyurtmadagi bir xil matoli pozitsiyalar birga hisoblanadi.

> Uchta 210 × 140 alohida kesilsa — uchta mayda bo'lak. Birga kesilsa — 4.20 m tasma bir yo'la ochiladi va yonda bitta uzun bo'lak qoladi.

**1. Eni tekshiriladi.** Buyurtma eni ≤ bo'lak eni.

**2. Bo'yi tekshiriladi.**

**3. Burish yo'q.** Eni eniga, bo'yi bo'yiga. Bo'lak aylantirilmaydi.

**4. Bag'rikenglik 1 sm.** `0.90 × 1.40` bo'lakka `90.2 × 140` sig'adi, `91.5 × 140` sig'maydi.

**5. Tartib:** avval qoldiq kesma, keyin qisman ochilgan rulon, keyin yangi rulon.

**6. Bir necha mos variant bo'lsa — eng kam chiqindi qoldiradigani.**

> Buyurtma eni 140 sm, omborda 2 m va 3 m enli rulon bor. 2 m dan kesiladi (60 sm qoladi), 3 m dan emas (160 sm keraksiz maydalanadi).

**7. Hech qaysi bo'lakka sig'masa** — pozitsiya "Materialga kutmoqda" statusiga tushadi.

**Har kesim ombor tarixiga uch qator bo'lib yoziladi:**

```
Ostatkadan chiqdi  −3.60 kv.m    (1.80 × 2.00)
Qoldiq kesma       +1.20 kv.m    (0.60 × 2.00)
Chiqindi            0.00 kv.m
Mahsulotga ketdi    2.40 kv.m
```

Rulondan kesilgan bo'lsa birinchi qator boshqacha bo'ladi:

```
Rulondan chiqdi    −6.00 kv.m    (2.00 m tasma × 3.00 m eni)
Qoldiq kesma       +3.60 kv.m    (1.80 × 2.00)
```

Bo'lak yaroqsiz chiqsa — chiqindi qatoriga tushadi va **haqiqiy yo'qotish** bo'lib foyda-zarar hisobotiga yoziladi.

### 7.7. Buyurtma eni rulon enidan katta bo'lsa

Mijoz 3.5 m enli parda so'radi, eng keng rulon 3.0 m.

Tekshiruv **sotuv paytida** bo'ladi, "Tugatdim"da emas. Sotuvchi o'lchamni kiritayotganda ogohlantirish chiqadi va buyurtma ikkiga bo'lib rasmiylashtiriladi.

### 7.8. Tannarx

Tannarx **har kirim bilan birga yuradi**. Rulon va chiziqli materialda har bo'lak o'z kirimini biladi — R-118 kirim №44 dan kelgan bo'lsa, undan kesilgan mahsulotning tannarxi 78 000.

**Dona materialda bo'lak yo'q** — 380 ta kronshteyn o'nta kirimdan aralashgan. Shuning uchun **FIFO**: eng eski kirimdan boshlab yechiladi.

Foyda-zarar hisoboti eski sotuvlarni **o'sha paytdagi** tannarx bo'yicha hisoblaydi.

### 7.9. Kirim hujjati

Maydonlar: yetkazib beruvchi, hujjat raqami, sana, valyuta, kurs.

Jadval: material, miqdor, birlik, **eni**, **bo'yi**, narxi, summa, **defekt**, **defekt qayerga**.

Rulon uchun eni va bo'yi majburiy — har rulon alohida yozuv bo'lib omborga tushadi (R-118, R-119) va o'z o'lchami, tannarxi bilan saqlanadi.

**Defekt ikki yo'lga ketadi:**

| Yo'l | Nima bo'ladi |
|---|---|
| **Qaytariladi** | Omborga kirmaydi, yetkazib beruvchi qarzidan chegiriladi. Bizga zarar yo'q. |
| **O'zimizdan brakka** | Omborga kiradi va darhol hisobdan chiqariladi, sabab "yetkazib beruvchi defekti". Zarar bizda qoladi. |

**Brak qolgan materialning tannarxiga taqsimlanmaydi.** 10 shtanga 660 000 so'm, 1 tasi brak bo'lsa — tannarx 66 000 bo'lib qolaveradi (73 333 emas), 66 000 so'm esa "yetkazib beruvchi defekti" xarajati bo'lib hisobotga tushadi.

> Aks holda qaysi yetkazib beruvchi ko'p brak berayotgani hech qayerda ko'rinmaydi, tannarx esa sekin-asta o'sib boraveradi.

**Yetkazib beruvchi qaytarishni rad etsa** — avtomatik hech narsa bo'lmaydi. Gaplashuvdan keyin admin qo'lda "o'zimizdan brakka" ga o'tkazadi.

**Yetkazib beruvchi umuman yo'qolsa** (aloqaga chiqmaydi, kompaniya yopilgan) — admin qarzni **umidsiz** deb hisobdan chiqaradi. Sabab majburiy, summa "yetkazib beruvchi defekti" xarajatiga tushadi, audit jurnaliga yoziladi.

> Bu mijozning umidsiz qarzi bilan aynan bir xil mexanizm (6.10). Bir xil narsa uchun ikkita alohida yo'l yaratilmaydi. Avtomatik o'tkazish qilinmaydi — necha kundan keyin degan chegara har doim sun'iy chiqadi.

**To'lov muddati.** Yetkazib beruvchi kartochkasidagi standart muddat (masalan 30 kun) avtomatik qo'yiladi va kerak bo'lsa o'zgartiriladi. Muddat faqat ogohlantirish uchun, hech narsani bloklamaydi (9.4).

**Qo'shimcha xarajatlar.** Hujjatga alohida blok: turi (transport / bojxona / bojxona brokeri / yuk tashish / boshqa) va summa.

Xarajat qatorlarga **summa ulushi bo'yicha** taqsimlanadi va tannarxga qo'shiladi:

```
Mato        3 744 000  (75.2%)  →  +1 504 000
Karniz        594 000  (11.9%)  →  +  238 000
Kronshteyn    640 000  (12.9%)  →  +  258 000
            ─────────              ──────────
            4 978 000               2 000 000
```

> Og'irlik yoki hajm bo'yicha taqsimlash to'g'riroq bo'lardi, lekin har materialga og'irlik kiritish kerak bo'ladi va omborchi uni to'ldirmaydi. Summa ulushi 90% holatda yetarli.

**Transport tannarxga taqsimlanadi, brak esa taqsimlanmaydi.** Sabab boshqacha: transport haqiqiy tannarx, brak esa ko'rinishi kerak bo'lgan yo'qotish.

> Importda transport va boj 10–15% ni tashkil qiladi. Hisobga olinmasa foyda hisoboti doimo yuqori chiqadi va qaysi mato aslida foydali ekani noto'g'ri ko'rinadi.

**Ustama tekshiruvi.** Kirim saqlanganda har material uchun yangi tannarx bo'yicha ustama hisoblanadi va chegara bilan solishtiriladi (5.4).

Chegaradan past bo'lsa qizil ogohlantirish chiqadi va adminga bildirishnoma ketadi. **Bloklamaydi** — mol allaqachon kelgan, uni qaytarib bo'lmaydi. Admin narxni ko'tarish kerakligini o'z vaqtida biladi.

Saqlanganda: qoldiq oshadi, tannarx yangilanadi (qo'shimcha xarajatlar bilan), yetkazib beruvchi qarzi oshadi, to'lov qilinsa kassadan chiqim.

### 7.10. Hisobdan chiqarish (brak)

Omborda turgan material buzilganda: suv ketdi, rangi o'chdi, yirtildi, muddati o'tdi, yo'qoldi.

> Bu **uchinchi** brak turi. Yetkazib beruvchi defekti (7.8) va ishlab chiqarish braki (usta noto'g'ri kesgani) alohida yuritiladi.

**Kim qiladi:** omborchi o'zi saqlaydi, **admin tasdig'i kutilmaydi**.

**Majburiy maydonlar:** material, miqdor, sabab. Rulon yoki chiziqli materialda qaysi bo'lakdan ekani tanlanadi.

**Adminga xabar ketadi:**

```
Ombordan chiqarildi
Ko'k mato · to'r — 4.2 kv.m
Zarar: 327 600 so'm
Sabab: suv ketdi — "Rulon uchi ho'l bo'ldi, tom oqqan"
Omborchi: Anvar · 24.07.2026 14:20
```

**Keyin o'zgartirish:** omborchi yozuvni bekor qila oladi yoki miqdorini o'zgartira oladi. **Har o'zgarishda adminga yangi xabar** ketadi, eski qiymat jurnalda qoladi, yozuv tarixi to'liq ko'rinib turadi.

**Bekor qilish bloklanmaydi** — oradan kesim o'tgan bo'lsa ham. Qoldiq manfiyga tushishi mumkin, qizil bilan belgilanadi, adminga xabar ketadi va admin tuzatgunicha shunday turadi (2.5-invariant).

**Sabab ro'yxatida "Yetkazib beruvchi defekti — keyin topildi"** ham bor. Tanlanganda qo'shimcha maydon ochiladi: qaysi kirim hujjatidan va da'vo qilinadimi.

> Rulon ichidagi dog' faqat ochilganda ma'lum bo'ladi — bir oy o'tib. U paytda kirim hujjati allaqachon saqlangan.

Kassaga tegmaydi (pul harakati yo'q), foyda-zarar hisobotiga xarajat bo'lib tushadi. Audit jurnalida qoladi.

### 7.11. Material kartochkasi

Ma'lumot, qoldiq tarkibi, harakatlar tarixi.

Harakatlar tarixi — sana, turi, izoh, miqdor, oldingi qoldiq, keyingi qoldiq, kim. Turlari: kirim, sarflash, chiqindi, ishlab chiqarish braki, ombordan chiqarildi, korrektsiya, boshlang'ich qoldiq.

Qoldiq alohida saqlanmaydi — shu jadvalning yig'indisi (2.2-invariant).

### 7.12. Kirim hujjatini storno qilish

Xato kiritilgan kirim hujjati storno qilinadi. **Storno to'liq bo'ladi** — hujjatdagi barcha material qaytariladi, o'sha rulonlardan allaqachon kesilgan bo'lsa ham.

**Qoldiq manfiyga tushishi mumkin.** Bu ruxsat etilgan (2.5-invariant): storno qo'lda bajariladigan amal, avtomatik operatsiya emas. Manfiy qoldiq qizil bilan belgilanadi va admin tuzatgunicha shunday turadi.

**Kesilgan buyurtmalarga tegilmaydi.** Ular o'z tannarxi bilan qotib qolgan (2.3-invariant) — storno o'tgan oyning foydasini o'zgartirmaydi.

**Storno uch joyga birdan tegadi** — bitta atomar operatsiya, bittasi bajarilib ikkinchisi bajarilmasligi mumkin emas:

1. **Ombor** — qoldiq qaytariladi, manfiyga tushishi mumkin
2. **Yetkazib beruvchi qarzi** — kamayadi, qarz harakatiga teskari qator qo'shiladi
3. **Kassa** — to'langan bo'lsa pul qaytarilmaydi, balans **avansga** o'tadi va keyingi kirimda ishlatiladi

Adminga xabar ketadi va audit jurnaliga yoziladi: hujjat raqami, summa, kim storno qildi, sabab.

> Misol: kirim №44 da 2 rulon (60 kv.m). R-118 dan 2.94 kesilgan. Storno qilingach qoldiq −2.94 bo'ladi. Admin korrektsiya orqali to'g'ri kirimni kiritadi va qoldiq tiklanadi.

### 7.13. Sotilmagan tayyor mahsulot

Mahsulot yasalgan, mato allaqachon kesilgan va ombordan yechilgan. Mijoz olishdan bosh tortdi yoki buyurtmani bekor qildi. Jismonan mahsulot omborda yotibdi.

Bunday pozitsiya **"Sotilmagan tayyor mahsulot"** ro'yxatiga tushadi. Ikki yo'ldan keladi: **Qaytarilgan** yoki **Rad etilgan** (8.8, 8.10). Ro'yxatda: mahsulot turi, o'lchami (eni × bo'yi), qaysi matolardan, aksessuarlari, tannarxi, kelib chiqish sanasi va buyurtmasi.

**Ombor qoldig'iga tegilmaydi** — mato allaqachon yechilgan, uni qaytarib bo'lmaydi.

Sotuv ekranida **"Tayyordan tanlash"** orqali mos o'lchamli mahsulot qidiriladi va chegirma bilan sotiladi. Sotilgach ro'yxatdan chiqadi, tushum kassaga tushadi.

Uzoq turib qolgan mahsulotni admin **hisobdan chiqara oladi** — tannarx zarar bo'lib yoziladi, sabab majburiy.

> Bu to'liq tayyor mahsulot ombori emas — shunchaki qayerga qo'yishni bilmagan narsalarning ro'yxati. Aks holda ular tizimda umuman ko'rinmaydi va olti oydan keyin hech kim ularni eslamaydi.

---

## 8. BUYURTMA HAYOTI

### 8.1. Ekranlar

1. Buyurtmalar ro'yxati
2. Buyurtma kartochkasi
3. Qaytarish oynasi

### 8.2. Asosiy prinsip — buyurtmaning umumiy statusi yo'q

Bitta buyurtmada bir nechta pozitsiya bo'ladi va **har pozitsiya mustaqil harakat qiladi**. Biri topshirilgan, biri ishlab chiqarilmoqda, uchinchisi materialga kutmoqda bo'lishi mumkin.

Buyurtma darajasida yagona status **hisoblanmaydi**. Ro'yxatda tarkib qisqartirib ko'rsatiladi: *"3 tadan: 1 tayyor · 1 ishlab chiqarilmoqda · 1 materialga kutmoqda"*.

> Umumiy status eng orqada qolgan pozitsiyadan hisoblansa, ma'lumot yo'qoladi — sotuvchi bitta pozitsiya tayyor ekanini ko'rmaydi va mijozga ayta olmaydi.

### 8.3. Pozitsiya statuslari

| Status | Qachon | Keyingi qadam | Material |
|---|---|---|---|
| **Tasdiq kutmoqda** | Botdan kelgan, sotuvchi ko'rmagan | Sotuvchi tasdiqlaydi yoki bekor qiladi | Tegilmagan |
| **Tasdiqlangan** | Tasdiqlandi yoki saytdan kiritildi | Umumiy navbatga tushadi | Tegilmagan |
| **Materialga kutmoqda** | Usta ishga olmoqchi, material yetmadi | Kirim bo'lgach navbatga qaytadi | Tegilmagan |
| **Ishlab chiqarilmoqda** | Usta ishga oldi | Usta "Tugatdim" bosadi | Hali yechilmagan |
| **Tayyor** | Usta "Tugatdim" bosdi | Mijozga topshiriladi | **Yechildi**, ostatka yaratildi |
| **Topshirilgan** | Mijoz olib ketdi | Yopiq | Yechilgan |
| **Qaytarilgan** | Olib ketgan, keyin qaytardi | Yopiq | Yechilgan · 7.12 ga tushadi |
| **Rad etilgan** | Tayyor, mijoz olishdan bosh tortdi | Yopiq | Yechilgan · 7.12 ga tushadi |
| **Bekor qilingan** | Kesishdan oldin bekor qilindi | Yopiq | Tegilmagan, zarar yo'q |

### 8.4. Tasdiqlash

| Manba | Tasdiqlash |
|---|---|
| **Telegram bot** (mijoz bergan) | **Sotuvchi tasdiqlaydi.** Tasdiqlanmaguncha navbatga tushmaydi |
| **Sayt** (sotuvchi kiritgan) | Kerak emas. Darhol "Tasdiqlangan" holatida saqlanadi |

"Tasdiq kutmoqda" filtrida faqat botdan kelganlar chiqadi.

Tasdiqlanmagan buyurtma **avtomatik bekor bo'lmaydi**. 24 soatdan oshgani ro'yxatda qizil bo'lib ko'rinadi va sotuvchiga bildirishnoma ketadi.

### 8.5. Ishni taqsimlash

**Admin ustani taqsimlamaydi.** Tasdiqlangan pozitsiya umumiy navbatga tushadi va **usta botdan o'zi oladi**.

Har pozitsiya alohida ustaga ketishi mumkin. Stavka ham har pozitsiya uchun alohida hisoblanadi.

Kartochkadagi "Usta" ustuni ishga olingan paytda to'ladi.

**Ikki usta bitta pozitsiyani birga olsa** — birinchi so'rov oladi, ikkinchisiga "bu ish allaqachon olingan" qaytariladi. Xuddi "Tugatdim" dagi atomarlik (7.3).

### 8.6. Ishni ustadan qaytarib olish

Usta olgan ishini **o'zi tugatadi** — navbatga qaytarish huquqi yo'q.

Istisno: **admin ishni qaytarib ola oladi.** Usta ishdan bo'shadi, aloqaga chiqmayapti, uzoq kasal bo'lib qoldi.

- Faqat **"Ishlab chiqarilmoqda"** holatida. "Tugatdim" bosilgach mumkin emas — mahsulot allaqachon tayyor
- Pozitsiya **umumiy navbatga** qaytadi, boshqa usta o'zi oladi
- **Stavkani admin qo'lda kiritadi** — usta ishning bir qismini bajargan bo'lishi mumkin. Sabab majburiy
- Tarixga va ish haqi hisobiga yoziladi, adminning o'zi ham audit jurnalida qoladi

### 8.7. Tahrirlash

Pozitsiya **"Ishlab chiqarilmoqda" ga o'tmaguncha** tahrirlanadi: rang, o'lcham, aksessuar, narx.

O'tgandan keyin tahrirlash yo'q — pozitsiya bekor qilinadi va yangisi qo'shiladi. Sabab: usta allaqachon materialni ochgan bo'lishi mumkin.

Har tahrir harakatlar tarixiga **eski va yangi qiymati bilan** yoziladi.

**Tasdiqlangan buyurtmaga yangi pozitsiya qo'shish mumkin.** Mijoz ertasi kuni "yana bittasi kerak" desa — mavjud buyurtmaga qo'shiladi, yangi buyurtma ochilmaydi. Aks holda bitta mijoz, bitta manzil, ikkita chek bo'ladi.

### 8.8. Bekor qilish va rad etish

Bu **ikki alohida amal**.

**Bekor qilish** — faqat kesishdan oldin. Material tegilmagan, zarar yo'q, to'langan pul to'liq qaytariladi. Pozitsiya "Ishlab chiqarilmoqda" ga o'tgach tugma o'chadi.

**Rad etilgan** — mahsulot tayyor, mijoz olmadi: kelmay qo'ydi, telefon ko'tarmayapti, yoki "endi kerak emas" dedi. Mato allaqachon kesilgan. Mahsulot **7.12 ro'yxatiga** tushadi, pul qaytarishdagi tartibda qaytariladi.

**Mijoz kelmasa avtomatik hech narsa bo'lmaydi.** "Tayyor, topshirilmagan" filtrida yoshi bo'yicha ko'rinadi. Admin qaror qilsa "Rad etilgan" ga o'tkazadi.

**Storno bundan farq qiladi.** Bekor qilish — real biznes holati (mijoz fikridan qaytdi). Storno — xato: buyurtma umuman bo'lmagan, sotuvchi noto'g'ri kiritgan. Faqat admin qiladi va hisobotda alohida ko'rinadi.

### 8.9. Topshirish

**Qisman topshirish mumkin.** Uchtadan bittasi tayyor bo'lsa, mijoz shuni olib keta oladi. Qolganlari o'z holida qoladi.

- Qisman topshirishda **kvitansiya** chiqadi
- **Chek faqat buyurtma to'liq yopilganda**, bir marta — barcha pozitsiya va to'lovlar bilan

**Hisob-kitob varaqasi.** Chek bilan birga mijozga qog'ozda beriladi. Ichida:

- Sotuvlar tarixi — barcha buyurtmalari, sanasi va summasi bilan
- To'lovlar tarixi — qachon qancha to'lagan
- **Joriy balans** — so'm va dollar alohida

Bu saytdagi mijoz kartochkasining (6.7) chop etiladigan ko'rinishi. Mijoz o'z hisobini ko'radi va bahs chiqmaydi.

Buyurtma yopiladi, qachonki barcha pozitsiya "Topshirilgan", "Qaytarilgan", "Rad etilgan" yoki "Bekor qilingan" bo'lsa.

### 8.10. Qaytarish

**Pozitsiya darajasida ishlaydi.** Mijoz uchta pardadan bittasini qaytara oladi, butun buyurtmani qaytarish shart emas.

**Qaytarish muddati yo'q** — istalgan vaqtda qaytarilishi mumkin.

**Qaytariladigan summani sotuvchi o'zi kiritadi.** Tizim pozitsiya narxini taklif qiladi, sotuvchi mijoz bilan kelishib o'zgartiradi. Izoh majburiy.

> Ulush hisobi, foiz taqsimoti qilinmaydi. Mijoz pulni pozitsiyaga bo'lib bermaydi — u shunchaki "800 ming beray" deydi. Sotuvchi vaziyatni ko'rib o'zi kelishadi.

**Chegara yo'q** — sotuvchi 0 ham kirita oladi. Amal audit jurnaliga tushadi va adminga xabar ketadi.

Farq (pozitsiya narxi − qaytarilgan summa) kassada qoladi va hisobotda **"qaytarishdan ushlab qolindi"** deb alohida chiqadi.

**Pul qayerdan qaytariladi:** avval mijoz qarzidan chegiriladi. Qaytariladigan summa qarzdan ko'p bo'lsa — ortiqchasi uchun **sotuvchi tanlaydi**: kassadan naqd berish yoki avans bo'lib qolish.

Mijozsiz buyurtma (ko'chadan kelgan xaridor) qaytarilsa — qarz yo'q, hammasi kassadan naqd.

**Yopiq statusdan chiqish yo'q.** Qaytarilgan pozitsiya qayta qaytarilmaydi, xato bo'lsa storno.

Butun buyurtmani qaytarish uchun alohida amal yo'q — pozitsiyalar birma-bir qaytariladi, buyurtma o'z-o'zidan yopiladi.

### 8.11. Sifat muammosi va ishlab chiqarish braki

Qaytarish sabablari orasida "Sifat muammosi" ham bor va u **oddiy qaytarish** bo'lib qolaveradi — usta har qanday holatda haqini oladi.

Bu **ishlab chiqarish brakidan farq qiladi** (TZ 2.9). Brak — usta noto'g'ri kesganda, mijozga yetib bormasdan aniqlanadi: bot orqali qayta kesish so'rovi yuboriladi, admin tasdiqlaydi, material ikkinchi marta yechiladi, pozitsiya "Ishlab chiqarilmoqda" da qoladi.

### 8.12. Materialga kutish

Usta ishga olmoqchi bo'ldi, material yetmadi — pozitsiya avtomatik "Materialga kutmoqda" ga o'tadi.

Kirim bo'lgach pozitsiya **avtomatik "Tasdiqlangan" ga qaytadi** va umumiy navbatga tushadi. Ustaga va sotuvchiga bildirishnoma ketadi.

**Navbat tartibi aniq.** Kirim bo'lgach tizim mos bo'lakni **eng eski buyurtmaga** band qiladi (7.3).

> Bu qoida **o'zgartirilgan**. Avval band qilish yo'q edi va navbat tasodifiy edi.

### 8.13. Chegirma va valyuta

Chegirma belgilangan limitdan oshsa — ogohlantirish chiqadi, sotuvchi davom eta oladi, audit jurnaliga tushadi.

Buyurtma dollarda bo'lsa, to'lov so'mda qabul qilinganda **buyurtma yaratilgan paytdagi kurs** ishlatiladi. Kurs buyurtmada saqlanadi va keyin o'zgarmaydi (2.3-invariant).

### 8.14. Kartochka tuzilishi

**Sarlavha:** mijoz, turi va offseti, tayyorlik sanasi, manba, pozitsiyalar soni.
**Pul bloki:** hisoblangan, kelishilgan jami, chegirma, to'langan, qarz.
**Tugmalar:** chek, ish varaqasi, to'lov qabul qilish, izoh, bekor qilish.

**To'rtta tab:**

| Tab | Nima bor |
|---|---|
| **Pozitsiyalar** | Mahsulot, o'lcham, materiallar, narx, usta, status, amallar |
| **To'lovlar** | Sana, turi, usul, summa, valyuta, kim qabul qildi |
| **Harakatlar tarixi** | Kim nima qildi, eski va yangi qiymat bilan |
| **Izohlar** | Sotuvchi va admin yozuvlari |

### 8.15. Ro'yxat filtrlari

Bugungi · tasdiq kutmoqda · ishlab chiqarilmoqda · tayyor, topshirilmagan · muddati o'tgan · qarzi bor · materialga kutmoqda.

Ustunlar: chek №, sana, mijoz, manba, pozitsiyalar tarkibi, jami, to'langan, qarz, muddat, amallar.

### 8.16. Tayyorlik sanasi

Sana **buyurtma darajasida** bo'ladi, pozitsiya darajasida emas.

Hisobotda **buyurtma bir marta** sanaladi — pozitsiyalar bo'yicha emas. Kechikish kunlari eng kech tugagan pozitsiyadan hisoblanadi.

Sanasi kiritilmagan buyurtmalar bu hisobotga tushmaydi va alohida ustunda sanaladi (3.13).

---

## 9. YETKAZIB BERUVCHILAR

### 9.1. Ekranlar

1. Yetkazib beruvchilar ro'yxati
2. Qo'shish / tahrirlash
3. Kartochka
4. To'lov oynasi

### 9.2. Qarz modeli

Mijozlardagi model bilan **aynan bir xil**, faqat teskari yo'nalishda — biz qarzdormiz.

- **Balans saqlanmaydi**, u harakatlar yig'indisi (2.2-invariant)
- Tizimga o'tishda eski qarz **"Boshlang'ich qoldiq"** qatori bo'lib yoziladi
- **So'm va dollar alohida turadi**, hech qachon bitta summaga qo'shilmaydi
- Bitta yetkazib beruvchida **ikkala valyutada** qarz bo'lishi mumkin

**Qarz limiti yo'q.** Bu chegara ularning tomonida bo'ladi, bizniki emas.

**Avans mumkin.** Mol kelmasdan oldin pul o'tkazilsa balans musbat bo'ladi va keyingi kirim uni yeydi. Xitoydan mol olishda deyarli doim shunday.

Ro'yxatda avansdagi yetkazib beruvchilar **alohida filtrda** ko'rinadi — qarzdorlar bilan aralashtirilmaydi. Balans musbat va manfiy bo'lishi butunlay boshqa holatlar, bir ro'yxatda ular bir-birini yashiradi.

### 9.3. Ma'lumot maydonlari

**Asosiy:** nomi, nima yetkazadi, holati, izoh.

**Aloqa:** kontakt shaxs, telefon, qo'shimcha telefon, manzil.

**To'lov rekvizitlari:** bank nomi, hisob raqami, INN/STIR, MFO. To'lov oynasida avtomatik chiqadi.

**To'lov shartlari:** standart to'lov muddati kunlarda (masalan 30). Kirim hujjatida shu son avtomatik qo'yiladi va kerak bo'lsa o'zgartiriladi.

### 9.4. To'lov muddati — faqat ogohlantirish

Muddat yaqinlashsa ro'yxatda sariq, o'tib ketsa qizil bo'ladi va adminga bildirishnoma ketadi.

**Hech narsa bloklanmaydi** — mol baribir olinaveradi.

### 9.5. To'lov

**To'lov umumiy balansga tushadi va eng eski hujjatdan yopiladi.** Aniq hujjat tanlash kerak emas. Bitta to'lov bir nechta hujjatni yopishi mumkin.

**Kim qila oladi:** admin, sotuvchi, omborchi.

**Dollar qarzini so'mda to'lash mumkin.** To'lov oynasida valyuta "so'm" tanlanadi, kurs kiritiladi (joriy kurs avtomatik keladi, tahrirlanadi). Qarz `so'm ÷ kurs` bo'yicha kamayadi.

> Misol: 39 600 000 so'm, kurs 13 200 → qarzdan 3 000 $ yopiladi.

Saqlanganda: kassadan chiqim, qarz harakatiga qator, kirim hujjatining to'langan qismi oshadi, kurs farqi bo'lsa alohida yoziladi.

### 9.6. Kurs farqi

**Tannarx kirim kunidagi kursda so'mga qotiriladi va hech qachon o'zgarmaydi.** Qarz esa dollarda turaveradi.

To'lov paytida chiqadigan farq **alohida xarajat moddasi** bo'lib yoziladi — tannarxga tegmaydi:

```
Kirim   3 000 $ × 12 650 = 37 950 000  → tannarx (qotdi)
To'lov  3 000 $ × 13 200 = 39 600 000  → kassadan chiqdi
                           ──────────
Kurs farqi                  1 650 000  → xarajat
```

**Nega tannarxga qo'shilmaydi:** mahsulot allaqachon o'sha narxda sotilgan, o'tgan oyning hisoboti o'zgarmasligi kerak (2.3-invariant).

Kurs tushsa — bu **daromad** bo'ladi. U **alohida moddaga** yoziladi, xarajat moddasiga musbat qiymat qo'yilmaydi.

Foyda-zarar hisobotida ikkita alohida qator:

- **Kurs farqi — xarajat** (kurs ko'tarilgan holatlar)
- **Kurs farqi — daromad** (kurs tushgan holatlar)

> Bitta moddaga yig'ilsa, ular bir-birini yeb qo'yadi va yil davomida qancha yo'qotilgani ko'rinmay qoladi. Ajratilganda dollarda mol olishning haqiqiy narxi ko'rinadi.

### 9.7. Kartochka

**Yuqorida ikki blok:** qarzimiz (so'm, dollar, ochiq da'vo, eng yaqin muddat) va hamkorlik (hamkor bo'lgan sana, jami kirim, hujjatlar soni, brak ulushi, oxirgi kirim).

**Oltita tab:**

| Tab | Nima bor |
|---|---|
| **Qarz harakati** | Sana, sabab, summa, valyuta, oldingi va keyingi balans, kim. Birinchi qator — boshlang'ich qoldiq |
| **Kirimlar** | Hujjatlar: raqam, sana, tarkib, summa, to'langan, qoldi, to'lov muddati, holati |
| **To'lovlar** | Sana, usul, summa, valyuta, kurs, qaysi hujjatga tushdi, kim |
| **Materiallar** | Shu yetkazib beruvchidan keladigan materiallar va **narx tarixi** |
| **Brak va da'volar** | Ochiq da'volar va brak tarixi |
| **Izohlar** | — |

### 9.8. Narx tarixi

"Materiallar" tabida har material yonida **oxirgi uchta kirim narxi** va o'zgarish foizi ko'rsatiladi.

> Ko'k mato: 1 872 000 → 1 950 000 → 2 100 000, 8 oyda **+12.2%**

Bu ma'lumot boshqa hech qayerdan chiqmaydi. Qaysi material qimmatlashayotgani va qaysi yetkazib beruvchi narxni ko'targani faqat shu yerda ko'rinadi.

### 9.9. Ochiq da'volar

Kirimda "qaytariladi" deb belgilangan defekt hal qilinmaguncha shu tabda turadi (7.8).

Ikki tugma:
- **"Qabul qildi"** — qarzdan chegiriladi, da'vo yopiladi
- **"O'zimizga"** — material brakka chiqadi, zarar bizda qoladi

**Yetkazib beruvchi butunlay yo'qolsa** — admin qarzni umidsiz deb hisobdan chiqaradi. Sabab majburiy, summa "yetkazib beruvchi defekti" xarajatiga tushadi.

### 9.10. Holati

**Qarzimiz bor yetkazib beruvchini nofaol qilib bo'lmaydi** — qarz ro'yxatdan yo'qoladi. Mijozdagi bilan bir xil qoida (6.6).

Harakati bo'lmagan yozuv butunlay o'chiriladi, harakati bori nofaol qilinadi (2.1-invariant).

### 9.11. Kirim hujjatini keyin tahrirlash

Qo'shimcha xarajat (transport hisobi, bojxona to'lovi) ko'pincha moldan keyin keladi. Shuning uchun **saqlangan kirim hujjati tahrirlanadi** va tannarx qayta hisoblanadi.

**Sotilgan mahsulotlarga tegilmaydi.** Ular o'z tannarxi bilan qotgan (2.3-invariant) — o'tgan oyning foydasi o'zgarmaydi.

Yangi tannarx faqat **omborda qolgan** materialga qo'llanadi. Har tahrir audit jurnaliga eski va yangi qiymat bilan yoziladi.

### 9.12. Tizimda yo'q narsa

**Yetkazib beruvchiga buyurtma berish** degan tushuncha yo'q. Faqat kirim bor — mol kelganda yoziladi.

Shundan kelib chiqadi: "buyurtma berdik, hali kelmadi" holati kuzatilmaydi va yetkazib berish muddati hisoblanmaydi. Xarid ro'yxati 15.3-bandda.

---

## 10. XODIMLAR VA ISH HAQI

### 10.1. Ekranlar

1. Xodimlar ro'yxati
2. Xodim qo'shish / tahrirlash
3. Xodim kartochkasi
4. Stavka matritsasi
5. To'lov va balansni tuzatish

### 10.2. Xodim va foydalanuvchi — bitta yozuv

Xodim kartochkasi ayni paytda foydalanuvchi hisobi hamdir. Unda: shaxsiy ma'lumot, **rollar**, login va parol, Telegram ID, ish haqi usuli.

Alohida "foydalanuvchilar" ro'yxati yo'q.

- Sotuvchi va omborchi **saytga** kiradi — login va parol kerak
- Usta **botga** kiradi — login shart emas, Telegram ID yetarli
- Telegram ID bot `/start` bosilganda avtomatik to'ladi, qo'lda ham kiritiladi

### 10.3. Rollar — bir nechta bo'lishi mumkin

Xodimga **bir vaqtning o'zida bir nechta rol** berilishi mumkin: admin, sotuvchi, omborchi, usta. Ruxsatlar ularning yig'indisi bo'ladi.

> Kichik korxonada adminning o'zi omborchi ham bo'ladi. Bitta rol majburlansa, u ikkinchi hisob ochishga majbur bo'ladi va audit jurnalida ikki xil odam ko'rinadi.

Bu 1.2-bandni to'ldiradi: u yerda rollar sanalgan, lekin bitta odamda bir nechtasi bo'lishi aytilmagan edi.

### 10.4. Balans modeli

Mijoz va yetkazib beruvchi bilan **aynan bir xil** (2.2-invariant): balans saqlanmaydi, u harakatlar yig'indisi.

- Hisoblangan haq balansga **qo'shiladi**
- Olingan pul **ayiriladi**
- **Davr yo'q.** Xodim istalgan paytda so'raydi, balansidan yechiladi
- **Boshlang'ich qoldiq** — tizimga o'tishda eski haq birinchi qator bo'lib yoziladi

**Manfiy balans mumkin va bloklanmaydi.** Xodim ishlaganidan ko'p olsa (avans) yoki brak ushlansa balans manfiyga tushadi.

**Balansi 0 dan farq qiladigan xodimni nofaol qilib bo'lmaydi.** Ishdan bo'shagan xodimda manfiy balans qolsa — admin uni hisobdan chiqaradi, sabab majburiy, xarajatga tushadi.

### 10.5. Valyuta

Stavka so'mda ham, dollarda ham belgilanishi mumkin. **Balans qaysi valyutada hisoblangan bo'lsa, o'sha valyutada turadi.**

Pul berilayotganda o'sha kundagi kurs uriladi:

```
Balans 85 $. To'lov 660 000 so'm, kurs 13 200.
660 000 ÷ 13 200 = 50 $ balansdan yechiladi. Qoladi 35 $.
```

Kurs to'lov oynasida avtomatik keladi va o'zgartirilishi mumkin. Alohida "kurs farqi" moddasi yuritilmaydi.

### 10.6. Ish haqi usullari

Uch xil, boshqasi yo'q:

| Usul | Kimga | Qanday |
|---|---|---|
| **Oylik** | Sotuvchi, omborchi | Qat'iy summa, oy oxirida bir yo'la balansga qo'shiladi |
| **Ishiga qarab** | Usta | Har bajarilgan pozitsiya uchun, stavka matritsasi bo'yicha |
| **Hisoblanmaydi** | Egasi / admin | Balans yuritilmaydi |

Oy o'rtasida pul kerak bo'lsa **avans** beriladi — balans manfiyga tushadi va oy oxirida oylik uni yopadi.

### 10.7. Qo'shimcha foiz (KPI) — ixtiyoriy

Xodimga foiz qo'shilishi mumkin. **Bitta qoida bor:**

> Foiz **kassaga kelgan puldan** hisoblanadi. Pul kassaga kirgan payt yoziladi — mahsulot sotilgan payt emas.

Sozlamada ikkita maydon: **foiz** va **nimadan** (faqat o'z sotuvlaridan / butun kassa tushumidan). Bo'sh qolsa KPI yo'q.

**Nega aynan tushum:** bu qoida o'zini o'zi to'g'rilaydi va qo'shimcha shart yozishni talab qilmaydi.

- Chegirma berilsa → tushum kam → foiz kam
- Qarzga sotilsa → pul kelmagan → foiz yo'q. Keyin to'lansa o'sha payt qo'shiladi
- Qaytarilsa → pul chiqadi → foiz teskari yoziladi

Boshqa asoslar (pozitsiya soni, buyurtma soni, sotilgan summa) **ishlatilmaydi** — ularning har biri alohida istisno qoidalarini talab qiladi.

### 10.8. Usta stavkasi

Stavka **mahsulot turi bo'yicha** belgilanadi. Uch xil hisoblash usuli:

| Usul | Misol |
|---|---|
| **Qat'iy summa** | Zashitka — 15 000 so'm, o'lchamdan qat'i nazar |
| **Kv.metrga** | Plisse — 18 000 so'm/kv.m. `18 000 × 3.2 = 57 600` |
| **Bosqichli jadval** | Dikke — 1 kv.m gacha 1 $, 1–1.5 → 2 $, 1.5 dan yuqori → 3 $ |

Bosqichlar soni cheklanmagan.

**Chegaraga aynan teng qiymat quyi bosqichga kiradi:**

```
1.00 kv.m → 1 $
1.01 kv.m → 2 $
1.50 kv.m → 2 $
1.51 kv.m → 3 $
```

**Eng quyi bosqich minimal haq vazifasini bajaradi** — 0.3 kv.m lik kichkina parda ham ish talab qiladi.

### 10.9. Standart va alohida stavka

Matritsada **standart** stavka turadi va barcha ustaga qo'llanadi.

Xodim kartochkasida "alohida stavka" belgilanishi mumkin — o'sha xodim uchun alohida jadval ochiladi. **Belgilanmagan mahsulot turlariga standart qo'llanaveradi.**

> Bu naqsh butun tizimda takrorlanadi: standart qiymat + istisno. Ustama chegarasi (5.4), to'lov muddati (9.3) ham shunday.

### 10.10. Haq qachon hisoblanadi

Usta **"Tugatdim"** bosgan payt. Mahsulot mijozga topshirilishini kutmaydi.

> Mijoz umuman kelmasligi mumkin (8.8). Ish esa bajarilgan.

**Stavka o'sha paytda snapshot qilinadi.** Stavka keyin ko'tarilsa yoki tushirilsa, eski ishlar o'zgarmaydi (2.3-invariant) — o'tgan oyning ish haqi bugun qayta hisoblanmaydi.

### 10.11. Bir ishni ikki usta bajarsa

**Tizim haqni bo'lmaydi.** "Tugatdim" bosgan usta to'liq stavkani oladi.

Admin ishni birinchi ustadan qaytarib olgan bo'lsa (8.6) — unga **qo'lda summa kiritadi**. Ustalar o'zaro kelishuvi tizimning ishi emas.

### 10.12. Stavkasi belgilanmagan mahsulot turi

Yangi mahsulot turi yaratilganda stavka 0 bo'lib qoladi va tizim ogohlantiradi (4.9).

**Pozitsiya baribir navbatga tushadi** va usta uni oladi — ishlab chiqarish to'xtamaydi. Bajarilganda haq 0 hisoblanadi va adminga bildirishnoma ketadi:

> *"Jalyuzi vertikal stavkasi belgilanmagan — 2 ta pozitsiya bajarildi, haq 0"*

Admin keyin **balansni qo'lda tuzatish** orqali haqni qo'shadi.

### 10.13. Brak ushlanishi

Ishlab chiqarish braki (2.9) sodir bo'lganda ushlanish **har hodisada alohida hal qilinadi**: to'liq, qisman summa, yoki umuman yo'q.

Qat'iy qoida yo'q — mato nuqsonli chiqqan bo'lishi ham, usta e'tiborsizlik qilgan bo'lishi ham mumkin.

Qaror admin tomonidan **balansni tuzatish** orqali kiritiladi.

### 10.14. Balansni qo'lda tuzatish

**Faqat admin.** Sotuvchi va omborchi to'lov qila oladi, lekin balansni tuzata olmaydi.

Maydonlar: xodim, yo'nalish (+/−), **sabab** (bonus / jarima / brak ushlanishi / stavkasiz bajarilgan ish uchun haq / kelishilgan qo'shimcha to'lov / boshqa), summa, valyuta, **izoh — majburiy**.

**Kassaga tegmaydi** — pul harakati yo'q, faqat balans o'zgaradi.

Jarima va brak ushlanishi foyda-zarar hisobotida **ish haqi xarajatining kamayishi** bo'lib ko'rinadi, daromad sifatida emas.

Audit jurnaliga tushadi.

### 10.15. To'lov

**Kim qila oladi:** admin, sotuvchi, omborchi.

Saqlanganda: kassadan chiqim yoziladi (turi "Ish haqi"), balans harakatiga qator qo'shiladi, balans kamayadi.

**Balansdan ko'p berilsa bloklanmaydi** — bu avans hisoblanadi, balans manfiyga tushadi.

Xato bo'lsa o'chirilmaydi — storno.

### 10.16. Kartochka

**Ikki blok yuqorida:** balans (joriy, jami ishlagan, jami olgan, oxirgi to'lov) va ish ko'rsatkichlari (bu oy bajargan, o'rtacha kunlik, brak, ushlangan, eng ko'p yasagan mahsulot).

**Beshta tab:** balans harakati · bajarilgan ishlar · to'lovlar · brak tarixi · izohlar.

---

## 11. HISOBOTLAR VA DASHBOARD

### 11.1. Umumiy talablar

Har bir hisobotda:

- **Davr filtri** — bugun, hafta, oy, chorak, yil, ixtiyoriy oraliq
- **Kesim tanlash** — hisobotga qarab: sotuvchi, mahsulot turi, mijoz, material, usta
- **Jadval va grafik** birga
- **Excelga eksport**

Hisobotlar **hisoblanadi**, saqlanmaydi. Har ochilganda joriy ma'lumotdan yig'iladi.

Barcha hisobot **o'z paytidagi qiymatlar** bilan ishlaydi (2.3-invariant): o'tgan oyning foydasi bugungi narx yoki stavka o'zgargani uchun o'zgarmaydi.

### 11.2. Excel eksporti — ikki varaq

Har eksportda **ikkita varaq** bo'ladi:

| Varaq | Nima bor |
|---|---|
| **Yig'ma** | Ekrandagi jadval, grafik uchun tayyorlangan ma'lumot bilan |
| **Xom ma'lumot** | Har qator alohida, guruhlanmagan, filtrsiz |

> Sabab: foydalanuvchi baribir Excelda o'zicha kesib ko'radi. Faqat yig'ma bo'lsa, har yangi savolda tizimga qaytish kerak bo'ladi.

Eksportda hisobot nomi, davri, filtrlari va yaratilgan sana-vaqt sarlavhada ko'rsatiladi.

### 11.3. Dashboard

Bitta ekran, uch qator. **Ruxsatga qarab bloklar yashiriladi** — har rolga alohida ekran yasalmaydi.

**Birinchi qator — bugun**

Tushum · buyurtma soni · o'rtacha chek · kassadagi pul (naqd va karta alohida).

**Ikkinchi qator — diqqat talab qiladi**

Har biri raqam va havola. Bosilganda tegishli filtr bilan ro'yxat ochiladi.

- Tasdiq kutayotgan buyurtma *(24 soatdan oshgani qizil)*
- Muddati o'tgan buyurtma
- Materialga kutayotgan pozitsiya
- Kam qolgan material
- Ustamasi chegaradan past material
- Limitdan oshgan mijoz
- Yetkazib beruvchiga muddati o'tgan to'lov
- Ochiq da'vo

**Uchinchi qator — oylik trend**

Tushum grafigi (o'tgan oy bilan taqqoslab) · foyda · debitorlik va kreditorlik · top-5 mahsulot · top-5 mijoz.

### 11.4. Moliya hisobotlari

**11.4.1. Foyda-zarar**

`Tushum − tannarx − xarajatlar`. Davr bo'yicha, o'tgan davr bilan taqqoslab.

Xarajat moddalari: ish haqi, transport va bojxona, ombor braki, ishlab chiqarish braki, chiqindi, kurs farqi, yetkazib beruvchi defekti, umidsiz qarz, boshqa.

**Ish haqi hisoblangan paytda xarajatga tushadi** — usta "Tugatdim" bosgan kun, to'langan kun emas. Shunda mahsulot sotilgan oyda uning haqi ham o'sha oyda ko'rinadi.

Jarima va brak ushlanishi ish haqi xarajatini **kamaytiradi**, alohida daromad bo'lib yozilmaydi.

**11.4.2. Kassa oqimi**

Kirim va chiqim, turi va usuli (naqd/karta/bank) kesimida. Boshlang'ich va yakuniy qoldiq.

**11.4.3. Tushum**

Kunlik va oylik, sotuvchi hamda mahsulot turi kesimida.

**11.4.4. Xarajatlar**

Moddalar bo'yicha, davr taqqoslash bilan.

**11.4.5. Debitorlik**

Mijozlar qarzi, **yoshi bo'yicha guruhlangan**: 0–30, 30–60, 60–90, 90+ kun. So'm va dollar alohida ustunlarda.

**11.4.6. Kreditorlik**

Yetkazib beruvchilarga qarzimiz, to'lov muddati bo'yicha. Avansdagilar alohida.

**11.4.7. Kurs farqi**

Xarajat va daromad **alohida qatorlarda** (9.6). Yig'ib ko'rsatilmaydi.

### 11.5. Sotuv hisobotlari

**11.5.1. Sotuv dinamikasi** — davr bo'yicha, taqqoslash bilan.

**11.5.2. Mahsulot turi bo'yicha foyda**

Har mahsulot turi uchun: soni · tushum · tannarx · **birlik foyda** · umumiy foyda · **rentabellik %**.

> Bu "mahsulot bo'yicha sotuv" dan farq qiladi. Rollo eng ko'p sotiladi, lekin unda ikkita mato ketadi. Plisse kam sotiladi, lekin `MAYDON × 1.5` sarflaydi. Qaysi biri ko'proq foyda keltirishi faqat shu hisobotda ko'rinadi.

**11.5.3. Sotuvchi bo'yicha** — soni, tushum, o'rtacha chek, undirilgan qarz.

**11.5.4. Chegirmalar** — kim, qancha, qaysi buyurtmada. Limitdan oshganlar ajratilgan.

**11.5.5. Qaytarish va rad etish** — sabab kesimida, ushlab qolingan pul bilan.

**11.5.6. Sotuvchi erkinliklari**

Sotuvchida uchta chegarasiz erkinlik bor: narxni o'zgartirish (3.8), chegirma limitidan oshish (3.11), qaytarishda 0 gacha ushlab qolish (8.10).

Hammasi audit jurnaliga tushadi, lekin jurnal — ming qatorli oqim, uni hech kim o'qimaydi. Bu hisobot ularni sotuvchi kesimida yig'adi:

```
Sotuvchi   Chegirma      Limitdan oshgan   Narx o'zgartirdi   Ushlab qoldi
Malika     1 240 000     3 marta           18 pozitsiya       180 000
Aziz         320 000     0                  4 pozitsiya             0
```

Ayblov emas — farq ko'rinib tursin.

### 11.6. Mijozlar hisobotlari

**11.6.1. Mijozlar bazasi** — yangi, takroriy, uxlab qolgan. O'rtacha chek va xarid chastotasi.

**11.6.2. ABC tahlil** — tushumning 80% i qaysi mijozlardan kelayotgani.

### 11.7. Ombor hisobotlari

**11.7.1. Qoldiq va uning qiymati** — material bo'yicha, tannarx bo'yicha jami.

**11.7.2. Material harakati** — kirim, sarflash, chiqindi, brak. Davr bo'yicha.

**11.7.3. Kam qolgan va tugagan** — chegaradan past tushganlar.

**11.7.4. Chiqindi va brak** — material va sabab kesimida.

**11.7.5. Ustama eroziyasi**

Barcha materialning joriy ustamasi bitta jadvalda:

```
Material            Tannarx   Sotuv narxi   Ustama   Chegara
Alyuminiy karniz     30 815        35 000    13.6%      30%  ⚠
Ko'k mato            87 333       120 000    37.4%      30%
Kronshteyn            4 490         5 000    11.4%      30%  ⚠
```

Ustama chegarasi kirim paytida ogohlantiradi (7.8), lekin bir marta. Bu hisobot butun ro'yxatni ko'rsatadi va qaysi materialning narxini ko'tarish kerakligi bir ekranda ko'rinadi.

**11.7.6. Muzlab qolgan pul**

Uch joyda pul o'lik yotadi va alohida hech kim sanamaydi:

| Nima | Qayerdan |
|---|---|
| Ostatkalar | 7.4 — bo'laklar soni va tannarx qiymati |
| Sotilmagan tayyor mahsulot | 7.12 |
| Uzoq qimirlamagan material | 6 oydan beri harakat bo'lmagan pozitsiyalar |

Jami summa yuqorida ko'rsatiladi.

**11.7.7. Ostatka turgan holda rulon ochildi**

```
Sana     Usta      Buyurtma   Kesildi       Mos ostatka bor edi
11.08    Rustam    #1247      1.20 × 2.00   1.80 × 2.00
09.08    Sardor    #1244      1.40 × 1.80   2.50 × 1.84
```

Usta "Tugatdim" da manba sifatida rulonni tanlagan, lekin tizimda mos ostatka bor edi (7.6).

> Bitta hodisa — tasodif. Oyiga o'n marta — ostatkalar yig'ilib qolayotgani va pul o'lik yotayotgani demak. Bu 11.7.6 dagi "muzlab qolgan pul" ning sababini ko'rsatadi.

### 11.8. Ishlab chiqarish hisobotlari

**11.8.1. Usta unumdorligi** — bajarilgan pozitsiya soni, hisoblangan haq, o'rtacha kunlik, mahsulot turi kesimida.

**11.8.2. Ishlab chiqarish braki** — usta kesimida, zarar summasi va ushlangan summa bilan.

**11.8.3. Kechikkan buyurtmalar** — tayyorlik sanasidan o'tganlar, kechikish kunlari bilan.

**11.8.4. Navbat holati**

Ustalar ishni o'zlari oladilar, admin taqsimlamaydi (8.5). Shuning uchun navbat qanday harakat qilayotganini kuzatish kerak:

- Pozitsiya navbatda qancha kutdi — o'rtacha va eng uzun
- Hozir navbatda nechta, eng eskisi necha kunlik
- **Qaysi mahsulot turi uzoq kutmoqda**

Oxirgisi muhim: stavkasi past mahsulot navbatda yotib qoladi va buni odatda faqat mijoz shikoyat qilganda bilib qolinadi.

### 11.9. Ta'minot hisoboti

**11.9.1. Narx dinamikasi** — qaysi material qimmatlashayapti, qaysi yetkazib beruvchi ko'targan. 9.8-banddagi narx tarixining umumiy ko'rinishi.

### 11.10. Ruxsatlar

| Rol | Ko'radi |
|---|---|
| **Admin** | Hammasi |
| **Sotuvchi** | Sotuv, mijozlar, kassa oqimi. **Tannarx, foyda va ish haqi yo'q** |
| **Omborchi** | Faqat ombor hisobotlari |
| **Usta** | Hech narsa — botda o'z ishini va balansini ko'radi |

Dashboardda ham shu ruxsat ishlaydi: sotuvchi kirganda foyda va tannarx bloklari ko'rinmaydi.

### 11.11. Har sahifaning tepasida ko'rsatkichlar paneli

Hisobotlar alohida bo'limda turadi, lekin **eng kerakli raqamlar ish qilinayotgan sahifaning o'zida** bo'lishi kerak. Foydalanuvchi hisobot bo'limiga o'tishi shart emas.

**Har modul sahifasining tepasida panel bo'ladi.** Tuzilishi hamma joyda bir xil:

| Qator | Nima |
|---|---|
| **1 — Holat** | Hozir nima bor: qoldiq, balans, soni |
| **2 — Davr** | Bu oy nima bo'ldi, o'tgan davr bilan taqqoslab |
| **3 — Diqqat** | Harakat talab qiladigan narsalar, raqam va havola bilan |

**Uchinchi qator eng muhimi.** Har element bosilganda tegishli filtr bilan ro'yxat ochiladi. Foydalanuvchi muammoni izlamaydi — muammo o'zi ko'rinadi.

**Modul bo'yicha paneller:**

**Mijozlar** *(6-bo'lim)*
Holat: jami mijoz · jami qarz (so'm va dollar alohida) · muddati o'tgan qarz.
Davr: yangi mijoz · o'rtacha chek · takroriy mijoz % · o'rtacha to'lov muddati.
Diqqat: limitdan oshgan · muddati o'tgan · uxlab qolgan · Telegramsiz.

**Ombor** *(7-bo'lim)*
Holat: qoldiq qiymati · ostatkalar soni va qiymati · sotilmagan tayyor mahsulot.
Davr: kirim summasi · sarflangan tannarx · chiqindi va brak.
Diqqat: kam qolgan · tugagan · ustamasi chegaradan past · 6 oy qimirlamagan.

**Buyurtmalar** *(8-bo'lim)*
Holat: ochiq buyurtma · ishlab chiqarilmoqda · tayyor, topshirilmagan.
Davr: buyurtma soni · tushum · o'rtacha chek · qaytarish %.
Diqqat: tasdiq kutmoqda · muddati o'tgan · materialga kutmoqda · navbatda uzoq turgan.

**Yetkazib beruvchilar** *(9-bo'lim)*
Holat: jami qarzimiz (so'm va dollar) · avansdagilar.
Davr: kirim summasi · o'rtacha brak %.
Diqqat: muddati o'tgan to'lov · muddati yaqin · ochiq da'vo.

**Xodimlar** *(10-bo'lim)*
Holat: xodim soni · jami balans · manfiy balansdagilar.
Davr: hisoblangan haq · to'langan · brak ushlanmalari.
Diqqat: manfiy balans · uzoq to'lanmagan · bot ulanmagan · stavkasiz bajarilgan ish.

**Kassa** *(12.16)*
Yuqorida batafsil yozilgan.

**Qoida:** panel **hisoblanadi**, saqlanmaydi. Ruxsatga bo'ysunadi — sotuvchiga tannarx va foyda ko'rinmaydi (11.10).

### 11.12. Keyinroqqa qoldirilgan

**Kunlik yopish varaqasi** — kun oxirida bitta sahifa: bugun nima bo'ldi, kassada qancha bo'lishi kerak, nima ochiq qoldi. Chop etib qo'yish uchun.

Bu inventarizatsiyaning kichik ko'rinishi va 15.4-bandga qarang.

---

## 12. KASSA

### 12.1. Asosiy prinsip: xarajat ≠ kassa chiqimi

Bu ikkisi butunlay boshqa narsa va aralashtirilsa **bir xil pul ikki marta hisoblanadi**.

**Pul chiqmaydi, lekin xarajat bo'ladi:** ombor braki · chiqindi · ishlab chiqarish braki · umidsiz qarz · **hisoblangan** ish haqi · yetkazib beruvchi defekti · xodimga jarima · kurs farqi.

**Pul chiqadi, lekin xarajat emas:** yetkazib beruvchiga to'lov *(mol allaqachon tannarxga kirgan)* · xodimga ish haqi to'lovi *(haq allaqachon "Tugatdim" da xarajat bo'lgan)* · egasi pul olishi · ayirboshlash · kassalar orasidagi ko'chish.

> Usta 70 000 ishlab topdi → xarajat yozildi. Bir hafta o'tib pul berildi → kassadan 70 000 chiqdi. Ikkalasi xarajat deb sanalsa 140 000 chiqadi, aslida 70 000.

**Qoida:** foyda-zarar hisoboti **xarajat jurnalidan** yig'iladi, kassadan emas. Kassa oqimi alohida hisobot (11.4.2).

### 12.2. Kassa tuzilishi

Kassa bitta emas — har sotuvchining o'z kassasi bor va asosiy admin kassasi:

```
ADMIN KASSASI              SOTUVCHI KASSASI (har sotuvchiga o'ziniki)
  ├── naqd so'm              ├── naqd so'm
  ├── naqd dollar            └── naqd dollar
  └── karta (so'm)
```

**Karta to'lovi qaysi sotuvchi sotgan bo'lsa ham to'g'ridan-to'g'ri admin kassasiga tushadi** va u yerda "kartadagi pul" bo'lib alohida turadi. Pul sotuvchining qo'lida turmaydi — u bankka boradi.

Sotuvchi faqat **naqd**ni ushlab turadi va faqat naqdni topshiradi.

So'm va dollar har kassada alohida hisoblanadi va hech qachon bitta summaga qo'shilmaydi (1.3-band).

**Boshlang'ich qoldiq.** Tizimga o'tishda har kassaning mavjud puli birinchi harakat bo'lib yoziladi (2.2-invariant).

### 12.3. Har yozuv manbaga bog'lanadi

Takrorlanishning oldini olish uchun har kassa yozuvida ikkita majburiy maydon bo'ladi: **manba turi** va **manba ID**.

```
kirim   · buyurtma_tolovi   · 1247 · qator 1 · naqd   500 000
kirim   · buyurtma_tolovi   · 1247 · qator 2 · karta  300 000
chiqim  · yetkazib_tolov    · TB-14 ·         bank  3 000 000
chiqim  · ish_haqi          · XOD-3 ·         naqd    940 000
chiqim  · operatsion        · —     ·         naqd    450 000
```

**`(manba turi, manba ID, qator)` uchligi takrorlanmasligi kerak** — bu bazada bloklanadi.

Shunda hech qanday tasdiqlash, tugmani qayta bosish yoki sahifani yangilash ikkinchi yozuv yarata olmaydi.

Qo'lda kiritilgan yozuvda manba "qo'lda" bo'ladi va u hech qaysi modulga ta'sir qilmaydi.

**Storno ham shu qoidaga bo'ysunadi:** bitta yozuvga bitta storno, ikkinchisi bloklanadi.

### 12.4. Tasdiqlash hech qachon pul yaratmaydi

Tizimda ikki bosqichli hodisalar bor: botdan kelgan buyurtmani sotuvchi tasdiqlaydi (8.4), qayta kesish so'rovini admin tasdiqlaydi (2.9), sotuvchining topshirig'ini admin tasdiqlaydi (12.6).

**Har uchalasida ham tasdiqlash faqat statusni o'zgartiradi.** Pul yoki material hodisasi **bitta joyda** tug'iladi — so'rov paytida yoki tasdiq paytida, ikkalasida emas.

Qaysi joyda tug'ilishi har hodisada aniq belgilangan:

| Hodisa | Pul/material qachon qimirlaydi |
|---|---|
| Bot buyurtmasi tasdiqlanishi | Hech qachon — to'lov alohida hodisa |
| Qayta kesish so'rovi | Admin tasdiqlaganda material yechiladi |
| Sotuvchi topshirig'i | Admin tasdiqlaganda pul ko'chadi |

### 12.5. Kassaga KIRIM

| Kod | Hodisa | Qayerdan | Qaysi kassaga |
|---|---|---|---|
| K1 | Buyurtma to'lovi — sotuv paytida | Sotuv ekrani (3.12) | Sotgan sotuvchi · karta bo'lsa admin |
| K2 | Buyurtma to'lovi — topshirishda yoki keyin | Buyurtma kartochkasi (8.9) | Qabul qilgan sotuvchi |
| K3 | Mijoz qarzini to'lash | Qarzni to'lash oynasi (6.9) | Qabul qilgan sotuvchi |
| K4 | Mijoz avansi | Sotuv / kassa | Qabul qilgan sotuvchi |
| K5 | Hisobdan chiqarilgan qarz qaytdi | Kassa — "boshqa kirim" (6.10) | Qabul qilgan |
| K6 | Egasi pul qo'shdi | Kassa | **Faqat admin** |
| K7 | Sotuvchidan topshiriq | Topshiriq tasdig'i (12.6) | Admin |
| K8 | Boshlang'ich qoldiq | Import | Har kassa |
| K9 | Boshqa kirim | Kassa, izoh majburiy | Kim kiritsa |

### 12.6. Kassadan CHIQIM

| Kod | Hodisa | Qayerdan | Qaysi kassadan |
|---|---|---|---|
| C1 | Yetkazib beruvchiga to'lov | To'lov oynasi (9.5) | Kim to'lasa |
| C2 | Yetkazib beruvchiga avans | To'lov oynasi (9.2) | Kim to'lasa |
| C3 | Transport / bojxona to'lovi | Kirim hujjati (7.8) | **Admin** |
| C4 | Ish haqi to'lovi | Xodim kartochkasi (10.15) | Kim bersa |
| C5 | Xodimga avans | Xodim kartochkasi | Kim bersa |
| C6 | Mijozga qaytarish — naqd qismi | Qaytarish oynasi (8.10) | Rasmiylashtirgan sotuvchi |
| C7 | Operatsion xarajat | Kassa | Kim kiritsa |
| C8 | Egasi pul oldi | Kassa | **Faqat admin** |
| C9 | Adminga topshiriq | Topshiriq (12.7) | Sotuvchi |
| C10 | Boshqa chiqim | Kassa, izoh majburiy | Kim kiritsa |

**C3 bo'yicha muhim istisno:** transport yoki bojxonani **yetkazib beruvchining o'zi to'lasa** — kassadan hech narsa chiqmaydi. Summa uning hisobiga kiradi va qarz bo'lib yoziladi. Kassa chiqimi faqat biz to'g'ridan-to'g'ri to'laganda bo'ladi.

### 12.7. Sotuvchidan adminga pul topshirish

Ikki bosqichli hodisa:

```
1. Sotuvchi "Topshirdim" belgilaydi  → yozuv yaratiladi, holati "kutilmoqda"
2. Adminga tasdiqlash boradi
3. Admin tasdiqlaydi                  → PUL KO'CHADI (bir marta, shu yerda)
```

**Pul tasdiqlangunicha sotuvchi kassasida turadi.** Admin tasdiqlaganda sotuvchi kassasidan chiqadi va admin kassasiga kiradi — bu bitta atomar ko'chish, ikkita alohida yozuv emas.

**Admin rad eta oladi** (summa mos kelmadi) — yozuv "rad etilgan" bo'ladi, pul qimirlamaydi, sotuvchi qaytadan belgilaydi.

So'm va dollar **alohida topshiriladi**.

`(topshiriq, ID)` takrorlanmaydi — sotuvchi tugmani necha marta bossa ham bitta yozuv.

### 12.8. Admindan sotuvchiga pul berish

Teskari yo'nalish: ertalab qaytim uchun boshlang'ich naqd.

**Tasdiqlash yo'q — pul darhol ko'chadi.** Admin berayotganda ikkalasi bir joyda turadi, tasdiqlash ortiqcha bosqich bo'lardi.

### 12.9. Ayirboshlash

Valyuta yoki shakl almashtirish. **Faqat admin** qila oladi.

| Nimadan | Nimaga |
|---|---|
| Naqd dollar | Naqd so'm |
| Naqd so'm | Naqd dollar |
| Karta | Naqd so'm |

**Maydonlar:** nimadan · nimaga · summa · **kurs** (sozlamadagi qiymat taklif qilinadi, input ichida o'zgartiriladi) · **komissiya** (summa yoki foiz) · izoh.

```
1 000 $ → so'm, kurs 13 200 = 13 200 000
bank komissiyasi 0.5%        =     66 000
kassaga kirdi                = 13 134 000
```

```
Kartadan 5 000 000 naqd yechildi
bank komissiyasi 1%          =     50 000
naqdga kirdi                 =  4 950 000
```

**Ayirboshlash kirim ham, chiqim ham emas** — ichki ko'chish. Foydaga ta'sir qilmaydi.

**Faqat komissiya real yo'qotish.** U alohida xarajat moddasiga tushadi: **"Bank komissiyasi va ayirboshlash"**. Kurs farqi (9.6) bilan aralashtirilmaydi — bu boshqa narsa.

**Bitta atomar yozuv.** Ikkita alohida yozuv qilinsa, bittasi storno qilinib ikkinchisi qolib ketishi mumkin.

### 12.10. Operatsion xarajatlar

Ijara, kommunal, internet, yoqilg'i, ta'mirlash, soliq, reklama, xo'jalik mollari, boshqa.

**Sotuvchi ham kirita oladi, chegara yo'q.** Admin barcha sotuvchilarning xarajatlarini ro'yxatda ko'rib turadi.

Maydonlar: modda · summa · valyuta · usul · **izoh majburiy** · chek rasmi (ixtiyoriy).

Moddalar ro'yxatini admin boshqaradi — yangisini qo'shadi, keraksizini nofaol qiladi.

Bu **haqiqiy xarajat**: kassadan ham chiqadi, foyda-zarar hisobotiga ham tushadi.

### 12.11. Egasi pul olishi va qo'shishi

**Faqat admin kassasidan.** Sotuvchi kassasidan olinmaydi.

**Xarajat emas** — foydaga ta'sir qilmaydi. Faqat kassa qoldig'ini o'zgartiradi va kassa oqimi hisobotida ko'rinadi.

Yozilmasa kassa hech qachon to'g'ri chiqmaydi.

### 12.12. Kassaga TEGMAYDIGAN hodisalar

Bu ro'yxat aniq bo'lishi shart — aks holda dasturchi ularni ham kassaga yozadi:

Chegirma · qarzga sotish · kirim hujjatining o'zi · defektni qarzdan chegirish · ombor braki · chiqindi · ishlab chiqarish braki · umidsiz qarz · xodim balansini tuzatish · **hisoblangan** ish haqi · kurs farqi · kirim stornosidan keyingi avans · qaytarishda **qarzdan chegirilgan** qism · qaytarishda **ushlab qolingan** summa.

**Oxirgi ikkitasi alohida e'tibor talab qiladi:**

**Qaytarishda qarzdan chegirilgan qism.** Qaytarish 230 000, mijoz qarzi 550 000 — hammasi qarzdan chegiriladi, naqd berilmaydi. Kassaga hech narsa yozilmaydi. **Faqat haqiqatan qo'ldan chiqqan pul kassaga tushadi.**

**Ushlab qolingan summa.** Pozitsiya 288 000, qaytarildi 230 000, farq 58 000. Bu 58 000 hech qayerdan **kelmagan** — shunchaki kamroq chiqdi. U hisobot qatori, kassa kirimi emas.

### 12.13. Ekranlar

1. **Kassa kitobi** — ko'rsatkichlar paneli, barcha harakat, filtr va yuguruvchi qoldiq
2. **Kirim** — turi tanlanadi, manba bog'lanadi
3. **Chiqim** — turi tanlanadi
4. **Ayirboshlash** — modal oyna, faqat admin
5. **Topshiriq** — sotuvchi belgilaydi, admin tasdiqlaydi
6. **Kun yopish** — sanash va farqni qayd etish
7. **Storno** — admin, sabab majburiy

### 12.14. Ruxsatlar

| Rol | Ko'radi | Qila oladi |
|---|---|---|
| **Admin** | Barcha kassa | Hammasi |
| **Sotuvchi** | **Faqat o'z kassasi** | Kirim, chiqim, xarajat, topshiriq |
| **Omborchi** | O'z kassasi (bo'lsa) | Yetkazib beruvchiga to'lov, ish haqi to'lovi |
| **Usta** | Ko'rmaydi | — |

Sotuvchi boshqa sotuvchining kassasini ko'rmaydi.

### 12.15. Storno

Kassa yozuvi **o'chirilmaydi**. Xato bo'lsa admin storno qiladi — teskari yozuv qo'shiladi, asli joyida qoladi (2.1-invariant).

Storno manba modulga ham qaytadi: buyurtma to'lovi storno qilinsa mijozning qarzi tiklanadi, ish haqi to'lovi storno qilinsa xodim balansi tiklanadi.

**Bitta yozuvga bitta storno.** Ikkinchisi bloklanadi.

### 12.16. Kassa sahifasining tepasi

Ikki qator: **qoldiq** va **oqim**. Undan keyin diqqat blokchasi.

**Qator 1 — hozir kassada nima bor**

```
Naqd so'm         12 480 000     Naqd dollar        1 240 $
Kartada            8 300 000     ┌──────────────────────────┐
                                 │ Sotuvchilarda   4 150 000│
Admin jami        20 780 000     │   Malika  2 800 000      │
                                 │   Aziz    1 350 000      │
                                 └──────────────────────────┘
```

**Sotuvchilardagi pul alohida ko'rsatiladi va admin summasiga qo'shilmaydi.** U pul admin qo'lida yo'q va uni sanab bo'lmaydi.

> Ko'p tizim shu joyda adashadi: jami raqam chiroyli chiqadi, lekin seyfda o'shancha pul yo'q.

**Qator 2 — bugun**

```
Kirim   4 200 000    Chiqim  1 850 000    Farq  +2 350 000
```

Yoniga kichik qatorda taqsimot: naqd 2 900 000 · karta 1 300 000. Kun oxirida sanaladigan narsa faqat naqd.

**Diqqat blokchasi** — har biri raqam va havola:

- Tasdiqlanmagan topshiriq — soni va summasi
- Kechagi kun yopilmagan
- Sotuvchida uzoq turib qolgan pul (3 kundan ortiq topshirilmagan)
- Yetkazib beruvchiga muddati o'tgan to'lov
- Chekssiz xarajatlar — bu oyda

### 12.17. Kun yopish

Kassaning yuragi. Har sotuvchi o'z kassasini yopadi.

```
KUN YOPISH — 14.08.2026 · Malika

Ertalabki qoldiq                    850 000
Kirim                             4 200 000
  sotuv naqd        2 900 000
  qarz to'lash        800 000
  boshqa              500 000
Chiqim                            1 850 000
  qaytarish           230 000
  xarajat             620 000
  adminga topshirdi 1 000 000
                                 ──────────
TIZIM BO'YICHA BO'LISHI KERAK     3 200 000

Haqiqatda sanadim              [ 3 150 000 ]
                                 ──────────
FARQ                                −50 000
Izoh (majburiy)  [ ............................ ]
```

**Farq bo'lsa izoh majburiy, lekin yopish bloklanmaydi.** Sotuvchini uyiga qo'ymay turib bo'lmaydi. Farq qayd etiladi va hisobotga tushadi.

**Yopilgan kunga orqadan yozuv qo'shib bo'lmaydi.** Aks holda kechagi farqni bugun "tuzatib" qo'yish mumkin bo'ladi va butun mexanizm ma'nosini yo'qotadi.

Kerak bo'lsa **admin kunni qayta ochadi** — sabab majburiy, audit jurnaliga tushadi.

**Kun yopish majburiy emas** — yopilmagan kun bo'lsa ham sotuvchi ertasi kuni ishlay oladi. Yopilmagan kunlar diqqat blokchasida ko'rinib turadi.

**Admin kassasida faqat naqd qismi yopiladi.** Kartadagi pulni sanab bo'lmaydi — u bank hisobidan tekshiriladi.

**Farqlar hisoboti** sotuvchi kesimida yig'iladi:

```
Sotuvchi   Yopilgan kun   Farq bo'lgan   Jami farq
Malika              22             3      −140 000
Aziz                22             0             0
```

> Bitta farq — tasodif. Uch oyda o'n besh marta — boshqa narsa.

### 12.18. Kassa kitobi

**Ustunlar:** sana-vaqt · kassa · turi · manba · izoh · kirim · chiqim · **yuguruvchi qoldiq** · kim · holati.

**Yuguruvchi qoldiq ustuni majburiy.** Usiz "ayni shu yozuvdan keyin qancha edi" degan savolga javob yo'q va farqni izlash imkonsiz bo'ladi.

**Filtrlar:** davr · kassa · turi · usul (naqd/karta) · valyuta · kim · summa oralig'i · **faqat storno** · **faqat qo'lda kiritilgan**.

Oxirgi ikkitasi tekshirish uchun eng kerakli filtr.

**Har qatorda manba havolasi** — "buyurtma №1247" bosilsa o'sha buyurtma ochiladi. Kassadan hodisaga qaytish yo'li doim ochiq bo'lishi kerak.

**Ixtiyoriy sanaga kesim.** "1-avgust kuni soat 18:00 da qancha edi?" — nizolarni hal qilishning yagona yo'li.

### 12.19. Qo'shimcha mexanizmlar

**Xarajat cheklari.** Har xarajatga rasm biriktiriladi. Chek yo'q bo'lsa qatorda belgi turadi va oy oxirida "chekssiz xarajat — 1 240 000" degan raqam ko'rinadi.

**Takroriy xarajatlar.** Ijara, internet, kommunal — har oy bir xil. Shablon: nomi, summa, kuni. Belgilangan kunda eslatma chiqadi, admin bosib tasdiqlaydi.

**Avtomatik yozilmaydi** — summa o'zgarishi mumkin va yozilib qolgan xarajat kassani buzadi.

**Yaxlitlash.** 1 386 400 so'mlik chekka mijoz 1 386 000 beradi. 400 so'm alohida moddaga yoziladi — **"yaxlitlash"**.

Chegara: **1 000 so'mgacha** sotuvchi o'zi yaxlitlaydi. Undan yuqorisi chegirma bo'lib yoziladi va chegirma qoidalariga bo'ysunadi (3.11).

> Alohida modda bo'lmasa, kun oxirida har safar mayda farq chiqadi va sotuvchi uni izlab o'tiradi.

### 12.20. Bu bandlarda qabul qilingan qarorlar

Quyidagilar muhokamada aniq javob olmagan va shu hujjatda birinchi marta belgilanmoqda. Kerak bo'lsa o'zgartiriladi:

| Nima | Qabul qilingan |
|---|---|
| Kun yopish majburiymi | **Yo'q** — yopilmagan kun ishlashga to'sqinlik qilmaydi |
| Admin kassasi yopiladimi | **Faqat naqd qismi** |
| Kunni kim qayta ocha oladi | **Faqat admin**, sabab majburiy |
| Yaxlitlash chegarasi | **1 000 so'm**, undan yuqorisi chegirma |

---

## 13. TELEGRAM BOT

### 13.1. Umumiy tuzilish

**Bitta bot dasturi, uchta panel.** `/start` bosilganda Telegram ID xodimlar bazasida tekshiriladi:

| Kim | Panel |
|---|---|
| Xodim, roli **usta** | Usta paneli |
| Xodim, roli **admin** | Admin paneli |
| Boshqa hamma | Mijoz paneli |

Xodimda bir nechta rol bo'lsa (10.3) — panellar orasida almashish tugmasi chiqadi.

**Sotuvchi uchun bot yo'q** — u saytda ishlaydi.

**Bot hech qachon yagona interfeys emas.** Har bir botdagi amalning saytda ham muqobili bor. Bot tezlik uchun, almashtirish uchun emas.

### 13.2. Mijoz boti — ro'yxatdan o'tish

```
/start
  ↓
👋 Assalomu alaykum! Jalyuzi buyurtma botiga xush kelibsiz.
   Buyurtma berish uchun ro'yxatdan o'ting.
  ↓
Ism — Telegramdan olinadi, tasdiqlash so'raladi
  ↓
Telefon — "Telefon raqamni ulashish" TUGMASI orqali
  ↓
✅ Ro'yxatdan o'tdingiz
```

**Telefon qo'lda yozilmaydi** — faqat Telegram tugmasi orqali. Shunda raqam haqiqiy bo'ladi.

**Mijoz bazaga yoziladi** (6-bo'lim), Telegram ID bog'lanadi.

**Dublikat tekshiruvi faqat telefon bo'yicha ishlaydi.** Telefon topilsa — mavjud mijozga bog'lanadi, yangisi yaratilmaydi.

> TZ 6.5-band ism bo'yicha ham bloklaydi. Botda bu qoida **qo'llanmaydi**: Telegram ismlari doim takrorlanadi ("Aziz", "Dilshod") va ikkinchi "Aziz" bazaga umuman tusha olmasdi.

Ism keyin sotuvchi tomonidan to'g'rilanadi.

### 13.3. Mijoz boti — menyu

| Tugma | Vazifasi |
|---|---|
| 🛒 Katalog | Matolar rasm va narx bilan |
| 📝 Buyurtma berish | Bosqichma-bosqich |
| 📋 Buyurtmalarim | Tarix va holat |
| 💰 Balansim | Qarz va to'lovlar |
| 📞 Bog'lanish | Aloqa ma'lumotlari |

**Katalog:** mahsulot turi tanlanadi, keyin o'sha turning matolari chiqadi. Narx bo'yicha **arzondan qimmatga** saralanadi. 10 tadan ko'p bo'lsa paginatsiya.

Har matoda: rasm · nomi · **shu mijoz uchun narx** (offset qo'llangan).

### 13.4. Mijoz boti — buyurtma oqimi

Oqim **konstruktordan** quriladi (4-bo'lim), qat'iy emas. Yangi mahsulot turi qo'shilsa botda avtomatik paydo bo'ladi.

```
1. Mahsulot turi tanlash          → Rollo, Kombo, Plisse, Dikke, Zashitka
2. Har SLOT uchun mato tanlash    → slotlar konstruktorda belgilangan (4.4)
                                     Rollo: old mato → orqa mato
                                     Dikke: oq chet → ko'k chet → ko'k o'rta
3. Eni kiritish (sm)
4. Bo'yi kiritish (sm)
5. Ixtiyoriy aksessuarlar         → majburiylari avtomatik, ko'rsatiladi
6. Xona / izoh (ixtiyoriy)
7. Savatga qo'shish yoki tasdiqlash
```

**Savat bor** — bitta buyurtmada bir nechta pozitsiya (3.9). "Yana qo'shish" tugmasi 1-bosqichga qaytaradi.

**Validatsiya:** 0, manfiy yoki harf → *"Noto'g'ri o'lcham, qaytadan kiriting"*.

**Slotda faol mato qolmagan bo'lsa** → *"Bu mahsulot uchun hozircha mato yo'q"* va boshqa turga o'tish taklif qilinadi.

**"Orqaga"** — bir bosqich orqaga. **"Bekor qilish"** — butun savat tozalanadi, tasdiq so'raladi.

### 13.5. Mijoz boti — narx

**Aniq narx ko'rsatiladi**, taxminiy emas.

Hisob TZ 3.8 formulasi bo'yicha: `Σ(slot sarflashi × slot matosi narxi) + Σ(aksessuar) + xizmat haqi`.

**Mijozning offseti qo'llanadi** (6.3). Offseti bo'lmagan mijozga standart narx.

Yaxlitlash butun so'mgacha, tiyin yo'q.

**Sotuvchi tasdiqlayotganda narxni o'zgartirsa** (3.8, 3.11) — mijozga xabar ketadi:

> *"Buyurtmangiz tasdiqlandi. Yakuniy narx: 430 000 so'm (avval 450 000). Chegirma: 20 000."*

Aks holda mijoz "botda boshqacha yozgan edi" deydi va sotuvchi tushuntirib o'tiradi.

### 13.6. Mijoz boti — buyurtma holati

Bot **9 ta statusni** ko'rsatmaydi — mijozga to'rttasi yetarli:

| Ichki status (8.3) | Mijoz ko'radi |
|---|---|
| Tasdiq kutmoqda | ⏳ Qabul qilindi, tasdiqlanmoqda |
| Tasdiqlangan · Materialga kutmoqda · Ishlab chiqarilmoqda | 🏭 Tayyorlanmoqda |
| Tayyor | 🎉 Tayyor, olib ketishingiz mumkin |
| Topshirilgan · Qaytarilgan · Rad etilgan · Bekor qilingan | ✔️ Yopilgan |

**"Materialga kutmoqda" mijozga ko'rsatilmaydi** — bu ichki muammo, mijozga sabab bo'lmaydi.

**Xabar yuboriladi:** buyurtma qabul qilinganda · tasdiqlanganda (narx bilan) · tayyor bo'lganda · bekor qilinganda · qarz eslatmasi.

**Har pozitsiya alohida statusda** bo'lishi mumkin (8.2). Botda shunday ko'rsatiladi: *"3 tadan: 1 tayyor, 2 tayyorlanmoqda"*.

### 13.7. Mijoz boti — balans

```
💰 BALANSIM

📋 Jami buyurtmalar: 5 ta
💵 Jami xarid: 2 450 000 so'm
💳 To'langan: 1 000 000 so'm
🔴 Qarz: 1 450 000 so'm
```

Balans TZ 6.8 dagi harakatlar yig'indisi — boshlang'ich qoldiq, avans va storno hisobga olinadi.

**So'm va dollar alohida ko'rsatiladi.**

Qarzi bo'lmasa: *"Qarzingiz yo'q."*

### 13.8. Usta boti

**Kirish:** Telegram ID xodimlar bazasida tekshiriladi, roli **usta** bo'lishi kerak.

| Tugma | Vazifasi |
|---|---|
| 📋 Umumiy navbat | Hali hech kim olmagan ishlar |
| 🔨 Mening ishlarim | Olgan, tugatmagan |
| ✔️ Tugatganlarim | Tarix |
| 💰 Balansim | Ishlagan, olgan, qolgan |

**Umumiy navbat.** Admin taqsimlamaydi — usta o'zi oladi (8.5).

```
🏭 NAVBAT

#1247 · poz. 1 — Rollo
📐 210 × 140 sm
🧵 Old: ko'k to'r · Orqa: kulrang zashitka
🎀 Mexanizm 1 · kronshteyn 2 · brelok 2
📅 Muddat: 10.08.2026

[ 🟢 Ishga olaman ]
```

**Narx ko'rsatilmaydi.** Faqat ishlab chiqarish ma'lumotlari.

**"Ishga olaman"** → status "Ishlab chiqarilmoqda". Ikki usta bir vaqtda bossa — birinchisi oladi, ikkinchisiga *"Bu ish allaqachon olingan"* (8.5).

**"Tugatdim"** → material yechiladi, ostatka yaratiladi, haq hisoblanadi va balansga qo'shiladi (7.5, 10.10). Amal **atomar** (7.3).

Avval olinmagan ishga "Tugatdim" bosilsa → *"Avval ishni olishingiz kerak"*.

**Qayta kesish so'rovi.** Usta noto'g'ri kesdi:

```
[ ⚠️ Qayta kesish so'rayman ]
  ↓
Sabab kiritiladi (majburiy)
  ↓
Adminga so'rov ketadi
  ↓
Admin tasdiqlaydi → material IKKINCHI marta yechiladi
```

**Material faqat admin tasdiqlaganda yechiladi** — so'rov paytida emas (12.4). Ushlanish keyin alohida hal qilinadi (10.13).

**Balans.** Usta o'z balansini ko'radi: hisoblangan haq, olingan pul, qolgan summa, brak ushlanmalari.

```
💰 BALANSIM

Bu oy bajardim: 31 ta · 2 180 000
Olganim: 940 000
Ushlangan: 100 000 (brak — #1245)
🟢 Qolgan: 1 240 000 so'm
```

**Ushlanmalar ham ko'rinadi.** Yashirilsa usta baribir farqni sezadi va ishonch yo'qoladi.

**Stavkasi belgilanmagan tur** navbatda ko'rinaveradi (10.12) — ish to'xtamaydi, haq 0 hisoblanadi, admin keyin qo'lda qo'shadi.

### 13.9. Admin boti

Admin saytda ishlaydi. Bot **tez javob berish** uchun.

**Bildirishnomalar:**

| Hodisa | Xabar |
|---|---|
| Qayta kesish so'rovi | Tasdiqlash / rad etish tugmasi bilan |
| Sotuvchi pul topshirdi | Tasdiqlash tugmasi bilan (12.7) |
| Ombordan hisobdan chiqarildi | Faqat xabar (7.9) |
| Kam qolgan material | Faqat xabar |
| Ustama chegaradan past | Faqat xabar (7.8) |
| Yetkazib beruvchiga muddat | Faqat xabar |
| Stavkasiz ish bajarildi | Faqat xabar (10.12) |
| Kun yopishda farq | Faqat xabar (12.17) |

**Botdan bajariladigan ikki amal:** qayta kesishni tasdiqlash va pul topshirig'ini tasdiqlash. Qolgan hammasi saytda.

**Ko'rish uchun:** bugungi tushum · kassa qoldig'i · ochiq buyurtmalar soni.

### 13.10. Takrorlanishdan himoya

Botdagi har tugma **idempotent** bo'lishi shart — Telegram xabarni qayta yuborishi, foydalanuvchi ikki marta bosishi mumkin.

| Tugma | Ikkinchi bosilganda |
|---|---|
| Ishga olaman | *"Bu ish allaqachon olingan"* |
| Tugatdim | *"Bu ish allaqachon tugatilgan"* |
| Tasdiqlash | *"Allaqachon tasdiqlangan"* |
| Buyurtma yuborish | *"Buyurtmangiz allaqachon yuborilgan: #1247"* |

Bu 12.3-banddagi `(manba, ID)` qoidasining bot tarafdagi ko'rinishi. Xabar UI darajasida, **haqiqiy himoya bazada**.

### 13.11. Bot ishlamay qolsa

**Foydalanuvchi botni bloklagan bo'lsa** — xabar yetib bormaydi. Bu qayd etiladi va:

- Mijoz bo'lsa: sotuvchiga *"Mijozga xabar yetib bormadi — qo'ng'iroq qiling"*
- Usta bo'lsa: adminga *"Ustaga xabar yetib bormadi"*

**Yuborilmagan xabarlar** buyurtma kartochkasining "Eslatmalar" tabida qizil holatda ko'rinadi va qayta yuborish tugmasi bo'ladi (6.7).

**Bot butunlay ishlamay qolsa** ishlab chiqarish to'xtamasligi kerak: usta ishini saytdan ham olishi va tugatishi mumkin. Bu 13.1-banddagi "bot yagona interfeys emas" qoidasi.

### 13.12. Bu bo'limda qabul qilingan qarorlar

| Nima | Qabul qilingan |
|---|---|
| Nechta bot | **Bitta bot dasturi, uchta panel**. Rol Telegram ID orqali aniqlanadi |
| Botda ism dublikati | **Tekshirilmaydi**, faqat telefon bo'yicha |
| Mijozga status | **To'rtta guruh**, ichki 9 ta emas |
| Materialga kutmoqda | Mijozga **ko'rsatilmaydi** |
| Narx o'zgarsa | Mijozga **xabar ketadi**, farq va sababi bilan |
| Ustaga ushlanmalar | **Ko'rinadi** |

---

## 14. SOZLAMALAR VA RUXSATLAR

### 14.1. Ekranlar

1. Asosiy sozlamalar
2. Kengaytirilgan sozlamalar
3. Kurs va uning tarixi
4. Ruxsatlar matritsasi
5. Bildirishnoma qoidalari
6. Bot matnlari
7. Spravochniklar (xarajat moddalari, almashtirish guruhlari, takroriy xarajatlar)

### 14.2. Ikki darajali tuzilish

Sozlamalar **ikki bo'limga** ajratiladi:

**Asosiy** — kundalik ishda o'zgaradigan, ochiq turadi:
kurs · standart ustama chegarasi · chegirma limiti · yaxlitlash chegarasi · korxona ma'lumotlari.

**Kengaytirilgan** — yopiq bo'lim, admin ochadi. Bir marta sozlanadi va kamdan-kam tegiladi:
kesish bag'rikengligi · tasdiqlanmagan buyurtma chegarasi · uxlab qolgan mijoz chegarasi · qimirlamagan material chegarasi · topshirilmagan pul chegarasi va boshqalar.

> Hammasi bitta ro'yxatda tursa ekran qirq qatorli bo'ladi va hech kim uni o'qimaydi. Muhim to'rt-besh sozlama ko'rinmay qoladi.

### 14.3. Asosiy sozlamalar

| Sozlama | Standart | Qayerda ishlatiladi |
|---|---|---|
| **Kurs** (1 $ = so'm) | — | Butun tizim (1.3) |
| **Standart ustama chegarasi** | 30% | Kirimda tekshiruv (5.4, 7.8) |
| **Chegirma limiti** | — | Sotuvda ogohlantirish (3.11) |
| **Yaxlitlash chegarasi** | 1 000 so'm | Kassa (12.19) |
| **Korxona ma'lumotlari** | — | Chek va hisob-kitob varaqasi |

Korxona ma'lumotlari: nomi · manzili · telefoni · logotipi. Chek, kvitansiya, hisob-kitob varaqasi va ish varaqasida chiqadi.

### 14.4. Kengaytirilgan sozlamalar

| Sozlama | Standart | Band |
|---|---|---|
| Kesish bag'rikengligi | 1 sm | 7.5 |
| Minimal ostatka chegarasi — standart | 0.5 m | 5.5 |
| Tasdiqlanmagan bot buyurtmasi — ogohlantirish | 24 soat | 8.4 |
| Uxlab qolgan mijoz chegarasi | 90 kun | 6.7 |
| Qimirlamagan material chegarasi | 6 oy | 11.7.6 |
| Topshirilmagan pul chegarasi | 3 kun | 12.16 |
| Debitorlik yosh guruhlari | 30/60/90 kun | 11.4.5 |

**Har sozlama yonida qayerda ishlatilishi yozilgan bo'ladi.** Admin raqamni o'zgartirishdan oldin nimaga ta'sir qilishini ko'radi.

Material darajasida alohida qiymat belgilangan bo'lsa (5.4, 5.5) — u standartdan ustun turadi.

### 14.5. Kurs va uning tarixi

Kurs qo'lda yangilanadi. **Har o'zgarish jurnalga yoziladi:** sana-vaqt · eski qiymat · yangi qiymat · kim o'zgartirdi.

**Kurs tarixi saqlanishi majburiy.** Uchta joy unga tayanadi:

- Kirim tannarxi kirim kunidagi kursda qotiriladi (9.6)
- Buyurtma yaratilgan paytdagi kurs bilan saqlanadi (8.13)
- Kurs farqi ikki kurs ayirmasidan hisoblanadi (9.6)

> Faqat joriy kurs saqlansa, o'tgan oyning hisobotini qayta ochganda eski kurs yo'qoladi va raqamlar o'zgarib ketadi — bu 2.3-invariantni buzadi.

Kurs o'zgartirilganda ogohlantirish chiqadi: *"Bu kurs bugundan boshlab ishlaydi. Eski yozuvlar o'zgarmaydi."*

Audit jurnaliga tushadi (2.4).

### 14.6. Ruxsatlar matritsasi

**Rol × amal** ko'rinishidagi jadval, checkbox bilan. Admin o'zi sozlaydi.

**Standart holat: barcha huquq adminda.** Qolgan rollarga admin o'zi beradi — hech narsa oldindan ochiq emas.

Ruxsat **amal darajasida** beriladi, bo'lim darajasida emas:

```
OMBOR
  ☑ Ko'rish
  ☑ Kirim hujjati yaratish
  ☐ Hisobdan chiqarish
  ☐ Storno
  ☐ Material narxini o'zgartirish

KASSA
  ☑ O'z kassasini ko'rish
  ☐ Barcha kassani ko'rish
  ☑ Kirim / chiqim
  ☐ Ayirboshlash
  ☐ Storno
```

> Bo'lim darajasi yetarli emas: omborchiga kirim qilishga ruxsat berib, hisobdan chiqarishni taqiqlash kerak bo'lishi mumkin. Bitta "Ombor — ha/yo'q" bayrog'i buni ajrata olmaydi.

**Bloklanadi:** admin o'zining **"sozlamalarni o'zgartirish"** huquqini olib qo'ya olmaydi. Aks holda tizimga kirish yo'li yopiladi va uni faqat bazadan tuzatish mumkin bo'ladi.

Xodimda bir nechta rol bo'lsa (10.3) — **ruxsatlar yig'indi** bo'ladi.

Har o'zgarish audit jurnaliga tushadi.

### 14.7. Bildirishnoma qoidalari

Tizimdagi har avtomatik xabar uchun uchta sozlama:

| Nima | Variantlar |
|---|---|
| **Holati** | Yoqilgan / o'chirilgan |
| **Kimga** | Rol yoki aniq xodim (bir nechta bo'lishi mumkin) |
| **Kanal** | Bot · saytdagi qo'ng'iroqcha · **ikkalasi** |

**Bir vaqtda ikki kanalga borishi mumkin.** Muhim xabar botda ham, saytda ham ko'rinadi — admin qaysi birida ekanini bilmaydi.

**Standart: barcha xabar adminga boradi.** Boshqa rollarga admin o'zi qo'shadi.

Xabarlar ro'yxati:

| Xabar | Manba |
|---|---|
| Yangi bot buyurtmasi | 8.4 |
| Tasdiqlanmagan buyurtma — chegaradan oshdi | 8.4 |
| Qayta kesish so'rovi | 2.9 |
| Sotuvchi pul topshirdi | 12.7 |
| Ombordan hisobdan chiqarildi | 7.9 |
| Hisobdan chiqarish o'zgartirildi yoki bekor qilindi | 7.9 |
| Kam qolgan material | 5.5 |
| Ustama chegaradan past | 7.8 |
| Yetkazib beruvchiga to'lov muddati | 9.4 |
| Stavkasiz ish bajarildi | 10.12 |
| Kun yopishda farq | 12.17 |
| Manfiy qoldiq paydo bo'ldi | 2.5 |
| Chegirma limitidan oshdi | 3.11 |
| Buyurtma muddati o'tdi | 8.16 |
| Materialga kutmoqda | 8.12 |
| Mijozga xabar yetib bormadi | 13.11 |

### 14.8. Bot matnlari

Barcha bot xabari sozlamadan tahrirlanadi — matnni o'zgartirish uchun dasturchi kerak emas.

**Matnlarda o'zgaruvchilar ishlatiladi:**

```
Hurmatli {mijoz_ismi}, buyurtmangiz #{buyurtma_raqami} tayyor.
Summa: {summa} so'm. Qarzingiz: {qarz} so'm.
```

**Har xabar uchun mavjud o'zgaruvchilar ro'yxati yonida ko'rsatiladi.** Admin qaysilarini ishlatishi mumkinligini ko'radi va bosib qo'shadi.

**Tekshiruv:** matnda noma'lum o'zgaruvchi bo'lsa saqlanmaydi va xato ko'rsatiladi. Aks holda mijozga `{noma'lum_maydon}` ko'rinishidagi xabar ketadi.

**Oldindan ko'rish** — namuna qiymatlar bilan matn qanday chiqishi ko'rsatiladi.

Tahrirlanadigan matnlar: salomlashish · ro'yxatdan o'tish · buyurtma holati xabarlari · qarz eslatmasi · bog'lanish ma'lumotlari · xato xabarlari · tugma nomlari.

### 14.9. Spravochniklar

Bir joyda boshqariladigan ro'yxatlar:

| Spravochnik | Band |
|---|---|
| Operatsion xarajat moddalari | 12.10 |
| Almashtirish guruhlari | 5.6 |
| Takroriy xarajat shablonlari | 12.19 |
| Qaytarish sabablari | 8.10 |
| Hisobdan chiqarish sabablari | 7.9 |
| Balansni tuzatish sabablari | 10.14 |

Har birida: qo'shish · tahrirlash · nofaol qilish.

**O'chirish yo'q** (2.1-invariant) — ishlatilgan qiymat nofaol qilinadi va eski yozuvlarda ko'rinaveradi.

**Ishlatilayotgan yagona qiymatni nofaol qilish bloklanadi** — masalan "Naqd" to'lov usuli o'chirilsa kassa ishlamay qoladi.

### 14.10. Bu bo'limda qabul qilingan qarorlar

| Nima | Qabul qilingan |
|---|---|
| Kurs tarixi | **Saqlanadi**, o'zgarishlar jurnali bilan |
| Admin o'z huquqini olib qo'yishi | **Bloklanadi** |
| Bir nechta rol | Ruxsatlar **yig'indi** |
| Bot matnida noma'lum o'zgaruvchi | Saqlanmaydi, xato ko'rsatiladi |
| Spravochnikdagi yagona faol qiymat | Nofaol qilish bloklanadi |

---

## 15. QO'SHIMCHA MODULLAR

Bu bo'lim asosiy modullar yopilgandan keyin qo'shildi. Ular tizim ishlashi uchun shart emas, lekin ularsiz uchta narsa ko'rinmay qoladi: ombordagi haqiqiy holat, nima sotib olish kerakligi va kun oxiridagi umumiy manzara.

### 15.1. Inventarizatsiya

**Vazifasi.** Tizim ko'rsatgan qoldiq bilan omborda haqiqatan turgan miqdorni solishtirish.

**Kim qiladi.** Omborchi. **Admin tasdig'i kutilmaydi** — kiritilgan zahoti qoldiq o'zgaradi va adminga xabar ketadi.

> Bu hisobdan chiqarish bilan bir xil qoida (7.10). Omborchi ishlashda erkin, lekin hech narsa ko'rinmay qolmaydi.

**To'liq va qisman.** Butun omborni sanash shart emas. Inventarizatsiya **tanlangan materiallar** bo'yicha ham o'tkaziladi — masalan faqat mexanizmlar, yoki faqat bitta mato.

**Sanash varaqasi.** Chop etiladi va unda **tizim raqami ko'rinadi**. Omborchi yoniga haqiqiy sonni yozadi.

```
INVENTARIZATSIYA — 15.08.2026 · Anvar

Material                    Birlik   Tizimda    Haqiqatda    Farq
Ko'k mato · to'r            kv.m       48.00    [        ]
  R-118 rulon                          28.00    [        ]
  O-207 qoldiq kesma  1.80×2.00         3.60    [        ]
  O-211 qoldiq kesma  2.50×1.84         4.60    [        ]
Kronshteyn · oddiy          dona          380    [        ]
Rollo mexanizmi · Xitoy     dona          124    [        ]
```

**Rulon va qoldiq kesma alohida sanaladi** — har bo'lak o'z qatorida, o'lchami bilan. Aks holda "48 kv.m bor" degan javob hech narsani tekshirmaydi.

**Farq chiqsa:**

- **Sabab majburiy.** Ro'yxat: hisobga olinmagan chiqindi · o'lchov xatosi · yo'qolgan · noto'g'ri kirim · boshqa
- Qoldiq **haqiqiy songa** tenglashadi
- Farq tannarx bo'yicha hisoblanadi va foyda-zarar hisobotiga **xarajat** bo'lib tushadi
- Ortiqcha chiqsa — daromad emas, **xarajat kamayishi**

**Yozuv o'chirilmaydi.** Xato bo'lsa admin storno qiladi (2.1).

**Inventarizatsiya farqlari hisoboti.** Omborchi va material kesimida, davr bo'yicha:

```
Omborchi   O'tkazilgan   Farq bo'lgan   Jami farq (tannarx)
Anvar               12              7        −1 840 000
```

> Ombor uchta yo'l bilan kamayishi mumkin: hisobdan chiqarish (7.10), qo'lda korrektsiya, inventarizatsiya. Uchalasi ham omborchi qo'lida va admin tasdig'isiz. Shuning uchun bu hisobot majburiy — u yagona nazorat vositasi.

**Oxirgi inventarizatsiya sanasi** material kartochkasida ko'rinadi. Uzoq sanalmagan materiallar alohida filtrda chiqadi.

### 15.2. Yetishmayotgan materiallar

**Vazifasi.** Qaysi material nechta buyurtmani to'xtatib turganini bir ekranda ko'rsatish.

TZ 8.12-bandda "Materialga kutmoqda" statusi bor, lekin u buyurtma tarafda. Omborchi qaysi materialni birinchi olish kerakligini bilmaydi.

```
Material              Kutmoqda   Kerak      Bo'sh    Yetishmaydi   Eng eski
Oq plisse              2 poz.    9.00 kv.m  1.20     7.80          10.08 (5 kun)
Ko'k mato · to'r       1 poz.    2.94 kv.m  0.00     2.94          13.08 (2 kun)
Alyuminiy karniz       3 poz.    6.30 m     2.70     3.60          09.08 (6 kun)
```

Har qatorda havola — bosilganda o'sha materialni kutayotgan pozitsiyalar ro'yxati ochiladi.

**Kirim bo'lgach pozitsiyalar avtomatik navbatga qaytadi** va bo'lak eng eski buyurtmaga band qilinadi (8.12).

Bu ko'rinish ombor sahifasining "diqqat" blokchasida ham raqam bo'lib turadi (11.11).

### 15.3. Xarid ro'yxati

**Vazifasi.** Nima sotib olish kerakligini tizim o'zi hisoblab beradi.

**Formula:**

```
kerak = tasdiqlangan buyurtmalar ehtiyoji
      − bo'sh qoldiq
      + kam qoldiq chegarasi
```

Uchinchi qism zaxira uchun: material aynan nolga tushmasin, chegara darajasida qolsin.

```
XARID RO'YXATI — 15.08.2026

"Tekstil Savdo" MCHJ
  Oq plisse           kerak 7.80    chegara 8.00    olish: 16.00 kv.m
  Ko'k mato · to'r    kerak 2.94    chegara 10.00   olish: 13.00 kv.m

"Alfa Furnitura"
  Kronshteyn          kerak 0       chegara 50      olish: 0 dona  (yetarli)

"Karniz Plus"
  Alyuminiy karniz    kerak 3.60    chegara 15.00   olish: 19.00 m
```

**Yetkazib beruvchi bo'yicha guruhlanadi** — bitta yetkazib beruvchiga bitta qo'ng'iroq.

**Har material yonida:** oxirgi kirim narxi va sanasi, narx o'zgarishi foizi (9.8).

**Bir material bir necha yetkazib beruvchidan kelsa** — hammasi ko'rsatiladi, narxi bilan. Tanlash odamning ishi.

**Ro'yxat saqlanmaydi** — har ochilganda joriy ma'lumotdan hisoblanadi. Excelga eksport qilinadi (11.2).

> Tizimda "yetkazib beruvchiga buyurtma berish" tushunchasi yo'q (9.12). Xarid ro'yxati faqat **hisoblab beradi**, buyurtma bermaydi. Mol kelganda kirim hujjati yoziladi.

### 15.4. Kunlik yopish varaqasi

**Vazifasi.** Kun oxirida bitta A4 varaq: bugun nima bo'ldi, nima ochiq qoldi. Chop etib qo'yish uchun.

```
KUN YAKUNI — 15.08.2026 · Malika

KASSA
  Ertalabki qoldiq                     850 000
  Kirim                              4 200 000
  Chiqim                             1 850 000
  Bo'lishi kerak                     3 200 000
  Sanadim                          [           ]
  Farq                             [           ]
  Izoh                             [                              ]

BUGUN
  Yangi buyurtma            7 ta      4 820 000
  Topshirildi               5 ta
  Qaytarildi                1 ta        230 000
  Qarz to'landi             3 ta        800 000

OCHIQ QOLDI
  Tasdiq kutmoqda           2 ta
  Tayyor, topshirilmagan    8 ta
  Materialga kutmoqda       2 ta
  Muddati o'tgan            3 ta

ERTAGA MUDDATI KELADI
  #1251  Nilufar Sattorova   2 poz.
  #1253  Oyna Dekor MCHJ     1 poz.

Imzo: ____________
```

**Kassa qismi 12.17-band bilan bitta narsa** — ikkita alohida ekran yasalmaydi. Kunlik varaqa o'sha kun yopish oynasining chop etiladigan ko'rinishi, ustiga buyurtma ma'lumoti qo'shilgan.

**Admin uchun** varaqa boshqacha bo'ladi: barcha sotuvchining kassasi, sotuvchilardagi pul, kartadagi pul, umumiy tushum.

### 15.5. Bu bo'limda qabul qilingan qarorlar

| Nima | Qabul qilingan |
|---|---|
| Inventarizatsiya tasdig'i | Kerak emas — omborchi kiritadi, adminga xabar |
| Sanash varaqasida tizim raqami | **Ko'rinadi** |
| Inventarizatsiya qamrovi | To'liq yoki qisman — tanlangan materiallar bo'yicha |
| Ortiqcha chiqqan farq | Daromad emas, **xarajat kamayishi** |
| Xarid ro'yxati | Faqat hisoblaydi, buyurtma bermaydi |
| Kunlik varaqa va kun yopish | **Bitta narsa**, ikkita ekran emas |

---

## 16. EDGE CASE'LAR

### 16.1. Format

Har edge case **yetti maydon**. Undan kam bo'lsa dasturchi taxmin qiladi, ko'p bo'lsa hech kim to'ldirmaydi.

```
EC-OMB-07 · Ostatka buyurtmadan bir necha mm kichik
Band:       7.5 (kesish algoritmi)
Qachon:     Ostatka 0.90 × 1.40 m. Buyurtma 90.2 × 140 sm.
            Formal jihatdan sig'maydi — farq 2 mm.
Qaror:      1 sm gacha bag'rikenglik beriladi. Bo'lak mos deb
            hisoblanadi, kesiladi. Farq chiqindiga yozilmaydi.
Kim ko'radi: Hech kim. Usta uchun oddiy kesim, ogohlantirish yo'q.
Nega:       Qat'iy tekshiruv ustani "material yetishmaydi"ga
            olib boradi, u yangi rulon ochadi — butun bo'lak
            behuda qoladi. 2 mm amalda kesishda yo'qoladi.
Tekshirish: 0.90 × 1.40 bo'lakka 90.2 × 140 → kesiladi.
            91.5 × 140 → rad etiladi (1.5 sm > 1 sm).
Holati:     KELISHILDI · 13.08.2026
```

**Yozish qoidalari**

- **Har doim aniq raqam bilan.** "Katta buyurtma" emas — "3.5 m eni". Raqamsiz edge case tekshirib bo'lmaydi.
- **"Qachon" — faqat sharoit, qaror emas.** Aralashsa, keyin o'qigan odam nimaga rozi bo'lganini ajrata olmaydi.
- **"Nega" bitta jumla, lekin majburiy.** Uch oydan keyin bu qaror g'alati ko'rinadi va kimdir uni "soddalashtirmoqchi" bo'ladi.
- **"Tekshirish" ikki misol:** biri o'tadi, biri o'tmaydi. Chegara qayerdaligi shunda ko'rinadi.
- **Nomerlash:** `EC-<MODUL>-<NN>`. Modullar: OMB, SOT, KAS, MIJ, ICH, BOT, HIS.
- **Joylashuvi:** har bo'lim oxirida. Alohida ilova qilinsa dasturchi asosiy matnni o'qib, edge case'larni ko'rmay ketadi.

**Bo'lim yopilishi uchun barcha edge case KELISHILDI holatida bo'lishi shart.**

### 16.2. Ombor edge case'lari

| Kod | Holat | Qaror | Holati |
|---|---|---|---|
| EC-OMB-01 | Ostatka L shaklida chiqadi | Ostatka doim to'rtburchak. Usta doim to'liq kenglikda kesadi. | KELISHILDI |
| EC-OMB-02 | Bir buyurtmada bir xil matodan bir nechta parda | Birlashtirib kesiladi, bitta uzun ostatka qoladi | KELISHILDI |
| EC-OMB-03 | Ostatka aynan buyurtma o'lchamiga teng | Nol qiymatli ostatka yaratilmaydi, bo'lak butunlay yopiladi | KELISHILDI |
| EC-OMB-04 | Ostatka bir necha mm kichik | 1 sm bag'rikenglik | KELISHILDI |
| EC-OMB-05 | Kesimdan aynan chegaraga teng bo'lak qoldi | Chegaradan kichik bo'lsa chiqindi taklif qilinadi, teng bo'lsa saqlanadi. Usta o'zgartira oladi (7.6) | KELISHILDI |
| EC-OMB-06 | Ostatka ostatkadan tug'ildi (uchinchi avlod) | Kelib chiqish zanjiri to'liq saqlanadi — tannarx zanjir orqali keladi | KELISHILDI |
| EC-OMB-07 | Brak qilinayotgan bo'lakka usta "Tugatdim" bosdi | Lock omborchi bilan usta orasida ham ishlaydi (7.3) | KELISHILDI |
| EC-OMB-08 | Brakni bekor qilish qoldiqni manfiyga tushiradi | Bloklanmaydi. Qoldiq manfiy bo'lib turaveradi, qizil belgi, adminga xabar | KELISHILDI |
| EC-OMB-09 | Butun rulon ochilmasdan brakka chiqadi | Ostatkalarga bo'linmaydi, butunligicha yechiladi | KELISHILDI |
| EC-OMB-10 | Material oxirgi slotdan uzildi, qoldig'i bor | Ogohlantirish chiqadi, qoldiq ombor hisobotida qoladi | KELISHILDI |
| EC-OMB-11 | Sarflash formulasi o'zgartirildi, ochiq buyurtmalar bor | Eski formula bo'yicha yechiladi (4.10) | KELISHILDI |
| EC-OMB-12 | Almashtirish guruhidagi yagona variant nofaol qilindi | Nofaol qilish bloklanadi (5.9) | KELISHILDI |
| EC-OMB-13 | Kirim storno qilinadi, undan allaqachon kesilgan | To'liq storno. Qoldiq manfiyga tushadi, admin tuzatadi (7.11) | KELISHILDI |
| EC-OMB-14 | Bir kirimda bir xil material ikki xil narxda | Ikki qator bo'lib kiritiladi, har biri o'z tannarxi bilan | KELISHILDI |
| EC-OMB-15 | Yetkazib beruvchi yo'qoldi, "qaytariladi" yozuvi osilib qoldi | Admin umidsiz deb hisobdan chiqaradi (7.8) | KELISHILDI |
| EC-OMB-16 | Usta "Tugatdim" ni xato bosdi | Bitta atomar teskari operatsiya: material tiklanadi, ostatka o'chiriladi | KELISHILDI |
| EC-OMB-18 | Band qilingan bo'lak 30 kun qimirlamadi | Band avtomatik bo'shaydi, adminga xabar (7.3) | KELISHILDI |
| EC-OMB-19 | Usta ostatka o'rniga rulondan kesdi | "Tugatdim" da manbani o'zgartiradi, ogohlantirish chiqadi, hisobotga tushadi (7.6, 11.7.7) | KELISHILDI |
| EC-OMB-20 | Kesim egri chiqdi, bo'lak kichikroq | Usta haqiqiy o'lchamni kiritadi, farq chiqindiga (7.6) | KELISHILDI |
| EC-OMB-21 | Usta boshqa ostatkani olgan | Muhim emas — aniq bo'lak kuzatilmaydi, faqat manba (7.6) | KELISHILDI |
| EC-OMB-22 | Ostatka bor turib rulon ochildi | Ogohlantirish, bloklamaydi, jurnalga va hisobotga yoziladi (7.6) | KELISHILDI |
| EC-OMB-23 | Bo'lak eni 0.5–1.0 m oralig'ida | "Kam ishlatiladigan" belgisi bilan saqlanadi (7.5) | KELISHILDI |
| EC-OMB-24 | Pozitsiya bekor qilindi, bo'lak band edi | Band bo'shaydi (7.3) | KELISHILDI |
| EC-OMB-25 | Usta kesim o'lchamini tuzatdi | Farq chiqindiga yoziladi (7.6) | KELISHILDI |
| EC-OMB-17 | Buyurtma bekor qilindi, mahsulot allaqachon tayyor | "Sotilmagan tayyor mahsulot" ro'yxatiga tushadi (7.12) | KELISHILDI |

### 16.3. Mijozlar edge case'lari

| Kod | Holat | Qaror | Holati |
|---|---|---|---|
| EC-MIJ-01 | Ikki xil odamning ismi bir xil | Bloklanadi, mavjud mijozning telefoni ko'rsatiladi | KELISHILDI |
| EC-MIJ-02 | Qarzi bor mijozni nofaol qilish | Bloklanadi (6.6) | KELISHILDI |
| EC-MIJ-03 | Kurs o'zgardi, mijoz limitdan oshdi | Ongli qabul qilingan xavf (6.4) | KELISHILDI |
| EC-MIJ-04 | Hisobdan chiqarilgan qarzni mijoz to'ladi | Kassaga "boshqa kirim", balansga qo'shilmaydi (6.10) | KELISHILDI |
| EC-MIJ-05 | Mijozda ikki valyutada qarz, hammasini to'lamoqchi | Bitta operatsiyada bitta valyuta, ikkita yozuv | KELISHILDI |
| EC-MIJ-06 | Import qilingan mijozning eski qarzi | "Boshlang'ich qoldiq" qatori (6.8) | KELISHILDI |

### 16.4. Buyurtma edge case'lari

| Kod | Holat | Qaror | Holati |
|---|---|---|---|
| EC-BUY-01 | Botdan kelgan buyurtma tasdiqsiz yotibdi | Avtomatik bekor bo'lmaydi. 24 soatdan oshgani qizil, sotuvchiga bildirishnoma (8.4) | KELISHILDI |
| EC-BUY-02 | Sotuvchi bot buyurtmasini tasdiqlashdan oldin tahrirlaydi | Erkin tahrirlanadi, har o'zgarish tarixga yoziladi | KELISHILDI |
| EC-BUY-03 | Tasdiqlangan buyurtmaga yangi pozitsiya qo'shish | Mavjud buyurtmaga qo'shiladi, yangisi ochilmaydi (8.7) | KELISHILDI |
| EC-BUY-04 | "Ishlab chiqarilmoqda" da mijoz o'zgartirish so'radi | Tahrirlash yo'q. Bekor qilinadi, yangisi qo'shiladi | KELISHILDI |
| EC-BUY-05 | Usta ishga oldi, lekin tashlab ketdi | Usta o'zi qaytara olmaydi. Admin qaytarib oladi, stavkani qo'lda kiritadi (8.6) | KELISHILDI |
| EC-BUY-06 | Ikki usta bitta pozitsiyani birga oldi | Birinchi so'rov oladi, ikkinchisiga rad javobi (8.5) | KELISHILDI |
| EC-BUY-07 | Usta noto'g'ri kesdi | Qaytarish emas — ishlab chiqarish braki (8.11) | KELISHILDI |
| EC-BUY-08 | Material yetmadi, keyin kirim keldi | Bo'lak eng eski buyurtmaga band qilinadi (8.12) | KELISHILDI |
| EC-BUY-09 | Qisman topshirilgan buyurtma qachon yopiladi | Barcha pozitsiya yopiq statusda bo'lganda. Shunda chek chiqadi (8.9) | KELISHILDI |
| EC-BUY-10 | Mijoz tayyor mahsulotni olishga kelmayapti | Avtomatik hech narsa. Admin "Rad etilgan" ga o'tkazadi (8.8) | KELISHILDI |
| EC-BUY-11 | Qaytarilgan pozitsiya qayta qaytariladi | Mumkin emas. Yopiq statusdan chiqish yo'q, xato bo'lsa storno | KELISHILDI |
| EC-BUY-12 | Butun buyurtma qaytarildi | Alohida amal yo'q — pozitsiyalar birma-bir qaytariladi | KELISHILDI |
| EC-BUY-13 | Qaytarishda mijoz avansda qoladi | Sotuvchi tanlaydi: naqd berish yoki avans qoldirish (8.10) | KELISHILDI |
| EC-BUY-14 | Mijozsiz buyurtma qaytarildi | Qarz yo'q, hammasi kassadan naqd (8.10) | KELISHILDI |
| EC-BUY-15 | Buyurtma xato kiritilgan | Bekor qilish emas — admin storno qiladi, hisobotda alohida (8.8) | KELISHILDI |
| EC-BUY-16 | Chegirma limitidan oshdi | Ogohlantirish, sotuvchi davom etadi, audit jurnaliga (8.13) | KELISHILDI |
| EC-BUY-17 | Buyurtma dollarda, to'lov so'mda | Buyurtma yaratilgan paytdagi kurs (8.13) | KELISHILDI |

### 16.5. Yetkazib beruvchi edge case'lari

| Kod | Holat | Qaror | Holati |
|---|---|---|---|
| EC-YET-01 | Avans bor, kirim undan kichik | Avansdan yechiladi, qolgani balansda musbat turaveradi | KELISHILDI |
| EC-YET-02 | Avans bor, kirim undan katta | Avans yeyiladi, qolgani qarz bo'ladi | KELISHILDI |
| EC-YET-03 | Dollar qarzi so'mda to'landi, kurs qo'lda o'zgartirildi | Kiritilgan kurs ishlaydi, kurs farqi shu bo'yicha hisoblanadi, audit jurnaliga tushadi | KELISHILDI |
| EC-YET-04 | To'lov qarzdan ko'p | Ortiqchasi avansga o'tadi | KELISHILDI |
| EC-YET-05 | Kurs tushdi — farq foydali chiqdi | **Alohida modda**: "Kurs farqi — daromad". Xarajat moddasidan ajratilgan (9.6) | KELISHILDI |
| EC-YET-06 | Bitta to'lov bir nechta hujjatni yopadi | Eng eskisidan ketma-ket, oxirgisi qisman qolishi mumkin | KELISHILDI |
| EC-YET-07 | Qo'shimcha xarajat kirimdan keyin ma'lum bo'ldi | Hujjat tahrirlanadi, tannarx qayta hisoblanadi. Sotilgan mahsulotlarga tegilmaydi (9.12) | KELISHILDI |
| EC-YET-08 | Kirimda bitta qator, qo'shimcha xarajat bor | Hammasi o'sha qatorga tushadi, taqsimlash kerak emas | KELISHILDI |
| EC-YET-09 | Ustama manfiy — tannarx sotuv narxidan yuqori | Qizil ogohlantirish, adminga xabar, bloklamaydi | KELISHILDI |
| EC-YET-10 | Qarzimiz bor yetkazib beruvchini nofaol qilish | Bloklanadi (9.10) | KELISHILDI |
| EC-YET-11 | Ochiq da'vo bor, hujjat to'liq to'landi | Da'vo ochiq qolaveradi. Yopilganda balans avansga o'tadi | KELISHILDI |
| EC-YET-12 | Bitta material ikki yetkazib beruvchidan keladi | Mumkin. Narx tarixi har birida alohida, tannarx kirim bo'yicha (7.7) | KELISHILDI |

### 16.6. Xodim va ish haqi edge case'lari

| Kod | Holat | Qaror | Holati |
|---|---|---|---|
| EC-XOD-01 | Stavka o'zgartirildi, eski ishlar bor | "Tugatdim" paytidagi stavka snapshot qilingan, o'zgarmaydi (10.10) | KELISHILDI |
| EC-XOD-02 | Bir ishni ikki usta bajardi | Tizim bo'lmaydi. "Tugatdim" bosgan to'liq oladi (10.11) | KELISHILDI |
| EC-XOD-03 | Stavkasi 0 bo'lgan tur bajarildi | Navbatga tushaveradi, haq 0, adminga xabar, keyin qo'lda tuzatiladi (10.12) | KELISHILDI |
| EC-XOD-04 | Xodim ishlaganidan ko'p oldi | Balans manfiyga tushadi, bloklanmaydi (10.4) | KELISHILDI |
| EC-XOD-05 | Manfiy balansda ishdan bo'shadi | Admin hisobdan chiqaradi, sabab majburiy, xarajatga tushadi (10.4) | KELISHILDI |
| EC-XOD-06 | Balansi bor xodimni nofaol qilish | Bloklanadi (10.4) | KELISHILDI |
| EC-XOD-07 | Stavka dollarda, to'lov so'mda | To'lov kunidagi kurs uriladi. Alohida kurs farqi moddasi yo'q (10.5) | KELISHILDI |
| EC-XOD-08 | Bosqich chegarasiga aynan teng maydon | Quyi bosqichga kiradi. 1.50 → 2 $ (10.8) | KELISHILDI |
| EC-XOD-09 | 0.3 kv.m lik kichkina parda | Eng quyi bosqich minimal haq sifatida ishlaydi (10.8) | KELISHILDI |
| EC-XOD-10 | Bitta odam admin ham, omborchi ham | Bir nechta rol, ruxsatlar yig'indi (10.3) | KELISHILDI |
| EC-XOD-11 | Brak — mato nuqsonli chiqdi, usta aybdor emas | Ushlanish har hodisada alohida hal qilinadi (10.13) | KELISHILDI |
| EC-XOD-12 | KPI foizi olingan, keyin mahsulot qaytarildi | Pul kassadan chiqadi → foiz teskari yoziladi (10.7) | KELISHILDI |
| EC-XOD-13 | Qarzga sotildi, KPI qachon hisoblanadi | Pul kassaga kelganda. Qisman to'lovda qismi (10.7) | KELISHILDI |

### 16.7. Kassa edge case'lari

| Kod | Holat | Qaror | Holati |
|---|---|---|---|
| EC-KAS-01 | Sotuvchi "Topshirdim" ni ikki marta bosdi | `(topshiriq, ID)` takrorlanmaydi — bitta yozuv (12.3) | KELISHILDI |
| EC-KAS-02 | Topshiriq tasdiqlanmagan, kun tugadi | Pul sotuvchi kassasida turaveradi (12.7) | KELISHILDI |
| EC-KAS-03 | Admin topshiriqni rad etdi | Yozuv "rad etilgan", pul qimirlamaydi, sotuvchi qaytadan belgilaydi | KELISHILDI |
| EC-KAS-04 | Qaytarish to'liq qarzdan chegirildi | Kassaga hech narsa yozilmaydi (12.12) | KELISHILDI |
| EC-KAS-05 | Ushlab qolingan summa | Hisobot qatori, kassa kirimi emas (12.12) | KELISHILDI |
| EC-KAS-06 | Ayirboshlashda komissiya | Alohida xarajat moddasi, kurs farqidan ajratilgan (12.9) | KELISHILDI |
| EC-KAS-07 | Transportni yetkazib beruvchi to'ladi | Kassadan chiqmaydi, uning qarziga yoziladi (12.6) | KELISHILDI |
| EC-KAS-08 | Karta to'lovi, sotgan sotuvchi boshqa | Karta doim admin kassasiga (12.2) | KELISHILDI |
| EC-KAS-09 | Sotuvchida dollar yig'ilib qoldi | Ayirboshlash faqat admin. Sotuvchi dollarni shundayligicha topshiradi | KELISHILDI |
| EC-KAS-10 | To'lov storno qilindi | Manba modulga qaytadi: mijoz qarzi tiklanadi (12.15) | KELISHILDI |
| EC-KAS-11 | Bitta yozuvga ikkinchi storno | Bloklanadi (12.3) | KELISHILDI |
| EC-KAS-12 | Ish haqi to'lovi xarajat deb sanaldi | Sanalmaydi — xarajat "Tugatdim" da yozilgan (12.1) | KELISHILDI |
| EC-KAS-13 | Admin sotuvchiga pul berdi | Darhol ko'chadi, tasdiqlash yo'q (12.8) | KELISHILDI |
| EC-KAS-14 | Egasi sotuvchi kassasidan pul olmoqchi | Bloklanadi — faqat admin kassasidan (12.11) | KELISHILDI |
| EC-KAS-15 | Yopilgan kunga orqadan yozuv qo'shish | Bloklanadi. Admin kunni qayta ochadi, sabab majburiy (12.17) | KELISHILDI |
| EC-KAS-16 | Kun yopishda farq chiqdi | Izoh majburiy, yopish bloklanmaydi, farq hisobotga tushadi (12.17) | KELISHILDI |
| EC-KAS-17 | Kecha yopilmagan, bugun ish boshlandi | Ruxsat. Yopilmagan kun diqqat blokchasida ko'rinadi (12.17) | KELISHILDI |
| EC-KAS-18 | Mijoz 400 so'm kam berdi | 1 000 gacha "yaxlitlash" moddasi. Undan yuqorisi chegirma (12.19) | KELISHILDI |
| EC-KAS-19 | Takroriy xarajat kuni keldi | Eslatma chiqadi, admin tasdiqlaydi. Avtomatik yozilmaydi (12.19) | KELISHILDI |
| EC-KAS-20 | Sotuvchilardagi pul admin jamiga qo'shildi | Qo'shilmaydi — alohida ko'rsatiladi (12.16) | KELISHILDI |

### 16.8. Telegram bot edge case'lari

| Kod | Holat | Qaror | Holati |
|---|---|---|---|
| EC-BOT-01 | Botda ikkinchi "Aziz" ro'yxatdan o'tmoqchi | Ism tekshirilmaydi, faqat telefon (13.2) | KELISHILDI |
| EC-BOT-02 | Telefon bazada bor | Mavjud mijozga bog'lanadi, yangisi yaratilmaydi (13.2) | KELISHILDI |
| EC-BOT-03 | Ikki usta bir vaqtda "Ishga olaman" bosdi | Birinchisi oladi, ikkinchisiga rad javobi (13.8) | KELISHILDI |
| EC-BOT-04 | "Tugatdim" ikki marta bosildi | Ikkinchisiga "allaqachon tugatilgan" (13.10) | KELISHILDI |
| EC-BOT-05 | Olinmagan ishga "Tugatdim" bosildi | "Avval ishni olishingiz kerak" (13.8) | KELISHILDI |
| EC-BOT-06 | Qayta kesish so'rovi yuborildi | Material so'rovda emas, admin tasdiqlaganda yechiladi (13.8) | KELISHILDI |
| EC-BOT-07 | Sotuvchi botdagi narxni o'zgartirdi | Mijozga xabar ketadi, farq va sababi bilan (13.5) | KELISHILDI |
| EC-BOT-08 | Slotda faol mato qolmagan | "Bu mahsulot uchun hozircha mato yo'q", boshqa tur taklif qilinadi (13.4) | KELISHILDI |
| EC-BOT-09 | Mijoz botni bloklagan | Sotuvchiga "qo'ng'iroq qiling", eslatmalar tabida qizil (13.11) | KELISHILDI |
| EC-BOT-10 | Bot ishlamay qoldi | Usta ishni saytdan oladi va tugatadi (13.11) | KELISHILDI |
| EC-BOT-11 | Pozitsiya "Materialga kutmoqda" ga tushdi | Mijozga ko'rsatilmaydi, "Tayyorlanmoqda" bo'lib qolaveradi (13.6) | KELISHILDI |
| EC-BOT-12 | Yangi mahsulot turi qo'shildi | Botda avtomatik paydo bo'ladi, kod o'zgartirilmaydi (13.4) | KELISHILDI |
| EC-BOT-13 | Xodimda admin va usta roli birga | Panellar orasida almashish tugmasi (13.1) | KELISHILDI |
| EC-BOT-14 | Buyurtma yuborish ikki marta bosildi | "Allaqachon yuborilgan: #1247" (13.10) | KELISHILDI |

### 16.9. Sozlamalar edge case'lari

| Kod | Holat | Qaror | Holati |
|---|---|---|---|
| EC-SOZ-01 | Admin o'z ruxsatini olib qo'ymoqchi | "Sozlamalarni o'zgartirish" huquqi bloklanadi (14.6) | KELISHILDI |
| EC-SOZ-02 | Kurs o'zgartirildi, eski buyurtmalar bor | Eski yozuvlar o'zgarmaydi, kurs tarixi saqlanadi (14.5) | KELISHILDI |
| EC-SOZ-03 | Xodimda ikki rol, ruxsatlari har xil | Yig'indi olinadi (14.6) | KELISHILDI |
| EC-SOZ-04 | Bot matnida noma'lum o'zgaruvchi | Saqlanmaydi, xato ko'rsatiladi (14.8) | KELISHILDI |
| EC-SOZ-05 | Spravochnikdagi yagona faol qiymat nofaol qilinmoqchi | Bloklanadi (14.9) | KELISHILDI |
| EC-SOZ-06 | Standart chegara o'zgartirildi, materialda alohida qiymat bor | Materialdagi qiymat ustun (14.4) | KELISHILDI |
| EC-SOZ-07 | Bildirishnoma o'chirilgan, hodisa sodir bo'ldi | Xabar ketmaydi, lekin audit jurnaliga yoziladi | KELISHILDI |
| EC-SOZ-08 | Bildirishnoma ikki kanalga sozlangan | Ikkalasiga ham boradi (14.7) | KELISHILDI |
| EC-SOZ-09 | Bildirishnoma aniq xodimga sozlangan, u ishdan bo'shadi | Adminga fallback, ogohlantirish chiqadi | KELISHILDI |
| EC-SOZ-10 | Sozlama o'zgartirildi, kim o'zgartirgani noma'lum | Har o'zgarish audit jurnaliga tushadi (2.4) | KELISHILDI |

### 16.10. Qo'shimcha modullar edge case'lari

| Kod | Holat | Qaror | Holati |
|---|---|---|---|
| EC-INV-01 | Inventarizatsiyada farq chiqdi | Sabab majburiy, qoldiq haqiqiy songa tenglashadi, xarajatga tushadi (15.1) | KELISHILDI |
| EC-INV-02 | Ortiqcha chiqdi | Daromad emas, xarajat kamayishi (15.1) | KELISHILDI |
| EC-INV-03 | Sanash paytida yangi kirim keldi | Sanash varaqasi chop etilgan paytdagi holatni ko'rsatadi. Kiritishda joriy qoldiq bilan solishtiriladi | KELISHILDI |
| EC-INV-04 | Band qilingan bo'lak sanaldi | Band bo'lsa ham jismonan omborda — sanaladi. Band alohida ustunda ko'rinadi | KELISHILDI |
| EC-INV-05 | Inventarizatsiya xato kiritildi | O'chirilmaydi, admin storno qiladi (2.1) | KELISHILDI |
| EC-XAR-01 | Bir material ikki yetkazib beruvchidan | Hammasi ko'rsatiladi, narxi bilan. Tanlash odamning ishi (15.3) | KELISHILDI |
| EC-XAR-02 | Kerak 0, lekin chegaradan past | Chegara darajasigacha olish taklif qilinadi (15.3) | KELISHILDI |
| EC-XAR-03 | Xarid ro'yxati saqlanadimi | Yo'q — har ochilganda qayta hisoblanadi (15.3) | KELISHILDI |
| EC-KUN-01 | Kunlik varaqa va kun yopish ikkitami | Bitta narsa. Varaqa — kun yopishning chop etiladigan ko'rinishi (15.4) | KELISHILDI |

---

## 17. v1.13 GA NISBATAN O'ZGARISHLAR

Eski hujjat bo'yicha ish boshlagan bo'lsangiz, avval shu ro'yxatni ko'ring.

### 17.1. Tuzatilgan xatolar

| Nima | Eski holat | Yangi holat |
|---|---|---|
| **Pozitsiya narxi formulasi** | `mato narxi × maydon + aksessuar` | `Σ(slot sarflashi × slot matosi narxi) + Σ(aksessuar) + xizmat haqi` (3.8) |
| **Hisob turlari** | 2.6.5 da ikkita: rulon, kv.metr | To'rtta: rulon, kv.metr, chiziqli, dona (5.2) |
| **Mato bog'lanishi** | Sotuv hujjatida "mahsulot turiga" | Slotga (5.7) |
| **Min. ostatka chegarasi** | Noaniq: kv.m yoki metr | Eni bo'yicha, metrda (5.5) |
| **Manfiy qoldiq taqiqi** | Barcha operatsiyalarga | Faqat avtomatik operatsiyalarga (2.5) |
| **% chegirma** | "KERAK EMAS" | Offset turlaridan biri (6.3) |
| **Ostatka strukturasi** | Kv.m bo'lib | `eni × bo'yi` (7.4) |

### 17.2. Yangi qo'shilganlar

- Offset uch xil bo'lishi (so'm / % / $) — 6.3
- Ombordan hisobdan chiqarish (brak) — 7.9
- Kirim defektining ikki yo'li — 7.8
- Kam qoldiq chegarasi barcha hisob turlariga — 5.5
- FIFO — dona materialning tannarxi uchun — 7.7
- Birlashtirib kesish — 7.5
- 1 sm bag'rikenglik — 7.5
- "Kutilmoqda" ko'rsatkichi — 7.3
- Boshlang'ich qoldiq qatori — 6.8, 7.10
- Qarzi bor mijozni nofaol qilish bloklanishi — 6.6
- Xizmat haqi ixtiyoriy — 4.7
- Slot va parametr o'chirish cheklovlari — 4.3, 4.4
- Aksessuar birligi (dona / metr / sm) — 3.7
- Kirim hujjatini storno qilish — 7.11
- Sotilmagan tayyor mahsulot ro'yxati — 7.12
- Majburiy komplektdagi oxirgi materialni nofaol qilish bloklanishi — 5.9
- Buyurtma hayoti moduli to'liq — 8-bo'lim
- Pozitsiya darajasida qaytarish — 8.10
- "Rad etilgan" statusi (bekor qilishdan alohida) — 8.8
- Ishni ustadan qaytarib olish — 8.6
- Qisman topshirish — 8.9
- Yetkazib beruvchilar moduli to'liq — 9-bo'lim
- Kurs farqi alohida xarajat moddasi — 9.6
- Yetkazib beruvchiga avans — 9.2
- Dollar qarzini so'mda to'lash — 9.5
- Kirimga qo'shimcha xarajatlar (transport, bojxona) — 7.8
- Minimal ustama chegarasi va kirimda tekshiruv — 5.4, 7.8
- Kirim stornosi uch joyga birdan — 7.11
- Narx tarixi — 9.8
- Xodimlar va ish haqi moduli to'liq — 10-bo'lim
- Xodim va foydalanuvchi bitta yozuv, bir nechta rol — 10.2, 10.3
- Bosqichli stavka jadvali — 10.8
- KPI: foiz kassaga kelgan puldan — 10.7
- Hisobotlar va dashboard — 11-bo'lim
- Excel eksportida ikki varaq — 11.2
- Ustama eroziyasi hisoboti — 11.7.5
- Muzlab qolgan pul hisoboti — 11.7.6
- Navbat holati hisoboti — 11.8.4
- Sotuvchi erkinliklari hisoboti — 11.5.6
- Kassa moduli to'liq — 12-bo'lim
- Ko'p kassali model: admin + har sotuvchiga o'ziniki — 12.2
- Har kassa yozuvi manbaga bog'lanadi, takrorlanish bazada bloklanadi — 12.3
- Xarajat va kassa chiqimi ajratildi — 12.1
- Sotuvchidan adminga topshiriq, tasdiqlash bilan — 12.7
- Ayirboshlash va bank komissiyasi — 12.9
- Operatsion xarajatlar — 12.10
- Egasi pul olishi — 12.11
- Kun yopish va farqni qayd etish — 12.17
- Kassa kitobida yuguruvchi qoldiq va ixtiyoriy sanaga kesim — 12.18
- Xarajat cheklari, takroriy xarajat, yaxlitlash — 12.19
- Har modul sahifasida ko'rsatkichlar paneli — 11.11
- Telegram bot moduli to'liq — 13-bo'lim
- Bitta bot, uchta panel (mijoz, usta, admin) — 13.1
- Botda buyurtma oqimi slot mexanizmiga o'tdi — 13.4
- Mijozga aniq narx, offset bilan — 13.5
- Usta botda o'z balansini ko'radi — 13.8
- Hisob-kitob varaqasi — 8.9
- Sozlamalar va ruxsatlar moduli — 14-bo'lim
- Kurs tarixi va o'zgarishlar jurnali — 14.5
- Ruxsatlar matritsasi amal darajasida — 14.6
- Bildirishnoma qoidalari, ikki kanal — 14.7
- Bot matnlari o'zgaruvchilar bilan — 14.8
- Spravochniklar bir joyda — 14.9
- Tayyorlik sanasi ixtiyoriy — 3.13 (eski 5.4-band bekor qilindi)
- Barcha uzunlik o'lchovi santimetrda — 5.3
- Kesimda uch qatorli yozuv — 7.6
- **Band qilish joriy etildi** — avvalgi "band qilinmaydi" qoidasi bekor — 7.3
- Bo'lak turlari: rulon va qoldiq kesma, rulon eni o'zgarmaydi — 7.4
- Uch daraja: yaroqli / kam ishlatiladigan / yaroqsiz — 7.5, 5.5
- Kesish qarori usta ishni olayotganda, tasdiq bilan — 7.6
- "Tugatdim" da manba tasdiqlanadi: ostatkadan yoki rulondan — 7.6
- Aniq bo'lak raqami kuzatilmaydi, faqat manba — 7.4, 7.6
- "Ostatka turgan holda rulon ochildi" hisoboti — 11.7.7
- Inventarizatsiya jarayoni — 15.1
- Yetishmayotgan materiallar ko'rinishi — 15.2
- Xarid ro'yxati — 15.3
- Kunlik yopish varaqasi — 15.4
- Navbat tartibi aniq bo'ldi, tasodifiy emas — 8.12

### 17.3. Eskirgan bo'limlar

**Eski hujjatning 10-bo'limi (interfeys tavsiflari) to'liq eskirgan.** U v1.11 asosida yozilgan va quyidagi joylarda hozirgi qarorlarga zid:

- 10.5.1 — mijoz va tayyorlik sanasi "majburiy" deb yozilgan (aslida ixtiyoriy)
- 10.8.2 — kirim turi 2 xil, tannarx qo'lda kiritiladi, slot yo'q, almashtirish guruhi yo'q
- 10.12.2 — konstruktorda slot, parametr, xizmat haqi va test kalkulyatori yo'q

**Bu bo'lim ishlatilmaydi.** Uning o'rniga shu hujjatning 3–7-bo'limlari amal qiladi.

---

## 18. YOPILGAN OCHIQ SAVOLLAR

Bu savollar hujjat davomida ochiq turgan edi va hammasi hal qilindi.

| Savol | Qaror | Band |
|---|---|---|
| Tayyorlik sanasi majburiymi | **Ixtiyoriy.** Eski 5.4-band bekor qilindi | 3.13 |
| Foizli offsetda yaxlitlash | **100 so'mgacha** | 6.3 |
| Dollar offsetida qaysi kurs | **Sozlamadagi joriy kurs** | 6.3, 14.3 |
| Karniz sarflash birligi | **Santimetr.** Barcha uzunlik smda | 5.3 |
| Chiqindi yozuvi | **Uch qator:** rulondan chiqim, ostatka kirim, chiqindi | 7.5 |
| Kam qoldiq ogohlantirishi kimga | **Bildirishnoma qoidalarida sozlanadi** | 14.7 |
| Bot mijozni qanday taniydi | **Telefon raqami bo'yicha** | 13.2 |

**Ochiq savol qolmadi.**

---

## 19. KEYINGI BO'LIMLAR

Quyidagilar hali yozilmagan. Har biri bir xil tartibda ishlanadi: muhokama → savollar → kelishuv → maket → yetishmayotganini qo'shish → shu hujjatga yozish.

### 19.1. Navbatdagi bo'limlar

| Bo'lim | Nega kerak | Nimaga bog'liq |
|---|---|---|
| **Sozlamalar va ruxsatlar** | Kurs, rollar, chegaralar | — |

### 19.2. Bajarilgan va bekor qilinganlar

Avval keyinroqqa qoldirilgan bo'lib, keyin hal qilingan narsalar:

| Nima | Holati |
|---|---|
| Inventarizatsiya jarayoni | **Bajarildi** — 15.1 |
| Xarid ro'yxati | **Bajarildi** — 15.3 |
| Yetishmayotgan materiallar ko'rinishi | **Bajarildi** — 15.2 |
| Kunlik yopish varaqasi | **Bajarildi** — 15.4 |
| Kirim dollarda bo'lganda tannarx valyutasi | **Allaqachon hal qilingan** — 9.6: kirim kunidagi kursda so'mga qotiriladi |
| Ostatkaning jismoniy joylashuvi (javon raqami) | **Bekor qilindi** — aniq bo'lak kuzatilmaydi, usta ostatkalar orasidan o'zi topadi (7.6) |

**Keyinroqqa qoldirilgan narsa qolmadi.**

---

*Hujjat oxiri. Keyingi versiyada yangi bo'limlar 19-bo'limdan olinib, o'z raqamiga qo'yiladi.*


---

# 20-BO'LIM · KO'P FILIAL

> **Status:** yakunlangan — barcha qaror qabul qilingan
> **TZ ga qo'shilishi:** v1.15
> **Asos:** Q-21, Q-24, Q-25, Q-26, Q-28

---

## 20.1. Nima uchun bu bo'lim

Tizim boshida bitta filial uchun yozilgan edi. Endi korxona kengayadi:
bir necha do'kon, ba'zilarida sex bor, ba'zilarida yo'q.

Bu bo'lim **mavjud 19 bo'limning yarmiga tegadi**. 20.16-bandda to'liq ro'yxat bor.

**Asosiy tamoyil:** filial — bu **alohida korxona emas**, balki bitta korxonaning
bo'linmasi. Mijoz, material nomlari, formulalar, yetkazib beruvchilar — umumiy.
Pul, ombor qoldig'i, xodimlar — filialga bog'langan.

---

## 20.2. Filial modeli

Har filialda:

| Maydon | Izoh |
|---|---|
| Nomi | "Chilonzor do'koni", "Samarqand sexi" |
| Manzil, telefon | chek va hujjatlarda ko'rinadi |
| **Sotadi** | ☑/☐ — bu filialda buyurtma qabul qilinadimi |
| **Ishlab chiqaradi** | ☑/☐ — bu filialda sex va ustalar bormi |
| Standart ishlab chiqarish filiali | agar o'zi tikmasa — qaysi filialga yuboriladi |
| Ish vaqti (kassa yopilish soati) | standart 20:00 (Q-17) |
| Faol | nofaol filial yangi buyurtma qabul qilmaydi, tarixi qoladi |

### 20.2.1. To'rt rejim

| Sotadi | Tikadi | Nomi | Ma'nosi |
|---|---|---|---|
| ✅ | ✅ | **To'liq filial** | o'zi sotadi, o'zi tikadi |
| ✅ | ❌ | **Do'kon** | sotadi, buyurtma boshqa filialga ketadi |
| ❌ | ✅ | **Sex** | mijoz qabul qilmaydi, boshqa filiallarga tikadi |
| ❌ | ❌ | **Ombor** | faqat material saqlaydi va tarqatadi |

Ikkalasi ham ☐ bo'lgan filial — bu markaziy ombor. U material qabul qiladi
va boshqa filiallarga tarqatadi (20.7).

### 20.2.2. Bosh filial

Bitta filial **bosh** deb belgilanadi. U:

- Standart narxlarni boshqaradi (20.9)
- Material nomlari, mahsulot turlari, formulalarni boshqaradi
- Boshqa filiallar hisobotini ko'radi

Bosh filialni o'chirib bo'lmaydi.

---

## 20.3. Nima umumiy, nima filialga

**Qaror Q-26 bo'yicha.**

### Umumiy (bitta ro'yxat, hamma filial ko'radi)

| Nima | Band | Izoh |
|---|---|---|
| Materiallar ro'yxati (nomlar, birliklar, formulalar) | 5 | "Ko'k mato" hamma joyda bir xil narsa |
| Mahsulot turlari, slotlar, sarflash formulalari | 4 | Rollo hamma joyda bir xil tikiladi |
| Mijozlar | 6 | mijoz istalgan filialga borishi mumkin |
| **Mijoz qarzi va balansi** | 6.8 | ⚠️ aks holda bir filialda qarzdor, boshqasida toza |
| Yetkazib beruvchilar va ularga qarz | 9 | markazdan xarid qilinadi |
| Standart narxlar | 5.4 | filial o'zgartirishi mumkin — 20.9 |
| Sozlamalar (kurs, chegaralar, bag'rikenglik) | 14 | markazdan boshqariladi |
| Rollar va ruxsatlar matritsasi | 14.6 | — |

### Filialga bog'langan

| Nima | Band | Izoh |
|---|---|---|
| **Ombor qoldig'i** (bo'laklar, ostatkalar) | 7 | har filial o'z materialidan tikadi |
| Kirim hujjatlari | 7.9 | qaysi filialga kelgani ko'rsatiladi |
| Kassa | 12 | har filialda o'z kassasi |
| Xodimlar | 10 | usta bir sexda ishlaydi |
| Buyurtmalar | 8 | ikki bog'lanish — 20.4 |
| Filial narxi (istisno) | 20.9 | — |
| Rejalar | 21-bo'lim | — |

### 20.3.1. Mijoz qarzi umumiy — muhim natija

Mijoz Chilonzorda 2 mln qarz oldi, Samarqandda to'ladi. Bu ishlaydi:

- Qarz **umumiy** balansda
- To'lov **Samarqand kassasiga** tushadi
- Mijoz kartochkasida ikkala amal ham ko'rinadi, filiali bilan

⚠️ Buning natijasi: **kassa qoldig'i va mijoz qarzi bir-biriga to'g'ri kelmaydi**
filial kesimida. Bu normal — 2.2-invariant buzilmaydi, chunki balans yozuvlardan
hisoblanadi. Lekin hisobotda tushuntirish kerak (20.13).

---

## 20.4. Buyurtma va filial

Har buyurtmada **ikkita** filial bog'lanishi bor:

| Maydon | Ma'nosi | Kim belgilaydi |
|---|---|---|
| **Sotgan filial** | buyurtma qabul qilingan joy | avtomatik — sotuvchining filiali |
| **Ishlab chiqaruvchi filial** | qayerda tikiladi | 20.4.1 |

Ikkalasi bir xil bo'lishi mumkin (to'liq filial) yoki har xil (do'kon → sex).

### 20.4.1. Ishlab chiqaruvchi filial qanday tanlanadi

```
1. Sotgan filial "ishlab chiqaradi" ☑ bo'lsa
       → o'zi. Sotuvchi o'zgartira oladi.

2. Aks holda
       → filial sozlamasidagi "standart ishlab chiqarish filiali"

3. U ham bo'sh bo'lsa
       → sotuvchi qo'lda tanlaydi (majburiy)
```

**Pozitsiya darajasida emas, buyurtma darajasida** — bitta buyurtmaning hamma
pozitsiyasi bir joyda tikiladi. Aks holda mijozga yetkazish murakkablashadi.

### 20.4.2. Material tekshiruvi qaysi filialda

Q-03 bo'yicha material yetishmasligi **buyurtma berilayotganda** aytiladi.
Ko'p filialda bu tekshiruv **ishlab chiqaruvchi filial** ombori bo'yicha
o'tkaziladi — sotgan filial bo'yicha emas.

Sotuvchi Chilonzorda o'tiribdi, buyurtma Samarqandda tikiladi → Samarqand
omborida mos bo'lak bormi, shu tekshiriladi.

Band qilish ham o'sha filialda qo'yiladi (7.3).

---

## 20.5. Yangi statuslar

TZ 8.3 dagi status jadvaliga **uchta yangi status** qo'shiladi. Ular faqat
sotgan va tikuvchi filial har xil bo'lganda ishlatiladi.

| Status | Qachon | Material | Kim o'zgartiradi |
|---|---|---|---|
| **Filialga yuborildi** | tasdiqlangandan keyin, tikuvchi filial boshqa | band qilingan (tikuvchi filialda) | avtomatik |
| **Tayyor — yo'lda** | tikuvchi filialda "Tugatdim" bosilgan, sotgan filialga yo'lda | yechilgan | tikuvchi filial |
| **Yetib keldi** | sotgan filialga yetib keldi | yechilgan | sotgan filial qabul qiladi |

To'liq oqim:

```
Tasdiqlangan → Filialga yuborildi → Ishlab chiqarilmoqda → Tayyor — yo'lda
             → Yetib keldi → Topshirildi
```

Bir filial ichida tikilsa eski oqim ishlaydi (uch status o'tkazib yuboriladi).

### 20.5.1. Qabul qilish

"Yetib keldi" statusini sotgan filial **qo'lda** bosadi. Bosilmaguncha mahsulot
yo'lda hisoblanadi.

Agar mahsulot yo'lda shikastlangan bo'lsa — qabul qilishda "Shikastlangan"
belgilanadi va u ishlab chiqarish braki (8.17) bo'lib rasmiylashtiriladi.

---

## 20.6. Ombor va filial

### 20.6.1. Har bo'lak bitta filialda

Har bo'lak (rulon, ostatka, quti) **aniq bitta filialga** tegishli.
Filiallar orasida ko'chirish faqat 20.7 dagi hujjat orqali.

### 20.6.2. Qoldiq ko'rsatish

Ombor ekranida filial filtri. Standart — foydalanuvchining o'z filiali.

Bosh filial admini **barcha filiallarni** bir jadvalda ko'ra oladi:

```
Ko'k mato · to'r
  Chilonzor    R-118  3.00 × 28.00 m       O-207  1.80 × 2.00 m
  Samarqand    R-142  3.00 ×  4.50 m
  Markaziy     R-150  3.00 × 30.00 m       R-151  3.00 × 30.00 m
```

### 20.6.3. Kirim qaysi filialga

Kirim hujjatida **filial majburiy** maydon. Yetkazib beruvchi to'g'ridan-to'g'ri
filialga yetkazsa — o'sha filial. Markazga kelsa — markaziy ombor, keyin
ko'chirish hujjati bilan tarqatiladi.

Yetkazib beruvchiga qarz **umumiy** bo'lib qoladi (20.3).

### 20.6.4. Band qilish filial ichida

7.3 dagi band qilish algoritmi **faqat o'z filiali bo'laklari** ichida ishlaydi.
Boshqa filialda mos bo'lak bo'lsa ham band qilinmaydi — u yerdagi bo'lak
jismonan boshqa shaharda.

Mos bo'lak topilmasa: pozitsiya "Materialga kutmoqda"ga tushadi va
**xarid ro'yxatiga** (15.3) tushadi. Bunda tizim ogohlantiradi:

```
⚠️ Bu matodan Markaziy omborda 30.00 m bor.
   Ko'chirish so'rovi yuborilsinmi?
```

---

## 20.7. Filiallar orasida material ko'chirish

**Yangi hujjat turi.** TZ da hozir yo'q.

### 20.7.1. Oqim

```
1. So'rov         Qabul qiluvchi filial so'raydi (yoki admin o'zi yaratadi)
2. Jo'natish      Beruvchi filial OMBORCHISI bo'laklarni tanlaydi va jo'natadi
3. Yo'lda         Bo'laklar ikkala filialda ham "yo'lda" holatida
4. Qabul          Qabul qiluvchi filial tasdiqlaydi
```

**Tasdiqlash:** so'rovni **beruvchi filial omborchisi** hal qiladi. Admin tasdig'i
kerak emas, summa chegarasi yo'q.

Nazorat keyingi bosqichda: har ko'chirish audit jurnaliga tushadi (2.4) va
20.13.2.2 hisobotida ko'rinadi. Admin haftalik ko'rib chiqadi.

### 20.7.2. Hujjat tarkibi

| Maydon | Izoh |
|---|---|
| Raqam, sana | avtomatik |
| Kimdan / kimga | filiallar |
| Bo'laklar ro'yxati | aniq bo'lak ID bilan (Q-02) |
| Jo'natdi / qabul qildi | xodimlar |
| Holati | so'rov · yo'lda · qabul qilindi · bekor qilindi |

### 20.7.3. Tannarx ko'chishda o'zgarmaydi

Bo'lakning tannarxi (7.8) o'zgarmaydi — u kirim paytida belgilangan va
snapshot (2.3-invariant).

⚠️ Transport xarajati bo'lsa — u **operatsion xarajat** (12.10) bo'lib
yoziladi, tannarxga qo'shilmaydi. Sabab: aks holda bir xil mato ikki filialda
ikki xil tannarxga ega bo'ladi va foyda-zarar taqqoslab bo'lmaydi.

### 20.7.4. Yo'lda holati

Bo'lak "yo'lda" bo'lganda:
- Beruvchi filial qoldig'idan **chiqarilgan**
- Qabul qiluvchi filial qoldig'iga **hali kirmagan**
- Band qilib bo'lmaydi
- Inventarizatsiyada (15.1) alohida qatorda ko'rinadi

Umumiy ombor qiymati o'zgarmaydi — 2.1-invariant saqlanadi.

---

## 20.8. Tayyor mahsulotni ko'chirish

20.5 dagi "Tayyor — yo'lda" statusi bilan boshqariladi. Alohida hujjat kerak emas —
buyurtma pozitsiyasining o'zi kuzatiladi.

Bir necha buyurtma bir yo'la yuborilsa, ular **jo'natma** bo'lib guruhlanadi:

```
Jo'natma №14 · Samarqand → Chilonzor · 12.08.2026
  #1247 poz. 1, 2   Rollo 210×140
  #1251 poz. 1      Plisse 180×220
  #1253 poz. 1, 2, 3 Dikke 160×200
```

Qabul qilishda butun jo'natma bir bosishda tasdiqlanadi yoki har pozitsiya alohida.

---

## 20.9. Narxlar

**Qaror Q-28: standart umumiy, filial o'zgartirishi mumkin.**

Bu TZ dagi tanish naqsh — ustama chegarasi (5.4), ostatka chegarasi (5.5),
stavka (10.9), to'lov muddati (9.3) bilan bir xil ishlaydi.

### 20.9.1. Mexanizm

| Daraja | Kim belgilaydi | Ustunligi |
|---|---|---|
| **Standart narx** | bosh filial, material kartochkasida (5.4) | past |
| **Filial narxi** | filial admini, istisno sifatida | yuqori |

Filial narxi bo'sh bo'lsa — standart ishlaydi. Bosh filialda standart o'zgarsa,
o'z narxini qo'ymagan filiallarga avtomatik tarqaladi.

### 20.9.2. Ko'rsatish

Material kartochkasida:

```
Sotuv narxi (standart)          120 000 so'm / kv.m
  Chilonzor                     — standart
  Samarqand                     114 000  ⚠️ istisno
  Farg'ona                      — standart
```

### 20.9.3. Mijoz offseti bilan birga

Tartib: **filial narxi → mijoz offseti → yaxlitlash**.

```
Standart               120 000
Samarqand filiali      114 000
Mijoz offseti −3%      110 580  →  yaxlitlash 100 gacha  →  110 600
```

### 20.9.4. Snapshot

Buyurtma saqlanganda **hisoblangan narx** snapshot bo'ladi (3.9, 2.3-invariant).
Keyin filial narxi o'zgarsa eski buyurtmaga ta'sir qilmaydi.

### 20.9.5. Ustama nazorati

11.7.5 (ustama eroziyasi) hisoboti **filial kesimida** ishlaydi. Filial narxni
juda past qo'ysa, minimal ustama chegarasidan (5.4) tushib ketishi mumkin —
bunda saqlashda ogohlantirish chiqadi.

---

## 20.10. Kassa

Har filialda o'z kassalari (12.2 modeli o'zgarmaydi):

```
Chilonzor
  Admin kassasi:      naqd so'm · naqd dollar · karta
  Sotuvchi A kassasi: naqd so'm · naqd dollar
  Sotuvchi B kassasi: naqd so'm · naqd dollar
```

### 20.10.1. Kun yopish

Har filial o'z kunini **o'z vaqtida** yopadi (Q-17: standart 20:00, filial
sozlamasida o'zgartiriladi).

Bosh filial admini barcha filiallarning yopilish holatini ko'radi:

```
12.08.2026
  Chilonzor    ✅ yopilgan 20:14    farq −50 000
  Samarqand    ⏳ yopilmagan
  Farg'ona     ✅ yopilgan 19:47    farq 0
```

### 20.10.2. Filiallar orasida pul o'tkazish

12.7 (sotuvchi → admin) mexanizmining kengaytmasi: **filial → bosh filial**.

Hujjat: kim, kimga, qancha, qaysi valyuta, tasdiqlash. Ikki tomonlama —
jo'natilgan va qabul qilingan bosqichlari bilan (12.8 naqshi).

Yo'ldagi pul **umumiy qoldiqda saqlanadi**, lekin hech qaysi kassada emas —
alohida "yo'lda" satrida. 2.1-invariant buzilmaydi.

---

## 20.11. Xodimlar va navbat

### 20.11.1. Xodim bitta filialda

Har xodim aniq bitta filialga bog'langan. Ko'chirilsa — filiali o'zgaradi,
balansi va tarixi saqlanadi.

### 20.11.2. Usta navbati

Usta botda (13.8) **faqat o'z filialining** ishlarini ko'radi.

Buyurtma boshqa filialdan kelgan bo'lsa, ish varaqasida ko'rsatiladi:

```
🔧 #1247 poz. 1 · Rollo 210 × 140
   Chilonzordan · muddat 18.08.2026
```

### 20.11.3. Stavka

**Qaror:** standart + istisno (20.9 naqshi).

Stavka matritsasi (10.8) bosh filialda **standart** bo'lib turadi. Filial o'z
stavkasini qo'yishi mumkin — qo'ymasa standart ishlaydi.

```
Rollo · 1 kv.m          standart      18 000 so'm
  Chilonzor             — standart
  Samarqand                           15 000  ⚠️ istisno
```

"Tugatdim" bosilganda **snapshot** olinadi (10.10) — keyin stavka o'zgarsa eski
ishga ta'sir qilmaydi.

---

## 20.12. Ruxsatlar

14.6 matritsasiga **filial o'lchovi** qo'shiladi. Har ruxsat uchun qamrov:

| Qamrov | Ma'nosi |
|---|---|
| **O'z filiali** | faqat o'z filialining ma'lumoti |
| **Barcha filiallar** | hammasi |

Misol:

```
Omborchi (Samarqand)
  ☑ ombor.qoldiq.kor      qamrov: o'z filiali
  ☑ ombor.kirim.yarat     qamrov: o'z filiali
  ☐ ombor.kochirish.yarat

Bosh admin
  ☑ ombor.qoldiq.kor      qamrov: barcha filiallar
  ☑ narx.standart.ozgartir
```

### 20.12.1. Qattiq qoidalar

Q-04 dagi uchta qoidaga **to'rtinchisi** qo'shiladi:

4. Filial xodimi boshqa filialning **kassasini** ko'ra olmaydi — qamrov
   "barcha filiallar" bo'lsa ham. Bu faqat bosh filial admini uchun ochiladi.

---

## 20.13. Hisobotlar

Barcha 27 hisobotga (11-bo'lim) **filial filtri** qo'shiladi.

### 20.13.1. Standart qamrov

| Kim | Standart ko'rinish |
|---|---|
| Filial xodimi | o'z filiali, o'zgartira olmaydi |
| Bosh filial admini | barcha filiallar, filtr bilan tanlanadi |

### 20.13.2. Yangi hisobotlar

**20.13.2.1. Filiallar taqqoslash**

Bir jadvalda: tushum · foyda · buyurtma soni · o'rtacha chek · ustama · ombor
qiymati · xodim soni · kv.m ishlab chiqarildi.

**20.13.2.2. Filiallar orasidagi harakat**

Material ko'chirishlari va tayyor mahsulot jo'natmalari, davr bo'yicha.

**20.13.2.3. Yo'ldagi qiymat**

Hozir yo'lda turgan material va tayyor mahsulot qiymati, filiallar kesimida.

### 20.13.3. Dashboard (11.3) o'zgarishi

Uchala qatorga filial kesimi qo'shiladi. Bosh admin uchun **to'rtinchi qator**:

```
Filiallar bugun
  Chilonzor    12 400 000    18 buyurtma    kassa ✅
  Samarqand     4 100 000     6 buyurtma    kassa ⏳
  Farg'ona      2 800 000     4 buyurtma    kassa ✅
```

"Diqqat talab qiladi" qatoriga uchta yangi ko'rsatkich:

- Qabul qilinmagan jo'natma
- Qabul qilinmagan material ko'chirishi
- Kassasini yopmagan filial

Reja/fakt ko'rsatkichi — 21-bo'limda (rejalar).

---

## 20.14. Bot

### 20.14.1. Mijoz

Mijoz botdan buyurtma berganda **filialni tanlaydi** — birinchi qadam sifatida:

```
Qaysi do'konga murojaat qilasiz?
  🏢 Chilonzor
  🏢 Samarqand
  🏢 Farg'ona
```

Tanlangan filial = sotgan filial. Ishlab chiqaruvchi filial 20.4.1 bo'yicha
avtomatik aniqlanadi.

Narx tanlangan filial narxi bo'yicha ko'rsatiladi (20.9).

Material yetishmasligi ogohlantirishi (Q-11) **ishlab chiqaruvchi filial**
ombori bo'yicha chiqadi.

### 20.14.2. Usta

O'z filialining ishlarini ko'radi (20.11.2).

### 20.14.3. Admin

Admin bot (13.9) xabarlariga **filial nomi** qo'shiladi:

```
🔔 Samarqand · Ombordan hisobdan chiqarildi
   Ko'k mato · to'r · 3.60 kv.m · Omborchi: Aziz
```

Bosh admin barcha filial xabarlarini oladi. Filial admini faqat o'zinikini.

---

## 20.15. Mavjud bandlarga ta'sir

Bu bo'lim quyidagi bandlarni **o'zgartiradi**:

| Band | Nima o'zgaradi |
|---|---|
| 3.4 | Material tekshiruvi ishlab chiqaruvchi filial bo'yicha |
| 3.8, 3.9 | Narx filial narxini hisobga oladi |
| 5.4 | Standart narx + filial istisnosi |
| 6.8 | Mijoz qarzi umumiy, harakatlar filiali bilan |
| 7.3 | Band faqat o'z filiali bo'laklari ichida |
| 7.4 | Bo'lakka `filial_id` qo'shiladi |
| 7.9 | Kirimda filial majburiy |
| 8.3 | Uchta yangi status |
| 8.4 | Buyurtmada ikkita filial bog'lanishi |
| 8.12 | Navbat filial ichida |
| 9.2 | Yetkazib beruvchi qarzi umumiy qoladi |
| 10.1 | Xodimga `filial_id` |
| 10.8 | Stavka — umumiy yoki filialga (savol) |
| 11.3 | Dashboard filial kesimi + yangi qatorlar |
| 11.4–11.9 | Barcha hisobotga filial filtri |
| 12.2 | Kassalar filialga bog'lanadi |
| 12.7 | Filiallar orasida pul o'tkazish qo'shiladi |
| 12.17 | Kun yopish filial vaqti bo'yicha |
| 13.4 | Botda filial tanlash |
| 13.8, 13.9 | Filial nomi xabarlarda |
| 14.6 | Ruxsatga filial qamrovi |
| 15.1 | Inventarizatsiya filial bo'yicha, "yo'lda" qatori |
| 15.2, 15.3 | Xarid ro'yxati filial kesimida |

---

## 20.16. Edge case

| Kod | Holat | Qaror |
|---|---|---|
| **EC-FIL-01** | Buyurtma tikilayotganda filial nofaol qilindi | Buyurtma tugatiladi, yangi buyurtma qabul qilinmaydi |
| **EC-FIL-02** | Ko'chirish yo'lda, qabul qiluvchi filial nofaol | Ko'chirish bekor qilinadi, bo'laklar beruvchi filialga qaytadi |
| **EC-FIL-03** | Yo'ldagi material yo'qoldi | Qabul qilishda "yetib kelmadi" — hisobdan chiqarish (7.10), xarajat beruvchi filialga |
| **EC-FIL-04** | Yo'ldagi tayyor mahsulot shikastlangan | Ishlab chiqarish braki (8.17), qayta tikiladi |
| **EC-FIL-05** | Mijoz A filialda qarz oldi, B da to'lamoqchi | Ishlaydi — qarz umumiy (20.3.1) |
| **EC-FIL-06** | Xodim boshqa filialga ko'chirildi, balansi bor | Balans va tarix saqlanadi, filiali o'zgaradi |
| **EC-FIL-07** | Filial narxi standartdan past, ustama chegarasidan tushdi | Saqlashda ogohlantirish, admin davom eta oladi (5.4 naqshi) |
| **EC-FIL-08** | Sotgan filial "Yetib keldi" ni bosmadi, mijoz kelib qoldi | Topshirishda avtomatik "Yetib keldi" qo'yiladi |
| **EC-FIL-09** | Ishlab chiqaruvchi filialda material yo'q, boshqasida bor | Ko'chirish so'rovi taklif qilinadi (20.6.4) |
| **EC-FIL-10** | Bir buyurtma pozitsiyalari har xil filialda tikilishi kerak | Ruxsat berilmaydi — buyurtma darajasida (20.4.1) |
| **EC-FIL-11** | Filial kassasini uch kun yopmadi | Dashboardda qizil, bosh adminga bildirishnoma |
| **EC-FIL-12** | Ko'chirishda bo'lak jismonan boshqacha chiqdi | Qabul qilishda haqiqiy o'lcham kiritiladi, farq xarajatga (15.1 naqshi) |

---

## 20.17. Foyda taqsimoti

**Qaror:** foyda **korxonaga** tegishli. Filiallar kesimida ko'rsatilganda —
sotgan va tikkan filial o'rtasida **teng (50/50)** bo'linadi.

### 20.17.1. Qoida

| Holat | Taqsimot |
|---|---|
| Bir filial sotdi va tikdi | **100%** o'sha filialga |
| A sotdi, B tikdi | **50% / 50%** |
| Buyurtma qaytarildi (8.10) | ushlab qolingan summa ham 50/50 |

### 20.17.2. Bu faqat hisobot uchun

⚠️ Muhim: **pul hech qayerga ko'chmaydi.** Bu haqiqiy o'tkazma emas — foyda-zarar
hisobotidagi taqsimot usuli. Kassa, balans, mijoz qarzi — hech biriga tegmaydi.

Korxona darajasidagi umumiy foyda (11.4.1) **o'zgarmaydi**: taqsimot faqat filial
kesimida ko'rsatilganda qo'llanadi va yig'indisi doim 100% chiqadi.

### 20.17.3. Hisoblash

```
Buyurtma #1247 · Chilonzor sotdi · Samarqand tikdi

Tushum                    678 400
Tannarx (material)      − 312 000     ← Samarqand omboridan
Ish haqi                −  57 600     ← Samarqand ustasi
Foyda                     308 800

Filial kesimida:
  Chilonzor               154 400   (50%)
  Samarqand               154 400   (50%)
```

Tannarx va ish haqi **haqiqatda qayerda sarflangan bo'lsa** o'sha filialga
yoziladi (11.4.1 uchun). Faqat **yakuniy foyda** bo'linadi.

### 20.17.4. Hisobotda ko'rsatish

11.4.1 (foyda-zarar) va 20.13.2.1 (filiallar taqqoslash) hisobotlarida ustun:

```
              Tushum      Tannarx     Foyda    Taqsimlangan foyda
Chilonzor   12 400 000   5 100 000  4 200 000      3 850 000
Samarqand    4 100 000   3 800 000    900 000      1 250 000
─────────────────────────────────────────────────────────────
Jami        16 500 000   8 900 000  5 100 000      5 100 000
```

Oxirgi ustun yig'indisi har doim `Foyda` ustuni yig'indisiga teng bo'lishi shart —
bu tekshiruv invarianti.

---

## 20.18. Transport xarajati

Filiallar orasida material va tayyor mahsulot ko'chirish xarajati.

### 20.18.1. Qanday yoziladi

**Operatsion xarajat** (12.10) sifatida, alohida modda: `Filiallararo transport`.

Tannarxga **qo'shilmaydi** (20.7.3 dagi sabab: aks holda bir xil mato ikki filialda
ikki xil tannarxga ega bo'ladi).

### 20.18.2. Kim to'laydi

Ko'chirish hujjatida (20.7.2) yangi maydonlar:

| Maydon | Izoh |
|---|---|
| Transport summasi | ixtiyoriy — bo'sh bo'lsa xarajat yozilmaydi |
| Kim to'ladi | jo'natuvchi filial · qabul qiluvchi filial · korxona (markaziy) |
| To'lov usuli | kassadan chiqim (12.6) yoki keyinroq |

Standart: **jo'natuvchi filial** to'laydi. Sozlamada o'zgartiriladi.

### 20.18.3. Tayyor mahsulot jo'natmasi

20.8 dagi jo'natmaga ham transport summasi kiritiladi. Bir jo'natmada bir necha
buyurtma bo'lsa — summa bitta va u **buyurtmalarga bo'linmaydi**, umumiy xarajat
bo'lib qoladi.

Sabab: har buyurtmaga bo'lish tannarxni buzadi va 20.17 dagi foyda taqsimotini
murakkablashtiradi.

### 20.18.4. Hisobot

Yangi hisobot **20.13.2.4. Filiallararo transport xarajati** — davr bo'yicha,
yo'nalish kesimida:

```
Avgust 2026
  Markaziy → Samarqand      8 ta ko'chirish      1 240 000
  Samarqand → Chilonzor    12 ta jo'natma          860 000
  Markaziy → Farg'ona       5 ta ko'chirish        740 000
  ────────────────────────────────────────────────────────
  Jami                                           2 840 000
```

Bu hisobot filial ochishning haqiqiy narxini ko'rsatadi.

---

## 20.19. Filiallar soni

Hozircha aniq emas. Tizim quyidagi ikki holatga ham **tayyor** bo'lib quriladi:

| Holat | Nima farq qiladi |
|---|---|
| **Bir shaharda** | ko'chirish tez-tez, transport arzon, kunlik bo'lishi mumkin |
| **Viloyatlar orasida** | ko'chirish kamdan-kam, transport qimmat, yo'lda kunlar o'tadi |

Shuning uchun:

- Transport xarajati **ixtiyoriy** maydon (20.18.2) — bir shaharda bo'sh qoldiriladi
- "Yo'lda" holati **muddatsiz** — bir kunmi, bir haftami, farqi yo'q
- Ko'chirish so'rovi soniga cheklov yo'q

Filiallar soni aniq bo'lganda bu band yangilanadi.

---

*20-bo'lim oxiri. Barcha qaror qabul qilingan.*


---

# TZ QO'SHIMCHA BO'LIMLAR — v1.15 uchun

Uch qism:
- **21-bo'lim · Rejalar** (yangi modul)
- **8.17 va 3.15** (auditda topilgan bo'shliqlar — U-01, U-05)
- **Soliq maydonlari** (mavjud bandlarga qo'shimcha)

---

# 21-BO'LIM · REJALAR

> **Asos:** Q-22, Q-27
> **Qamrov:** sotuvchi · filial · korxona. **Ustaga reja qo'yilmaydi.**

## 21.1. Nima uchun

Hozir tizim faqat **fakt**ni ko'rsatadi: qancha sotildi, qancha foyda. "Qancha
bo'lishi kerak edi" degan raqam yo'q.

Reja moduli shu raqamni beradi va hamma hisobotga **bajarilish foizi** qo'shiladi.

## 21.2. Reja kimga qo'yiladi

| Kimga | Nima o'lchanadi | Davri |
|---|---|---|
| **Sotuvchi** | tushum (so'm) | oylik |
| **Filial** | tushum + foyda | oylik, yillik |
| **Korxona** | tushum + foyda | oylik, choraklik, yillik |

**Ustaga reja yo'q.** Sabab: jalyuzi o'lchami har xil — bitta 3×2.5 m mahsulot
to'rtta kichigining mehnatiga teng. Dona bo'yicha reja adolatsiz chiqadi.
Usta unumdorligi 11.8.1 da kv.m bo'yicha allaqachon o'lchanadi.

## 21.3. Reja ekrani

Yangi ekran: **Sozlamalar → Rejalar**.

```
Reja · Avgust 2026                                   [+ Yangi reja]

KORXONA
  Tushum          180 000 000 so'm
  Foyda            45 000 000 so'm

FILIALLAR
  Chilonzor       Tushum 100 000 000   Foyda 26 000 000
  Samarqand       Tushum  50 000 000   Foyda 12 000 000
  Farg'ona        Tushum  30 000 000   Foyda  7 000 000

SOTUVCHILAR
  Aziz (Chilonzor)          55 000 000
  Dilnoza (Chilonzor)       45 000 000
  Sardor (Samarqand)        50 000 000
  Nodir (Farg'ona)          30 000 000
```

### 21.3.1. Tekshiruv, majburiyat emas

Filiallar rejasi yig'indisi korxona rejasiga teng bo'lishi **shart emas** —
lekin farq bo'lsa ogohlantirish chiqadi:

```
⚠️ Filiallar yig'indisi 180 000 000 · korxona rejasi 180 000 000 ✅
⚠️ Sotuvchilar yig'indisi 180 000 000 · filiallar yig'indisi 180 000 000 ✅
```

Farq bo'lsa qizil ko'rsatiladi, lekin saqlash bloklanmaydi.

### 21.3.2. Nusxa ko'chirish

"O'tgan oydan nusxa" tugmasi — barcha rejalar ko'chiriladi. Ustiga foiz
qo'shish mumkin:

```
O'tgan oydan nusxa    [ +10 % ]    [ Qo'llash ]
```

## 21.4. Reja o'zgartirish

Oy boshlangandan keyin ham o'zgartirilishi mumkin, lekin:

- Har o'zgarish **audit jurnaliga** tushadi (2.4)
- Eski qiymat va sabab saqlanadi
- Hisobotda "reja o'zgartirilgan" belgisi chiqadi

Sabab: oy oxirida rejani pastga tushirib "bajardik" deyish holatining oldini olish.

## 21.5. Fakt qanday hisoblanadi

| Reja turi | Fakt manbai |
|---|---|
| Sotuvchi tushumi | o'sha sotuvchi qabul qilgan buyurtmalar, **topshirilgan** holatidagilar |
| Filial tushumi | **sotgan filial** bo'yicha (20.4) |
| Filial foydasi | **taqsimlangan foyda** (20.17) |
| Korxona | umumiy (11.4.1) |

### 21.5.1. Qaytarilgan buyurtma

Qaytarilsa (8.10) tushum **kamayadi** — qaytarilgan oyda, sotilgan oyda emas.

Ushlab qolingan summa tushum bo'lib qoladi.

## 21.6. Hisobotlar

### 21.6.1. Reja va fakt

Yangi hisobot. Davr va kesim tanlanadi.

```
Avgust 2026 · Filiallar

              Reja          Fakt         Farq        Bajarilish
Chilonzor  100 000 000   87 400 000  −12 600 000       87.4%  🟡
Samarqand   50 000 000   54 200 000   +4 200 000      108.4%  🟢
Farg'ona    30 000 000   18 900 000  −11 100 000       63.0%  🔴
──────────────────────────────────────────────────────────────
Jami       180 000 000  160 500 000  −19 500 000       89.2%
```

Ranglar sozlamadan (14.4): 🔴 < 80% · 🟡 80–95% · 🟢 ≥ 95%.

### 21.6.2. Oy ichida sur'at

Oy tugamasdan turib bajarilishni baholaydi:

```
Chilonzor · Avgust · bugun 15-kun (48% o'tdi)

  Reja          100 000 000
  Fakt           41 200 000     41.2%
  Kutilgan       48 400 000     ⚠️ 7 200 000 orqada

  Shu sur'atda oy oxirida: 85 800 000  (85.8%)
```

Bu dashboardda ham ko'rinadi (21.7).

### 21.6.3. Reja tarixi

Qaysi reja qachon, kim tomonidan, qanday sababdan o'zgartirilgani.

## 21.7. Dashboard

11.3 dashboardining **birinchi qatoriga** qo'shiladi:

```
BUGUN
  Tushum 4 200 000 · 6 buyurtma · o'rtacha chek 700 000 · kassa 3 100 000

OY REJASI
  ████████████░░░░░░░  41.2%     ⚠️ 7 200 000 orqada
```

Sotuvchi kirganda **o'z rejasi**, filial admini kirganda **filial rejasi**,
bosh admin kirganda **korxona rejasi** ko'rinadi.

## 21.8. Bot

13.9 (admin bot) ga oylik xabar — har oyning 1-kuni:

```
📊 Iyul yakuni

Korxona     160 500 000 / 180 000 000    89.2%  🟡
  Chilonzor  87 400 000 / 100 000 000    87.4%
  Samarqand  54 200 000 /  50 000 000   108.4%  🟢
  Farg'ona   18 900 000 /  30 000 000    63.0%  🔴
```

## 21.9. Edge case

| Kod | Holat | Qaror |
|---|---|---|
| **EC-REJ-01** | Reja qo'yilmagan oy | Hisobotda "reja yo'q", bajarilish hisoblanmaydi |
| **EC-REJ-02** | Sotuvchi oy o'rtasida ishga kirdi | Reja qo'lda qo'yiladi, avtomatik proporsiya yo'q |
| **EC-REJ-03** | Sotuvchi boshqa filialga ko'chdi | Eski filialda eski reja, yangi filialda yangi reja |
| **EC-REJ-04** | Filial oy o'rtasida ochildi | Reja qo'lda, qisqargan davr uchun |
| **EC-REJ-05** | Fakt rejadan 200% oshdi | Ogohlantirish yo'q — bu yaxshi natija |
| **EC-REJ-06** | Reja 0 qo'yilgan | Bajarilish hisoblanmaydi, "reja yo'q" bilan bir xil |
| **EC-REJ-07** | Reja oyning oxirgi kunida o'zgartirildi | Jurnalga tushadi, hisobotda belgi bilan (21.4) |

## 21.10. Sozlamalar

14.4 ga yangi qatorlar:

| Sozlama | Standart | Band |
|---|---|---|
| Reja bajarilishi — past chegara | 80% | 21.6.1 |
| Reja bajarilishi — yaxshi chegara | 95% | 21.6.1 |
| Oylik yakun xabari yuborilsinmi | ha | 21.8 |

---

# 8.17 · ISHLAB CHIQARISH BRAKI VA QAYTA KESISH

> **Sabab:** AUDIT U-01 — TZ da "2.9-band" ga to'rt joydan havola bor, lekin
> bunday band mavjud emas. Jarayon uchta bandga sochilgan (8.11, 10.13, 13.8).
> **Asos:** Q-15

## 8.17.1. Nima bu

Usta kesdi yoki tikdi, mahsulot yaroqsiz chiqdi. Buyurtma bajarilishi kerak,
demak **material ikkinchi marta** yechiladi.

Bu ombor braki (7.10) dan farq qiladi: u yerda material omborda buzilgan,
bu yerda ishlab chiqarish jarayonida.

## 8.17.2. Oqim

```
1. Usta botdan so'rov yuboradi        13.8
       ↓
2. Admin ko'radi va qaror qiladi      13.9
       ↓
3. Tasdiqlansa:
     · eski band bo'shaydi (agar qolgan bo'lsa)
     · yangi bo'lak topiladi va band qilinadi   7.3
     · pozitsiya "Ishlab chiqarilmoqda" ga qaytadi
     · birinchi kesim to'liq chiqindiga         7.6
     · haq bekor qilinadi                       8.17.5
       ↓
4. Usta qayta kesadi va "Tugatdim" bosadi
```

## 8.17.3. So'rov tarkibi

Usta botdan yuboradi:

| Maydon | Izoh |
|---|---|
| Pozitsiya | avtomatik — usta qaysi ishda turgani |
| Sabab | ro'yxatdan: o'lcham xato · mato yirtildi · tikuv buzildi · mexanizm nosoz · boshqa |
| Izoh | ixtiyoriy |
| Rasm | ixtiyoriy |

## 8.17.4. Material ikkinchi marta

Yangi bo'lak odatdagi algoritm bilan topiladi (7.6).

**Mos bo'lak topilmasa** — pozitsiya "Materialga kutmoqda"ga tushadi va sotuvchiga
bildirishnoma ketadi (mijozga kechikish haqida aytish kerak).

Birinchi kesimdan chiqqan bo'lak: agar butunligicha yaroqsiz bo'lsa **to'liq
chiqindiga**. Agar bir qismi yaroqli bo'lsa (masalan o'lcham xato bo'lgani uchun
kichikroq bo'lak qolgan) — usta uni **ostatka** qilib qoldirishi mumkin.

## 8.17.5. Haq

**Qaror Q-15: qayta kesish uchun haq to'lanmaydi.**

- Birinchi "Tugatdim" dagi haq **bekor qilinadi** (teskari yozuv, xodim harakatiga)
- Ikkinchi "Tugatdim" da haq **bir marta** hisoblanadi
- Natija: usta bir marta oladi, ikki marta ishlagan bo'lsa ham

### 8.17.5.1. Istisno — ustaning aybi bo'lmasa

Sabab "mato yirtildi" yoki "mexanizm nosoz" bo'lsa va bu **material defekti**
bo'lsa — usta aybdor emas.

Bunda admin qo'lda haq qo'sha oladi (10.14 — xodim balansini tuzatish). Bu amal
audit jurnaliga tushadi.

Material defekti bo'lsa, u yetkazib beruvchiga da'vo (9.9) bo'lib rasmiylashtiriladi.

## 8.17.6. Ushlanma

10.13 dagi qoida o'zgarmaydi: admin brak uchun ustadan summa ushlab qolishi mumkin.

Ushlanma **ish haqi xarajatini kamaytiradi**, alohida daromad emas (11.4.1).

## 8.17.7. Xarajat

Ikkinchi marta yechilgan material **ishlab chiqarish braki** moddasiga tushadi
(11.4.1). Birinchi kesim chiqindisi ham shu moddaga.

⚠️ Chiqindi moddasiga **tushmaydi** — chiqindi bu odatdagi kesish qoldig'i,
bu esa brak.

## 8.17.8. Statuslar

Yangi status kerak emas. Pozitsiya "Ishlab chiqarilmoqda"ga qaytadi.

Lekin **belgi** qo'yiladi: `qayta_kesildi` soni. Ikkinchi marta so'ralsa admin
buni ko'radi:

```
⚠️ Bu pozitsiya 2 marta qayta kesilgan.
   Material yo'qotishi: 7.20 kv.m · 631 000 so'm
```

## 8.17.9. Edge case

| Kod | Holat | Qaror |
|---|---|---|
| **EC-BRK-01** | Usta so'rov yubordi, admin rad etdi | Pozitsiya o'z holida qoladi, usta ishni davom ettiradi yoki qaytarib beradi (8.6) |
| **EC-BRK-02** | Qayta kesishda mos bo'lak yo'q | "Materialga kutmoqda", sotuvchiga bildirishnoma |
| **EC-BRK-03** | Usta uchinchi marta so'radi | Ruxsat beriladi, lekin adminga jami yo'qotish ko'rsatiladi (8.17.8) |
| **EC-BRK-04** | Brak so'ralgan, keyin buyurtma bekor qilindi | Band bo'shaydi, birinchi kesim chiqindi bo'lib qoladi |
| **EC-BRK-05** | Usta "Tugatdim" bosgan, keyin brak topildi | Haq bekor qilinadi, material tiklanmaydi (allaqachon kesilgan) |
| **EC-BRK-06** | Filial boshqa — brak qayerda hisoblanadi | Tikkan filialda (20.3) |
| **EC-BRK-07** | Material defekti sababli brak | Haq saqlanadi (8.17.5.1), yetkazib beruvchiga da'vo (9.9) |

---

# 3.15 · TAYYORDAN TANLASH

> **Sabab:** AUDIT U-05 — TZ 7.13 "Sotuv ekranida 'Tayyordan tanlash'" deydi,
> lekin 3-bo'limda bunday tugma yo'q.
> **Asos:** Q-16

## 3.15.1. Nima bu

Qaytarilgan yoki rad etilgan tayyor mahsulot omborda turadi (7.13). Uni
chegirma bilan sotish mumkin.

## 3.15.2. Oqim

Sotuv ekranida **"Tayyordan tanlash"** tugmasi. Bosilganda ro'yxat ochiladi:

```
Tayyor mahsulotlar                        [ o'lcham bo'yicha qidirish ]

  Rollo · Ko'k mato · to'r      210 × 140     #1198 dan     12 kun
  Plisse · Oq                   180 × 220     #1203 dan     28 kun
  Dikke · Bej                   160 × 200     #1211 dan     45 kun  ⚠️
```

Tanlanganda pozitsiya buyurtmaga qo'shiladi. O'lchamni o'zgartirib bo'lmaydi —
mahsulot allaqachon tayyor.

## 3.15.3. Narx

**Qaror Q-16: mahsulotning o'z narxi ishlatiladi**, qaytadan hisoblanmaydi.

Sotuvchi chegirma qo'yadi — odatdagi mexanizm (3.11):

```
Rollo · Ko'k mato · 210 × 140
  Narxi (asl buyurtmadan)        678 400
  Chegirma                     − 178 400   (26.3%)  ⚠️ limitdan oshdi
  Sotuv narxi                    500 000
```

Chegirma limiti (3.11) bu yerda ham ishlaydi — oshsa ogohlantirish chiqadi,
sotuvchi davom eta oladi, amal jurnalga tushadi.

## 3.15.4. Tannarx

Mahsulotning **saqlangan tannarxi** ishlatiladi — u "Tugatdim" paytida
hisoblangan va snapshot bo'lgan (7.8, 2.3-invariant).

⚠️ Material **qayta yechilmaydi** — u allaqachon yechilgan. Faqat tushum yoziladi.

Foyda: `sotuv narxi − saqlangan tannarx`. Chegirma katta bo'lsa foyda manfiy
chiqishi mumkin — bu normal, mahsulot omborda yotgandan ko'ra yaxshi.

## 3.15.5. Ombor

Sotilgach mahsulot 7.13 ro'yxatidan chiqadi. Ombor qoldig'iga tegilmaydi.

11.7.6 ("muzlab qolgan pul") hisobotida uning qiymati kamayadi.

## 3.15.6. Filial

Faqat **o'z filialidagi** tayyor mahsulotlar ko'rinadi.

Boshqa filialda mos o'lcham bo'lsa — 20.8 dagi jo'natma orqali ko'chiriladi,
keyin sotiladi.

## 3.15.7. Yoshi bo'yicha ogohlantirish

30 kundan oshgan mahsulot ⚠️ belgisi bilan. 90 kundan oshgani 🔴.

Sozlamada (14.4) chegaralar o'zgartiriladi.

Dashboard "Diqqat talab qiladi" qatoriga qo'shiladi: **90 kundan oshgan tayyor
mahsulot**.

## 3.15.8. Edge case

| Kod | Holat | Qaror |
|---|---|---|
| **EC-TAY-01** | Ikki sotuvchi bir vaqtda bitta mahsulotni tanladi | Birinchisi oladi, ikkinchisiga "band qilingan" |
| **EC-TAY-02** | Chegirma tannarxdan past | Ruxsat beriladi, ogohlantirish bilan. Foyda manfiy chiqadi |
| **EC-TAY-03** | Tayyordan sotilgan buyurtma qaytarildi | Yana 7.13 ro'yxatiga qaytadi |
| **EC-TAY-04** | Mahsulot omborda yo'qoldi | Hisobdan chiqarish (7.10), saqlangan tannarx xarajatga |
| **EC-TAY-05** | Mijoz o'lchamni biroz o'zgartirishni so'radi | Ruxsat berilmaydi — bu yangi buyurtma |

---

# SOLIQ MAYDONLARI

> **Asos:** Q-23 — maydonlar hozirdan yig'iladi, elektron faktura keyin ulanadi.

## Mijoz kartochkasiga (6.7)

Yangi blok — **Rekvizitlar**. Faqat yuridik shaxs tanlanganda ochiladi.

| Maydon | Majburiy | Izoh |
|---|---|---|
| **Turi** | ✅ | Jismoniy shaxs / Yuridik shaxs |
| Tashkilot nomi | yuridik uchun ✅ | to'liq rasmiy nom |
| **INN / STIR** | yuridik uchun ✅ | 9 raqam, tekshiriladi |
| Yuridik manzil | yuridik uchun ✅ | — |
| Bank nomi | — | — |
| Hisob raqami | — | 20 raqam |
| MFO | — | 5 raqam |
| Shartnoma raqami | — | — |
| Shartnoma sanasi | — | — |
| **NDS to'lovchisimi** | ✅ | ha / yo'q |

Jismoniy shaxs uchun bu blok umuman ko'rinmaydi — 6.5 dagi mavjud maydonlar
yetarli.

## Buyurtmaga (8.14)

Yangi maydonlar:

| Maydon | Izoh |
|---|---|
| **NDS stavkasi** | mijoz kartochkasidan avtomatik, o'zgartirilishi mumkin |
| **NDS summasi** | hisoblanadi |
| Summa NDSsiz | hisoblanadi |

Mijoz NDS to'lovchisi bo'lmasa — maydonlar bo'sh, NDS 0.

### Hisoblash

```
Buyurtma summasi (NDS bilan)     678 400
NDS stavkasi                         12%
NDS summasi                       72 686
Summa NDSsiz                     605 714
```

⚠️ NDS **narxdan ajratiladi**, ustiga qo'shilmaydi — mijozga aytilgan narx
o'zgarmaydi.

## Hisobotga (11.4)

Yangi hisobot — **11.4.8. NDS bo'yicha**:

```
Avgust 2026

Yuridik shaxslarga sotildi        42 800 000
  Shundan NDS                      4 585 714
  NDSsiz                          38 214 286

Jismoniy shaxslarga               117 700 000

Jami tushum                      160 500 000
```

Excel eksporti bilan — buxgalter o'z dasturiga yuklaydi.

## Chekka (3.14)

Yuridik shaxs bo'lsa chekda qo'shimcha ko'rsatiladi: tashkilot nomi, INN,
NDS summasi.

## Elektron faktura

**Birinchi bosqichda ulanmaydi.** Ma'lumot yig'ilib boradi, operator (Didox,
Faktura.uz va boshqalar) tanlangandan keyin API ulanadi.

Shunda kerak bo'ladigan hamma narsa allaqachon bazada bo'ladi — qayta kiritish
shart emas.

---

*Qo'shimcha bo'limlar oxiri.*


---

# 22-BO'LIM · FILIALLARARO HISOB-KITOB

**Asos:** Q-29 … Q-35
**Sana:** 15.08.2026

---



## 22.1. Nima uchun

Filiallar bir-biri uchun ish qiladi: biri sotadi, ikkinchisi tikadi. Material
ham bir filialdan ikkinchisiga o'tadi.

Pul esa **qayerga tushgan bo'lsa o'sha yerda qoladi**. Demak filiallar
o'rtasida qarz paydo bo'ladi.

Bu **uchinchi qarz turi**. Mexanizm mijoz va yetkazib beruvchi qarzi bilan
bir xil (2.2-invariant): balans saqlanmaydi, harakatlardan `SUM()` bilan
hisoblanadi.

## 22.2. Qarz qachon tug'iladi

| Holat | Kim kimga qarzdor | Band |
|---|---|---|
| A sotdi, B tikdi | **A → B** | 22.3 |
| A dan B ga material ko'chirildi | **B → A** | 22.4 |
| A sotuvchisi pulni B ga topshirdi | **B → A** | 22.5 |

## 22.3. Tayyor mahsulot qarzi

**Qaror Q-33:** qarz = **tannarx + ish haqi + tikkan filialning foyda ulushi**.

### 22.3.1. Hisoblash

```
Buyurtma #1247 · Chilonzor sotdi · Samarqand tikdi

Tushum                            678 400   ← Chilonzor kassasida
Material tannarxi               − 312 000   ← Samarqand sarfladi
Ish haqi                        −  57 600   ← Samarqand to'ladi
─────────────────────────────────────────
Foyda                             308 800
  Chilonzor ulushi (50%)          154 400
  Samarqand ulushi (50%)          154 400

Chilonzor → Samarqand qarzi:
  312 000 + 57 600 + 154 400  =   524 000
```

Tekshiruv: Chilonzorda qoladi `678 400 − 524 000 = 154 400` — aynan uning
foyda ulushi. ✅

Samarqand oladi `524 000`, sarflagani `369 600` → foydasi `154 400`. ✅

### 22.3.2. Qachon yoziladi

Qarz **"Topshirildi"** statusida yoziladi — mijoz mahsulotni olganda.

Ilgari emas, chunki:
- "Tayyor" — hali qaytishi mumkin
- "Yetib keldi" — mijoz rad etishi mumkin (8.10)

### 22.3.3. Zarar bo'lsa — qarz to'liq tannarxdan kam bo'lmaydi

⚠️ Chegirma katta bo'lsa buyurtma **zarar** bilan tugashi mumkin (3.15.4 da
bu ruxsat etilgan). Formula shunda salbiy natija beradi:

```
Tushum                            300 000
Tannarx                         − 312 000
Ish haqi                        −  57 600
─────────────────────────────────────────
Zarar                           −  69 600
  Har filial ulushi (50%)       −  34 800

Formula bo'yicha qarz: 312 000 + 57 600 − 34 800 = 334 800
Chilonzorda qoladi: 300 000 − 334 800 = −34 800 ❌
```

Sotgan filial **o'z cho'ntagidan** to'lashi kerak bo'lardi. Bu noto'g'ri —
zararni sotgan filial yolg'iz ko'tarmaydi.

**Qoida:** zarar bo'lsa qarz **tushum summasidan oshmaydi**:

```
qarz = MIN(tannarx + ish haqi + foyda ulushi,  tushum)
```

Misolda: `MIN(334 800, 300 000) = 300 000`.

Chilonzor butun tushumni beradi, o'zida 0 qoladi. Zararni tikkan filial
ko'taradi — chunki xarajat unda sodir bo'lgan.

**Zararni teng bo'lish kerak bo'lsa** — admin `filial_harakat` ga qo'lda
tuzatish yozadi (`QOLDA_TUZATISH` turi). Bu audit jurnaliga tushadi.

Sabab: avtomatik teng bo'lish sotgan filialning kassasidan pul talab qiladi
va u pul u yerda bo'lmasligi mumkin.

### 22.3.4. Buyurtma qaytarilsa

8.10 bo'yicha qaytarilganda qarz **teskari yoziladi**. Ushlab qolingan summa
ham 50/50 bo'linadi (20.17.1).

### 22.3.5. Bir filial sotdi va tikdi

Qarz umuman tug'ilmaydi. Foyda 100% o'sha filialda (20.17.1).

## 22.4. Material ko'chirish qarzi

**Qaror Q-35: tannarx bo'yicha standart, qo'lda o'zgartirish mumkin.**

### 22.4.1. Summa

Ko'chirish hujjatida (20.7.2) summa **avtomatik hisoblanadi**:

```
Ko'chirish №28 · Markaziy → Samarqand

  Ko'k mato · to'r    30.00 m × 3.00 m eni
  Tannarx bo'yicha                        2 620 000 so'm
  Summa                     [ 2 620 000 ]  ← o'zgartirish mumkin
```

Omborchi odatda hech narsa yozmaydi. O'zgartirilsa:
- **Sabab majburiy**
- **Audit jurnaliga** tushadi (2.4)
- Hisobotda belgi qoladi

### 22.4.2. Nega ichki ustama qo'yilmaydi

Beruvchi filialga ustama qo'shilsa, korxona darajasida **soxta foyda** paydo
bo'ladi: mato hali sotilmagan, omborda turibdi, lekin hisobotda foyda ko'rinadi.

Oy oxirida umumiy foyda haqiqiy bo'lmaydi va uni tozalash uchun alohida hisob
kerak bo'ladi. Shuning uchun tannarx bo'yicha.

### 22.4.3. Tannarx ko'chishda o'zgarmaydi

Bo'lakning `tannarx_birlik_snapshot` qiymati o'zgarmaydi (20.7.3, 2.3-invariant).
Qarz summasi alohida narsa — u faqat filiallar o'rtasidagi hisob.

### 22.4.4. Qachon yoziladi

**Qabul qilinganda** (`holat = QABUL`), yo'lga chiqqanda emas.

## 22.5. Pul topshirish

**Qaror Q-29:** sotuvchi qaysi filial mahsulotini sotsa ham, pul **uning
kassasida** turadi. U pulni **istalgan filial** adminiga topshirishi mumkin.

### 22.5.1. Oqim

```
Sotuvchi Aziz (Chilonzor) · kassasida 4 200 000
       ↓ topshiradi
Samarqand admin kassasiga
       ↓
Samarqand → Chilonzor qarzi: 4 200 000
```

`topshiriq` jadvali (12.7) buni allaqachon qo'llab-quvvatlaydi —
`kimdan_kassa_id` va `kimga_kassa_id` har xil filialda bo'lishi mumkin.

### 22.5.2. Standart

Standart holat — o'z filiali admini. Boshqa filial tanlansa ogohlantirish:

```
⚠️ Siz Chilonzor sotuvchisisiz, pulni Samarqandga topshiryapsiz.
   Samarqand Chilonzorga 4 200 000 so'm qarzdor bo'ladi.
```

## 22.6. Filial balansi

### 22.6.1. Ko'rinishi

Yangi ekran: **Filiallar → Hisob-kitob**.

```
Chilonzor · Avgust 2026

  Samarqand                          −8 400 000    (biz qarzdormiz)
  Farg'ona                           +2 100 000    (bizga qarzdor)
  Markaziy ombor                     −3 620 000    (biz qarzdormiz)
  ────────────────────────────────────────────
  Sof balans                         −9 920 000
```

### 22.6.2. O'zaro hisob

**Qaror Q-34:** oy oxirida o'zaro hisoblanadi, **faqat farq** o'tkaziladi.

```
Chilonzor ↔ Samarqand · Avgust yakuni

  Chilonzor → Samarqand    (tayyor mahsulot)      12 400 000
  Samarqand → Chilonzor    (pul topshirish)        4 000 000
  ─────────────────────────────────────────────────────────
  Chilonzor to'laydi                               8 400 000
```

Istalgan vaqtda oraliq to'lov ham qilish mumkin — oy oxirini kutish shart emas.

### 22.6.3. To'lov

To'lov — odatdagi kassa amali:
- Beruvchi filial kassasidan chiqim (yangi kod **C10**)
- Qabul qiluvchi filial kassasiga kirim (yangi kod **K8**)
- Filial balansi yopiladi

Ikki bosqichli, `topshiriq` naqshi bilan (12.8): jo'natildi → qabul qilindi.

## 22.7. Hisobotlar

### 22.7.1. Filiallararo balans

Kim kimga qancha qarzdor, joriy holat.

### 22.7.2. Filiallararo harakat

Davr bo'yicha: qaysi sababdan qancha qarz tug'ildi va qancha yopildi.

```
Avgust 2026 · Chilonzor ↔ Samarqand

  Tayyor mahsulot     18 buyurtma      12 400 000
  Material ko'chirish   2 hujjat        1 240 000
  Pul topshirish        3 marta       − 4 000 000
  To'lov                1 marta       − 8 000 000
  ──────────────────────────────────────────────
  Oy oxirida qarz                       1 640 000
```

### 22.7.3. Foyda-zarar ta'siri

⚠️ **Filiallararo qarz foyda-zararga tegmaydi.** Bu korxona ichidagi harakat —
xarajat ham, daromad ham emas.

11.4.1 hisoboti filial kesimida ko'rsatilganda foyda 20.17 bo'yicha taqsimlanadi,
qarz esa alohida hisob.

## 22.8. Edge case

| Kod | Holat | Qaror |
|---|---|---|
| **EC-FQ-01** | Buyurtma topshirildi, keyin qaytarildi | Qarz teskari yoziladi, ushlanma 50/50 |
| **EC-FQ-02** | Ko'chirish qabul qilinmadi, bekor bo'ldi | Qarz yozilmaydi (22.4.4) |
| **EC-FQ-03** | Ko'chirishda haqiqiy o'lcham kichik chiqdi (EC-FIL-12) | Qarz haqiqiy o'lcham bo'yicha |
| **EC-FQ-04** | Filial yopildi, qarzi bor | Qarz bosh filialga o'tadi |
| **EC-FQ-05** | Ikki filial bir-biriga teng qarzdor | O'zaro hisobda 0, to'lov kerak emas |
| **EC-FQ-06** | Omborchi ko'chirish summasini 0 qo'ydi | Ruxsat beriladi, sabab majburiy, jurnalga tushadi |
| **EC-FQ-07** | Qarz to'lovi yo'lda, oy yopildi | Yo'ldagi summa alohida qatorda (12.8 naqshi) |
| **EC-FQ-08** | Sotuvchi boshqa filialga pul topshirdi, keyin storno | Qarz ham teskari yoziladi |
| **EC-FQ-09** | Buyurtma zarar bilan tugadi | Qarz = tushum summasi, ortiq emas (22.3.3) |
| **EC-FQ-10** | Zararni teng bo'lish kerak | Admin qo'lda tuzatish yozadi, jurnalga tushadi |

## 22.9. Ma'lumotlar modeliga qo'shimcha

### 22.9.1. Yangi jadval `filial_harakat`

```sql
sana                TIMESTAMPTZ NOT NULL DEFAULT now(),
kimdan_filial_id    BIGINT NOT NULL REFERENCES filial(id),
kimga_filial_id     BIGINT NOT NULL REFERENCES filial(id),
turi                TEXT NOT NULL CHECK (turi IN
                      ('TAYYOR_MAHSULOT','MATERIAL_KOCHIRISH',
                       'PUL_TOPSHIRISH','TOLOV','QAYTARISH','QOLDA_TUZATISH')),
summa               NUMERIC(14,2) NOT NULL,
valyuta             TEXT NOT NULL DEFAULT 'SOM',
kurs_snapshot       NUMERIC(10,2),
manba_turi          TEXT,
manba_id            BIGINT,
qolda_ozgartirildi  BOOLEAN NOT NULL DEFAULT false,
ozgartirish_sabab   TEXT,
izoh                TEXT,
CHECK (kimdan_filial_id <> kimga_filial_id)
```

`UPDATE`/`DELETE` taqiq. Balans `SUM()` bilan hisoblanadi.

### 22.9.2. `kochirish` jadvaliga qo'shimcha

```sql
qarz_summa          NUMERIC(14,2),        -- 22.4.1
qarz_qolda          BOOLEAN NOT NULL DEFAULT false,
qarz_sabab          TEXT
```

### 22.9.3. Yangi kassa kodlari

| Kod | Nima | Band |
|---|---|---|
| **K8** | Filialdan qarz to'lovi (kirim) | 22.6.3 |
| **C10** | Filialga qarz to'lovi (chiqim) | 22.6.3 |

### 22.9.4. Yangi tekshiruv invarianti

11-invariant qo'shiladi:

> Barcha filial balanslarining yig'indisi **0** bo'lishi shart.
> `SUM(filial_harakat.summa) = 0` — chunki har qarz ikki tomonlama.

---



---

# QISM 3 — MA'LUMOTLAR MODELI

> 44 jadval, indekslar, triggerlar, tekshiruv invariantlari.

---



**Loyiha:** Jalyuzi ERP
**Asos:** TZ v1.14 + 20-bo'lim (ko'p filial) + 21-bo'lim (rejalar) + 8.17, 3.15 + AUDIT (14 qaror)
**Baza:** PostgreSQL 16+

---

## 0. UMUMIY QOIDALAR

Bu qoidalar **barcha jadvalga** tegishli. Har jadvalda takrorlanmaydi.

### 0.1. Majburiy ustunlar

```sql
id             BIGSERIAL PRIMARY KEY,
yaratildi      TIMESTAMPTZ NOT NULL DEFAULT now(),
yaratdi_id     BIGINT NOT NULL REFERENCES xodim(id),
ozgartirildi   TIMESTAMPTZ,
ozgartirdi_id  BIGINT REFERENCES xodim(id)
```

Spravochnik jadvallarida qo'shimcha:

```sql
faol           BOOLEAN NOT NULL DEFAULT true,
ochirildi      TIMESTAMPTZ
```

### 0.2. Turlar

| Nima | Tur |
|---|---|
| Pul | `NUMERIC(14,2)` |
| Valyuta | `TEXT CHECK (valyuta IN ('SOM','USD'))` |
| O'lcham — buyurtma (sm) | `INTEGER` |
| O'lcham — bo'lak (metr) | `NUMERIC(8,2)` |
| Maydon (kv.m) | `NUMERIC(10,4)` |
| Foiz | `NUMERIC(6,2)` |
| Telegram ID | `BIGINT` |
| Holat, tur | `TEXT` + `CHECK` |

`FLOAT`, `REAL`, `MONEY`, `ENUM` — **taqiqlanadi**.

### 0.3. Qat'iy taqiqlar

- `DELETE` yo'q — `faol = false`
- `ON DELETE CASCADE` yo'q
- Balans ustuni saqlanmaydi — `SUM()` bilan hisoblanadi (2.2-invariant)
- `_snapshot` bilan tugagan ustunlar `UPDATE` dan trigger bilan himoyalanadi (2.3)
- Harakat jadvallarida (`*_harakat`, `kassa_yozuv`) `UPDATE`/`DELETE` taqiq — faqat storno

### 0.4. Nomlash

`snake_case`, o'zbekcha. Tashqi kalit — `<jadval>_id`.

---

## 1. ASOS

### 1.1. `filial`

TZ 20.2

```sql
nom                      TEXT NOT NULL,
manzil                   TEXT,
telefon                  TEXT,
sotadi                   BOOLEAN NOT NULL DEFAULT true,
ishlab_chiqaradi         BOOLEAN NOT NULL DEFAULT true,
standart_ishlab_chiqaruvchi_id  BIGINT REFERENCES filial(id),
kassa_yopilish_soati     TIME NOT NULL DEFAULT '20:00',
bosh                     BOOLEAN NOT NULL DEFAULT false
```

- `bosh = true` bo'lgan **faqat bitta** filial (unique index)
- `sotadi = false AND ishlab_chiqaradi = false` → markaziy ombor (20.2.1)
- `ishlab_chiqaradi = false` bo'lsa `standart_ishlab_chiqaruvchi_id` majburiy

### 1.2. `xodim`

TZ 10 + 20.11. **Foydalanuvchi va xodim — bitta jadval.**

```sql
filial_id       BIGINT NOT NULL REFERENCES filial(id),
ism             TEXT NOT NULL,
telefon         TEXT NOT NULL UNIQUE,
rol_id          BIGINT NOT NULL REFERENCES rol(id),
parol_hash      TEXT,                    -- usta uchun NULL
telegram_id     BIGINT UNIQUE,
ishga_kirdi     DATE,
ishdan_chiqdi   DATE
```

- Usta saytga kirmaydi → `parol_hash` NULL bo'lishi mumkin (Q-04 qattiq qoidasi)
- Filial o'zgarsa balans va tarix saqlanadi (EC-FIL-06)

### 1.3. `rol`, `ruxsat`, `rol_ruxsat`

TZ 14.6 + 20.12

```sql
-- rol
nom             TEXT NOT NULL UNIQUE,
tizimli         BOOLEAN NOT NULL DEFAULT false   -- o'chirib bo'lmaydi

-- ruxsat (spravochnik, kodda belgilanadi)
kod             TEXT PRIMARY KEY,        -- 'ombor.kirim.yarat'
nom             TEXT NOT NULL,
guruh           TEXT NOT NULL

-- rol_ruxsat
rol_id          BIGINT NOT NULL REFERENCES rol(id),
ruxsat_kod      TEXT NOT NULL REFERENCES ruxsat(kod),
qamrov          TEXT NOT NULL CHECK (qamrov IN ('OZ_FILIALI','BARCHA')),
PRIMARY KEY (rol_id, ruxsat_kod)
```

Qattiq qoidalar (kodda, matritsada emas):
1. Usta roli saytga kira olmaydi
2. Sotuvchi boshqa sotuvchi kassasini ko'rmaydi
3. Admin `sozlama.ozgartir` ni o'zidan olib qo'ya olmaydi
4. Filial xodimi boshqa filial kassasini ko'rmaydi — `qamrov = BARCHA` bo'lsa ham (20.12.1)

### 1.4. `sessiya`

```sql
xodim_id        BIGINT NOT NULL REFERENCES xodim(id),
token_hash      TEXT NOT NULL UNIQUE,
amal_qiladi     TIMESTAMPTZ NOT NULL,
ip              TEXT,
qurilma         TEXT
```

JWT emas — bazada, darhol bekor qilish uchun.

### 1.5. `audit_jurnal`

TZ 2.4 + AUDIT U-08

```sql
sana            TIMESTAMPTZ NOT NULL DEFAULT now(),
xodim_id        BIGINT NOT NULL REFERENCES xodim(id),
filial_id       BIGINT REFERENCES filial(id),
amal            TEXT NOT NULL,       -- 'STORNO','QOLDA_TUZATISH','CHEGARADAN_OSHDI',...
obyekt_turi     TEXT NOT NULL,
obyekt_id       BIGINT NOT NULL,
eski_qiymat     JSONB,
yangi_qiymat    JSONB,
izoh            TEXT,
ip              TEXT
```

Yozuv **o'sha tranzaksiya ichida** yoziladi.

### 1.6. `sozlama`

TZ 14

```sql
kalit           TEXT PRIMARY KEY,    -- 'kurs', 'kesish_bagrikenglik'
qiymat          TEXT NOT NULL,
turi            TEXT NOT NULL,       -- 'SON','MATN','PUL','FOIZ','MANTIQIY'
guruh           TEXT NOT NULL,
tz_band         TEXT
```

### 1.7. `kurs_tarix`

TZ 14.5 + AUDIT U-13

```sql
sana            DATE NOT NULL UNIQUE,
qiymat          NUMERIC(10,2) NOT NULL
```

Kursga tayanadigan **yettita** joy: 6.3 offset · 6.4 limit · 8.13 buyurtma ·
9.6 kirim · 9.6 kurs farqi · 10.5 xodim balansi · 12.9 ayirboshlash.

### 1.8. `amal_kaliti`

Idempotentlik, TZ 13.10

```sql
kalit           TEXT PRIMARY KEY,
natija          JSONB NOT NULL,
yaratildi       TIMESTAMPTZ NOT NULL DEFAULT now()
```

---

## 2. SPRAVOCHNIKLAR

### 2.1. `material`

TZ 5 + Q-01, Q-14. **Umumiy** — filialga bog'lanmagan (20.3).

```sql
nom                      TEXT NOT NULL,
hisob_turi               TEXT NOT NULL CHECK (hisob_turi IN
                           ('RULON','CHIZIQLI','DONA','KV_M')),
kirim_birligi            TEXT NOT NULL,     -- 'shtanga','rulon','quti','metr','dona'
sarflash_birligi         TEXT NOT NULL CHECK (sarflash_birligi IN
                           ('SM','KV_M','DONA')),
koeffitsient             NUMERIC(10,4) NOT NULL DEFAULT 1,
-- Q-01: koeffitsient = 1 kirim birligida nechta sarflash birligi
--       metr→100, shtanga→300, quti(10×3m)→3000

sotuv_narx               NUMERIC(14,2),     -- 1 metr / 1 kv.m / 1 dona uchun
sotuv_valyuta            TEXT NOT NULL DEFAULT 'SOM',
min_ustama_foiz          NUMERIC(6,2),      -- bo'sh → sozlamadagi standart (5.4)

yaroqsiz_chegara_m       NUMERIC(6,2),      -- bo'sh → standart 0.5 (AUDIT Z-09)
kam_ishlatiladigan_m     NUMERIC(6,2),      -- bo'sh → standart 1.0 (AUDIT Z-09)
kam_qoldiq_chegara_m     NUMERIC(6,2),      -- Q-10: metrda
standart_rulon_eni_m     NUMERIC(6,2),      -- Q-14: chegarani kv.m ga o'girish uchun

almashtirish_guruh_id    BIGINT REFERENCES almashtirish_guruh(id),
yaxlitlash_qadami        NUMERIC(8,2)       -- xarid ro'yxati uchun (AUDIT B-08)
```

⚠️ `standart_rulon_eni_m` bo'sh bo'lsa — oxirgi kirimdagi rulon eni olinadi (Q-14).

### 2.2. `almashtirish_guruh`

TZ 3.8 — bir-birini almashtira oladigan materiallar.

```sql
nom             TEXT NOT NULL
```

### 2.3. `material_filial_narx`

TZ 20.9 — **standart + istisno** naqshi.

```sql
material_id     BIGINT NOT NULL REFERENCES material(id),
filial_id       BIGINT NOT NULL REFERENCES filial(id),
sotuv_narx      NUMERIC(14,2) NOT NULL,
UNIQUE (material_id, filial_id)
```

Qator yo'q → standart narx ishlaydi.

### 2.4. `mahsulot_tur`

TZ 4

```sql
nom                 TEXT NOT NULL,
xizmat_haqi         NUMERIC(14,2) DEFAULT 0,
oynada_korinadi     BOOLEAN NOT NULL DEFAULT true,
botda_korinadi      BOOLEAN NOT NULL DEFAULT true
```

### 2.5. `mahsulot_slot`

TZ 4.4 — mahsulot turining material joylari.

```sql
mahsulot_tur_id     BIGINT NOT NULL REFERENCES mahsulot_tur(id),
nom                 TEXT NOT NULL,        -- 'Chet mato','O\'rta mato','Karniz'
tartib              INTEGER NOT NULL,
majburiy            BOOLEAN NOT NULL DEFAULT true,
almashtirish_guruh_id BIGINT REFERENCES almashtirish_guruh(id),
formula             TEXT NOT NULL         -- 'CHET * BOYI', 'ENI * 2'
```

`formula` — matn sifatida saqlanadi, TZ 4.5 dvigateli hisoblaydi.
Natija birligi materialning `sarflash_birligi` ga qarab talqin qilinadi (AUDIT B-01).

### 2.6. `mahsulot_parametr`

TZ 4.5 — formulada ishlatiladigan qo'shimcha parametrlar (`CHET` kabi).

```sql
mahsulot_tur_id     BIGINT NOT NULL REFERENCES mahsulot_tur(id),
kod                 TEXT NOT NULL,        -- 'CHET'
nom                 TEXT NOT NULL,
standart_qiymat     NUMERIC(10,2),
UNIQUE (mahsulot_tur_id, kod)
```

### 2.7. `mahsulot_aksessuar`

TZ 4.6 — komplekt.

```sql
mahsulot_tur_id     BIGINT NOT NULL REFERENCES mahsulot_tur(id),
material_id         BIGINT NOT NULL REFERENCES material(id),
formula             TEXT NOT NULL         -- 'ENI * 2', '4'
```

### 2.8. `mijoz`

TZ 6 + soliq maydonlari (Q-23). **Umumiy** (20.3).

```sql
ism                 TEXT NOT NULL,
telefon             TEXT UNIQUE,
telegram_id         BIGINT UNIQUE,
manzil              TEXT,
offset_turi         TEXT CHECK (offset_turi IN ('FOIZ','SOM','USD')),
offset_qiymat       NUMERIC(14,2),
qarz_limiti         NUMERIC(14,2),
qarz_limiti_valyuta TEXT DEFAULT 'SOM',
eslatma             TEXT,

-- Soliq (Q-23)
shaxs_turi          TEXT NOT NULL DEFAULT 'JISMONIY'
                      CHECK (shaxs_turi IN ('JISMONIY','YURIDIK')),
tashkilot_nomi      TEXT,
inn                 TEXT,
yuridik_manzil      TEXT,
bank_nomi           TEXT,
hisob_raqam         TEXT,
mfo                 TEXT,
shartnoma_raqam     TEXT,
shartnoma_sana      DATE,
nds_tolovchi        BOOLEAN NOT NULL DEFAULT false,
nds_stavka          NUMERIC(5,2)
```

`shaxs_turi = 'YURIDIK'` bo'lsa `tashkilot_nomi`, `inn`, `yuridik_manzil` majburiy.

### 2.9. `yetkazib_beruvchi`

TZ 9. **Umumiy** — qarz ham umumiy (20.3).

```sql
nom                 TEXT NOT NULL,
telefon             TEXT,
manzil              TEXT,
tolov_muddati_kun   INTEGER,          -- bo'sh → sozlamadagi standart (9.3)
valyuta             TEXT NOT NULL DEFAULT 'SOM',
eslatma             TEXT
```

---

## 3. OMBOR

### 3.1. `bolak` — tizimning eng muhim jadvali

TZ 7.4 + Q-02, Q-05, 20.6

```sql
material_id         BIGINT NOT NULL REFERENCES material(id),
filial_id           BIGINT NOT NULL REFERENCES filial(id),
kod                 TEXT NOT NULL,        -- 'R-118','O-207'
turi                TEXT NOT NULL CHECK (turi IN ('RULON','OSTATKA','DONA')),

-- O'lcham (Q-05: metrda, kv.m hisoblanadi)
eni_m               NUMERIC(8,2),
boyi_m              NUMERIC(8,2),
miqdor              NUMERIC(10,2),        -- DONA va CHIZIQLI uchun (sm yoki dona)

-- Kelib chiqish
kirim_qator_id      BIGINT REFERENCES kirim_qator(id),
ota_bolak_id        BIGINT REFERENCES bolak(id),   -- ostatka otasi (EC-OMB-06)
buyurtma_pozitsiya_id BIGINT REFERENCES buyurtma_pozitsiya(id),  -- qaysi kesimdan

-- Tannarx (snapshot, 2.3)
tannarx_birlik_snapshot NUMERIC(14,4) NOT NULL,
tannarx_valyuta_snapshot TEXT NOT NULL DEFAULT 'SOM',

holat               TEXT NOT NULL DEFAULT 'BOSH' CHECK (holat IN
                      ('BOSH','BAND','YOLDA','ISHLATILDI','BRAK','CHIQINDI')),
UNIQUE (kod)
```

⚠️ **`kod` butun tizimda unique**, filial ichida emas. Sabab: bo'lak
filiallar orasida ko'chganda (20.7) kodi **o'zgarmaydi** — u bo'lakning
umrbod nomi. Filial ichida unique bo'lsa, Samarqandda ham `O-207` bo'lishi
mumkin va ko'chirishda to'qnashuv chiqadi.

Kod generatsiyasi markazlashgan: `R-` rulon, `O-` ostatka, `D-` dona,
keyin ketma-ket raqam (filialdan qat'i nazar).

**Hisoblanadigan qiymat** (saqlanmaydi):

```sql
maydon_kv_m = eni_m * boyi_m       -- RULON va OSTATKA uchun
```

Holatlar:

| Holat | Ma'nosi |
|---|---|
| `BOSH` | ishlatishga tayyor |
| `BAND` | pozitsiyaga band (7.3) |
| `YOLDA` | filiallar orasida ko'chirilmoqda (20.7.4) |
| `ISHLATILDI` | kesilgan, qoldig'i yangi bo'lak bo'ldi |
| `BRAK` | hisobdan chiqarilgan (7.10) |
| `CHIQINDI` | yaroqsiz qoldiq (7.6) |

### 3.2. `band`

TZ 7.3 + Q-02, Q-06. Alohida jadval — tarix uchun.

```sql
bolak_id            BIGINT NOT NULL REFERENCES bolak(id),
buyurtma_pozitsiya_id BIGINT NOT NULL REFERENCES buyurtma_pozitsiya(id),
pozitsiya_material_id BIGINT NOT NULL REFERENCES pozitsiya_material(id),
holat               TEXT NOT NULL DEFAULT 'FAOL' CHECK (holat IN
                      ('FAOL','ISHLATILDI','BOSHATILDI')),
boshatish_sabab     TEXT,     -- Q-06: 'IFLOS','TOPILMADI','RANG','BOSHQA'
boshatish_izoh      TEXT,
boshatildi          TIMESTAMPTZ
```

Bir bo'lakda **bir vaqtda bitta faol band** — partial unique index:

```sql
CREATE UNIQUE INDEX ON band (bolak_id) WHERE holat = 'FAOL';
```

Bu 7.3 dagi "ikki usta bitta bo'lakka da'vo" muammosini baza darajasida yopadi.

### 3.2.1. ⚠️ Bitta pozitsiyaga bir nechta band

**Bu juda muhim va oson o'tkazib yuboriladi.**

Bitta pozitsiya bir nechta materialdan iborat. Masalan Dikke (TZ 3.5):

| Slot | Material | Sarflash |
|---|---|---|
| Chet mato | Oq mato | 0.66 kv.m |
| O'rta mato | Ko'k mato | 2.64 kv.m |
| Karniz | Alyuminiy karniz | 180 sm |

Demak **har slot uchun alohida band** qo'yiladi — bitta pozitsiyaga
**uchta band** yozuvi.

Shuning uchun `band` jadvalida `pozitsiya_material_id` bor. Faqat
`buyurtma_pozitsiya_id` bilan bog'lansa, ko'p slotli mahsulotda materialning
bir qismi band qilinmay qoladi.

**Pozitsiya band qilingan** deb hisoblanadi, qachonki uning **barcha majburiy
sloti** uchun faol band bo'lsa. Bittasi ham topilmasa — pozitsiya
"Materialga kutmoqda" ga tushadi va topilganlari **bo'shatiladi** (yarim band
qolmasin).

```sql
-- Pozitsiya to'liq band qilinganmi
SELECT COUNT(*) = (SELECT COUNT(*) FROM pozitsiya_material
                   WHERE buyurtma_pozitsiya_id = $1)
FROM band
WHERE buyurtma_pozitsiya_id = $1 AND holat = 'FAOL';
```

Aksessuar (dona bilan hisoblanadigan) uchun band qo'yilmaydi — u
"Tugatdim" da to'g'ridan-to'g'ri yechiladi.

### 3.3. `kirim` va `kirim_qator`

TZ 7.9 + 20.6.3

```sql
-- kirim
raqam               TEXT NOT NULL UNIQUE,
sana                DATE NOT NULL,
filial_id           BIGINT NOT NULL REFERENCES filial(id),
yetkazib_beruvchi_id BIGINT NOT NULL REFERENCES yetkazib_beruvchi(id),
valyuta             TEXT NOT NULL,
kurs_snapshot       NUMERIC(10,2),           -- USD bo'lsa (9.6)
transport_summa     NUMERIC(14,2) DEFAULT 0,
bojxona_summa       NUMERIC(14,2) DEFAULT 0,
tolov_muddati       DATE,
holat               TEXT NOT NULL DEFAULT 'FAOL' CHECK (holat IN ('FAOL','STORNO')),
storno_sabab        TEXT

-- kirim_qator
kirim_id            BIGINT NOT NULL REFERENCES kirim(id),
material_id         BIGINT NOT NULL REFERENCES material(id),
miqdor_kirim        NUMERIC(12,2) NOT NULL,     -- kirim birligida
narx_birlik         NUMERIC(14,2) NOT NULL,
defekt_miqdor       NUMERIC(12,2) DEFAULT 0,
defekt_turi         TEXT CHECK (defekt_turi IN ('QAYTARILADI','HISOBDAN_CHIQADI')),
transport_ulush     NUMERIC(14,2) DEFAULT 0     -- 7.9 taqsimoti
```

Transport taqsimoti (7.9): har qatorga qiymati bo'yicha proporsional.
Tannarx: `(narx_birlik * miqdor + transport_ulush) / (miqdor - defekt)`.
⚠️ AUDIT: brak bo'lgan qism **bo'luvchiga kirmaydi** (7.9 misoli: 660 000/10 = 66 000).

### 3.4. `ombor_harakat`

Universal jurnal — bo'lakning har harakati. `UPDATE`/`DELETE` taqiq.

```sql
sana                TIMESTAMPTZ NOT NULL DEFAULT now(),
filial_id           BIGINT NOT NULL REFERENCES filial(id),
bolak_id            BIGINT NOT NULL REFERENCES bolak(id),
turi                TEXT NOT NULL CHECK (turi IN
                      ('KIRIM','KESIM','OSTATKA','CHIQINDI','BRAK',
                       'KOCHIRISH_CHIQDI','KOCHIRISH_KIRDI',
                       'INVENTARIZATSIYA','STORNO','BOSHLANGICH')),
miqdor_kv_m         NUMERIC(10,4),
miqdor_sm           NUMERIC(12,2),
miqdor_dona         INTEGER,
tannarx_summa       NUMERIC(14,2) NOT NULL,
manba_turi          TEXT,          -- 'kirim','buyurtma_pozitsiya','kochirish',...
manba_id            BIGINT,
izoh                TEXT
```

Kesim uch qator yozadi (7.6): `KESIM` (−), `OSTATKA` (+), `CHIQINDI` (+).
Yig'indisi 0 bo'lishi shart — tekshiruv invarianti.

### 3.5. `kochirish` va `kochirish_qator`

TZ 20.7 — **yangi**

```sql
-- kochirish
raqam               TEXT NOT NULL UNIQUE,
sana                DATE NOT NULL,
kimdan_filial_id    BIGINT NOT NULL REFERENCES filial(id),
kimga_filial_id     BIGINT NOT NULL REFERENCES filial(id),
holat               TEXT NOT NULL DEFAULT 'SOROV' CHECK (holat IN
                      ('SOROV','YOLDA','QABUL','BEKOR')),
jonatdi_id          BIGINT REFERENCES xodim(id),
qabul_qildi_id      BIGINT REFERENCES xodim(id),
jonatildi           TIMESTAMPTZ,
qabul_qilindi       TIMESTAMPTZ,
-- Transport (20.18)
transport_summa     NUMERIC(14,2),
transport_toladi    TEXT CHECK (transport_toladi IN
                      ('JONATUVCHI','QABUL_QILUVCHI','KORXONA')),
CHECK (kimdan_filial_id <> kimga_filial_id)

-- kochirish: qarz maydonlari (22.4)
qarz_summa          NUMERIC(14,2),      -- tannarx bo'yicha avtomatik
qarz_qolda          BOOLEAN NOT NULL DEFAULT false,
qarz_sabab          TEXT,               -- qo'lda o'zgartirilsa majburiy

-- kochirish_qator
kochirish_id        BIGINT NOT NULL REFERENCES kochirish(id),
bolak_id            BIGINT NOT NULL REFERENCES bolak(id),
haqiqiy_eni_m       NUMERIC(8,2),      -- qabulda kiritiladi (EC-FIL-12)
haqiqiy_boyi_m      NUMERIC(8,2)
```

Tasdiqlash: **beruvchi filial omborchisi** (Q, 20.7). Admin tasdig'i yo'q.

### 3.6. `inventarizatsiya` va `inventarizatsiya_qator`

TZ 15.1 + Q-05, AUDIT Z-05, U-06

```sql
-- inventarizatsiya
sana                DATE NOT NULL,
filial_id           BIGINT NOT NULL REFERENCES filial(id),
holat               TEXT NOT NULL DEFAULT 'OCHIQ' CHECK (holat IN
                      ('OCHIQ','YAKUNLANDI','STORNO')),
farq_summa          NUMERIC(14,2)

-- inventarizatsiya_qator
inventarizatsiya_id BIGINT NOT NULL REFERENCES inventarizatsiya(id),
bolak_id            BIGINT NOT NULL REFERENCES bolak(id),
tizimda_eni_m       NUMERIC(8,2),
tizimda_boyi_m      NUMERIC(8,2),
haqiqatda_eni_m     NUMERIC(8,2),
haqiqatda_boyi_m    NUMERIC(8,2),
band                BOOLEAN NOT NULL DEFAULT false,   -- AUDIT U-06
yolda               BOOLEAN NOT NULL DEFAULT false,   -- 20.7.4
farq_kv_m           NUMERIC(10,4),
farq_summa          NUMERIC(14,2)
```

Q-05: sanash `eni × bo'yi` metrda. Kv.m tizim hisoblaydi.

---

## 4. BUYURTMA

### 4.1. `buyurtma`

TZ 8 + 20.4, Q-12, Q-23

```sql
raqam                    TEXT NOT NULL UNIQUE,
sana                     TIMESTAMPTZ NOT NULL DEFAULT now(),
mijoz_id                 BIGINT REFERENCES mijoz(id),     -- NULL = mijozsiz
sotuvchi_id              BIGINT NOT NULL REFERENCES xodim(id),

-- Filial (20.4)
sotgan_filial_id         BIGINT NOT NULL REFERENCES filial(id),
ishlab_chiqaruvchi_filial_id BIGINT NOT NULL REFERENCES filial(id),

manba                    TEXT NOT NULL CHECK (manba IN ('SAYT','BOT')),
valyuta                  TEXT NOT NULL DEFAULT 'SOM',     -- AUDIT B-04
kurs_snapshot            NUMERIC(10,2),                   -- 8.13
tayyorlik_sana           DATE,                            -- ixtiyoriy (3.13)
holat                    TEXT NOT NULL,
yopildi                  TIMESTAMPTZ,

-- Soliq (Q-23)
nds_stavka               NUMERIC(5,2) DEFAULT 0,
nds_summa                NUMERIC(14,2) DEFAULT 0,
summa_ndssiz             NUMERIC(14,2)
```

Q-12: sayt buyurtmasi darhol `Tasdiqlangan`, admin tasdig'i yo'q.
Bot buyurtmasi `Tasdiq kutmoqda`.

### 4.2. `buyurtma_pozitsiya`

TZ 8.3 + 20.5, 8.17

```sql
buyurtma_id         BIGINT NOT NULL REFERENCES buyurtma(id),
tartib              INTEGER NOT NULL,
mahsulot_tur_id     BIGINT NOT NULL REFERENCES mahsulot_tur(id),

eni_sm              INTEGER NOT NULL,
boyi_sm             INTEGER NOT NULL,
soni                INTEGER NOT NULL DEFAULT 1,

narx_snapshot       NUMERIC(14,2) NOT NULL,         -- 3.9
chegirma_summa      NUMERIC(14,2) DEFAULT 0,
xizmat_haqi         NUMERIC(14,2) DEFAULT 0,
formula_snapshot    JSONB NOT NULL,                 -- 4.10

usta_id             BIGINT REFERENCES xodim(id),
stavka_snapshot     NUMERIC(14,2),                  -- 10.10
tugatildi           TIMESTAMPTZ,

holat               TEXT NOT NULL CHECK (holat IN (
                      'TASDIQ_KUTMOQDA','TASDIQLANGAN','MATERIALGA_KUTMOQDA',
                      'FILIALGA_YUBORILDI','ISHLAB_CHIQARILMOQDA',
                      'TAYYOR','TAYYOR_YOLDA','YETIB_KELDI',
                      'TOPSHIRILDI','QAYTARILGAN','RAD_ETILGAN','BEKOR')),

qayta_kesildi_soni  INTEGER NOT NULL DEFAULT 0,     -- 8.17.8
tannarx_snapshot    NUMERIC(14,2),                  -- 3.15.4 uchun saqlanadi
tayyor_mahsulot     BOOLEAN NOT NULL DEFAULT false  -- 7.13 ro'yxatidami
```

Uchta yangi status (20.5) faqat filiallar har xil bo'lganda ishlatiladi.

### 4.3. `pozitsiya_material`

Slot bo'yicha tanlangan material va hisoblangan sarflash. TZ 3.5, 3.6

```sql
buyurtma_pozitsiya_id BIGINT NOT NULL REFERENCES buyurtma_pozitsiya(id),
slot_id             BIGINT NOT NULL REFERENCES mahsulot_slot(id),
material_id         BIGINT NOT NULL REFERENCES material(id),
hisoblangan_miqdor  NUMERIC(10,4) NOT NULL,     -- tizim hisobladi
tuzatilgan_miqdor   NUMERIC(10,4),              -- sotuvchi o'zgartirdi (3.5)
birlik              TEXT NOT NULL,              -- 'KV_M','SM','DONA'
narx_snapshot       NUMERIC(14,2) NOT NULL
```

⚠️ TZ 3.6: **ombordan `hisoblangan_miqdor` yechiladi**, `tuzatilgan_miqdor` emas.
Tuzatilgani faqat narxga ta'sir qiladi.

### 4.4. `qayta_kesish`

TZ 8.17 — **yangi**

```sql
buyurtma_pozitsiya_id BIGINT NOT NULL REFERENCES buyurtma_pozitsiya(id),
soragan_usta_id     BIGINT NOT NULL REFERENCES xodim(id),
sabab               TEXT NOT NULL CHECK (sabab IN
                      ('OLCHAM_XATO','MATO_YIRTILDI','TIKUV_BUZILDI',
                       'MEXANIZM_NOSOZ','BOSHQA')),
izoh                TEXT,
rasm_yol            TEXT,
holat               TEXT NOT NULL DEFAULT 'SOROV' CHECK (holat IN
                      ('SOROV','TASDIQLANDI','RAD_ETILDI')),
hal_qildi_id        BIGINT REFERENCES xodim(id),
hal_qilindi         TIMESTAMPTZ,
ushlanma_summa      NUMERIC(14,2) DEFAULT 0,      -- 10.13
haq_saqlandi        BOOLEAN NOT NULL DEFAULT false -- 8.17.5.1 istisno
```

Q-15: standart holatda haq bekor qilinadi (`haq_saqlandi = false`).

### 4.5. `buyurtma_tolov`

TZ 3.12

```sql
buyurtma_id         BIGINT NOT NULL REFERENCES buyurtma(id),
kassa_yozuv_id      BIGINT NOT NULL REFERENCES kassa_yozuv(id),
summa               NUMERIC(14,2) NOT NULL,
valyuta             TEXT NOT NULL,
kurs_snapshot       NUMERIC(10,2)
```

AUDIT B-04: buyurtma valyutasi bitta, boshqa valyutadagi to'lov
`kurs_snapshot` bilan o'giriladi.

### 4.6. `jonatma` va `jonatma_qator`

TZ 20.8 — tayyor mahsulotni filiallar orasida ko'chirish.

```sql
-- jonatma
raqam               TEXT NOT NULL UNIQUE,
sana                DATE NOT NULL,
kimdan_filial_id    BIGINT NOT NULL REFERENCES filial(id),
kimga_filial_id     BIGINT NOT NULL REFERENCES filial(id),
holat               TEXT NOT NULL DEFAULT 'YOLDA' CHECK (holat IN
                      ('YOLDA','QABUL','BEKOR')),
transport_summa     NUMERIC(14,2),
transport_toladi    TEXT

-- jonatma_qator
jonatma_id          BIGINT NOT NULL REFERENCES jonatma(id),
buyurtma_pozitsiya_id BIGINT NOT NULL REFERENCES buyurtma_pozitsiya(id),
shikastlangan       BOOLEAN NOT NULL DEFAULT false   -- 20.5.1
```

20.18.3: transport summasi buyurtmalarga **bo'linmaydi**.

---

## 5. XODIMLAR VA ISH HAQI

### 5.1. `stavka`

TZ 10.8 + 20.11.3 (standart + istisno)

```sql
mahsulot_tur_id     BIGINT NOT NULL REFERENCES mahsulot_tur(id),
filial_id           BIGINT REFERENCES filial(id),   -- NULL = standart
xodim_id            BIGINT REFERENCES xodim(id),    -- NULL = hammaga (10.9)
qiymat              NUMERIC(14,2) NOT NULL,
birlik              TEXT NOT NULL CHECK (birlik IN ('KV_M','DONA')),
amal_qiladi_dan     DATE NOT NULL
```

Ustunlik: `xodim` > `filial` > `standart`.

### 5.2. `xodim_harakat`

TZ 10.3. `UPDATE`/`DELETE` taqiq. Balans shu jadvaldan `SUM()` bilan.

```sql
sana                TIMESTAMPTZ NOT NULL DEFAULT now(),
xodim_id            BIGINT NOT NULL REFERENCES xodim(id),
filial_id           BIGINT NOT NULL REFERENCES filial(id),
turi                TEXT NOT NULL CHECK (turi IN
                      ('HAQ','AVANS','TOLOV','USHLANMA','JARIMA',
                       'QOLDA_TUZATISH','HAQ_BEKOR','HISOBDAN_CHIQARISH')),
summa               NUMERIC(14,2) NOT NULL,     -- + hisoblandi, − olindi
valyuta             TEXT NOT NULL DEFAULT 'SOM',
kurs_snapshot       NUMERIC(10,2),
manba_turi          TEXT,
manba_id            BIGINT,
izoh                TEXT
```

AUDIT Z-12: balans = `hisoblangan − olingan − ushlangan`.

---

## 6. KASSA

### 6.1. `kassa`

TZ 12.2 + 20.10

```sql
filial_id           BIGINT NOT NULL REFERENCES filial(id),
xodim_id            BIGINT REFERENCES xodim(id),    -- NULL = filial (admin) kassasi
turi                TEXT NOT NULL CHECK (turi IN ('NAQD','KARTA','BANK')),
valyuta             TEXT NOT NULL
```

### 6.2. `kassa_yozuv`

TZ 12.3. **Faqat qo'shiladi.**

```sql
sana                TIMESTAMPTZ NOT NULL DEFAULT now(),
kassa_id            BIGINT NOT NULL REFERENCES kassa(id),
kod                 TEXT NOT NULL,     -- 'K1','K3','C1','C4',...
summa               NUMERIC(14,2) NOT NULL,   -- + kirim, − chiqim
valyuta             TEXT NOT NULL,
manba_turi          TEXT NOT NULL,     -- 'buyurtma','mijoz','xodim',...
manba_id            BIGINT NOT NULL,
storno_id           BIGINT REFERENCES kassa_yozuv(id),
izoh                TEXT
```

### 6.3. `kassa_kun`

TZ 12.17 + Q-17

```sql
kassa_id            BIGINT NOT NULL REFERENCES kassa(id),
sana                DATE NOT NULL,
boshlangich         NUMERIC(14,2) NOT NULL,
kirim               NUMERIC(14,2) NOT NULL,
chiqim              NUMERIC(14,2) NOT NULL,
hisoblangan         NUMERIC(14,2) NOT NULL,
sanaldi             NUMERIC(14,2),
farq                NUMERIC(14,2),
yopildi             TIMESTAMPTZ,
yopdi_id            BIGINT REFERENCES xodim(id),
qayta_ochildi       TIMESTAMPTZ,
UNIQUE (kassa_id, sana)
```

AUDIT B-06: har valyuta uchun alohida qator (kassa valyutasi bilan bog'langan).

### 6.4. `topshiriq`

TZ 12.7 + 20.10.2

```sql
kimdan_kassa_id     BIGINT NOT NULL REFERENCES kassa(id),
kimga_kassa_id      BIGINT NOT NULL REFERENCES kassa(id),
summa               NUMERIC(14,2) NOT NULL,
valyuta             TEXT NOT NULL,
holat               TEXT NOT NULL DEFAULT 'JONATILDI' CHECK (holat IN
                      ('JONATILDI','QABUL','BEKOR')),
qabul_qildi_id      BIGINT REFERENCES xodim(id),
qabul_qilindi       TIMESTAMPTZ
```

### 6.5. `xarajat`

TZ 12.1 — **kassadan alohida**. Bu invariantning asosi.

```sql
sana                DATE NOT NULL,
filial_id           BIGINT NOT NULL REFERENCES filial(id),
modda               TEXT NOT NULL,     -- AUDIT U-07 bo'yicha to'liq ro'yxat
summa               NUMERIC(14,2) NOT NULL,
valyuta             TEXT NOT NULL DEFAULT 'SOM',
kassa_yozuv_id      BIGINT REFERENCES kassa_yozuv(id),  -- NULL = pul chiqmagan
manba_turi          TEXT,
manba_id            BIGINT,
izoh                TEXT
```

**Xarajat moddalari** (AUDIT U-07 bilan to'ldirilgan):

```
ISH_HAQI · TRANSPORT_BOJXONA · OMBOR_BRAKI · ISHLAB_CHIQARISH_BRAKI ·
CHIQINDI · KURS_FARQI · YETKAZIB_BERUVCHI_DEFEKTI · UMIDSIZ_QARZ ·
BANK_KOMISSIYASI · OPERATSION · INVENTARIZATSIYA_FARQI · YAXLITLASH ·
XODIM_BALANSI_HISOBDAN · FILIALLARARO_TRANSPORT · BOSHQA
```

⚠️ `kassa_yozuv_id IS NULL` → pul chiqmagan xarajat (12.1 invarianti).

---

## 7. BALANSLAR

### 7.1. `mijoz_harakat`

TZ 6.8 + 20.3.1. Qarz **umumiy**, harakat filiali bilan.

```sql
sana                TIMESTAMPTZ NOT NULL DEFAULT now(),
mijoz_id            BIGINT NOT NULL REFERENCES mijoz(id),
filial_id           BIGINT NOT NULL REFERENCES filial(id),
turi                TEXT NOT NULL CHECK (turi IN
                      ('BUYURTMA','TOLOV','QAYTARISH','QOLDA_TUZATISH',
                       'UMIDSIZ_QARZ','BOSHLANGICH')),
summa               NUMERIC(14,2) NOT NULL,    -- + qarz oshdi, − kamaydi
valyuta             TEXT NOT NULL,
kurs_snapshot       NUMERIC(10,2),
manba_turi          TEXT,
manba_id            BIGINT
```

### 7.2. `yetkazib_beruvchi_harakat`

TZ 9.2. Xuddi shu naqsh. `filial_id` — kirim qaysi filialga kelgani.

### 7.3. `filial_harakat`

TZ 22 — **uchinchi qarz turi**. Q-33, Q-34, Q-35.

```sql
sana                TIMESTAMPTZ NOT NULL DEFAULT now(),
kimdan_filial_id    BIGINT NOT NULL REFERENCES filial(id),
kimga_filial_id     BIGINT NOT NULL REFERENCES filial(id),
turi                TEXT NOT NULL CHECK (turi IN
                      ('TAYYOR_MAHSULOT','MATERIAL_KOCHIRISH',
                       'PUL_TOPSHIRISH','TOLOV','QAYTARISH','QOLDA_TUZATISH')),
summa               NUMERIC(14,2) NOT NULL,
valyuta             TEXT NOT NULL DEFAULT 'SOM',
kurs_snapshot       NUMERIC(10,2),
manba_turi          TEXT,
manba_id            BIGINT,
qolda_ozgartirildi  BOOLEAN NOT NULL DEFAULT false,
ozgartirish_sabab   TEXT,
izoh                TEXT,
CHECK (kimdan_filial_id <> kimga_filial_id)
```

`UPDATE`/`DELETE` taqiq. Balans `SUM()` bilan (2.2-invariant).

⚠️ Barcha filial balanslari yig'indisi **0** bo'lishi shart — har qarz
ikki tomonlama (22.9.4).

---

## 8. REJALAR

### 8.1. `reja`

TZ 21 — **yangi**

```sql
davr_turi           TEXT NOT NULL CHECK (davr_turi IN ('OY','CHORAK','YIL')),
yil                 INTEGER NOT NULL,
oy                  INTEGER,           -- OY uchun 1-12
chorak              INTEGER,           -- CHORAK uchun 1-4

qamrov              TEXT NOT NULL CHECK (qamrov IN
                      ('KORXONA','FILIAL','SOTUVCHI')),
filial_id           BIGINT REFERENCES filial(id),
xodim_id            BIGINT REFERENCES xodim(id),

tushum_reja         NUMERIC(14,2),
foyda_reja          NUMERIC(14,2),

UNIQUE (davr_turi, yil, oy, chorak, qamrov, filial_id, xodim_id)
```

21.4: o'zgarish audit jurnaliga tushadi va hisobotda belgi qoladi.

---

## 9. BILDIRISHNOMALAR

### 9.1. `bildirishnoma`

TZ 13.11 + AUDIT U-04

```sql
sana                TIMESTAMPTZ NOT NULL DEFAULT now(),
qabul_qiluvchi_turi TEXT NOT NULL CHECK (qabul_qiluvchi_turi IN ('XODIM','MIJOZ')),
xodim_id            BIGINT REFERENCES xodim(id),
mijoz_id            BIGINT REFERENCES mijoz(id),
kanal               TEXT NOT NULL CHECK (kanal IN ('BOT','SAYT')),
turi                TEXT NOT NULL,
matn                TEXT NOT NULL,
manba_turi          TEXT,
manba_id            BIGINT,
holat               TEXT NOT NULL DEFAULT 'NAVBATDA' CHECK (holat IN
                      ('NAVBATDA','YUBORILDI','XATO')),
xato_matn           TEXT,
urinishlar          INTEGER NOT NULL DEFAULT 0,
yuborildi           TIMESTAMPTZ
```

AUDIT U-04: `holat = 'XATO'` bo'lganlar buyurtma kartochkasining yangi
**"Eslatmalar"** tabida qizil holatda, qayta yuborish tugmasi bilan.

---

## 10. INDEKSLAR

Birinchi kundan qo'yiladi.

```sql
-- Band qilish algoritmi (7.6) — eng ko'p ishlatiladigan so'rov
CREATE INDEX ON bolak (material_id, filial_id, holat, eni_m)
  WHERE faol = true AND holat = 'BOSH';

-- Faol band — unique, 7.3 ni baza darajasida kafolatlaydi
CREATE UNIQUE INDEX ON band (bolak_id) WHERE holat = 'FAOL';

-- Navbat (8.12)
CREATE INDEX ON buyurtma_pozitsiya (holat, yaratildi);
CREATE INDEX ON buyurtma_pozitsiya (usta_id, holat);

-- Filial kesimi
CREATE INDEX ON buyurtma (ishlab_chiqaruvchi_filial_id, holat);
CREATE INDEX ON buyurtma (sotgan_filial_id, sana);

-- Balanslar
CREATE INDEX ON mijoz_harakat (mijoz_id, sana);
CREATE INDEX ON xodim_harakat (xodim_id, sana);
CREATE INDEX ON yetkazib_beruvchi_harakat (yetkazib_beruvchi_id, sana);

-- Kassa
CREATE INDEX ON kassa_yozuv (kassa_id, sana);
CREATE INDEX ON kassa_yozuv (manba_turi, manba_id);

-- Ombor jurnali
CREATE INDEX ON ombor_harakat (filial_id, sana);
CREATE INDEX ON ombor_harakat (bolak_id);

-- Audit
CREATE INDEX ON audit_jurnal (obyekt_turi, obyekt_id);
CREATE INDEX ON audit_jurnal (sana);
```

---

## 11. TRIGGERLAR VA HIMOYA

### 11.1. Snapshot himoyasi

Barcha `*_snapshot` ustunlari `UPDATE` da o'zgarmasligi kerak (2.3-invariant).

```sql
CREATE TRIGGER snapshot_himoya
BEFORE UPDATE ON buyurtma_pozitsiya
FOR EACH ROW EXECUTE FUNCTION snapshot_ozgarmasin(
  'narx_snapshot','stavka_snapshot','formula_snapshot','tannarx_snapshot'
);
```

### 11.2. Harakat jadvallari himoyasi

`kassa_yozuv`, `mijoz_harakat`, `xodim_harakat`, `yetkazib_beruvchi_harakat`,
`ombor_harakat` — `UPDATE` va `DELETE` bloklanadi.

### 11.3. Yopilgan kun himoyasi

`kassa_kun.yopildi IS NOT NULL` bo'lgan sanaga yangi `kassa_yozuv` yozib
bo'lmaydi (12.17, xato kodi `KUN_YOPILGAN`).

### 11.4. Kesim balansi

`ombor_harakat` da bitta kesim uchun `KESIM + OSTATKA + CHIQINDI = 0`.
Tranzaksiya oxirida `CONSTRAINT TRIGGER` bilan tekshiriladi.

---

## 11.5. ⚠️ Bu model hali kod bilan sinalmagan

44 jadval qog'ozda izchil, lekin birinchi migratsiya yozilganda 3–5 ta
kichik tuzatish chiqishi **odatiy hol** — bu xato emas, jarayon.

Ayniqsa tekshirilishi kerak: `pozitsiya_material` ↔ `band` bog'lanishi
(3.2.1) · `ombor_harakat` ning miqdor ustunlari (uchta alohida ustun
o'rniga bitta `JSONB` qulayroq bo'lishi mumkin) · `filial_harakat` ning
valyuta bilan ishlashi.

Migratsiya yozilganda bu joylar birinchi bo'lib ko'riladi.

---

## 12. TEKSHIRUV INVARIANTLARI

Bu so'rovlar **har kecha cron** da ishlaydi. Natija 0 bo'lmasa — adminga xabar.

| № | Nima tekshiriladi | Band |
|---|---|---|
| 1 | Har kesimning uch qatori yig'indisi 0 | 7.6 |
| 2 | Bir bo'lakda bir vaqtda bitta faol band | 7.3 |
| 3 | Mijoz qarzi = `SUM(mijoz_harakat)` | 2.2 |
| 4 | Kassa qoldig'i = `SUM(kassa_yozuv)` | 2.2 |
| 5 | Xodim balansi = `SUM(xodim_harakat)` | 2.2 |
| 6 | Taqsimlangan foyda yig'indisi = umumiy foyda | 20.17.4 |
| 7 | `YOLDA` bo'laklar hech qaysi filial qoldig'ida yo'q | 20.7.4 |
| 8 | So'm va dollar hech qayerda qo'shilmagan | 1.3 |
| 9 | Yopilgan kunga yozuv yo'q | 12.17 |
| 10 | Har `xarajat` moddasi ro'yxatdan | 11.4.1 |
| 11 | Barcha filial balanslari yig'indisi = 0 | 22.9.4 |
| 12 | Har pozitsiyaning barcha majburiy sloti band qilingan | 3.2.1 |
| 13 | Filiallararo qarz tushum summasidan oshmagan | 22.3.3 |

---

## 13. JADVALLAR RO'YXATI

**Asos (8):** `filial` · `xodim` · `rol` · `ruxsat` · `rol_ruxsat` · `sessiya` ·
`audit_jurnal` · `sozlama` · `kurs_tarix` · `amal_kaliti`

**Spravochnik (9):** `material` · `almashtirish_guruh` · `material_filial_narx` ·
`mahsulot_tur` · `mahsulot_slot` · `mahsulot_parametr` · `mahsulot_aksessuar` ·
`mijoz` · `yetkazib_beruvchi`

**Ombor (8):** `bolak` · `band` · `kirim` · `kirim_qator` · `ombor_harakat` ·
`kochirish` · `kochirish_qator` · `inventarizatsiya` · `inventarizatsiya_qator`

**Buyurtma (7):** `buyurtma` · `buyurtma_pozitsiya` · `pozitsiya_material` ·
`qayta_kesish` · `buyurtma_tolov` · `jonatma` · `jonatma_qator`

**Xodim (2):** `stavka` · `xodim_harakat`

**Kassa (5):** `kassa` · `kassa_yozuv` · `kassa_kun` · `topshiriq` · `xarajat`

**Balans (3):** `mijoz_harakat` · `yetkazib_beruvchi_harakat` · `filial_harakat`

**Boshqa (2):** `reja` · `bildirishnoma`

**Jami: 44 jadval**

---

## 14. QURISH TARTIBI

Migratsiyalar shu tartibda:

```
001  filial, rol, ruxsat, rol_ruxsat, xodim, sessiya
002  sozlama, kurs_tarix, audit_jurnal, amal_kaliti
003  almashtirish_guruh, material, material_filial_narx
004  mahsulot_tur, mahsulot_slot, mahsulot_parametr, mahsulot_aksessuar
005  mijoz, yetkazib_beruvchi
006  bolak, kirim, kirim_qator, ombor_harakat
007  buyurtma, buyurtma_pozitsiya, pozitsiya_material, band
008  stavka, xodim_harakat
009  kassa, kassa_yozuv, kassa_kun, topshiriq, xarajat
010  mijoz_harakat, yetkazib_beruvchi_harakat, filial_harakat, buyurtma_tolov
011  kochirish, kochirish_qator, jonatma, jonatma_qator
012  inventarizatsiya, inventarizatsiya_qator, qayta_kesish
013  reja, bildirishnoma
014  indekslar va triggerlar
```

---

*Ma'lumotlar modeli oxiri. 44 jadval.*


---

# QISM 4 — AUDIT TOPILMALARI

> TZ dagi xatolar, bog'liqlik xaritasi va teskari indeks.

---

## 1. BOG'LIQLIK XARITASI

### 1.1. Modul bo'yicha

**SOTUV (3)**

| Yo'n. | Kim bilan | Nima o'tadi | Band |
|---|---|---|---|
| ← | Konstruktor | mahsulot turlari, slotlar, sarflash formulasi, komplekt, xizmat haqi | 4.2, 4.4, 4.5, 4.6, 4.7 |
| ← | Ombor | slot bo'yicha mato ro'yxati, **bo'sh** qoldiq, mos bo'lak bor-yo'qligi | 5.7, 7.3 |
| ← | Mijozlar | offset, joriy qarz, limit | 6.3, 6.4 |
| ← | Sozlamalar | kurs, chegirma limiti, yaxlitlash chegarasi | 14.3 |
| → | Buyurtma | pozitsiya "Tasdiqlangan" holatida tug'iladi | 3.14, 8.3, 8.4 |
| → | Ombor | band qilish so'rovi (tasdiqlash paytida) | 7.3 |
| → | Kassa | K1 — sotuv paytidagi to'lov | 3.12, 12.5 |
| → | Mijozlar | to'lanmagan qism qarzga | 3.12, 6.8 |

**KONSTRUKTOR (4)**

| Yo'n. | Kim bilan | Nima o'tadi | Band |
|---|---|---|---|
| → | Sotuv | slot qatorlari, hisoblangan sarflash, aksessuar komplekti | 3.3, 3.5, 3.7 |
| → | Material | slotga bog'lanish nuqtasi | 4.4, 5.7 |
| → | Ombor | sarflash formulasi → kesim o'lchami | 7.6 |
| → | Bot | buyurtma oqimi bosqichlari | 13.4 |
| → | Xodimlar | yangi tur → stavka 0 ogohlantirishi | 4.9, 10.12 |
| ↔ | Material | aksessuar komplekti **bitta ma'lumot**, ikki ekrandan tahrirlanadi | 4.6, 5.7 |

**MATERIAL (5)**

| Yo'n. | Kim bilan | Nima o'tadi | Band |
|---|---|---|---|
| ← | Sozlamalar | standart ustama chegarasi, standart ostatka chegaralari | 14.3, 14.4 |
| ← | Yetkazib beruvchi | tannarx (kirim orqali) | 5.4, 7.9 |
| → | Ombor | hisob turi, birlik, konversiya, chegaralar | 7.4, 7.5 |
| → | Sotuv | sotuv narxi, almashtirish guruhi | 3.7, 3.8 |
| → | Konstruktor | qaysi slotga bog'langan | 4.4 |

**OMBOR (7)** — eng ko'p bog'lanishli modul

| Yo'n. | Kim bilan | Nima o'tadi | Band |
|---|---|---|---|
| ← | Sotuv | slot bo'yicha so'rov, **hisoblangan** kesim (sotuvchi tuzatgani emas) | 3.3, 3.6 |
| ← | Konstruktor | sarflash formulasi | 4.5, 4.10 |
| ← | Yetkazib beruvchi | kirim hujjati, tannarx, transport taqsimoti | 7.9, 9.11 |
| → | Buyurtma | band, "Materialga kutmoqda" statusi | 7.3, 8.12 |
| → | Xodimlar | "Tugatdim" → haq hisoblanadi | 7.6, 10.10 |
| → | Kassa | C3 transport / bojxona to'lovi | 7.9, 12.6 |
| → | Hisobotlar | qoldiq, harakat, chiqindi, ustama, muzlab qolgan pul | 11.7.1–11.7.7 |
| → | Qo'shimcha | inventarizatsiya bazasi, xarid ehtiyoji | 15.1, 15.2, 15.3 |
| ↔ | Yetkazib beruvchi | kirim → qarz oshadi · defekt → ochiq da'vo | 7.9, 9.2, 9.9 |

**BUYURTMA (8)**

| Yo'n. | Kim bilan | Nima o'tadi | Band |
|---|---|---|---|
| ← | Sotuv | pozitsiyalar, kelishilgan narx, kurs snapshot | 3.9, 3.11, 8.13 |
| ← | Ombor | band holati, kesish rejasi | 7.3, 7.6 |
| → | Ombor | "Tugatdim" da material yechiladi, ostatka tug'iladi | 7.6 |
| → | Xodimlar | bajarilgan pozitsiya → stavka snapshot → balans | 10.8, 10.10 |
| → | Kassa | K2 to'lov · C6 qaytarish naqd qismi | 12.5, 12.6 |
| → | Mijozlar | qarz oshadi / kamayadi | 6.8, 8.10 |
| → | Bot | mijozga status va xabar | 13.6 |
| → | Qo'shimcha | 7.13 sotilmagan tayyor mahsulot | 8.8, 8.10 |

**YETKAZIB BERUVCHI (9)**

| Yo'n. | Kim bilan | Nima o'tadi | Band |
|---|---|---|---|
| ← | Ombor | kirim hujjati summasi | 7.9 |
| → | Kassa | C1 to'lov · C2 avans | 12.6 |
| → | Ombor | tannarx, narx tarixi | 7.8, 9.8 |
| → | Hisobotlar | kreditorlik, narx dinamikasi | 11.4.6, 11.9.1 |
| → | Qo'shimcha | xarid ro'yxati guruhlash | 15.3 |
| ← | Sozlamalar | kurs (kirim kunidagi) | 14.5 |

**XODIMLAR (10)**

| Yo'n. | Kim bilan | Nima o'tadi | Band |
|---|---|---|---|
| ← | Buyurtma | bajarilgan pozitsiya, "Tugatdim" vaqti | 8.5, 10.10 |
| ← | Konstruktor | mahsulot turi → stavka matritsasi qatori | 10.8 |
| ← | Kassa | KPI: kassaga kelgan pul | 10.7 |
| → | Kassa | C4 ish haqi · C5 avans | 12.6 |
| → | Hisobotlar | unumdorlik, brak | 11.8.1, 11.8.2 |
| → | Bot | usta paneli, balans | 13.8 |
| ← | Sozlamalar | ruxsatlar, kurs | 14.5, 14.6 |

**KASSA (12)**

| Yo'n. | Kim bilan | Nima o'tadi | Band |
|---|---|---|---|
| ← | **hamma modul** | har yozuv `(manba turi, manba ID, qator)` bilan keladi | 12.3 |
| → | Hisobotlar | kassa oqimi (foyda-zarar EMAS) | 11.4.2, 12.1 |
| → | Xodimlar | KPI asosi | 10.7 |
| ✗ | Xarajat jurnali | **alohida** — foyda-zarar kassadan yig'ilmaydi | 12.1 |

**BOT (13)** — o'z ma'lumoti yo'q, hamma narsa boshqa moduldan

| Yo'n. | Kim bilan | Nima o'tadi | Band |
|---|---|---|---|
| ← | Konstruktor | buyurtma oqimi, slotlar | 13.4 |
| ← | Mijozlar | telefon bo'yicha tanish, offset, balans | 13.2, 13.5, 13.7 |
| ← | Buyurtma | status (9 → 4 ga qisqartirilgan) | 13.6 |
| ← | Xodimlar | usta roli, balans, ushlanmalar | 13.8 |
| ← | Sozlamalar | bot matnlari, bildirishnoma qoidalari | 14.7, 14.8 |

**SOZLAMALAR (14)** — barcha modulga bir yo'nalishda

Kurs · ustama chegarasi · chegirma limiti · yaxlitlash · kesish bag'rikengligi · ostatka chegaralari · ruxsatlar · bildirishnoma qoidalari · bot matnlari · spravochniklar.

---

### 1.2. TESKARI INDEKS — eng muhim jadval

> Bu jadvalni har o'zgarishdan **oldin** oching. Chap ustundagi narsani o'zgartirsangiz, o'ng ustundagi hamma joyni tekshirish shart.

| AGAR O'ZGARSA | QAYERLAR TUZATILADI |
|---|---|
| **Slot mexanizmi** (4.4) | 3.3 sotuv qatorlari · 3.5 sarflash · 5.7 material bog'lanishi · 7.6 kesish · 13.4 bot oqimi · EC-BOT-08 |
| **Sarflash formulasi** (4.5) | 3.5 · 3.8 narx · 4.8 test kalkulyatori · 4.10 eski buyurtmalar · 7.6 kesim · 13.5 bot narxi · 15.3 xarid ehtiyoji · EC-OMB-11 |
| **Material birligi / konversiya** (5.3) | 3.7 aksessuar ustuni · 4.5 formula natijasi · 5.4 narx bazasi · 7.4 bo'lak · 7.9 kirim · 11.7.5 ustama · 15.1 sanash · 15.2 · 15.3 |
| **Sotuv narxi bazasi** (5.4) | 3.8 pozitsiya narxi · 6.3 offset · 11.7.5 ustama eroziyasi · 13.5 bot narxi · 7.9 kirimdagi tekshiruv |
| **Ostatka chegaralari** (5.5) | 7.5 uch daraja · 7.6 kesish taklifi · 11.7.6 muzlab qolgan pul · 14.4 standart · EC-OMB-05 · EC-OMB-23 |
| **Kam qoldiq chegarasi** (5.5) | 11.3 dashboard · 11.7.3 · 11.11 ombor paneli · 14.7 bildirishnoma · 15.3 xarid formulasi |
| **Offset** (6.3) | 3.10 sotuv · 3.11 chegirma · 6.7 kartochka · 8.14 buyurtma sarlavhasi · 13.3 bot katalogi · 13.5 bot narxi |
| **Qarz limiti** (6.4) | 3.10 sotuv · 6.7 · 11.6 · 11.11 mijozlar paneli · 14.5 kurs · EC-MIJ-03 |
| **Band qilish** (7.3) | 7.6 kesish oqimi · 8.3 status jadvali · 8.12 navbat · 11.7.1 qoldiq · 11.11 ombor paneli · 15.1 inventarizatsiya · 15.2 · 15.3 · EC-OMB-18 · EC-OMB-24 · EC-INV-04 |
| **Bo'lak strukturasi** (7.4) | 7.3 band · 7.5 daraja · 7.6 algoritm · 7.8 tannarx zanjiri · 7.10 brak · 7.12 storno · 11.7.6 · 15.1 · EC-OMB-06 |
| **Kesish algoritmi** (7.6) | 3.6 qaysi raqam yechiladi · 7.3 band · 7.5 chegaralar · 8.12 · 11.7.7 · 14.4 bag'rikenglik · EC-OMB-02..25 |
| **Tannarx qoidasi** (7.8, 7.9) | 5.4 ustama · 9.6 kurs farqi · 9.11 keyin tahrirlash · 11.4.1 foyda · 11.7.1 · 11.7.5 · 15.1 farq qiymati |
| **Pozitsiya statuslari** (8.3) | 7.3 band nuqtasi · 8.9 yopilish · 8.12 · 11.8.4 navbat · 13.6 bot statuslari · 15.4 kunlik varaqa |
| **Kurs** (14.5) | 1.3 · 6.3 dollar offset · 6.4 limit · 8.13 buyurtma kursi · 9.5 to'lov · 9.6 kurs farqi · 10.5 xodim balansi · 12.9 ayirboshlash |
| **Stavka** (10.8) | 4.9 yangi tur ogohlantirishi · 8.6 qaytarib olish · 10.9 alohida stavka · 10.10 snapshot · 10.12 stavkasiz tur · 11.8.1 · 11.8.4 · 13.8 bot |
| **Xarajat ≠ kassa chiqimi** (12.1) | 7.9 defekt · 7.10 brak · 9.6 kurs farqi · 10.14 jarima · 11.4.1 foyda-zarar · 11.4.2 kassa oqimi · 12.9 komissiya · 12.12 tegmaydiganlar ro'yxati · 15.1 inventarizatsiya farqi |
| **Kassa manba qoidasi** (12.3) | 12.5 kirim kodlari · 12.6 chiqim kodlari · 12.7 topshiriq · 12.15 storno · 12.18 kassa kitobi · 13.10 bot idempotentligi |
| **Ruxsatlar** (14.6) | 1.2 rollar · 9.5 · 10.14 · 10.15 · 11.10 · 11.11 panel · 12.14 · 13.1 bot paneli · 15.1 |
| **Bildirishnoma qoidalari** (14.7) | 7.9 · 7.10 · 8.4 · 8.12 · 10.12 · 12.7 · 12.17 · 13.9 admin bot · 13.11 yetib bormagan xabar |
| **Standart + istisno naqshi** | 5.4 ustama · 5.5 ostatka · 9.3 to'lov muddati · 10.9 stavka · 14.4 — **to'rttasi bir xil ishlashi shart** |

---

## 2. ZIDDIYATLAR

### Z-01 · Karniz o'lchov birligi to'rt joyda uch xil — **KRITIK** *(Q-01 da hal qilindi)*

| Qayerda | Nima yozilgan |
|---|---|
| **3.7** | Karniz **metrda** kirim qilinadi va **metrda** sarflanadi |
| **5.3** (354-q.) | kirimda shtanga, sarflashda **metr**, **koeffitsient 3** |
| **5.3** (358-q.) | kirimda shtanga, sarflashda **sm**, **1 shtanga = 300 sm** |
| **5.4** | Sotuv narxi — karniz uchun **1 metr** |
| **18** | Karniz sarflash birligi — **santimetr** |

5.3-band **o'z ichida** ziddiyatli: bir xatboshi ichida koeffitsient 3 ham, 300 ham.

**Nega muhim.** Formula `ENI × 2` (4.5), eni 210 sm → 420. Narx 35 000 so'm/m:

```
Aylantirilmasa:  420 × 35 000 = 14 700 000 so'm
To'g'ri:         4.2 × 35 000 =    147 000 so'm
```

100 barobar. Ombordan yechishda ham xuddi shu — bitta buyurtma 420 m karniz yechadi.

**Qaror:** Q-01 — saqlash smda, narx 1 metr uchun, koeffitsient = 1 kirim birligida nechta sm.

---

### Z-02 · Band aniq bo'lakka, lekin bo'lak kuzatilmaydi — **KRITIK** *(Q-02 da hal qilindi)*

| Qayerda | Nima yozilgan |
|---|---|
| **7.3** | tizim mos **bo'lakni** topadi va **uni** band qiladi · ikki usta **bitta bo'lakka** da'vo qilsa · omborchi **bo'lakni** brakka chiqarayotganda usta **o'shanga** bosa olmaydi |
| **7.4** | Pozitsiyada **faqat manba** saqlanadi — aniq bo'lak raqami emas |
| **7.6** | **Aniq bo'lak raqami kuzatilmaydi** · tizim o'lchami mos keladiganini **o'zi topib** hisobdan chiqaradi |
| **EC-OMB-21** | Usta boshqa ostatkani olgan — **muhim emas** |

**Nega muhim.** O-207 (1.80×2.00) band qilingan, usta O-211 (2.50×1.84) dan kesdi:

1. Tizim O-207 ni yechadi → O-207 tizimda yo'q, jismonan bor; O-211 tizimda bor, jismonan kesilgan
2. **15.1 inventarizatsiya** har safar farq chiqaradi, sababi topilmaydi — jami kv.m to'g'ri, faqat bo'laklar joyi almashgan. Soxta xarajat yoziladi
3. **EC-OMB-06** tannarx zanjiri buziladi — yangi ostatka noto'g'ri otadan meros oladi (kirim №44: 78 000/kv.m vs №51: 91 000/kv.m)
4. **7.3 locki** noto'g'ri odamni bloklaydi
5. **11.7.7** hisoboti ishonchsiz

**Qaror:** Q-02 — band aniq bo'lakka, "Tugatdim"da usta bo'lakni tasdiqlaydi. Q-06 — boshqasini tanlasa eski band darhol bo'shaydi, sabab ro'yxatdan tanlanadi.

---

### Z-03 · "Materialga kutmoqda" ikki xil paytda tug'iladi — **KRITIK** *(Q-03 da hal qilindi)*

| Qayerda | Nima yozilgan |
|---|---|
| **7.6** algoritm, 7-qadam | Hech qaysi bo'lakka sig'masa — pozitsiya "Materialga kutmoqda"ga tushadi *(bu band qilish paytida, ya'ni "Tasdiqlangan"da)* |
| **8.3** | Materialga kutmoqda — **usta ishga olmoqchi**, material yetmadi |
| **8.12** | **Usta ishga olmoqchi bo'ldi**, material yetmadi — pozitsiya avtomatik o'tadi |

7.3 band qilishni "Tasdiqlangan"ga bog'lagandan keyin 8.3 va 8.12 eski oqimni tasvirlab qoldi.

**Nega muhim.** Dasturchi 8.3 ni o'qib qurса: pozitsiya navbatga tushadi, usta bosadi, rad javob oladi, keyingisini bosadi, yana rad. 7.3 aynan shu holatdan qutulish uchun kiritilgan edi.

**Qaror:** Q-03 — tekshiruv **buyurtma berilayotgan payt** (sotuv va bot), band tasdiqlashda, 7.6-ning 7-qadami ikkinchi himoya sifatida qoladi. 8.3 va 8.12 qayta yoziladi.

---

### Z-04 · 8.3 status jadvali band qilishni ko'rsatmaydi — JIDDIY

**Qayerda 1:** 8.3 — `Tasdiqlangan → Material: Tegilmagan`, `Materialga kutmoqda → Tegilmagan`
**Qayerda 2:** 7.3 — "Pozitsiya *Tasdiqlangan* bo'lgan zahoti tizim mos bo'lakni topadi va uni **band qiladi**"

**Oqibati.** Dasturchi 8.3 jadvalini status mashinasi sifatida ishlatadi (u aynan shu maqsadda yozilgan). "Tegilmagan" deb o'qib, band qilish kodini yozmaydi.

**Taklif.** Ustun qiymatlari: `Tasdiqlangan → Band qilingan` · `Materialga kutmoqda → Band qilinmagan (mos bo'lak yo'q)` · `Ishlab chiqarilmoqda → Band, hali yechilmagan` · `Bekor qilingan → Band bo'shatildi`.

---

### Z-05 · Inventarizatsiya varaqasi hisobi to'g'ri kelmaydi — **KRITIK** *(Q-05 da hal qilindi)*

15.1:

```
Ko'k mato · to'r            kv.m       48.00
  R-118 rulon                          28.00
  O-207 qoldiq kesma  1.80×2.00         3.60
  O-211 qoldiq kesma  2.50×1.84         4.60
```

**28.00 + 3.60 + 4.60 = 36.20 ≠ 48.00.**

`28.00` — rulonning qolgan **bo'yi metrda** (7.4: `R-118 rulon 3.00 × 28.00 m`), maydoni esa `3.00 × 28.00 = 84.00 kv.m`. Ustun sarlavhasi `kv.m`, ichida ikki xil o'lchov.

**Oqibati.** Omborchi R-118 yoniga 28 yozsa (o'lchab) — tizim 84 kutsa, farq −56 kv.m ≈ 4 900 000 so'm soxta xarajat. 48.00 raqami esa uchala qatorning hech biriga bog'lanmaydi.

**Qaror:** Q-05 — har qator `eni × bo'yi` metrda, kv.m ustuni yo'q. Jami `84.00 + 3.60 + 4.60 = 92.20 kv.m` bo'lib hisoblanadi.

---

### Z-06 · Birlashtirib kesish har pozitsiya mustaqilligiga zid — JIDDIY

**Qayerda 1:** 7.6 algoritm, 0-qadam — "Bitta buyurtmadagi bir xil matoli pozitsiyalar **birga hisoblanadi**". EC-OMB-02 ham shunday.
**Qayerda 2:** 8.5 — "**Har pozitsiya alohida ustaga ketishi mumkin**". 8.2 — "har pozitsiya **mustaqil harakat qiladi**".

**Oqibati.** Buyurtma #1247 da uchta 210×140 Rollo, bir xil matodan. Algoritm 4.20 m tasma bir yo'la ochilishini rejalashtiradi va bitta uzun ostatka qoldiradi. Lekin poz. 1 ni Rustam, poz. 2 ni Sardor oladi — ikkalasi alohida vaqtda alohida kesadi. Reja bajarilmaydi, uchta mayda bo'lak qoladi, ombor hisobi rejadan chetga chiqadi.

**Qaror: Q-13** — birlashtirish **faqat hisob-kitob taklifi** bo'lib qoladi. 8.2 va 8.5 daryaxlit prinsip buzilmaydi: har pozitsiya mustaqil, band va ombor hisobi **har pozitsiyaga alohida** yuritiladi.

**7.6 algoritmining 0-qadami qayta yoziladi:**

> **0. Birlashtirish tavsiyasi.** Bitta buyurtmada bir xil matoli bir nechta pozitsiya bo'lsa, tizim ularni birga kesish variantini hisoblab, **ish varaqasida ko'rsatadi**:
>
> `Bu buyurtmada shu matodan yana 2 ta pozitsiya bor (poz. 2, poz. 3). Birga kesilsa 4.20 m tasma bir yo'la ochiladi.`
>
> Bu **majburiy emas** — band va hisob har pozitsiyaga alohida qo'yiladi. Usta pozitsiyalarni birga kesgan bo'lsa, "Tugatdim"da haqiqiy qolgan bo'lak o'lchamini kiritadi (7.6 buni allaqachon ruxsat etadi) va ortiqcha ostatka yozuvlari shu orqali tuzatiladi.

**EC-OMB-02 qarori o'zgaradi:** *"Birlashtirib kesiladi, bitta uzun ostatka qoladi"* → *"Tizim birga kesish variantini ish varaqasida tavsiya qiladi. Band va hisob har pozitsiyaga alohida. Usta birga kesgan bo'lsa, 'Tugatdim'da haqiqiy qolgan o'lchamni kiritadi"*.

> **Diqqat.** Bu qaror ombor hisobiga bitta yon ta'sir qoldiradi: usta uchta pozitsiyani birga kessa, tizim uchta alohida ostatka yozadi, jismonan esa bitta uzun bo'lak qoladi. Uni faqat "Tugatdim"dagi qo'lda tuzatish to'g'rilaydi. Shuning uchun 7.6 dagi *"qolgan bo'lak o'lchamini o'zgartirish"* imkoni **majburiy funksiya** bo'lib qoladi — uni soddalashtirib olib tashlab bo'lmaydi.

---

### Z-07 · Ruxsatlar uch joyda uch xil — JIDDIY *(Q-04 da hal qilindi)*

| Qayerda | Nima yozilgan |
|---|---|
| **11.10** | Omborchi — **faqat ombor hisobotlari** |
| **12.14** | Omborchi — yetkazib beruvchiga to'lov, ish haqi to'lovi **qila oladi** |
| **9.5 / 10.15** | Kim qila oladi: admin, sotuvchi, **omborchi** |
| **14.6** | Standart holat: barcha huquq adminda. **Hech narsa oldindan ochiq emas** |

Yetkazib beruvchiga to'lov qilish uchun uning qarzini ko'rish kerak, lekin 11.10 buni bermaydi.

**Qaror:** Q-04 — 14.6 yagona manba. 11.10 va 12.14 "boshlang'ich preset" deb qayta yoziladi. 9.5 va 10.15 dagi "kim qila oladi" ro'yxatlari "matritsada beriladi" ga o'zgaradi. Qattiq qoladigan uchtasi: usta saytga kirmaydi · sotuvchi boshqa sotuvchining kassasini ko'rmaydi · admin o'z "sozlamalarni o'zgartirish" huquqini olib qo'ya olmaydi.

---

### Z-08 · Yaxlitlash saytda va botda har xil — JIDDIY

**Qayerda 1:** 6.3 — "Yaxlitlash — **100 so'mgacha**", misol `115 187.5 → 115 200`
**Qayerda 2:** 13.5 — "Yaxlitlash **butun so'mgacha**, tiyin yo'q"

**Oqibati.** Offseti −3% bo'lgan mijoz botda `115 187` so'm ko'radi, sotuvchi ekranida `115 200` chiqadi. Farq 13 so'm, lekin 13.5-bandning butun maqsadi buzildi: *"Aks holda mijoz 'botda boshqacha yozgan edi' deydi"*.

**Taklif.** 13.5 dagi jumla `6.3 dagi yaxlitlash qoidasi qo'llanadi — 100 so'mgacha` ga o'zgartiriladi. Bitta yaxlitlash qoidasi butun tizimda.

> Diqqat: bu 12.19 dagi **kassa yaxlitlashi** (1 000 so'm) bilan aralashtirilmasin — u boshqa narsa (mijoz mayda pul bermaydi). Ikkalasi 14.3 da alohida sozlama bo'lishi kerak.

---

### Z-09 · Sozlamalarda ostatka chegarasi bitta, kerak ikkita — JIDDIY

**Qayerda 1:** 5.5 va 7.5 — **ikkita** chegara: `Yaroqsiz — 0.5 m` va `Kam ishlatiladigan — 1.0 m`. Ular uchta daraja beradi.
**Qayerda 2:** 14.4 — bitta qator: `Minimal ostatka chegarasi — standart | 0.5 m | 5.5`

7.5 esa aynan 14.4 ga havola qiladi: "Bo'sh qolsa sozlamadagi standart ishlaydi (14.4)".

**Oqibati.** Materialda "kam ishlatiladigan" chegarasi belgilanmagan bo'lsa, tizim qaysi standartni oladi? 11.7.6 ("muzlab qolgan pul") ning butun o'rta darajasi ishlamay qoladi, EC-OMB-23 bajarilmaydi.

**Taklif.** 14.4 ga ikkita qator:

| Sozlama | Standart | Band |
|---|---|---|
| Yaroqsiz ostatka chegarasi — standart | 0.5 m | 5.5, 7.5 |
| Kam ishlatiladigan chegarasi — standart | 1.0 m | 5.5, 7.5 |

---

### Z-10 · Kunlik yopish varaqasi "keyinroqqa qoldirilgan", lekin bajarilgan — O'RTA

**Qayerda 1:** 11.12 sarlavhasi — "**Keyinroqqa qoldirilgan**: Kunlik yopish varaqasi"
**Qayerda 2:** 15.4 — to'liq yozilgan · 19.2 — "**Bajarildi** — 15.4"

11.12 ning o'zi "15.4-bandga qarang" deydi — ya'ni yarim tuzatilgan, sarlavha eski qolgan.

**Taklif.** 11.12 butunlay olib tashlanadi yoki "15.4-bandda yozilgan" degan bitta qatorga qisqartiriladi.

---

### Z-11 · 19.1 "navbatdagi bo'lim" — allaqachon yopilgan bo'lim — O'RTA

**Qayerda 1:** 19.1 — navbatdagi bo'lim: **Sozlamalar va ruxsatlar**
**Qayerda 2:** 0.2 va 14-bo'lim — Sozlamalar **YOPILGAN**, 7 ta ekran

**Oqibati.** Yangi sessiyada ishni davom ettirgan odam 14-bo'limni qaytadan yozib chiqadi.

**Taklif.** 19.1 jadvali bo'shatiladi yoki bo'lim butunlay olib tashlanadi (19.2 da "keyinroqqa qoldirilgan narsa qolmadi" deb yozilgan).

---

### Z-12 · Usta balansi hisobi noto'g'ri — O'RTA

13.8:

```
Bu oy bajardim: 31 ta · 2 180 000
Olganim: 940 000
Ushlangan: 100 000 (brak — #1245)
🟢 Qolgan: 1 240 000 so'm
```

`2 180 000 − 940 000 − 100 000 = **1 140 000**`, hujjatda **1 240 000**.

Ko'rsatilgan raqam ushlanmani hisobga olmagan (`2 180 000 − 940 000`).

**Oqibati.** Dasturchi misoldan formulani chiqaradi va ushlanmani balansdan ayirmaydi. Usta ekranda 100 000 ortiq ko'radi, pul so'raganda kelishmovchilik chiqadi. 13.12-band esa "Ustaga ushlanmalar **ko'rinadi**" deb turibdi.

**Taklif.** `Qolgan: 1 140 000` ga tuzatiladi.

---

### Z-13 · "Kutilmoqda" ko'rsatkichi — bekor qilingan qoidaning qoldig'i — O'RTA

**Qayerda 1:** 17.2 yangi qo'shilganlar ro'yxati — "**'Kutilmoqda' ko'rsatkichi** — 7.3"
**Qayerda 2:** 7.3 — endi `bo'sh / band` ajratmasi, "kutilmoqda" degan ko'rsatkich yo'q

Ombor maketi ham hali eski "kutilmoqda" ni ko'rsatadi (README da qayd etilgan).

**Taklif.** 17.2 dagi qator o'chiriladi, o'rniga "Ombor qoldig'i `bo'sh / band` bo'lib ajraladi — 7.3".

---

### Z-14 · EC-OMB-07 ikki xil mazmunda — O'RTA

**Qayerda 1:** 16.1 format namunasi — `EC-OMB-07 · Ostatka buyurtmadan bir necha mm kichik`
**Qayerda 2:** 16.2 jadval — `EC-OMB-07 | Brak qilinayotgan bo'lakka usta "Tugatdim" bosdi`

16.1 dagi namunaning mazmuni aslida **EC-OMB-04** ("Ostatka bir necha mm kichik → 1 sm bag'rikenglik").

**Oqibati.** "EC-OMB-07 ni tekshir" deyilsa qaysi biri nazarda tutilgani noaniq.

**Taklif.** 16.1 namunasidagi kod `EC-OMB-04` ga o'zgartiriladi. Shu bilan birga 16.1 dagi `Band: 7.5` ham `7.6` ga tuzatiladi (U-02 ga qarang).

---

### Z-15 · Hisobotlar soni uch joyda uch xil — MAYDA

| Manba | Soni |
|---|---|
| 0.2 jadvali | 1 + **22** |
| README | 1 + **23** |
| Haqiqiy sanoq (11.4.1 – 11.9.1) | **27** |

**Taklif.** 0.2 va README `1 + 27` ga tuzatiladi.

---

### Z-16 · Edge case soni mos kelmaydi — MAYDA

README va PROMPT — **128 ta**. 16.2–16.10 jadvallarida haqiqatda **126 ta**.

Bundan tashqari 16.2 da **EC-OMB-17 tartibdan tashqarida** — EC-OMB-25 dan keyin turibdi.

**Taklif.** Sanoq `126` ga tuzatiladi, EC-OMB-17 o'z joyiga ko'chiriladi.

---

## 3. UZILGAN BOG'LIQLIKLAR

### U-01 · "2.9-band" mavjud emas — ishlab chiqarish braki uysiz — JIDDIY

**Kim tayanadi:** 8.11 · 10.13 · 12.4 · 14.7 — to'rt joyda "TZ 2.9" ga havola
**Nimaga:** 2-bo'limda faqat 2.1–2.5 bor

**Muammo.** "Ishlab chiqarish braki" va "qayta kesish so'rovi" — pul ham, material ham qimirlaydigan jiddiy jarayon — **hech qayerda to'liq ta'riflanmagan**. Uning parchalari uchta bandga sochilgan:

- 8.11 — brak nima ekani, bot orqali so'rov
- 13.8 — so'rov oqimi va admin tasdig'i
- 10.13 — ushlanish qarori
- 12.4 — material qachon yechilishi

**Oqibati.** Dasturchi 2.9 ni izlaydi, topmaydi. Javobsiz savollar: material **ikkinchi marta** yechilganda band qayta qo'yiladimi? Yangi bo'lak topilmasa nima bo'ladi? Birinchi kesimdan chiqqan ostatka nima bo'ladi? Usta haqi ikki marta hisoblanadimi? Bularning hech biri yozilmagan.

**Taklif.** Yangi band — **8.17. Ishlab chiqarish braki va qayta kesish**. Ichida: so'rov → admin tasdig'i → yangi bo'lak band qilinadi → material yechiladi → birinchi kesim chiqindiga → haq bir marta → ushlanish 10.13 bo'yicha. Barcha "2.9" havolalari shunga yo'naltiriladi.

---

### U-02 · 7-bo'lim raqamlari siljigan, 22 ta havola eski raqamda — JIDDIY

**Sabab.** 7.3 (Band qilish) bo'lim o'rtasiga qo'shilgan. Undan keyingi hamma band bir raqamga surilgan, havolalar tuzatilmagan.

| Havola | Hozirgi ko'rsatgan | Aslida kerak | Qayerda |
|---|---|---|---|
| 7.5 | Uch daraja | **7.6** kesish oqimi | 13.8 · 14.4 · 16.1 · 18 · 17.2 (×2) |
| 7.7 | Buyurtma eni | **7.8** tannarx / FIFO | EC-YET-12 · 17.2 |
| 7.8 | Tannarx | **7.9** kirim hujjati | 5.4 · 7.10 · 9.9 · 11.7.5 · 12.6 (C3) · 13.9 · 14.7 · EC-OMB-15 · 17.2 (×3) |
| 7.9 | Kirim hujjati | **7.10** hisobdan chiqarish | 13.9 · 14.7 (×2) · 14.9 · 17.2 |
| 7.10 | Hisobdan chiqarish | **7.11** material kartochkasi | 17.2 |
| 7.11 | Material kartochkasi | **7.12** kirim stornosi | EC-OMB-13 · 17.2 (×2) |
| 7.12 | Kirim stornosi | **7.13** sotilmagan tayyor mahsulot | 8.3 (×2) · 8.8 · 11.7.6 · EC-OMB-17 · 17.2 |

**Oqibati — aniq misol.** 12.6-jadvalning C3 qatori "Transport / bojxona to'lovi — Kirim hujjati (**7.8**)" deydi. Dasturchi 7.8 ni ochadi va u yerda **tannarx va FIFO** haqida o'qiydi — transport blokining qayerda ekanini topolmaydi. U 7.9 da.

Xuddi shu 8.3 da: "Qaytarilgan → **7.12** ga tushadi" — 7.12 kirim stornosi. Dasturchi qaytarilgan mahsulotni kirim stornosiga bog'laydi.

**Taklif.** Yuqoridagi jadval bo'yicha 22 ta havolani almashtirish. Bundan keyin **band raqamlari o'rtaga qo'shilmasin** — yangi band oxiriga qo'yilsin yoki `7.6a` ko'rinishida bo'lsin.

---

### U-03 · Topshiriq havolasi noto'g'ri — O'RTA

**Kim tayanadi:** 12.4 ("sotuvchining topshirig'ini admin tasdiqlaydi — **12.6**") va 12.5-jadvalning K7 qatori ("Topshiriq tasdig'i — **12.6**")
**Nimaga:** 12.6 — bu "Kassadan CHIQIM" jadvali
**To'g'risi:** 12.7 — "Sotuvchidan adminga pul topshirish"

Diqqat: **o'sha 12.6-jadvalning C9 qatori to'g'ri yozilgan** ("Topshiriq (12.7)"). Ya'ni bitta jadvalning ichida ikki xil raqam.

**Oqibati.** 12.4 ikki bosqichli hodisalar ro'yxati — dasturchi aynan shu banddan pul qachon ko'chishini o'rganadi. Noto'g'ri joyga yo'naltiriladi.

---

### U-04 · "Eslatmalar" tabi buyurtma kartochkasida yo'q — JIDDIY

**Kim tayanadi:** 13.11 — "Yuborilmagan xabarlar **buyurtma kartochkasining 'Eslatmalar' tabida** qizil holatda ko'rinadi va qayta yuborish tugmasi bo'ladi (6.7)"
**Nimaga:** 8.14 — buyurtma kartochkasida **to'rtta** tab: Pozitsiyalar · To'lovlar · Harakatlar tarixi · Izohlar

Havola esa 6.7 ga (mijoz kartochkasi) ketadi — u yerda "eslatmalar" tabi **bor**, lekin matn "buyurtma kartochkasi" deydi.

**Oqibati.** Mijozga yetib bormagan xabar hech qayerda ko'rinmaydi. 14.7 dagi "Mijozga xabar yetib bormadi" bildirishnomasi qabul qiladigan ekransiz qoladi. EC-BOT-09 bajarilmaydi.

**Taklif.** Ikki variantdan biri: (a) 8.14 ga beshinchi tab "Eslatmalar" qo'shiladi; (b) matn "mijoz kartochkasining eslatmalar tabi (6.7)" ga tuzatiladi va buyurtma kartochkasida faqat belgi turadi. **Tavsiyam (a)** — xabar buyurtmaga tegishli, mijozga emas.

---

### U-05 · "Tayyordan tanlash" tugmasi sotuv ekranida yo'q — JIDDIY

**Kim tayanadi:** 7.13 — "**Sotuv ekranida 'Tayyordan tanlash'** orqali mos o'lchamli mahsulot qidiriladi va chegirma bilan sotiladi"
**Nimaga:** 3-bo'lim (sotuv ekrani) — 3.2 dan 3.14 gacha hech qayerda bu tugma yo'q

**Oqibati.** 7.13-bandning butun mexanizmi ishlamaydi. Sotilmagan tayyor mahsulot ro'yxatga tushadi, lekin uni sotib bo'lmaydi — 11.7.6 dagi "muzlab qolgan pul" faqat o'sib boradi.

Bundan tashqari **javobsiz savol:** tayyordan sotilganda **tannarx qayerdan olinadi?** Material allaqachon "Tugatdim"da yechilgan va o'sha paytda xarajatga tushgan. Yana bir marta hisoblansa ikki marta xarajat, hisoblanmasa foyda 100% chiqadi. (B-05 ga qarang.)

**Taklif.** 3-bo'limga yangi band — **3.15. Tayyordan tanlash**: ro'yxat, o'lcham bo'yicha filtr, chegirma, tannarx manbai.

---

### U-06 · Inventarizatsiya varaqasida "band" ustuni yo'q — O'RTA

**Kim tayanadi:** EC-INV-04 — "Band bo'lsa ham jismonan omborda — sanaladi. **Band alohida ustunda ko'rinadi**"
**Nimaga:** 15.1 sanash varaqasi — ustunlar: Material · Birlik · Tizimda · Haqiqatda · Farq

**Oqibati.** Omborchi 16.6 kv.m band qilingan matoni sanaganda nimaga solishtirishini bilmaydi. Har inventarizatsiyada band qilingan miqdorcha farq chiqadi.

**Taklif.** 15.1 varaqasiga `Band` ustuni qo'shiladi (Q-05 dagi yangi tuzilma bilan birga).

---

### U-07 · Foyda-zarar xarajat moddalari ro'yxati to'liq emas — JIDDIY

**Kim tayanadi:** 11.4.1 — xarajat moddalari: ish haqi · transport va bojxona · ombor braki · ishlab chiqarish braki · chiqindi · kurs farqi · yetkazib beruvchi defekti · umidsiz qarz · boshqa
**Nimaga:** boshqa bandlar **oltita** moddani va'da qiladi:

| Modda | Qayerda va'da qilingan |
|---|---|
| **Bank komissiyasi va ayirboshlash** | 12.9 — "**alohida xarajat moddasiga** tushadi... kurs farqi bilan aralashtirilmaydi" |
| **Operatsion xarajatlar** | 12.10 — "haqiqiy xarajat: kassadan ham chiqadi, **foyda-zarar hisobotiga ham tushadi**" |
| **Inventarizatsiya farqi** | 15.1 — "farq tannarx bo'yicha hisoblanadi va foyda-zarar hisobotiga **xarajat** bo'lib tushadi" |
| **Yaxlitlash** | 12.19 — "400 so'm **alohida moddaga** yoziladi" |
| **Xodim balansini hisobdan chiqarish** | 10.4 — "admin uni hisobdan chiqaradi... **xarajatga tushadi**" |
| **Kurs farqi — daromad** | 9.6 va 11.4.7 — bu **daromad** qatori, xarajat emas |

**Oqibati.** Operatsion xarajatlar — ijara, kommunal, reklama — oyiga eng katta summalardan biri. Ro'yxatda yo'q. Foyda-zarar hisoboti ularsiz yig'ilsa foyda **jiddiy yuqori** chiqadi va butun 11.4.1 ning ma'nosi yo'qoladi.

**Taklif.** 11.4.1 ro'yxati yuqoridagi oltita modda bilan to'ldiriladi, "Kurs farqi — daromad" alohida daromad bloki sifatida ajratiladi.

---

### U-08 · Audit jurnali ro'yxati to'liq emas — O'RTA

**Kim tayanadi:** 2.4 — 11 ta amal sanalgan
**Nimaga:** boshqa bandlar yana **sakkizta** amalni jurnalga va'da qiladi

| Amal | Qayerda |
|---|---|
| Qaytarish (ushlab qolish bilan) | 8.10 |
| Ishni ustadan qaytarib olish | 8.6 |
| Xodim balansini qo'lda tuzatish | 10.14 |
| Ostatka turgan holda rulon tanlash | 7.6 |
| Kirim hujjatini keyin tahrirlash | 9.11 |
| Yopilgan kunni qayta ochish | 12.17 |
| Inventarizatsiya va uning stornosi | 15.1 |
| To'lovda kursni qo'lda o'zgartirish | EC-YET-03 |

**Oqibati.** 2.4 — jurnal jadvalining sxemasi shu banddan olinadi. Sanalmagan amallar uchun jurnal yozuvi kodlanmaydi va 11.5.6 ("sotuvchi erkinliklari") hisoboti ma'lumotsiz qoladi.

**Taklif.** 2.4 ro'yxati to'ldiriladi yoki teskari qoida yoziladi: *"Quyidagi turdagi har qanday amal jurnalga tushadi: storno · qo'lda korrektsiya · chegaradan oshish · hisobdan chiqarish · sozlama o'zgarishi"* — shunda ro'yxat yopiq bo'lmaydi.

---

### U-09 · 2.5-invariantning sababi ko'rsatilgan bandda yo'q — O'RTA

**Kim tayanadi:** 2.5 — "Endi bu talab faqat avtomatik operatsiyalarga tegishli — **sabab 7.6-bandda**"
**Nimaga:** 7.6 — kesish oqimi. Manfiy qoldiq haqida bir og'iz so'z yo'q

Sabab aslida **7.10** (brakni bekor qilish) va **7.12** (kirim stornosi) da yozilgan.

**Taklif.** Havola `7.10 va 7.12` ga tuzatiladi.

---

### U-10 · Uxlab qolgan mijoz chegarasi ta'rifsiz — MAYDA

**Kim tayanadi:** 14.4 — "Uxlab qolgan mijoz chegarasi | 90 kun | **6.7**"
**Nimaga:** 6.7 — mijoz kartochkasi. "Uxlab qolgan" tushunchasi u yerda yo'q

Tushuncha 11.6.1 va 11.11 (mijozlar paneli) da ishlatiladi, lekin ta'riflanmagan: 90 kun **nimadan** hisoblanadi — oxirgi buyurtmadanmi, oxirgi to'lovdanmi?

**Taklif.** Havola 11.6.1 ga o'zgartiriladi va u yerda ta'rif yoziladi: *"oxirgi buyurtmasidan beri N kun o'tgan mijoz"*.

---

### U-11 · Hujjat sarlavhasidagi 18.2-band mavjud emas — MAYDA

**Kim tayanadi:** 5-qator — "Keyingi bosqichga qoldirilganlar **18.2-bandda**"
**Nimaga:** 18-bo'lim bo'linmagan, ichida faqat jadval. Va u "Ochiq savol qolmadi" deydi

Nazarda tutilgani — **19.2**.

---

### U-12 · 0.3-band o'zgarishlar ro'yxatini noto'g'ri joyga yo'naltiradi — MAYDA

**Kim tayanadi:** 0.3 — "**9-bo'limda** avvalgi versiyaga nisbatan nima o'zgargani sanalgan"
**Nimaga:** 9-bo'lim — Yetkazib beruvchilar. O'zgarishlar **17-bo'limda**

**Oqibati.** Bu jumla hujjatni qanday o'qish bo'yicha ko'rsatma — eski hujjat bilan ishlagan odam birinchi navbatda shuni o'qiydi va noto'g'ri joyga boradi.

---

### U-13 · Kurs tarixiga tayanadigan joylar ro'yxati chala — O'RTA

**Kim tayanadi:** 14.5 — "Kurs tarixi saqlanishi majburiy. **Uchta joy** unga tayanadi" (9.6 kirim, 8.13 buyurtma, 9.6 kurs farqi)
**Nimaga:** aslida yana **to'rtta** joy kursga tayanadi:

| Joy | Qaysi kurs |
|---|---|
| 6.3 dollar offset | sozlamadagi **joriy** kurs |
| 6.4 qarz limiti | **joriy** kurs |
| 10.5 xodim balansi | **to'lov kunidagi** kurs |
| 12.9 ayirboshlash | sozlamadagi kurs, tahrirlanadi |

**Oqibati.** Ro'yxat chala bo'lgani uchun dasturchi kurs o'zgarganda qaysi ekranlar qayta hisoblanishini to'liq bilmaydi. 6.4 dagi "kurs o'zgarsa mijoz limitdan oshib qolishi mumkin" xavfi aynan shu joydan keladi va u 14.5 da eslatilmagan.

---

### U-14 · EC-YET-07 noto'g'ri bandga havola qiladi — MAYDA

**Kim tayanadi:** EC-YET-07 — "Hujjat tahrirlanadi, tannarx qayta hisoblanadi. Sotilgan mahsulotlarga tegilmaydi (**9.12**)"
**Nimaga:** 9.12 — "Tizimda yo'q narsa". To'g'risi **9.11**

---

## 4. BO'SHLIQLAR

> Bu yerda faqat **tizim ishlashi uchun zarur** bo'lgan narsalar. "Yaxshi bo'lardi" degan takliflar 5-bo'limda.

### B-01 · Formula natijasining o'lchov birligi qoidasi yo'q — KRITIK

**Nima yo'q.** 4.5-band formulada `ENI`, `BO'YI`, `MAYDON`, `SONI` va parametrlar ishlatilishini aytadi, lekin **natija qaysi birlikda chiqishini** aytmaydi.

**Qayerda kerak.** 4.5 · 4.8 test kalkulyatori · 7.6 kesim · 13.5 bot narxi

**Usiz nima bo'ladi.** 5.3 bo'yicha barcha uzunlik smda. Demak:

```
(ENI − 2×CHET) × BO'YI  =  (180 − 60) × 220  =  26 400 kv.sm  =  2.64 kv.m
ENI × 2                 =  210 × 2           =  420 sm        =  4.20 m
MAYDON × 1.5            =  MAYDON qaysi birlikda? 39 600 kv.sm mi, 3.96 kv.m mi?
```

Bitta formula dvigateli mato uchun **kv.sm → kv.m** (÷10 000), karniz uchun **sm → m** (÷100), aksessuar uchun **dona** (bo'linmaydi) qaytarishi kerak. Bu qoida hech qayerda yozilmagan — 5.3 faqat undan **ogohlantiradi**: *"Metr va sm aralashsa formulada xato chiqadi"*.

**Taklif.** 4.5 ga yangi xatboshi:

> **Formula natijasi materialning sarflash birligida talqin qilinadi.** Kirish qiymatlari (`ENI`, `BO'YI`, `CHET`) doim smda. Natija:
> - sarflash birligi **kv.m** bo'lsa → natija kv.sm deb olinadi va ÷10 000
> - sarflash birligi **sm** bo'lsa → natija shundayligicha
> - sarflash birligi **dona** bo'lsa → natija butun songa yaxlitlanadi (yuqoriga)
>
> `MAYDON` o'zgaruvchisi kv.sm da beriladi (`ENI × BO'YI`).

4.8 test kalkulyatori natijani **birligi bilan** ko'rsatishi shart — formuladagi birlik xatosi aynan shu yerda ushlanadi.

---

### B-02 · Kam qoldiq chegarasi metrda, xarid ehtiyoji kv.m da — JIDDIY *(Q-10 dan kelib chiqdi)*

**Nima yo'q.** Q-10 bo'yicha kam qoldiq chegarasi **uzunlik bo'yicha, metrda**. Lekin 15.3 formulasi:

```
kerak = tasdiqlangan buyurtmalar ehtiyoji   ← kv.m (sarflash formulasidan)
      − bo'sh qoldiq                        ← kv.m
      + kam qoldiq chegarasi                ← metr (Q-10)
```

Uchinchi qismni birinchi ikkitasiga qo'shib bo'lmaydi.

**Qayerda kerak.** 15.3 · 15.2 · 11.7.3 · 14.4

**Usiz nima bo'ladi.** `2.94 kv.m + 10 m = ?` — dasturchi o'zicha bir yechim o'ylab topadi va u hech qayerda yozilmaydi.

**Qaror: Q-14** — chegara metrda qoladi. Xarid formulasiga qo'shishdan oldin materialning **standart rulon eniga** ko'paytiriladi:

```
Ko'k mato · to'r — standart rulon eni 3.00 m, kam qoldiq chegarasi 10 m
zaxira = 10 × 3.00 = 30.00 kv.m
kerak  = 2.94 − 0.00 + 30.00 = 32.94 kv.m  →  olish: 11.00 m (3 m enli rulonda)
```

**Material kartochkasiga yangi maydon qo'shiladi — "standart rulon eni"** (5.3, birliklar bloki yoniga):

| Maydon | Kim uchun | Qayerda ishlatiladi |
|---|---|---|
| **Standart rulon eni** (m) | faqat rulon va chiziqli hisob turi | 15.3 chegarani kv.m ga o'girish · 15.3 natijani metrda ko'rsatish · 11.7.3 |

- **Majburiy emas.** Bo'sh qolsa tizim shu materialning **oxirgi kirimidagi rulon enini** oladi. U ham bo'lmasa chegara kv.m deb talqin qilinadi va 15.3 da belgi chiqadi
- **Ombor hisobiga tegmaydi.** Haqiqiy bo'lak eni doim kirimda kiritiladi (7.9) — bu maydon faqat rejalashtirish uchun
- Aksessuar va dona materialga umuman ko'rinmaydi

**15.3 ga qo'shimcha ustun** (B-08 bilan birga bajariladi):

```
"Tekstil Savdo" MCHJ
  Ko'k mato · to'r   kerak 2.94   zaxira 30.00   olish: 33.00 kv.m ≈ 11.00 m (3.00 m enli)
```

---

### B-03 · Band qilingan bo'lakni brakka chiqarish yoki storno qilish qoidasi yo'q — JIDDIY

**Nima yo'q.** 7.3 lock haqida faqat bir holatni yozadi: omborchi brakka chiqarayotganda usta "Tugatdim" bosa olmaydi. Teskarisi yozilmagan — **omborchi band qilingan bo'lakni brakka chiqara oladimi?**

**Qayerda kerak.** 7.10 hisobdan chiqarish · 7.12 kirim stornosi · 15.1 inventarizatsiya

**Usiz nima bo'ladi.** Rulon uchi ho'l bo'ldi, unda 3 ta buyurtmaning bo'lagi band. Omborchi brakka chiqaradi. Uch pozitsiya **bandsiz qoladi** — lekin ularning statusi hali "Tasdiqlangan". Ular navbatda turaveradi, usta oladi, materialni topolmaydi.

**Taklif.** 7.10 ga qoida:

> Band qilingan bo'lakni brakka chiqarish **bloklanmaydi**, lekin ogohlantirish chiqadi: *"Bu bo'lakka 3 ta pozitsiya band qilingan"*. Chiqarilgach tizim o'sha pozitsiyalarga **qayta band qilishga urinadi**. Mos bo'lak topilmasa pozitsiya "Materialga kutmoqda"ga o'tadi va sotuvchiga bildirishnoma ketadi.

Xuddi shu qoida 7.12 (kirim stornosi) va 15.1 (inventarizatsiyada bo'lak yo'q chiqsa) uchun ham qo'llanadi.

---

### B-04 · Buyurtma valyutasi qayerda belgilanadi — JIDDIY

**Nima yo'q.** 8.13 "Buyurtma **dollarda bo'lsa**..." deydi. Lekin buyurtma valyutasi qayerda va qanday tanlanishi hech qayerda yozilmagan.

3.8 faqat "So'mda ham, dollarda ham **ko'rish va kiritish** mumkin" deydi — bu ko'rsatish rejimi, valyuta tanlovi emas. 3.12 esa **har to'lov qatorida** valyuta bor deydi.

**Qayerda kerak.** 3.8 · 3.12 · 8.13 · 8.14 pul bloki · 6.8 qarz harakati

**Usiz nima bo'ladi.** Mijoz 500 000 so'm naqd + 50 $ karta to'ladi, buyurtma jami 1 200 000 so'm. Qolgan qarz qaysi valyutada yoziladi? 1.3-invariant "so'm va dollar hech qachon bitta summaga qo'shilmaydi" deydi — demak qarz ikkiga bo'linishi kerak, lekin qanday nisbatda ekani noaniq.

**Taklif.** 3.8 ga qoida:

> **Buyurtmaning valyutasi bitta** va u saqlashda qotib qoladi. Narx ikkinchi valyutada faqat **ko'rsatish uchun** hisoblanadi. To'lov boshqa valyutada qabul qilinsa (3.12), u buyurtma kursida (8.13) buyurtma valyutasiga o'giriladi va qarz doim buyurtma valyutasida qoladi.

---

### B-05 · Tayyor mahsulot sotilganda tannarx qayerdan olinadi — JIDDIY

**Nima yo'q.** 7.13 — mahsulot "Tugatdim"da yasalgan, material o'shanda yechilgan va xarajatga tushgan. Keyin u chegirma bilan sotiladi. **Foyda-zarar bu sotuvni qanday hisoblaydi?**

**Qayerda kerak.** 7.13 · 11.4.1 · 11.5.2 (mahsulot turi bo'yicha foyda)

**Usiz nima bo'ladi.** Ikki xato yo'l:
- Tannarx **qayta hisoblansa** → bir xil material ikki marta xarajat, foyda sun'iy past
- Tannarx **hisoblanmasa** → tushum 100% foyda bo'lib chiqadi va 11.5.2 buziladi

**Taklif.** 7.13 ga:

> Pozitsiya "Qaytarilgan" yoki "Rad etilgan"ga o'tganda uning **tannarxi saqlanadi** (7.8 bo'yicha, o'sha paytdagi qiymatda). Tayyordan sotilganda o'sha saqlangan tannarx ishlatiladi. Ombor qoldig'iga tegilmaydi — material allaqachon yechilgan. Xarajat qayta yozilmaydi, faqat **tushum** yoziladi va foyda `tushum − saqlangan tannarx` bo'ladi.

---

### B-06 · Sotuvchi kassasida dollar kuni yopilmaydi — O'RTA

**Nima yo'q.** 12.2 — sotuvchi kassasida **naqd so'm va naqd dollar**. 12.17 kun yopish oynasi esa faqat bitta valyutani ko'rsatadi.

**Qayerda kerak.** 12.17 · 15.4 kunlik varaqa

**Usiz nima bo'ladi.** Sotuvchida dollar yig'ilib qoladi (EC-KAS-09 aynan shu holatni tan oladi) va u hech qachon sanalmaydi. Kassa farqi mexanizmi dollar uchun umuman ishlamaydi.

**Taklif.** Kun yopish oynasi **har valyuta uchun alohida blok** beradi, farq ham alohida qayd etiladi. 12.20 jadvaliga qator qo'shiladi.

---

### B-07 · Tayyorlik sanasi bo'sh bo'lsa usta navbatida nima ko'rinadi — O'RTA

**Nima yo'q.** 3.13 — sana **ixtiyoriy**. 13.8 usta navbati esa har ishda `📅 Muddat: 10.08.2026` ko'rsatadi.

**Qayerda kerak.** 13.8 · 11.8.4 navbat holati

**Usiz nima bo'ladi.** Sanasiz ishlar navbatda muddat ko'rsatmaydi va ustalar ularni oxirgi qoldiradi. 3.13 aynan shundan ogohlantiradi: *"Ular umuman kechikmagan hisoblanadi"* — lekin faqat hisobot haqida gapiradi, navbat haqida emas.

**Taklif.** 13.8 da sanasiz ish `📅 Muddat: belgilanmagan` deb ko'rinadi, navbat tartibi esa **buyurtma sanasi** bo'yicha qoladi. 11.8.4 hisobotiga "sanasiz ishlar navbatda o'rtacha qancha kutdi" qatori qo'shiladi.

---

### B-08 · Xarid ro'yxatidagi yaxlitlash qoidasi yozilmagan — O'RTA

**Nima yo'q.** 15.3 misolida `7.80 + 8.00 = 15.80` → `olish: 16.00`, `2.94 + 10.00 = 12.94` → `13.00`. Yuqoriga yaxlitlanmoqda, lekin **qaysi qadamda** ekani yozilmagan.

**Qayerda kerak.** 15.3

**Usiz nima bo'ladi.** Rulon 3 m enda va 25 m bo'yida keladi — 16.00 kv.m so'rash amalda ma'nosiz. Dasturchi 0.01 gacha aniqlikda raqam chiqaradi va omborchi uni qo'lda yaxlitlaydi.

**Taklif.** Yaxlitlash qadami **material kartochkasida** belgilanadi (mato uchun 1 kv.m, karniz uchun 1 shtanga, kronshteyn uchun 1 quti). Bo'sh bo'lsa butun songa yuqoriga yaxlitlanadi.

---

### B-09 · Rulonning kv.m qiymati hisoblanish qoidasi yozilmagan — O'RTA *(Q-05 dan kelib chiqdi)*

**Nima yo'q.** Q-05 dan keyin kv.m — hisoblanadigan qiymat. Lekin **qisman ochilgan rulon** uchun formula yozilishi kerak.

**Qayerda kerak.** 7.4 · 11.7.1 · 11.7.6 · 15.1

**Taklif.** 7.4 ga bitta qator:

> Bo'lakning maydoni doim `eni × bo'yi`. Rulonda eni asl eni bo'lib qoladi, bo'yi esa qolgan bo'yi (7.4). `R-118: 3.00 × 28.00 = 84.00 kv.m`.

---

### B-10 · Ishlab chiqarish braki bo'lganda haq va band nima bo'ladi — JIDDIY

**Nima yo'q.** U-01 bilan bog'liq. 13.8 — qayta kesish tasdiqlanganda material **ikkinchi marta** yechiladi. Lekin:

- Yangi bo'lak **band qilinadimi**? Kim topadi?
- Mos bo'lak yo'q bo'lsa pozitsiya "Materialga kutmoqda"ga tushadimi? 8.3 unday o'tishni ko'rsatmaydi — u faqat "Tasdiqlangan"dan chiqadi
- Birinchi kesimdan chiqqan ostatka nima bo'ladi — chiqindiga yoziladimi?
- Usta ikkinchi marta "Tugatdim" bosganda haq **ikki marta** hisoblanadimi? 10.10 "Tugatdim bosgan payt" deydi — teskari yozuv qoidasi yo'q

**Taklif.** U-01 dagi yangi 8.17-bandda hammasi yoziladi. Tavsiyam: haq **bir marta** (birinchi "Tugatdim" bekor qilinadi, ikkinchisida qayta hisoblanadi), birinchi kesim **to'liq chiqindiga**, yangi bo'lak odatdagi algoritm bilan band qilinadi.

---

### B-11 · Maketlar TZ ga havola qilinmagan — O'RTA

**Nima yo'q.** Hujjat 44 ta ekranni tasvirlaydi, 5 tasining HTML maketi bor, lekin **TZ ularni umuman tilga olmaydi**.

**Qayerda kerak.** 6.1 · 7.1 · 8.1 · 9.1 · 10.1 — har birining "Ekranlar" bandi

**Usiz nima bo'ladi.** Dasturchi maketlarni ko'rmaydi va ekranni matndan qayta o'ylab topadi.

**Taklif.** Har "Ekranlar" bandi oxiriga: `Maket: maketlar/ombor-maket.html`. Bundan tashqari **ombor maketi eskirgan** (README da qayd etilgan) va Q-02, Q-05 qarorlaridan keyin yanada eskiradi — u qayta chizilishi shart.

---

## 5. TAKLIFLAR

> Zarur emas. Har biriga: nima · nega · qancha ish.

**T-01 · Bandlar bo'yicha izlanuvchi indeks**
Hujjat oxiriga alifbo tartibida atama → band jadvali ("ostatka → 7.4, 7.5, 7.6", "kurs → 1.3, 8.13, 9.6, 14.5"). *Nega:* 2 900 qatorli hujjatda `Ctrl+F` "kurs" 40 ta natija beradi. *Ish:* 1–2 soat, bir marta.

**T-02 · Har bandning tepasiga "kimga tegadi" qatori**
1.2-bo'limdagi teskari indeksni band darajasiga tushirish: 7.3 tepasida `→ 7.6 · 8.3 · 8.12 · 15.1 · 15.2`. *Nega:* U-02 dagi 22 ta uzilgan havola aynan shu bo'lmagani uchun paydo bo'lgan. *Ish:* 3–4 soat.

**T-03 · Ostatka yoshi va avtomatik tozalash taklifi**
11.7.6 muzlab qolgan pulni ko'rsatadi, lekin nima qilishni taklif qilmaydi. Har ostatka yoniga yoshi va 6 oydan oshganlarga "chiqindiga chiqarish" tugmasi. *Nega:* hisobot bor, harakat yo'q. *Ish:* kichik, 11.7.6 ga qo'shimcha.

**T-04 · Kesish rejasining oldindan ko'rinishi (sotuv paytida)**
Sotuvchi o'lchamni kiritganda "bu kesimdan 0.60 × 2.00 ostatka qoladi" deb ko'rsatish. *Nega:* mijoz bilan o'lchamni 5 sm o'zgartirib kelishish mumkin va butun bo'lak saqlanadi. *Ish:* o'rta — 7.6 algoritmini sotuv ekranidan ham chaqirish kerak.

**T-05 · Bir sotuvchidan ikkinchisiga naqd o'tkazish**
12.7 va 12.8 faqat sotuvchi ↔ admin yo'nalishini qamraydi. Amalda smena almashganda sotuvchilar bir-biriga pul beradi. *Nega:* hozir buni yozish uchun ikkita qo'lda yozuv kerak va ular bog'lanmaydi. *Ish:* kichik — 12.7 mexanizmining nusxasi.

**T-06 · Mijozga avtomatik qarz eslatmasi jadval bo'yicha**
13.6 "qarz eslatmasi" xabarini sanaydi, lekin qachon yuborilishi yozilmagan. Sozlamada "muddatdan N kun keyin" qoidasi. *Nega:* hozir kimdir qo'lda bosishi kerak, demak yuborilmaydi. *Ish:* kichik — 14.7 ga bitta qoida.

**T-07 · Buyurtma kartochkasida material bloki**
8.14 to'rt tab beradi, lekin "bu buyurtmaga qaysi bo'laklardan qancha ketdi" ko'rinmaydi. Q-02 dan keyin bu ma'lumot bazada bor. *Nega:* nizo chiqqanda ("mato boshqacha edi") javob topish. *Ish:* kichik.

**T-08 · Narx o'zgarishi tarixini material kartochkasiga qo'shish**
9.8 yetkazib beruvchi tomonidan narx tarixini beradi, lekin **sotuv narxi** o'zgarishi tarixi hech qayerda yo'q. *Nega:* 11.7.5 ustama eroziyasini ko'rsatadi, lekin "narxni oxirgi marta qachon ko'targanmiz" degan savolga javob yo'q. *Ish:* kichik — audit jurnalidan filtr.

---

## 6. TUZATISH TARTIBI

| № | Nima | Jiddiylik | Bog'liq |
|---|---|---|---|
| 1 | Q-01 karniz birligi — 3.7, 5.3, 5.4, 4.5, 18 | KRITIK | B-01 bilan birga |
| 2 | B-01 formula natijasining birligi — 4.5, 4.8 | KRITIK | Q-01 bilan birga |
| 3 | Q-02 + Q-06 band va bo'lak tasdig'i — 7.3, 7.4, 7.6, EC-OMB-21, 19.2 | KRITIK | Z-05 ni ham yopadi |
| 4 | Q-05 ombor birligi — 5.2, 7.3, 11.7.1, 11.11, 15.1 | KRITIK | Q-02 dan keyin |
| 5 | Q-03 + Q-11 + Q-12 buyurtma oqimi — 3.4, 3.14, 8.3, 8.4, 8.12, 13.4 | KRITIK | Z-04 ni ham yopadi |
| 6 | U-02 22 ta havola raqami | JIDDIY | mustaqil, mexanik ish |
| 7 | U-01 + B-10 yangi 8.17-band (ishlab chiqarish braki) | JIDDIY | Q-02 dan keyin |
| 8 | U-07 foyda-zarar moddalari — 11.4.1 | JIDDIY | mustaqil |
| 9 | Q-04 ruxsatlar — 1.2, 9.5, 10.15, 11.10, 12.14 | JIDDIY | mustaqil |
| 10 | Q-13 birlashtirish tavsiya bo'lib qoladi — 7.6, EC-OMB-02 | JIDDIY | Q-02 dan keyin |
| 11 | Q-14 standart rulon eni maydoni — 5.3, 15.3 | JIDDIY | B-08 bilan birga |
| 12 | B-03, B-04, B-05, U-04, U-05 | JIDDIY | mustaqil |
| 13 | Z-08, Z-09, U-03, U-06, U-08, U-09, U-13, B-06..B-09, B-11 | O'RTA | mustaqil |
| 14 | Z-10..Z-16, U-10..U-12, U-14 | MAYDA | oxirida bir yo'la |
| 15 | Ombor maketini qayta chizish | — | 3, 4 dan keyin |

**Ochiq savol qolmadi.** Barcha 16 ziddiyat bo'yicha qaror qabul qilingan yoki taklif yozilgan. 5 ta KRITIK topilma birinchi beshta qadamda yopiladi.

### 6.1. TZ-v1.15 uchun qisqacha ro'yxat

**Qayta yoziladigan bandlar:** 3.7 · 3.13 · 3.14 · 4.5 · 5.2 · 5.3 · 5.4 · 5.5 · 7.3 · 7.4 · 7.6 · 8.3 · 8.4 · 8.12 · 11.4.1 · 11.10 · 11.12 · 12.14 · 14.4 · 15.1 · 15.3 · 17.2 · 19.1

**Yangi qo'shiladigan bandlar:** 3.15 (Tayyordan tanlash) · 8.17 (Ishlab chiqarish braki va qayta kesish)

**O'zgaradigan edge case'lar:** EC-OMB-02 · EC-OMB-04 (16.1 dagi kod) · EC-OMB-21 · EC-INV-04

**Mexanik tuzatish:** U-02 dagi 22 ta havola raqami · Z-12 dagi hisob xatosi · Z-15, Z-16 dagi sanoqlar

**Maket:** ombor maketi qayta chiziladi (band ustuni, `eni × bo'yi` ko'rinishi, ikkita ostatka chegarasi)

---

*Audit oxiri.*


---

## AUDIT-2 — yangi bo'limlar tekshiruvi

Yangi bo'limlar (20, 21, 22, 8.17, 3.15, soliq) va ma'lumotlar modeli
tekshirildi. **9 topilma.**

## B.1. Qarorga aylangan to'rttasi

| # | Nima edi | Qaror |
|---|---|---|
| **A-01** | Bosh admin qaysi filialda | Q-29: xodim bitta filialda. Pul xodim kassasida, topshirilgan joyga ketadi |
| **A-02** | Sotuvchi rejasi va foyda taqsimoti to'qnashadi | Q-30: filiallararo qarz mexanizmi (22-bo'lim) |
| **A-03** | Xarid kim qiladi | Q-31: har filial o'zi |
| **A-04** | Material bir filialda tugadi | Q-32: sotuvchi tanlaydi — kutish yoki boshqa filialga yuborish |

## B.2. Tuzatilgan beshtasi

### A-05 · Yangi statuslar bot ro'yxatiga qo'shilmagan — JIDDIY

**Muammo.** 20.5 uchta yangi status qo'shdi. TZ 13.6 esa 9 statusni mijoz
uchun 4 taga qisqartiradi. Yangi uchtasi u yerda yo'q.

**Oqibati.** Mijoz botda "Tayyor" ni ko'radi, lekin mahsulot boshqa shaharda
yo'lda. Kelib olmoqchi bo'ladi, yo'q ekan.

**Tuzatish.** 13.6 xaritasi:

| Ichki status | Mijoz ko'radi |
|---|---|
| Filialga yuborildi | **Tayyorlanmoqda** |
| Tayyor — yo'lda | **Yo'lda** ← yangi |
| Yetib keldi | **Olishga tayyor** |

"Yo'lda" statusi qo'shiladi — mijoz uchun 5 ta status bo'ladi.

### A-06 · Ko'chirish audit jurnaliga tushmaydi — O'RTA

**Muammo.** 20.7 audit jurnalini va'da qiladi, model uni ko'rsatmaydi.

**Tuzatish.** `kochirish` yaratilishi, jo'natilishi, qabul qilinishi va
summasining qo'lda o'zgartirilishi — to'rttasi ham `audit_jurnal` ga
(2.4 dagi teskari qoida bo'yicha: har qo'lda korrektsiya jurnalga).

### A-07 · Reja fakti qaysi sanaga qaraydi — O'RTA

**Muammo.** 21.5.1 "qaytarilgan buyurtma tushumni kamaytiradi — qaytarilgan
oyda". Lekin tushum **qaysi sana** bo'yicha yig'ilishi yozilmagan.

**Tuzatish.** 21.5 ga aniqlik:

> Reja fakti **"Topshirildi" sanasi** bo'yicha yig'iladi — buyurtma yaratilgan
> sana emas. Qaytarish ham o'z sanasida hisoblanadi.

Bu 22.3.2 (qarz qachon yoziladi) bilan ham mos — ikkalasi bir nuqtada.

### A-08 · NDS chegirmadan oldinmi keyinmi — JIDDIY

**Muammo.** Soliq bo'limi "NDS narxdan ajratiladi" deydi, lekin chegirma (3.11)
bilan tartibi yozilmagan.

**Oqibati.** 678 400 dan 78 400 chegirma. NDS 12%:

```
Chegirmadan oldin:  678 400 → NDS 72 686 → keyin chegirma → 600 000
Chegirmadan keyin:  600 000 → NDS 64 286
```

Farq 8 400 so'm — soliq hisobotida xato.

**Tuzatish.** NDS **chegirmadan keyin**, yakuniy summadan ajratiladi:

```
Buyurtma summasi                600 000   (chegirma qo'llangan)
NDS 12%                          64 286
Summa NDSsiz                    535 714
```

### A-09 · "Yo'lda" bo'lak inventarizatsiyada qayerda — O'RTA

**Muammo.** `bolak.holat = 'YOLDA'` — u hech qaysi filial qoldig'ida emas
(20.7.4). Lekin 15.1 sanash varaqasida qaysi filialda ko'rinishi aniq emas.

**Tuzatish.** Yo'ldagi bo'lak **jo'natuvchi filialning** inventarizatsiyasida,
alohida `yolda = true` belgisi bilan ko'rinadi. Omborchi uni sanamaydi — u
jismonan yo'q. Faqat ma'lumot uchun.

Qabul qilingandan keyin qabul qiluvchi filialga o'tadi.

## B.3. Yangi qaror keltirib chiqargan uchta o'zgarish

22-bo'lim quyidagilarni o'zgartiradi:

| Band | Nima o'zgaradi |
|---|---|
| **12.5** | Yangi kirim kodi K8 (filialdan qarz to'lovi) |
| **12.6** | Yangi chiqim kodi C10 (filialga qarz to'lovi) |
| **12.7** | Topshiriq boshqa filialga ham bo'lishi mumkin, ogohlantirish bilan |
| **20.17** | Foyda taqsimoti endi **haqiqiy pul harakati** bilan qo'llab-quvvatlanadi |
| **20.18** | Transport xarajati filial balansiga tushmaydi — operatsion xarajat bo'lib qoladi |
| **11.4.1** | Filiallararo qarz foyda-zararga tegmaydi (22.7.3) |

## B.4. Yakuniy holat

| O'lchov | Son |
|---|---|
| Bo'limlar | 22 |
| Edge case | 126 + 12 (filial) + 7 (reja) + 7 (brak) + 5 (tayyor) + 8 (filial qarz) = **165** |
| Jadvallar | 43 + 1 (`filial_harakat`) = **44** |
| Tekshiruv invariantlari | 11 |
| Ochiq savol | **0** |

---

*22-bo'lim va AUDIT-2 oxiri.*
