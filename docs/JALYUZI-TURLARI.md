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

Chiziqli (`SM`) va dona (`DONA`) materiallarda koeffitsient
**umuman ishlamaydi** (`lib/domain/formula.ts` → `slotSarfi`) — ularda
hamma narsa formula matnida yoziladi.

---

## 2. Formula tilida nima bor

| Bor | Yo'q |
|---|---|
| `+` `−` `*` `/` va qavslar | `IF` / shart |
| `CEIL` `FLOOR` `ROUND` `MIN` `MAX` | `ABS`, qoldiq (`%`) |
| `ENI` `BO'YI` (sm), `MAYDON` (kv.sm), `SONI` | — |
| Mahsulot parametrlari (`QADAM`, `LAMEL_ENI`, …) | — |

⚠️ **Ayirish `MAX` bilan himoyalanadi.** `ENI - 2` formulasi kichik
enida manfiy chiqadi va tizim texnik xato beradi (`OLCHOV_NOTOGRI`),
tushunarli xabar emas. To'g'risi: `MAX(40, ENI - 2)`.

---

## 3. RULON (rollo)

**Parametrlar:** yo'q

| # | Slot | Birlik | Formula | Koeff | Kesish | Izoh |
|---|---|---|---|---|---|---|
| 1 | Mato | `KV_M` | `MAYDON` | **1.12** [Taxmin] | `BO'YIGA` | valga o'ralish + pastki buklama |
| 2 | Val (turba) | `SM` | `MAX(40, ENI - 2)` | — | — | [Taxmin] 2 sm, min 40 sm |
| 3 | Pastki planka | `SM` | `MAX(20, ENI - 2)` | — | — | |
| 4 | Zanjir | `SM` | `BO'YI * 2 + 30` | — | — | [CORE] halqa yopiq |
| 5 | Kronshteyn | `DONA` | `2` | — | — | [CORE] |

⚠️ Eni 250 sm dan oshsa uchinchi kronshteyn qo'yiladi:
`MAX(2, CEIL(ENI / 125))` [Taxmin — oraliqni usta aytadi].

---

## 4. KUN-TUN (zebra)

Rulondan farqi bitta: mato **ikki qavat**, shaffof va zich yo'llar
navbatlashadi.

| # | Slot | Birlik | Formula | Koeff | Kesish | Izoh |
|---|---|---|---|---|---|---|
| 1 | Mato | `KV_M` | `MAYDON` | **2.10** [Taxmin] | **`BO'YIGA`** | ⚠️ ikki qavat + zaxira |
| 2 | Val | `SM` | `MAX(40, ENI - 2)` | — | — | |
| 3 | Pastki planka | `SM` | `MAX(20, ENI - 2)` | — | — | |
| 4 | Zanjir | `SM` | `BO'YI * 2 + 30` | — | — | |
| 5 | Kronshteyn | `DONA` | `2` | — | — | |

⚠️ **Aynan shu yerda `BO'YIGA` hal qiluvchi.** `ENIGA` bo'lsa 180 sm
pardaga **3.78 m keng** rulon izlanadi — bunday rulon bozorda yo'q va
pozitsiya abadiy «Materialga kutmoqda»da qoladi.

---

## 5. VERTIKAL (dikkey)

**Parametrlar:** `LAMEL_ENI` = `8.9` yoki `12.7` [Taxmin]

⚠️ Barcha uzunlik **santimetrda** (TZ 5.3). 89 mm lamel → `LAMEL_ENI = 8.9`.

| # | Slot | Birlik | Formula | Koeff | Kesish | Izoh |
|---|---|---|---|---|---|---|
| 1 | Lamel (mato) | `KV_M` | `MAYDON` | **1.05** [Taxmin] | `BO'YIGA` | pastki buklama |
| 2 | Karniz-profil | `SM` | `ENI + 2` [Taxmin] | — | — | |
| 3 | Begunok | `DONA` | `CEIL(ENI / LAMEL_ENI)` | — | — | [CORE] lamel soniga teng |
| 4 | Ryzeg (gruzik) | `DONA` | `CEIL(ENI / LAMEL_ENI)` | — | — | [CORE] 1:1 |
| 5 | Pastki zanjircha | `SM` | `ENI + 10` | — | — | |
| 6 | Boshqaruv zanjiri | `SM` | `BO'YI * 2 + 25` | — | — | |
| 7 | Kronshteyn | `DONA` | `MAX(2, CEIL(ENI / 150))` | — | — | [Taxmin] |

⚠️ Lamel matosi rulondan **bo'y bo'ylab** kesiladi, har lamel alohida
tasma. Tizim uni bitta to'rtburchak deb biladi — bu to'g'ri, chunki
rulondan ochiladigan tasmaning umumiy uzunligi bir xil.

---

## 6. GORIZONTAL

**Parametrlar:** `QADAM` = `2.2` (25 mm lamel) yoki `4.4` (50 mm) [Taxmin]

⚠️ **Dastlabki xaritada bu tur teskari yozilgan edi.** Gorizontal
jalyuzida lamellar **bo'y bo'ylab taxlanadi**, eni bo'ylab emas:

```
lamel soni = CEIL(BO'YI ÷ QADAM)        ← eni emas, BO'YI
har lamel uzunligi = ENI
```

`CEIL(ENI ÷ LAMEL_ENI)` — bu **vertikal** uchun to'g'ri formula.

| # | Slot | Birlik | Formula | Koeff | Kesish | Izoh |
|---|---|---|---|---|---|---|
| 1 | Lamel | `SM` | `CEIL(BO'YI / QADAM) * ENI` | — | — | [CORE] jami chiziqli uzunlik |
| 2 | Karniz | `SM` | `ENI` | — | — | |
| 3 | Pastki planka | `SM` | `ENI` | — | — | |
| 4 | Ip-lesa (narvon) | `SM` | `CEIL(ENI / 60) * (BO'YI + 20)` | — | — | [Taxmin] har 60 sm ga 1 qator |
| 5 | Ko'taruvchi ip | `SM` | `CEIL(ENI / 60) * (BO'YI * 2 + ENI)` | — | — | [CORE] |
| 6 | Boshqaruv zanjiri | `SM` | `BO'YI * 2 + 25` | — | — | |
| 7 | Kronshteyn | `DONA` | `MAX(2, CEIL(ENI / 100))` | — | — | [Taxmin] |

Agar lamel **dona** bo'lib sotib olinsa (tayyor kesilgan), 1-slot:
birlik `DONA`, formula `CEIL(BO'YI / QADAM)`.

---

## 7. PLISSE

| # | Slot | Birlik | Formula | Koeff | Kesish | Izoh |
|---|---|---|---|---|---|---|
| 1 | Mato | `KV_M` | `MAYDON` | **1.06** [Taxmin] | `BO'YIGA` | plisse matosi oldindan burmalangan |
| 2 | Yuqori profil | `SM` | `ENI` | — | — | |
| 3 | Pastki profil | `SM` | `ENI` | — | — | |
| 4 | Yon profil | `SM` | `(BO'YI + 2) * 2` | — | — | [CORE] ikki tomon |
| 5 | Ip | `SM` | `CEIL(ENI / 50) * (BO'YI * 2 + 20)` | — | — | [Taxmin] har 50 sm ga 1 qator |
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
| 2 | Yuqori profil | `SM` | `ENI` | — | — | |
| 3 | Pastki profil | `SM` | `ENI` | — | — | |
| 4 | Yon profil | `SM` | `(BO'YI + 2) * 2` | — | — | |
| 5 | Ip | `SM` | `CEIL(ENI / 50) * (BO'YI * 2 + 20)` | — | — | [Taxmin] |
| 6 | Kronshteyn | `DONA` | `2` | — | — | |

---

## 9. RIM (rimskaya)

**Parametrlar:** `BURMA` = `25` — burmalar orasidagi masofa, sm [Taxmin]

| # | Slot | Birlik | Formula | Koeff | Kesish | Izoh |
|---|---|---|---|---|---|---|
| 1 | Mato | `KV_M` | `MAYDON` | **1.18** [Taxmin] | `BO'YIGA` | yon va pastki buklama |
| 2 | Karniz | `SM` | `ENI` | — | — | |
| 3 | Reyka | `SM` | `CEIL(BO'YI / BURMA) * ENI` | — | — | [CORE] har burmaga 1 reyka |
| 4 | Halqa | `DONA` | `CEIL(BO'YI / BURMA) * 3` | — | — | [Taxmin] 3 qator |
| 5 | Ko'taruvchi ip | `SM` | `(BO'YI * 2 + ENI) * 3` | — | — | [CORE] |
| 6 | Pastki og'irlik | `SM` | `ENI` | — | — | |
| 7 | Kronshteyn | `DONA` | `2` | — | — | |

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
(`(BO'YI + 2) * 2`), shuning uchun ular `Murakkab` bo'lib qoladi.
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

180 × 220 kun-tun, mato koeff 2.10, kesish `BO'YIGA`:

```
MAYDON        = 180 × 220 = 39 600 kv.sm
jami          = 39 600 × 2.10 = 83 160 kv.sm = 8.3160 kv.m
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
| Val uzunligi ayirmasi | 2 sm | usta |
| Lamel eni (vertikal) | 8.9 / 12.7 sm | ta'minotchi |
| Lamel qadami (gorizontal) | 2.2 / 4.4 sm | ta'minotchi |
| Rim burmasi | 25 sm | usta / mijoz didi |
| Kronshteyn oralig'i | 100–150 sm | usta |
