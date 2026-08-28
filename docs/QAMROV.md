# QAMROV — nima bor, nima yo'q

**Bu hujjat emas, ASBOB.** Har ish oxirida yangilanadi. Jadvalda ❌
qolgan bo'lsa — o'sha bo'lim **tayyor emas**.

Nega kerak: 2026-08-28 da egasi bir narsani **uch marta** aytishga
majbur bo'ldi («dropdownlarda qo'shish bo'lsin»). Har safar bitta
joy tuzatilib «bo'ldi» deyilardi. Teshik ko'rinmagani uchun shunday
bo'ldi. Endi ko'rinadi.

Oxirgi yangilanish: **2026-08-28**

---

## 1. Ma'lumotnomalar

| Bo'lim | Ro'yxat | Qo'shish | Tahrirlash | O'chirish | Dropdownda boshqarish |
|---|:---:|:---:|:---:|:---:|:---:|
| Material | ✅ | ✅ | ✅ | ❌ | ❌ |
| Mijoz | ✅ | ✅ | ✅ | ❌ | ❌ |
| Yetkazib beruvchi | ✅ | ✅ | ✅ | ❌ | ❌ |
| Mahsulot turi | ✅ | ✅ | ✅ | ❌ | — |
| **Almashtirish guruhi** | ❌ | ⚠️ modal | ❌ | ❌ | ❌ |
| Filial | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Kassa** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Xodim** | ❌ | ❌ | ❌ | ❌ | ❌ |

⚠️ «modal» — faqat modal oynadan qo'shiladi, o'z sahifasi yo'q.

**O'chirish hech qayerda yo'q.** Na tugma, na amal, na ruxsat kodi.
Ya'ni eski keraksiz material yoki guruh ro'yxatlarda abadiy qoladi.

**Xodim** — faqat urug'dagi 5 ta bor. Yangi sotuvchi ishga olsangiz
uni tizimga qo'sha olmaysiz.

---

## 2. Dropdownlar — qayerda nima bor

«Boshqarish» = dropdown ichidan ro'yxatni ko'rish, tahrirlash,
o'chirish.

| Ekran | Dropdown | Qo'shish | Boshqarish |
|---|---|:---:|:---:|
| Material kartochkasi | Guruh | ✅ modal | ❌ |
| Kirim hujjati | Yetkazib beruvchi | ✅ modal | ❌ |
| Kirim hujjati | Material | ✅ modal | ❌ |
| Mahsulot turi | Guruh | ✅ modal | ❌ |
| Mahsulot turi | Material | ✅ modal | ❌ |
| Sotuv | Mijoz | ✅ modal | ❌ |
| To'lov | Kassa | ❌ | ❌ |
| Ish haqi | Kassa | ❌ | ❌ |
| Kassa topshirish | Kassa | ❌ | ❌ |
| Filiallararo hisob | Kassa · Filial | ❌ | ❌ |
| Filial kartochkasi | Xodim (tikuvchi) | ❌ | ❌ |
| Ko'chirish | Filial | ❌ | ❌ |

---

## 3. Kunlik ish ekranlari

| Ekran | Ishlaydi | Izoh |
|---|:---:|---|
| Sotuv | ✅ | Qo'shimcha mahsulot sotish ❌ (rejada) |
| Buyurtmalar | ✅ | |
| Yo'ldagilar | ✅ | |
| Ombor qoldig'i | ✅ | |
| Kirim | ✅ | Narx metr bo'yicha ❌ (rejada) |
| Chiqim | ✅ | |
| Ko'chirish | ✅ | |
| Inventarizatsiya | ✅ | |
| Qayta kesish | ✅ | |
| Kassa | ⚠️ | Kassa endi ochiladi, lekin bazada hali 0 ta |
| Filiallararo hisob | ✅ | |
| Boshqaruv | ✅ | |

---

## 4. Rejadagi, boshlanmagan

| Nima | Kim so'ragan | Holat |
|---|---|---|
| Hamma joyda o'chirish + dropdownda boshqarish | egasi, 3 marta | tasdiqlangan |
| Kirim narxi metr bo'yicha (`4$ × 50 m`) | egasi | tasdiqlangan |
| Rasm — mahsulot turi va matolarda | egasi | tasdiqlangan |
| Sotuvda qo'shimcha mahsulot | egasi | tasdiqlangan |
| Xodim yaratish | audit | tasdiqlangan |
| To'lov ekranlariga kassa modali | audit | tasdiqlangan |

---

## 5. Texnik qarz

| Nima | Oqibati |
|---|---|
| Test bazasi ajratilmagan | Sinov ma'lumoti ishlaydigan bazaga yozilmoqda. Kassa testida allaqachon tishladi — pul yozuvini o'chirib bo'lmaydi |
| Baza deyarli bo'sh | Ekranlar haqiqiy ma'lumot bilan sinalmagan |
| Bot serverga chiqarilmagan | Render to'lov ma'lumoti kerak |
| Interfeys testi yo'q | Brauzer muhiti (`jsdom`) o'rnatilmagan — modal, forma xatti-harakati qo'lda sinaladi |
| 13.8 «Tugatdim» oqimi | 7-bosqichdan qolgan |

---

## Yangilash qoidasi

- Ish tugagach shu jadval yangilanadi — **so'ralmasa ham**
- ❌ ✅ ga aylantirilganda: qaysi test buni tekshirayotgani aytiladi
- Yangi imkoniyat qo'shilsa, u **ustun** bo'lib qo'shiladi va hamma
  qatorda holati belgilanadi. Bitta qatorni to'ldirib qolganini
  bo'sh qoldirish — aynan shu hujjat oldini olmoqchi bo'lgan xato
