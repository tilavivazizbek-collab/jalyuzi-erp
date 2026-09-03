# Hisobotlar va panel — qanday bo'lishi kerak

Bu hujjat TZ emas — u ustida ishlash uchun materiallar to'plami. TZ 11-bo'limga
(Hisobotlar va dashboard) kiritish oldidan tasdiqlash uchun yozilgan.

---

## 1. Umumiy mantiq — panel qanday tuziladi

**Savol:** Bu ekranni har kuni ochadigan odam birinchi nimani qidiradi?
Javob odatda ikkita narsa bo'ladi: **"hozir muammo bormi"** va **"pul/holat qayerda"**.

### Uch qatorli tuzilma

| Qator | Savol | Xarakteri |
|---|---|---|
| **Holat** | Hozir nima bor? | Statik, joriy holat |
| **Davr** | Bu oy/hafta nima o'zgardi? | Dinamika, taqqoslash bilan |
| **Diqqat** | Nimaga hozir harakat kerak? | Yagona **actionable** qator — bosilsa ro'yxat ochiladi |

### Qat'iy qoida — panelga nima chiqmaydi

Agar raqamni ko'rib **shu zahoti biror amal qilinmasa** (qo'ng'iroq qilish,
buyurtma berish, tekshirish) — u panelda emas, batafsil hisobotda turadi.
Masalan "mahsulot turi bo'yicha taqsimot" — tahlil, harakat talab qilmaydi,
shuning uchun panelda emas, 11.7 kabi batafsil hisobotda qoladi.

### 5 karta bo'lsa — tartib qoidasi

Eng "yong'in" (qizil/sariq, hozir muammo bor) narsa birinchi, sof holat
ma'lumoti oxirida — chunki ko'z chapdan o'ngga yuradi.

**Har kartaga taqqoslash qo'shilsa yaxshi** — "62 mln" emas, "62 mln
(o'tgan oyga nisbatan ↑8%)". Xom raqam ma'nosiz, taqqoslash ma'no beradi.

---

## 2. Chart tanlash qoidalari

Chartlar **panelga emas**, batafsil hisobot sahifalariga tegishli. Har
hisobotda bitta asosiy chart, ikkinchi darajali ma'lumot jadvalda qoladi.

| Ma'lumot turi | Chart | Nega |
|---|---|---|
| Ko'p element, qiymat bo'yicha solishtirish | Gorizontal bar (kamayish tartibida) | Nomlar sig'adi, o'qiladi |
| Bir necha komponent, umumiy yig'indi | Stacked bar | Nisbat va yig'indi birga ko'rinadi |
| Ikki toifa nisbati | Donut | Bar ortiqcha bo'ladi |
| Vaqt bo'yicha trend | Line chart | Yo'nalish ko'rinadi |
| Chegaraga nisbatan holat | Bar + target line / gauge | "Qizil zonaga yaqinlashyapti" tuyg'usi |
| 80/20 tahlil | Pareto chart (bar + kumulyativ %) | Standart ko'rinish |
| Ikki o'lchamli guruhlash | Scatter | Uch o'lchamni (X, Y, nuqta hajmi) bitta chartda ko'rsatadi |

**Chart qo'ymaslik kerak bo'lgan holatlar:** ro'yxat (harakat kerak bo'lganda),
bitta yig'ma raqam, individual kartochka darajasidagi ko'rsatkich, kam sonli
(2–5) pozitsiya.

---

## 3. OMBOR

### 3.1. 20 ta statistika

| № | Statistika | Holati |
|---|---|---|
| 1 | Qoldiq va uning qiymati (material kesimida) | MAVJUD — 11.7.1 |
| 2 | Material harakati — kirim, sarf, chiqindi, brak | MAVJUD — 11.7.2 |
| 3 | Kam qolgan va tugagan materiallar | MAVJUD — 11.7.3 |
| 4 | Chiqindi va brak — material va sabab kesimida | MAVJUD — 11.7.4 |
| 5 | Ustama eroziyasi (tannarx vs sotuv narxi) | MAVJUD — 11.7.5 |
| 6 | Muzlab qolgan pul (ostatka + sotilmagan + 6 oy qimirlamagan) | MAVJUD — 11.7.6 |
| 7 | Ostatka turgan holda rulon ochilgan holatlar | MAVJUD — 11.7.7 |
| 8 | Yetishmayotgan materiallar — nechta buyurtmani to'xtatib turibdi | MAVJUD — 15.2 |
| 9 | Xarid ro'yxati | MAVJUD — 15.3 |
| 10 | Inventarizatsiya farqlari | MAVJUD — 15.1 |
| 11 | Narx dinamikasi | MAVJUD — 11.9.1 |
| 12 | Sotilmagan tayyor mahsulot ro'yxati | MAVJUD — 7.12 |
| 13 | **Sarflanish tezligi** — o'rtacha kunlik/oylik | YANGI |
| 14 | **Tugash muddati bashorati** — joriy tezlikda "necha kunda tugaydi" | YANGI |
| 15 | **Joriy qoldiqdan potentsial tushum** | YANGI |
| 16 | **Aylanish koeffitsienti (turnover)** | YANGI |
| 17 | **ABC tahlil — ombor uchun** | YANGI |
| 18 | **Eng sekin harakatlanuvchi materiallar (top-10)** | YANGI |
| 19 | **7.12 — necha kunda sotiladi bashorati** | YANGI |
| 20 | **7.12 — taxminiy tushum** | YANGI |

**Eng muhimi:** 13–14 (sarflanish tezligi → tugash bashorati) — boshqa
bo'limlardagi bashorat mantig'ining ombordagi ko'rinishi.

### 3.2. Chart mosligi

| № | Statistika | Chart |
|---|---|---|
| 1 | Qoldiq va qiymati | Gorizontal bar |
| 2 | Material harakati | Stacked bar |
| 5 | Ustama eroziyasi | Bar + chegara chizig'i |
| 6 | Muzlab qolgan pul | Donut (3 bo'lak) |
| 11 | Narx dinamikasi | Line chart |
| 13 | Sarflanish tezligi | Bar |
| 14 | Tugash muddati bashorati | Gauge / progress bar |
| 16 | Aylanish koeffitsienti | Bar |
| 17 | ABC tahlil | Pareto chart |
| 18 | Eng sekin harakatlanuvchi | Gorizontal bar |
| 19–20 | 7.12 qachon/qancha sotiladi | Jadval (chart shart emas, kam sonli) |

### 3.3. Qo'shimcha nomzodlar (muhokama qilingan, hali qaror qilinmagan)

| Nomzod | Izoh |
|---|---|
| Ostatka turgan holda rulon ochilgan holatlar bo'yicha alohida "diqqat" kartasi | Panelga qo'shilishi mumkin, hozircha 11.7.7 da hisobot sifatida bor |
| Inventarizatsiya muddati — "uzoq sanalmagan: N material" | Panelga nomzod, hozircha faqat kartochkada bor (15.1) |

---

## 4. MIJOZLAR

### 4.1. 20 ta statistika

| № | Statistika | Holati |
|---|---|---|
| 1 | Yangi / takroriy / uxlab qolgan mijozlar | MAVJUD — 11.6.1 |
| 2 | O'rtacha chek va xarid chastotasi | MAVJUD — 11.6.1 |
| 3 | ABC tahlil — tushumning 80% qaysi mijozlardan | MAVJUD — 11.6.2 |
| 4 | Debitorlik — qarz yoshi bo'yicha (0-30/30-60/60-90/90+) | MAVJUD — 11.4.5 |
| 5 | Limitdan oshgan mijozlar | MAVJUD — 11.3, 11.11 |
| 6 | Muddati o'tgan qarz | MAVJUD — 11.11 |
| 7 | Umidsiz qarz | MAVJUD — 6.10, 11.4.1 |
| 8 | Telegramsiz mijozlar | MAVJUD — 11.11 |
| 9 | Eng ko'p olgan mahsulot turi (kartochka darajasida) | MAVJUD — 6.7 |
| 10 | Qaytarishlar soni (kartochka darajasida) | MAVJUD — 6.7 |
| 11 | **LTV — umr davomidagi umumiy xarid** | YANGI |
| 12 | **"Uxlab qolish xavfi" bashorati** | YANGI |
| 13 | **Kelgusi oyda kutilayotgan to'lov** | YANGI |
| 14 | **RFM segmentatsiya** (Recency/Frequency/Monetary) | YANGI |
| 15 | **VIP bo'lishga yaqin mijozlar** | YANGI |
| 16 | **Offset (chegirma) ta'siri** — umrida qancha "yo'qotilgan" tushum | YANGI |
| 17 | **Birinchi xariddan keyin qaytish foizi (retention)** | YANGI |
| 18 | **B2B vs oddiy mijoz** — soni va ulushi | YANGI |
| 19 | **Sinab ko'rmagan mahsulot turlari (cross-sell)** | YANGI |
| 20 | **Qarz undirish tezligi** — sotuvchi kesimida | YANGI |

**Eng muhimi:** 11 (LTV) va 14 (RFM) — meta-ko'rsatkich, boshqa ko'p alohida
hisobotga ehtiyojni kamaytiradi.

### 4.2. Chart mosligi

| № | Statistika | Chart |
|---|---|---|
| 1 | Yangi/takroriy/uxlab qolgan | Stacked bar, oylik |
| 3 | ABC tahlil | Pareto chart |
| 4 | Debitorlik yosh guruhlari | Stacked bar (yashildan qizilga) |
| 11 | LTV | Gorizontal bar, top-15 |
| 12 | Uxlab qolish xavfi | Gauge / progress |
| 13 | Kelgusi oy kutilayotgan to'lov | Bar, hafta bo'yicha |
| 14 | RFM segmentatsiya | Stacked bar (tavsiya) yoki scatter |
| 17 | Retention | Line chart, kohort bo'yicha |
| 18 | B2B vs oddiy | Donut |
| 20 | Qarz undirish tezligi | Bar, sotuvchi kesimida |

**Chart qo'ymaydiganlar:** 5, 6, 8, 9, 10, 15, 16, 19 — ro'yxat yoki bitta
raqam, jadvalda qoladi.

### 4.3. Qo'shimcha nomzodlar

| № | Nomzod | Holati |
|---|---|---|
| 21 | Sotuvchiga bog'lanish (loyalty) — mijoz odatda qaysi sotuvchidan xarid qiladi | Tavsiya etiladi qo'shishga |
| 22 | Qaytarish bilan "uxlab qolish" bog'liqligi | OCHIQ — kam sonli holatda ishonchsiz |
| 23 | Birga sotiladigan mahsulot turlari (cross-sell signali) | OCHIQ — hisoblash og'ir |
| 24 | Hudud/tuman bo'yicha tushum zichligi | OCHIQ — manzil maydoni standartlashtirilmagan |
| 25 | Eslatma qo'yilgandan keyin natija (7 kunda xarid qildimi) | Tavsiya etiladi qo'shishga |

---

## 5. BUYURTMALAR

### 5.1. 20 ta statistika

| № | Statistika | Holati |
|---|---|---|
| 1 | Sotuv dinamikasi | MAVJUD — 11.5.1 |
| 2 | Mahsulot turi bo'yicha foyda va rentabellik | MAVJUD — 11.5.2 |
| 3 | Sotuvchi bo'yicha statistikasi | MAVJUD — 11.5.3 |
| 4 | Chegirmalar | MAVJUD — 11.5.4 |
| 5 | Qaytarish va rad etish — sabab kesimida | MAVJUD — 11.5.5 |
| 6 | Sotuvchi erkinliklari | MAVJUD — 11.5.6 |
| 7 | Usta unumdorligi | MAVJUD — 11.8.1 |
| 8 | Ishlab chiqarish braki | MAVJUD — 11.8.2 |
| 9 | Kechikkan buyurtmalar | MAVJUD — 11.8.3 |
| 10 | Navbat holati | MAVJUD — 11.8.4 |
| 11 | **Lead time — buyurtmadan topshirishgacha o'rtacha vaqt** | YANGI |
| 12 | **Mahsulot turi bo'yicha tayyorlanish tezligi** | YANGI |
| 13 | **O'rtacha pozitsiya soni (basket size)** | YANGI |
| 14 | **Manba bo'yicha konversiya (bot vs sayt)** | YANGI |
| 15 | **Qisman topshirish chastotasi** | YANGI |
| 16 | **Bekor qilish tendensiyasi** — vaqt bo'yicha | YANGI |
| 17 | **Storno statistikasi — sotuvchi kesimida** | YANGI |
| 18 | **"Tayyor, olinmagan" kutish vaqti** | YANGI |
| 19 | **Bashorat — yangi buyurtma qachon tayyor bo'ladi** | YANGI |
| 20 | **Mavsumiylik** — kun/oy bo'yicha buyurtma zichligi | YANGI |

**Eng muhimi:** 18 (tayyor-olinmagan kutish) — 11.7.6 dagi "muzlab qolgan
pul"ning manbasi, ikkalasi bog'lanishi kerak. 19 (bashorat) — Ombor va
Mijozlardagi bashorat mantig'ining shu yerdagi ko'rinishi.

### 5.2. Chart mosligi

| № | Statistika | Chart |
|---|---|---|
| 1 | Sotuv dinamikasi | Line chart, o'tgan davr ustiga qo'yilgan ikkinchi chiziq bilan |
| 2 | Mahsulot turi bo'yicha foyda | Scatter — X: soni, Y: rentabellik %, nuqta hajmi: umumiy foyda |
| 3 | Sotuvchi bo'yicha | Gorizontal bar (tushum), o'rtacha chek jadval ustunida qoladi |
| 4 | Chegirmalar | Bar, sotuvchi kesimida + limit chizig'i |
| 5 | Qaytarish va rad etish | Pareto chart — sabablar bo'yicha |
| 7 | Usta unumdorligi | Gorizontal bar, mahsulot turi bo'yicha stacked |
| 8 | Ishlab chiqarish braki | Bar + o'rtacha chizig'i, usta kesimida |
| 9 | Kechikkan buyurtmalar | Gorizontal bar, kechikish kunlari bo'yicha saralangan |
| 10 | Navbat holati | Gorizontal bar — mahsulot turi bo'yicha o'rtacha kutish |
| 11 | Lead time | Line chart (oylik trend) + maqsad chizig'i |
| 12 | Tayyorlanish tezligi | Gorizontal bar, mahsulot turi kesimida |
| 16 | Bekor qilish tendensiyasi | Line chart |
| 18 | "Tayyor, olinmagan" kutish | Stacked bar — yosh guruhlari (0–7 / 7–30 / 30+ kun) |
| 20 | Mavsumiylik | Heatmap (hafta kuni × oy) yoki oylik bar |

**Chart qo'ymaydiganlar:** 6, 13, 14, 15, 17, 19 — jadval yoki bitta raqam.

> 6 (sotuvchi erkinliklari) ataylab jadval bo'lib qoladi. U taqqoslash uchun
> yozilgan, chartga aylantirilsa reyting ko'rinishini oladi — 11.5.6 dagi
> "ayblov emas, farq ko'rinib tursin" qoidasiga zid.

> 10 va 12 bir-biriga yaqin, lekin bitta emas: 10 — pozitsiya navbatda
> **kutgan** vaqt, 12 — usta olganidan keyin **ishlagan** vaqt. Ikkalasi
> qo'shilsa 11 (lead time) chiqadi, shuning uchun uchalasi bitta sahifada
> turishi mantiqli.

### 5.3. Qo'shimcha nomzodlar

| № | Nomzod | Holati |
|---|---|---|
| 21 | Qayta kesish so'rovi chastotasi — usta kesimida, tasdiqlanmagan brakdan oldingi bosqich | Tavsiya etiladi qo'shishga |
| 22 | Sifat muammosi (8.11) statistikasi alohida filtr sifatida | 11.5.5 ga filtr qo'shish, yangi hisobot emas |
| 23 | Mijoz bo'yicha bekor qilish/rad etish chastotasi | OCHIQ — mijozlar moduli bilan kesishadi |
| 24 | Usta punktualligi — tayyorlik sanasiga nisbatan oldin/kech | Tavsiya etiladi qo'shishga |
| 25 | Kunlik ishlab chiqarish tezligi trendi | OCHIQ — 11.8.1 bilan qisman ustma-ust |

---

## 6. YETKAZIB BERUVCHILAR

### 6.1. 20 ta statistika

| № | Statistika | Holati |
|---|---|---|
| 1 | Kreditorlik — qarzimiz, avansdagilar alohida | MAVJUD — 11.4.6 |
| 2 | Narx dinamikasi | MAVJUD — 9.8, 11.9.1 |
| 3 | Panel: jami qarzimiz, avansdagilar | MAVJUD — 11.11 |
| 4 | Panel: kirim summasi, o'rtacha brak % | MAVJUD — 11.11 |
| 5 | Panel: muddati o'tgan to'lov, muddati yaqin, ochiq da'vo | MAVJUD — 11.11 |
| 6 | Kartochka — jami kirim, hujjatlar soni, brak ulushi | MAVJUD — 9.7 |
| 7 | Narx tarixi — oxirgi uch kirim narxi | MAVJUD — 9.8 |
| 8 | Xarid ro'yxati — yetkazib beruvchi kesimida | MAVJUD — 15.3 |
| 9 | **Yetkazib beruvchi reytingi** (narx barqarorligi + brak% + muddat) | YANGI |
| 10 | **Bir material — bir nechta ta'minotchi solishtiruvi** | YANGI |
| 11 | **Bizning to'lov intizomimiz** — o'rtacha necha kunda to'laymiz | YANGI |
| 12 | **Kurs farqi — yetkazib beruvchi kesimida** | YANGI |
| 13 | **Yakka ta'minotchiga bog'liqlik (concentration risk)** | YANGI |
| 14 | **Avans "eskirishi"** — necha kundan beri mol kutilmoqda | YANGI |
| 15 | **Kirim hujjatiga keyin qo'shilgan xarajatlar** — ta'minotchi kesimida | YANGI |
| 16 | **Ochiq da'volar yechilish tezligi** | YANGI |
| 17 | **Umidsiz qarzga aylangan holatlar** — tarixiy | YANGI |
| 18 | **Narx mavsumiyligi** | YANGI |
| 19 | **Bashorat — keyingi xarid qachon kerak** | YANGI |
| 20 | **Ta'minotchining buyurtmalarga ta'siri** — kechikish qancha buyurtmani ushlab turgan | YANGI |

**Eng muhimi:** 13 (yakka ta'minotchiga bog'liqlik) — erta ogohlantirish,
boshqa hech qaysi hisobotda yo'q. 9 (reyting) — boshqa bo'limlardagi
meta-ko'rsatkich mantig'ining shu yerdagi ko'rinishi.

### 6.2. Chart mosligi

| № | Statistika | Chart |
|---|---|---|
| 1 | Kreditorlik | Stacked bar — to'lov muddati guruhlari bo'yicha, avans alohida rangda |
| 2 | Narx dinamikasi | Line chart — bitta material, har ta'minotchi alohida chiziq |
| 4 | O'rtacha brak % | Bar + chegara chizig'i, ta'minotchi kesimida |
| 9 | Ta'minotchi reytingi | Gorizontal bar (umumiy ball); bitta ta'minotchi ichida radar (3 o'lchov) |
| 10 | Bir material — bir nechta ta'minotchi | Grouped bar — X: ta'minotchi, Y: oxirgi kirim narxi |
| 11 | To'lov intizomimiz | Bar — o'rtacha kun, kelishilgan muddat chizig'i bilan |
| 12 | Kurs farqi | Stacked bar — xarajat va daromad **alohida**, netto ko'rsatilmaydi |
| 13 | Yakka ta'minotchiga bog'liqlik | Gorizontal bar — material bo'yicha eng katta ta'minotchi ulushi |
| 14 | Avans eskirishi | Gorizontal bar — kutish kunlari bo'yicha saralangan |
| 16 | Da'volar yechilish tezligi | Line chart — oylik o'rtacha kun |
| 18 | Narx mavsumiyligi | Line chart, yillar ustma-ust qo'yilgan |
| 20 | Buyurtmalarga ta'siri | Gorizontal bar — to'xtab turgan buyurtma soni |

**Chart qo'ymaydiganlar:** 3, 5, 6, 7, 8, 15, 17, 19 — panel raqami, kartochka
ko'rsatkichi yoki ro'yxat.

> 12 uchun eslatma: 11.4.7 kurs farqini xarajat va daromad **alohida
> qatorlarda** talab qiladi. Chart ham shu qoidaga bo'ysunadi — netto bitta
> ustun qilib chizilmaydi.

> 13 uchun donut emas, bar tanlandi: donut jami tushumdagi ulushni ko'rsatadi,
> lekin xavf **material darajasida** tug'iladi — arzon material bitta
> ta'minotchida bo'lsa ham ishlab chiqarish to'xtaydi.

---

## 7. XODIMLAR

TZ 10-bo'lim (Xodimlar va ish haqi) hamda 11.8 (ishlab chiqarish hisobotlari)
asosida. Bu bo'lim ikki tomonlama: bir tomoni **pul** (balans, ish haqi),
ikkinchi tomoni **unumdorlik** (kim qancha ish qildi).

### 7.1. 20 ta statistika

| № | Statistika | Holati |
|---|---|---|
| 1 | Panel: xodim soni · jami balans · manfiy balansdagilar | MAVJUD — 11.11 |
| 2 | Panel: hisoblangan haq · to'langan · brak ushlanmalari | MAVJUD — 11.11 |
| 3 | Panel diqqat: manfiy balans · uzoq to'lanmagan · bot ulanmagan · stavkasiz bajarilgan ish | MAVJUD — 11.11 |
| 4 | Usta unumdorligi — pozitsiya soni, haq, o'rtacha kunlik, mahsulot turi kesimida | MAVJUD — 11.8.1 |
| 5 | Ishlab chiqarish braki — usta kesimida, zarar va ushlangan summa | MAVJUD — 11.8.2 |
| 6 | Kartochka — balans bloki (joriy, jami ishlagan, jami olgan, oxirgi to'lov) | MAVJUD — 10.16 |
| 7 | Kartochka — ish bloki (bu oy bajargan, o'rtacha kunlik, brak, eng ko'p yasagan tur) | MAVJUD — 10.16 |
| 8 | Ish haqi — foyda-zarardagi xarajat moddasi, hisoblangan payt bo'yicha | MAVJUD — 11.4.1 |
| 9 | Stavkasi belgilanmagan turlar — haq 0 hisoblangan ishlar | MAVJUD — 10.12 |
| 10 | Balansni qo'lda tuzatish — sabab kesimida | MAVJUD — 10.14 (audit jurnalida) |
| 11 | **Ish haqi tannarxdagi ulushi** — mahsulot turi bo'yicha stavka / sotuv narxi | YANGI |
| 12 | **Xodim rentabelligi** — keltirgan foyda vs olgan haq | YANGI |
| 13 | **Avans yuki** — jami manfiy balans va uning yoshi | YANGI |
| 14 | **Balans aylanishi** — hisoblangandan to'langungacha o'rtacha kun | YANGI |
| 15 | **Qo'lda tuzatish chastotasi** — kim, qancha marta, qaysi sabab bilan | YANGI |
| 16 | **Usta bandligi** — ish bo'lgan kunlar / kalendar kunlar | YANGI |
| 17 | **Brak tendensiyasi** — usta kesimida vaqt bo'yicha (o'rganish egri chizig'i) | YANGI |
| 18 | **KPI foizi natijasi** — hisoblangan foiz va u qaysi tushumdan kelgani | YANGI |
| 19 | **Bashorat — oy oxirida ish haqi fondi qancha bo'ladi** | YANGI |
| 20 | **Xodim reytingi** (unumdorlik + brak% + punktuallik) | YANGI |

**Eng muhimi:** 11 (ish haqi tannarxdagi ulushi) — 11.5.2 dagi rentabellik
bilan bevosita bog'liq: stavka ko'tarilganda qaysi mahsulot zarar keltira
boshlashi faqat shu yerda ko'rinadi. 12 (xodim rentabelligi) — bu bo'limning
meta-ko'rsatkichi.

> **Ehtiyot bo'lish kerak bo'lgan joy.** 12 va 20 — odam haqidagi hisobot.
> 11.5.6 dagi qoida shu yerda ham amal qiladi: *ayblov emas, farq ko'rinib
> tursin*. Raqam ko'rsatiladi, "yomon xodim" degan yorliq tizimdan chiqmaydi.

> **10.10 ga bog'liqlik.** Haq "Tugatdim" bosilgan payt hisoblanadi va stavka
> o'sha paytda snapshot qilinadi (2.3-invariant). Demak 11, 12 va 19 ham
> **o'sha paytdagi stavka** bilan hisoblanadi — bugungi stavka bilan qayta
> sanalmaydi. Aks holda o'tgan oyning raqami har stavka o'zgarishida siljiydi.

### 7.2. Chart mosligi

| № | Statistika | Chart |
|---|---|---|
| 4 | Usta unumdorligi | Gorizontal bar, mahsulot turi bo'yicha stacked |
| 5 | Ishlab chiqarish braki | Bar + o'rtacha chizig'i |
| 11 | Ish haqi tannarxdagi ulushi | Bar + chegara chizig'i, mahsulot turi kesimida |
| 12 | Xodim rentabelligi | Scatter — X: olgan haq, Y: keltirgan foyda |
| 13 | Avans yuki | Stacked bar — yosh guruhlari bo'yicha |
| 14 | Balans aylanishi | Bar, xodim kesimida |
| 16 | Usta bandligi | Heatmap (xodim × kun) yoki oddiy bar |
| 17 | Brak tendensiyasi | Line chart — usta bo'yicha bir nechta chiziq |
| 19 | Ish haqi fondi bashorati | Line chart — joriy oy fakti + oy oxirigacha proyeksiya |
| 20 | Xodim reytingi | Gorizontal bar; bitta xodim ichida radar (3 o'lchov) |

**Chart qo'ymaydiganlar:** 1, 2, 3, 6, 7, 8, 9, 10, 15, 18 — panel raqami,
kartochka ko'rsatkichi yoki ro'yxat.

> 15 (qo'lda tuzatish) ataylab jadval bo'lib qoladi — u tekshirish uchun va
> har qatorda 10.14 talab qiladigan majburiy izoh o'qilishi kerak.

> 13 (avans yuki) valyuta bo'yicha ikkiga bo'linadi: 10.5 ga ko'ra balans
> qaysi valyutada hisoblangan bo'lsa o'shanda turadi, 1.3-band esa
> qo'shishni taqiqlaydi. Ya'ni bitta chart emas, ikkita — so'm va dollar.

### 7.3. Qo'shimcha nomzodlar

| № | Nomzod | Holati |
|---|---|---|
| 21 | Rol bo'yicha kesim (bir odamda bir nechta rol — 10.3) | OCHIQ — bitta odam ikki guruhda ikki marta chiqadi, qo'sh sanash xavfi |
| 22 | Alohida stavkadagilar ro'yxati (10.9) — kimga qaysi tur bo'yicha istisno berilgan | Tavsiya etiladi qo'shishga — hozir yig'ma ko'rinishi yo'q |
| 23 | Ishdan bo'shaganda hisobdan chiqarilgan manfiy balans (10.4) — tarixiy | Tavsiya etiladi qo'shishga; kam uchraydi, lekin xarajat |
| 24 | Bir ishni ikki usta bajargan holatlar (10.11) — qo'lda summa kiritilganlar | OCHIQ — 15 (qo'lda tuzatish) ichida sabab bo'lib chiqadi, alohida kerakmi? |
| 25 | Navbatdan ish olish tezligi — usta pozitsiyani qancha vaqtda oladi | OCHIQ — 11.8.4 bilan qisman ustma-ust |

---

## 8. KASSA

TZ 12-bo'lim asosida. Bu bo'limning boshqalardan farqi: bu yerda **bashorat
ikkinchi darajali**, birinchi o'rinda **nazorat** turadi — pul joyidami, kim
ushlab turibdi, farq bormi.

### 8.1. 20 ta statistika

| № | Statistika | Holati |
|---|---|---|
| 1 | Qoldiq: naqd so'm · naqd dollar · karta · admin jami | MAVJUD — 12.16 |
| 2 | Sotuvchilardagi pul — har biri alohida, admin summasiga qo'shilmaydi | MAVJUD — 12.16 |
| 3 | Bugungi kirim / chiqim / farq, naqd-karta taqsimoti bilan | MAVJUD — 12.16 |
| 4 | Diqqat: tasdiqlanmagan topshiriq · yopilmagan kun · uzoq turgan pul · muddati o'tgan to'lov · chekssiz xarajat | MAVJUD — 12.16 |
| 5 | Kassa oqimi — turi va usuli kesimida, boshlang'ich va yakuniy qoldiq | MAVJUD — 11.4.2 |
| 6 | Kun yopish farqlari — sotuvchi kesimida | MAVJUD — 12.17 |
| 7 | Kassa kitobi — yuguruvchi qoldiq bilan | MAVJUD — 12.18 |
| 8 | Ixtiyoriy sanaga kesim ("1-avgust 18:00 da qancha edi") | MAVJUD — 12.18 |
| 9 | Chekssiz xarajatlar — oylik summa | MAVJUD — 12.19 |
| 10 | Operatsion xarajatlar — modda kesimida | MAVJUD — 11.4.4, 12.10 |
| 11 | **Yaxlitlash jami** — davr bo'yicha, sotuvchi kesimida | YANGI |
| 12 | **Storno statistikasi** — kim, nechta, qaysi sabab bilan | YANGI |
| 13 | **Qo'lda kiritilgan yozuvlar ulushi** — jami yozuvlarga nisbatan % | YANGI |
| 14 | **Topshiriq kechikishi** — sotuvchi pulni o'rtacha necha kunda topshiradi | YANGI |
| 15 | **Kun yopish intizomi** — yopilgan kunlar / ish kunlari, sotuvchi kesimida | YANGI |
| 16 | **Ayirboshlash statistikasi** — hajm va o'rtacha kurs, davr o'rtachasiga nisbatan | YANGI |
| 17 | **Egasi olgan pul** — davr bo'yicha, foydaga nisbatan ulush | YANGI |
| 18 | **Naqd zichligi** — haftaning qaysi kuni kassada eng ko'p pul turadi | YANGI |
| 19 | **Bashorat — oy oxirigacha kassa oqimi** | YANGI |
| 20 | **Takroriy xarajatlar bajarilishi** — shablon bo'yicha qaysi oy o'tkazib yuborilgan | YANGI |

**Eng muhimi:** 13 (qo'lda kiritilgan yozuvlar ulushi) va 12 (storno) —
ikkalasi 12.18 dagi "eng kerakli ikki filtr"ning yig'ma ko'rinishi. Ulush
o'sib borsa, demak biror modul kassaga to'g'ri yozmayapti va odamlar qo'lda
tuzatib turibdi. 19 (bashorat) — Mijozlardagi 13-band (kutilayotgan to'lov)
va Yetkazib beruvchilardagi to'lov muddatlarining kassadagi birlashuvi.

> **Nomzod bo'lmagan narsalar.** 12.12 dagi "kassaga tegmaydigan hodisalar"
> ro'yxatidan hech biri bu yerga statistika bo'lib chiqmaydi — chegirma,
> qarzga sotish, ushlab qolingan summa va boshqalar o'z modullarida
> hisoblanadi. Aks holda bir xil pul ikki bo'limda ko'rinadi (12.1).

> **17 (egasi olgan pul) qaysi bo'limga tegishli.** 12.11 ga ko'ra bu xarajat
> emas — foydaga ta'sir qilmaydi. Shuning uchun u foyda-zararda emas, faqat
> shu yerda va kassa oqimida ko'rinadi. "Foydaga nisbatan ulush" — taqqoslash
> uchun, xarajat qatori sifatida emas.

### 8.2. Chart mosligi

| № | Statistika | Chart |
|---|---|---|
| 1 | Qoldiq | Chart yo'q — raqamlar paneli, valyutalar qo'shilmaydi (1.3) |
| 3 | Bugungi kirim/chiqim | Chart yo'q — uchta raqam |
| 5 | Kassa oqimi | Waterfall: boshlang'ich → kirimlar → chiqimlar → yakuniy |
| 6 | Kun yopish farqlari | Bar — nol chizig'idan ikki tomonga, sotuvchi kesimida |
| 7 | Kassa kitobi | Line chart — yuguruvchi qoldiq vaqt bo'yicha |
| 10 | Operatsion xarajatlar | Pareto chart — moddalar bo'yicha |
| 11 | Yaxlitlash | Bar, sotuvchi kesimida |
| 13 | Qo'lda kiritilgan ulush | Line chart — oylik trend (o'sish signali) |
| 14 | Topshiriq kechikishi | Bar + 3 kun chegara chizig'i (12.16 dagi diqqat mezoni) |
| 15 | Kun yopish intizomi | Heatmap (sotuvchi × kun) — yopilgan / yopilmagan |
| 16 | Ayirboshlash | Line chart — bizning kurs va davr o'rtachasi |
| 18 | Naqd zichligi | Bar, hafta kuni bo'yicha |
| 19 | Kassa oqimi bashorati | Line chart — fakt va proyeksiya ikki xil chiziqda |

**Chart qo'ymaydiganlar:** 2, 4, 8, 9, 12, 17, 20 — ro'yxat, panel raqami
yoki bitta summa.

> 7 (yuguruvchi qoldiq chizig'i) alohida foydali: farq izlashda "qaysi kuni
> tushib ketdi" savoliga jadvaldan tezroq javob beradi. Lekin chart jadval
> o'rnini bosmaydi — 12.18 dagi ustunlar va manba havolalari qoladi.

> 5 (waterfall) bu hujjatda birinchi marta uchraydigan chart turi. Kassa
> oqimi uchun u stacked bardan yaxshi, chunki "qayerdan kelib qayerga ketdi"
> ketma-ketligini ko'rsatadi. Agar bitta chart turini kamaytirish kerak
> bo'lsa — stacked bar ham yetadi.

### 8.3. Qo'shimcha nomzodlar

| № | Nomzod | Holati |
|---|---|---|
| 21 | Kunni qayta ochish holatlari (12.17) — kim, necha marta, sabab bilan | Tavsiya etiladi qo'shishga — audit jurnalida bor, yig'masi yo'q |
| 22 | Kassa bo'yicha kesim (admin vs har sotuvchi) barcha kassa hisobotlariga | Yangi hisobot emas, umumiy filtr |
| 23 | Manba turi bo'yicha yozuvlar taqsimoti (12.3) | OCHIQ — texnik ko'rsatkich, biznes qiymati past |
| 24 | Karta va naqd nisbati trendi | Tavsiya etiladi qo'shishga — sodda, bank bilan ishlashda kerak |
| 25 | Sotuvchida turgan pulning maksimal chegarasi — oshgan holatlar | OCHIQ — TZ da bunday chegara yo'q, avval qaror kerak |

---

## 9. Umumiy naqsh — barcha bo'limlarda takrorlangan

Har bo'limda bitta xil turdagi "YANGI" band takrorlanadi — **bashorat**:

| Bo'lim | Bashorat turi |
|---|---|
| Ombor | Material qachon tugaydi (sarflanish tezligidan) |
| Mijozlar | Kelgusi oyda qancha to'lov kutilmoqda |
| Buyurtmalar | Yangi buyurtma qachon tayyor bo'ladi |
| Yetkazib beruvchilar | Keyingi xarid qachon kerak bo'ladi |
| Xodimlar | Oy oxirida ish haqi fondi qancha bo'ladi |
| Kassa | Oy oxirigacha kassa oqimi |

Va bitta xil turdagi **meta-ko'rsatkich** (bir nechta alohida raqamni
birlashtirib bitta ball/segment qilish):

| Bo'lim | Meta-ko'rsatkich |
|---|---|
| Ombor | ABC tahlil |
| Mijozlar | RFM segmentatsiya, LTV |
| Buyurtmalar | (hali aniq nomzod yo'q) |
| Yetkazib beruvchilar | Ta'minotchi reytingi |
| Xodimlar | Xodim reytingi, xodim rentabelligi |
| Kassa | (yo'q — bu bo'lim nazorat uchun, ball bermaydi) |

Bu ikkala naqsh TZ'ga yozilganda **bitta umumiy texnik yechim** (bashorat
mexanizmi, reyting hisoblash formulasi) barcha bo'limlarda qayta
ishlatilishi mumkin — har birida alohida yozilmasin.

### Uchinchi naqsh — "intizom" ko'rsatkichlari

Xodimlar va Kassa bo'limlari yozilganda ko'rindi: bir nechta hisobot natijani
emas, **odamning tizim bilan qanday ishlayotganini** o'lchaydi.

| Bo'lim | Intizom ko'rsatkichi |
|---|---|
| Buyurtmalar | Storno statistikasi; sotuvchi erkinliklari (11.5.6) |
| Yetkazib beruvchilar | Bizning to'lov intizomimiz |
| Xodimlar | Qo'lda tuzatish chastotasi |
| Kassa | Kun yopish intizomi; qo'lda kiritilgan yozuvlar ulushi; topshiriq kechikishi |

Uchtasi ham bir xil xususiyatga ega:

1. **Manba bitta** — audit jurnali (10-band, QISM 1). Ya'ni texnik yechim ham
   bitta bo'lishi mumkin: jurnalni hodisa turi va foydalanuvchi bo'yicha
   yig'adigan umumiy mexanizm.
2. **Qoida bitta** — 11.5.6: ayblov emas, farq ko'rinib tursin.
3. **Ruxsat bitta** — bularning hammasi faqat adminga ko'rinadi (11.10).

### To'rtinchi naqsh — valyuta

So'm va dollar hech qachon qo'shilmaydi (1.3). Bu quyidagilarga tegadi:
debitorlik (11.4.5), kreditorlik (11.4.6), xodim balansi (10.5), kassa
qoldig'i (12.2), avans yuki (§7.1 №13). Chart darajasida bu **ikkita chart
yoki ikkita ustun** degani — bitta ustunga yig'ilgan joy bo'lsa, u xato.

---

## 10. Qaror kutayotgan narsalar

- [ ] Har bo'limdagi 20 statistikadan qaysilari TZ 11-bo'limga rasman kiritiladi
- [ ] "YANGI" deb belgilanganlar qaysi tartibda ishlab chiqiladi (ustuvorlik)
- [ ] Bashorat mexanizmi — bitta umumiy texnik yondashuvmi, yoki har bo'limda alohidami
- [ ] Reyting formulasi — o'lchovlar vazni qat'iy kodda turadimi yoki sozlamada
- [ ] Intizom ko'rsatkichlari (§9) alohida hisobot bo'ladimi yoki har bo'lim ichida qoladimi
- [ ] Moliya (11.4) bo'yicha 20 statistika hali ko'rib chiqilmagan — Kassa bilan qisman kesishadi
- [ ] Ko'p filial (20.13) kesimi bu statistikalarga qanday qo'shiladi
- [ ] Chart kutubxonasi tanlanmagan — waterfall, radar, heatmap kabi turlar kerak bo'ladi

### Yopilgan bandlar

- ~~Buyurtmalar va Yetkazib beruvchilar uchun chart mosligi~~ — §5.2, §6.2
- ~~Xodimlar va Kassa bo'limlari umuman ko'rilmagan~~ — §7, §8
