# QAMROV — nima bor, nima yo'q

**Bu hujjat emas, ASBOB.** Har ish oxirida yangilanadi. Jadvalda ❌
qolgan bo'lsa — o'sha bo'lim **tayyor emas**.

Nega kerak: 2026-08-28 da egasi bir narsani **uch marta** aytishga
majbur bo'ldi («dropdownlarda qo'shish bo'lsin»). Har safar bitta
joy tuzatilib «bo'ldi» deyilardi. Teshik ko'rinmagani uchun shunday
bo'ldi. Endi ko'rinadi.

Oxirgi yangilanish: **2026-08-28** — aksessuar ombordan yechiladi

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
| Mijoz guruhlari | ✅ | Chegirma guruhda · shaxsiysi ustun |
| Kirim | ✅ | Narx metr bo'yicha ham ✅ |
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
| Xarajat turlarini o'zi qo'shishi | egasi | 4-qadam, boshlanmagan |
| Guruhlarni boshqarish — bitta sahifa | egasi | 5-qadam, boshlanmagan |

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

---

## Yangilash qoidasi

- Ish tugagach shu jadval yangilanadi — **so'ralmasa ham**
- ❌ ✅ ga aylantirilganda: qaysi test buni tekshirayotgani aytiladi
- Yangi imkoniyat qo'shilsa, u **ustun** bo'lib qo'shiladi va hamma
  qatorda holati belgilanadi. Bitta qatorni to'ldirib qolganini
  bo'sh qoldirish — aynan shu hujjat oldini olmoqchi bo'lgan xato
