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
