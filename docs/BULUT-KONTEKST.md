# Bulut kontekstі — loqal xotiradan ko'chirilgan

Bu fayl **bulutda ishlaydigan Claude uchun**. Loyiha egasining kompyuterida
Claude'ning loqal xotirasi bor (`~/.claude/.../memory/`), lekin u git'ga
tushmaydi — kompyuter o'chiq bo'lganda bulutdagi sessiya uni ko'rmaydi.
Shuning uchun eng muhim qarorlar shu yerga ko'chirilgan.

**Yangilash qoidasi:** loqal sessiyada xotira o'zgarsa, shu fayl ham
yangilanadi va push qilinadi. Aks holda bulut eskirgan kontekst bilan ishlaydi.

---

## 1. Ish tartibi — tasdiq so'ralmaydi

Egasi dasturchi emas. Texnik qarorlar **mustaqil** qabul qilinadi,
`docs/QARORLAR-KOD.md` ga `P-NN` bo'lib yoziladi, hisobotda bir qatorda
aytiladi. «Boshlaymi?» deb so'ralmaydi.

Qadam **to'liq test qilinmasdan** tugagan hisoblanmaydi:
`npm run typecheck` · `npm run lint` · `npm test` · `npm run test:baza` ·
`npm run build` — hammasi yashil bo'lishi kerak.

**Baribir to'xtaladigan uchta holat:**
1. Faqat egasi javob bera oladigan **biznes** savoli (narx qoidasi, ish
   jarayoni, kim nima qiladi)
2. **Jismoniy to'siq** — dastur o'rnatish, server ijarasi, parol berish
3. **Qaytarib bo'lmaydigan** ish — ishlab chiqarish bazasiga yozish,
   tashqariga yuborish

## 2. Baza — Render.com'da, loqal Docker yo'q

Baza `dpg-...frankfurt-postgres.render.com:5432/jalyuzi`, sinov bazasi
o'sha serverda `jalyuzi_sinov`. Egasining kompyuterida `docker` umuman
o'rnatilmagan (T-02 qarzi).

⚠️ Ishlaydigan baza — unga faqat `SELECT`. Ruxsatsiz yozish/tozalash yo'q.

Oqibati (T-08): tarmoq uzilsa baza testlari qizil bo'ladi, kod esa sog'.
`vitest.baza.config.ts` da `retry: 2` va 120 s chegara shuning uchun.

## 3. Baza testi qizil bo'lsa — avval tarmoqni ayblang

```
sed 's/\x1b\[[0-9;]*m//g' baza-*.log | grep -c ENOTFOUND
```
Nol bo'lsa xatolar haqiqiy. Ko'p bo'lsa — internet, kod emas.

## 4. Baza testi ketayotganda kutilmaydi

`npm run test:baza` ~50 daqiqa. Yurish ketayotganda faqat `app/`, `docs/`
va **yangi** fayllarga tegiladi — testlar `app/` ni import qilmaydi
(`server-only`), yangi faylni yurish ko'rmaydi. `lib/` va mavjud `test/`
fayllari yurish tugagandan keyin o'zgartiriladi: vitest faylni navbati
kelganda o'qiydi, yarim yozilgan kod soxta qizil beradi.

Har qadamdan keyin to'liq baza shart emas — `npm test` + o'sha qadamning
test fayli yetadi. To'liq baza **bosqich** oxirida, ikki marta.

## 5. Ombor va kesish — TZ'dan farq qiladigan to'rt qaror

Egasi 2026-09-05 da tasdiqladi:

1. **Kesimdan IKKI qoldiq qoladi**, bitta emas. 3 × 35 rulondan 1.5 × 5
   kesilsa: rulon 3 × 30 bo'lib qoladi (RULON, `ochilgan=true`) va yon
   kesma 1.5 × 5 tug'iladi (OSTATKA). Kesmaning bo'yi — doim
   **buyurtmaning** bo'yi.
2. Bu qoida **kesmalarga ham** qo'llanadi: 2 × 8 kesmadan 1.5 × 5 kesilsa
   2 × 3 va 0.5 × 5 qoladi.
3. **Tanlov navbati TZ'dan farq qiladi.** TZ 7.6 «kesma → ochiq rulon →
   yangi rulon» deydi; kelishilgan shakl: *aniq mos kesma → ochiq rulon →
   boshqa kesma → yangi rulon*. Bu egasining **ongli** qarori — «TZ shunday
   emas-ku» deb qaytarib tashlanmaydi.
4. **Qoldiqni tizim hisoblaydi, usta tuzata oladi** (mato qiyshiq kesilsa
   5–10 sm og'ish oddiy).

Hammasi `lib/domain/kesish.ts` da izohlangan. Egasi omboridagi ochilgan
rulonlarni **o'zi** to'g'rilaydi — bazaga tegilmaydi.

## 6. Sarf formulalari — bazada, kodda emas

Formulalar `mahsulot_slot.formula` ustunida saqlanadi; `CEIL`, `MIN`, `MAX`
qo'llab-quvvatlanadi. Kesish yo'nalishi hal qilingan. Formulani kodga
ko'chirish taklif qilinmaydi.

## 6a. Metr tizimi — santimetr YO'Q (2026-09-20)

`Santimetr` turi, `sm()`, `smToM`, `mToSm`, `kvSmToKvM`, `maydonKvSm` —
hammasi **o'chirilgan**. `SarflashBirligi` endi `'M' | 'KV_M' | 'DONA'`.
Buyurtma ham, bo'lak ham, sarf ham metrda; maydon — kv.m.

**Nega:** har `÷100` beshta ayri joyda turardi (`kesimOlchami`, `olchovi`,
`qatorSummasi`, `birlikda`, `miqdorMatni`) va bittasi unutilsa raqam 100
yoki 10 000 barobar adashardi. Egasi: «ba'zi joylarda 100 ga o'tgansan».

**Baza holati:** migratsiya `0043_metr_tizimi` ishlab chiqarishga
**qo'llangan** (jami 44 ta). Qaytarish nuqtasi `zaxira_0043_*`
jadvallarida — o'chirilmaydi.

**Ikki tuzoq:**

1. **`numeric` = MATN.** `buyurtma_pozitsiya.eni_m/boyi_m` endi
   `numeric(8,2)` va postgres.js undan `'2.50'` qaytaradi, `2.5` emas.
   Har o'qishda `::text` + `Number()` — `band.ts` dagi konvensiya.
   Typecheck buni **ko'rmaydi** (qator turlari qo'lda yozilgan), faqat
   baza testlari ushlaydi. Shu sabab `'2.50' !== 2.5` solishtiruvi
   tahrirlashda har safar «o'lcham o'zgardi» deb hisoblardi.
2. **Formula matni o'girilmagan** — ATAYLAB. `MAYDON * 1.12` dagi 1.12
   koeffitsient, `ENI - 2` dagi 2 esa santimetr; sondan ma'nosini bilib
   bo'lmaydi. `npm run db:formula-tekshir` shubhalisini ko'rsatadi
   (formulalarni ham, `mahsulot_parametr.standart_qiymat` ni ham).

Kodda `×100` yoki `÷100` ko'rsangiz — bu xato, tuzatiladi.

## 6b. Egasi sohani bilmaydi — ekspertizani SIZ berasiz (2026-09-22)

Egasi ochiq aytdi: «men jalyuzi sohasini tushunmayman, ammo shu sohada
ERP yaratyapman. AI ga qil desam kerakli funksiyalarni qo'shmayapti,
yuzaki ishlayapti».

⚠️ «Sizga nima kerak?» deb so'rash ISHLAMAYDI. U biznesni biladi (pul,
mijoz, usta, narx siyosati), mahsulot konfiguratsiyasini esa yo'q:
boshqaruv tomoni, o'rnatish turi, lamel eni, kasseta, val diametri.

**Qanday ishlanadi:** avval sohada nima bo'lishi kerakligini o'zingiz
ro'yxat qiling → loyihada bor-yo'qligini KODDA tekshiring → egasiga
variant va tavsiya bilan ko'rsating. Savol doim aniq raqam bilan:
«0.6 kv.m oyna uchun 8 $ mi yoki 4.80 $ mi».

### Eng katta topilma — nima yetishmayotgani

Tizim **o'lchov** (eni, bo'yi) va **materialni** (mato, karniz)
mukammal modellashtiradi. **TANLOV**ni esa umuman yo'q: zanjir
chapdanmi yoki o'ngdan, shiftga yoki devorga, kasseta bormi. Jalyuzida
yetishmayotgan funksiyalarning deyarli hammasi shu bitta bo'shliqdan
chiqadi — bittalab qo'shish behuda.

To'liq audit: `docs/FUNKSIYA-AUDITI.md`. Qisqasi: `docs/QAMROV.md` §0-.

### Egasining qarorlari — 2026-09-22

| Savol | Qaror |
|---|---|
| Zebrada narxni qaysi mato belgilaydi | **Slotda belgilanadi** — `mahsulot_slot.narx_belgilaydi` (0048) |
| Tanlovlar qanday ishlasin | **Faqat yozilsin va ustaga borsin** — narxga ham, omborga ham tegmaydi |
| Minimal hisob maydoni | **Yo'q** — bosqich narxi o'lchovga ko'paytirilaveradi |
| Mijoz qaysi o'lchamni aytadi | **Tayyor jalyuzi o'lchami** — o'lchov qo'shimchasi kerak emas |
| Usta ishni qanday oladi | **Bot · qog'oz · kompyuter** — tanlov uchalasiga ham chiqsin |

⚠️ Daraja tanlash mantig'i ilgari UCH JOYDA takrorlangan edi (sotuv
ekrani, `narx-tekshir.ts`, bot). 2026-09-22 da `lib/domain/narx-qoidasi.ts`
→ `darajaliSlotniTop()` ga yig'ildi. Yangi joyda takrorlamang.

---

## 6c. Tanlov modeli qurildi — 2026-09-23 (0052)

⚠️ 6b dagi «eng katta topilma» YOPILDI. Tizim endi uch narsani
modellashtira oladi: o'lchov, material va **TANLOV**.

Uch darajali ta'sir, har biri ixtiyoriy:

- faqat nom → yozuv, ustaga boradi
- narx → summaga qo'shiladi
- kod + variant soni → **formulaga tushadi** (`CEIL(ENI / LAMEL_ENI)`)

3-daraja mavjud parametr mexanizmini qayta ishlatadi — yangi formula
tili yozilmadi. Aksessuarni variantga bog'lash ham bor: motorli
tanlansa zanjir qo'shilmaydi.

⚠️ **Yangi jalyuzi xususiyati so'ralsa, avval «tanlov bilan
yechiladimi» deb qarang. «Ikki alohida tur qiling» deb TAKLIF
QILMANG** — CLAUDE.md §14a shuni taqiqlaydi.

Batafsil: `docs/JALYUZI-TURLARI.md` §9a, `docs/QAMROV.md`.

---

## 6d. O'rnatish turi va «hisoblangan input» naqshi — 2026-09-23 (0053·0054)

Zamerchi **oynani** o'lchaydi, tizim **tayyor jalyuzi** o'lchamini
kutadi. Farqni sotuvchi boshida hisoblardi — peredelkaning birinchi
sababi, va u hech qayerda ushlanmasdi (2 sm 0051 chegarasini buzmaydi).

Endi turda **o'rnatish turlari** ro'yxati bor: nom + eniga
qo'shiladigan + bo'yiga qo'shiladigan (manfiy ham bo'ladi) + standart.

⚠️ **`eni_m` / `boyi_m` MA'NOSI O'ZGARMADI** — ular doim tayyor
jalyuzi o'lchami. Narx, formula, kesim, band qilish tegilmadi. Oyna
o'lchami qo'shimcha yozuv.

### «Hisoblangan input» naqshi — egasi ikki marta aytdi

> «usta xohishicha o'zgartiraveradi inputni, agar o'zgartirmasa eski
>  holatida saqlanadi»

Hisoblangan qiymat — **boshlang'ich qiymat, yakuniy emas**:

1. tizim hisoblab katakka **qo'yib beradi** (bo'sh katak emas)
2. katak **tahrirlanadi** (faqat o'qiladigan emas)
3. qo'lda yozilsa **bayroq** qo'yiladi va keyingi hisob uni bosmaydi
   (`olcham_qolda`, `qolda_narx` bilan bir naqsh)

⚠️ Yangi hisoblanadigan qiymat qo'shilsa — darrov shu uch shartni
bajaring, so'ramay. Bayroqsiz qilinsa yozuv YOLG'ON bo'lib qoladi.

Batafsil: `docs/JALYUZI-TURLARI.md` §9b, `docs/QAMROV.md` §6d.

---

## 6e. Darajaga umumiy narx — 2026-09-23 (0055)

Narx `tur × daraja` juftligiga qo'yilardi: to'qqiz tur × uch daraja =
**27 qator**. Tekshirilganda olti materialdan **beshtasi sotilmasdi**.

Endi darajaga **bitta umumiy jadval** qo'yiladi va u hamma turga amal
qiladi; turga alohida qator qo'yilsa u **to'liq almashtiradi**
(qo'shilmaydi). Ekran: `/narx?tur=daraja`.

⚠️ **Tanlash mantig'i BITTA joyda** — `qoidaniTop()`
(`lib/domain/narx-qoidasi.ts`). Ilgari u BESH joyda qo'lda yozilgan
edi va ular bir xil emasdi: sotuv ekrani filialni hisobga olmasdi,
server esa olardi. Yangi tanlov qo'shilsa **faqat shu funksiyaga**
tegiladi.

⚠️ `mahsulot_narx.mahsulot_tur_id IS NULL` endi **ikki ma'noli**:

    hamma_turga = false → «materialni o'zi sotish»
    hamma_turga = true  → «darajaga umumiy narx»

Shu jadval bilan ishlaydigan har qanday so'rovga `hamma_turga` sharti
KERAK — aks holda ikkalasi bir-birini jimgina o'chiradi.

Batafsil: `docs/QAMROV.md` §6e.

---

## 6f. Ikki ko'rinish — kun va tun (2026-09-23)

Egasi: «butun tizimni ikki xil dizaynli qil, tun va kun».
To'liq qaror: **`docs/QARORLAR-KOD.md` P-39**.

**Har rang `app/global.css` da `light-dark(kun, tun)` bo'lib ikki
qiymatli turadi.** Qaysi tomoni olinishini `color-scheme` hal qiladi;
uni `<html data-korinish="kun|tun">` belgilaydi va bu atributni
SERVER cookie dan o'qib qo'yadi (shu sabab sahifa ochilganda oq
chaqnash yo'q).

⚠️ **Ekranlarda `dark:` prefiksi YOZILMAYDI.** 156 ta ekranga
ikkinchi rang qo'shilsa, ranglar yana ekranlarga tarqalib ketardi
(CLAUDE.md §3 — «bir mantiq, bir joyda») va yangi ekranda `dark:`
unutilsa u tunda oq bo'lib qolardi. Shuning uchun bu ish ekranlarning
birortasini ham o'zgartirmadi — faqat `global.css`.

**Yangi ekran yozayotganda:**

| Yozilmaydi | Yoziladi |
|---|---|
| `dark:bg-...` | hech narsa — rang o'zi ikki qiymatli |
| `text-white` to'ldirilgan tugmada | `text-tugma-matn` (kunda oq, tunda qora) |
| `bg-matn/40` parda uchun | `bg-parda` / `bg-parda-och` |
| `bg-white`, `#123456` | `global.css` dagi nom |

Chek va varaqa `color-scheme: light` oladi — tunda ham **oq qog'oz**,
chop etish ham har doim kunduzgi ranglarda.

⚠️ **Ochiq turgan kamchilik:** kunduzgi `matn-kuchsiz` kontrasti
**2.56:1** (me'yor 4.5), 713 joyda ishlatiladi. Tungi ko'rinishda
o'sha rang 4.75. Kunduzgi qiymatga ataylab tegilmadi — u egasi
ko'rib qabul qilgan ko'rinish. Tuzatish alohida ish.

---

## 7. Ochiq savollar — javob kutilmoqda

Usta stavkasi **yopildi** (2026-09-10): uchala usul qurilgan, egasi har
mahsulot turi uchun `/stavka` ekranidan tanlaydi.

⚠️ **Kutilayotgan yagona narsa — 0038 migratsiyasini qo'llash ruxsati.**
Kod `chegara_kv_m` ustunini o'qiydi; migratsiyasiz deploy qilinsa
«Ishni oldim» yiqiladi (CLAUDE.md'dagi 0026 hodisasining aynan o'zi).

2026-09-03 dan javobsiz qolgan savollar (batafsil: `docs/QAMROV.md` §6c):

1. Usta roliga `ish.ol` / `ish.tugat` ruxsati berilsinmi?
2. Muzlagan pul hisobotida ombordagi ostatka qayerda sanalsin?
3. Standart ustama chegarasi 30% to'g'rimi (TZ 7.8)?
4. `exceljs` va `recharts` kutubxonalariga ruxsat (CLAUDE.md §12) —
   hisobot eksporti (11.2) shusiz boshlanmaydi.
5. Stavka faqat so'mda. TZ 10.8 misolida dollar bor — dollarda stavka
   kerakmi?

## 8. GitHub to'sig'i — uzib-ulanib turadi

Egasining tarmog'ida github.com ba'zan DPI/SNI bo'yicha to'siladi: DNS
to'g'ri yechadi, TCP o'tadi, **TLS tushadi**. 2026-09-21 da to'siq
ochilgan edi va push muammosiz o'tdi.

**Qanday ajratiladi:** `curl --max-time 15 https://render.com` ishlasa,
`https://github.com` ishlamasa — internet aybdor emas, GitHub to'silgan.
Push uzilsa kommitlar loqal qoldiriladi; VPN/mobil internetni egasi hal
qiladi, proksi o'zboshimchalik bilan sozlanmaydi.

Bulutdagi sessiyada bu to'siq **yo'q** — u Anthropic tarmog'idan ishlaydi.

## 9. Bulut sessiyasida nima ishlamaydi

- **`.env` yo'q** — u `.gitignore`da (QISM 1 §16), to'g'ri. `DATABASE_URL`
  va boshqalar bulut sessiyasining maxfiy o'zgaruvchilariga qo'lda
  qo'shilishi kerak, aks holda `npm run test:baza` va `db:*` skriptlari
  ishlamaydi.
- **Tarmoq cheklovi** — Render Postgres'ning 5432-porti bulut qumsandig'idan
  ochiq bo'lishi kerak.
- Bularsiz ham `npm test`, `typecheck`, `lint`, `build` **ishlayveradi** —
  ular bazasiz yuradi.
