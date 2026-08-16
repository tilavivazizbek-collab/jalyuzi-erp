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
