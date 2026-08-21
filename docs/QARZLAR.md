# TEXNIK QARZLAR

Bilib turib qoldirilgan ishlar. Har biri **yozib qo'yiladi** — aks holda
ular unutiladi va bir kun xato bo'lib qaytadi.

CLAUDE.md §5: «TZ ga zid yozib "keyin tuzatamiz" — keyin kelmaydi.»
Shuning uchun bu ro'yxat qisqa bo'lishi va bo'shab borishi kerak.

| # | Qarz | Qachon yopiladi | Xavf |
|---|---|---|---|
| T-01 | Interfeys oqimlari avtomat sinalmagan | 2-bosqich | O'rta |
| T-02 | `docker compose up` tekshiruvi bajarilmagan | Docker o'rnatilganda | Past |
| T-03 | Qarorlar hujjatga ko'chirilmagan | Egasi tasdiqlagach | O'rta |
| ~~T-04~~ | ~~`band` va `bolak` ning buyurtma tashqi kalitlari~~ | ✅ yopildi | — |
| ~~T-05~~ | ~~Kirimda yetkazib beruvchi qarzi yozilmaydi~~ | ✅ yopildi | — |
| ~~T-06~~ | ~~Baza testlari bir martalik edi~~ | ✅ yopildi | — |
| T-07 | Inventarizatsiya farqlari hisoboti | 8-bosqich | Past |
| T-08 | Masofadagi baza tarmoq uzilishlari | 10-bosqich | O'rta |
| ~~T-09~~ | ~~Qayta kesishda ustaning haqi bekor qilinmaydi~~ | ✅ yopildi | — |

---

## T-01 · Interfeys oqimlari avtomat sinalmagan

**Bosqich:** 1 · **Tegadi:** QISM 1 §14.2

### Holat

`lib/kirish/cookie.ts` va `lib/kirish/joriy.ts` Next.js ga bog'langan —
sof funksiya sifatida chaqirib bo'lmaydi, shuning uchun ular qamrov
o'lchovidan chiqarilgan.

Ular **qo'lda tekshirilgan** (brauzer so'rovlari bilan, 13/13 o'tgan):
kirmagan odam himoyalangan sahifani ko'rmaydi, muddati tugagan va bekor
qilingan token kirish ekraniga yuboradi, sahifa chizilganda cookie
yozilmaydi.

Lekin bu tekshiruv **saqlanmagan** — regressiya ushlanmaydi.

### Nega hozir yopilmadi

QISM 1 §14.2 buni Playwright ga havola qiladi. Playwright brauzerlarni
yuklab olishni talab qiladi (~400 MB), tarmoq esa bu kompyuterda beqaror:
bugun `npm install` bir marta, PostgreSQL fayllari ikki marta uzilgan.

Interfeysi bo'lgan birinchi to'liq modul — 2-bosqich (spravochniklar).
Playwright o'sha yerda o'rnatiladi va bu qarz birdan yopiladi.

### Qanday yopiladi

`test/brauzer/kirish.spec.ts`:
· kirmagan odam `/boshqaruv` ga kirsa `/kirish` ga tushadi
· to'g'ri parol bilan kiradi, panel ochiladi
· 5 xato urinishdan keyin blok xabari chiqadi
· chiqish tugmasi sessiyani o'ldiradi
· usta parol bilan ham kira olmaydi

### Vaqtinchalik himoya

Bu qarz to'liq ochiq emas: kirish **tranzaksiyasi** va baza to'siqlari
`npm run test:baza` da 34 ta test bilan qoplangan. Yopilmagani —
Next.js qatlamining o'zi (cookie, redirect).

---

## T-02 · `docker compose up` tekshiruvi bajarilmagan

**Bosqich:** 0 · **Tegadi:** QISM 1 §2.3

«Loyiha loqal kompyuterda `docker compose up` bilan to'liq ishlashi shart.
Ishlamasa — platformaga bog'langan.»

`docker-compose.yml` va `Dockerfile` yozilgan, lekin **ishga tushirilmagan**:
egasining kompyuterida Docker yo'q (administrator huquqi va WSL2 kerak,
ikkalasi ham UAC oynasini ochadi).

Xavf past: loyiha oddiy `postgres.js` bilan oddiy `postgres://` manzilga
ulanadi, platforma SDK lari linterda bloklangan (P-12). Ya'ni §2.3 ning
maqsadi bajarilgan, faqat tekshiruvning o'zi qolgan.

Docker paydo bo'lgan kuni: `docker compose --profile toliq up` va natija
shu yerga yoziladi.

---

## T-03 · Qarorlar hujjatga ko'chirilmagan

**Bosqich:** 0–1 · **Tegadi:** QISM 1 §2.4

`docs/QARORLAR-KOD.md` da 14 ta qaror `⏳ tasdiq kutilmoqda` holatida.

QISM 1 §2.4: «Kod TZ dan chetga chiqsa — TZ yangilanadi, kod emas.»
Ya'ni egasi tasdiqlagach ular `LOYIHA.md` ga ko'chirilishi va u yerdagi
eski matn tuzatilishi kerak.

Ko'chirilmasa hujjat va kod bir-biridan uzoqlashib boradi — bu loyihaning
boshidagi muammoning aynan o'zi (TZ auditdan o'tgan, lekin matni
tuzatilmagan).

Eng muhim uchtasi:

| # | Hujjatda nima tuzatiladi |
|---|---|
| P-01 | QISM 1 §3.1 dagi `Som`/`Dollar` namunasi — u invariantni himoya qilmaydi |
| P-02 | QISM 1 §20 dagi «bitta ombor, bitta filial» qatori — Q-21 ga zid |
| P-05 | QISM 3 §1.2 dagi `rol_id` — TZ 10.3 bilan zid, `xodim_rol` bo'lishi kerak |


---

## T-04 · `band` va `bolak` tashqi kalitlari — YOPILDI

**Sana:** 2026-08-21 · **Bosqich:** 4 · **Holat:** ✅ yopildi

Uch ustun endi haqiqiy jadvalga bog'landi (migratsiya 0013):

```
band.buyurtma_pozitsiya_id   → buyurtma_pozitsiya(id)
band.pozitsiya_material_id   → pozitsiya_material(id)
bolak.buyurtma_pozitsiya_id  → buyurtma_pozitsiya(id)
```

`ON DELETE CASCADE` yo'q (§6.3) — pozitsiya o'chirilmaydi, bekor qilinadi.

### Nima chiqdi

Tashqi kalit qo'yilishi bilan **testlar yiqildi**. Ular `700 001`,
`1004`, `3001` kabi **o'ylab topilgan** pozitsiya raqamlari bilan band
yozardi va bu faqat tashqi kalit YO'Q bo'lgani uchun o'tardi.

Ya'ni bu testlar T-04 gacha bazaning to'liq qoidalari ostida
ishlamagan. Endi `test/integratsiya/yordamchi.ts` dagi
`pozitsiyaTolqini()` haqiqiy buyurtma → pozitsiya → pozitsiya_material
zanjirini yaratadi va testlar undan oladi.

Sinov bazasidagi 154 ta eski `band` qatori o'chirildi — ularning
hammasi shu soxta raqamlar bilan yozilgan test qoldig'i edi.

### Dars

Kechiktirilgan tashqi kalit **testni ham kechiktiradi**. Kalit
qo'yilmaguncha test bazaning haqiqiy qoidasini emas, yumshoq holatini
sinaydi.

---

## T-05 · Kirimda yetkazib beruvchi qarzi — YOPILDI

**Sana:** 2026-08-21 · **Bosqich:** 5 · **Holat:** ✅ yopildi

`kirimYarat()` endi O'SHA tranzaksiyada `yetkazib_beruvchi_harakat` ga
`XARID` yozuvini qo'shadi (QISM 1 §7.1 talab qilgan uchinchi ish).

**Transport va bojxona qarzga KIRMAYDI.** Ular alohida to'lanadi (C3
kodi) va tannarxga allaqachon qo'shilgan — ikkalasini ham qarzga
qo'shish pulni ikki marta sanardi.

Storno ham qarzni qaytaradi: harakat jadvali o'zgarmas (§6.5), shuning
uchun TESKARI YOZUV qo'shiladi va asl `XARID` qatori tarixda qoladi.

Testi: `test/integratsiya/kirim.test.ts` — «xarid summasi qarzga
tushadi» va «storno qarzni teskari yozuv bilan qaytaradi» (jurnal
yig'indisi nolga qaytadi, 2.2-invariant).

---

## T-06 · Baza testlari bir martalik edi — YOPILDI

**Sana:** 2026-08-20 · **Bosqich:** 3 · **Holat:** ✅ yopildi

### Nima bo'ldi

Tarmoq uzilgan kunda baza testlari umuman ishga tushmadi
(`CONNECT_TIMEOUT`, `ECONNRESET`, `ENOTFOUND`). Tarmoq tiklangach to'liq
to'plam yurgizilganda **ikki xil** muammo chiqdi — ikkalasi ham testning
o'zida, kodda emas:

| Test | Muammo | Yechim |
|---|---|---|
| `himoya.test.ts` · P-07 | 9600/9601 qat'iy id lar tozalanmasdi → ikkinchi yurishda `duplicate key` | Test o'zidan oldin tozalaydi (halqa uchun kechiktirilgan cheklovlar bilan) |
| `himoya.test.ts` · §13 | 11 ta jadval nomi QO'LDA sanalgan edi, 2 va 3-bosqich 19 ta qo'shdi | Ro'yxat `lib/db/schema/index.ts` dan olinadi — endi eskirmaydi |
| `spravochnik-amal.test.ts` | Mijoz ismi va telefoni qat'iy edi → ikkinchi yurishda birinchi test DUBLIKAT olardi va keyingi 4 tasi qulardi | Har yurishda yangi ism/telefon |

### Dars

**Baza testi bir marta emas, HAR SAFAR o'tishi kerak.** Qat'iy id yoki
qat'iy nom ishlatgan test birinchi yurishdan keyin o'zini o'zi buzadi va
buni «kod buzildi» deb o'qish oson.

Endi qoida: baza testida ishlatilgan har qanday noyob qiymat yo har
yurishda yangi bo'ladi, yo test o'zidan oldin tozalaydi.

### Yon ta'sir

`vitest.baza.config.ts` da limit 30 s dan **120 s** ga ko'tarildi — baza
10-bosqichgacha masofada turadi va kechikish sakraganda to'g'ri kod
«yiqilgan» bo'lib ko'rinardi.

---

## T-07 · Inventarizatsiya farqlari hisoboti

**Sana:** 2026-08-20 · **Bosqich:** 8 (hisobotlar) · **Manba:** TZ 15.1

### Nima yetishmaydi

15.1 davr va omborchi kesimidagi hisobotni talab qiladi:

```
Omborchi   O'tkazilgan   Farq bo'lgan   Jami farq (tannarx)
Anvar               12              7        −1 840 000
```

Hujjat uni shunday izohlaydi:

> «Ombor uchta yo'l bilan kamayishi mumkin... Uchalasi ham omborchi
>  qo'lida va admin tasdig'isiz. Shuning uchun bu hisobot **majburiy** —
>  u yagona nazorat vositasi.»

### Hozir nima bor

`/ombor/inventarizatsiya` ro'yxati har varaqa uchun **kim**, **nechta
qator**, **nechta farq** va **jami farq** ni ko'rsatadi. Ya'ni nazorat
ma'lumoti bor, lekin omborchi kesimida **jamlanmagan** va davr bo'yicha
filtrlanmaydi.

### Nega 8-bosqichga qoldirildi

Bu hisobot foyda-zarar (11.4.1) bilan bir xil manbadan oziqlanadi va
xarajat moddasi bo'lib ham chiqadi. Ikkalasini bir vaqtda yozish
mantiqiy: aks holda bir formula ikki joyda paydo bo'ladi (§2.2).

### Yopilish sharti

11-bo'lim hisobotlari yozilganda `Ombor braki` va `Inventarizatsiya
farqi` moddalari birga chiqadi va omborchi kesimi shu yerdan tayyorlanadi.

---

## T-08 · Masofadagi baza tarmoq uzilishlari

**Sana:** 2026-08-21 · **Bosqich:** 10 da yopiladi · **Xavf:** o'rta (chalg'itadi)

### Holat

`npm run test:baza` ba'zan qizil bo'ladi, ba'zan yashil — **bir xil kod
bilan**. Bir kunda kuzatilgan namuna:

| Yurish | Natija | Xato turi |
|---|---|---|
| 1 | 11 yiqildi | `getaddrinfo ENOTFOUND`, `CONNECTION_CLOSED` |
| 2 | 220/220 yashil | — |

Xatolar HAR SAFAR boshqa testlarda chiqadi va hammasi bir xil sababdan:
baza 10-bosqichgacha **masofada** turibdi va uy tarmog'i uzilib turadi.
Shu kuni brauzer va API so'rovlari ham `ENOTFOUND` bergan.

### Nega bu xavfli

Tarmoq xatosi **kod xatosiga o'xshaydi**: test qizil, xabar uzun,
odam kodni qidira boshlaydi. Bir necha marta shunday bo'ldi va har
safar sabab tarmoq chiqdi.

### Qanday ajratiladi

```bash
npm run test:baza 2>&1 | grep -E "ENOTFOUND|ECONNRESET|CONNECT_TIMEOUT|CONNECTION_CLOSED"
```

Chiqsa — **tarmoq**, kod emas. Qayta yurgizish kifoya.

### Yopilishi

10-bosqichda baza egasining o'z serveriga (yoki loqal Docker'ga)
ko'chiriladi va bu muammo o'z-o'zidan yo'qoladi. `docker compose up`
bilan loqal ishlash talabi (QISM 1 §2.3) allaqachon bor.

### Vaqtinchalik chora

`vitest.baza.config.ts` da limit 120 s — kechikish sakraganda to'g'ri
kod «yiqilgan» bo'lib ko'rinmasin. Bu uzilishning o'zini yopmaydi,
faqat sekinlikni yopadi.

---

## T-09 · Qayta kesishda ustaning haqi — YOPILDI

**Sana:** 2026-08-21 · **Bosqich:** 5 · **Holat:** ✅ yopildi

Uch narsa qo'shildi:

| Qaerda | Nima |
|---|---|
| `tugatdim()` | 10.10 — haq «Tugatdim» da hisoblanadi: `xodim_harakat` ga `HAQ`, `xarajat` ga `ISH_HAQI` (kassa yozuvisiz, 12.1) |
| `qaytaKesishHal()` | Q-15 — `HAQ_BEKOR` teskari yozuvi, xarajat ham teskari |
| `qaytaKesishHal()` | 10.13 · 8.17.6 — ushlanma `USHLANMA` yozuvi va MANFIY `ISH_HAQI` xarajati |

**8.17.5.1 istisnosi** — material defekti bo'lsa `haqSaqlandi = true`
va teskari yozuv umuman qo'yilmaydi.

**8.17.7** — ikkinchi marta yechilgan material `ISHLAB_CHIQARISH_BRAKI`
moddasiga tushadi, `CHIQINDI` ga emas.

### Yo'l-yo'lakay topilgan narsa

Ushlanma dastlab ustaning HAQ yozuvidan izlanardi. Lekin 10.13 oldindan
hisoblangan haqni talab qilmaydi: usta matoni «Tugatdim» dan oldin
buzgan bo'lsa haq hali yozilmagan, ushlanma esa baribir qo'yilishi
mumkin. Usta endi POZITSIYADAN olinadi.

Testi: `test/integratsiya/qayta-kesish.test.ts` — «usta ikki marta
ishlagan bo'lsa ham BIR MARTA oladi» (balans nolga qaytadi).
