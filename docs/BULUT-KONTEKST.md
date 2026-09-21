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
