# Hisobotlar (TZ 11) — ish qayerda to'xtadi va qanday davom etadi

Bu **topshiriq varaqasi**: hisobot bo'limini boshlagan sessiya nimani
tugatgani, qanday qarorlar qabul qilingani va ishni tugatish uchun nima
qolgani. Yangi sessiya shu fayldan boshlab davom ettira oladi.

Sana: **2026-09-03** · Kommit: `e15692c` · Tarmoq: `bosqich-0-poydevor`

> ⚠️ Bu davrda repoda **ikkita sessiya paralel** ishlagan. Hisobot domain
> fayllari (`lib/domain/hisobot/`) va `docs/HISOBOTLAR-ISH.md` ikkinchi
> sessiyaning `af419d7` kommitiga qo'shilib ketgan — ular yo'qolmagan,
> shunchaki boshqa nomli kommit ichida turibdi.

---

## 1. Nima ishlaydi

| Qatlam | Holat |
|---|---|
| Domain — davr, bashorat, ABC, ustama, muzlagan pul | ✅ 89 test |
| Baza so'rovlari — ombor hisobotlari | ✅ ishchi bazada yurgizib ko'rilgan |
| Ekran — `/hisobot` va `/hisobot/ombor` | ✅ |
| Ruxsat — TZ 11.10 bo'yicha to'rt kod | ✅ |
| Excel eksporti (11.2) | ❌ umuman yo'q |
| Chartlar | ❌ kutubxona hali tanlanmagan |
| Dashboard (11.3) va sahifa panellari (11.11) | ❌ |

**K-08 kanonik raqami yopildi** — ustama eroziyasi `37.4%`. Shu bilan
CLAUDE.md §6 dagi 11 ta kanonik raqamning hammasi TAYYOR bo'ldi.

Tekshiruv holati: `npm test` — **859 test o'tadi**, `typecheck` va `lint`
toza.

---

## 2. Fayllar xaritasi

```
lib/domain/hisobot/          ← bazaga tegmaydi, sof hisob
  davr.ts                    11.1 — davr filtri va taqqoslash davri
  bashorat.ts                §9 — tezlik → «necha kun qoldi», aylanish
  abc.ts                     11.6.2 — ABC/Pareto (mijoz va ombor uchun bitta)
  ustama-eroziya.ts          11.7.5 — K-08
  muzlagan-pul.ts            11.7.6 — uch bo'lak, qo'sh sanashsiz

app/(panel)/hisobot/
  malumot.ts                 barcha SQL shu yerda
  page.tsx                   hisobotlar ro'yxati, ruxsatga qarab filtrlanadi
  ombor/page.tsx             11.7 ekrani

test/domain/hisobot-*.test.ts        89 test
test/integratsiya/ekran-sorovlari.test.ts   so'rovlar bazada yiqilmasligi (T-01)
lib/ruxsat/kodlar.ts · urug.ts       11.10 ruxsatlari
docs/HISOBOTLAR-ISH.md               120 statistika va chart mosligi
```

**Naqsh:** hisob domainda, SQL `malumot.ts` da, ekran faqat ko'rsatadi.
Formula SQL ga ko'chirilmaydi — aks holda u ikki joyda yashaydi va biri
tuzatilib ikkinchisi qolib ketadi.

---

## 3. Qabul qilingan qarorlar — qaytadan hal qilinmasin

Bular tasodifiy tanlov emas, har birining sababi bor. O'zgartirish kerak
bo'lsa — avval sababini o'qing.

| Qaror | Sabab |
|---|---|
| Davr oralig'i **yarim ochiq**: `>= boshi AND < oxiri` | «23:59:59 gacha» deb yozilsa 23:59:59.4 dagi yozuv tushib qoladi va kun yig'indisi kassa bilan to'g'ri kelmaydi |
| Oldingi oy **kalendar** bo'yicha, 30 kun bo'yicha emas | 31 kunlik iyul 30 kunlik iyun bilan solishtirilsa «tushum 3% kamaydi» degan soxta natija chiqadi |
| Hafta **dushanbadan** | `getDay()` yakshanbani 0 deydi; to'g'ridan-to'g'ri ishlatilsa dushanbadagi sotuv «o'tgan hafta» ga tushadi |
| Tezlik nol bo'lsa bashorat **`null`**, «tugamaydi» emas | Harakat yo'qligi ko'pincha teskarisini bildiradi: material o'lik yotibdi (11.7.6) |
| «Necha kun qoldi» **pastga** yaxlitlanadi | Yuqoriga yaxlitlansa xavf kam ko'rinadi va material kutilmaganda tugaydi |
| ABC da chegarani kesib o'tgan element **yuqori toifada** qoladi | Aks holda 79.8% dagi mijoz A ga, undan kattaroq keyingisi C ga tushib qolardi |
| ABC da manfiy tushum **bazaga kirmaydi**, oxirida C bo'lib turadi | Qaytarishdan keyin manfiy chiqqan mijoz foizlarni 100 dan oshirib yuborardi |
| Muzlagan pulda ostatka **uchinchi qatordan ayiriladi** | Ostatka materialning qoldig'i ichida ham turadi — 12.1 dagi «bir xil pul ikki marta» xatosi |
| Ostatkalardan faqat **`BOSH`** olinadi | `BAND` ostatka pozitsiyaga biriktirilgan, tez orada ishlatiladi — u o'lik pul emas |
| Tannarx — omborda turgan bo'laklarning **o'rtacha og'irlangani** | Oxirgi kirim narxi olinsa aralash partiyada noto'g'ri chiqadi |
| Sarfga `KOCHIRISH_CHIQDI` va `INVENTARIZATSIYA` **kirmaydi** | Mol boshqa filialga ketdi yoki sanash farqi — sarflanmadi |
| Dollarli narxda kurs yo'q bo'lsa qator **«hisoblanmadi»** | Jimgina dollarni so'm deb qabul qilish narxni ming barobar kamaytiradi |
| `hisobot.ombor.kor` sotuvchiga **berilmaydi** | 11.10: «tannarx, foyda va ish haqi yo'q», ombor hisobotida tannarx bor |
| Menyudagi `/hisobot` bandi `kod: null` | Menyu bandi bitta kod bilan cheklanadi, 11.10 esa bo'limga qarab huquq beradi. Sahifaning o'zi filtrlaydi, har hisobot serverda o'z kodini talab qiladi |

---

## 4. Egasidan javob kutilmoqda — ikkita savol

Ikkalasi ham **biznes** savoli, texnik emas. Javobsiz ham tizim ishlaydi,
lekin javob kelsa raqam aniqroq bo'ladi.

**1. Muzlab qolgan pulda ostatka qayerda sanalsin?**
Hozir: ostatka alohida qatorda, «6 oy qimirlamagan» dan ayirilgan — jami
summa to'g'ri chiqadi. Muqobil: qoldiq to'liq ko'rsatilsin, lekin unda jami
summa berilmasligi kerak.

**2. Standart ustama chegarasi 30% to'g'rimi?**
TZ 5.4 da raqam yozilmagan, 11.7.5 jadvalidagi misolda 30% turibdi — shu
olindi. Materialning o'z chegarasi bo'lsa u ustun.

---

## 5. Nima qolgan — tartib bilan

Tartib tasodifiy emas: har qadam oldingisining mexanizmini qayta ishlatadi.

### 5.1. Yaqin qadamlar (ombor bo'limini yopish)

- [ ] **11.7.1 — qoldiq material kesimida.** Hozir faqat jami summa bor.
      Mavjud `filialQoldigi` (`app/(panel)/ombor/malumot.ts`) ga tannarx
      qiymati ustuni qo'shilsa yetadi.
- [ ] **11.7.2 — material harakati** (kirim/sarf/chiqindi/brak, davr bo'yicha).
      `ombor_harakat` dan `turi` kesimida, `davr` filtri bilan.
- [ ] **11.7.3 — kam qolgan va tugagan.** `kamQoldiqmi` domainda bor
      (`lib/domain/birlik-tanlovi.ts`), hisobot ko'rinishi yo'q.
- [ ] **11.7.4 — chiqindi va brak**, material va sabab kesimida.
- [ ] **11.7.7 — ostatka turgan holda rulon ochilgan holatlar.** Eng
      qiyini: kesim paytida mos ostatka bor-yo'qligini qaytadan hisoblash
      kerak. `lib/domain/kesish.ts` dagi tanlov mantig'i qayta ishlatiladi.

### 5.2. Keyingi bo'limlar

- [ ] **11.5 — sotuv hisobotlari** (dinamika, mahsulot turi bo'yicha foyda,
      sotuvchi, chegirma, qaytarish, sotuvchi erkinliklari)
- [ ] **11.6 — mijozlar** (baza + ABC). ABC mexanizmi **tayyor**, faqat
      so'rov va ekran kerak
- [ ] **11.4 — moliya** (foyda-zarar, kassa oqimi, debitorlik, kreditorlik,
      kurs farqi). Kassa bilan qisman kesishadi — `docs/HISOBOTLAR-ISH.md`
      §10 da bu ochiq band bo'lib turibdi
- [ ] **11.8 — ishlab chiqarish** (usta unumdorligi, brak, kechikish, navbat)
- [ ] **11.9 — narx dinamikasi**

### 5.3. Umumiy mexanizmlar (bir marta yoziladi, hamma joyda ishlatiladi)

- [ ] **11.2 — Excel eksporti, ikki varaq.** Har hisobotda kerak. Kutubxona
      tanlanmagan — **ruxsat so'ralsin** (stek o'zgarishi).
- [ ] **Chartlar.** `docs/HISOBOTLAR-ISH.md` da har hisobot uchun chart turi
      belgilangan. Kerak bo'ladigan turlar: bar, stacked bar, line, donut,
      Pareto, scatter, gauge, heatmap, waterfall, radar. Kutubxona
      tanlanmagan — **ruxsat so'ralsin**.
- [ ] **11.3 — dashboard**, uch qator.
- [ ] **11.11 — har modul sahifasining tepasidagi panel.** Tuzilma hamma
      joyda bir xil: holat · davr · diqqat.
- [ ] **20.13 — ko'p filial kesimi** barcha hisobotlarga.

---

## 6. Cheklovlar — nimani qilib bo'lmadi

| Nima | Sabab | Oqibati |
|---|---|---|
| Baza testlarini yurgizish | Bu mashinada Docker ham, `TEST_DATABASE_URL` ham yo'q | `npm run test:baza` yurgizilmagan. So'rovlar ishchi bazada **faqat o'qish** rejimida qo'lda yurgizib ko'rilgan |
| Ekranni brauzerda ochib ko'rish | Interfeys testi yo'q (`jsdom` o'rnatilmagan — QAMROV §5) | Jadval va tugmalar ko'z bilan tekshirilmagan |
| Excel va chart | Kutubxona tanlanmagan, ruxsat kerak | 11.2 hali yo'q |

> ⚠️ **Ishchi bazada o'qish** — bu bir martalik tekshiruv edi va u bitta
> haqiqiy xatoni ushladi: `mijoz.nom` degan ustun yo'q, `ism` ekan. Bunday
> xatoni `tsc` ham, mantiq testlari ham ko'rmaydi. Endi bu so'rovlar
> `ekran-sorovlari.test.ts` da (T-01) va loqal baza bo'lganda avtomatik
> tekshiriladi.

---

## 7. Yangi sessiya qanday davom ettiradi

1. `docs/HISOBOTLAR-ISH.md` — qaysi statistika qaysi bo'limga tegishli va
   qanday chart kerakligi shu yerda.
2. `docs/QAMROV.md` §6 — hisobotlar jadvali: nima ✅, nima ❌.
3. Yangi hisobot yozishda naqsh:
   `lib/domain/hisobot/` ga sof funksiya + test → `malumot.ts` ga SQL →
   `ekran-sorovlari.test.ts` ga so'rov chaqiruvi → ekran.
4. Ruxsat kodi 11.10 ga qarab tanlanadi. Tannarx yoki foyda ko'rinsa —
   sotuvchiga berilmaydi.
5. Ish tugagach `docs/QAMROV.md` §6 yangilanadi (CLAUDE.md §13).
