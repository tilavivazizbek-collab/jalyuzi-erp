# TEXNIK TALABLAR — v1.0

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
