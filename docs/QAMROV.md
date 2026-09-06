# QAMROV — nima bor, nima yo'q

**Bu hujjat emas, ASBOB.** Har ish oxirida yangilanadi. Jadvalda ❌
qolgan bo'lsa — o'sha bo'lim **tayyor emas**.

Nega kerak: 2026-08-28 da egasi bir narsani **uch marta** aytishga
majbur bo'ldi («dropdownlarda qo'shish bo'lsin»). Har safar bitta
joy tuzatilib «bo'ldi» deyilardi. Teshik ko'rinmagani uchun shunday
bo'ldi. Endi ko'rinadi.

Oxirgi yangilanish: **2026-09-03** — kvitansiya, hisob-kitob va kunlik
yopish varaqalari (TZ 8.9 · 15.4); sotuv cheki (TZ 8.9) va korxona
sozlamalari (TZ 14.3); **modullararo audit — 14 ta tuzatish** (§7);
yetkazib beruvchi kartochkasi (9.7–9.8), kurs farqi (9.5–9.6),
buyurtmani tahrirlash (8.7), material statistikasi (7.11)

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

⚠️ **2026-09-03 — ikkita to'siq OLIB TASHLANDI** (egasining
talabi bo'yicha, va u haq edi):

| Nima | Ilgari | Endi |
|---|---|---|
| Material mahsulot turida ishlatilsa | o'chirilmasdi | o'chiriladi, tur ham shu aksessuardan xalos bo'ladi |
| Mahsulot turi ochiq buyurtmada bo'lsa | o'chirilmasdi | o'chiriladi, buyurtma ishlashda davom etadi |

Sabab: pozitsiyada `formula_snapshot` turadi (4.10), ishlab
chiqarish o'shandan o'qiydi — tur nofaol bo'lgani ish oqimini
buzmaydi. O'chirilganda yon ta'sir EKRANDA aytiladi.

⚠️ Omborda QOLDIQ bo'lsa material baribir o'chirilmaydi: bu pul,
uni ko'rinmas qilib qo'yib bo'lmaydi. Avval hisobdan chiqariladi.

**Buyurtmani o'chirish (8.8 · 8.15)** — kartochkaning pastida.
Hamma pozitsiya `BEKOR` bo'ladi, band bo'shaydi, buyurtma
ro'yxatdan yo'qolib «Bekor qilingan» filtriga o'tadi. Uchta
to'siq: to'lov qilingan · topshirilgan · ishlab chiqarishga
kirgan. 8 test (EC-BOCH-01..08).

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
| Yetkazuvchi kartochkasi (9.7) | ✅ | **Ikki blokli sarlavha + olti tab**: qarz harakati (oldingi/keyingi balans), kirimlar, to'lovlar, materiallar, brak va da'volar, izohlar. Tab manzilda (`?tab=`) |
| Narx tarixi (9.8) | ✅ | Materiallar tabida: oxirgi 3 kirim narxi va `N oyda +12.2%` |
| Dollar qarzini so'mda to'lash (9.5) | ✅ | «Qaysi qarz» va «nima bilan to'lanadi» alohida tanlanadi |
| Kurs farqi (9.6) | ✅ | To'lov FIFO taqsimlanadi, farq `KURS_FARQI` xarajatiga tushadi |
| Material kartochkasi statistikasi (7.11) | ✅ | Jami kirim · sarflangan (qayerga ketgani %) · chiqindi va brak · qoldiq qiymati |
| Mavjud buyurtmaga pozitsiya qo'shish (8.7) | ✅ | Kartochkadagi «+ Pozitsiya qo'shish» → sotuv ekrani «qo'shish» rejimida. Yangi buyurtma OCHILMAYDI — bitta chek qoladi |
| Da'voni hal qilish (9.9) | ✅ | «Qabul qildi» → qarz kamayadi · «O'zimizga» → xarajat. Ikkalasi ham kassaga tegmaydi |
| Yetkazuvchi izohlari (9.7) | ✅ | Har izoh kim va qachon yozgani bilan · 0033-migratsiya |
| Buyurtma pozitsiyasini tahrirlash (8.7) | ✅ | Ish boshlangunga qadar. Band qayta hisoblanadi, qarz tuzatiladi, audit eski/yangi qiymat bilan |
| Chiqim | ✅ | |
| Ko'chirish | ✅ | |
| Inventarizatsiya | ✅ | |
| Qayta kesish | ✅ | |
| Kassa | ⚠️ | Kassa endi ochiladi, lekin bazada hali 0 ta |
| Filiallararo hisob | ✅ | |
| Boshqaruv | ✅ | |
| Korxona ma'lumotlari | ✅ | `/sozlama` — chekdagi rekvizit, filial kodi, bot nomi |
| Sotuv cheki (80 mm) | ⚠️ | Buyurtma yopilganda `/buyurtma/[id]/chek`. Brauzer chop etish oynasi orqali ishlaydi; **USB termoprinterga to'g'ridan-to'g'ri chiqarish yo'q** |
| Kvitansiya (qisman topshirish) | ✅ | `/buyurtma/[id]/kvitansiya` — 80 mm, QRsiz. Topshirilgan va kutilayotgan pozitsiyalar alohida, pul hisobi butun buyurtma bo'yicha |
| Hisob-kitob varaqasi | ✅ | `/mijoz/[id]/hisob-kitob` — A4, butun tarix va o'suvchi qoldiq (valyuta bo'yicha alohida) |
| Kunlik yopish varaqasi | ✅ | `/kassa/kun/varaqa` — A4. «Haqiqiy summa» va «Farq» qo'lda to'ldiriladi (12.17) |

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
| Baza deyarli bo'sh | Ekranlar haqiqiy ma'lumot bilan sinalmagan |
| Bot serverga chiqarilmagan | Render to'lov ma'lumoti kerak |
| Interfeys testi yo'q | Brauzer muhiti (`jsdom`) o'rnatilmagan — modal, forma xatti-harakati qo'lda sinaladi |
| Chek 80 mm da faqat ekranda sinalgan | Haqiqiy termoprinterda bosib ko'rilmagan — qog'oz kengligi va shrift o'lchami tekshirilishi kerak |
| Dasturchi mashinasida baza yo'q | Docker ham, Postgres ham o'rnatilmagan. Sinov bazasi SERVERDA turibdi — test ketganda ishlaydigan serverga yuk tushadi |

✅ **2026-09-05 da yopilgan — TZ ning oxirgi ikki ochiq bandi:**

| Nima edi | Nima qilindi |
|---|---|
| **Storno yo'q edi** (8.8): sotuvchining xato yozuvi bilan mijozning haqiqiy voz kechishi bir xil ko'rinardi | `buyurtmaniStorno` + `buyurtma.storno` ruxsati (faqat admin) + kartochkadagi tugma va banner. Migratsiya **0034** |
| **Kirim narxining ASOSI saqlanmasdi** — narx bir rulonga, bir metrga yoki bir kv.m ga kiritilishi mumkin, sotuvchi tanlaydi, lekin tanlov unutilardi | Endi qatorda qotadi (**0036**). Bunisiz qayta hisoblash tannarxni **sakkiz baravar** oshirardi — sinov 120 000 o'rniga 1 020 000 chiqardi |
| **Kirim hujjatini tahrirlab bo'lmasdi** (9.11): transport hisobi keyin kelsa tannarx eskiligicha qolardi | `kirimniTahrirla` — tannarx faqat **omborda qolgan** bo'laklarga qayta qo'llanadi, sotilganlari o'z snapshotida qoladi (2.3) |

✅ **2026-09-05 da yopilgan — ombor bo'lak modeli:**

| Nima edi | Nima qilindi |
|---|---|
| Rulon bir marta kesilsa **butunlay** «qoldiq kesma»ga aylanardi. Omborda nechta BUTUN rulon borligi ko'rinmasdi | Kesimdan **ikki** bo'lak tug'iladi: rulonning davomi (RULON, `ochilgan`) va yon kesma (OSTATKA) — TZ 7.4. Migratsiya 0035 |
| Butun rulon mahsulot tannarxiga yozilar, ortgan mato **hisobdan yo'qolardi**. 3 × 35 dan 1.5 × 5 kesilsa mahsulotga 7.5 o'rniga 15 kv.m yozilardi | `kesimRejasi()` geometriyani hisoblaydi, yig'indi manba maydoniga teng |
| TZ 7.6 ning «qisman ochilgan rulon» bosqichi **o'lik** edi: bunday yozuv hech qachon yaratilmasdi | `ochilgan` ustuni + tanlov navbati: aniq mos kesma → ochiq rulon → boshqa kesma → yangi rulon (egasining qarori) |
| Boshlang'ich zahirada **hamma narsa butun rulon** bo'lib tushardi — kesmani ham, ochiq rulonni ham kiritib bo'lmasdi | Formada tur tanlanadi: butun rulon · ochilgan rulon · qoldiq kesma |
| Ombor kartochkasi materialning **o'z chegarasini o'qimasdi** — doim 0.5 / 1.0 ishlatardi | Chegara materialdan keladi (7.5) |
| Ombor ro'yxati faqat kv.m ko'rsatardi | Har material ostida tarkib: nechta butun rulon, ochilgani, kesmalari — o'lchami bilan |
| «Ostatka bor turib rulon tanlandi» ogohlantirishi **ochiq rulonda ham** chiqardi | Faqat YANGI rulon ochilganda chiqadi |

✅ **2026-09-03 da yopilgan:**

| Nima edi | Nima qilindi |
|---|---|
| Test bazasi ajratilmagan | Alohida `jalyuzi_sinov` bazasi · `TEST_DATABASE_URL`. Ishlaydigan bazaga yozuv tushmaydi, tizim buni o'zi tekshiradi |
| 13.8 «Tugatdim» oqimi (7-bosqichdan qolgan) | Botda to'liq suhbat: har mato uchun qoldiq o'lchami so'raladi |

---

## 6a. 2026-09-05 auditi — topilgan xatolar

Mustaqil tekshiruv 16 ta xato topdi. **15 tasi yopildi**, bittasi
egasining javobini kutadi.

### Pul hisobiga bevosita tegganlari

| Nima bo'lardi | Nima qilindi |
|---|---|
| Kesimda har buyurtmada ~3.3 kv.m mato hujjatdan **yo'qolardi** (P-24: butun mahsulot eni ishlatilardi, slot kesimi emas) | `kesimOlchami` ikkala yo'lda — veb va bot. Regressiya testi bor: uch qator invarianti buni **ushlamaydi** |
| Transport hisobi keyin kelsa tannarx **sakkiz baravar** oshardi | Narx asosi kirim qatorida qotadi (**0036**) |
| Uchta parda tikilsa ustaga **bittasining** haqi to'lanardi | `haqHisobla` endi `soni` ni biladi |
| Qaytarib olingan ishda eski usta **hech narsa olmasdi** | Haq darhol yoziladi, stavka tozalanadi |
| Dollardagi mijoz chegirmasi **jimgina tashlanardi** | Joriy kursda so'mga o'giriladi; kurssiz bo'lsa sotuvchi ogohlantiriladi |
| Kirim tahririda kesilgan rulonning **bolalari** eski tannarxda qolardi | Zanjir bo'ylab yangilanadi (2.3 saqlanadi) |
| Xodimni nofaol qilishda so'm va dollar **qo'shilardi** (+1000 so'm − 1000 $ = nol) | Qaror domenda, valyutalar alohida |

### Ko'rinish va qoida

| Nima | Nima qilindi |
|---|---|
| Bosh sahifada dollar tushum/kassa/qarz **ko'rinmasdi** | Alohida qator bo'lib chiqadi, valyutalar qo'shilmaydi (1.3) |
| Qarz limiti (6.4) hech qayerda tekshirilmasdi | Sotuv ekranida ogohlantirish |
| Nomzod so'rovi domendagi tartibdan **boshqacha** saralardi | SQL va domen tartibi bir xil |
| Aksessuar `narx_snapshot` iga **tannarx** yozilardi | Alohida ustun (**0037**) |
| Balans ikki joyda hisoblanardi, pul JS soni bilan taqqoslanardi | Domen funksiyasi ulandi |

### Ochiq qolgani

**Usta stavkasi moduli yozilmagan** — jadval bor, ekran yo'q, bazada
0 ta stavka. Hozir har «Tugatdim» da haq **nol** hisoblanadi (10.12
bo'yicha ish to'xtamaydi, ogohlantirish ketadi).

Egasidan javob kutiladi: qat'iy summa · kv.metrga · jadval bo'yicha?
Migratsiya **0038** yozilgan, lekin **qo'llanmagan va ulanmagan**.

### Tekshirilib, xato TOPILMAGANI

Kursi yo'q dollarli buyurtma (`COALESCE(kurs_snapshot, 0)`) — bazadagi
`buyurtma_usd_kurs` cheklovi buni imkonsiz qiladi, tekshirildi.

## 6b. Kartochka sahifalari — 2026-09-06

Uchta kartochka «qancha bor» dan «nima qilish kerak» ga o'tkazildi.

### Material kartochkasi (`/ombor/[id]`)

| Blok | Nima aytadi |
|---|---|
| Necha kunga yetadi | Qoldiq · kunlik sarf · bashorat sanasi. Hisob domenda (`bashorat.ts`), ombor hisoboti bilan bir xil |
| **Bu matoni kutayotgan buyurtmalar** | Xarid ustuvorligini shu belgilaydi: qoldiq kamligi emas, MIJOZ KUTAYOTGANI shoshilinch |
| Tannarx dinamikasi | Kirimdan kirimga, boshidan oxirigacha foizi bilan |
| Yetkazib beruvchilar | Kim, nechta kirim, oxirgi narx |
| Ustama · yo'lda · kam qoldiq · «Kirim qilish» | — |

⚠️ **Tannarx endi sotuvchidan YOPIQ** (11.10). Sahifa har bo'lakning
tannarxini hammaga ko'rsatib turardi. Pul ustunlari `hisobot.ombor.kor`
ga bog'landi — sotuvchida u ataylab yo'q.

### Mijoz kartochkasi (`/mijoz/[id]`)

Mijozlar **B2B** — qayta sotish uchun oladi (egasi, 2026-09-05). Shuning
uchun o'lchamlar tarixi emas, quyidagilar:

| Blok | Nima aytadi |
|---|---|
| **To'lov intizomi** | O'rtacha necha kunda to'laydi · eng uzun kechikish · ochiq qarz necha kunlik |
| **Xarid ritmi** | «2 haftada bir oladi, oxirgisi 5 hafta oldin» — uzilish = boshqa joydan olyapti |
| Nima oladi | Mahsulot turlari va MATOLAR — u shular haqida qo'ng'iroq qiladi |
| Oylik aylanma · rekvizitlar · buyurtmalar tarixi | Buyurtmalar tarixi bu sahifada UMUMAN yo'q edi |

⚠️ Sahifa `mijoz.ozgartir` talab qilardi — sotuvchi BIRORTA mijoz
kartochkasini ocholmasdi. Endi ko'rish uchun `mijoz.kor` yetarli.

### Yetkazib beruvchi kartochkasi (`/yetkazib/[id]`)

| Blok | Nima aytadi |
|---|---|
| **Biz qanday to'laymiz** | Kelgusi shartlar shunga bog'liq |
| **Kurs farqi** | Dollarli yetkazuvchi arzon ko'rinib, qimmatga tushishi mumkin (9.6) |
| **Omborda yotibdi** | Muzlab qolgan pul, yetkazuvchi kesimida (11.7.6) |
| **Da'volar natijasi** | Brak foizi emas — yetkazuvchi JAVOB BERADIMI (9.9) |
| To'lanmagan hujjatlar | Muddati bo'yicha, o'tib ketgani qizil |
| **Boshqada arzonroq** | Faqat bir xil valyuta va bir xil narx asosida (1.3) |
| **Solishtirish akti** | Chop etiladigan A4, imzo joylari bilan. Mijozda bor edi, bu yerda YO'Q edi |

⚠️ Sahifa `yetkazib.ozgartir` talab qilardi — omborchi ocholmasdi.
Endi `yetkazib.kor` yetarli, rekvizitlar kartochkada ko'rinadi.

### Buyurtmalar

`buyurtma.holat.tuzat` — qotib qolgan holatni qo'lda to'g'rilash, sabab
majburiy, auditga `HOLAT_QOLDA_TUZATILDI` bo'lib tushadi.

⚠️ **«Tikilmoqda» va «Tayyor» qo'lda QO'YILMAYDI.** Ular yon ta'sir
talab qiladi: mato ombordan yechilishi va ustaga haq yozilishi kerak.
Qo'lda qo'yilsa ombor qoldig'i haqiqatdan ko'p ko'rinardi.

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
| Sotuv (11.5.1–11.5.6) | — | ✅ | ✅ | ❌ |
| Mijozlar bazasi (11.6.1) | — | ✅ | ✅ | ❌ |
| Ishlab chiqarish (11.8.1–11.8.4) | ❌ | ❌ | ❌ | ❌ |
| Narx dinamikasi (11.9.1) | ❌ | ❌ | ❌ | ❌ |
| Dashboard (11.3) | ❌ | ❌ | ❌ | — |
| Sahifa ustidagi panellar (11.11) | ❌ | ❌ | ❌ | — |

⚠️ **Hisob ✅ — ekran hali yo'q.** Domain qatlami tayyor degani hisobotni
foydalanuvchi ko'ra oladi degani EMAS. Bu ustun faqat formulaning
tekshirilganini bildiradi.

**K-08 (ustama eroziyasi, 37.4%) yopildi** — `test/domain/hisobot-ombor.test.ts`.
Shu bilan CLAUDE.md §6 dagi 11 ta kanonik raqamning hammasi TAYYOR.

⚠️ **11.5.2 (mahsulot turi bo'yicha foyda) `hisobot.moliya.kor` bilan
yopilgan** — unda tannarx va rentabellik bor, sotuvchi ko'rmasligi kerak.
Tannarxi hali yozilmagan pozitsiyalar «tannarxsiz» deb belgilanadi: aks
holda rentabellik 100% bo'lib ko'rinardi.

**Ruxsat (11.10):** `hisobot.ombor.kor` · `hisobot.sotuv.kor` ·
`hisobot.mijoz.kor` · `hisobot.moliya.kor`. Ombor hisobotida TANNARX bor,
shuning uchun u sotuvchiga urug'da berilmaydi.

**So'rovlar `ekran-sorovlari.test.ts` da qoplangan** (T-01) va ishchi bazada
bir marta o'qish rejimida yurgizib ko'rilgan.

Yangi statistikalar ro'yxati va chart mosligi: `docs/HISOBOTLAR-ISH.md`.

---

## 7. Modullararo audit — 2026-09-03

Tekshiruv savoli: tugma bosilganda **boshqa bo'limlarda** to'g'ri natija
chiqadimi. Topilganlarning ko'pchiligi ekranda xato bermas edi — sotuv
o'tar, pul olinar, lekin ombor yoki hisobot boshqa raqam ko'rsatardi.

### Sotuv va to'lov

| Nima buzilgan edi | Holat |
|---|:---:|
| Kelishilgan summa chegirmasi bazaga yozilmasdi — mijozga to'liq narx qarz bo'lardi | ✅ |
| Mijozsiz qarzli buyurtmada naqd pul tizimga tushmasdi | ✅ |
| Avansdan keyin ikkinchi to'lovni yozib bo'lmasdi (`qator = 1` qattiq edi) | ✅ |
| Qo'shimcha buyum sotilmasdi — bazadagi ikki cheklov bir-birini inkor qilardi | ✅ |
| To'lovda pul JS `number` bilan hisoblanardi | ✅ |

### Ombor va ishlab chiqarish

| Nima buzilgan edi | Holat |
|---|:---:|
| Ko'p matoli mahsulotda faqat BIRINCHI mato yechilardi (Rollo, Dikke) | ✅ |
| Chegaralar noto'g'ri materialdan olinardi (`LIMIT 1`) | ✅ |
| Dollarli tannarx dollarda saqlanardi — foyda soxta yuqori chiqardi | ✅ |
| Brak, chiqindi va inventarizatsiya kamomadi xarajat jurnaliga tushmasdi | ✅ |
| Brak bekor qilinganda zarar hisobda qolardi | ✅ |

### Telegram bot

| Nima buzilgan edi | Holat |
|---|:---:|
| «Umumiy navbat» so'rovi mavjud bo'lmagan ustunlarga murojaat qilardi | ✅ |
| «Tugatdim» tugmasining ishlov beruvchisi yo'q edi | ✅ |
| Balansda hisoblangan haq doim nol ko'rinardi (`ISH_HAQI` ≠ `HAQ`) | ✅ |
| Mijozning ikkinchi buyurtmasi «takror» deb yo'qolardi | ✅ |
| Botda korxona nomi ko'rinmasdi (`korxona_nomi` ≠ `korxona_nom`) | ✅ |

### Hisobotlar

| Nima buzilgan edi | Holat |
|---|:---:|
| Xizmat haqi ikki marta sanalardi — tushum qarz bilan mos kelmasdi | ✅ |
| Dollarli buyurtma so'm bilan qo'shilardi (1.3-invariant buzilardi) | ✅ |

### Migratsiyalar

| № | Nima | Qo'llandi |
|---|---|:---:|
| 0031 | Ombor tannarxi so'mga o'giriladi (TZ 9.6) | sinov bazasida ✅ |
| 0032 | Qo'shimcha buyum qatori uchun o'lcham cheklovi (3.10) | sinov bazasida ✅ |

⚠️ **Ishlab chiqarish bazasida hali qo'llanmagan.** Deploydan oldin:
zaxira → `db:migrate` → `test:baza`.

### Ildiz sabab yopildi

Botning so'rovlari `ekran-sorovlari.test.ts` qamroviga qo'shildi. Ilgari
u faqat `app/**/malumot.ts` ni sinardi va shuning uchun botdagi uchta
mavjud bo'lmagan ustun ikki hafta ko'rinmay yotdi. `tsc` SQL ni
o'qimaydi — bu teshikni faqat baza testi yopadi.

---

## 8. Ochiq ishlar — 2026-09-03 auditidan keyin

Quyidagilar TZ da bor, kodda **yo'q**. Har biri alohida ish.

Hozircha ochiq ish **yo'q** — 8-bo'limdagi ikkala band ham 2026-09-05 da yopildi.

✅ **2026-09-03 da yopilgan:**

| Nima edi | Nima qilindi |
|---|---|
| Tasdiqlangan buyurtmaga pozitsiya qo'shib bo'lmasdi (8.7) | `pozitsiyaYozTx` ajratildi, ikkala amal shuni chaqiradi (§2.2). Ekran — sotuv formasining «qo'shish» rejimi |
| Da'vo tugmalari yo'q edi (9.9) | `davoniHalQil` — ikki yo'l, 5 ta test |
| Izohlarda kim/qachon saqlanmasdi (9.7) | `yetkazib_beruvchi_izoh` jadvali (0033) |
| Defekt zarari xarajatga tushmasdi (7.9) | Kirimda `YETKAZIB_BERUVCHI_DEFEKTI` yoziladi — kanonik 66 000 |
| Dollar qarzini so'mda to'lab bo'lmasdi (9.5) | Kross-valyuta to'lov + FIFO taqsimot |
| Kurs farqi hech qachon yozilmasdi (9.6) | `KURS_FARQI` xarajati — kanonik 1 650 000 |
| «Sarflanish tezligi» hisoboti yiqilardi | Jurnal ishoralari to'g'ri hisobga olindi |

⚠️ **0031–0036 ISHLAB CHIQARISHGA QO'LLANDI** (2026-09-05, zaxira olingan).
**0037 esa hali yo'q** — u deploy bilan birga qo'llanadi:

| № | Nima | Sinov bazasida |
|---|---|:---:|
| 0031 | Ombor tannarxi so'mga o'giriladi (9.6) | ✅ |
| 0032 | Qo'shimcha buyum uchun o'lcham cheklovi (3.10) | ✅ |
| 0033 | Yetkazuvchi izohlari jadvali (9.7) | ✅ |
| 0034 | Buyurtma stornosi (8.8) | ✅ |
| 0035 | Ochilgan rulon belgisi (7.4) | ✅ |
| 0036 | Kirim qatorida narx asosi (9.11) | ✅ |
| 0037 | Aksessuar tannarxi alohida ustunda (3.10) | ✅ |

**Deploy tartibi** (aynan shu ketma-ketlikda):

1. **Zaxira** — bazaning nusxasi olinadi (CLAUDE.md §5)
2. `npm run db:migrate` — 0031…0035
3. `npm run db:ruxsat` — **majburiy**: `buyurtma.storno` kodi TypeScriptda,
   SQL fayl uni ko'rmaydi. Bu qadam tushib qolsa admin tugmani ko'rmaydi
4. `npm run test:baza` — ikki marta

⚠️ 2026-08-28 xatosi takrorlanmasin: migratsiya generatsiya qilinib
qo'llanmagan edi va deploydan keyin butun sayt yiqildi. `typecheck`,
`lint`, `test` va `build` — hech biri buni ko'rmaydi.

⚠️ **Maketlar yo'q.** `maketlar/*.html` fayllari loyihada topilmadi. Ekranlar
TZ matni bo'yicha chizildi; maket qo'yilsa ular bilan solishtirish kerak.

---

## Yangilash qoidasi

- Ish tugagach shu jadval yangilanadi — **so'ralmasa ham**
- ❌ ✅ ga aylantirilganda: qaysi test buni tekshirayotgani aytiladi
- Yangi imkoniyat qo'shilsa, u **ustun** bo'lib qo'shiladi va hamma
  qatorda holati belgilanadi. Bitta qatorni to'ldirib qolganini
  bo'sh qoldirish — aynan shu hujjat oldini olmoqchi bo'lgan xato

| Mijoz turlari | ✅ | Spravochnik · soliq belgisi |
