# TZ-v1.14 — AUDIT

**Sana:** 15.08.2026
**Tekshirilgan hujjat:** `TZ-v1.14.md` — 19 bo'lim, 2900 qator, 126 edge case
**Maketlar:** 5 ta HTML

**Topildi:** 16 ziddiyat · 14 uzilgan bog'liqlik · 11 bo'shliq · 3 hisob xatosi
**Shundan KRITIK:** 5

---

## 0. QABUL QILINGAN QARORLAR

Audit davomida hal qilingan ziddiyatlar. Bular TZ-v1.15 ga yoziladi.

| # | Qaror | Tegadigan bandlar |
|---|---|---|
| **Q-01** | Chiziqli material: saqlash va sarflash **smda**, narx **1 metr uchun**, tizim ÷100 qiladi. Koeffitsient = 1 kirim birligida nechta sm (metr→100, shtanga→300) | 3.7 · 5.3 · 5.4 · 4.5 · 18 |
| **Q-02** | Band **aniq bo'lakka** qo'yiladi. Usta "Tugatdim"da bo'lakni tasdiqlaydi (rejadagi oldindan tanlangan) | 7.3 · 7.4 · 7.6 · EC-OMB-21 · 19.2 |
| **Q-03** | Material yetishmasligi **buyurtma berilayotgan payt** aytiladi — sotuv ekranida ham, botda ham. Tasdiqlashda ikkinchi tekshiruv saqlanadi | 3.4 · 7.7 · 8.3 · 8.12 · 13.4 |
| **Q-04** | 14.6 ruxsatlar matritsasi — **yagona manba**. 11.10 va 12.14 jadvallari boshlang'ich **preset** bo'lib qayta yoziladi | 1.2 · 9.5 · 10.15 · 11.10 · 12.14 · 14.6 |
| **Q-05** | Ombor qoldig'i **har doim `eni × bo'yi`, metrda**. Kv.m — faqat hisoblanadigan chiqish qiymati, hech qachon kiritilmaydi va hech narsani boshqarmaydi | 5.2 · 7.3 · 7.4 · 11.7.1 · 11.11 · 15.1 |
| **Q-06** | Usta boshqa bo'lakni tanlasa — eski band **darhol bo'shaydi**, sabab ro'yxatdan tanlanadi (iflos / topa olmadim / rang / boshqa) | 7.3 · 7.6 · 11.7.7 |
| **Q-10** | Kam qoldiq chegarasi — **uzunlik bo'yicha, metrda** | 5.5 · 14.4 · 15.3 |
| **Q-11** | Botda ham yetishmaslik ogohlantirishi chiqadi | 13.4 · 13.6 |
| **Q-12** | Sayt buyurtmasi **darhol "Tasdiqlangan"**, admin tasdig'i yo'q. 3.14 tuzatiladi | 3.14 · 8.4 |
| **Q-13** | Birlashtirib kesish — faqat **hisob-kitob taklifi**. Band va ombor hisobi **har pozitsiyaga alohida** | 7.6 · 8.5 · EC-OMB-02 |
| **Q-14** | Material kartochkasiga **"standart rulon eni"** maydoni qo'shiladi. Kam qoldiq chegarasi (metr) shu orqali kv.m ga o'giriladi | 5.3 · 5.5 · 15.3 |

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
