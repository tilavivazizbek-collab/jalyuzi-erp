# QABUL MEZONLARI

**Loyiha:** Jalyuzi ERP
**Maqsad:** "Ishlagandan keyin to'lov" shartnomasi uchun — **"ishlagan" nima ekanini** aniq belgilash

---

## 0. NEGA BU HUJJAT KERAK

Shartnoma: *"tizim ishlagandan keyin to'lov"*.

Muammo: **"ishlagan" — o'lchanmaydigan so'z.** TZ da 22 bo'lim, 165 edge case bor.
Mijoz istalgan vaqtda "bu hali ishlamayapti" deb ayta oladi va bu cheksiz davom
etishi mumkin.

Bu hujjat **o'lchanadigan ro'yxat** beradi. Ro'yxat bajarilsa — ish qabul qilingan
hisoblanadi va to'lov amalga oshadi.

### 0.1. Ikki tomon uchun ham foydali

| Sizga | Mijozga |
|---|---|
| To'lov aniq nuqtaga bog'lanadi | Nima olishini aniq biladi |
| Cheksiz "yana bu ham kerak" tugaydi | Sifatni tekshirish mezoni bor |
| Har bosqichda pul keladi | Bosqichma-bosqich ko'rib boradi |

### 0.2. Qanday ishlatiladi

1. Bu hujjat shartnomaga **ilova** qilinadi
2. Har bosqich tugaganda mijoz stsenariylarni **o'zi bajaradi**
3. Hammasi ishlasa — **imzo qo'yadi**, o'sha bosqich to'lovi amalga oshadi
4. Ishlamasa — aniq qaysi qadam ishlamagani yoziladi, tuzatiladi

---

## 1. TO'LOV BOSQICHLARI

| № | Bosqich | Nima topshiriladi | Ulush |
|---|---|---|---|
| **1** | Poydevor, filial asosi, spravochniklar | Kirish, rollar, filiallar, material, mahsulot turlari, mijozlar, yetkazib beruvchilar | **14%** |
| **2** | Ombor | Kirim, bo'laklar, band qilish, kesish, inventarizatsiya, filial qoldig'i | **18%** |
| **3** | Sotuv va buyurtma | Buyurtma yaratish, filial marshruti, ishlab chiqarish oqimi, topshirish | **22%** |
| **4** | Xodimlar va kassa | Ish haqi, filial kassalari, kun yopish, to'lovlar | **16%** |
| **5** | Filiallararo | Material ko'chirish, jo'natma, qarz, o'zaro balans | **12%** |
| **6** | Bot, hisobotlar, rejalar | Telegram bot, 27 hisobot, dashboard, reja/fakt | **18%** |

**Jami: 100%**

---

## 2. UMUMIY QOIDALAR

### 2.1. Qabul qilingan deb hisoblanadi

Bosqichning **barcha stsenariysi** mijozning o'z qo'li bilan bajarilganda va
kutilgan natija chiqqanda.

### 2.2. Qabul qilinmaydi

- Stsenariy xato beradi
- Natija kutilgandan farq qiladi
- Ma'lumot yo'qoladi yoki noto'g'ri saqlanadi

### 2.3. Qabulga TA'SIR QILMAYDI

Bular alohida ish sifatida hisoblanadi, qabulni to'xtatmaydi:

- **Dizayn va rang** — "chiroyliroq bo'lsin"
- **Joylashuv** — "bu tugma boshqa yerda tursin"
- **Yangi funksiya** — TZ da yozilmagan narsa
- **Tezlik** — texnik talablardagi chegaradan tez bo'lsa (§2.4)
- **Matn tahriri** — "bu so'z boshqacha yozilsin"

### 2.4. Tezlik chegaralari

| Amal | Chegara |
|---|---|
| Sahifa ochilishi | 3 sekund |
| Buyurtma saqlash | 5 sekund |
| Oddiy hisobot | 10 sekund |
| Yillik hisobot | 30 sekund |

### 2.5. Sinov muhiti

Qabul **sinov ma'lumoti** bilan o'tkaziladi, haqiqiy ish ma'lumoti bilan emas.

Sinov uchun kamida: 20 material · 5 mahsulot turi · 10 mijoz · 3 xodim ·
2 yetkazib beruvchi.

### 2.6. Muddat

Bosqich topshirilgandan keyin mijozda **7 kun** tekshirish uchun.

7 kun ichida yozma e'tiroz bo'lmasa — **avtomatik qabul qilingan** hisoblanadi.

E'tiroz bo'lsa: aniq qaysi stsenariy, qaysi qadam, nima chiqdi — yozma ravishda.
"Umuman ishlamayapti" — e'tiroz emas.

---

## 3. BOSQICH 1 — POYDEVOR VA SPRAVOCHNIKLAR · 15%

### S1.1. Tizimga kirish

```
1. Saytga kiring
2. Telefon va parol kiriting
3. Bosh sahifa ochilsin
4. Chiqing va noto'g'ri parol bilan urinib ko'ring
   → "Parol noto'g'ri" xabari chiqsin
```

### S1.2. Rol va ruxsat

```
1. Admin sifatida kiring → Sozlamalar → Rollar
2. Yangi rol yarating: "Sotuvchi"
3. Unga "sotuv" ruxsatlarini bering, "tannarx ko'rish" ni BERMANG
4. Sotuvchi xodim yarating va shu rolni bering
5. Chiqing, sotuvchi sifatida kiring
   → Tannarx hech qayerda ko'rinmasin
   → Sozlamalar bo'limi umuman ochilmasin
```

### S1.3. Material qo'shish — mato

```
1. Material → Yangi
2. Nom: "Ko'k mato · to'r"
3. Hisob turi: Rulon
4. Kirim birligi: rulon · Sarflash: kv.m
5. Sotuv narxi: 120 000 (1 kv.m uchun)
6. Saqlang
   → Ro'yxatda "120 000 so'm/kv.m" bo'lib ko'rinsin
```

### S1.4. Material qo'shish — karniz (birlik sinovi)

```
1. Material → Yangi
2. Nom: "Alyuminiy karniz"
3. Hisob turi: Chiziqli
4. Kirim birligi: shtanga · Sarflash: sm · Koeffitsient: 300
5. Sotuv narxi: 35 000 (1 metr uchun)
6. Saqlang
   → Ro'yxatda "35 000 so'm/m" bo'lib ko'rinsin
```

⚠️ Bu eng muhim sinov — birlik xatosi shu yerda ushlanadi.

### S1.5. Mahsulot turi va formula

```
1. Konstruktor → Yangi mahsulot turi: "Dikke"
2. Parametr qo'shing: CHET, standart qiymat 30
3. Uch slot qo'shing:
   · "Chet mato"  formula: CHET * BOYI
   · "O'rta mato" formula: (ENI - 2*CHET) * BOYI
   · "Karniz"     formula: ENI
4. Test kalkulyatorida sinang: eni 180, bo'yi 220
   → Chet mato: 0.66 kv.m
   → O'rta mato: 2.64 kv.m
   → Karniz: 180 sm (1.80 m)
```

### S1.6. Mijoz qo'shish

```
1. Mijozlar → Yangi
2. Ism, telefon kiriting
3. Offset: −3%
4. Qarz limiti: 5 000 000
5. Saqlang
6. Xuddi shu telefon bilan yana bir mijoz qo'shishga urining
   → "Bu telefon allaqachon mavjud" xabari chiqsin
```

### S1.7. Yuridik shaxs (soliq maydonlari)

```
1. Mijozlar → Yangi → Turi: Yuridik shaxs
   → Rekvizitlar bloki ochilsin
2. Tashkilot nomi, INN, yuridik manzil kiriting
3. "NDS to'lovchi" ni belgilang, stavka 12%
4. Saqlang
```

### S1.8. Yetkazib beruvchi

```
1. Yetkazib beruvchilar → Yangi
2. Nom, telefon, to'lov muddati: 30 kun
3. Saqlang
```

---

## 4. BOSQICH 2 — OMBOR · 20%

### S2.1. Kirim hujjati

```
1. Ombor → Kirim → Yangi
2. Yetkazib beruvchi tanlang
3. Qator qo'shing: "Ko'k mato · to'r", 2 rulon, har biri 3.00 × 30.00 m
   Narxi: 1 rulon 7 800 000
4. Transport: 500 000
5. Saqlang
   → Omborda 2 ta rulon paydo bo'lsin: 3.00 × 30.00 m
   → Yetkazib beruvchiga qarz 16 100 000 bo'lsin
```

### S2.2. Tannarx tekshiruvi

```
1. Yangi kirim: karniz, 10 shtanga, jami 660 000
2. Ulardan 1 tasi brak deb belgilang
3. Saqlang
4. Material kartochkasini oching
   → Tannarx 66 000 so'm/shtanga bo'lsin (73 333 EMAS)
```

⚠️ Bu FIFO va brak hisobining asosiy sinovi.

### S2.3. Ombor qoldig'i ko'rinishi

```
1. Ombor → Qoldiq
   → Har bo'lak "eni × bo'yi, metrda" ko'rinsin
   → Masalan: "R-118  3.00 × 30.00 m"
   → Kv.m alohida ustunda hisoblangan holda
```

### S2.4. Hisobdan chiqarish (brak)

```
1. Bir bo'lakni tanlang → "Hisobdan chiqarish"
2. Sabab: "Suv tegdi"
3. Tasdiqlang
   → Bo'lak qoldiqdan chiqsin
   → Foyda-zarar hisobotida "Ombor braki" moddasida summa paydo bo'lsin
   → Admin botiga xabar kelsin
```

### S2.5. Inventarizatsiya

```
1. Ombor → Inventarizatsiya → Yangi
2. Sanash varaqasi chiqsin — har bo'lak eni × bo'yi bilan
3. Bir bo'lakning bo'yini 30.00 dan 28.50 ga o'zgartiring
4. Yakunlang
   → Farq hisoblansin
   → Foyda-zararga xarajat bo'lib tushsin
   → Bo'lak o'lchami yangilansin
```

### S2.6. Boshlang'ich qoldiq

```
1. Material kartochkasi → "Boshlang'ich qoldiq"
2. Miqdor va tannarx kiriting
3. Saqlang
   → Qoldiqqa qo'shilsin
   → Yetkazib beruvchi qarziga TEGMASIN
```

---

## 5. BOSQICH 3 — SOTUV VA BUYURTMA · 25%

### S3.1. Kanonik buyurtma (asosiy sinov)

```
1. Sotuv → Yangi buyurtma
2. Mijoz tanlang (offsetsiz)
3. Pozitsiya: Rollo, 210 × 140 sm
   · Mato 1: 120 000/kv.m
   · Mato 2: 90 000/kv.m
   · Karniz, kronshteyn, xizmat haqi: 45 000 + 10 000 + 6 000
4. Jami summa:
   → 678 400 so'm bo'lishi SHART
```

⚠️ Bu butun narx tizimining asosiy sinovi.

### S3.2. Karniz narxi (birlik sinovi)

```
1. Buyurtmaga alyuminiy karniz qo'shing, eni 210 sm
   → Sarflash 4.20 m bo'lib ko'rinsin
   → Narxi 147 000 so'm bo'lsin (14 700 000 EMAS)
```

### S3.3. Mijoz offseti

```
1. Offseti −3% bo'lgan mijoz tanlang
2. 120 000 so'mlik mato qo'shing
   → Narx 116 400 bo'lsin
   → Yaxlitlash 100 so'mgacha ishlasin
```

### S3.4. Material yetishmasligi

```
1. Omborda yo'q matodan buyurtma qilishga urining
   → Ogohlantirish chiqsin: "Bu mato hozir yetarli emas"
   → "Davom etish" va "Boshqa mato" tugmalari bo'lsin
2. Davom eting
   → Pozitsiya "Materialga kutmoqda" holatiga tushsin
```

### S3.5. Band qilish

```
1. Materiali bor buyurtma yarating va tasdiqlang
2. Ombor qoldig'ini oching
   → Tegishli bo'lak "band" holatida ko'rinsin
   → Bo'sh qoldiq kamaysin
3. Buyurtmani bekor qiling
   → Band bo'shasin, qoldiq tiklansin
```

### S3.6. Ikki usta bir bo'lakka (raqobat sinovi)

```
1. Bitta bo'lakka sig'adigan ikkita buyurtma yarating
2. Ikkalasini ketma-ket tasdiqlang
   → Birinchisi bo'lakni band qilsin
   → Ikkinchisi boshqa bo'lak topsin yoki "Materialga kutmoqda" ga tushsin
   → HECH QACHON ikkalasi bir bo'lakni band qilmasin
```

### S3.7. Kesish oqimi

```
1. Usta botdan ishni oling
2. "Tugatdim" bosing
3. Qaysi bo'lakdan kesganingizni tasdiqlang
4. Qolgan bo'lak o'lchamini kiriting: 0.60 × 2.00
5. "Ostatka" ni tanlang
   → Omborda yangi ostatka paydo bo'lsin
   → Asl bo'lak qoldiqdan chiqsin
   → Ustaga haq hisoblansin
```

### S3.8. Kesim balansi

```
1. Yuqoridagi kesimdan keyin ombor harakatlarini oching
   → Uch qator bo'lsin:
     Chiqdi   −3.60 kv.m
     Ostatka  +1.20 kv.m
     Mahsulot  2.40 kv.m
   → Yig'indisi 0 bo'lsin
```

### S3.9. Buyurtmani topshirish

```
1. Barcha pozitsiya tayyor bo'lsin
2. "Topshirildi" bosing
3. To'lov kiriting
   → Buyurtma yopilsin
   → Mijoz qarzi yangilansin
   → Kassaga pul tushsin
```

### S3.10. Qaytarish

```
1. Topshirilgan buyurtmani qaytaring
2. Ushlab qolinadigan summani kiriting
   → Mijoz qarzi kamaysin
   → Mahsulot "Sotilmagan tayyor mahsulot" ro'yxatiga tushsin
```

### S3.11. Tayyordan sotish

```
1. Sotuv → "Tayyordan tanlash"
2. Yuqoridagi mahsulotni tanlang
3. Chegirma qo'ying
   → Sotilsin
   → Ombor qoldig'iga TEGILMASIN
   → Foyda "sotuv narxi − saqlangan tannarx" bo'lsin
```

### S3.12. Ishlab chiqarish braki

```
1. Usta botdan qayta kesish so'rasin
2. Admin tasdiqlasin
   → Yangi bo'lak band qilinsin
   → Birinchi kesim chiqindiga ketsin
   → Ustaning haqi BEKOR QILINSIN (ikki marta hisoblanmasin)
```

---

## 6. BOSQICH 4 — XODIMLAR VA KASSA · 20%

### S4.1. Stavka va ish haqi

```
1. Xodimlar → Stavkalar
2. Rollo uchun: 18 000 so'm/kv.m
3. Usta 3.2 kv.m ish bajarsin
   → Haq 57 600 so'm bo'lsin
```

### S4.2. Usta balansi

```
1. Ustaga 2 180 000 haq hisoblangan bo'lsin
2. 940 000 avans bering
3. 100 000 ushlanma qo'ying
   → Balans 1 140 000 bo'lsin
   → Botda ham xuddi shu raqam ko'rinsin
```

⚠️ Bu hisob TZ da xato yozilgan edi — shu yerda tekshiriladi.

### S4.3. Kassa kirim va chiqim

```
1. Buyurtmaga to'lov qabul qiling → kassaga tushsin
2. Yetkazib beruvchiga to'lov qiling → kassadan chiqsin
3. Kassa kitobini oching
   → Har yozuv manbasi bilan ko'rinsin
```

### S4.4. Kun yopish

```
1. Kassada: boshlang'ich 850 000, kirim 4 200 000, chiqim 1 850 000
2. "Kunni yopish" bosing
   → Hisoblangan: 3 200 000
3. Sanalgan: 3 150 000 kiriting
   → Farq −50 000 ko'rinsin
   → Yopilsin
4. Yopilgan kunga yozuv kiritishga urining
   → Ruxsat berilmasin
```

### S4.5. Sotuvchidan topshiriq

```
1. Sotuvchi kassasidan adminga pul topshiring
   → Sotuvchi kassasidan chiqsin
   → "Yo'lda" holatida tursin
2. Admin qabul qilsin
   → Admin kassasiga kirsin
```

### S4.6. Valyuta

```
1. Dollarda to'lov qabul qiling
   → Alohida kassada ko'rinsin
   → So'm bilan QO'SHILMASIN
2. Sozlamada kursni o'zgartiring
   → Eski buyurtmalarning summasi O'ZGARMASIN
```

### S4.7. Storno

```
1. Kassa yozuvini storno qiling
   → Teskari yozuv paydo bo'lsin
   → Asl yozuv O'CHIRILMASIN
   → Audit jurnaliga tushsin
```

### S4.8. Xarajat ≠ kassa chiqimi

```
1. Ombordan brak chiqaring (pul chiqmaydi)
   → Foyda-zararda xarajat paydo bo'lsin
   → Kassa oqimida HECH NARSA o'zgarmasin
```

---

## 6A. BOSQICH 5 — FILIALLARARO · 12%

> Bu bosqich sinovi uchun kamida **2 ta filial** yaratilgan bo'lishi kerak:
> biri `Sotadi ☑ Tikadi ☑`, ikkinchisi `Sotadi ☑ Tikadi ☐`.

### S5F.1. Filial rejimlari

```
1. Sozlamalar → Filiallar → Yangi
2. "Samarqand do'koni": Sotadi ☑, Ishlab chiqaradi ☐
3. Standart ishlab chiqarish filiali: "Chilonzor"
4. Saqlang
   → Ro'yxatda "Do'kon" rejimi bilan ko'rinsin
```

### S5F.2. Boshqa filialda tikiladigan buyurtma

```
1. Samarqand sotuvchisi sifatida kiring
2. Buyurtma yarating va tasdiqlang
   → "Ishlab chiqaruvchi filial: Chilonzor" bo'lib ko'rinsin
   → Material CHILONZOR omboridan band qilinsin (Samarqanddan emas)
   → Holat "Filialga yuborildi" bo'lsin
```

### S5F.3. Yangi statuslar

```
1. Chilonzor ustasi ishni bajarsin → "Tugatdim"
   → Holat "Tayyor — yo'lda" bo'lsin
2. Jo'natma yarating: Chilonzor → Samarqand
3. Samarqand qabul qilsin
   → Holat "Yetib keldi" bo'lsin
4. Mijozga topshiring
   → Holat "Topshirildi"
```

### S5F.4. Filiallararo qarz (asosiy sinov)

```
1. Yuqoridagi buyurtma 678 400 so'mga sotilgan bo'lsin
   Tannarx 312 000, ish haqi 57 600
2. "Topshirildi" bosilgandan keyin
   Filiallar → Hisob-kitob ni oching
   → Samarqand Chilonzorga 524 000 so'm qarzdor bo'lsin
   → Samarqandda qolgan: 678 400 − 524 000 = 154 400
```

⚠️ Bu filiallararo hisobning asosiy sinovi.

### S5F.5. Material ko'chirish

```
1. Samarqand Chilonzordan mato so'rasin
2. Chilonzor omborchisi bo'laklarni tanlab jo'natsin
   → Bo'lak "yo'lda" holatiga o'tsin
   → Ikkala filial qoldig'ida ham KO'RINMASIN
   → Umumiy ombor qiymati O'ZGARMASIN
3. Samarqand qabul qilsin
   → Bo'lak Samarqand qoldig'iga kirsin
   → Kodi O'ZGARMASIN
   → Samarqand Chilonzorga tannarx summasida qarzdor bo'lsin
```

### S5F.6. Ko'chirish summasini qo'lda o'zgartirish

```
1. Yangi ko'chirish yarating
2. Taklif qilingan summani o'zgartiring
   → Sabab so'ralsin (majburiy)
3. Saqlang
   → Audit jurnaliga tushsin
```

### S5F.7. Pul boshqa filialga topshirish

```
1. Chilonzor sotuvchisi pulni Samarqand adminiga topshirsin
   → Ogohlantirish chiqsin
2. Samarqand qabul qilsin
   → Samarqand Chilonzorga qarzdor bo'lsin
```

### S5F.8. O'zaro hisob va to'lov

```
1. Ikki filial o'rtasida ikki yo'nalishda qarz bo'lsin
2. Filiallar → Hisob-kitob → "O'zaro hisob"
   → Faqat FARQ ko'rinsin
3. To'lovni amalga oshiring
   → Beruvchi kassasidan chiqsin, qabul qiluvchiga kirsin
   → Qarz yopilsin
```

### S5F.9. Filial narxi istisnosi

```
1. Material kartochkasi → Samarqand uchun narx 114 000 qo'ying
   (standart 120 000)
2. Samarqandda buyurtma yarating
   → 114 000 ishlatilsin
3. Chilonzorda buyurtma yarating
   → 120 000 ishlatilsin
```

### S5F.10. Ruxsat qamrovi

```
1. Samarqand omborchisi sifatida kiring
   → Faqat Samarqand qoldig'i ko'rinsin
   → Chilonzor kassasi UMUMAN ko'rinmasin
2. Bosh admin sifatida kiring
   → Barcha filial qoldig'i bir jadvalda ko'rinsin
```

---

## 7. BOSQICH 6 — BOT, HISOBOTLAR, REJALAR · 18%

### S6.1. Mijoz boti — buyurtma

```
1. Botni oching, telefon yuboring
2. Mahsulot turi, o'lcham, mato tanlang
   → Narx ko'rinsin
   → Saytdagi narx bilan BIR XIL bo'lsin
3. Buyurtmani tasdiqlang
   → Saytda "Tasdiq kutmoqda" holatida paydo bo'lsin
```

### S5.2. Mijoz boti — status va balans

```
1. Botdan "Buyurtmalarim" ni oching
   → Holat ko'rinsin
2. "Balansim" ni oching
   → Qarz summasi saytdagi bilan bir xil bo'lsin
```

### S5.3. Usta boti

```
1. Usta sifatida botga kiring
2. "Navbat" ni oching
   → Faqat tayyor ishlar ko'rinsin
3. Ish oling → "Tugatdim" bosing
   → Saytda holat o'zgarsin
   → Haq hisoblansin
```

### S5.4. Admin boti

```
1. Ombordan brak chiqaring
   → Admin botiga xabar kelsin
2. Yangi bot buyurtmasi kelsin
   → Admin botiga xabar kelsin
```

### S5.5. Foyda-zarar hisoboti

```
1. Hisobotlar → Foyda-zarar, oy tanlang
   → Tushum, tannarx, xarajatlar ko'rinsin
   → Barcha xarajat moddasi ro'yxatda bo'lsin
   → Ish haqi "Tugatdim" kuni bo'yicha hisoblansin
```

### S5.6. Ombor hisobotlari

```
1. Qoldiq va qiymati
2. Ostatkalar (uch daraja: yaroqli, kam ishlatiladigan, yaroqsiz)
3. Ustama eroziyasi
   → Ko'k mato uchun 37.4% bo'lsin (tannarx 87 333, narx 120 000)
```

### S5.7. Dashboard

```
1. Bosh sahifani oching
   → Bugungi tushum, buyurtma soni, kassa
   → "Diqqat talab qiladi" bloki: har raqam bosilsin va ro'yxat ochilsin
   → Oylik trend grafigi
2. Sotuvchi sifatida kiring
   → Foyda va tannarx bloklari KO'RINMASIN
```

### S5.8. Rejalar

```
1. Sozlamalar → Rejalar → avgust uchun 180 000 000 qo'ying
2. Reja/fakt hisobotini oching
   → Bajarilish foizi ko'rinsin
   → Rang: 80% dan past qizil, 95% dan yuqori yashil
```

### S5.9. Xarid ro'yxati

```
1. Qo'shimcha → Xarid ro'yxati
   → Yetishmayotgan materiallar yetkazib beruvchi bo'yicha guruhlansin
   → "Olish kerak" miqdori hisoblansin
```

### S5.10. Excel eksport

```
1. Istalgan hisobotni oching → "Excel" bosing
   → Fayl yuklansin
   → Ichida hisobot nomi, davri, sana bo'lsin
```

---

## 8. YAKUNIY TOPSHIRISH

Barcha 5 bosqich qabul qilingandan keyin qo'shimcha ravishda:

| № | Nima | Tekshiruv |
|---|---|---|
| 1 | **Boshlang'ich ma'lumot yuklangan** | Mijozning haqiqiy material, mijoz, qoldiq ma'lumoti tizimda |
| 2 | **Zaxira nusxa ishlayapti** | 3 kun ketma-ket avtomatik zaxira olingan |
| 3 | **Tiklash sinalgan** | Zaxiradan tiklab ko'rilgan, ma'lumot to'liq |
| 4 | **Xodimlar o'qitilgan** | Har rol uchun kamida 1 sessiya |
| 5 | **Kirish ma'lumotlari topshirilgan** | Server, domen, baza — mijoz nomida |

---

## 9. IMZO VARAQASI

```
BOSQICH ___ QABUL QILINDI

Sana: ____________

Barcha stsenariy bajarildi va kutilgan natija olindi.

Buyurtmachi: ________________    Imzo: ________

Ijrochi:     ________________    Imzo: ________

E'tirozlar (bo'lsa):
_________________________________________________
_________________________________________________
```

---

*Qabul mezonlari oxiri. 6 bosqich, 57 stsenariy.*
