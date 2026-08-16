# JALYUZI BOSHQARUV TIZIMI — TEXNIK TOPSHIRIQ

**Versiya:** 1.14
**Sana:** 13.08.2026
**Holati:** barcha modul yopilgan, ochiq savol qolmadi. Keyingi bosqichga qoldirilganlar 18.2-bandda

---

## 0. HUJJAT HAQIDA

### 0.1. Bu hujjat nima

Bu — jalyuzi ishlab chiqarish va sotish biznesi uchun boshqaruv tizimining texnik topshirig'i. Hujjat bo'lim-ma-bo'lim to'ldirib boriladi: har bir bo'lim muhokama qilinadi, kelishiladi, maketi chiziladi, keyin shu yerga yoziladi va yopiladi.

### 0.2. Bo'limlar holati

| № | Bo'lim | Holati | Ekranlar |
|---|---|---|---|
| 3 | Sotuv (yangi buyurtma) | **YOPILGAN** | 1 |
| 4 | Mahsulot turi konstruktori | **YOPILGAN** | 1 |
| 5 | Material qo'shish | **YOPILGAN** | 1 |
| 6 | Mijozlar | **YOPILGAN** | 4 |
| 7 | Ombor | **YOPILGAN** | 6 |
| 8 | Buyurtma hayoti | **YOPILGAN** | 3 |
| 9 | Yetkazib beruvchilar | **YOPILGAN** | 4 |
| 10 | Xodimlar va ish haqi | **YOPILGAN** | 5 |
| 11 | Hisobotlar va dashboard | **YOPILGAN** | 1 + 22 hisobot |
| 12 | Kassa | **YOPILGAN** | 7 |
| 13 | Telegram bot | **YOPILGAN** | 3 panel |
| 14 | Sozlamalar va ruxsatlar | **YOPILGAN** | 7 |
| 15 | Qo'shimcha modullar | **YOPILGAN** | 4 |

**Barcha modul yopildi.** 44 ta ekran va 3 bot paneli.

### 0.3. Hujjatni qanday o'qish kerak

- **Qalin** yozilgan qoidalar — o'zgartirib bo'lmaydigan qarorlar. Ular buzilsa boshqa bo'limlar ishlamay qoladi.
- `[OCHIQ]` belgisi — hali kelishilmagan joy. Dasturchi bu joyni o'zi hal qilmaydi, so'raydi.
- Har bo'lim oxirida **edge case** ro'yxati bor. Ular asosiy matndan kam ahamiyatli emas — aksincha, aynan o'sha joylarda tizim buziladi.
- 9-bo'limda avvalgi versiyaga nisbatan nima o'zgargani sanalgan. Eski hujjat bo'yicha ish boshlagan bo'lsangiz, avval o'sha ro'yxatni ko'ring.

---

## 1. LOYIHA KONTEKSTI

### 1.1. Biznes

Jalyuzi (parda) ishlab chiqarish va sotish. Har bir buyurtma individual o'lchamda tayyorlanadi — omborda tayyor mahsulot turmaydi, faqat xomashyo.

Bugungi mahsulot turlari: Rollo, Kombo, Plisse, Dikke, Zashitka. Bu ro'yxat qat'iy emas — admin dasturchisiz yangi tur qo'sha oladi (4-bo'lim).

### 1.2. Foydalanuvchi rollari

| Rol | Nima qiladi |
|---|---|
| **Admin** | Hamma narsaga kirish. Narx, mahsulot turi, xodim, hisobot, storno. |
| **Sotuvchi** | Buyurtma yaratadi, mijoz qo'shadi, kassa bilan ishlaydi. |
| **Omborchi** | Kirim, qoldiq, hisobdan chiqarish. |
| **Ishlab chiqaruvchi (usta)** | Faqat Telegram bot orqali. O'z ishini ko'radi, "Tugatdim" bosadi. |

### 1.3. Valyuta

Tizim **ikki valyutada** ishlaydi: so'm va dollar. Kurs sozlamalarda turadi va qo'lda yangilanadi.

**So'm va dollar hech qachon bitta summaga qo'shilmaydi.** Ular alohida hisoblanadi, alohida ko'rsatiladi, alohida to'lanadi.

Yagona istisno — mijozning qarz limitini tekshirish (6.4-band). U yerda dollar qarzi joriy kursda so'mga o'girilib qo'shiladi.

---

## 2. UMUMIY INVARIANTLAR

Bu qoidalar butun tizimga tegishli. Har qanday yangi bo'lim ularga bo'ysunadi.

### 2.1. Ma'lumot yo'qolmaydi

- **Hech narsa o'chirilmaydi.** Xato yozuv storno qilinadi — teskari yozuv qo'shiladi, asli joyida qoladi.
- **Harakati bo'lmagan yozuv** (hech qachon ishlatilmagan material, buyurtmasiz mijoz) butunlay o'chiriladi. Bu xato kiritilgan qatorni tozalash uchun.
- **Harakati bor yozuv** o'chirilmaydi, faqat **nofaol** qilinadi. Nofaol yozuv yangi ishda ko'rinmaydi, lekin eski yozuvlarda ishlashda davom etadi.

### 2.2. Balans saqlanmaydi

Mijozning qarzi, ombordagi qoldiq, kassadagi pul — bularning hech biri alohida maydonda saqlanmaydi. Ularning har biri **harakatlar yig'indisi** sifatida hisoblanadi.

Shundan kelib chiqadi: tizimga o'tishda eski qarz va eski qoldiq ham **harakat sifatida** yozilishi shart ("Boshlang'ich qoldiq"). Aks holda balans nolga teng chiqadi.

### 2.3. O'tmish o'zgarmaydi

Saqlangan buyurtma o'z paytidagi tarkib, o'lcham va narx bilan qotib qoladi. Keyinchalik mahsulot turi tahrirlansa, mato narxi o'zgarsa, sarflash formulasi almashtirilsa — **eski buyurtmalar o'zgarmaydi**.

Sabab: aks holda o'tgan oyning hisoboti bugun o'zgarib ketadi.

### 2.4. Audit jurnali

Quyidagi amallar jurnalda qayd etiladi va o'chirilmaydi: storno, narx qo'lda o'zgartirilishi, chegirma limitidan oshish, qarzni hisobdan chiqarish, ombordan hisobdan chiqarish, qo'lda korrektsiya, ruxsat o'zgarishi, mahsulot turi tahriri, kurs o'zgarishi, material birligi o'zgarishi, mijoz nofaol qilinishi.

Har yozuvda: sana-vaqt, kim, nima, eski qiymat, yangi qiymat, sabab.

### 2.5. Ombor qoldig'i

**Avtomatik operatsiyalarda** ("Tugatdim", kesish) qoldiq hech qachon manfiyga tushmaydi. Buni atomar lock kafolatlaydi.

**Qo'lda amallarda** (brakni bekor qilish, korrektsiya) manfiy qoldiq vaqtincha paydo bo'lishi mumkin. U qizil bilan belgilanadi va admin tuzatgunicha shunday turadi.

> **v1.13 ga nisbatan o'zgarish.** Avval "qoldiq hech qachon manfiyga tushmasligi kerak" deb yozilgan edi. Endi bu talab faqat avtomatik operatsiyalarga tegishli — sabab 7.6-bandda.

---

## 3. SOTUV EKRANI (YANGI BUYURTMA)

### 3.1. Ekranning vazifasi

Sotuvchi mijoz oldida turib buyurtma rasmiylashtiradi. Ekran bitta — boshqa sahifaga o'tish shart emas.

### 3.2. Mahsulot turi

Yuqorida barcha faol mahsulot turlari qator bo'lib turadi. Admin sozlamalardan yangi tur qo'shsa — **avtomatik shu qatorga qo'shiladi**, dasturchiga murojaat qilish shart emas.

### 3.3. Mato slotlari

Mahsulot turi tanlangach, o'sha turning **slotlari** qator bo'lib ochiladi. Slotlar konstruktorda belgilanadi (4.4-band).

Misol:

| Tur | Slotlar |
|---|---|
| Kombo | Asosiy mato |
| Rollo | Old mato (to'r) · Orqa mato (zashitka) |
| Dikke | Oq mato (chet) · Ko'k mato (chet) · Ko'k mato (o'rta) |

**Har slot qatorida faqat o'sha slotga bog'langan matolar chiqadi.** Ya'ni "Orqa mato" qatorida to'r matolar ko'rinmaydi va sotuvchi adashib qo'ya olmaydi.

Har mato yonida qoldiq ko'rinadi. "Katalog" tugmasi rasmli katalogni ochadi — mijozga ekranni burib ko'rsatish uchun.

### 3.4. O'lcham

Eni va bo'yi **santimetrda** kiritiladi (210 × 140) — mijoz va usta shunday gapiradi. Tizim kvadrat metrga o'zi o'giradi.

### 3.5. Sarflash — har slot alohida

Har slot uchun sarflash formulasi bo'yicha miqdor hisoblanadi. Formula konstruktorda yozilgan (4.5-band).

Dikke, 180 × 220, CHET = 30 sm:

| Slot | Formula | Hisoblangan |
|---|---|---|
| Oq mato (chet) | `CHET × BO'YI` | 0.66 kv.m |
| Ko'k mato (chet) | `CHET × BO'YI` | 0.66 kv.m |
| Ko'k mato (o'rta) | `(ENI − 2×CHET) × BO'YI` | 2.64 kv.m |

**Har slot qatorida tahrirlanadigan input bo'ladi.** Sotuvchi hisoblangan sonni ko'radi va yoniga o'zi kiritadi:

```
Oq mato (chet)      0.66  →  [1.00]  × 85 000
Ko'k mato (chet)    0.66  →  [2.00]  × 120 000
Ko'k mato (o'rta)   2.64  →  [1.00]  × 120 000
```

**Umumiy maydon tahrirlanmaydi** — u faqat yig'indi bo'lib ko'rinadi. Aks holda ikki joydan bir narsa o'zgartiriladi va qaysi biri ustun ekani noaniq bo'lib qoladi.

### 3.6. Tuzatilgan son nimaga ta'sir qiladi

| Nimaga | Qaysi raqam |
|---|---|
| **Narx** | Sotuvchi kiritgan son |
| **Ombordan yechish** | Hisoblangan kesim |
| **Ustaga ketadigan o'lcham** | Original o'lcham (210 × 140 sm) |

Ya'ni sotuvchining tuzatishi faqat mijoz bilan kelishilgan narxga tegadi. Ombor haqiqiy kesimni yechadi, usta esa original o'lchamda kesadi.

### 3.7. Aksessuarlar

Mahsulot turi tanlangan zahoti komplekt avtomatik ro'yxatga tushadi — nomi va soni bilan. Komplekt konstruktorda belgilanadi (4.6-band).

Soni **statik son** yoki **formula** bo'lishi mumkin (`ENI × 2`). Formulali bo'lsa, o'lcham o'zgarganda qayta hisoblanadi.

Sotuvchi buni erkin o'zgartira oladi:
- sonini o'zgartirish
- narxini o'zgartirish
- keraksizini o'chirish
- turini almashtirish — dropdownda **faqat o'sha almashtirish guruhidagi** variantlar chiqadi
- komplektda yo'q aksessuarni qo'shish

**Sotuvchi sonini qo'lda tuzatgan bo'lsa — formula uni ustidan yozmaydi.** O'lcham keyin o'zgartirilsa ham qo'lda kiritilgan son saqlanadi.

Aksessuarning **o'lchov birligi** material qo'shishda belgilanadi (dona / metr / sm). Karniz metrda kirim qilinadi va metrda sarflanadi, shuning uchun ustunda `4.2 m` deb birligi bilan ko'rinadi.

### 3.8. Pozitsiya narxi

```
pozitsiya = Σ(slot sarflashi × o'sha slot matosining narxi)
          + Σ(aksessuar soni × narxi)
          + xizmat haqi
```

**Har slot o'z narxi bilan hisoblanadi.** Umumiy maydonni bitta mato narxiga ko'paytirish **noto'g'ri** — Dikke'da uch xil mato uch xil narxda.

Kanonik misol — Rollo 210 × 140:

```
old mato    120 000 × 2.94  =  352 800
orqa mato    90 000 × 2.94  =  264 600
mexanizm     45 000 × 1     =   45 000
kronshteyn    5 000 × 2     =   10 000
brelok        3 000 × 2     =    6 000
                               ────────
                                678 400
```

Xizmat haqi bu misolda kiritilmagan (ixtiyoriy maydon — 4.7-band).

Narx inputda chiqadi va **o'zgartirish mumkin**. So'mda ham, dollarda ham ko'rish va kiritish mumkin.

### 3.9. Savat

"Savatga qo'shish" bosilsa pozitsiya buyurtmaga tushadi. Bitta buyurtmada bir nechta xona va mahsulot bo'lishi mumkin (Rollo + Kombo + Plisse birga).

Buyurtma narxi — savatdagi pozitsiyalar yig'indisi.

### 3.10. Mijoz

Mijoz tanlash **majburiy emas** — ko'chadagi tasodifiy xaridor uchun mijozsiz sotish mumkin.

Qidiruv ism yoki telefon bo'yicha ishlaydi. Topilmasa — o'sha yerning o'zidan yangi mijoz qo'shiladi (qisqa forma: ism, telefon, turi).

Mijoz tanlangach uning **qarzi, limiti va offseti** darhol ko'rinadi va narx qayta hisoblanadi.

**Mahsulot qarzga berilayotgan bo'lsa — mijoz tanlash majburiy bo'lib qoladi.** Tizim qarzni kimdan undirishni bilishi kerak.

### 3.11. Jami narx va chegirma

Mijoz bilan kelishilgan narx hisoblangan narxdan farq qilishi mumkin. Jami summa **erkin o'zgartiriladi**, tizim farqni o'zi hisoblab izoh yozadi:

- summa kamaytirilsa → "chegirma 26 400 so'm"
- summa oshirilsa → "qo'shimcha haq"

Chegirma belgilangan limitdan oshsa — ogohlantirish chiqadi, lekin sotuvchi davom eta oladi. Bu harakat jurnalga tushadi.

### 3.12. To'lov

Bir nechta usul birga: naqd + karta. Har qator — usul, summa, valyuta. Har valyuta va usul kassada alohida hisoblanadi.

To'lov to'liq bo'lmasa, qolgan summa qarzga yoziladi va yangi qarz ko'rsatiladi.

### 3.13. Tayyorlik sanasi

**Ixtiyoriy maydon.** Sotuvchi xohlasa yozadi (mijozga muddat aytish uchun), xohlamasa bo'sh qoldiradi.

> Eski TZ 5.4-bandda "majburiy" deb yozilgan edi — u qoida **bekor qilindi**.

**Oqibati:** sanasi kiritilmagan buyurtma "kechikkan buyurtmalar" hisobotiga (11.8.3), admin paneldagi qizil belgiga va kechikish bildirishnomasiga **tushmaydi**. Ular umuman kechikmagan hisoblanadi.

Hisobotda alohida ustun bo'ladi: *"sanasi kiritilmagan — 14 ta"*. Shunda ular ko'zdan yo'qolmaydi.

### 3.14. Saqlash

Chek chop etiladi, buyurtma admin tasdig'iga jo'naydi.

---

## 4. MAHSULOT TURI KONSTRUKTORI

### 4.1. Vazifasi

Admin dasturchisiz yangi mahsulot turi yarata oladi. Yaratilgan tur darhol sotuvda ishlay boshlaydi.

### 4.2. Asosiy ma'lumot

Nomi, rasm (katalog uchun), qisqa tavsif, sotuv ekranidagi tartib raqami, holati.

**O'chirish tugmasi yo'q.** Keraksiz tur nofaol qilinadi — sotuvda chiqmaydi, eski buyurtmalar joyida qoladi.

### 4.3. Mahsulot parametrlari

Formulalarda ishlatiladigan nomlangan qiymatlar. Misol: Dikke uchun `CHET = 30` sm.

Qiymat bitta joydan o'zgartiriladi va butun hisob qayta ishlaydi.

**Formulada ishlatilayotgan parametrni o'chirish bloklanadi** — sababi ko'rsatiladi ("`CHET` 2 ta formulada ishlatilmoqda").

### 4.4. Mato slotlari

Har mahsulotda nechta mato ishlatilishi shu yerda belgilanadi. Har slotda: **nomi**, **sarflash formulasi**, **majburiy/ixtiyoriy**.

Material omborga kiritilayotganda **aynan shu slotga** bog'lanadi — mahsulot turiga emas. Shuning uchun sotuvda har slot qatorida faqat o'ziga tegishli matolar chiqadi.

**Bog'langan materiali bor slotni o'chirish bloklanadi** — avval materiallarni boshqa slotga ko'chirish kerak.

### 4.5. Formula

Ishlatiladi: `ENI`, `BO'YI`, `MAYDON`, `SONI` va qo'shilgan parametrlar. Amallar: `+ − × /` va qavslar.

Misollar:

```
o'rta qism:     (ENI − 2×CHET) × BO'YI
Plisse matosi:  MAYDON × 1.5
stepler lenta:  ENI × 2
```

Formula kiritilganda darhol tekshiriladi — xato bo'lsa saqlanmaydi.

### 4.6. Aksessuar komplekti

Jadval: aksessuar / soni yoki formula / majburiy yoki ixtiyoriy.

Ixtiyoriy aksessuar sotuvda avtomatik kelmaydi — mijoz so'ragandagina qo'shiladi.

**Bu jadval material kartochkasidagi bog'lanish bilan bitta ma'lumot** — ikki ekrandan tahrirlanadi, ikki nusxa saqlanmaydi.

### 4.7. Xizmat haqi

Har mahsulotga qo'shiladigan qat'iy summa (ishlov yoki o'rnatish haqi).

**Ixtiyoriy maydon.** Bo'sh qoldirilsa narxga hech narsa qo'shilmaydi.

### 4.8. Test kalkulyatori

**Saqlashdan oldin** o'lcham kiritib tekshiriladi: qaysi materialdan qancha ketishi va narx qancha chiqishi darhol ko'rinadi.

Formuladagi xato shu yerda ko'rinadi — mijozga sotgandan keyin emas.

### 4.9. Stavka ogohlantirishi

Yangi tur yaratilgach ishlab chiqaruvchilarning bu turga stavkasi 0 bo'lib qoladi. Tizim ogohlantiradi va stavka belgilash havolasini beradi — aks holda usta bu mahsulotni yasab haq olmaydi.

### 4.10. Keyin tahrirlash

Tur tahrirlansa eski buyurtmalar o'zgarmaydi (2.3-invariant).

**Tasdiqlangan, lekin hali kesilmagan buyurtmalar ham eski formula bo'yicha yechiladi.** Sabab: narx eski formula bo'yicha hisoblangan, sarf yangisi bo'yicha bo'lsa — ikkisi bir-biriga mos kelmaydi.

---

## 5. MATERIAL QO'SHISH

### 5.1. Kategoriyalar

Mato, aksessuar, karniz. Kategoriya tanlanganda kerakli maydonlar ochiladi.

### 5.2. Hisob turlari

To'rt xil: **rulon**, **kv.metr**, **chiziqli**, **dona**.

> **v1.13 ga nisbatan tuzatish.** Eski hujjatning 2.6.5-bandida faqat ikkitasi ("RULON yoki KV.METR") sanalgan edi.

### 5.3. Birliklar va konversiya

Ikkita alohida birlik:

- **Kirim birligi** — ombor qanday qabul qiladi (rulon, shtanga, quti, dona)
- **Sarflash birligi** — buyurtmada qanday yechiladi (kv.m, metr, sm, dona)

Ikkalasi har xil bo'lsa — **konversiya koeffitsienti** kiritiladi. Misol: karniz kirimda "shtanga", sarflashda "metr", koeffitsient 3.

**Barcha uzunlik o'lchovi — santimetrda.** Sotuv ekranida ham, konstruktorda ham, sarflash formulasida ham.

Karniz kirimda "shtanga" bo'lib keladi, sarflashda **sm**. Koeffitsient: 1 shtanga = 300 sm.

> Metr va sm aralashsa formulada xato chiqadi: `ENI × 1` da ENI smda, natija esa metrda kutilardi.

**Qoldiq 0 dan katta bo'lsa** hisob turi va birliklar o'zgartirilmaydi — tugma bloklanadi va sabab ko'rsatiladi.

### 5.4. Narx

**Tannarx qo'lda kiritilmaydi** — har kirim hujjatidan avtomatik keladi. Har kirim o'z narxini saqlaydi.

Istisno: tizim birinchi marta ishga tushirilganda boshlang'ich tannarx import orqali kiritiladi. Bu holda **har rulonga alohida narx** beriladi.

**Sotuv narxi** — mato uchun 1 kv.m, karniz uchun 1 metr, aksessuar uchun 1 dona.

**Minimal ustama chegarasi.** Ustama = `(sotuv narxi − tannarx) ÷ tannarx`.

Sozlamalarda **umumiy standart** turadi (masalan 30%) va barcha materialga qo'llanadi. Material kartochkasida maydon bo'sh qolsa standart ishlaydi; boshqacha kerak bo'lsa — o'sha yerda alohida yoziladi.

Chegaradan past tushsa kirimda ogohlantirish chiqadi (7.8).

> Tannarx **o'z-o'zidan** o'sadi — yetkazib beruvchi narx ko'taradi. Sotuv narxi esa faqat admin qo'l bilan o'zgartirganda o'zgaradi. Ya'ni ustama jimgina yeyilib boradi va bu ogohlantirishsiz sezilmaydi.

### 5.5. Chegaralar

**Kam qoldiq chegarasi** — barcha hisob turlariga qo'llanadi, materialning o'z birligida. Qoldiq shundan past tushsa ogohlantirish chiqadi.

**Ostatka chegaralari** — faqat rulon va chiziqli uchun, **eni bo'yicha, metrda**. Ikkita chegara belgilanadi va ular uchta daraja beradi (7.5):

| Maydon | Standart | Ma'nosi |
|---|---|---|
| **Yaroqsiz chegarasi** | 0.5 m | Bundan kichigi chiqindiga taklif qilinadi |
| **Kam ishlatiladigan chegarasi** | 1.0 m | Oralig'i saqlanadi, lekin belgi bilan |

**Chegara — taklif, qaror emas.** Usta ishni olayotganda o'zgartira oladi (7.6).

> Maydon emas, aynan eni. `0.20 × 6` bo'lak 1.2 kv.m bo'lsa ham hech narsaga yaramaydi.

Tavsiya etilgan oraliq: 0.3–1 m. 0 qo'yilsa ombor mayda qirqimlar bilan to'lib ketadi, juda katta qo'yilsa hamma narsa chiqindiga chiqadi.

### 5.6. Almashtirish guruhi

**Majburiy maydon.** Sotuvda dropdown ochilganda faqat shu guruhdagi variantlar chiqadi — mexanizm bosilganda kronshteyn chiqmaydi.

### 5.7. Slotlarga bog'lanish

Mato **aniq slotga** bog'lanadi: "Rollo" emas, "Rollo → Orqa mato (zashitka)".

Bitta mato bir nechta slotga bog'lanishi mumkin — zashitka matosi ham "Rollo → Orqa mato", ham "Zashitka → Asosiy mato" slotiga.

Aksessuar mahsulot turiga bog'lanadi, har turi uchun alohida sarflash qoidasi va majburiy/ixtiyoriy holati bilan.

### 5.8. Saqlashdagi ogohlantirishlar

**Bloklamaydi, faqat ogohlantiradi:**
- Sotuv narxi tannarxdan past (farq summasi ko'rsatiladi)
- O'xshash nomli material bor (nomi va qoldig'i ko'rsatiladi)
- Hech qaysi slotga bog'lanmagan ("sotuvda hech qachon ko'rinmaydi")
- Ogohlantirish chegarasi joriy qoldiqdan yuqori

**Bloklaydi:** majburiy maydon bo'sh, sotuv narxi manfiy, koeffitsient 0 yoki manfiy.

### 5.9. Material holati

- Harakati bo'lmagan material butunlay o'chiriladi
- Harakati bori nofaol qilinadi
- **Nofaol material ochiq buyurtmalarda ishlashda davom etadi** — usta "Tugatdim" bosa oladi. Aks holda ish yarim yo'lda to'xtab qoladi
- Nofaol materialning qoldig'i ombor hisobotida ko'rinib turadi

**Nofaol qilish bloklanadi**, agar material biror faol mahsulot turining **majburiy** komplektida bo'lsa va almashtirish guruhida boshqa faol variant qolmasa.

Sabab ko'rsatiladi: *"Rollo uchun majburiy, 'Mexanizm' guruhida boshqa faol variant yo'q"*.

> Aks holda sotuvchi Rollo tanlaganda mexanizm qatorida bo'sh dropdown chiqadi — muammo mijoz oldida ma'lum bo'ladi. Bloklash uni admin ekraniga ko'chiradi.

---

## 6. MIJOZLAR

### 6.1. Ekranlar

1. Mijozlar ro'yxati
2. Mijoz qo'shish / tahrirlash
3. Mijoz kartochkasi
4. Qarzni to'lash oynasi

### 6.2. Mijoz turlari

**Oddiy mijoz** va **B2B (do'konchi)**. B2B tanlansa kontakt shaxslar jadvali ochiladi (F.I.SH., lavozimi, telefoni).

### 6.3. Narx offseti

Mijozga beriladigan narx farqi. **Barcha matolarga bir xil qo'llanadi** — har materialga alohida narx belgilanmaydi.

Uch xil bo'lishi mumkin:

| Turi | Formula | 120 000 so'm/kv.m matoda |
|---|---|---|
| **So'm** | `baza + offset` | −1 500 → 118 500 |
| **Foiz** | `baza × (1 + offset)` | −3% → 116 400 |
| **Dollar** | `baza + (offset × kurs)` | −1 $ → 107 350 |

Formada ikkita maydon: **offset turi** (dropdown) va **qiymati**. Ostida jonli jadval — shu offset bilan bir necha matoning narxi qanday chiqishi ko'rsatiladi, admin saqlashdan oldin ko'radi.

Offset **faqat matoga** qo'llanadi, aksessuarga tegmaydi.

Sotuvda mijoz tanlangach narx qayta hisoblanadi, keyin sotuvchi uni yana qo'lda o'zgartira oladi.

**Yaxlitlash — 100 so'mgacha.** Foizli offsetda narx kasr chiqadi:

```
118 750 × 0.97 = 115 187.5  →  115 200
```

**Dollar offsetida sozlamadagi joriy kurs ishlatiladi** (14.3), buyurtmadagi kurs emas.

> Buyurtmadagi kurs olinsa, sotuvchi kursni ko'tarib mijozga bilvosita chegirma bera oladi va bu chegirma limitida (3.11) ko'rinmaydi.

> **v1.13 ga nisbatan o'zgarish.** Eski hujjatning 5.2-bandida "% chegirma KERAK EMAS" deb yozilgan edi. Endi foiz offset turlaridan biri.

### 6.4. Qarz limiti

Limit **doim so'mda** belgilanadi.

Mijozning qarzi ikki valyutada alohida turadi (masalan 5 000 000 so'm + 150 $). **Limitni tekshirishda dollar qarzi joriy kursda so'mga o'girilib qo'shiladi:**

```
5 000 000 + (150 × 12 650) = 6 897 500 so'm
limit: 6 500 000  →  limitdan oshgan
```

Ro'yxatda ustun `joriy qarz / limit` ko'rinishida chiqadi, ikkalasi ham so'mda — sotuvchi raqam qayerdan kelganini ko'radi.

> **Ma'lum oqibat.** Kurs o'zgarganda bu son ham o'zgaradi. Mijoz hech narsa olmasdan "limitdan oshgan" ro'yxatiga tushishi mumkin. Bu ongli qabul qilingan xavf.

Limitdan oshsa — sotuvchi mustaqil qaror qabul qiladi, tizim bloklamaydi.

### 6.5. Dublikat nazorati

**Bir xil telefon yoki bir xil ism kiritilsa saqlanmaydi.** Ogohlantirish oynasi chiqadi va mavjud mijozning telefoni, oxirgi xaridi, qarzi ko'rsatiladi.

Uch yo'l taklif qilinadi: mavjud mijozni ochish, unga kontakt shaxs sifatida qo'shish, ismni o'zgartirish.

### 6.6. Holati

Mijoz o'chirilmaydi, nofaol qilinadi (2.1-invariant).

**Qarzi 0 dan farq qilsa nofaol qilish bloklanadi.** Sabab ko'rsatiladi ("Qarzi bor: 1 340 000 so'm"). Aks holda qarz ro'yxatdan g'oyib bo'ladi.

Hech qanday buyurtmasi va to'lovi bo'lmagan mijoz butunlay o'chiriladi.

### 6.7. Mijoz kartochkasi

Sarlavhada: ism, turi, telefon, manzil, kontakt shaxslar, offset, limit, mijoz bo'lgan sana. O'ng tomonda joriy balans (manfiy — qarz, musbat — avans) va limit holati.

Ko'rsatkichlar: jami xarid, buyurtmalar soni, o'rtacha chek, o'rtacha to'lov muddati, qaytarishlar, xarid chastotasi, eng ko'p olgan mahsulot, hisobdan chiqarilgan qarz.

Beshta tab: **qarz harakati**, **buyurtmalar**, **to'lovlar**, **eslatmalar**, **izohlar**.

### 6.8. Qarz harakati

Jadval: sana, sabab, summa, valyuta, oldingi balans, keyingi balans, kim.

**Birinchi qator — "Boshlang'ich qoldiq"** (2.2-invariant). Tizimga o'tishda import qilingan eski qarz shu yerda ko'rinadi, aks holda balans 0 chiqadi.

### 6.9. Qarzni to'lash

Bu **kassa kirim oynasining bir turi**, alohida oyna emas. Mijoz kartochkasidan ochilganda mijoz maydoni oldindan to'ldirilgan holda chiqadi.

**Bitta operatsiyada bitta valyuta.** Mijozda so'm ham, dollar ham qarz bo'lsa — ikkita alohida yozuv.

Standart holatda **eng eski buyurtmadan** yopiladi. Sotuvchi boshqasini tanlashi yoki umumiy balansdan yopishi mumkin.

Saqlanganda: kassaga kirim yoziladi, mijozning qarz harakatiga qator qo'shiladi, buyurtmaning qarzi kamayadi, kvitansiya taklif qilinadi.

### 6.10. Umidsiz qarz

Admin qarzni hisobdan chiqara oladi. Sabab majburiy, audit jurnaliga tushadi.

**Mijoz keyin kelib to'lasa** — pul kassaga **"boshqa kirim"** sifatida kiritiladi. Mijoz kartochkasida "hisobdan chiqarilgan qarz qaytdi" deb ko'rinadi, lekin **balansiga qo'shilmaydi** — qarz allaqachon yopilgan.

### 6.11. Telegram ID

Mijoz botga `/start` bosganda avtomatik saqlanadi. Qo'lda ham kiritish mumkin.

Bo'sh bo'lsa ro'yxatda belgi chiqadi ("qo'ng'iroq qiling") — bunday mijozga bildirishnoma yuborib bo'lmaydi.

Bot mijozni **telefon raqami** bo'yicha taniydi: `/start` da Telegram tugmasi orqali raqam so'raladi, bazada topilsa mavjud mijozga bog'lanadi, topilmasa yangisi yaratiladi (13.2).

---

## 7. OMBOR

### 7.1. Ekranlar

1. Materiallar ro'yxati
2. Material qo'shish / tahrirlash *(5-bo'limga qarang)*
3. Material kartochkasi
4. Kirim hujjati
5. Rulon va ostatka
6. Hisobdan chiqarish (brak)

### 7.2. Umumiy tuzilma

Ombor ikki qism bilan ishlaydi: materiallar spravochnigi va har mahsulot turi uchun retsept (BOM).

**Kirimda faqat xomashyo kiritiladi** — tayyor mahsulot emas, chunki har buyurtma individual o'lchamda tayyorlanadi.

### 7.3. Band qilish

**Pozitsiya "Tasdiqlangan" bo'lgan zahoti tizim mos bo'lakni topadi va uni band qiladi.**

Ombor qoldig'i ikkiga ajraladi:

```
Ko'k mato · to'r      jami 48.0 kv.m
                      bo'sh 31.4  ·  band 16.6
```

> Bu qoida **o'zgartirilgan**. Avval band qilish yo'q edi va bir nechta buyurtma bitta bo'lakka da'vogar bo'lishi mumkin edi — muammo faqat "Tugatdim" bosilganda ma'lum bo'lardi.

**Band muddati — 30 kun.** Pozitsiya shu vaqt ichida bajarilmasa band avtomatik bo'shaydi va adminga xabar ketadi.

**Band bo'shatiladi:** pozitsiya bekor qilinganda · rad etilganda · muddat o'tganda.

**Bo'lak raqami ustaga ko'rsatilmaydi.** Tizim faqat **manbani** biladi: ostatkadan yoki rulondan. Ustaga aytiladi: *"Ostatkadan kesing — mos bo'lak bor"*. Qaysi birini olishini u omborda o'zi topadi.

**Texnik talab:** "Tugatdim" va band qilish operatsiyalari **atomar** bajariladi. Ikki usta bir vaqtda bitta bo'lakka da'vo qilsa — birinchi so'rov oladi, ikkinchisiga rad javobi qaytariladi.

Lock **omborchi bilan usta orasida ham** ishlaydi: omborchi bo'lakni brakka chiqarayotganda usta o'shanga "Tugatdim" bosa olmaydi.

### 7.4. Rulon va qoldiq kesma

Mato rulon holida, **aniq o'lchamlar bilan** omborga kiradi (eni × bo'yi). Rulonlar standart enida kelmaydi — o'lcham har kirimda alohida kiritiladi.

**Rulonning eni hech qachon o'zgarmaydi.** Kesilganda faqat **bo'yi** kamayadi.

Misol: rulon `3.00 × 30.00`. Buyurtma `1.20 × 2.00`. Usta 2 m tasma ochadi, undan 1.20 enlik bo'lakni kesadi.

```
R-118   rulon           3.00 × 28.00 m    ← bo'yi 30 dan 28 ga tushdi
O-207   qoldiq kesma    1.80 × 2.00 m     ← R-118 dan, buyurtma №1247
```

**Ikki xil bo'lak bor:**

| Turi | Nima |
|---|---|
| **Rulon** | Butun yoki qisman ochilgan. Eni doim asl eni |
| **Qoldiq kesma** | Kesimdan ortgan to'rtburchak. O'z eni va bo'yi bilan |

**Har bo'lak `eni × bo'yi` bo'lib saqlanadi**, faqat kvadrat metr bo'lib emas.

> **Nega maydon yetarli emas.** Bo'lakning maydoni 5.00 kv.m, kerak bo'lgani 2.94. Maydon bo'yicha "yetadi" chiqadi, lekin eni 1.00 m — undan 210 sm parda kesib bo'lmaydi.

Har bo'lak **o'z kirimini va tannarxini** eslab qoladi. Qoldiq kesma otasidan meros oladi.

Bo'lak doim **to'rtburchak** — usta doim to'liq kenglikda kesadi.

**Pozitsiyada faqat manba saqlanadi** — ostatkadan yoki rulondan. Aniq bo'lak raqami emas.

Ish varaqasida usta shuni ko'radi: *"Mato: ostatkadan kesing"*. Qaysi bo'lakni olishini omborda o'zi hal qiladi.

### 7.5. Uch daraja: yaroqli, kam ishlatiladigan, yaroqsiz

Admin har materialga **ikkita chegara** belgilaydi va ular uchta daraja beradi:

| Eni | Daraja | Nima bo'ladi |
|---|---|---|
| < 0.5 m | **Yaroqsiz** | Chiqindi. Tizim shuni taklif qiladi |
| 0.5 – 1.0 m | **Kam ishlatiladigan** | Qoldiq kesma bo'lib saqlanadi, belgi bilan |
| > 1.0 m | **To'liq yaroqli** | Oddiy qoldiq kesma |

**O'rta daraja nima uchun kerak:** bunday bo'laklar yig'ilib qoladi va "muzlab qolgan pul" hisobotida (11.7.6) alohida ko'rinadi. Yiliga bir marta ularni ko'rib chiqib tozalash mumkin.

**Chegaralar har materialda alohida** — qimmat matoda 0.3 m ham saqlanadi, arzonida 0.8 m ham chiqindi. Bo'sh qolsa sozlamadagi standart ishlaydi (14.4).

**Chegara — taklif, qaror emas.** Tizim hisoblab tavsiya beradi, usta o'zgartira oladi.

### 7.6. Kesish oqimi

Kesish qarori **usta ishni olayotganda** ko'rsatiladi va **"Tugatdim" da tasdiqlanadi**.

```
1. Pozitsiya "Tasdiqlangan"
   → tizim mos bo'lakni topadi va band qiladi (7.3)

2. Usta ishni oladi — rejani ko'radi:

     Kesiladi:  1.20 × 2.00
     Manba:     OSTATKADAN — mos bo'lak bor (1.80 × 2.00)
     Qoladi:    0.60 × 2.00  → kam ishlatiladigan

3. Usta omborga boradi, mos ostatkani o'zi topib kesadi

4. "Tugatdim" — manba tasdiqlanadi:

     ✔️ TUGATDIM — #1247 poz. 1
     Kesildi: 1.20 × 2.00

     Qayerdan kesdingiz?
       ⦿ Ostatkadan        ← rejadagi, oldindan tanlangan
       ○ Rulondan

     Qoldi:  [ 0.60 ] × [ 2.00 ]     ← tuzatish mumkin
       [ Ostatka ]   [ Chiqindi ]

              [ Tasdiqlash ]
```

**Usta odatda shunchaki "Tasdiqlash" bosadi** — bir bosish, qo'shimcha ish yo'q. Reja to'g'ri bo'lsa hech narsa o'zgartirilmaydi.

**Usta uch narsani o'zgartira oladi:**

| Nima | Qachon kerak |
|---|---|
| **Manba** — ostatka yoki rulon | Rejada ostatka turgan edi, u rulondan kesdi (yoki teskarisi) |
| **Qolgan bo'lak o'lchami** | Kesim egri chiqdi, cheti yaroqsiz. Egrilik uchun 5–10 sm tuzatish oddiy holat |
| **Ostatka yoki chiqindi** | Tizim taklifini bekor qilib o'zi tanlaydi |

**Aniq bo'lak raqami kuzatilmaydi.** Ostatkalar omborda alohida-alohida saqlanadi (o'lchamlari bilan), lekin usta qaysi birini olganini aytmaydi. Tizim o'lchami mos keladiganini o'zi topib hisobdan chiqaradi.

> Usta o'nlab bo'lak orasidan qaysi birini olganini har safar qayd etsa — bu ortiqcha ish va u baribir bajarmaydi. Muhimi manba: rulon kamaydimi yoki yo'qmi.

**Nima uchun manba muhim.** Usta ostatkadan kesgan bo'lsa, tizim rulondan yechmasligi kerak. Aks holda omborda rulon kamayadi, ostatka esa turaveradi — ikki-uch marta takrorlansa hisob butunlay buziladi.

**Ostatka bor turib rulon tanlansa — ogohlantirish:**

> *"Bu buyurtmaga mos ostatka bor edi (1.80 × 2.00). Baribir rulondan kesdingizmi?"*

Bloklamaydi — bo'lak iflos yoki yirtiq bo'lishi mumkin. Lekin qaror ongli bo'ladi va jurnalga yoziladi.

**Hisobot: "Ostatka turgan holda rulon ochildi"** (11.7.7). Bitta hodisa — tasodif. Oyiga o'n marta — ostatkalar yig'ilib qolayotgani va pul o'lik yotayotgani demak.

---

**Algoritm bo'lakni qanday topadi:**

**0. Birlashtirish.** Bitta buyurtmadagi bir xil matoli pozitsiyalar birga hisoblanadi.

> Uchta 210 × 140 alohida kesilsa — uchta mayda bo'lak. Birga kesilsa — 4.20 m tasma bir yo'la ochiladi va yonda bitta uzun bo'lak qoladi.

**1. Eni tekshiriladi.** Buyurtma eni ≤ bo'lak eni.

**2. Bo'yi tekshiriladi.**

**3. Burish yo'q.** Eni eniga, bo'yi bo'yiga. Bo'lak aylantirilmaydi.

**4. Bag'rikenglik 1 sm.** `0.90 × 1.40` bo'lakka `90.2 × 140` sig'adi, `91.5 × 140` sig'maydi.

**5. Tartib:** avval qoldiq kesma, keyin qisman ochilgan rulon, keyin yangi rulon.

**6. Bir necha mos variant bo'lsa — eng kam chiqindi qoldiradigani.**

> Buyurtma eni 140 sm, omborda 2 m va 3 m enli rulon bor. 2 m dan kesiladi (60 sm qoladi), 3 m dan emas (160 sm keraksiz maydalanadi).

**7. Hech qaysi bo'lakka sig'masa** — pozitsiya "Materialga kutmoqda" statusiga tushadi.

**Har kesim ombor tarixiga uch qator bo'lib yoziladi:**

```
Ostatkadan chiqdi  −3.60 kv.m    (1.80 × 2.00)
Qoldiq kesma       +1.20 kv.m    (0.60 × 2.00)
Chiqindi            0.00 kv.m
Mahsulotga ketdi    2.40 kv.m
```

Rulondan kesilgan bo'lsa birinchi qator boshqacha bo'ladi:

```
Rulondan chiqdi    −6.00 kv.m    (2.00 m tasma × 3.00 m eni)
Qoldiq kesma       +3.60 kv.m    (1.80 × 2.00)
```

Bo'lak yaroqsiz chiqsa — chiqindi qatoriga tushadi va **haqiqiy yo'qotish** bo'lib foyda-zarar hisobotiga yoziladi.

### 7.7. Buyurtma eni rulon enidan katta bo'lsa

Mijoz 3.5 m enli parda so'radi, eng keng rulon 3.0 m.

Tekshiruv **sotuv paytida** bo'ladi, "Tugatdim"da emas. Sotuvchi o'lchamni kiritayotganda ogohlantirish chiqadi va buyurtma ikkiga bo'lib rasmiylashtiriladi.

### 7.8. Tannarx

Tannarx **har kirim bilan birga yuradi**. Rulon va chiziqli materialda har bo'lak o'z kirimini biladi — R-118 kirim №44 dan kelgan bo'lsa, undan kesilgan mahsulotning tannarxi 78 000.

**Dona materialda bo'lak yo'q** — 380 ta kronshteyn o'nta kirimdan aralashgan. Shuning uchun **FIFO**: eng eski kirimdan boshlab yechiladi.

Foyda-zarar hisoboti eski sotuvlarni **o'sha paytdagi** tannarx bo'yicha hisoblaydi.

### 7.9. Kirim hujjati

Maydonlar: yetkazib beruvchi, hujjat raqami, sana, valyuta, kurs.

Jadval: material, miqdor, birlik, **eni**, **bo'yi**, narxi, summa, **defekt**, **defekt qayerga**.

Rulon uchun eni va bo'yi majburiy — har rulon alohida yozuv bo'lib omborga tushadi (R-118, R-119) va o'z o'lchami, tannarxi bilan saqlanadi.

**Defekt ikki yo'lga ketadi:**

| Yo'l | Nima bo'ladi |
|---|---|
| **Qaytariladi** | Omborga kirmaydi, yetkazib beruvchi qarzidan chegiriladi. Bizga zarar yo'q. |
| **O'zimizdan brakka** | Omborga kiradi va darhol hisobdan chiqariladi, sabab "yetkazib beruvchi defekti". Zarar bizda qoladi. |

**Brak qolgan materialning tannarxiga taqsimlanmaydi.** 10 shtanga 660 000 so'm, 1 tasi brak bo'lsa — tannarx 66 000 bo'lib qolaveradi (73 333 emas), 66 000 so'm esa "yetkazib beruvchi defekti" xarajati bo'lib hisobotga tushadi.

> Aks holda qaysi yetkazib beruvchi ko'p brak berayotgani hech qayerda ko'rinmaydi, tannarx esa sekin-asta o'sib boraveradi.

**Yetkazib beruvchi qaytarishni rad etsa** — avtomatik hech narsa bo'lmaydi. Gaplashuvdan keyin admin qo'lda "o'zimizdan brakka" ga o'tkazadi.

**Yetkazib beruvchi umuman yo'qolsa** (aloqaga chiqmaydi, kompaniya yopilgan) — admin qarzni **umidsiz** deb hisobdan chiqaradi. Sabab majburiy, summa "yetkazib beruvchi defekti" xarajatiga tushadi, audit jurnaliga yoziladi.

> Bu mijozning umidsiz qarzi bilan aynan bir xil mexanizm (6.10). Bir xil narsa uchun ikkita alohida yo'l yaratilmaydi. Avtomatik o'tkazish qilinmaydi — necha kundan keyin degan chegara har doim sun'iy chiqadi.

**To'lov muddati.** Yetkazib beruvchi kartochkasidagi standart muddat (masalan 30 kun) avtomatik qo'yiladi va kerak bo'lsa o'zgartiriladi. Muddat faqat ogohlantirish uchun, hech narsani bloklamaydi (9.4).

**Qo'shimcha xarajatlar.** Hujjatga alohida blok: turi (transport / bojxona / bojxona brokeri / yuk tashish / boshqa) va summa.

Xarajat qatorlarga **summa ulushi bo'yicha** taqsimlanadi va tannarxga qo'shiladi:

```
Mato        3 744 000  (75.2%)  →  +1 504 000
Karniz        594 000  (11.9%)  →  +  238 000
Kronshteyn    640 000  (12.9%)  →  +  258 000
            ─────────              ──────────
            4 978 000               2 000 000
```

> Og'irlik yoki hajm bo'yicha taqsimlash to'g'riroq bo'lardi, lekin har materialga og'irlik kiritish kerak bo'ladi va omborchi uni to'ldirmaydi. Summa ulushi 90% holatda yetarli.

**Transport tannarxga taqsimlanadi, brak esa taqsimlanmaydi.** Sabab boshqacha: transport haqiqiy tannarx, brak esa ko'rinishi kerak bo'lgan yo'qotish.

> Importda transport va boj 10–15% ni tashkil qiladi. Hisobga olinmasa foyda hisoboti doimo yuqori chiqadi va qaysi mato aslida foydali ekani noto'g'ri ko'rinadi.

**Ustama tekshiruvi.** Kirim saqlanganda har material uchun yangi tannarx bo'yicha ustama hisoblanadi va chegara bilan solishtiriladi (5.4).

Chegaradan past bo'lsa qizil ogohlantirish chiqadi va adminga bildirishnoma ketadi. **Bloklamaydi** — mol allaqachon kelgan, uni qaytarib bo'lmaydi. Admin narxni ko'tarish kerakligini o'z vaqtida biladi.

Saqlanganda: qoldiq oshadi, tannarx yangilanadi (qo'shimcha xarajatlar bilan), yetkazib beruvchi qarzi oshadi, to'lov qilinsa kassadan chiqim.

### 7.10. Hisobdan chiqarish (brak)

Omborda turgan material buzilganda: suv ketdi, rangi o'chdi, yirtildi, muddati o'tdi, yo'qoldi.

> Bu **uchinchi** brak turi. Yetkazib beruvchi defekti (7.8) va ishlab chiqarish braki (usta noto'g'ri kesgani) alohida yuritiladi.

**Kim qiladi:** omborchi o'zi saqlaydi, **admin tasdig'i kutilmaydi**.

**Majburiy maydonlar:** material, miqdor, sabab. Rulon yoki chiziqli materialda qaysi bo'lakdan ekani tanlanadi.

**Adminga xabar ketadi:**

```
Ombordan chiqarildi
Ko'k mato · to'r — 4.2 kv.m
Zarar: 327 600 so'm
Sabab: suv ketdi — "Rulon uchi ho'l bo'ldi, tom oqqan"
Omborchi: Anvar · 24.07.2026 14:20
```

**Keyin o'zgartirish:** omborchi yozuvni bekor qila oladi yoki miqdorini o'zgartira oladi. **Har o'zgarishda adminga yangi xabar** ketadi, eski qiymat jurnalda qoladi, yozuv tarixi to'liq ko'rinib turadi.

**Bekor qilish bloklanmaydi** — oradan kesim o'tgan bo'lsa ham. Qoldiq manfiyga tushishi mumkin, qizil bilan belgilanadi, adminga xabar ketadi va admin tuzatgunicha shunday turadi (2.5-invariant).

**Sabab ro'yxatida "Yetkazib beruvchi defekti — keyin topildi"** ham bor. Tanlanganda qo'shimcha maydon ochiladi: qaysi kirim hujjatidan va da'vo qilinadimi.

> Rulon ichidagi dog' faqat ochilganda ma'lum bo'ladi — bir oy o'tib. U paytda kirim hujjati allaqachon saqlangan.

Kassaga tegmaydi (pul harakati yo'q), foyda-zarar hisobotiga xarajat bo'lib tushadi. Audit jurnalida qoladi.

### 7.11. Material kartochkasi

Ma'lumot, qoldiq tarkibi, harakatlar tarixi.

Harakatlar tarixi — sana, turi, izoh, miqdor, oldingi qoldiq, keyingi qoldiq, kim. Turlari: kirim, sarflash, chiqindi, ishlab chiqarish braki, ombordan chiqarildi, korrektsiya, boshlang'ich qoldiq.

Qoldiq alohida saqlanmaydi — shu jadvalning yig'indisi (2.2-invariant).

### 7.12. Kirim hujjatini storno qilish

Xato kiritilgan kirim hujjati storno qilinadi. **Storno to'liq bo'ladi** — hujjatdagi barcha material qaytariladi, o'sha rulonlardan allaqachon kesilgan bo'lsa ham.

**Qoldiq manfiyga tushishi mumkin.** Bu ruxsat etilgan (2.5-invariant): storno qo'lda bajariladigan amal, avtomatik operatsiya emas. Manfiy qoldiq qizil bilan belgilanadi va admin tuzatgunicha shunday turadi.

**Kesilgan buyurtmalarga tegilmaydi.** Ular o'z tannarxi bilan qotib qolgan (2.3-invariant) — storno o'tgan oyning foydasini o'zgartirmaydi.

**Storno uch joyga birdan tegadi** — bitta atomar operatsiya, bittasi bajarilib ikkinchisi bajarilmasligi mumkin emas:

1. **Ombor** — qoldiq qaytariladi, manfiyga tushishi mumkin
2. **Yetkazib beruvchi qarzi** — kamayadi, qarz harakatiga teskari qator qo'shiladi
3. **Kassa** — to'langan bo'lsa pul qaytarilmaydi, balans **avansga** o'tadi va keyingi kirimda ishlatiladi

Adminga xabar ketadi va audit jurnaliga yoziladi: hujjat raqami, summa, kim storno qildi, sabab.

> Misol: kirim №44 da 2 rulon (60 kv.m). R-118 dan 2.94 kesilgan. Storno qilingach qoldiq −2.94 bo'ladi. Admin korrektsiya orqali to'g'ri kirimni kiritadi va qoldiq tiklanadi.

### 7.13. Sotilmagan tayyor mahsulot

Mahsulot yasalgan, mato allaqachon kesilgan va ombordan yechilgan. Mijoz olishdan bosh tortdi yoki buyurtmani bekor qildi. Jismonan mahsulot omborda yotibdi.

Bunday pozitsiya **"Sotilmagan tayyor mahsulot"** ro'yxatiga tushadi. Ikki yo'ldan keladi: **Qaytarilgan** yoki **Rad etilgan** (8.8, 8.10). Ro'yxatda: mahsulot turi, o'lchami (eni × bo'yi), qaysi matolardan, aksessuarlari, tannarxi, kelib chiqish sanasi va buyurtmasi.

**Ombor qoldig'iga tegilmaydi** — mato allaqachon yechilgan, uni qaytarib bo'lmaydi.

Sotuv ekranida **"Tayyordan tanlash"** orqali mos o'lchamli mahsulot qidiriladi va chegirma bilan sotiladi. Sotilgach ro'yxatdan chiqadi, tushum kassaga tushadi.

Uzoq turib qolgan mahsulotni admin **hisobdan chiqara oladi** — tannarx zarar bo'lib yoziladi, sabab majburiy.

> Bu to'liq tayyor mahsulot ombori emas — shunchaki qayerga qo'yishni bilmagan narsalarning ro'yxati. Aks holda ular tizimda umuman ko'rinmaydi va olti oydan keyin hech kim ularni eslamaydi.

---

## 8. BUYURTMA HAYOTI

### 8.1. Ekranlar

1. Buyurtmalar ro'yxati
2. Buyurtma kartochkasi
3. Qaytarish oynasi

### 8.2. Asosiy prinsip — buyurtmaning umumiy statusi yo'q

Bitta buyurtmada bir nechta pozitsiya bo'ladi va **har pozitsiya mustaqil harakat qiladi**. Biri topshirilgan, biri ishlab chiqarilmoqda, uchinchisi materialga kutmoqda bo'lishi mumkin.

Buyurtma darajasida yagona status **hisoblanmaydi**. Ro'yxatda tarkib qisqartirib ko'rsatiladi: *"3 tadan: 1 tayyor · 1 ishlab chiqarilmoqda · 1 materialga kutmoqda"*.

> Umumiy status eng orqada qolgan pozitsiyadan hisoblansa, ma'lumot yo'qoladi — sotuvchi bitta pozitsiya tayyor ekanini ko'rmaydi va mijozga ayta olmaydi.

### 8.3. Pozitsiya statuslari

| Status | Qachon | Keyingi qadam | Material |
|---|---|---|---|
| **Tasdiq kutmoqda** | Botdan kelgan, sotuvchi ko'rmagan | Sotuvchi tasdiqlaydi yoki bekor qiladi | Tegilmagan |
| **Tasdiqlangan** | Tasdiqlandi yoki saytdan kiritildi | Umumiy navbatga tushadi | Tegilmagan |
| **Materialga kutmoqda** | Usta ishga olmoqchi, material yetmadi | Kirim bo'lgach navbatga qaytadi | Tegilmagan |
| **Ishlab chiqarilmoqda** | Usta ishga oldi | Usta "Tugatdim" bosadi | Hali yechilmagan |
| **Tayyor** | Usta "Tugatdim" bosdi | Mijozga topshiriladi | **Yechildi**, ostatka yaratildi |
| **Topshirilgan** | Mijoz olib ketdi | Yopiq | Yechilgan |
| **Qaytarilgan** | Olib ketgan, keyin qaytardi | Yopiq | Yechilgan · 7.12 ga tushadi |
| **Rad etilgan** | Tayyor, mijoz olishdan bosh tortdi | Yopiq | Yechilgan · 7.12 ga tushadi |
| **Bekor qilingan** | Kesishdan oldin bekor qilindi | Yopiq | Tegilmagan, zarar yo'q |

### 8.4. Tasdiqlash

| Manba | Tasdiqlash |
|---|---|
| **Telegram bot** (mijoz bergan) | **Sotuvchi tasdiqlaydi.** Tasdiqlanmaguncha navbatga tushmaydi |
| **Sayt** (sotuvchi kiritgan) | Kerak emas. Darhol "Tasdiqlangan" holatida saqlanadi |

"Tasdiq kutmoqda" filtrida faqat botdan kelganlar chiqadi.

Tasdiqlanmagan buyurtma **avtomatik bekor bo'lmaydi**. 24 soatdan oshgani ro'yxatda qizil bo'lib ko'rinadi va sotuvchiga bildirishnoma ketadi.

### 8.5. Ishni taqsimlash

**Admin ustani taqsimlamaydi.** Tasdiqlangan pozitsiya umumiy navbatga tushadi va **usta botdan o'zi oladi**.

Har pozitsiya alohida ustaga ketishi mumkin. Stavka ham har pozitsiya uchun alohida hisoblanadi.

Kartochkadagi "Usta" ustuni ishga olingan paytda to'ladi.

**Ikki usta bitta pozitsiyani birga olsa** — birinchi so'rov oladi, ikkinchisiga "bu ish allaqachon olingan" qaytariladi. Xuddi "Tugatdim" dagi atomarlik (7.3).

### 8.6. Ishni ustadan qaytarib olish

Usta olgan ishini **o'zi tugatadi** — navbatga qaytarish huquqi yo'q.

Istisno: **admin ishni qaytarib ola oladi.** Usta ishdan bo'shadi, aloqaga chiqmayapti, uzoq kasal bo'lib qoldi.

- Faqat **"Ishlab chiqarilmoqda"** holatida. "Tugatdim" bosilgach mumkin emas — mahsulot allaqachon tayyor
- Pozitsiya **umumiy navbatga** qaytadi, boshqa usta o'zi oladi
- **Stavkani admin qo'lda kiritadi** — usta ishning bir qismini bajargan bo'lishi mumkin. Sabab majburiy
- Tarixga va ish haqi hisobiga yoziladi, adminning o'zi ham audit jurnalida qoladi

### 8.7. Tahrirlash

Pozitsiya **"Ishlab chiqarilmoqda" ga o'tmaguncha** tahrirlanadi: rang, o'lcham, aksessuar, narx.

O'tgandan keyin tahrirlash yo'q — pozitsiya bekor qilinadi va yangisi qo'shiladi. Sabab: usta allaqachon materialni ochgan bo'lishi mumkin.

Har tahrir harakatlar tarixiga **eski va yangi qiymati bilan** yoziladi.

**Tasdiqlangan buyurtmaga yangi pozitsiya qo'shish mumkin.** Mijoz ertasi kuni "yana bittasi kerak" desa — mavjud buyurtmaga qo'shiladi, yangi buyurtma ochilmaydi. Aks holda bitta mijoz, bitta manzil, ikkita chek bo'ladi.

### 8.8. Bekor qilish va rad etish

Bu **ikki alohida amal**.

**Bekor qilish** — faqat kesishdan oldin. Material tegilmagan, zarar yo'q, to'langan pul to'liq qaytariladi. Pozitsiya "Ishlab chiqarilmoqda" ga o'tgach tugma o'chadi.

**Rad etilgan** — mahsulot tayyor, mijoz olmadi: kelmay qo'ydi, telefon ko'tarmayapti, yoki "endi kerak emas" dedi. Mato allaqachon kesilgan. Mahsulot **7.12 ro'yxatiga** tushadi, pul qaytarishdagi tartibda qaytariladi.

**Mijoz kelmasa avtomatik hech narsa bo'lmaydi.** "Tayyor, topshirilmagan" filtrida yoshi bo'yicha ko'rinadi. Admin qaror qilsa "Rad etilgan" ga o'tkazadi.

**Storno bundan farq qiladi.** Bekor qilish — real biznes holati (mijoz fikridan qaytdi). Storno — xato: buyurtma umuman bo'lmagan, sotuvchi noto'g'ri kiritgan. Faqat admin qiladi va hisobotda alohida ko'rinadi.

### 8.9. Topshirish

**Qisman topshirish mumkin.** Uchtadan bittasi tayyor bo'lsa, mijoz shuni olib keta oladi. Qolganlari o'z holida qoladi.

- Qisman topshirishda **kvitansiya** chiqadi
- **Chek faqat buyurtma to'liq yopilganda**, bir marta — barcha pozitsiya va to'lovlar bilan

**Hisob-kitob varaqasi.** Chek bilan birga mijozga qog'ozda beriladi. Ichida:

- Sotuvlar tarixi — barcha buyurtmalari, sanasi va summasi bilan
- To'lovlar tarixi — qachon qancha to'lagan
- **Joriy balans** — so'm va dollar alohida

Bu saytdagi mijoz kartochkasining (6.7) chop etiladigan ko'rinishi. Mijoz o'z hisobini ko'radi va bahs chiqmaydi.

Buyurtma yopiladi, qachonki barcha pozitsiya "Topshirilgan", "Qaytarilgan", "Rad etilgan" yoki "Bekor qilingan" bo'lsa.

### 8.10. Qaytarish

**Pozitsiya darajasida ishlaydi.** Mijoz uchta pardadan bittasini qaytara oladi, butun buyurtmani qaytarish shart emas.

**Qaytarish muddati yo'q** — istalgan vaqtda qaytarilishi mumkin.

**Qaytariladigan summani sotuvchi o'zi kiritadi.** Tizim pozitsiya narxini taklif qiladi, sotuvchi mijoz bilan kelishib o'zgartiradi. Izoh majburiy.

> Ulush hisobi, foiz taqsimoti qilinmaydi. Mijoz pulni pozitsiyaga bo'lib bermaydi — u shunchaki "800 ming beray" deydi. Sotuvchi vaziyatni ko'rib o'zi kelishadi.

**Chegara yo'q** — sotuvchi 0 ham kirita oladi. Amal audit jurnaliga tushadi va adminga xabar ketadi.

Farq (pozitsiya narxi − qaytarilgan summa) kassada qoladi va hisobotda **"qaytarishdan ushlab qolindi"** deb alohida chiqadi.

**Pul qayerdan qaytariladi:** avval mijoz qarzidan chegiriladi. Qaytariladigan summa qarzdan ko'p bo'lsa — ortiqchasi uchun **sotuvchi tanlaydi**: kassadan naqd berish yoki avans bo'lib qolish.

Mijozsiz buyurtma (ko'chadan kelgan xaridor) qaytarilsa — qarz yo'q, hammasi kassadan naqd.

**Yopiq statusdan chiqish yo'q.** Qaytarilgan pozitsiya qayta qaytarilmaydi, xato bo'lsa storno.

Butun buyurtmani qaytarish uchun alohida amal yo'q — pozitsiyalar birma-bir qaytariladi, buyurtma o'z-o'zidan yopiladi.

### 8.11. Sifat muammosi va ishlab chiqarish braki

Qaytarish sabablari orasida "Sifat muammosi" ham bor va u **oddiy qaytarish** bo'lib qolaveradi — usta har qanday holatda haqini oladi.

Bu **ishlab chiqarish brakidan farq qiladi** (TZ 2.9). Brak — usta noto'g'ri kesganda, mijozga yetib bormasdan aniqlanadi: bot orqali qayta kesish so'rovi yuboriladi, admin tasdiqlaydi, material ikkinchi marta yechiladi, pozitsiya "Ishlab chiqarilmoqda" da qoladi.

### 8.12. Materialga kutish

Usta ishga olmoqchi bo'ldi, material yetmadi — pozitsiya avtomatik "Materialga kutmoqda" ga o'tadi.

Kirim bo'lgach pozitsiya **avtomatik "Tasdiqlangan" ga qaytadi** va umumiy navbatga tushadi. Ustaga va sotuvchiga bildirishnoma ketadi.

**Navbat tartibi aniq.** Kirim bo'lgach tizim mos bo'lakni **eng eski buyurtmaga** band qiladi (7.3).

> Bu qoida **o'zgartirilgan**. Avval band qilish yo'q edi va navbat tasodifiy edi.

### 8.13. Chegirma va valyuta

Chegirma belgilangan limitdan oshsa — ogohlantirish chiqadi, sotuvchi davom eta oladi, audit jurnaliga tushadi.

Buyurtma dollarda bo'lsa, to'lov so'mda qabul qilinganda **buyurtma yaratilgan paytdagi kurs** ishlatiladi. Kurs buyurtmada saqlanadi va keyin o'zgarmaydi (2.3-invariant).

### 8.14. Kartochka tuzilishi

**Sarlavha:** mijoz, turi va offseti, tayyorlik sanasi, manba, pozitsiyalar soni.
**Pul bloki:** hisoblangan, kelishilgan jami, chegirma, to'langan, qarz.
**Tugmalar:** chek, ish varaqasi, to'lov qabul qilish, izoh, bekor qilish.

**To'rtta tab:**

| Tab | Nima bor |
|---|---|
| **Pozitsiyalar** | Mahsulot, o'lcham, materiallar, narx, usta, status, amallar |
| **To'lovlar** | Sana, turi, usul, summa, valyuta, kim qabul qildi |
| **Harakatlar tarixi** | Kim nima qildi, eski va yangi qiymat bilan |
| **Izohlar** | Sotuvchi va admin yozuvlari |

### 8.15. Ro'yxat filtrlari

Bugungi · tasdiq kutmoqda · ishlab chiqarilmoqda · tayyor, topshirilmagan · muddati o'tgan · qarzi bor · materialga kutmoqda.

Ustunlar: chek №, sana, mijoz, manba, pozitsiyalar tarkibi, jami, to'langan, qarz, muddat, amallar.

### 8.16. Tayyorlik sanasi

Sana **buyurtma darajasida** bo'ladi, pozitsiya darajasida emas.

Hisobotda **buyurtma bir marta** sanaladi — pozitsiyalar bo'yicha emas. Kechikish kunlari eng kech tugagan pozitsiyadan hisoblanadi.

Sanasi kiritilmagan buyurtmalar bu hisobotga tushmaydi va alohida ustunda sanaladi (3.13).

---

## 9. YETKAZIB BERUVCHILAR

### 9.1. Ekranlar

1. Yetkazib beruvchilar ro'yxati
2. Qo'shish / tahrirlash
3. Kartochka
4. To'lov oynasi

### 9.2. Qarz modeli

Mijozlardagi model bilan **aynan bir xil**, faqat teskari yo'nalishda — biz qarzdormiz.

- **Balans saqlanmaydi**, u harakatlar yig'indisi (2.2-invariant)
- Tizimga o'tishda eski qarz **"Boshlang'ich qoldiq"** qatori bo'lib yoziladi
- **So'm va dollar alohida turadi**, hech qachon bitta summaga qo'shilmaydi
- Bitta yetkazib beruvchida **ikkala valyutada** qarz bo'lishi mumkin

**Qarz limiti yo'q.** Bu chegara ularning tomonida bo'ladi, bizniki emas.

**Avans mumkin.** Mol kelmasdan oldin pul o'tkazilsa balans musbat bo'ladi va keyingi kirim uni yeydi. Xitoydan mol olishda deyarli doim shunday.

Ro'yxatda avansdagi yetkazib beruvchilar **alohida filtrda** ko'rinadi — qarzdorlar bilan aralashtirilmaydi. Balans musbat va manfiy bo'lishi butunlay boshqa holatlar, bir ro'yxatda ular bir-birini yashiradi.

### 9.3. Ma'lumot maydonlari

**Asosiy:** nomi, nima yetkazadi, holati, izoh.

**Aloqa:** kontakt shaxs, telefon, qo'shimcha telefon, manzil.

**To'lov rekvizitlari:** bank nomi, hisob raqami, INN/STIR, MFO. To'lov oynasida avtomatik chiqadi.

**To'lov shartlari:** standart to'lov muddati kunlarda (masalan 30). Kirim hujjatida shu son avtomatik qo'yiladi va kerak bo'lsa o'zgartiriladi.

### 9.4. To'lov muddati — faqat ogohlantirish

Muddat yaqinlashsa ro'yxatda sariq, o'tib ketsa qizil bo'ladi va adminga bildirishnoma ketadi.

**Hech narsa bloklanmaydi** — mol baribir olinaveradi.

### 9.5. To'lov

**To'lov umumiy balansga tushadi va eng eski hujjatdan yopiladi.** Aniq hujjat tanlash kerak emas. Bitta to'lov bir nechta hujjatni yopishi mumkin.

**Kim qila oladi:** admin, sotuvchi, omborchi.

**Dollar qarzini so'mda to'lash mumkin.** To'lov oynasida valyuta "so'm" tanlanadi, kurs kiritiladi (joriy kurs avtomatik keladi, tahrirlanadi). Qarz `so'm ÷ kurs` bo'yicha kamayadi.

> Misol: 39 600 000 so'm, kurs 13 200 → qarzdan 3 000 $ yopiladi.

Saqlanganda: kassadan chiqim, qarz harakatiga qator, kirim hujjatining to'langan qismi oshadi, kurs farqi bo'lsa alohida yoziladi.

### 9.6. Kurs farqi

**Tannarx kirim kunidagi kursda so'mga qotiriladi va hech qachon o'zgarmaydi.** Qarz esa dollarda turaveradi.

To'lov paytida chiqadigan farq **alohida xarajat moddasi** bo'lib yoziladi — tannarxga tegmaydi:

```
Kirim   3 000 $ × 12 650 = 37 950 000  → tannarx (qotdi)
To'lov  3 000 $ × 13 200 = 39 600 000  → kassadan chiqdi
                           ──────────
Kurs farqi                  1 650 000  → xarajat
```

**Nega tannarxga qo'shilmaydi:** mahsulot allaqachon o'sha narxda sotilgan, o'tgan oyning hisoboti o'zgarmasligi kerak (2.3-invariant).

Kurs tushsa — bu **daromad** bo'ladi. U **alohida moddaga** yoziladi, xarajat moddasiga musbat qiymat qo'yilmaydi.

Foyda-zarar hisobotida ikkita alohida qator:

- **Kurs farqi — xarajat** (kurs ko'tarilgan holatlar)
- **Kurs farqi — daromad** (kurs tushgan holatlar)

> Bitta moddaga yig'ilsa, ular bir-birini yeb qo'yadi va yil davomida qancha yo'qotilgani ko'rinmay qoladi. Ajratilganda dollarda mol olishning haqiqiy narxi ko'rinadi.

### 9.7. Kartochka

**Yuqorida ikki blok:** qarzimiz (so'm, dollar, ochiq da'vo, eng yaqin muddat) va hamkorlik (hamkor bo'lgan sana, jami kirim, hujjatlar soni, brak ulushi, oxirgi kirim).

**Oltita tab:**

| Tab | Nima bor |
|---|---|
| **Qarz harakati** | Sana, sabab, summa, valyuta, oldingi va keyingi balans, kim. Birinchi qator — boshlang'ich qoldiq |
| **Kirimlar** | Hujjatlar: raqam, sana, tarkib, summa, to'langan, qoldi, to'lov muddati, holati |
| **To'lovlar** | Sana, usul, summa, valyuta, kurs, qaysi hujjatga tushdi, kim |
| **Materiallar** | Shu yetkazib beruvchidan keladigan materiallar va **narx tarixi** |
| **Brak va da'volar** | Ochiq da'volar va brak tarixi |
| **Izohlar** | — |

### 9.8. Narx tarixi

"Materiallar" tabida har material yonida **oxirgi uchta kirim narxi** va o'zgarish foizi ko'rsatiladi.

> Ko'k mato: 1 872 000 → 1 950 000 → 2 100 000, 8 oyda **+12.2%**

Bu ma'lumot boshqa hech qayerdan chiqmaydi. Qaysi material qimmatlashayotgani va qaysi yetkazib beruvchi narxni ko'targani faqat shu yerda ko'rinadi.

### 9.9. Ochiq da'volar

Kirimda "qaytariladi" deb belgilangan defekt hal qilinmaguncha shu tabda turadi (7.8).

Ikki tugma:
- **"Qabul qildi"** — qarzdan chegiriladi, da'vo yopiladi
- **"O'zimizga"** — material brakka chiqadi, zarar bizda qoladi

**Yetkazib beruvchi butunlay yo'qolsa** — admin qarzni umidsiz deb hisobdan chiqaradi. Sabab majburiy, summa "yetkazib beruvchi defekti" xarajatiga tushadi.

### 9.10. Holati

**Qarzimiz bor yetkazib beruvchini nofaol qilib bo'lmaydi** — qarz ro'yxatdan yo'qoladi. Mijozdagi bilan bir xil qoida (6.6).

Harakati bo'lmagan yozuv butunlay o'chiriladi, harakati bori nofaol qilinadi (2.1-invariant).

### 9.11. Kirim hujjatini keyin tahrirlash

Qo'shimcha xarajat (transport hisobi, bojxona to'lovi) ko'pincha moldan keyin keladi. Shuning uchun **saqlangan kirim hujjati tahrirlanadi** va tannarx qayta hisoblanadi.

**Sotilgan mahsulotlarga tegilmaydi.** Ular o'z tannarxi bilan qotgan (2.3-invariant) — o'tgan oyning foydasi o'zgarmaydi.

Yangi tannarx faqat **omborda qolgan** materialga qo'llanadi. Har tahrir audit jurnaliga eski va yangi qiymat bilan yoziladi.

### 9.12. Tizimda yo'q narsa

**Yetkazib beruvchiga buyurtma berish** degan tushuncha yo'q. Faqat kirim bor — mol kelganda yoziladi.

Shundan kelib chiqadi: "buyurtma berdik, hali kelmadi" holati kuzatilmaydi va yetkazib berish muddati hisoblanmaydi. Xarid ro'yxati 15.3-bandda.

---

## 10. XODIMLAR VA ISH HAQI

### 10.1. Ekranlar

1. Xodimlar ro'yxati
2. Xodim qo'shish / tahrirlash
3. Xodim kartochkasi
4. Stavka matritsasi
5. To'lov va balansni tuzatish

### 10.2. Xodim va foydalanuvchi — bitta yozuv

Xodim kartochkasi ayni paytda foydalanuvchi hisobi hamdir. Unda: shaxsiy ma'lumot, **rollar**, login va parol, Telegram ID, ish haqi usuli.

Alohida "foydalanuvchilar" ro'yxati yo'q.

- Sotuvchi va omborchi **saytga** kiradi — login va parol kerak
- Usta **botga** kiradi — login shart emas, Telegram ID yetarli
- Telegram ID bot `/start` bosilganda avtomatik to'ladi, qo'lda ham kiritiladi

### 10.3. Rollar — bir nechta bo'lishi mumkin

Xodimga **bir vaqtning o'zida bir nechta rol** berilishi mumkin: admin, sotuvchi, omborchi, usta. Ruxsatlar ularning yig'indisi bo'ladi.

> Kichik korxonada adminning o'zi omborchi ham bo'ladi. Bitta rol majburlansa, u ikkinchi hisob ochishga majbur bo'ladi va audit jurnalida ikki xil odam ko'rinadi.

Bu 1.2-bandni to'ldiradi: u yerda rollar sanalgan, lekin bitta odamda bir nechtasi bo'lishi aytilmagan edi.

### 10.4. Balans modeli

Mijoz va yetkazib beruvchi bilan **aynan bir xil** (2.2-invariant): balans saqlanmaydi, u harakatlar yig'indisi.

- Hisoblangan haq balansga **qo'shiladi**
- Olingan pul **ayiriladi**
- **Davr yo'q.** Xodim istalgan paytda so'raydi, balansidan yechiladi
- **Boshlang'ich qoldiq** — tizimga o'tishda eski haq birinchi qator bo'lib yoziladi

**Manfiy balans mumkin va bloklanmaydi.** Xodim ishlaganidan ko'p olsa (avans) yoki brak ushlansa balans manfiyga tushadi.

**Balansi 0 dan farq qiladigan xodimni nofaol qilib bo'lmaydi.** Ishdan bo'shagan xodimda manfiy balans qolsa — admin uni hisobdan chiqaradi, sabab majburiy, xarajatga tushadi.

### 10.5. Valyuta

Stavka so'mda ham, dollarda ham belgilanishi mumkin. **Balans qaysi valyutada hisoblangan bo'lsa, o'sha valyutada turadi.**

Pul berilayotganda o'sha kundagi kurs uriladi:

```
Balans 85 $. To'lov 660 000 so'm, kurs 13 200.
660 000 ÷ 13 200 = 50 $ balansdan yechiladi. Qoladi 35 $.
```

Kurs to'lov oynasida avtomatik keladi va o'zgartirilishi mumkin. Alohida "kurs farqi" moddasi yuritilmaydi.

### 10.6. Ish haqi usullari

Uch xil, boshqasi yo'q:

| Usul | Kimga | Qanday |
|---|---|---|
| **Oylik** | Sotuvchi, omborchi | Qat'iy summa, oy oxirida bir yo'la balansga qo'shiladi |
| **Ishiga qarab** | Usta | Har bajarilgan pozitsiya uchun, stavka matritsasi bo'yicha |
| **Hisoblanmaydi** | Egasi / admin | Balans yuritilmaydi |

Oy o'rtasida pul kerak bo'lsa **avans** beriladi — balans manfiyga tushadi va oy oxirida oylik uni yopadi.

### 10.7. Qo'shimcha foiz (KPI) — ixtiyoriy

Xodimga foiz qo'shilishi mumkin. **Bitta qoida bor:**

> Foiz **kassaga kelgan puldan** hisoblanadi. Pul kassaga kirgan payt yoziladi — mahsulot sotilgan payt emas.

Sozlamada ikkita maydon: **foiz** va **nimadan** (faqat o'z sotuvlaridan / butun kassa tushumidan). Bo'sh qolsa KPI yo'q.

**Nega aynan tushum:** bu qoida o'zini o'zi to'g'rilaydi va qo'shimcha shart yozishni talab qilmaydi.

- Chegirma berilsa → tushum kam → foiz kam
- Qarzga sotilsa → pul kelmagan → foiz yo'q. Keyin to'lansa o'sha payt qo'shiladi
- Qaytarilsa → pul chiqadi → foiz teskari yoziladi

Boshqa asoslar (pozitsiya soni, buyurtma soni, sotilgan summa) **ishlatilmaydi** — ularning har biri alohida istisno qoidalarini talab qiladi.

### 10.8. Usta stavkasi

Stavka **mahsulot turi bo'yicha** belgilanadi. Uch xil hisoblash usuli:

| Usul | Misol |
|---|---|
| **Qat'iy summa** | Zashitka — 15 000 so'm, o'lchamdan qat'i nazar |
| **Kv.metrga** | Plisse — 18 000 so'm/kv.m. `18 000 × 3.2 = 57 600` |
| **Bosqichli jadval** | Dikke — 1 kv.m gacha 1 $, 1–1.5 → 2 $, 1.5 dan yuqori → 3 $ |

Bosqichlar soni cheklanmagan.

**Chegaraga aynan teng qiymat quyi bosqichga kiradi:**

```
1.00 kv.m → 1 $
1.01 kv.m → 2 $
1.50 kv.m → 2 $
1.51 kv.m → 3 $
```

**Eng quyi bosqich minimal haq vazifasini bajaradi** — 0.3 kv.m lik kichkina parda ham ish talab qiladi.

### 10.9. Standart va alohida stavka

Matritsada **standart** stavka turadi va barcha ustaga qo'llanadi.

Xodim kartochkasida "alohida stavka" belgilanishi mumkin — o'sha xodim uchun alohida jadval ochiladi. **Belgilanmagan mahsulot turlariga standart qo'llanaveradi.**

> Bu naqsh butun tizimda takrorlanadi: standart qiymat + istisno. Ustama chegarasi (5.4), to'lov muddati (9.3) ham shunday.

### 10.10. Haq qachon hisoblanadi

Usta **"Tugatdim"** bosgan payt. Mahsulot mijozga topshirilishini kutmaydi.

> Mijoz umuman kelmasligi mumkin (8.8). Ish esa bajarilgan.

**Stavka o'sha paytda snapshot qilinadi.** Stavka keyin ko'tarilsa yoki tushirilsa, eski ishlar o'zgarmaydi (2.3-invariant) — o'tgan oyning ish haqi bugun qayta hisoblanmaydi.

### 10.11. Bir ishni ikki usta bajarsa

**Tizim haqni bo'lmaydi.** "Tugatdim" bosgan usta to'liq stavkani oladi.

Admin ishni birinchi ustadan qaytarib olgan bo'lsa (8.6) — unga **qo'lda summa kiritadi**. Ustalar o'zaro kelishuvi tizimning ishi emas.

### 10.12. Stavkasi belgilanmagan mahsulot turi

Yangi mahsulot turi yaratilganda stavka 0 bo'lib qoladi va tizim ogohlantiradi (4.9).

**Pozitsiya baribir navbatga tushadi** va usta uni oladi — ishlab chiqarish to'xtamaydi. Bajarilganda haq 0 hisoblanadi va adminga bildirishnoma ketadi:

> *"Jalyuzi vertikal stavkasi belgilanmagan — 2 ta pozitsiya bajarildi, haq 0"*

Admin keyin **balansni qo'lda tuzatish** orqali haqni qo'shadi.

### 10.13. Brak ushlanishi

Ishlab chiqarish braki (2.9) sodir bo'lganda ushlanish **har hodisada alohida hal qilinadi**: to'liq, qisman summa, yoki umuman yo'q.

Qat'iy qoida yo'q — mato nuqsonli chiqqan bo'lishi ham, usta e'tiborsizlik qilgan bo'lishi ham mumkin.

Qaror admin tomonidan **balansni tuzatish** orqali kiritiladi.

### 10.14. Balansni qo'lda tuzatish

**Faqat admin.** Sotuvchi va omborchi to'lov qila oladi, lekin balansni tuzata olmaydi.

Maydonlar: xodim, yo'nalish (+/−), **sabab** (bonus / jarima / brak ushlanishi / stavkasiz bajarilgan ish uchun haq / kelishilgan qo'shimcha to'lov / boshqa), summa, valyuta, **izoh — majburiy**.

**Kassaga tegmaydi** — pul harakati yo'q, faqat balans o'zgaradi.

Jarima va brak ushlanishi foyda-zarar hisobotida **ish haqi xarajatining kamayishi** bo'lib ko'rinadi, daromad sifatida emas.

Audit jurnaliga tushadi.

### 10.15. To'lov

**Kim qila oladi:** admin, sotuvchi, omborchi.

Saqlanganda: kassadan chiqim yoziladi (turi "Ish haqi"), balans harakatiga qator qo'shiladi, balans kamayadi.

**Balansdan ko'p berilsa bloklanmaydi** — bu avans hisoblanadi, balans manfiyga tushadi.

Xato bo'lsa o'chirilmaydi — storno.

### 10.16. Kartochka

**Ikki blok yuqorida:** balans (joriy, jami ishlagan, jami olgan, oxirgi to'lov) va ish ko'rsatkichlari (bu oy bajargan, o'rtacha kunlik, brak, ushlangan, eng ko'p yasagan mahsulot).

**Beshta tab:** balans harakati · bajarilgan ishlar · to'lovlar · brak tarixi · izohlar.

---

## 11. HISOBOTLAR VA DASHBOARD

### 11.1. Umumiy talablar

Har bir hisobotda:

- **Davr filtri** — bugun, hafta, oy, chorak, yil, ixtiyoriy oraliq
- **Kesim tanlash** — hisobotga qarab: sotuvchi, mahsulot turi, mijoz, material, usta
- **Jadval va grafik** birga
- **Excelga eksport**

Hisobotlar **hisoblanadi**, saqlanmaydi. Har ochilganda joriy ma'lumotdan yig'iladi.

Barcha hisobot **o'z paytidagi qiymatlar** bilan ishlaydi (2.3-invariant): o'tgan oyning foydasi bugungi narx yoki stavka o'zgargani uchun o'zgarmaydi.

### 11.2. Excel eksporti — ikki varaq

Har eksportda **ikkita varaq** bo'ladi:

| Varaq | Nima bor |
|---|---|
| **Yig'ma** | Ekrandagi jadval, grafik uchun tayyorlangan ma'lumot bilan |
| **Xom ma'lumot** | Har qator alohida, guruhlanmagan, filtrsiz |

> Sabab: foydalanuvchi baribir Excelda o'zicha kesib ko'radi. Faqat yig'ma bo'lsa, har yangi savolda tizimga qaytish kerak bo'ladi.

Eksportda hisobot nomi, davri, filtrlari va yaratilgan sana-vaqt sarlavhada ko'rsatiladi.

### 11.3. Dashboard

Bitta ekran, uch qator. **Ruxsatga qarab bloklar yashiriladi** — har rolga alohida ekran yasalmaydi.

**Birinchi qator — bugun**

Tushum · buyurtma soni · o'rtacha chek · kassadagi pul (naqd va karta alohida).

**Ikkinchi qator — diqqat talab qiladi**

Har biri raqam va havola. Bosilganda tegishli filtr bilan ro'yxat ochiladi.

- Tasdiq kutayotgan buyurtma *(24 soatdan oshgani qizil)*
- Muddati o'tgan buyurtma
- Materialga kutayotgan pozitsiya
- Kam qolgan material
- Ustamasi chegaradan past material
- Limitdan oshgan mijoz
- Yetkazib beruvchiga muddati o'tgan to'lov
- Ochiq da'vo

**Uchinchi qator — oylik trend**

Tushum grafigi (o'tgan oy bilan taqqoslab) · foyda · debitorlik va kreditorlik · top-5 mahsulot · top-5 mijoz.

### 11.4. Moliya hisobotlari

**11.4.1. Foyda-zarar**

`Tushum − tannarx − xarajatlar`. Davr bo'yicha, o'tgan davr bilan taqqoslab.

Xarajat moddalari: ish haqi, transport va bojxona, ombor braki, ishlab chiqarish braki, chiqindi, kurs farqi, yetkazib beruvchi defekti, umidsiz qarz, boshqa.

**Ish haqi hisoblangan paytda xarajatga tushadi** — usta "Tugatdim" bosgan kun, to'langan kun emas. Shunda mahsulot sotilgan oyda uning haqi ham o'sha oyda ko'rinadi.

Jarima va brak ushlanishi ish haqi xarajatini **kamaytiradi**, alohida daromad bo'lib yozilmaydi.

**11.4.2. Kassa oqimi**

Kirim va chiqim, turi va usuli (naqd/karta/bank) kesimida. Boshlang'ich va yakuniy qoldiq.

**11.4.3. Tushum**

Kunlik va oylik, sotuvchi hamda mahsulot turi kesimida.

**11.4.4. Xarajatlar**

Moddalar bo'yicha, davr taqqoslash bilan.

**11.4.5. Debitorlik**

Mijozlar qarzi, **yoshi bo'yicha guruhlangan**: 0–30, 30–60, 60–90, 90+ kun. So'm va dollar alohida ustunlarda.

**11.4.6. Kreditorlik**

Yetkazib beruvchilarga qarzimiz, to'lov muddati bo'yicha. Avansdagilar alohida.

**11.4.7. Kurs farqi**

Xarajat va daromad **alohida qatorlarda** (9.6). Yig'ib ko'rsatilmaydi.

### 11.5. Sotuv hisobotlari

**11.5.1. Sotuv dinamikasi** — davr bo'yicha, taqqoslash bilan.

**11.5.2. Mahsulot turi bo'yicha foyda**

Har mahsulot turi uchun: soni · tushum · tannarx · **birlik foyda** · umumiy foyda · **rentabellik %**.

> Bu "mahsulot bo'yicha sotuv" dan farq qiladi. Rollo eng ko'p sotiladi, lekin unda ikkita mato ketadi. Plisse kam sotiladi, lekin `MAYDON × 1.5` sarflaydi. Qaysi biri ko'proq foyda keltirishi faqat shu hisobotda ko'rinadi.

**11.5.3. Sotuvchi bo'yicha** — soni, tushum, o'rtacha chek, undirilgan qarz.

**11.5.4. Chegirmalar** — kim, qancha, qaysi buyurtmada. Limitdan oshganlar ajratilgan.

**11.5.5. Qaytarish va rad etish** — sabab kesimida, ushlab qolingan pul bilan.

**11.5.6. Sotuvchi erkinliklari**

Sotuvchida uchta chegarasiz erkinlik bor: narxni o'zgartirish (3.8), chegirma limitidan oshish (3.11), qaytarishda 0 gacha ushlab qolish (8.10).

Hammasi audit jurnaliga tushadi, lekin jurnal — ming qatorli oqim, uni hech kim o'qimaydi. Bu hisobot ularni sotuvchi kesimida yig'adi:

```
Sotuvchi   Chegirma      Limitdan oshgan   Narx o'zgartirdi   Ushlab qoldi
Malika     1 240 000     3 marta           18 pozitsiya       180 000
Aziz         320 000     0                  4 pozitsiya             0
```

Ayblov emas — farq ko'rinib tursin.

### 11.6. Mijozlar hisobotlari

**11.6.1. Mijozlar bazasi** — yangi, takroriy, uxlab qolgan. O'rtacha chek va xarid chastotasi.

**11.6.2. ABC tahlil** — tushumning 80% i qaysi mijozlardan kelayotgani.

### 11.7. Ombor hisobotlari

**11.7.1. Qoldiq va uning qiymati** — material bo'yicha, tannarx bo'yicha jami.

**11.7.2. Material harakati** — kirim, sarflash, chiqindi, brak. Davr bo'yicha.

**11.7.3. Kam qolgan va tugagan** — chegaradan past tushganlar.

**11.7.4. Chiqindi va brak** — material va sabab kesimida.

**11.7.5. Ustama eroziyasi**

Barcha materialning joriy ustamasi bitta jadvalda:

```
Material            Tannarx   Sotuv narxi   Ustama   Chegara
Alyuminiy karniz     30 815        35 000    13.6%      30%  ⚠
Ko'k mato            87 333       120 000    37.4%      30%
Kronshteyn            4 490         5 000    11.4%      30%  ⚠
```

Ustama chegarasi kirim paytida ogohlantiradi (7.8), lekin bir marta. Bu hisobot butun ro'yxatni ko'rsatadi va qaysi materialning narxini ko'tarish kerakligi bir ekranda ko'rinadi.

**11.7.6. Muzlab qolgan pul**

Uch joyda pul o'lik yotadi va alohida hech kim sanamaydi:

| Nima | Qayerdan |
|---|---|
| Ostatkalar | 7.4 — bo'laklar soni va tannarx qiymati |
| Sotilmagan tayyor mahsulot | 7.12 |
| Uzoq qimirlamagan material | 6 oydan beri harakat bo'lmagan pozitsiyalar |

Jami summa yuqorida ko'rsatiladi.

**11.7.7. Ostatka turgan holda rulon ochildi**

```
Sana     Usta      Buyurtma   Kesildi       Mos ostatka bor edi
11.08    Rustam    #1247      1.20 × 2.00   1.80 × 2.00
09.08    Sardor    #1244      1.40 × 1.80   2.50 × 1.84
```

Usta "Tugatdim" da manba sifatida rulonni tanlagan, lekin tizimda mos ostatka bor edi (7.6).

> Bitta hodisa — tasodif. Oyiga o'n marta — ostatkalar yig'ilib qolayotgani va pul o'lik yotayotgani demak. Bu 11.7.6 dagi "muzlab qolgan pul" ning sababini ko'rsatadi.

### 11.8. Ishlab chiqarish hisobotlari

**11.8.1. Usta unumdorligi** — bajarilgan pozitsiya soni, hisoblangan haq, o'rtacha kunlik, mahsulot turi kesimida.

**11.8.2. Ishlab chiqarish braki** — usta kesimida, zarar summasi va ushlangan summa bilan.

**11.8.3. Kechikkan buyurtmalar** — tayyorlik sanasidan o'tganlar, kechikish kunlari bilan.

**11.8.4. Navbat holati**

Ustalar ishni o'zlari oladilar, admin taqsimlamaydi (8.5). Shuning uchun navbat qanday harakat qilayotganini kuzatish kerak:

- Pozitsiya navbatda qancha kutdi — o'rtacha va eng uzun
- Hozir navbatda nechta, eng eskisi necha kunlik
- **Qaysi mahsulot turi uzoq kutmoqda**

Oxirgisi muhim: stavkasi past mahsulot navbatda yotib qoladi va buni odatda faqat mijoz shikoyat qilganda bilib qolinadi.

### 11.9. Ta'minot hisoboti

**11.9.1. Narx dinamikasi** — qaysi material qimmatlashayapti, qaysi yetkazib beruvchi ko'targan. 9.8-banddagi narx tarixining umumiy ko'rinishi.

### 11.10. Ruxsatlar

| Rol | Ko'radi |
|---|---|
| **Admin** | Hammasi |
| **Sotuvchi** | Sotuv, mijozlar, kassa oqimi. **Tannarx, foyda va ish haqi yo'q** |
| **Omborchi** | Faqat ombor hisobotlari |
| **Usta** | Hech narsa — botda o'z ishini va balansini ko'radi |

Dashboardda ham shu ruxsat ishlaydi: sotuvchi kirganda foyda va tannarx bloklari ko'rinmaydi.

### 11.11. Har sahifaning tepasida ko'rsatkichlar paneli

Hisobotlar alohida bo'limda turadi, lekin **eng kerakli raqamlar ish qilinayotgan sahifaning o'zida** bo'lishi kerak. Foydalanuvchi hisobot bo'limiga o'tishi shart emas.

**Har modul sahifasining tepasida panel bo'ladi.** Tuzilishi hamma joyda bir xil:

| Qator | Nima |
|---|---|
| **1 — Holat** | Hozir nima bor: qoldiq, balans, soni |
| **2 — Davr** | Bu oy nima bo'ldi, o'tgan davr bilan taqqoslab |
| **3 — Diqqat** | Harakat talab qiladigan narsalar, raqam va havola bilan |

**Uchinchi qator eng muhimi.** Har element bosilganda tegishli filtr bilan ro'yxat ochiladi. Foydalanuvchi muammoni izlamaydi — muammo o'zi ko'rinadi.

**Modul bo'yicha paneller:**

**Mijozlar** *(6-bo'lim)*
Holat: jami mijoz · jami qarz (so'm va dollar alohida) · muddati o'tgan qarz.
Davr: yangi mijoz · o'rtacha chek · takroriy mijoz % · o'rtacha to'lov muddati.
Diqqat: limitdan oshgan · muddati o'tgan · uxlab qolgan · Telegramsiz.

**Ombor** *(7-bo'lim)*
Holat: qoldiq qiymati · ostatkalar soni va qiymati · sotilmagan tayyor mahsulot.
Davr: kirim summasi · sarflangan tannarx · chiqindi va brak.
Diqqat: kam qolgan · tugagan · ustamasi chegaradan past · 6 oy qimirlamagan.

**Buyurtmalar** *(8-bo'lim)*
Holat: ochiq buyurtma · ishlab chiqarilmoqda · tayyor, topshirilmagan.
Davr: buyurtma soni · tushum · o'rtacha chek · qaytarish %.
Diqqat: tasdiq kutmoqda · muddati o'tgan · materialga kutmoqda · navbatda uzoq turgan.

**Yetkazib beruvchilar** *(9-bo'lim)*
Holat: jami qarzimiz (so'm va dollar) · avansdagilar.
Davr: kirim summasi · o'rtacha brak %.
Diqqat: muddati o'tgan to'lov · muddati yaqin · ochiq da'vo.

**Xodimlar** *(10-bo'lim)*
Holat: xodim soni · jami balans · manfiy balansdagilar.
Davr: hisoblangan haq · to'langan · brak ushlanmalari.
Diqqat: manfiy balans · uzoq to'lanmagan · bot ulanmagan · stavkasiz bajarilgan ish.

**Kassa** *(12.16)*
Yuqorida batafsil yozilgan.

**Qoida:** panel **hisoblanadi**, saqlanmaydi. Ruxsatga bo'ysunadi — sotuvchiga tannarx va foyda ko'rinmaydi (11.10).

### 11.12. Keyinroqqa qoldirilgan

**Kunlik yopish varaqasi** — kun oxirida bitta sahifa: bugun nima bo'ldi, kassada qancha bo'lishi kerak, nima ochiq qoldi. Chop etib qo'yish uchun.

Bu inventarizatsiyaning kichik ko'rinishi va 15.4-bandga qarang.

---

## 12. KASSA

### 12.1. Asosiy prinsip: xarajat ≠ kassa chiqimi

Bu ikkisi butunlay boshqa narsa va aralashtirilsa **bir xil pul ikki marta hisoblanadi**.

**Pul chiqmaydi, lekin xarajat bo'ladi:** ombor braki · chiqindi · ishlab chiqarish braki · umidsiz qarz · **hisoblangan** ish haqi · yetkazib beruvchi defekti · xodimga jarima · kurs farqi.

**Pul chiqadi, lekin xarajat emas:** yetkazib beruvchiga to'lov *(mol allaqachon tannarxga kirgan)* · xodimga ish haqi to'lovi *(haq allaqachon "Tugatdim" da xarajat bo'lgan)* · egasi pul olishi · ayirboshlash · kassalar orasidagi ko'chish.

> Usta 70 000 ishlab topdi → xarajat yozildi. Bir hafta o'tib pul berildi → kassadan 70 000 chiqdi. Ikkalasi xarajat deb sanalsa 140 000 chiqadi, aslida 70 000.

**Qoida:** foyda-zarar hisoboti **xarajat jurnalidan** yig'iladi, kassadan emas. Kassa oqimi alohida hisobot (11.4.2).

### 12.2. Kassa tuzilishi

Kassa bitta emas — har sotuvchining o'z kassasi bor va asosiy admin kassasi:

```
ADMIN KASSASI              SOTUVCHI KASSASI (har sotuvchiga o'ziniki)
  ├── naqd so'm              ├── naqd so'm
  ├── naqd dollar            └── naqd dollar
  └── karta (so'm)
```

**Karta to'lovi qaysi sotuvchi sotgan bo'lsa ham to'g'ridan-to'g'ri admin kassasiga tushadi** va u yerda "kartadagi pul" bo'lib alohida turadi. Pul sotuvchining qo'lida turmaydi — u bankka boradi.

Sotuvchi faqat **naqd**ni ushlab turadi va faqat naqdni topshiradi.

So'm va dollar har kassada alohida hisoblanadi va hech qachon bitta summaga qo'shilmaydi (1.3-band).

**Boshlang'ich qoldiq.** Tizimga o'tishda har kassaning mavjud puli birinchi harakat bo'lib yoziladi (2.2-invariant).

### 12.3. Har yozuv manbaga bog'lanadi

Takrorlanishning oldini olish uchun har kassa yozuvida ikkita majburiy maydon bo'ladi: **manba turi** va **manba ID**.

```
kirim   · buyurtma_tolovi   · 1247 · qator 1 · naqd   500 000
kirim   · buyurtma_tolovi   · 1247 · qator 2 · karta  300 000
chiqim  · yetkazib_tolov    · TB-14 ·         bank  3 000 000
chiqim  · ish_haqi          · XOD-3 ·         naqd    940 000
chiqim  · operatsion        · —     ·         naqd    450 000
```

**`(manba turi, manba ID, qator)` uchligi takrorlanmasligi kerak** — bu bazada bloklanadi.

Shunda hech qanday tasdiqlash, tugmani qayta bosish yoki sahifani yangilash ikkinchi yozuv yarata olmaydi.

Qo'lda kiritilgan yozuvda manba "qo'lda" bo'ladi va u hech qaysi modulga ta'sir qilmaydi.

**Storno ham shu qoidaga bo'ysunadi:** bitta yozuvga bitta storno, ikkinchisi bloklanadi.

### 12.4. Tasdiqlash hech qachon pul yaratmaydi

Tizimda ikki bosqichli hodisalar bor: botdan kelgan buyurtmani sotuvchi tasdiqlaydi (8.4), qayta kesish so'rovini admin tasdiqlaydi (2.9), sotuvchining topshirig'ini admin tasdiqlaydi (12.6).

**Har uchalasida ham tasdiqlash faqat statusni o'zgartiradi.** Pul yoki material hodisasi **bitta joyda** tug'iladi — so'rov paytida yoki tasdiq paytida, ikkalasida emas.

Qaysi joyda tug'ilishi har hodisada aniq belgilangan:

| Hodisa | Pul/material qachon qimirlaydi |
|---|---|
| Bot buyurtmasi tasdiqlanishi | Hech qachon — to'lov alohida hodisa |
| Qayta kesish so'rovi | Admin tasdiqlaganda material yechiladi |
| Sotuvchi topshirig'i | Admin tasdiqlaganda pul ko'chadi |

### 12.5. Kassaga KIRIM

| Kod | Hodisa | Qayerdan | Qaysi kassaga |
|---|---|---|---|
| K1 | Buyurtma to'lovi — sotuv paytida | Sotuv ekrani (3.12) | Sotgan sotuvchi · karta bo'lsa admin |
| K2 | Buyurtma to'lovi — topshirishda yoki keyin | Buyurtma kartochkasi (8.9) | Qabul qilgan sotuvchi |
| K3 | Mijoz qarzini to'lash | Qarzni to'lash oynasi (6.9) | Qabul qilgan sotuvchi |
| K4 | Mijoz avansi | Sotuv / kassa | Qabul qilgan sotuvchi |
| K5 | Hisobdan chiqarilgan qarz qaytdi | Kassa — "boshqa kirim" (6.10) | Qabul qilgan |
| K6 | Egasi pul qo'shdi | Kassa | **Faqat admin** |
| K7 | Sotuvchidan topshiriq | Topshiriq tasdig'i (12.6) | Admin |
| K8 | Boshlang'ich qoldiq | Import | Har kassa |
| K9 | Boshqa kirim | Kassa, izoh majburiy | Kim kiritsa |

### 12.6. Kassadan CHIQIM

| Kod | Hodisa | Qayerdan | Qaysi kassadan |
|---|---|---|---|
| C1 | Yetkazib beruvchiga to'lov | To'lov oynasi (9.5) | Kim to'lasa |
| C2 | Yetkazib beruvchiga avans | To'lov oynasi (9.2) | Kim to'lasa |
| C3 | Transport / bojxona to'lovi | Kirim hujjati (7.8) | **Admin** |
| C4 | Ish haqi to'lovi | Xodim kartochkasi (10.15) | Kim bersa |
| C5 | Xodimga avans | Xodim kartochkasi | Kim bersa |
| C6 | Mijozga qaytarish — naqd qismi | Qaytarish oynasi (8.10) | Rasmiylashtirgan sotuvchi |
| C7 | Operatsion xarajat | Kassa | Kim kiritsa |
| C8 | Egasi pul oldi | Kassa | **Faqat admin** |
| C9 | Adminga topshiriq | Topshiriq (12.7) | Sotuvchi |
| C10 | Boshqa chiqim | Kassa, izoh majburiy | Kim kiritsa |

**C3 bo'yicha muhim istisno:** transport yoki bojxonani **yetkazib beruvchining o'zi to'lasa** — kassadan hech narsa chiqmaydi. Summa uning hisobiga kiradi va qarz bo'lib yoziladi. Kassa chiqimi faqat biz to'g'ridan-to'g'ri to'laganda bo'ladi.

### 12.7. Sotuvchidan adminga pul topshirish

Ikki bosqichli hodisa:

```
1. Sotuvchi "Topshirdim" belgilaydi  → yozuv yaratiladi, holati "kutilmoqda"
2. Adminga tasdiqlash boradi
3. Admin tasdiqlaydi                  → PUL KO'CHADI (bir marta, shu yerda)
```

**Pul tasdiqlangunicha sotuvchi kassasida turadi.** Admin tasdiqlaganda sotuvchi kassasidan chiqadi va admin kassasiga kiradi — bu bitta atomar ko'chish, ikkita alohida yozuv emas.

**Admin rad eta oladi** (summa mos kelmadi) — yozuv "rad etilgan" bo'ladi, pul qimirlamaydi, sotuvchi qaytadan belgilaydi.

So'm va dollar **alohida topshiriladi**.

`(topshiriq, ID)` takrorlanmaydi — sotuvchi tugmani necha marta bossa ham bitta yozuv.

### 12.8. Admindan sotuvchiga pul berish

Teskari yo'nalish: ertalab qaytim uchun boshlang'ich naqd.

**Tasdiqlash yo'q — pul darhol ko'chadi.** Admin berayotganda ikkalasi bir joyda turadi, tasdiqlash ortiqcha bosqich bo'lardi.

### 12.9. Ayirboshlash

Valyuta yoki shakl almashtirish. **Faqat admin** qila oladi.

| Nimadan | Nimaga |
|---|---|
| Naqd dollar | Naqd so'm |
| Naqd so'm | Naqd dollar |
| Karta | Naqd so'm |

**Maydonlar:** nimadan · nimaga · summa · **kurs** (sozlamadagi qiymat taklif qilinadi, input ichida o'zgartiriladi) · **komissiya** (summa yoki foiz) · izoh.

```
1 000 $ → so'm, kurs 13 200 = 13 200 000
bank komissiyasi 0.5%        =     66 000
kassaga kirdi                = 13 134 000
```

```
Kartadan 5 000 000 naqd yechildi
bank komissiyasi 1%          =     50 000
naqdga kirdi                 =  4 950 000
```

**Ayirboshlash kirim ham, chiqim ham emas** — ichki ko'chish. Foydaga ta'sir qilmaydi.

**Faqat komissiya real yo'qotish.** U alohida xarajat moddasiga tushadi: **"Bank komissiyasi va ayirboshlash"**. Kurs farqi (9.6) bilan aralashtirilmaydi — bu boshqa narsa.

**Bitta atomar yozuv.** Ikkita alohida yozuv qilinsa, bittasi storno qilinib ikkinchisi qolib ketishi mumkin.

### 12.10. Operatsion xarajatlar

Ijara, kommunal, internet, yoqilg'i, ta'mirlash, soliq, reklama, xo'jalik mollari, boshqa.

**Sotuvchi ham kirita oladi, chegara yo'q.** Admin barcha sotuvchilarning xarajatlarini ro'yxatda ko'rib turadi.

Maydonlar: modda · summa · valyuta · usul · **izoh majburiy** · chek rasmi (ixtiyoriy).

Moddalar ro'yxatini admin boshqaradi — yangisini qo'shadi, keraksizini nofaol qiladi.

Bu **haqiqiy xarajat**: kassadan ham chiqadi, foyda-zarar hisobotiga ham tushadi.

### 12.11. Egasi pul olishi va qo'shishi

**Faqat admin kassasidan.** Sotuvchi kassasidan olinmaydi.

**Xarajat emas** — foydaga ta'sir qilmaydi. Faqat kassa qoldig'ini o'zgartiradi va kassa oqimi hisobotida ko'rinadi.

Yozilmasa kassa hech qachon to'g'ri chiqmaydi.

### 12.12. Kassaga TEGMAYDIGAN hodisalar

Bu ro'yxat aniq bo'lishi shart — aks holda dasturchi ularni ham kassaga yozadi:

Chegirma · qarzga sotish · kirim hujjatining o'zi · defektni qarzdan chegirish · ombor braki · chiqindi · ishlab chiqarish braki · umidsiz qarz · xodim balansini tuzatish · **hisoblangan** ish haqi · kurs farqi · kirim stornosidan keyingi avans · qaytarishda **qarzdan chegirilgan** qism · qaytarishda **ushlab qolingan** summa.

**Oxirgi ikkitasi alohida e'tibor talab qiladi:**

**Qaytarishda qarzdan chegirilgan qism.** Qaytarish 230 000, mijoz qarzi 550 000 — hammasi qarzdan chegiriladi, naqd berilmaydi. Kassaga hech narsa yozilmaydi. **Faqat haqiqatan qo'ldan chiqqan pul kassaga tushadi.**

**Ushlab qolingan summa.** Pozitsiya 288 000, qaytarildi 230 000, farq 58 000. Bu 58 000 hech qayerdan **kelmagan** — shunchaki kamroq chiqdi. U hisobot qatori, kassa kirimi emas.

### 12.13. Ekranlar

1. **Kassa kitobi** — ko'rsatkichlar paneli, barcha harakat, filtr va yuguruvchi qoldiq
2. **Kirim** — turi tanlanadi, manba bog'lanadi
3. **Chiqim** — turi tanlanadi
4. **Ayirboshlash** — modal oyna, faqat admin
5. **Topshiriq** — sotuvchi belgilaydi, admin tasdiqlaydi
6. **Kun yopish** — sanash va farqni qayd etish
7. **Storno** — admin, sabab majburiy

### 12.14. Ruxsatlar

| Rol | Ko'radi | Qila oladi |
|---|---|---|
| **Admin** | Barcha kassa | Hammasi |
| **Sotuvchi** | **Faqat o'z kassasi** | Kirim, chiqim, xarajat, topshiriq |
| **Omborchi** | O'z kassasi (bo'lsa) | Yetkazib beruvchiga to'lov, ish haqi to'lovi |
| **Usta** | Ko'rmaydi | — |

Sotuvchi boshqa sotuvchining kassasini ko'rmaydi.

### 12.15. Storno

Kassa yozuvi **o'chirilmaydi**. Xato bo'lsa admin storno qiladi — teskari yozuv qo'shiladi, asli joyida qoladi (2.1-invariant).

Storno manba modulga ham qaytadi: buyurtma to'lovi storno qilinsa mijozning qarzi tiklanadi, ish haqi to'lovi storno qilinsa xodim balansi tiklanadi.

**Bitta yozuvga bitta storno.** Ikkinchisi bloklanadi.

### 12.16. Kassa sahifasining tepasi

Ikki qator: **qoldiq** va **oqim**. Undan keyin diqqat blokchasi.

**Qator 1 — hozir kassada nima bor**

```
Naqd so'm         12 480 000     Naqd dollar        1 240 $
Kartada            8 300 000     ┌──────────────────────────┐
                                 │ Sotuvchilarda   4 150 000│
Admin jami        20 780 000     │   Malika  2 800 000      │
                                 │   Aziz    1 350 000      │
                                 └──────────────────────────┘
```

**Sotuvchilardagi pul alohida ko'rsatiladi va admin summasiga qo'shilmaydi.** U pul admin qo'lida yo'q va uni sanab bo'lmaydi.

> Ko'p tizim shu joyda adashadi: jami raqam chiroyli chiqadi, lekin seyfda o'shancha pul yo'q.

**Qator 2 — bugun**

```
Kirim   4 200 000    Chiqim  1 850 000    Farq  +2 350 000
```

Yoniga kichik qatorda taqsimot: naqd 2 900 000 · karta 1 300 000. Kun oxirida sanaladigan narsa faqat naqd.

**Diqqat blokchasi** — har biri raqam va havola:

- Tasdiqlanmagan topshiriq — soni va summasi
- Kechagi kun yopilmagan
- Sotuvchida uzoq turib qolgan pul (3 kundan ortiq topshirilmagan)
- Yetkazib beruvchiga muddati o'tgan to'lov
- Chekssiz xarajatlar — bu oyda

### 12.17. Kun yopish

Kassaning yuragi. Har sotuvchi o'z kassasini yopadi.

```
KUN YOPISH — 14.08.2026 · Malika

Ertalabki qoldiq                    850 000
Kirim                             4 200 000
  sotuv naqd        2 900 000
  qarz to'lash        800 000
  boshqa              500 000
Chiqim                            1 850 000
  qaytarish           230 000
  xarajat             620 000
  adminga topshirdi 1 000 000
                                 ──────────
TIZIM BO'YICHA BO'LISHI KERAK     3 200 000

Haqiqatda sanadim              [ 3 150 000 ]
                                 ──────────
FARQ                                −50 000
Izoh (majburiy)  [ ............................ ]
```

**Farq bo'lsa izoh majburiy, lekin yopish bloklanmaydi.** Sotuvchini uyiga qo'ymay turib bo'lmaydi. Farq qayd etiladi va hisobotga tushadi.

**Yopilgan kunga orqadan yozuv qo'shib bo'lmaydi.** Aks holda kechagi farqni bugun "tuzatib" qo'yish mumkin bo'ladi va butun mexanizm ma'nosini yo'qotadi.

Kerak bo'lsa **admin kunni qayta ochadi** — sabab majburiy, audit jurnaliga tushadi.

**Kun yopish majburiy emas** — yopilmagan kun bo'lsa ham sotuvchi ertasi kuni ishlay oladi. Yopilmagan kunlar diqqat blokchasida ko'rinib turadi.

**Admin kassasida faqat naqd qismi yopiladi.** Kartadagi pulni sanab bo'lmaydi — u bank hisobidan tekshiriladi.

**Farqlar hisoboti** sotuvchi kesimida yig'iladi:

```
Sotuvchi   Yopilgan kun   Farq bo'lgan   Jami farq
Malika              22             3      −140 000
Aziz                22             0             0
```

> Bitta farq — tasodif. Uch oyda o'n besh marta — boshqa narsa.

### 12.18. Kassa kitobi

**Ustunlar:** sana-vaqt · kassa · turi · manba · izoh · kirim · chiqim · **yuguruvchi qoldiq** · kim · holati.

**Yuguruvchi qoldiq ustuni majburiy.** Usiz "ayni shu yozuvdan keyin qancha edi" degan savolga javob yo'q va farqni izlash imkonsiz bo'ladi.

**Filtrlar:** davr · kassa · turi · usul (naqd/karta) · valyuta · kim · summa oralig'i · **faqat storno** · **faqat qo'lda kiritilgan**.

Oxirgi ikkitasi tekshirish uchun eng kerakli filtr.

**Har qatorda manba havolasi** — "buyurtma №1247" bosilsa o'sha buyurtma ochiladi. Kassadan hodisaga qaytish yo'li doim ochiq bo'lishi kerak.

**Ixtiyoriy sanaga kesim.** "1-avgust kuni soat 18:00 da qancha edi?" — nizolarni hal qilishning yagona yo'li.

### 12.19. Qo'shimcha mexanizmlar

**Xarajat cheklari.** Har xarajatga rasm biriktiriladi. Chek yo'q bo'lsa qatorda belgi turadi va oy oxirida "chekssiz xarajat — 1 240 000" degan raqam ko'rinadi.

**Takroriy xarajatlar.** Ijara, internet, kommunal — har oy bir xil. Shablon: nomi, summa, kuni. Belgilangan kunda eslatma chiqadi, admin bosib tasdiqlaydi.

**Avtomatik yozilmaydi** — summa o'zgarishi mumkin va yozilib qolgan xarajat kassani buzadi.

**Yaxlitlash.** 1 386 400 so'mlik chekka mijoz 1 386 000 beradi. 400 so'm alohida moddaga yoziladi — **"yaxlitlash"**.

Chegara: **1 000 so'mgacha** sotuvchi o'zi yaxlitlaydi. Undan yuqorisi chegirma bo'lib yoziladi va chegirma qoidalariga bo'ysunadi (3.11).

> Alohida modda bo'lmasa, kun oxirida har safar mayda farq chiqadi va sotuvchi uni izlab o'tiradi.

### 12.20. Bu bandlarda qabul qilingan qarorlar

Quyidagilar muhokamada aniq javob olmagan va shu hujjatda birinchi marta belgilanmoqda. Kerak bo'lsa o'zgartiriladi:

| Nima | Qabul qilingan |
|---|---|
| Kun yopish majburiymi | **Yo'q** — yopilmagan kun ishlashga to'sqinlik qilmaydi |
| Admin kassasi yopiladimi | **Faqat naqd qismi** |
| Kunni kim qayta ocha oladi | **Faqat admin**, sabab majburiy |
| Yaxlitlash chegarasi | **1 000 so'm**, undan yuqorisi chegirma |

---

## 13. TELEGRAM BOT

### 13.1. Umumiy tuzilish

**Bitta bot dasturi, uchta panel.** `/start` bosilganda Telegram ID xodimlar bazasida tekshiriladi:

| Kim | Panel |
|---|---|
| Xodim, roli **usta** | Usta paneli |
| Xodim, roli **admin** | Admin paneli |
| Boshqa hamma | Mijoz paneli |

Xodimda bir nechta rol bo'lsa (10.3) — panellar orasida almashish tugmasi chiqadi.

**Sotuvchi uchun bot yo'q** — u saytda ishlaydi.

**Bot hech qachon yagona interfeys emas.** Har bir botdagi amalning saytda ham muqobili bor. Bot tezlik uchun, almashtirish uchun emas.

### 13.2. Mijoz boti — ro'yxatdan o'tish

```
/start
  ↓
👋 Assalomu alaykum! Jalyuzi buyurtma botiga xush kelibsiz.
   Buyurtma berish uchun ro'yxatdan o'ting.
  ↓
Ism — Telegramdan olinadi, tasdiqlash so'raladi
  ↓
Telefon — "Telefon raqamni ulashish" TUGMASI orqali
  ↓
✅ Ro'yxatdan o'tdingiz
```

**Telefon qo'lda yozilmaydi** — faqat Telegram tugmasi orqali. Shunda raqam haqiqiy bo'ladi.

**Mijoz bazaga yoziladi** (6-bo'lim), Telegram ID bog'lanadi.

**Dublikat tekshiruvi faqat telefon bo'yicha ishlaydi.** Telefon topilsa — mavjud mijozga bog'lanadi, yangisi yaratilmaydi.

> TZ 6.5-band ism bo'yicha ham bloklaydi. Botda bu qoida **qo'llanmaydi**: Telegram ismlari doim takrorlanadi ("Aziz", "Dilshod") va ikkinchi "Aziz" bazaga umuman tusha olmasdi.

Ism keyin sotuvchi tomonidan to'g'rilanadi.

### 13.3. Mijoz boti — menyu

| Tugma | Vazifasi |
|---|---|
| 🛒 Katalog | Matolar rasm va narx bilan |
| 📝 Buyurtma berish | Bosqichma-bosqich |
| 📋 Buyurtmalarim | Tarix va holat |
| 💰 Balansim | Qarz va to'lovlar |
| 📞 Bog'lanish | Aloqa ma'lumotlari |

**Katalog:** mahsulot turi tanlanadi, keyin o'sha turning matolari chiqadi. Narx bo'yicha **arzondan qimmatga** saralanadi. 10 tadan ko'p bo'lsa paginatsiya.

Har matoda: rasm · nomi · **shu mijoz uchun narx** (offset qo'llangan).

### 13.4. Mijoz boti — buyurtma oqimi

Oqim **konstruktordan** quriladi (4-bo'lim), qat'iy emas. Yangi mahsulot turi qo'shilsa botda avtomatik paydo bo'ladi.

```
1. Mahsulot turi tanlash          → Rollo, Kombo, Plisse, Dikke, Zashitka
2. Har SLOT uchun mato tanlash    → slotlar konstruktorda belgilangan (4.4)
                                     Rollo: old mato → orqa mato
                                     Dikke: oq chet → ko'k chet → ko'k o'rta
3. Eni kiritish (sm)
4. Bo'yi kiritish (sm)
5. Ixtiyoriy aksessuarlar         → majburiylari avtomatik, ko'rsatiladi
6. Xona / izoh (ixtiyoriy)
7. Savatga qo'shish yoki tasdiqlash
```

**Savat bor** — bitta buyurtmada bir nechta pozitsiya (3.9). "Yana qo'shish" tugmasi 1-bosqichga qaytaradi.

**Validatsiya:** 0, manfiy yoki harf → *"Noto'g'ri o'lcham, qaytadan kiriting"*.

**Slotda faol mato qolmagan bo'lsa** → *"Bu mahsulot uchun hozircha mato yo'q"* va boshqa turga o'tish taklif qilinadi.

**"Orqaga"** — bir bosqich orqaga. **"Bekor qilish"** — butun savat tozalanadi, tasdiq so'raladi.

### 13.5. Mijoz boti — narx

**Aniq narx ko'rsatiladi**, taxminiy emas.

Hisob TZ 3.8 formulasi bo'yicha: `Σ(slot sarflashi × slot matosi narxi) + Σ(aksessuar) + xizmat haqi`.

**Mijozning offseti qo'llanadi** (6.3). Offseti bo'lmagan mijozga standart narx.

Yaxlitlash butun so'mgacha, tiyin yo'q.

**Sotuvchi tasdiqlayotganda narxni o'zgartirsa** (3.8, 3.11) — mijozga xabar ketadi:

> *"Buyurtmangiz tasdiqlandi. Yakuniy narx: 430 000 so'm (avval 450 000). Chegirma: 20 000."*

Aks holda mijoz "botda boshqacha yozgan edi" deydi va sotuvchi tushuntirib o'tiradi.

### 13.6. Mijoz boti — buyurtma holati

Bot **9 ta statusni** ko'rsatmaydi — mijozga to'rttasi yetarli:

| Ichki status (8.3) | Mijoz ko'radi |
|---|---|
| Tasdiq kutmoqda | ⏳ Qabul qilindi, tasdiqlanmoqda |
| Tasdiqlangan · Materialga kutmoqda · Ishlab chiqarilmoqda | 🏭 Tayyorlanmoqda |
| Tayyor | 🎉 Tayyor, olib ketishingiz mumkin |
| Topshirilgan · Qaytarilgan · Rad etilgan · Bekor qilingan | ✔️ Yopilgan |

**"Materialga kutmoqda" mijozga ko'rsatilmaydi** — bu ichki muammo, mijozga sabab bo'lmaydi.

**Xabar yuboriladi:** buyurtma qabul qilinganda · tasdiqlanganda (narx bilan) · tayyor bo'lganda · bekor qilinganda · qarz eslatmasi.

**Har pozitsiya alohida statusda** bo'lishi mumkin (8.2). Botda shunday ko'rsatiladi: *"3 tadan: 1 tayyor, 2 tayyorlanmoqda"*.

### 13.7. Mijoz boti — balans

```
💰 BALANSIM

📋 Jami buyurtmalar: 5 ta
💵 Jami xarid: 2 450 000 so'm
💳 To'langan: 1 000 000 so'm
🔴 Qarz: 1 450 000 so'm
```

Balans TZ 6.8 dagi harakatlar yig'indisi — boshlang'ich qoldiq, avans va storno hisobga olinadi.

**So'm va dollar alohida ko'rsatiladi.**

Qarzi bo'lmasa: *"Qarzingiz yo'q."*

### 13.8. Usta boti

**Kirish:** Telegram ID xodimlar bazasida tekshiriladi, roli **usta** bo'lishi kerak.

| Tugma | Vazifasi |
|---|---|
| 📋 Umumiy navbat | Hali hech kim olmagan ishlar |
| 🔨 Mening ishlarim | Olgan, tugatmagan |
| ✔️ Tugatganlarim | Tarix |
| 💰 Balansim | Ishlagan, olgan, qolgan |

**Umumiy navbat.** Admin taqsimlamaydi — usta o'zi oladi (8.5).

```
🏭 NAVBAT

#1247 · poz. 1 — Rollo
📐 210 × 140 sm
🧵 Old: ko'k to'r · Orqa: kulrang zashitka
🎀 Mexanizm 1 · kronshteyn 2 · brelok 2
📅 Muddat: 10.08.2026

[ 🟢 Ishga olaman ]
```

**Narx ko'rsatilmaydi.** Faqat ishlab chiqarish ma'lumotlari.

**"Ishga olaman"** → status "Ishlab chiqarilmoqda". Ikki usta bir vaqtda bossa — birinchisi oladi, ikkinchisiga *"Bu ish allaqachon olingan"* (8.5).

**"Tugatdim"** → material yechiladi, ostatka yaratiladi, haq hisoblanadi va balansga qo'shiladi (7.5, 10.10). Amal **atomar** (7.3).

Avval olinmagan ishga "Tugatdim" bosilsa → *"Avval ishni olishingiz kerak"*.

**Qayta kesish so'rovi.** Usta noto'g'ri kesdi:

```
[ ⚠️ Qayta kesish so'rayman ]
  ↓
Sabab kiritiladi (majburiy)
  ↓
Adminga so'rov ketadi
  ↓
Admin tasdiqlaydi → material IKKINCHI marta yechiladi
```

**Material faqat admin tasdiqlaganda yechiladi** — so'rov paytida emas (12.4). Ushlanish keyin alohida hal qilinadi (10.13).

**Balans.** Usta o'z balansini ko'radi: hisoblangan haq, olingan pul, qolgan summa, brak ushlanmalari.

```
💰 BALANSIM

Bu oy bajardim: 31 ta · 2 180 000
Olganim: 940 000
Ushlangan: 100 000 (brak — #1245)
🟢 Qolgan: 1 240 000 so'm
```

**Ushlanmalar ham ko'rinadi.** Yashirilsa usta baribir farqni sezadi va ishonch yo'qoladi.

**Stavkasi belgilanmagan tur** navbatda ko'rinaveradi (10.12) — ish to'xtamaydi, haq 0 hisoblanadi, admin keyin qo'lda qo'shadi.

### 13.9. Admin boti

Admin saytda ishlaydi. Bot **tez javob berish** uchun.

**Bildirishnomalar:**

| Hodisa | Xabar |
|---|---|
| Qayta kesish so'rovi | Tasdiqlash / rad etish tugmasi bilan |
| Sotuvchi pul topshirdi | Tasdiqlash tugmasi bilan (12.7) |
| Ombordan hisobdan chiqarildi | Faqat xabar (7.9) |
| Kam qolgan material | Faqat xabar |
| Ustama chegaradan past | Faqat xabar (7.8) |
| Yetkazib beruvchiga muddat | Faqat xabar |
| Stavkasiz ish bajarildi | Faqat xabar (10.12) |
| Kun yopishda farq | Faqat xabar (12.17) |

**Botdan bajariladigan ikki amal:** qayta kesishni tasdiqlash va pul topshirig'ini tasdiqlash. Qolgan hammasi saytda.

**Ko'rish uchun:** bugungi tushum · kassa qoldig'i · ochiq buyurtmalar soni.

### 13.10. Takrorlanishdan himoya

Botdagi har tugma **idempotent** bo'lishi shart — Telegram xabarni qayta yuborishi, foydalanuvchi ikki marta bosishi mumkin.

| Tugma | Ikkinchi bosilganda |
|---|---|
| Ishga olaman | *"Bu ish allaqachon olingan"* |
| Tugatdim | *"Bu ish allaqachon tugatilgan"* |
| Tasdiqlash | *"Allaqachon tasdiqlangan"* |
| Buyurtma yuborish | *"Buyurtmangiz allaqachon yuborilgan: #1247"* |

Bu 12.3-banddagi `(manba, ID)` qoidasining bot tarafdagi ko'rinishi. Xabar UI darajasida, **haqiqiy himoya bazada**.

### 13.11. Bot ishlamay qolsa

**Foydalanuvchi botni bloklagan bo'lsa** — xabar yetib bormaydi. Bu qayd etiladi va:

- Mijoz bo'lsa: sotuvchiga *"Mijozga xabar yetib bormadi — qo'ng'iroq qiling"*
- Usta bo'lsa: adminga *"Ustaga xabar yetib bormadi"*

**Yuborilmagan xabarlar** buyurtma kartochkasining "Eslatmalar" tabida qizil holatda ko'rinadi va qayta yuborish tugmasi bo'ladi (6.7).

**Bot butunlay ishlamay qolsa** ishlab chiqarish to'xtamasligi kerak: usta ishini saytdan ham olishi va tugatishi mumkin. Bu 13.1-banddagi "bot yagona interfeys emas" qoidasi.

### 13.12. Bu bo'limda qabul qilingan qarorlar

| Nima | Qabul qilingan |
|---|---|
| Nechta bot | **Bitta bot dasturi, uchta panel**. Rol Telegram ID orqali aniqlanadi |
| Botda ism dublikati | **Tekshirilmaydi**, faqat telefon bo'yicha |
| Mijozga status | **To'rtta guruh**, ichki 9 ta emas |
| Materialga kutmoqda | Mijozga **ko'rsatilmaydi** |
| Narx o'zgarsa | Mijozga **xabar ketadi**, farq va sababi bilan |
| Ustaga ushlanmalar | **Ko'rinadi** |

---

## 14. SOZLAMALAR VA RUXSATLAR

### 14.1. Ekranlar

1. Asosiy sozlamalar
2. Kengaytirilgan sozlamalar
3. Kurs va uning tarixi
4. Ruxsatlar matritsasi
5. Bildirishnoma qoidalari
6. Bot matnlari
7. Spravochniklar (xarajat moddalari, almashtirish guruhlari, takroriy xarajatlar)

### 14.2. Ikki darajali tuzilish

Sozlamalar **ikki bo'limga** ajratiladi:

**Asosiy** — kundalik ishda o'zgaradigan, ochiq turadi:
kurs · standart ustama chegarasi · chegirma limiti · yaxlitlash chegarasi · korxona ma'lumotlari.

**Kengaytirilgan** — yopiq bo'lim, admin ochadi. Bir marta sozlanadi va kamdan-kam tegiladi:
kesish bag'rikengligi · tasdiqlanmagan buyurtma chegarasi · uxlab qolgan mijoz chegarasi · qimirlamagan material chegarasi · topshirilmagan pul chegarasi va boshqalar.

> Hammasi bitta ro'yxatda tursa ekran qirq qatorli bo'ladi va hech kim uni o'qimaydi. Muhim to'rt-besh sozlama ko'rinmay qoladi.

### 14.3. Asosiy sozlamalar

| Sozlama | Standart | Qayerda ishlatiladi |
|---|---|---|
| **Kurs** (1 $ = so'm) | — | Butun tizim (1.3) |
| **Standart ustama chegarasi** | 30% | Kirimda tekshiruv (5.4, 7.8) |
| **Chegirma limiti** | — | Sotuvda ogohlantirish (3.11) |
| **Yaxlitlash chegarasi** | 1 000 so'm | Kassa (12.19) |
| **Korxona ma'lumotlari** | — | Chek va hisob-kitob varaqasi |

Korxona ma'lumotlari: nomi · manzili · telefoni · logotipi. Chek, kvitansiya, hisob-kitob varaqasi va ish varaqasida chiqadi.

### 14.4. Kengaytirilgan sozlamalar

| Sozlama | Standart | Band |
|---|---|---|
| Kesish bag'rikengligi | 1 sm | 7.5 |
| Minimal ostatka chegarasi — standart | 0.5 m | 5.5 |
| Tasdiqlanmagan bot buyurtmasi — ogohlantirish | 24 soat | 8.4 |
| Uxlab qolgan mijoz chegarasi | 90 kun | 6.7 |
| Qimirlamagan material chegarasi | 6 oy | 11.7.6 |
| Topshirilmagan pul chegarasi | 3 kun | 12.16 |
| Debitorlik yosh guruhlari | 30/60/90 kun | 11.4.5 |

**Har sozlama yonida qayerda ishlatilishi yozilgan bo'ladi.** Admin raqamni o'zgartirishdan oldin nimaga ta'sir qilishini ko'radi.

Material darajasida alohida qiymat belgilangan bo'lsa (5.4, 5.5) — u standartdan ustun turadi.

### 14.5. Kurs va uning tarixi

Kurs qo'lda yangilanadi. **Har o'zgarish jurnalga yoziladi:** sana-vaqt · eski qiymat · yangi qiymat · kim o'zgartirdi.

**Kurs tarixi saqlanishi majburiy.** Uchta joy unga tayanadi:

- Kirim tannarxi kirim kunidagi kursda qotiriladi (9.6)
- Buyurtma yaratilgan paytdagi kurs bilan saqlanadi (8.13)
- Kurs farqi ikki kurs ayirmasidan hisoblanadi (9.6)

> Faqat joriy kurs saqlansa, o'tgan oyning hisobotini qayta ochganda eski kurs yo'qoladi va raqamlar o'zgarib ketadi — bu 2.3-invariantni buzadi.

Kurs o'zgartirilganda ogohlantirish chiqadi: *"Bu kurs bugundan boshlab ishlaydi. Eski yozuvlar o'zgarmaydi."*

Audit jurnaliga tushadi (2.4).

### 14.6. Ruxsatlar matritsasi

**Rol × amal** ko'rinishidagi jadval, checkbox bilan. Admin o'zi sozlaydi.

**Standart holat: barcha huquq adminda.** Qolgan rollarga admin o'zi beradi — hech narsa oldindan ochiq emas.

Ruxsat **amal darajasida** beriladi, bo'lim darajasida emas:

```
OMBOR
  ☑ Ko'rish
  ☑ Kirim hujjati yaratish
  ☐ Hisobdan chiqarish
  ☐ Storno
  ☐ Material narxini o'zgartirish

KASSA
  ☑ O'z kassasini ko'rish
  ☐ Barcha kassani ko'rish
  ☑ Kirim / chiqim
  ☐ Ayirboshlash
  ☐ Storno
```

> Bo'lim darajasi yetarli emas: omborchiga kirim qilishga ruxsat berib, hisobdan chiqarishni taqiqlash kerak bo'lishi mumkin. Bitta "Ombor — ha/yo'q" bayrog'i buni ajrata olmaydi.

**Bloklanadi:** admin o'zining **"sozlamalarni o'zgartirish"** huquqini olib qo'ya olmaydi. Aks holda tizimga kirish yo'li yopiladi va uni faqat bazadan tuzatish mumkin bo'ladi.

Xodimda bir nechta rol bo'lsa (10.3) — **ruxsatlar yig'indi** bo'ladi.

Har o'zgarish audit jurnaliga tushadi.

### 14.7. Bildirishnoma qoidalari

Tizimdagi har avtomatik xabar uchun uchta sozlama:

| Nima | Variantlar |
|---|---|
| **Holati** | Yoqilgan / o'chirilgan |
| **Kimga** | Rol yoki aniq xodim (bir nechta bo'lishi mumkin) |
| **Kanal** | Bot · saytdagi qo'ng'iroqcha · **ikkalasi** |

**Bir vaqtda ikki kanalga borishi mumkin.** Muhim xabar botda ham, saytda ham ko'rinadi — admin qaysi birida ekanini bilmaydi.

**Standart: barcha xabar adminga boradi.** Boshqa rollarga admin o'zi qo'shadi.

Xabarlar ro'yxati:

| Xabar | Manba |
|---|---|
| Yangi bot buyurtmasi | 8.4 |
| Tasdiqlanmagan buyurtma — chegaradan oshdi | 8.4 |
| Qayta kesish so'rovi | 2.9 |
| Sotuvchi pul topshirdi | 12.7 |
| Ombordan hisobdan chiqarildi | 7.9 |
| Hisobdan chiqarish o'zgartirildi yoki bekor qilindi | 7.9 |
| Kam qolgan material | 5.5 |
| Ustama chegaradan past | 7.8 |
| Yetkazib beruvchiga to'lov muddati | 9.4 |
| Stavkasiz ish bajarildi | 10.12 |
| Kun yopishda farq | 12.17 |
| Manfiy qoldiq paydo bo'ldi | 2.5 |
| Chegirma limitidan oshdi | 3.11 |
| Buyurtma muddati o'tdi | 8.16 |
| Materialga kutmoqda | 8.12 |
| Mijozga xabar yetib bormadi | 13.11 |

### 14.8. Bot matnlari

Barcha bot xabari sozlamadan tahrirlanadi — matnni o'zgartirish uchun dasturchi kerak emas.

**Matnlarda o'zgaruvchilar ishlatiladi:**

```
Hurmatli {mijoz_ismi}, buyurtmangiz #{buyurtma_raqami} tayyor.
Summa: {summa} so'm. Qarzingiz: {qarz} so'm.
```

**Har xabar uchun mavjud o'zgaruvchilar ro'yxati yonida ko'rsatiladi.** Admin qaysilarini ishlatishi mumkinligini ko'radi va bosib qo'shadi.

**Tekshiruv:** matnda noma'lum o'zgaruvchi bo'lsa saqlanmaydi va xato ko'rsatiladi. Aks holda mijozga `{noma'lum_maydon}` ko'rinishidagi xabar ketadi.

**Oldindan ko'rish** — namuna qiymatlar bilan matn qanday chiqishi ko'rsatiladi.

Tahrirlanadigan matnlar: salomlashish · ro'yxatdan o'tish · buyurtma holati xabarlari · qarz eslatmasi · bog'lanish ma'lumotlari · xato xabarlari · tugma nomlari.

### 14.9. Spravochniklar

Bir joyda boshqariladigan ro'yxatlar:

| Spravochnik | Band |
|---|---|
| Operatsion xarajat moddalari | 12.10 |
| Almashtirish guruhlari | 5.6 |
| Takroriy xarajat shablonlari | 12.19 |
| Qaytarish sabablari | 8.10 |
| Hisobdan chiqarish sabablari | 7.9 |
| Balansni tuzatish sabablari | 10.14 |

Har birida: qo'shish · tahrirlash · nofaol qilish.

**O'chirish yo'q** (2.1-invariant) — ishlatilgan qiymat nofaol qilinadi va eski yozuvlarda ko'rinaveradi.

**Ishlatilayotgan yagona qiymatni nofaol qilish bloklanadi** — masalan "Naqd" to'lov usuli o'chirilsa kassa ishlamay qoladi.

### 14.10. Bu bo'limda qabul qilingan qarorlar

| Nima | Qabul qilingan |
|---|---|
| Kurs tarixi | **Saqlanadi**, o'zgarishlar jurnali bilan |
| Admin o'z huquqini olib qo'yishi | **Bloklanadi** |
| Bir nechta rol | Ruxsatlar **yig'indi** |
| Bot matnida noma'lum o'zgaruvchi | Saqlanmaydi, xato ko'rsatiladi |
| Spravochnikdagi yagona faol qiymat | Nofaol qilish bloklanadi |

---

## 15. QO'SHIMCHA MODULLAR

Bu bo'lim asosiy modullar yopilgandan keyin qo'shildi. Ular tizim ishlashi uchun shart emas, lekin ularsiz uchta narsa ko'rinmay qoladi: ombordagi haqiqiy holat, nima sotib olish kerakligi va kun oxiridagi umumiy manzara.

### 15.1. Inventarizatsiya

**Vazifasi.** Tizim ko'rsatgan qoldiq bilan omborda haqiqatan turgan miqdorni solishtirish.

**Kim qiladi.** Omborchi. **Admin tasdig'i kutilmaydi** — kiritilgan zahoti qoldiq o'zgaradi va adminga xabar ketadi.

> Bu hisobdan chiqarish bilan bir xil qoida (7.10). Omborchi ishlashda erkin, lekin hech narsa ko'rinmay qolmaydi.

**To'liq va qisman.** Butun omborni sanash shart emas. Inventarizatsiya **tanlangan materiallar** bo'yicha ham o'tkaziladi — masalan faqat mexanizmlar, yoki faqat bitta mato.

**Sanash varaqasi.** Chop etiladi va unda **tizim raqami ko'rinadi**. Omborchi yoniga haqiqiy sonni yozadi.

```
INVENTARIZATSIYA — 15.08.2026 · Anvar

Material                    Birlik   Tizimda    Haqiqatda    Farq
Ko'k mato · to'r            kv.m       48.00    [        ]
  R-118 rulon                          28.00    [        ]
  O-207 qoldiq kesma  1.80×2.00         3.60    [        ]
  O-211 qoldiq kesma  2.50×1.84         4.60    [        ]
Kronshteyn · oddiy          dona          380    [        ]
Rollo mexanizmi · Xitoy     dona          124    [        ]
```

**Rulon va qoldiq kesma alohida sanaladi** — har bo'lak o'z qatorida, o'lchami bilan. Aks holda "48 kv.m bor" degan javob hech narsani tekshirmaydi.

**Farq chiqsa:**

- **Sabab majburiy.** Ro'yxat: hisobga olinmagan chiqindi · o'lchov xatosi · yo'qolgan · noto'g'ri kirim · boshqa
- Qoldiq **haqiqiy songa** tenglashadi
- Farq tannarx bo'yicha hisoblanadi va foyda-zarar hisobotiga **xarajat** bo'lib tushadi
- Ortiqcha chiqsa — daromad emas, **xarajat kamayishi**

**Yozuv o'chirilmaydi.** Xato bo'lsa admin storno qiladi (2.1).

**Inventarizatsiya farqlari hisoboti.** Omborchi va material kesimida, davr bo'yicha:

```
Omborchi   O'tkazilgan   Farq bo'lgan   Jami farq (tannarx)
Anvar               12              7        −1 840 000
```

> Ombor uchta yo'l bilan kamayishi mumkin: hisobdan chiqarish (7.10), qo'lda korrektsiya, inventarizatsiya. Uchalasi ham omborchi qo'lida va admin tasdig'isiz. Shuning uchun bu hisobot majburiy — u yagona nazorat vositasi.

**Oxirgi inventarizatsiya sanasi** material kartochkasida ko'rinadi. Uzoq sanalmagan materiallar alohida filtrda chiqadi.

### 15.2. Yetishmayotgan materiallar

**Vazifasi.** Qaysi material nechta buyurtmani to'xtatib turganini bir ekranda ko'rsatish.

TZ 8.12-bandda "Materialga kutmoqda" statusi bor, lekin u buyurtma tarafda. Omborchi qaysi materialni birinchi olish kerakligini bilmaydi.

```
Material              Kutmoqda   Kerak      Bo'sh    Yetishmaydi   Eng eski
Oq plisse              2 poz.    9.00 kv.m  1.20     7.80          10.08 (5 kun)
Ko'k mato · to'r       1 poz.    2.94 kv.m  0.00     2.94          13.08 (2 kun)
Alyuminiy karniz       3 poz.    6.30 m     2.70     3.60          09.08 (6 kun)
```

Har qatorda havola — bosilganda o'sha materialni kutayotgan pozitsiyalar ro'yxati ochiladi.

**Kirim bo'lgach pozitsiyalar avtomatik navbatga qaytadi** va bo'lak eng eski buyurtmaga band qilinadi (8.12).

Bu ko'rinish ombor sahifasining "diqqat" blokchasida ham raqam bo'lib turadi (11.11).

### 15.3. Xarid ro'yxati

**Vazifasi.** Nima sotib olish kerakligini tizim o'zi hisoblab beradi.

**Formula:**

```
kerak = tasdiqlangan buyurtmalar ehtiyoji
      − bo'sh qoldiq
      + kam qoldiq chegarasi
```

Uchinchi qism zaxira uchun: material aynan nolga tushmasin, chegara darajasida qolsin.

```
XARID RO'YXATI — 15.08.2026

"Tekstil Savdo" MCHJ
  Oq plisse           kerak 7.80    chegara 8.00    olish: 16.00 kv.m
  Ko'k mato · to'r    kerak 2.94    chegara 10.00   olish: 13.00 kv.m

"Alfa Furnitura"
  Kronshteyn          kerak 0       chegara 50      olish: 0 dona  (yetarli)

"Karniz Plus"
  Alyuminiy karniz    kerak 3.60    chegara 15.00   olish: 19.00 m
```

**Yetkazib beruvchi bo'yicha guruhlanadi** — bitta yetkazib beruvchiga bitta qo'ng'iroq.

**Har material yonida:** oxirgi kirim narxi va sanasi, narx o'zgarishi foizi (9.8).

**Bir material bir necha yetkazib beruvchidan kelsa** — hammasi ko'rsatiladi, narxi bilan. Tanlash odamning ishi.

**Ro'yxat saqlanmaydi** — har ochilganda joriy ma'lumotdan hisoblanadi. Excelga eksport qilinadi (11.2).

> Tizimda "yetkazib beruvchiga buyurtma berish" tushunchasi yo'q (9.12). Xarid ro'yxati faqat **hisoblab beradi**, buyurtma bermaydi. Mol kelganda kirim hujjati yoziladi.

### 15.4. Kunlik yopish varaqasi

**Vazifasi.** Kun oxirida bitta A4 varaq: bugun nima bo'ldi, nima ochiq qoldi. Chop etib qo'yish uchun.

```
KUN YAKUNI — 15.08.2026 · Malika

KASSA
  Ertalabki qoldiq                     850 000
  Kirim                              4 200 000
  Chiqim                             1 850 000
  Bo'lishi kerak                     3 200 000
  Sanadim                          [           ]
  Farq                             [           ]
  Izoh                             [                              ]

BUGUN
  Yangi buyurtma            7 ta      4 820 000
  Topshirildi               5 ta
  Qaytarildi                1 ta        230 000
  Qarz to'landi             3 ta        800 000

OCHIQ QOLDI
  Tasdiq kutmoqda           2 ta
  Tayyor, topshirilmagan    8 ta
  Materialga kutmoqda       2 ta
  Muddati o'tgan            3 ta

ERTAGA MUDDATI KELADI
  #1251  Nilufar Sattorova   2 poz.
  #1253  Oyna Dekor MCHJ     1 poz.

Imzo: ____________
```

**Kassa qismi 12.17-band bilan bitta narsa** — ikkita alohida ekran yasalmaydi. Kunlik varaqa o'sha kun yopish oynasining chop etiladigan ko'rinishi, ustiga buyurtma ma'lumoti qo'shilgan.

**Admin uchun** varaqa boshqacha bo'ladi: barcha sotuvchining kassasi, sotuvchilardagi pul, kartadagi pul, umumiy tushum.

### 15.5. Bu bo'limda qabul qilingan qarorlar

| Nima | Qabul qilingan |
|---|---|
| Inventarizatsiya tasdig'i | Kerak emas — omborchi kiritadi, adminga xabar |
| Sanash varaqasida tizim raqami | **Ko'rinadi** |
| Inventarizatsiya qamrovi | To'liq yoki qisman — tanlangan materiallar bo'yicha |
| Ortiqcha chiqqan farq | Daromad emas, **xarajat kamayishi** |
| Xarid ro'yxati | Faqat hisoblaydi, buyurtma bermaydi |
| Kunlik varaqa va kun yopish | **Bitta narsa**, ikkita ekran emas |

---

## 16. EDGE CASE'LAR

### 16.1. Format

Har edge case **yetti maydon**. Undan kam bo'lsa dasturchi taxmin qiladi, ko'p bo'lsa hech kim to'ldirmaydi.

```
EC-OMB-07 · Ostatka buyurtmadan bir necha mm kichik
Band:       7.5 (kesish algoritmi)
Qachon:     Ostatka 0.90 × 1.40 m. Buyurtma 90.2 × 140 sm.
            Formal jihatdan sig'maydi — farq 2 mm.
Qaror:      1 sm gacha bag'rikenglik beriladi. Bo'lak mos deb
            hisoblanadi, kesiladi. Farq chiqindiga yozilmaydi.
Kim ko'radi: Hech kim. Usta uchun oddiy kesim, ogohlantirish yo'q.
Nega:       Qat'iy tekshiruv ustani "material yetishmaydi"ga
            olib boradi, u yangi rulon ochadi — butun bo'lak
            behuda qoladi. 2 mm amalda kesishda yo'qoladi.
Tekshirish: 0.90 × 1.40 bo'lakka 90.2 × 140 → kesiladi.
            91.5 × 140 → rad etiladi (1.5 sm > 1 sm).
Holati:     KELISHILDI · 13.08.2026
```

**Yozish qoidalari**

- **Har doim aniq raqam bilan.** "Katta buyurtma" emas — "3.5 m eni". Raqamsiz edge case tekshirib bo'lmaydi.
- **"Qachon" — faqat sharoit, qaror emas.** Aralashsa, keyin o'qigan odam nimaga rozi bo'lganini ajrata olmaydi.
- **"Nega" bitta jumla, lekin majburiy.** Uch oydan keyin bu qaror g'alati ko'rinadi va kimdir uni "soddalashtirmoqchi" bo'ladi.
- **"Tekshirish" ikki misol:** biri o'tadi, biri o'tmaydi. Chegara qayerdaligi shunda ko'rinadi.
- **Nomerlash:** `EC-<MODUL>-<NN>`. Modullar: OMB, SOT, KAS, MIJ, ICH, BOT, HIS.
- **Joylashuvi:** har bo'lim oxirida. Alohida ilova qilinsa dasturchi asosiy matnni o'qib, edge case'larni ko'rmay ketadi.

**Bo'lim yopilishi uchun barcha edge case KELISHILDI holatida bo'lishi shart.**

### 16.2. Ombor edge case'lari

| Kod | Holat | Qaror | Holati |
|---|---|---|---|
| EC-OMB-01 | Ostatka L shaklida chiqadi | Ostatka doim to'rtburchak. Usta doim to'liq kenglikda kesadi. | KELISHILDI |
| EC-OMB-02 | Bir buyurtmada bir xil matodan bir nechta parda | Birlashtirib kesiladi, bitta uzun ostatka qoladi | KELISHILDI |
| EC-OMB-03 | Ostatka aynan buyurtma o'lchamiga teng | Nol qiymatli ostatka yaratilmaydi, bo'lak butunlay yopiladi | KELISHILDI |
| EC-OMB-04 | Ostatka bir necha mm kichik | 1 sm bag'rikenglik | KELISHILDI |
| EC-OMB-05 | Kesimdan aynan chegaraga teng bo'lak qoldi | Chegaradan kichik bo'lsa chiqindi taklif qilinadi, teng bo'lsa saqlanadi. Usta o'zgartira oladi (7.6) | KELISHILDI |
| EC-OMB-06 | Ostatka ostatkadan tug'ildi (uchinchi avlod) | Kelib chiqish zanjiri to'liq saqlanadi — tannarx zanjir orqali keladi | KELISHILDI |
| EC-OMB-07 | Brak qilinayotgan bo'lakka usta "Tugatdim" bosdi | Lock omborchi bilan usta orasida ham ishlaydi (7.3) | KELISHILDI |
| EC-OMB-08 | Brakni bekor qilish qoldiqni manfiyga tushiradi | Bloklanmaydi. Qoldiq manfiy bo'lib turaveradi, qizil belgi, adminga xabar | KELISHILDI |
| EC-OMB-09 | Butun rulon ochilmasdan brakka chiqadi | Ostatkalarga bo'linmaydi, butunligicha yechiladi | KELISHILDI |
| EC-OMB-10 | Material oxirgi slotdan uzildi, qoldig'i bor | Ogohlantirish chiqadi, qoldiq ombor hisobotida qoladi | KELISHILDI |
| EC-OMB-11 | Sarflash formulasi o'zgartirildi, ochiq buyurtmalar bor | Eski formula bo'yicha yechiladi (4.10) | KELISHILDI |
| EC-OMB-12 | Almashtirish guruhidagi yagona variant nofaol qilindi | Nofaol qilish bloklanadi (5.9) | KELISHILDI |
| EC-OMB-13 | Kirim storno qilinadi, undan allaqachon kesilgan | To'liq storno. Qoldiq manfiyga tushadi, admin tuzatadi (7.11) | KELISHILDI |
| EC-OMB-14 | Bir kirimda bir xil material ikki xil narxda | Ikki qator bo'lib kiritiladi, har biri o'z tannarxi bilan | KELISHILDI |
| EC-OMB-15 | Yetkazib beruvchi yo'qoldi, "qaytariladi" yozuvi osilib qoldi | Admin umidsiz deb hisobdan chiqaradi (7.8) | KELISHILDI |
| EC-OMB-16 | Usta "Tugatdim" ni xato bosdi | Bitta atomar teskari operatsiya: material tiklanadi, ostatka o'chiriladi | KELISHILDI |
| EC-OMB-18 | Band qilingan bo'lak 30 kun qimirlamadi | Band avtomatik bo'shaydi, adminga xabar (7.3) | KELISHILDI |
| EC-OMB-19 | Usta ostatka o'rniga rulondan kesdi | "Tugatdim" da manbani o'zgartiradi, ogohlantirish chiqadi, hisobotga tushadi (7.6, 11.7.7) | KELISHILDI |
| EC-OMB-20 | Kesim egri chiqdi, bo'lak kichikroq | Usta haqiqiy o'lchamni kiritadi, farq chiqindiga (7.6) | KELISHILDI |
| EC-OMB-21 | Usta boshqa ostatkani olgan | Muhim emas — aniq bo'lak kuzatilmaydi, faqat manba (7.6) | KELISHILDI |
| EC-OMB-22 | Ostatka bor turib rulon ochildi | Ogohlantirish, bloklamaydi, jurnalga va hisobotga yoziladi (7.6) | KELISHILDI |
| EC-OMB-23 | Bo'lak eni 0.5–1.0 m oralig'ida | "Kam ishlatiladigan" belgisi bilan saqlanadi (7.5) | KELISHILDI |
| EC-OMB-24 | Pozitsiya bekor qilindi, bo'lak band edi | Band bo'shaydi (7.3) | KELISHILDI |
| EC-OMB-25 | Usta kesim o'lchamini tuzatdi | Farq chiqindiga yoziladi (7.6) | KELISHILDI |
| EC-OMB-17 | Buyurtma bekor qilindi, mahsulot allaqachon tayyor | "Sotilmagan tayyor mahsulot" ro'yxatiga tushadi (7.12) | KELISHILDI |

### 16.3. Mijozlar edge case'lari

| Kod | Holat | Qaror | Holati |
|---|---|---|---|
| EC-MIJ-01 | Ikki xil odamning ismi bir xil | Bloklanadi, mavjud mijozning telefoni ko'rsatiladi | KELISHILDI |
| EC-MIJ-02 | Qarzi bor mijozni nofaol qilish | Bloklanadi (6.6) | KELISHILDI |
| EC-MIJ-03 | Kurs o'zgardi, mijoz limitdan oshdi | Ongli qabul qilingan xavf (6.4) | KELISHILDI |
| EC-MIJ-04 | Hisobdan chiqarilgan qarzni mijoz to'ladi | Kassaga "boshqa kirim", balansga qo'shilmaydi (6.10) | KELISHILDI |
| EC-MIJ-05 | Mijozda ikki valyutada qarz, hammasini to'lamoqchi | Bitta operatsiyada bitta valyuta, ikkita yozuv | KELISHILDI |
| EC-MIJ-06 | Import qilingan mijozning eski qarzi | "Boshlang'ich qoldiq" qatori (6.8) | KELISHILDI |

### 16.4. Buyurtma edge case'lari

| Kod | Holat | Qaror | Holati |
|---|---|---|---|
| EC-BUY-01 | Botdan kelgan buyurtma tasdiqsiz yotibdi | Avtomatik bekor bo'lmaydi. 24 soatdan oshgani qizil, sotuvchiga bildirishnoma (8.4) | KELISHILDI |
| EC-BUY-02 | Sotuvchi bot buyurtmasini tasdiqlashdan oldin tahrirlaydi | Erkin tahrirlanadi, har o'zgarish tarixga yoziladi | KELISHILDI |
| EC-BUY-03 | Tasdiqlangan buyurtmaga yangi pozitsiya qo'shish | Mavjud buyurtmaga qo'shiladi, yangisi ochilmaydi (8.7) | KELISHILDI |
| EC-BUY-04 | "Ishlab chiqarilmoqda" da mijoz o'zgartirish so'radi | Tahrirlash yo'q. Bekor qilinadi, yangisi qo'shiladi | KELISHILDI |
| EC-BUY-05 | Usta ishga oldi, lekin tashlab ketdi | Usta o'zi qaytara olmaydi. Admin qaytarib oladi, stavkani qo'lda kiritadi (8.6) | KELISHILDI |
| EC-BUY-06 | Ikki usta bitta pozitsiyani birga oldi | Birinchi so'rov oladi, ikkinchisiga rad javobi (8.5) | KELISHILDI |
| EC-BUY-07 | Usta noto'g'ri kesdi | Qaytarish emas — ishlab chiqarish braki (8.11) | KELISHILDI |
| EC-BUY-08 | Material yetmadi, keyin kirim keldi | Bo'lak eng eski buyurtmaga band qilinadi (8.12) | KELISHILDI |
| EC-BUY-09 | Qisman topshirilgan buyurtma qachon yopiladi | Barcha pozitsiya yopiq statusda bo'lganda. Shunda chek chiqadi (8.9) | KELISHILDI |
| EC-BUY-10 | Mijoz tayyor mahsulotni olishga kelmayapti | Avtomatik hech narsa. Admin "Rad etilgan" ga o'tkazadi (8.8) | KELISHILDI |
| EC-BUY-11 | Qaytarilgan pozitsiya qayta qaytariladi | Mumkin emas. Yopiq statusdan chiqish yo'q, xato bo'lsa storno | KELISHILDI |
| EC-BUY-12 | Butun buyurtma qaytarildi | Alohida amal yo'q — pozitsiyalar birma-bir qaytariladi | KELISHILDI |
| EC-BUY-13 | Qaytarishda mijoz avansda qoladi | Sotuvchi tanlaydi: naqd berish yoki avans qoldirish (8.10) | KELISHILDI |
| EC-BUY-14 | Mijozsiz buyurtma qaytarildi | Qarz yo'q, hammasi kassadan naqd (8.10) | KELISHILDI |
| EC-BUY-15 | Buyurtma xato kiritilgan | Bekor qilish emas — admin storno qiladi, hisobotda alohida (8.8) | KELISHILDI |
| EC-BUY-16 | Chegirma limitidan oshdi | Ogohlantirish, sotuvchi davom etadi, audit jurnaliga (8.13) | KELISHILDI |
| EC-BUY-17 | Buyurtma dollarda, to'lov so'mda | Buyurtma yaratilgan paytdagi kurs (8.13) | KELISHILDI |

### 16.5. Yetkazib beruvchi edge case'lari

| Kod | Holat | Qaror | Holati |
|---|---|---|---|
| EC-YET-01 | Avans bor, kirim undan kichik | Avansdan yechiladi, qolgani balansda musbat turaveradi | KELISHILDI |
| EC-YET-02 | Avans bor, kirim undan katta | Avans yeyiladi, qolgani qarz bo'ladi | KELISHILDI |
| EC-YET-03 | Dollar qarzi so'mda to'landi, kurs qo'lda o'zgartirildi | Kiritilgan kurs ishlaydi, kurs farqi shu bo'yicha hisoblanadi, audit jurnaliga tushadi | KELISHILDI |
| EC-YET-04 | To'lov qarzdan ko'p | Ortiqchasi avansga o'tadi | KELISHILDI |
| EC-YET-05 | Kurs tushdi — farq foydali chiqdi | **Alohida modda**: "Kurs farqi — daromad". Xarajat moddasidan ajratilgan (9.6) | KELISHILDI |
| EC-YET-06 | Bitta to'lov bir nechta hujjatni yopadi | Eng eskisidan ketma-ket, oxirgisi qisman qolishi mumkin | KELISHILDI |
| EC-YET-07 | Qo'shimcha xarajat kirimdan keyin ma'lum bo'ldi | Hujjat tahrirlanadi, tannarx qayta hisoblanadi. Sotilgan mahsulotlarga tegilmaydi (9.12) | KELISHILDI |
| EC-YET-08 | Kirimda bitta qator, qo'shimcha xarajat bor | Hammasi o'sha qatorga tushadi, taqsimlash kerak emas | KELISHILDI |
| EC-YET-09 | Ustama manfiy — tannarx sotuv narxidan yuqori | Qizil ogohlantirish, adminga xabar, bloklamaydi | KELISHILDI |
| EC-YET-10 | Qarzimiz bor yetkazib beruvchini nofaol qilish | Bloklanadi (9.10) | KELISHILDI |
| EC-YET-11 | Ochiq da'vo bor, hujjat to'liq to'landi | Da'vo ochiq qolaveradi. Yopilganda balans avansga o'tadi | KELISHILDI |
| EC-YET-12 | Bitta material ikki yetkazib beruvchidan keladi | Mumkin. Narx tarixi har birida alohida, tannarx kirim bo'yicha (7.7) | KELISHILDI |

### 16.6. Xodim va ish haqi edge case'lari

| Kod | Holat | Qaror | Holati |
|---|---|---|---|
| EC-XOD-01 | Stavka o'zgartirildi, eski ishlar bor | "Tugatdim" paytidagi stavka snapshot qilingan, o'zgarmaydi (10.10) | KELISHILDI |
| EC-XOD-02 | Bir ishni ikki usta bajardi | Tizim bo'lmaydi. "Tugatdim" bosgan to'liq oladi (10.11) | KELISHILDI |
| EC-XOD-03 | Stavkasi 0 bo'lgan tur bajarildi | Navbatga tushaveradi, haq 0, adminga xabar, keyin qo'lda tuzatiladi (10.12) | KELISHILDI |
| EC-XOD-04 | Xodim ishlaganidan ko'p oldi | Balans manfiyga tushadi, bloklanmaydi (10.4) | KELISHILDI |
| EC-XOD-05 | Manfiy balansda ishdan bo'shadi | Admin hisobdan chiqaradi, sabab majburiy, xarajatga tushadi (10.4) | KELISHILDI |
| EC-XOD-06 | Balansi bor xodimni nofaol qilish | Bloklanadi (10.4) | KELISHILDI |
| EC-XOD-07 | Stavka dollarda, to'lov so'mda | To'lov kunidagi kurs uriladi. Alohida kurs farqi moddasi yo'q (10.5) | KELISHILDI |
| EC-XOD-08 | Bosqich chegarasiga aynan teng maydon | Quyi bosqichga kiradi. 1.50 → 2 $ (10.8) | KELISHILDI |
| EC-XOD-09 | 0.3 kv.m lik kichkina parda | Eng quyi bosqich minimal haq sifatida ishlaydi (10.8) | KELISHILDI |
| EC-XOD-10 | Bitta odam admin ham, omborchi ham | Bir nechta rol, ruxsatlar yig'indi (10.3) | KELISHILDI |
| EC-XOD-11 | Brak — mato nuqsonli chiqdi, usta aybdor emas | Ushlanish har hodisada alohida hal qilinadi (10.13) | KELISHILDI |
| EC-XOD-12 | KPI foizi olingan, keyin mahsulot qaytarildi | Pul kassadan chiqadi → foiz teskari yoziladi (10.7) | KELISHILDI |
| EC-XOD-13 | Qarzga sotildi, KPI qachon hisoblanadi | Pul kassaga kelganda. Qisman to'lovda qismi (10.7) | KELISHILDI |

### 16.7. Kassa edge case'lari

| Kod | Holat | Qaror | Holati |
|---|---|---|---|
| EC-KAS-01 | Sotuvchi "Topshirdim" ni ikki marta bosdi | `(topshiriq, ID)` takrorlanmaydi — bitta yozuv (12.3) | KELISHILDI |
| EC-KAS-02 | Topshiriq tasdiqlanmagan, kun tugadi | Pul sotuvchi kassasida turaveradi (12.7) | KELISHILDI |
| EC-KAS-03 | Admin topshiriqni rad etdi | Yozuv "rad etilgan", pul qimirlamaydi, sotuvchi qaytadan belgilaydi | KELISHILDI |
| EC-KAS-04 | Qaytarish to'liq qarzdan chegirildi | Kassaga hech narsa yozilmaydi (12.12) | KELISHILDI |
| EC-KAS-05 | Ushlab qolingan summa | Hisobot qatori, kassa kirimi emas (12.12) | KELISHILDI |
| EC-KAS-06 | Ayirboshlashda komissiya | Alohida xarajat moddasi, kurs farqidan ajratilgan (12.9) | KELISHILDI |
| EC-KAS-07 | Transportni yetkazib beruvchi to'ladi | Kassadan chiqmaydi, uning qarziga yoziladi (12.6) | KELISHILDI |
| EC-KAS-08 | Karta to'lovi, sotgan sotuvchi boshqa | Karta doim admin kassasiga (12.2) | KELISHILDI |
| EC-KAS-09 | Sotuvchida dollar yig'ilib qoldi | Ayirboshlash faqat admin. Sotuvchi dollarni shundayligicha topshiradi | KELISHILDI |
| EC-KAS-10 | To'lov storno qilindi | Manba modulga qaytadi: mijoz qarzi tiklanadi (12.15) | KELISHILDI |
| EC-KAS-11 | Bitta yozuvga ikkinchi storno | Bloklanadi (12.3) | KELISHILDI |
| EC-KAS-12 | Ish haqi to'lovi xarajat deb sanaldi | Sanalmaydi — xarajat "Tugatdim" da yozilgan (12.1) | KELISHILDI |
| EC-KAS-13 | Admin sotuvchiga pul berdi | Darhol ko'chadi, tasdiqlash yo'q (12.8) | KELISHILDI |
| EC-KAS-14 | Egasi sotuvchi kassasidan pul olmoqchi | Bloklanadi — faqat admin kassasidan (12.11) | KELISHILDI |
| EC-KAS-15 | Yopilgan kunga orqadan yozuv qo'shish | Bloklanadi. Admin kunni qayta ochadi, sabab majburiy (12.17) | KELISHILDI |
| EC-KAS-16 | Kun yopishda farq chiqdi | Izoh majburiy, yopish bloklanmaydi, farq hisobotga tushadi (12.17) | KELISHILDI |
| EC-KAS-17 | Kecha yopilmagan, bugun ish boshlandi | Ruxsat. Yopilmagan kun diqqat blokchasida ko'rinadi (12.17) | KELISHILDI |
| EC-KAS-18 | Mijoz 400 so'm kam berdi | 1 000 gacha "yaxlitlash" moddasi. Undan yuqorisi chegirma (12.19) | KELISHILDI |
| EC-KAS-19 | Takroriy xarajat kuni keldi | Eslatma chiqadi, admin tasdiqlaydi. Avtomatik yozilmaydi (12.19) | KELISHILDI |
| EC-KAS-20 | Sotuvchilardagi pul admin jamiga qo'shildi | Qo'shilmaydi — alohida ko'rsatiladi (12.16) | KELISHILDI |

### 16.8. Telegram bot edge case'lari

| Kod | Holat | Qaror | Holati |
|---|---|---|---|
| EC-BOT-01 | Botda ikkinchi "Aziz" ro'yxatdan o'tmoqchi | Ism tekshirilmaydi, faqat telefon (13.2) | KELISHILDI |
| EC-BOT-02 | Telefon bazada bor | Mavjud mijozga bog'lanadi, yangisi yaratilmaydi (13.2) | KELISHILDI |
| EC-BOT-03 | Ikki usta bir vaqtda "Ishga olaman" bosdi | Birinchisi oladi, ikkinchisiga rad javobi (13.8) | KELISHILDI |
| EC-BOT-04 | "Tugatdim" ikki marta bosildi | Ikkinchisiga "allaqachon tugatilgan" (13.10) | KELISHILDI |
| EC-BOT-05 | Olinmagan ishga "Tugatdim" bosildi | "Avval ishni olishingiz kerak" (13.8) | KELISHILDI |
| EC-BOT-06 | Qayta kesish so'rovi yuborildi | Material so'rovda emas, admin tasdiqlaganda yechiladi (13.8) | KELISHILDI |
| EC-BOT-07 | Sotuvchi botdagi narxni o'zgartirdi | Mijozga xabar ketadi, farq va sababi bilan (13.5) | KELISHILDI |
| EC-BOT-08 | Slotda faol mato qolmagan | "Bu mahsulot uchun hozircha mato yo'q", boshqa tur taklif qilinadi (13.4) | KELISHILDI |
| EC-BOT-09 | Mijoz botni bloklagan | Sotuvchiga "qo'ng'iroq qiling", eslatmalar tabida qizil (13.11) | KELISHILDI |
| EC-BOT-10 | Bot ishlamay qoldi | Usta ishni saytdan oladi va tugatadi (13.11) | KELISHILDI |
| EC-BOT-11 | Pozitsiya "Materialga kutmoqda" ga tushdi | Mijozga ko'rsatilmaydi, "Tayyorlanmoqda" bo'lib qolaveradi (13.6) | KELISHILDI |
| EC-BOT-12 | Yangi mahsulot turi qo'shildi | Botda avtomatik paydo bo'ladi, kod o'zgartirilmaydi (13.4) | KELISHILDI |
| EC-BOT-13 | Xodimda admin va usta roli birga | Panellar orasida almashish tugmasi (13.1) | KELISHILDI |
| EC-BOT-14 | Buyurtma yuborish ikki marta bosildi | "Allaqachon yuborilgan: #1247" (13.10) | KELISHILDI |

### 16.9. Sozlamalar edge case'lari

| Kod | Holat | Qaror | Holati |
|---|---|---|---|
| EC-SOZ-01 | Admin o'z ruxsatini olib qo'ymoqchi | "Sozlamalarni o'zgartirish" huquqi bloklanadi (14.6) | KELISHILDI |
| EC-SOZ-02 | Kurs o'zgartirildi, eski buyurtmalar bor | Eski yozuvlar o'zgarmaydi, kurs tarixi saqlanadi (14.5) | KELISHILDI |
| EC-SOZ-03 | Xodimda ikki rol, ruxsatlari har xil | Yig'indi olinadi (14.6) | KELISHILDI |
| EC-SOZ-04 | Bot matnida noma'lum o'zgaruvchi | Saqlanmaydi, xato ko'rsatiladi (14.8) | KELISHILDI |
| EC-SOZ-05 | Spravochnikdagi yagona faol qiymat nofaol qilinmoqchi | Bloklanadi (14.9) | KELISHILDI |
| EC-SOZ-06 | Standart chegara o'zgartirildi, materialda alohida qiymat bor | Materialdagi qiymat ustun (14.4) | KELISHILDI |
| EC-SOZ-07 | Bildirishnoma o'chirilgan, hodisa sodir bo'ldi | Xabar ketmaydi, lekin audit jurnaliga yoziladi | KELISHILDI |
| EC-SOZ-08 | Bildirishnoma ikki kanalga sozlangan | Ikkalasiga ham boradi (14.7) | KELISHILDI |
| EC-SOZ-09 | Bildirishnoma aniq xodimga sozlangan, u ishdan bo'shadi | Adminga fallback, ogohlantirish chiqadi | KELISHILDI |
| EC-SOZ-10 | Sozlama o'zgartirildi, kim o'zgartirgani noma'lum | Har o'zgarish audit jurnaliga tushadi (2.4) | KELISHILDI |

### 16.10. Qo'shimcha modullar edge case'lari

| Kod | Holat | Qaror | Holati |
|---|---|---|---|
| EC-INV-01 | Inventarizatsiyada farq chiqdi | Sabab majburiy, qoldiq haqiqiy songa tenglashadi, xarajatga tushadi (15.1) | KELISHILDI |
| EC-INV-02 | Ortiqcha chiqdi | Daromad emas, xarajat kamayishi (15.1) | KELISHILDI |
| EC-INV-03 | Sanash paytida yangi kirim keldi | Sanash varaqasi chop etilgan paytdagi holatni ko'rsatadi. Kiritishda joriy qoldiq bilan solishtiriladi | KELISHILDI |
| EC-INV-04 | Band qilingan bo'lak sanaldi | Band bo'lsa ham jismonan omborda — sanaladi. Band alohida ustunda ko'rinadi | KELISHILDI |
| EC-INV-05 | Inventarizatsiya xato kiritildi | O'chirilmaydi, admin storno qiladi (2.1) | KELISHILDI |
| EC-XAR-01 | Bir material ikki yetkazib beruvchidan | Hammasi ko'rsatiladi, narxi bilan. Tanlash odamning ishi (15.3) | KELISHILDI |
| EC-XAR-02 | Kerak 0, lekin chegaradan past | Chegara darajasigacha olish taklif qilinadi (15.3) | KELISHILDI |
| EC-XAR-03 | Xarid ro'yxati saqlanadimi | Yo'q — har ochilganda qayta hisoblanadi (15.3) | KELISHILDI |
| EC-KUN-01 | Kunlik varaqa va kun yopish ikkitami | Bitta narsa. Varaqa — kun yopishning chop etiladigan ko'rinishi (15.4) | KELISHILDI |

---

## 17. v1.13 GA NISBATAN O'ZGARISHLAR

Eski hujjat bo'yicha ish boshlagan bo'lsangiz, avval shu ro'yxatni ko'ring.

### 17.1. Tuzatilgan xatolar

| Nima | Eski holat | Yangi holat |
|---|---|---|
| **Pozitsiya narxi formulasi** | `mato narxi × maydon + aksessuar` | `Σ(slot sarflashi × slot matosi narxi) + Σ(aksessuar) + xizmat haqi` (3.8) |
| **Hisob turlari** | 2.6.5 da ikkita: rulon, kv.metr | To'rtta: rulon, kv.metr, chiziqli, dona (5.2) |
| **Mato bog'lanishi** | Sotuv hujjatida "mahsulot turiga" | Slotga (5.7) |
| **Min. ostatka chegarasi** | Noaniq: kv.m yoki metr | Eni bo'yicha, metrda (5.5) |
| **Manfiy qoldiq taqiqi** | Barcha operatsiyalarga | Faqat avtomatik operatsiyalarga (2.5) |
| **% chegirma** | "KERAK EMAS" | Offset turlaridan biri (6.3) |
| **Ostatka strukturasi** | Kv.m bo'lib | `eni × bo'yi` (7.4) |

### 17.2. Yangi qo'shilganlar

- Offset uch xil bo'lishi (so'm / % / $) — 6.3
- Ombordan hisobdan chiqarish (brak) — 7.9
- Kirim defektining ikki yo'li — 7.8
- Kam qoldiq chegarasi barcha hisob turlariga — 5.5
- FIFO — dona materialning tannarxi uchun — 7.7
- Birlashtirib kesish — 7.5
- 1 sm bag'rikenglik — 7.5
- "Kutilmoqda" ko'rsatkichi — 7.3
- Boshlang'ich qoldiq qatori — 6.8, 7.10
- Qarzi bor mijozni nofaol qilish bloklanishi — 6.6
- Xizmat haqi ixtiyoriy — 4.7
- Slot va parametr o'chirish cheklovlari — 4.3, 4.4
- Aksessuar birligi (dona / metr / sm) — 3.7
- Kirim hujjatini storno qilish — 7.11
- Sotilmagan tayyor mahsulot ro'yxati — 7.12
- Majburiy komplektdagi oxirgi materialni nofaol qilish bloklanishi — 5.9
- Buyurtma hayoti moduli to'liq — 8-bo'lim
- Pozitsiya darajasida qaytarish — 8.10
- "Rad etilgan" statusi (bekor qilishdan alohida) — 8.8
- Ishni ustadan qaytarib olish — 8.6
- Qisman topshirish — 8.9
- Yetkazib beruvchilar moduli to'liq — 9-bo'lim
- Kurs farqi alohida xarajat moddasi — 9.6
- Yetkazib beruvchiga avans — 9.2
- Dollar qarzini so'mda to'lash — 9.5
- Kirimga qo'shimcha xarajatlar (transport, bojxona) — 7.8
- Minimal ustama chegarasi va kirimda tekshiruv — 5.4, 7.8
- Kirim stornosi uch joyga birdan — 7.11
- Narx tarixi — 9.8
- Xodimlar va ish haqi moduli to'liq — 10-bo'lim
- Xodim va foydalanuvchi bitta yozuv, bir nechta rol — 10.2, 10.3
- Bosqichli stavka jadvali — 10.8
- KPI: foiz kassaga kelgan puldan — 10.7
- Hisobotlar va dashboard — 11-bo'lim
- Excel eksportida ikki varaq — 11.2
- Ustama eroziyasi hisoboti — 11.7.5
- Muzlab qolgan pul hisoboti — 11.7.6
- Navbat holati hisoboti — 11.8.4
- Sotuvchi erkinliklari hisoboti — 11.5.6
- Kassa moduli to'liq — 12-bo'lim
- Ko'p kassali model: admin + har sotuvchiga o'ziniki — 12.2
- Har kassa yozuvi manbaga bog'lanadi, takrorlanish bazada bloklanadi — 12.3
- Xarajat va kassa chiqimi ajratildi — 12.1
- Sotuvchidan adminga topshiriq, tasdiqlash bilan — 12.7
- Ayirboshlash va bank komissiyasi — 12.9
- Operatsion xarajatlar — 12.10
- Egasi pul olishi — 12.11
- Kun yopish va farqni qayd etish — 12.17
- Kassa kitobida yuguruvchi qoldiq va ixtiyoriy sanaga kesim — 12.18
- Xarajat cheklari, takroriy xarajat, yaxlitlash — 12.19
- Har modul sahifasida ko'rsatkichlar paneli — 11.11
- Telegram bot moduli to'liq — 13-bo'lim
- Bitta bot, uchta panel (mijoz, usta, admin) — 13.1
- Botda buyurtma oqimi slot mexanizmiga o'tdi — 13.4
- Mijozga aniq narx, offset bilan — 13.5
- Usta botda o'z balansini ko'radi — 13.8
- Hisob-kitob varaqasi — 8.9
- Sozlamalar va ruxsatlar moduli — 14-bo'lim
- Kurs tarixi va o'zgarishlar jurnali — 14.5
- Ruxsatlar matritsasi amal darajasida — 14.6
- Bildirishnoma qoidalari, ikki kanal — 14.7
- Bot matnlari o'zgaruvchilar bilan — 14.8
- Spravochniklar bir joyda — 14.9
- Tayyorlik sanasi ixtiyoriy — 3.13 (eski 5.4-band bekor qilindi)
- Barcha uzunlik o'lchovi santimetrda — 5.3
- Kesimda uch qatorli yozuv — 7.6
- **Band qilish joriy etildi** — avvalgi "band qilinmaydi" qoidasi bekor — 7.3
- Bo'lak turlari: rulon va qoldiq kesma, rulon eni o'zgarmaydi — 7.4
- Uch daraja: yaroqli / kam ishlatiladigan / yaroqsiz — 7.5, 5.5
- Kesish qarori usta ishni olayotganda, tasdiq bilan — 7.6
- "Tugatdim" da manba tasdiqlanadi: ostatkadan yoki rulondan — 7.6
- Aniq bo'lak raqami kuzatilmaydi, faqat manba — 7.4, 7.6
- "Ostatka turgan holda rulon ochildi" hisoboti — 11.7.7
- Inventarizatsiya jarayoni — 15.1
- Yetishmayotgan materiallar ko'rinishi — 15.2
- Xarid ro'yxati — 15.3
- Kunlik yopish varaqasi — 15.4
- Navbat tartibi aniq bo'ldi, tasodifiy emas — 8.12

### 17.3. Eskirgan bo'limlar

**Eski hujjatning 10-bo'limi (interfeys tavsiflari) to'liq eskirgan.** U v1.11 asosida yozilgan va quyidagi joylarda hozirgi qarorlarga zid:

- 10.5.1 — mijoz va tayyorlik sanasi "majburiy" deb yozilgan (aslida ixtiyoriy)
- 10.8.2 — kirim turi 2 xil, tannarx qo'lda kiritiladi, slot yo'q, almashtirish guruhi yo'q
- 10.12.2 — konstruktorda slot, parametr, xizmat haqi va test kalkulyatori yo'q

**Bu bo'lim ishlatilmaydi.** Uning o'rniga shu hujjatning 3–7-bo'limlari amal qiladi.

---

## 18. YOPILGAN OCHIQ SAVOLLAR

Bu savollar hujjat davomida ochiq turgan edi va hammasi hal qilindi.

| Savol | Qaror | Band |
|---|---|---|
| Tayyorlik sanasi majburiymi | **Ixtiyoriy.** Eski 5.4-band bekor qilindi | 3.13 |
| Foizli offsetda yaxlitlash | **100 so'mgacha** | 6.3 |
| Dollar offsetida qaysi kurs | **Sozlamadagi joriy kurs** | 6.3, 14.3 |
| Karniz sarflash birligi | **Santimetr.** Barcha uzunlik smda | 5.3 |
| Chiqindi yozuvi | **Uch qator:** rulondan chiqim, ostatka kirim, chiqindi | 7.5 |
| Kam qoldiq ogohlantirishi kimga | **Bildirishnoma qoidalarida sozlanadi** | 14.7 |
| Bot mijozni qanday taniydi | **Telefon raqami bo'yicha** | 13.2 |

**Ochiq savol qolmadi.**

---

## 19. KEYINGI BO'LIMLAR

Quyidagilar hali yozilmagan. Har biri bir xil tartibda ishlanadi: muhokama → savollar → kelishuv → maket → yetishmayotganini qo'shish → shu hujjatga yozish.

### 19.1. Navbatdagi bo'limlar

| Bo'lim | Nega kerak | Nimaga bog'liq |
|---|---|---|
| **Sozlamalar va ruxsatlar** | Kurs, rollar, chegaralar | — |

### 19.2. Bajarilgan va bekor qilinganlar

Avval keyinroqqa qoldirilgan bo'lib, keyin hal qilingan narsalar:

| Nima | Holati |
|---|---|
| Inventarizatsiya jarayoni | **Bajarildi** — 15.1 |
| Xarid ro'yxati | **Bajarildi** — 15.3 |
| Yetishmayotgan materiallar ko'rinishi | **Bajarildi** — 15.2 |
| Kunlik yopish varaqasi | **Bajarildi** — 15.4 |
| Kirim dollarda bo'lganda tannarx valyutasi | **Allaqachon hal qilingan** — 9.6: kirim kunidagi kursda so'mga qotiriladi |
| Ostatkaning jismoniy joylashuvi (javon raqami) | **Bekor qilindi** — aniq bo'lak kuzatilmaydi, usta ostatkalar orasidan o'zi topadi (7.6) |

**Keyinroqqa qoldirilgan narsa qolmadi.**

---

*Hujjat oxiri. Keyingi versiyada yangi bo'limlar 19-bo'limdan olinib, o'z raqamiga qo'yiladi.*
