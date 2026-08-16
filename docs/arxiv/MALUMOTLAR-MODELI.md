# MA'LUMOTLAR MODELI — v1.0

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
