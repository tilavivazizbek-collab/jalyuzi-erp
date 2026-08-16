# 22-BO'LIM · FILIALLARARO HISOB-KITOB
# + AUDIT-2 (yangi bo'limlar tekshiruvi)

**Asos:** Q-29 … Q-35
**Sana:** 15.08.2026

---

# QISM A — 22-BO'LIM · FILIALLARARO HISOB-KITOB

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

# QISM B — AUDIT-2

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
