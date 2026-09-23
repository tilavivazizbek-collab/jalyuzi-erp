# JALYUZI TURLARI — KONSTRUKTOR XARITASI

Har jalyuzi turi uchun: qaysi slotlar, qaysi formula, qaysi birlik,
qaysi koeffitsient va kesish turi. **Bevosita `Mahsulot turi → Yangi`
ekraniga kiritiladigan shaklda.**

Oxirgi yangilanish: **2026-09-20**

---

## 0. Belgilar

| Belgi | Ma'nosi |
|---|---|
| **[CORE]** | Formulaning TUZILISHI — sohada universal, o'zgarmaydi |
| **[Taxmin]** | RAQAM — sohada odatiy, lekin **o'z ta'minotchingiz va ustangiz bilan tasdiqlang** |

⚠️ Bu hujjatdagi birorta koeffitsient «standart haqiqat» emas. Ular
o'lchov va tajriba bilan tuzatiladi. Formulalarning o'zi esa
tuzatishga muhtoj emas.

---

## 1. ENG MUHIM QOIDA — mato zaxirasi formulaga YOZILMAYDI

Bu shu loyihaning qoidasi, umumiy soha qoidasi emas.

`lib/domain/kesish.ts` → `kesimOlchami()` kesim to'rtburchagini
shunday chiqaradi:

```
eni  = jami_kv_m ÷ boyi
boyi = BUYURTMA bo'yi          ← formuladan emas!
```

Shuning uchun matoga yozilgan har qanday ko'paytma **eniga** tushadi:

| Qanday kiritilgan | 180 × 220 buyurtmada nima izlanadi |
|---|---|
| Formula `MAYDON * 1.12`, koeff `1`, kesish `ENIGA` | `2.02 × 2.20 m` — **2 m dan keng rulon kerak** ❌ |
| Formula `MAYDON`, koeff `1.12`, kesish **`BO'YIGA`** | `1.80 × 2.47 m` — **oddiy rulon yetadi** ✅ |

### Qoida

> **Mato (`KV_M`) slotida formula doim `MAYDON`.
> Zaxira va qavat soni — `koeffitsient` maydoniga, kesish turi `BO'YIGA`.**

`ENIGA` faqat bitta holatda to'g'ri: mato haqiqatan ham **eniga**
ikki marta kerak bo'lganda (juda kam uchraydi, masalan enlik ulanma).

Chiziqli (`M`) va dona (`DONA`) materiallarda koeffitsient
**umuman ishlamaydi** (`lib/domain/formula.ts` → `slotSarfi`) — ularda
hamma narsa formula matnida yoziladi.

---

## 2. Formula tilida nima bor

| Bor | Yo'q |
|---|---|
| `+` `−` `*` `/` va qavslar | `IF` / shart |
| `CEIL` `FLOOR` `ROUND` `MIN` `MAX` | `ABS`, qoldiq (`%`) |
| `ENI` `BO'YI` (**metr**), `MAYDON` (**kv.m**), `SONI` | — |
| Mahsulot parametrlari (`QADAM`, `LAMEL_ENI`, …) — **metrda** | — |

⚠️ **Ayirish `MAX` bilan himoyalanadi.** `ENI - 0.02` formulasi kichik
enida manfiy chiqadi va tizim texnik xato beradi (`OLCHOV_NOTOGRI`),
tushunarli xabar emas. To'g'risi: `MAX(0.40, ENI - 0.02)`.

---

## 3. RULON (rollo)

**Parametrlar:** yo'q

| # | Slot | Birlik | Formula | Koeff | Kesish | Izoh |
|---|---|---|---|---|---|---|
| 1 | Mato | `KV_M` | `MAYDON` | **1.12** [Taxmin] | `BO'YIGA` | valga o'ralish + pastki buklama |
| 2 | Val (turba) | `M` | `MAX(0.40, ENI - 0.02)` | — | — | [Taxmin] 0.02 m kam, eng kami 0.40 m |
| 3 | Pastki planka | `M` | `MAX(0.20, ENI - 0.02)` | — | — | |
| 4 | Zanjir | `M` | `BO'YI * 2 + 0.30` | — | — | [CORE] halqa yopiq |
| 5 | Kronshteyn | `DONA` | `2` | — | — | [CORE] |

⚠️ Eni 2.50 m dan oshsa uchinchi kronshteyn qo'yiladi:
`MAX(2, CEIL(ENI / 1.25))` [Taxmin — oraliqni usta aytadi].

---

## 4. KUN-TUN (zebra)

Rulondan farqi bitta: mato **ikki qavat**, shaffof va zich yo'llar
navbatlashadi.

| # | Slot | Birlik | Formula | Koeff | Kesish | Izoh |
|---|---|---|---|---|---|---|
| 1 | Mato | `KV_M` | `MAYDON` | **2.10** [Taxmin] | **`BO'YIGA`** | ⚠️ ikki qavat + zaxira |
| 2 | Val | `M` | `MAX(0.40, ENI - 0.02)` | — | — | |
| 3 | Pastki planka | `M` | `MAX(0.20, ENI - 0.02)` | — | — | |
| 4 | Zanjir | `M` | `BO'YI * 2 + 0.30` | — | — | |
| 5 | Kronshteyn | `DONA` | `2` | — | — | |

⚠️ **Aynan shu yerda `BO'YIGA` hal qiluvchi.** `ENIGA` bo'lsa 1.80 m
pardaga **3.78 m keng** rulon izlanadi — bunday rulon bozorda yo'q va
pozitsiya abadiy «Materialga kutmoqda»da qoladi.

---

## 5. VERTIKAL (dikkey)

**Parametrlar:** `LAMEL_ENI` = `0.089` yoki `0.127` (metr) [Taxmin]

⚠️ Barcha uzunlik **METRDA** (2026-09-20). 89 mm lamel → `LAMEL_ENI = 0.089`.

| # | Slot | Birlik | Formula | Koeff | Kesish | Izoh |
|---|---|---|---|---|---|---|
| 1 | Lamel (mato) | `KV_M` | `MAYDON` | **1.05** [Taxmin] | `BO'YIGA` | pastki buklama |
| 2 | Karniz-profil | `M` | `ENI + 0.02` [Taxmin] | — | — | |
| 3 | Begunok | `DONA` | `CEIL(ENI / LAMEL_ENI)` | — | — | [CORE] lamel soniga teng |
| 4 | Ryzeg (gruzik) | `DONA` | `CEIL(ENI / LAMEL_ENI)` | — | — | [CORE] 1:1 |
| 5 | Pastki zanjircha | `M` | `ENI + 0.10` | — | — | |
| 6 | Boshqaruv zanjiri | `M` | `BO'YI * 2 + 0.25` | — | — | |
| 7 | Kronshteyn | `DONA` | `MAX(2, CEIL(ENI / 1.50))` | — | — | [Taxmin] |

⚠️ Lamel matosi rulondan **bo'y bo'ylab** kesiladi, har lamel alohida
tasma. Tizim uni bitta to'rtburchak deb biladi — bu to'g'ri, chunki
rulondan ochiladigan tasmaning umumiy uzunligi bir xil.

---

## 5a. VERTIKAL — TO'LQINSIMON (tasmali mato)

Egasining haqiqiy matosi (2026-09-22): rulon, **eni 0.40 m**, bo'yi
100 m. Mato tepadan pastga tushadi va orqa-oldinga tushib chiqib
to'lqin hosil qiladi. Shu sababli **0.40 m enli tasma oynada ~0.11 m
joy egallaydi**.

⚠️ «Maydondan» turi buni IFODA QILA OLMAYDI: tasma soni butun songa
yaxlitlanadi va qadamga bog'liq, maydonga esa bitta ko'paytma
qo'yiladi.

**Sarf turi:** `Tasmalab (lamel, to'lqin)` — to'rtta katak:

| Katak | Ma'nosi | Egasining qiymati |
|---|---|---|
| qadam | bitta tasma oynada qancha joy egallaydi | `0.11` (11 sm) |
| tasma | rulondan qancha enli tortiladi | `0.40` (40 sm) |
| yaxlitlash | 18.18 ta tasma nechta bo'ladi | `yaqiniga` |
| soniga | markazdan ochilsa bitta kam | `0` yoki `-1` |

Yasaladigan formula: `ROUND(ENI / 0.11) * 0.4 * BO'YI`

**Misol — 2.00 × 2.50 m oyna, bir tomonga ochiladi:**

```
tasma soni  = ROUND(2.00 / 0.11) = 18 ta
mato sarfi  = 18 × 0.40 × 2.50   = 18.00 kv.m
ombordan    = 18.00 ÷ 0.40       = 0.40 × 45.00 m
100 m rulondan 45 m ketadi, 55 m qoladi
```

⚠️ **NARX OGOHLANTIRISHI.** Oyna maydoni 5.00 kv.m, mato sarfi
18.00 kv.m — **3.6 barobar**. Rulon pardada bu nisbat 1.05.
Dikkey narx jadvalidagi 1 kv.m narxi shuni hisobga olishi SHART,
aks holda har buyurtmada zarar bo'ladi.

⚠️ **Bir tomonga / markazdan** — hozircha **ikki alohida tur**
(egasi qarori 2026-09-22). Formula tilida shart yo'q, tanlov modeli
esa hali qurilmagan. Ikki turda mexanizm va kronshteyn formulalari
ham boshqa-boshqa bo'ladi.

Testlar: `test/domain/tasmali-sarf.test.ts` (EC-TASMA-01…09).

---

## 6. GORIZONTAL

**Parametrlar:** `QADAM` = `2.2` (25 mm lamel) yoki `4.4` (50 mm) [Taxmin]

⚠️ **Dastlabki xaritada bu tur teskari yozilgan edi.** Gorizontal
jalyuzida lamellar **bo'y bo'ylab taxlanadi**, eni bo'ylab emas:

```
lamel soni = CEIL(BO'YI ÷ QADAM)        ← eni emas, BO'YI  (ikkalasi metrda)
har lamel uzunligi = ENI
```

`CEIL(ENI ÷ LAMEL_ENI)` — bu **vertikal** uchun to'g'ri formula.

| # | Slot | Birlik | Formula | Koeff | Kesish | Izoh |
|---|---|---|---|---|---|---|
| 1 | Lamel | `M` | `CEIL(BO'YI / QADAM) * ENI` | — | — | [CORE] jami chiziqli uzunlik |
| 2 | Karniz | `M` | `ENI` | — | — | |
| 3 | Pastki planka | `M` | `ENI` | — | — | |
| 4 | Ip-lesa (narvon) | `M` | `CEIL(ENI / 0.60) * (BO'YI + 0.20)` | — | — | [Taxmin] har 0.60 m ga 1 qator |
| 5 | Ko'taruvchi ip | `M` | `CEIL(ENI / 0.60) * (BO'YI * 2 + ENI)` | — | — | [CORE] |
| 6 | Boshqaruv zanjiri | `M` | `BO'YI * 2 + 0.25` | — | — | |
| 7 | Kronshteyn | `DONA` | `MAX(2, CEIL(ENI / 1.00))` | — | — | [Taxmin] |

Agar lamel **dona** bo'lib sotib olinsa (tayyor kesilgan), 1-slot:
birlik `DONA`, formula `CEIL(BO'YI / QADAM)`.

---

## 7. PLISSE

| # | Slot | Birlik | Formula | Koeff | Kesish | Izoh |
|---|---|---|---|---|---|---|
| 1 | Mato | `KV_M` | `MAYDON` | **1.06** [Taxmin] | `BO'YIGA` | plisse matosi oldindan burmalangan |
| 2 | Yuqori profil | `M` | `ENI` | — | — | |
| 3 | Pastki profil | `M` | `ENI` | — | — | |
| 4 | Yon profil | `M` | `(BO'YI + 0.02) * 2` | — | — | [CORE] ikki tomon |
| 5 | Ip | `M` | `CEIL(ENI / 0.50) * (BO'YI * 2 + 0.20)` | — | — | [Taxmin] har 0.50 m ga 1 qator |
| 6 | Kronshteyn | `DONA` | `2` | — | — | |

⚠️ Plisse matosi **allaqachon burmalangan** holda keladi. Agar
ta'minotchi «yoyilgan uzunlik» bilan sotsa koeffitsient 1.06 emas,
**2.0–2.5** bo'ladi — bu ta'minotchidan aniqlanadi.

---

## 8. UYALI (soty / honeycomb)

Plisse bilan bir xil tuzilma, mato ikki qavat uyali.

| # | Slot | Birlik | Formula | Koeff | Kesish | Izoh |
|---|---|---|---|---|---|---|
| 1 | Mato | `KV_M` | `MAYDON` | **1.10** [Taxmin] | `BO'YIGA` | |
| 2 | Yuqori profil | `M` | `ENI` | — | — | |
| 3 | Pastki profil | `M` | `ENI` | — | — | |
| 4 | Yon profil | `M` | `(BO'YI + 0.02) * 2` | — | — | |
| 5 | Ip | `M` | `CEIL(ENI / 0.50) * (BO'YI * 2 + 0.20)` | — | — | [Taxmin] |
| 6 | Kronshteyn | `DONA` | `2` | — | — | |

---

## 9. RIM (rimskaya)

**Parametrlar:** `BURMA` = `0.25` — burmalar orasidagi masofa, METR [Taxmin]

| # | Slot | Birlik | Formula | Koeff | Kesish | Izoh |
|---|---|---|---|---|---|---|
| 1 | Mato | `KV_M` | `MAYDON` | **1.18** [Taxmin] | `BO'YIGA` | yon va pastki buklama |
| 2 | Karniz | `M` | `ENI` | — | — | |
| 3 | Reyka | `M` | `CEIL(BO'YI / BURMA) * ENI` | — | — | [CORE] har burmaga 1 reyka |
| 4 | Halqa | `DONA` | `CEIL(BO'YI / BURMA) * 3` | — | — | [Taxmin] 3 qator |
| 5 | Ko'taruvchi ip | `M` | `(BO'YI * 2 + ENI) * 3` | — | — | [CORE] |
| 6 | Pastki og'irlik | `M` | `ENI` | — | — | |
| 7 | Kronshteyn | `DONA` | `2` | — | — | |

---

## 9a. TANLOVLAR — 0052 (2026-09-23)

Mahsulot turida «Tanlovlar» bo'limi bor. Har tanlovda nom, ixtiyoriy
kod va variantlar; har variantda nom, son va narx.

| To'ldirilgani | Ta'siri | Misol |
|---|---|---|
| faqat nom | ustaga yozuv boradi | Boshqaruv tomoni: Chap / O'ng |
| narx | summaga qo'shiladi | Kasseta: Bor (+50 000) |
| kod + son | **formulaga tushadi** | Lamel eni: 89 mm (0.089) |

**Formulada ishlatish:** tanlovga `LAMEL_ENI` kodi berilsa, slot
formulasida shunday yoziladi:

```
CEIL(ENI / LAMEL_ENI)
```

⚠️ `ENI`, `BO'YI`, `MAYDON`, `SONI` kodlari **taqiqlangan** — ular
tizimning o'z o'zgaruvchilari. Bosib ketilsa formula oynaning enini
emas, tanlovning sonini olardi.

**Aksessuarni variantga bog'lash:** `mahsulot_aksessuar.variant_id`
to'ldirilsa, aksessuar faqat o'sha variant tanlanganda qo'shiladi.
Motorli jalyuzida zanjir qo'shilmaydi, kabel va quvvat manbai
qo'shiladi.

### Dikkey ochilishi — egasining holati

«Bir tomonga» va «Markazdan» endi **bitta turda**:

| Tanlov | Kod | Variant | Son |
|---|---|---|---|
| Ochilish | `QOSHIMCHA_TASMA` | Bir tomonga | `0` |
| | | Markazdan | `-1` |

Slot formulasi: `(ROUND(ENI / 0.11) + QOSHIMCHA_TASMA) * 0.4 * BO'YI`

2 × 2.5 m oynada: bir tomonga **18.00 kv.m**, markazdan **17.00 kv.m**.

---

## 9b. O'RNATISH TURI — oyna o'lchamidan tayyor o'lchamga (0053)

Mahsulot turida **«O'rnatish turi»** bo'limi bor. Har qatorda: nom,
eniga qo'shiladigan, bo'yiga qo'shiladigan, standartmi.

### Nega kerak

Zamerchi **oynani** o'lchaydi. Tizim esa **tayyor jalyuzi**
o'lchamini kutadi (`eni_m` / `boyi_m`). Ular hech qachon teng emas:

| O'rnatish | Eniga | Bo'yiga |
|---|---|---|
| Oyna ustiga (devorga) | +0.10 | +0.15 |
| Oyna ichiga (proyomga) | −0.01 | −0.01 |
| Poldan (dikkey) | 0 | −0.02 |

Shu paytgacha bu farqni **sotuvchi boshida hisoblardi**. Jalyuzi
biznesida peredelkaning birinchi sababi shu: ikki santimetr xato
= mato ham, mexanizm ham kesilgan, usta bir kun ishlagan.

⚠️ Xato **hech qayerda ushlanmasdi**: 0051 o'lcham chegarasi ham
o'tkazib yuboradi, chunki ikki santimetr chegarani buzmaydi.

### Qoidalar

- Qo'shimcha **manfiy** bo'ladi (proyom) — bazada `>= 0` tekshiruvi yo'q
- Chegara ±1 metr: bundan kattasi deyarli har doim metr o'rniga
  **santimetr** yozilgani bo'ladi
- Turga **bitta standart** — unique indeks bilan to'siladi. Sotuv
  ekrani shu bilan ochiladi; standart belgilanmagan bo'lsa
  **birinchisi** olinadi (`null` emas: bo'sh dropdown bilan
  ochilsa sotuvchi tanlashni unutar va oyna o'lchami tayyor
  o'lcham bo'lib ketardi)
- **Aniqlik — 1 sm.** Tizimda o'lcham hamma joyda `numeric(_,2)`.
  «Pol − 1.5 sm» yozilsa ekranda −0.01, bazada −0.02 ko'rinardi —
  endi qo'shimcha kirishda darhol 1 sm ga keltiriladi va ekran,
  hisob, snapshot uchalasi bir xil
- Ro'yxat **bo'sh** bo'lsa tur avvalgidek ishlaydi: sotuvchi tayyor
  o'lchamni o'zi yozadi

### Usta oxirgi so'zni aytadi

Egasining gapi: «usta xohishicha o'zgartiraveradi inputni, agar
o'zgartirmasa eski holatida saqlanadi».

`buyurtma_pozitsiya.olcham_qolda` — tayyor o'lcham qo'lda yozilgan
bo'lsa `true`. Shunda oyna o'lchami yoki o'rnatish turi keyin
o'zgarsa ham tayyor o'lcham **qayta hisoblanmaydi**.

### Nima o'zgarmadi

`eni_m` / `boyi_m` ma'nosi **o'sha-o'sha**: doim tayyor jalyuzi
o'lchami. Narx, formula, kesim, band qilish — hammasi tegilmagan.
Oyna o'lchami qo'shimcha yozuv: hisobga kirmaydi, faqat saqlanadi
va ko'rsatiladi (`oyna_eni_m`, `oyna_boyi_m` + snapshot
`ornatish_nom`, `ornatish_eni_m`, `ornatish_boyi_m`).

Shuning uchun eski buyurtmalar ham, o'rnatish turi belgilanmagan
turlar ham buzilmadi.

Domen: `lib/domain/olcham-qoidasi.ts` · testlar: EC-OLQ-01…26.

---

## 10. Kiritish tartibi

Ekranda (`Mahsulot turi → Yangi`) har slot uchun uch narsa belgilanadi:

1. **Sarf turi** dropdowni — quyidagi jadval
2. **Koeffitsient** — mato slotida zaxira, boshqasida `1`
3. **Kesish turi** — mato slotida `BO'YIGA`, boshqasida ahamiyatsiz

| Dropdowndagi nom | Yasaladigan formula |
|---|---|
| Maydondan | `MAYDON * n` |
| Enidan | `ENI * n` |
| Bo'yidan | `BO'YI * n` |
| **Ham eniga, ham bo'yiga** | **`ENI * a + BO'YI * b`** — ikki katak ochiladi |
| Har donaga | `n` |
| Murakkab | yozilgani o'zgarishsiz |

⚠️ Yuqoridagi jadvallarda `MAX(...)`, `CEIL(...)` bo'lgan har qanday
formula **`Murakkab`** turiga kiritiladi — soddalashtirilgan dropdown
faqat shu oltita shaklni taniydi (`lib/domain/sarf-turi.ts`).

### «Ham eniga, ham bo'yiga» — qachon ishlatiladi

Material **ikkala o'lcham bo'ylab** ketganda, ikki alohida qator
o'rniga bitta. Koeffitsientlar **qo'shiladi**, ko'paytirilmaydi.

```
Plisse ramkasi, bir xil profil:
  yuqori + pastki  →  eniga  × 2
  ikki yon         →  bo'yiga × 2
  formula          →  ENI * 2 + BO'YI * 2
```

⚠️ Ko'paytirish **emas**. `ENI × a × BO'YI × b` bo'lsa u `MAYDON × (a×b)`
ning o'zi bo'lardi — buning uchun «Maydondan» turi bor.

⚠️ §7 va §8 jadvallaridagi profil qatorlarida `+2` zaxira bor
(`(BO'YI + 0.02) * 2`), shuning uchun ular `Murakkab` bo'lib qoladi.
Zaxirasiz ishlasangiz ularni bitta «Ham eniga, ham bo'yiga» qatoriga
yig'ish mumkin.

### Kiritishdan oldin

1. **Almashtirish guruhi** yaratiladi (har slot bittasiga bog'lanadi) —
   guruhsiz slot sotuvda **bo'sh dropdown** beradi va konstruktor
   saqlanmaydi.
2. **Materiallar** kiritiladi va guruhga biriktiriladi.
3. **Parametrlar** (`QADAM`, `LAMEL_ENI`, `BURMA`) turga qo'shiladi —
   formulada ishlatilgan har nom mavjud bo'lishi shart.
4. **Test kalkulyatori** (TZ 4.8) bilan saqlashdan oldin tekshiriladi.

### Tekshirish namunasi

1.80 × 2.20 m kun-tun, mato koeff 2.10, kesish `BO'YIGA`:

```
MAYDON        = 1.80 × 2.20 = 3.96 kv.m        ← ÷10 000 YO'Q (2026-09-20)
jami          = 3.96 × 2.10 = 8.3160 kv.m
kesim bo'yi   = 2.20 × 2.10 = 4.62 m
kesim eni     = 8.3160 ÷ 4.62 = 1.80 m          ← buyurtma enisiga teng ✅
```

`ENIGA` bo'lsa: eni `3.78 m`, bo'yi `2.20 m` — **rulon topilmaydi**.

---

## 11. Tasdiqlanishi kerak bo'lgan raqamlar

| Nima | Taxmin | Kim aytadi |
|---|---|---|
| Rulon mato koeffitsienti | 1.12 | usta — valga necha marta o'raladi |
| Kun-tun mato koeffitsienti | 2.10 | ta'minotchi — mato «ikki qavat» bo'lib sotiladimi |
| Plisse mato koeffitsienti | 1.06 yoki 2.0+ | ta'minotchi — burmalangan yoki yoyilgan |
| Val uzunligi ayirmasi | 0.02 m | usta |
| Lamel eni (vertikal) | 0.089 / 0.127 m | ta'minotchi |
| Lamel qadami (gorizontal) | 0.022 / 0.044 m | ta'minotchi |
| Rim burmasi | 0.25 m | usta / mijoz didi |
| Kronshteyn oralig'i | 1.00–1.50 m | usta |
