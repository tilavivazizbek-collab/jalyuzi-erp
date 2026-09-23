# FUNKSIYA AUDITI — narx bog'liqligi va yetishmayotgan funksiyalar

Sana: **2026-09-22**

Holat: **A va B auditi tugadi · 1 va 4-qadam BAJARILDI**

- 1-qadam: narx zanjiridagi 1 va 2-xato yopildi (migratsiya **0048**)
- 4-qadam: pozitsiya yorlig'i, izohi va qatorni nusxalash (migratsiya **0049**)
- 6-qadam: narx xaritasi — tur × daraja, bo'sh kataklar ko'rinadi
- 7-qadam: tahrirlashda narx serverda tekshiriladi + `qolda_narx` ko'rinadigan bo'ldi
- Material sahifasi: sotuv narxi olib tashlandi, artikul qo'shildi (**0050**),
  ro'yxatga qidiruv · filtr · qoldiq · daraja (egasi qarori 2026-09-22)

Qolgani egasining javobini kutadi (7-bo'limga qarang).

Egasining topshirig'i: «kerakli funksiyalarning ko'pi yo'q, borlari ham
sinovdan o'tmagan — soha mutaxassisi sifatida nima kerakligini top».

---

## 0. Qanday tekshirildi

Har bir ✅ / ⚠️ / ❌ **kodni ochib** qo'yildi. Taxmin yo'q, har qatorda dalil bor.
Egasining bazasiga tegilmadi (§15) — shuning uchun bu hujjat «bazada qanday
ma'lumot bor» degan savolga javob bermaydi, faqat «tizim nimani ko'tara
oladi» degan savolga javob beradi.

O'qilgan fayllar: `buyurtma/yangi/{forma,malumot,amal,qoshimcha}`,
`narx/{forma,malumot,page}`, `mahsulot/forma`, `daraja/`,
`lib/domain/{narx-qoidasi,pozitsiya-narxi,sarf-turi,narx-kalkulyatori}`,
`lib/amal/{narx-tekshir,katalog}`, `lib/db/schema/{narx,spravochnik,buyurtma}`,
`docs/{QAMROV,JALYUZI-TURLARI}`.

---

## 1. A-BOSQICH — narx qanday topiladi

```
  mahsulot turi (Zebra)
      ↓  katalog.ts:471 — turning slotlari
  slot (Mato 1, Mato 2 …)
      ↓  katalog.ts:492 — slotning almashtirish guruhidagi materiallar
  sotuvchi tanlagan material
      ↓  material.narx_guruh_id  =  MATO DARAJASI
  daraja  ←──────── ⚠️ ZAIF BO'G'IN, 2-xatoga qara
      ↓  katalog.ts:384 — tur + daraja + filial bo'yicha qoidalar
  mahsulot_narx  (tur × daraja × mijoz turi × filial)
      ↓  forma.tsx:548-554 — mijoz turiga mos qoida, bo'lmasa umumiysi
  qoida + hisoblash usuli (MAYDON / ENI / BO'YI / DONA / MIQDOR)
      ↓  narx-qoidasi.ts:68 — o'lchov chiqariladi (kv.m yoki metr)
  bosqich  (dan … gacha)
      ↓  narx-qoidasi.ts:129 — mos bosqich tanlanadi
  bir birlik narxi × o'lchov × soni
      ↓  pozitsiya-narxi.ts:188 — qo'shimchalar, xizmat haqi, chegirma
  POZITSIYA SUMMASI
      ↓  narx-tekshir.ts — SERVER hammasini QAYTA hisoblaydi
  bazaga yoziladi (narx_snapshot + qolda_narx belgisi)
```

**Zanjirning mustahkam joyi:** server narxni qayta hisoblaydi va farq bo'lsa
`qolda_narx` belgisini qo'yadi. Ya'ni brauzerda ochiq turgan eski sahifa
jimgina eski narx yozib keta olmaydi. Bu to'g'ri qilingan.

**Zanjirning uziladigan joyi:** «daraja» bo'g'ini. Quyida.

---

## 2. A-BOSQICH — topilgan xatolar

| № | Nima noto'g'ri | Dalil | Og'irligi |
|---|---|---|---|
| 1 | **Daraja tanlash mantig'i UCH JOYDA yozilgan.** Sotuv ekrani, server tekshiruvi va bot — uchalasida bir xil qoida alohida takrorlangan. Biri o'zgarsa mijoz ko'rgan narx, bazaga tushgan narx va botdagi narx uch xil bo'ladi | `buyurtma/yangi/forma.tsx:532-536`, `lib/amal/narx-tekshir.ts:135-148`, `bot/buyurtma-oqimi.ts:203-216` | **JIDDIY** — «bir mantiq, bir joyda» buzilgan · ✅ **TUZATILDI 2026-09-22** |
| 2 | **Ikki matoli turda narx SLOT TARTIBIGA bog'liq.** Zebrada ikkita mato sloti bor; qoida «birinchi KV_M sloti» deydi. Slot tartibi o'zgarsa yoki ikkinchi matoga boshqa daraja qo'yilsa — narx sababsiz o'zgaradi. `mahsulot_slot` da «narxni shu slot belgilaydi» degan ustun YO'Q | `forma.tsx:532`, `narx-tekshir.ts:143`, `schema/spravochnik.ts:342` | **JIDDIY** · ✅ **TUZATILDI 2026-09-22** (0048) |
| 3 | **Filial narxi tanlanishi tasodifga tayanadi.** SQL `ORDER BY (filial_id IS NULL)` qiladi, ekran esa oddiy `.find()` — to'g'ri qator «birinchi kelgani» uchun tanlanadi. Hozir ishlaydi, lekin so'rov tartibi o'zgarsa jimgina buziladi | `katalog.ts:387`, `forma.tsx:549`, `qoshimcha.tsx:166` | **MO'RT** — hozircha xato emas |
| 4 | **O'lcham chegarasi umuman yo'q.** Yagona tekshiruv — eni va bo'yi noldan katta bo'lsin. 5 metrlik rulon ham qabul qilinadi | `forma.tsx:380` | **PUL TESHIGI** · ✅ **TUZATILDI 2026-09-22** (0051) |
| 5 | ~~Minimal hisob maydoni yo'q~~ | — | **EGASI RAD ETDI 2026-09-22**: bosqich narxi o'lchovga ko'paytirilaveradi. Kichik oynada zarar sezilsa qaytariladi |
| 6 | **Buyurtmani TAHRIRLASHDA narx serverda qayta tekshirilmaydi.** Yangi buyurtmada yopilgan teshik tahrirlash yo'lida umuman chaqirilmasdi | `lib/amal/buyurtma-tahrir.ts` | **JIDDIY** · ✅ **TUZATILDI 2026-09-22** |
| 7 | **`qolda_narx` belgisi hech qayerda ko'rinmasdi** — bazaga yozilardi, lekin uni ko'radigan ekran yo'q edi | `app/(panel)/buyurtma/[id]/page.tsx` | **JIDDIY** · ✅ **TUZATILDI 2026-09-22** |

⚠️ 1, 2 va 3-xato bir sababdan: **mahsulot turida «narxni nima belgilaydi»
degan aniq ko'rsatkich yo'q**, shuning uchun kod har joyda o'zicha taxmin qiladi.

---

## 3. ILDIZ SABAB — nega funksiyalar «yuzaki» chiqadi

Tizim ikki narsani modellashtira oladi:

| Model | Misol | Holat |
|---|---|---|
| **O'lchov** — son | eni, bo'yi, soni | ✅ mukammal |
| **Material** — ombordan yeyiladigan narsa | mato, karniz, kronshteyn | ✅ mukammal |
| **TANLOV** — na pul, na material, lekin mahsulotni belgilaydi | zanjir chapdanmi yoki o'ngdan · shiftga yoki devorga · kasseta bormi · lamel 89 yoki 127 mm | ✅ **QURILDI 2026-09-23** (0052) |

Jalyuzida yetishmayotgan funksiyalarning **deyarli hammasi** shu bitta
bo'shliqdan chiqadi. Shuning uchun ularni bittalab qo'shib bo'lmaydi: har
safar «yana bitta katak» qo'shiladi, u esa ishlab chiqarishga, chekka va
botga yetib bormaydi.

Eng yaqin mavjud mexanizm — `mahsulot_parametr`, lekin u ikki sababdan yaramaydi:

- **faqat RAQAM qabul qiladi** (`standart_qiymat: numeric`) — «chap/o'ng» yozib
  bo'lmaydi (`schema/spravochnik.ts:395`);
- **admin ekranidan olib tashlangan** — yangi parametr yaratib bo'lmaydi
  (`mahsulot/forma.tsx:201-207`), garchi sotuv ekrani uni hali ham ko'rsatadi
  (`forma.tsx:1075`). Ya'ni yarim uzilgan mexanizm.

Tanlov yozib qo'yilsa ham, uni **ustaga yetkazadigan joy yo'q**:
`buyurtma_pozitsiya` da na izoh, na yorliq ustuni bor
(`schema/buyurtma.ts:147-250`), ishlab chiqarish varaqasi esa umuman mavjud
emas (`app/(panel)/buyurtma/[id]/` — faqat chek va kvitansiya).

---

## 4. B.1 — MAHSULOT TURI KIRITISH ekrani

Hozir bor: rasm · nomi · xizmat haqi · tartib · saytda/botda ko'rinadi ·
slotlar (guruh yoki material, sarf turi, koeffitsient, kesish yo'nalishi,
qat'iy kesim eni) · aksessuarlar · formula kalkulyatori.

| Nima | Element | Nega kerak (sohada) | Hozir | Tavsiyam |
|---|---|---|---|---|
| Tanlov ro'yxatlari | «Tanlovlar» bo'limi: nom + variantlar, har variantga narx va formula soni | Boshqaruv tomoni, o'rnatish turi, lamel eni, kasseta — jalyuzining yarmi shu | ✅ **2026-09-23** | Bajarildi (0052) |
| Narxni belgilovchi slot | slot qatorida belgi | Zebrada ikki mato — qaysi biri narxni belgilashi hozir tasodif | ✅ **2026-09-22** | Bajarildi (0048) |
| Eng kichik / eng katta eni va bo'yi | 4 ta raqam katagi | Mexanizm chegarasi: 3 m dan keng rulonda val egiladi. Sotuvchi bilmasdan sotadi, usta qila olmaydi | ❌ | **KERAK** |
| ~~Minimal hisob maydoni~~ | — | Egasi 2026-09-22 da rad etdi: narx bosqichga ko'paytirilaveradi | — | Yopildi |
| ~~O'lchov qo'shimchasi~~ | — | Egasi 2026-09-22: mijoz TAYYOR JALYUZI o'lchamini aytadi, qo'shimcha kerak emas | — | Yopildi |
| Usta uchun standart eslatma | matn katagi | «Lamelni pastdan 2 sm qoldiring» — har buyurtmada qaytarilmaydi | ❌ | Foydali |
| Turdan nusxa olish | tugma | «Zebra» dan «Zebra premium» — slot va formulalarni qayta yozish xato manbai | ❌ | Foydali |
| Formulani sinash | kalkulyator | Bor (`mahsulot/kalkulyator.tsx`) | ✅ | — |

## 5. B.2 — TUR VA NARX BELGILASH ekrani

Bu ekran eng yaxshi holatda. Bor: tur × daraja × mijoz turi × filial ·
hisoblash usuli (maydon/eni/bo'yi/dona/miqdor) · bosqichlar · valyuta ·
qo'shimchalar (material va formula bilan) · tekshirish kalkulyatori ·
bo'shliq va chegarada narx tushishi ogohi.

| Nima | Element | Nega kerak | Hozir | Tavsiyam |
|---|---|---|---|---|
| Matritsa ko'rinishi | tur × daraja jadvali, bo'sh katak qizil | Hozir narx qo'yilmagani faqat SOTUV paytida bilinadi — mijoz oldida. Jadvalda ko'rinsa oldindan to'ldiriladi | ❌ | **KERAK** |
| ~~Minimal summa yoki maydon~~ | — | Egasi 2026-09-22 da rad etdi | — | Yopildi |
| Narxni nusxalash | «Rulon narxini Zebraga ko'chirish, +20%» | Har tur × har daraja × har bosqich qo'lda kiritiladi — bir joyda albatta adashiladi | ❌ | Foydali |
| Amal qilish sanasi | «1-oktyabrdan» | Narx oshirishni oldindan kiritish. Eski buyurtmalar snapshot bilan himoyalangan, bu faqat rejalashtirish uchun | ❌ | Keyinroq |
| Yaxlitlash qoidasi | dropdown: 100 / 1000 so'mgacha | 8 $ × 12 800 = 102 400 — chekda g'alati raqam | ❌ | Keyinroq |
| Narx qo'yilmagan tur sotilmaydi, sabab aytiladi | — | Bor | ✅ | — |
| Mijoz turiga / filialga narx | — | Bor | ✅ | — |

## 6. B.3 — SOTUV (yangi buyurtma) ekrani

Bor: tur (rasm bilan) · eni/bo'yi/soni · matolar (qoldiq ko'rinadi) ·
aksessuarlar · qo'shimchalar · narxni qo'lda o'zgartirish (iz qoladi) ·
savat · mijoz (modal bilan qo'shish) · ishlab chiqaruvchi filial ·
tayyorlik sanasi · kelishilgan summa · oldindan to'lov va kassa ·
material yetishmasligi ogohi · narx serverda qayta tekshiriladi.

| Nima | Element | Nega kerak | Hozir | Tavsiyam |
|---|---|---|---|---|
| Pozitsiya yorlig'i | matn katagi: «Zal — katta oyna» | 6 oynali buyurtmada usta va montajchi qaysi biri qayerga ketishini bilmaydi. Hozir faqat «1-qator» | ❌ | **KERAK** |
| Qator izohi | matn katagi | «Zanjir o'ngdan», «mijoz o'zi oladi» — buni yozadigan joy BUTUN TIZIMDA yo'q | ❌ | **KERAK** |
| Tanlovlar | 4-bo'limda yaratilganlari shu yerda dropdown bo'lib chiqadi | — | ❌ | **KERAK** |
| O'lchovni kim oldi | dropdown: mijoz aytdi / bizning o'lchovchi (kim) | Sohadagi 1-raqamli janjal: o'lcham noto'g'ri chiqsa kim to'laydi? Yozilmasa — doim korxona to'laydi | ❌ | **KERAK** |
| ~~O'lcham turi~~ | — | Egasi 2026-09-22: doim tayyor jalyuzi o'lchami. Tanlov kerak emas | — | Yopildi |
| O'lcham chegarasi tekshiruvi | qizil ogohlantirish | 4-bo'limdagi chegaralar ishlashi uchun | ❌ | **KERAK** |
| Qatorni nusxalash | tugma «Nusxa» | 5 ta bir xil oyna hozir 5 marta qo'lda kiritiladi | ❌ | **KERAK** (arzon, foydasi katta) |
| Ishlab chiqarish varaqasi | chop etish tugmasi | Ustaga o'lcham va tanlovlar qog'ozda ketadi. Hozir varaqaning O'ZI yo'q | ❌ | **KERAK** |
| Eskiz / rasm biriktirish | fayl yuklash | Notekis oyna, arka, trapetsiya — so'z bilan tushuntirib bo'lmaydi | ❌ | Foydali |
| O'rnatish: kerakmi · manzil · sana · usta | bo'lim | Hozir o'rnatish faqat pulli «qo'shimcha» — manzil va sana yoziladigan joy yo'q | ❌ | Foydali |
| Yetkazib berish | bo'lim | Xuddi shunday | ❌ | Foydali |
| Shoshilinch buyurtma | belgi + ustama % | Sohada odatiy daromad manbai | ❌ | Keyinroq |
| Kafolat muddati | chekda | Nizoni kamaytiradi | ❌ | Keyinroq |

---

## 7. EGASINING QARORLARI — 2026-09-22

| № | Savol | Qaror |
|---|---|---|
| 1 | Zebrada narxni qaysi mato belgilaydi? | **«Men slotda belgilayman»** → `mahsulot_slot.narx_belgilaydi` (0048). Bajarildi |
| 2 | Tanlovlar (zanjir tomoni, kasseta…) qanday ishlasin? | **Faqat yozilsin va ustaga borsin.** Narxga ham, omborga ham tegmaydi |
| 3 | Minimal hisob maydoni bormi? | **Yo'q.** «0.5 dan 1 gacha 8 $» degani 1 kv.m narxi; 0.6 kv.m uchun 4.80 $. Bosqich o'lchovga ko'paytirilaveradi |
| 4 | Mijoz qaysi o'lchamni aytadi? | **Tayyor jalyuzi o'lchami.** O'lchov qo'shimchasi va «o'lcham turi» tanlovi KERAK EMAS |
| 5 | Usta ishni qanday oladi? | **Uch yo'l bilan**: Telegram botdan · qog'ozga chop etib · kompyuterdan o'zi ko'radi |

⚠️ 5-qarorning oqibati: tanlovlar **uch joyga** chiqishi shart — bot, chop
etiladigan varaqa va buyurtma kartochkasi. Bittasi unutilsa usta eski
usulda ishlaydi va tanlov behuda yozilgan bo'ladi (CLAUDE.md §13).

⚠️ 3-qaror bo'yicha eslatma: kichik oynada (0.2–0.3 kv.m) summa mato va
usta haqini qoplamasligi mumkin. Egasi buni bilib turib tanladi. Zarar
sezilsa — «eng kam summa» maydonini qo'shish bir soatlik ish.

### Hali javob kutilayotgani

**SAVOL A. O'lcham chegaralari.** Har tur uchun eng katta eni va bo'yi
qancha? (Rulon odatda 3 m, zebra 2.8 m, vertikal karniz 4 m gacha —
lekin bu SIZNING mexanizmingizga bog'liq, ustangiz aniq biladi.)
Bilmasangiz bo'sh qoldiriladi va tekshiruv ishlamaydi.

**SAVOL B. Tanlovlar ro'yxati.** Qaysi turga qanday tanlov kerak?
Masalan: Rulon → boshqaruv tomoni (chap/o'ng), o'rnatish (devor/shift/rom),
kasseta (bor/yo'q). Bittasini to'liq yozib bersangiz, qolganini shu
namunada tuzaman.

---

## 8. TAVSIYA QILINGAN TARTIB

| № | Ish | Holat |
|---|---|---|
| 1 | Daraja mantig'ini bitta joyga yig'ish + slotda «narxni belgilaydi» belgisi | ✅ **BAJARILDI 2026-09-22** (0048) |
| 2 | O'lcham chegarasi (min/maks eni-bo'yi) | ✅ **BAJARILDI 2026-09-22** (0051) — raqamlar egasidan kutiladi |
| 3 | **Tanlovlar** — tur → tanlov → sotuvda dropdown → bot, varaqa, kartochka | SAVOL B javobini kutadi |
| 4 | Pozitsiya yorlig'i + qator izohi + qatorni nusxalash | ✅ **BAJARILDI 2026-09-22** (0049) |
| 5 | Ishlab chiqarish varaqasi (chop etish) | 3 va 4 dan keyin |
| 6 | Narx matritsasi ko'rinishi (bo'sh kataklar qizil) | ✅ **BAJARILDI 2026-09-22** |
| 7 | Tahrirlashda narx serverda tekshirilishi (6-xato) | ✅ **BAJARILDI 2026-09-22** |

⚠️ Qolgan ikkala ish (2 va 3-qadam) egasining javobini kutadi:
o'lcham chegaralari (SAVOL A) va tanlovlar ro'yxati (SAVOL B).
