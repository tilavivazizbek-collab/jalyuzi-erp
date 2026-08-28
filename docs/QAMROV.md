# QAMROV — nima bor, nima yo'q

**Bu hujjat emas, ASBOB.** Har ish oxirida yangilanadi. Jadvalda ❌
qolgan bo'lsa — o'sha bo'lim **tayyor emas**.

Nega kerak: 2026-08-28 da egasi bir narsani **uch marta** aytishga
majbur bo'ldi («dropdownlarda qo'shish bo'lsin»). Har safar bitta
joy tuzatilib «bo'ldi» deyilardi. Teshik ko'rinmagani uchun shunday
bo'ldi. Endi ko'rinadi.

Oxirgi yangilanish: **2026-08-28** (o'chirish qo'shildi)

---

## 1. Ma'lumotnomalar

| Bo'lim | Ro'yxat | Qo'shish | Tahrirlash | O'chirish | Dropdownda boshqarish |
|---|:---:|:---:|:---:|:---:|:---:|
| Material | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mijoz | ✅ | ✅ | ✅ | ✅ | ✅ |
| Yetkazib beruvchi | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mahsulot turi | ✅ | ✅ | ✅ | ✅ | — |
| Almashtirish guruhi | ✅ | ✅ | ✅ | ✅ | ✅ |
| Filial | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Kassa** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Xodim** | ❌ | ❌ | ❌ | ❌ | ❌ |

**O'chirish = nofaol qilish** (§3: `DELETE` yo'q). Yozuv ro'yxatdan,
dropdowndan va sotuvdan yo'qoladi, lekin eski buyurtmada nomi
ko'rinib turadi. Qaytarish mumkin.

⚠️ Ishlatilayotgan yozuv o'chirilmaydi va SABAB aytiladi: «omborda
4 ta bo'lak bor», «qarzi bor: 320 000 so'm». 10 test.

**Kassa** — tahrirlash va o'chirish qolgan.
**Xodim** — butun bo'lim yo'q. Yangi sotuvchi ishga olsangiz uni
tizimga qo'sha olmaysiz.

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
| Kassa tahrirlash va o'chirish | audit | **qolgan** |
| Xodim bo'limi (butun) | audit | **qolgan** |
| Kassa · Filial · Xodim dropdownlarida boshqarish | egasi | **qolgan** |
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
