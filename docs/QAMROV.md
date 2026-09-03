# QAMROV — nima bor, nima yo'q

**Bu hujjat emas, ASBOB.** Har ish oxirida yangilanadi. Jadvalda ❌
qolgan bo'lsa — o'sha bo'lim **tayyor emas**.

Nega kerak: 2026-08-28 da egasi bir narsani **uch marta** aytishga
majbur bo'ldi («dropdownlarda qo'shish bo'lsin»). Har safar bitta
joy tuzatilib «bo'ldi» deyilardi. Teshik ko'rinmagani uchun shunday
bo'ldi. Endi ko'rinadi.

Oxirgi yangilanish: **2026-09-03** — sotuv cheki (TZ 8.9) va korxona
sozlamalari (TZ 14.3)

---

## 1. Ma'lumotnomalar

| Bo'lim | Ro'yxat | Qo'shish | Tahrirlash | O'chirish | Dropdownda boshqarish |
|---|:---:|:---:|:---:|:---:|:---:|
| Material | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mijoz | ✅ | ✅ | ✅ | ✅ | ✅ |
| Yetkazib beruvchi | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mahsulot turi | ✅ | ✅ | ✅ | ✅ | — |
| Almashtirish guruhi | ✅ | ✅ | ✅ | ✅ | ✅ |
| Filial | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kassa | ✅ | ✅ | — | ✅ | ✅ |
| Xodim | ✅ | ✅ | ✅ | ✅ | ✅ |

**O'chirish = nofaol qilish** (§3: `DELETE` yo'q). Yozuv ro'yxatdan,
dropdowndan va sotuvdan yo'qoladi, lekin eski buyurtmada nomi
ko'rinib turadi. Qaytarish mumkin.

⚠️ Ishlatilayotgan yozuv o'chirilmaydi va SABAB aytiladi: «omborda
4 ta bo'lak bor», «qarzi bor: 320 000 so'm». 10 test.

⚠️ **Kassa tahrirlanmaydi — ATAYLAB.** Kassaning turi, valyutasi
va egasi o'zgarsa, o'tgan yozuvlar boshqa kassaga tegishli bo'lib
qolardi (2.3-invariant). Kerak bo'lsa: eskisini o'chirib yangisini
ochish. Nomini o'zgartirish keyin qo'shilishi mumkin.

---

## 2. Dropdownlar — qayerda nima bor

«Boshqarish» = dropdown ichidan ro'yxatni ko'rish, tahrirlash,
o'chirish.

| Ekran | Dropdown | Qo'shish | Boshqarish |
|---|---|:---:|:---:|
| Material kartochkasi | Guruh | ✅ modal | ✅ `/guruh` |
| Kirim hujjati | Yetkazib beruvchi | ✅ modal | ✅ `/yetkazib` |
| Kirim hujjati | Material | ✅ modal | ✅ `/material` |
| Mahsulot turi | Guruh | ✅ modal | ✅ `/guruh` |
| Mahsulot turi | Material | ✅ modal | ✅ `/material` |
| Sotuv | Mijoz | ✅ modal | ✅ `/mijoz` |
| Mijoz kartochkasi | Mijoz guruhi | ✅ modal | ✅ `/mijoz/guruh` |
| To'lov | Kassa | — | ✅ `/kassa/royxat` |
| Filial kartochkasi | Xodim (tikuvchi) | — | ✅ `/xodim` |
| Ko'chirish | Filial | — | ✅ `/filial` |
| Ish haqi · Topshirish · Filial hisobi | Kassa | — | ✅ `/kassa/royxat` |

⚠️ Qo'shish ustuni «—»: kassa, xodim va filial ish oqimi ichidan
qo'shilmaydi — ular sozlama, o'z sahifasidan ochiladi. Boshqarish
havolasi esa bor.

---

## 3. Kunlik ish ekranlari

| Ekran | Ishlaydi | Izoh |
|---|:---:|---|
| Yangi buyurtma | ✅ | Qo'shimcha mahsulot ham ✅ · `/buyurtma/yangi` |
| Buyurtmalar tarixi | ✅ | |
| Yo'ldagilar | ✅ | |
| Ombor qoldig'i | ✅ | |
| Ombor tarixi | ✅ | Har harakat, sana/mahsulot/tur filtri |
| Boshlang'ich zahira | ✅ | Mahsulot saqlangach o'zi so'raladi |
| Qoldiqni to'g'rilash | ✅ | **Faqat admin** · `ombor.tuzatish` |
| Mijoz guruhlari | ✅ | Chegirma guruhda · shaxsiysi ustun |
| Kirim | ✅ | Narx metr/kv.m ✅ · yetkazuvchiga to'lov ✅ |
| Ish oqimi (boshlash / tugatdim) | ✅ | Veb-da, botdagi mantiq bilan |
| Yetkazuvchi qarzi va to'lovi | ✅ | Kartochkada qarz, tarix, to'lov |
| Chiqim | ✅ | |
| Ko'chirish | ✅ | |
| Inventarizatsiya | ✅ | |
| Qayta kesish | ✅ | |
| Kassa | ⚠️ | Kassa endi ochiladi, lekin bazada hali 0 ta |
| Filiallararo hisob | ✅ | |
| Boshqaruv | ✅ | |
| Korxona ma'lumotlari | ✅ | `/sozlama` — chekdagi rekvizit, filial kodi, bot nomi |
| Sotuv cheki (80 mm) | ⚠️ | Buyurtma yopilganda `/buyurtma/[id]/chek`. Brauzer chop etish oynasi orqali ishlaydi; **USB termoprinterga to'g'ridan-to'g'ri chiqarish yo'q** |
| Kvitansiya (qisman topshirish) | ❌ | 8.9 — alohida hujjat, yozilmagan |
| Hisob-kitob varaqasi | ❌ | 8.9 — mijoz tarixi va balansi, alohida hujjat |
| Kunlik yopish varaqasi | ❌ | 15.4 — chop etish naqshi endi bor, varaqning o'zi yo'q |

---

## 4. Rejadagi, boshlanmagan

| Nima | Kim so'ragan | Holat |
|---|---|---|
| Xarajat turlarini o'zi qo'shishi | egasi | 4-qadam, boshlanmagan |
| Guruhlarni boshqarish — bitta sahifa | egasi | 5-qadam, boshlanmagan |
| USB termoprinterga to'g'ridan-to'g'ri chop etish (ESC/POS) | egasi | Kassa kompyuteriga yordamchi dastur kerak — boshlanmagan |

⚠️ Bu ro'yxatda faqat BOSHLANMAGAN ish turadi. Bajarilgani darhol
o'chiriladi — aks holda «nima qolgani» ko'rinmay qoladi.

---

## 5. Texnik qarz

| Nima | Oqibati |
|---|---|
| Test bazasi ajratilmagan | Sinov ma'lumoti ishlaydigan bazaga yozilmoqda. Kassa testida allaqachon tishladi — pul yozuvini o'chirib bo'lmaydi |
| Baza deyarli bo'sh | Ekranlar haqiqiy ma'lumot bilan sinalmagan |
| Bot serverga chiqarilmagan | Render to'lov ma'lumoti kerak |
| Interfeys testi yo'q | Brauzer muhiti (`jsdom`) o'rnatilmagan — modal, forma xatti-harakati qo'lda sinaladi |
| 13.8 «Tugatdim» oqimi | 7-bosqichdan qolgan |
| Chek 80 mm da faqat ekranda sinalgan | Haqiqiy termoprinterda bosib ko'rilmagan — qog'oz kengligi va shrift o'lchami tekshirilishi kerak |

---

## 6. Hisobotlar (TZ 11) — 8-bosqich

Ustunlar: **Hisob** = domain funksiya va testi · **So'rov** = `lib/amal/`
baza so'rovi · **Ekran** = sahifa, jadval, grafik · **Eksport** = 11.2 dagi
ikki varaqli Excel.

| Hisobot | Hisob | So'rov | Ekran | Eksport |
|---|:---:|:---:|:---:|:---:|
| Davr filtri va taqqoslash (11.1) | ✅ | — | ✅ | — |
| ABC tahlil — ombor (11.6.2 mexanizmi) | ✅ | ✅ | ✅ | ❌ |
| Bashorat: tezlik → tugash muddati | ✅ | ✅ | ✅ | ❌ |
| Ustama eroziyasi (11.7.5) | ✅ | ✅ | ✅ | ❌ |
| Muzlab qolgan pul (11.7.6) | ✅ | ✅ | ✅ | ❌ |
| Qoldiq qiymati — jami (11.7.1) | ✅ | ✅ | ✅ | ❌ |
| Qoldiq — material kesimida (11.7.1) | — | ✅ | ✅ | ❌ |
| ABC tahlil — mijoz (11.6.2) | ✅ | ✅ | ✅ | ❌ |
| Material harakati (11.7.2) | — | ✅ | ✅ | ❌ |
| Kam qolgan va tugagan (11.7.3) | ✅ | ✅ | ✅ | ❌ |
| Chiqindi va brak (11.7.4) | — | ✅ | ✅ | ❌ |
| Rulon ochilgan holatlar (11.7.7) | ❌ | ❌ | ❌ | ❌ |
| Moliya (11.4.1–11.4.7) | ❌ | ❌ | ❌ | ❌ |
| Sotuv (11.5.1–11.5.6) | ❌ | ❌ | ❌ | ❌ |
| Mijozlar bazasi (11.6.1) | ❌ | ❌ | ❌ | ❌ |
| Ishlab chiqarish (11.8.1–11.8.4) | ❌ | ❌ | ❌ | ❌ |
| Narx dinamikasi (11.9.1) | ❌ | ❌ | ❌ | ❌ |
| Dashboard (11.3) | ❌ | ❌ | ❌ | — |
| Sahifa ustidagi panellar (11.11) | ❌ | ❌ | ❌ | — |

⚠️ **Hisob ✅ — ekran hali yo'q.** Domain qatlami tayyor degani hisobotni
foydalanuvchi ko'ra oladi degani EMAS. Bu ustun faqat formulaning
tekshirilganini bildiradi.

**K-08 (ustama eroziyasi, 37.4%) yopildi** — `test/domain/hisobot-ombor.test.ts`.
Shu bilan CLAUDE.md §6 dagi 11 ta kanonik raqamning hammasi TAYYOR.

**Ruxsat (11.10):** `hisobot.ombor.kor` · `hisobot.sotuv.kor` ·
`hisobot.mijoz.kor` · `hisobot.moliya.kor`. Ombor hisobotida TANNARX bor,
shuning uchun u sotuvchiga urug'da berilmaydi.

**So'rovlar `ekran-sorovlari.test.ts` da qoplangan** (T-01) va ishchi bazada
bir marta o'qish rejimida yurgizib ko'rilgan.

Yangi statistikalar ro'yxati va chart mosligi: `docs/HISOBOTLAR-ISH.md`.

---

## Yangilash qoidasi

- Ish tugagach shu jadval yangilanadi — **so'ralmasa ham**
- ❌ ✅ ga aylantirilganda: qaysi test buni tekshirayotgani aytiladi
- Yangi imkoniyat qo'shilsa, u **ustun** bo'lib qo'shiladi va hamma
  qatorda holati belgilanadi. Bitta qatorni to'ldirib qolganini
  bo'sh qoldirish — aynan shu hujjat oldini olmoqchi bo'lgan xato

| Mijoz turlari | ✅ | Spravochnik · soliq belgisi |
