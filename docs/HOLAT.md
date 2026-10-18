# JALYUZI ERP — UMUMIY HOLAT VA KEYINGI QADAMLAR

**Sana:** 2026-10-18 · **Oxirgi deploy:** `b78c8a4` (live) · **Baza:** 67/67 migratsiya

Bu fayl ikki qismdan iborat:

- **A-qism — egasi uchun.** Oddiy tilda: nima qilingan, sizga nima qolgan, mening tavsiyalarim.
- **B-qism — keyingi sessiya uchun.** Texnik tafsilotlar: qayerda nima bor, qanday deploy qilinadi, nimadan boshlash kerak.

Batafsil hujjatlar: `docs/QAMROV.md` (har band holati), `docs/QARZLAR.md` (texnik qarzlar),
`docs/BULUT-KONTEKST.md` (qarorlar tarixi), `docs/LOYIHA.md` (TZ — asosiy talab).

---

# A-QISM — EGASI UCHUN

## 1. Hozir qayerda turibmiz

Sayt ishlayapti: **https://jalyuzi-erp-1.onrender.com**. Dastur va baza javob beradi.

Ish 2026-08-16 da boshlangan, shu kungacha 280 ga yaqin o'zgarish kiritildi. TZ dagi
asosiy bo'limlarning hammasi qurilgan va sinalgan. Hozir sayt ichida 170 ta avtomat
tekshiruv fayli bor, ular har o'zgarishdan keyin 2 200 dan ortiq holatni tekshiradi.

## 2. Nima qurilgan (bo'limlar bo'yicha)

| Bo'lim | Nima qiladi |
|---|---|
| **Kirish va ruxsatlar** | Telefon va parol bilan kirish. 5 marta xato paroldan keyin 15 daqiqa blok. Har rolga alohida ruxsat. Sotuvchiga tannarx va foyda ko'rinmaydi |
| **Ma'lumotnomalar** | Filiallar, materiallar, mahsulot turlari (tarkibi va sarf formulasi bilan), xodimlar, mijoz turlari va guruhlari |
| **Narxlar** | Tur bo'yicha narx, ko'p olganga arzonroq narx, mijoz turi va filial bo'yicha narx, so'm/dollar, materialning o'zini sotish narxi, «narx xaritasi» (qaysi turda narx yo'q) |
| **Sotuv va buyurtma** | Buyurtma yaratish (zamer o'lchami → tayyor o'lcham), narxni avtomat hisoblash, to'lov, tahrir, storno, qaytarish, qayta kesish, chek va kvitansiya, usta uchun ish varaqasi |
| **Ombor** | Kirim, chiqim, rulon va bo'laklar (qoldiq kesimlar), band qilish, ko'chirish, inventarizatsiya, joylashuv, yorliq, xarid tavsiyasi |
| **Ishlab chiqarish** | Navbat, usta ish oladi va tugatadi (Telegram bot orqali), usta stavkasi (3 usul), brak va ushlanma |
| **Mijozlar** | Kartochka, qarz (FIFO bo'yicha buyurtmalarga taqsimlanadi), qarz limiti, to'lov muddati, segmentlar (eng yaxshi, uxlab qolgan…), Telegram eslatmalari |
| **Yetkazib beruvchilar** | Qarz, avans, to'lov muddati, defekt va da'vo, narx dinamikasi |
| **Kassa va xodimlar** | Kassa, kun yopish (kamomad/ortiqcha), xarajatlar, xodim balansi (haq, to'lov, ushlanma) |
| **Filiallararo** | Bir filial sotadi, boshqasi ishlab chiqaradi, yo'ldagi mahsulot, filiallararo qarz |
| **Hisobotlar** | Moliya (foyda-zarar, kassa oqimi, pul prognozi), sotuv, mijozlar, ombor (ABC, qoldiq, muzlagan pul, ustama), ishlab chiqarish, ta'minot, reja va fakt. **Har biri Excel'ga yuklanadi** |
| **Bosh sahifa (dashboard)** | Bugungi raqamlar, oy rejasi, «Diqqat talab qiladi» (8 band), oylik trend grafigi |
| **Sahifa panellari** | Buyurtmalar, Mijozlar, Ombor, Yetkazib beruvchilar, Xodimlar sahifalari tepasida: hozirgi holat, «bu oy» o'tgan oyning shu kunigacha bilan solishtirilgan, ogohlantirishlar |
| **Avtomat ishlar** | Kunlik zaxira (Telegram kanalga), kam qoldiq, kechikkan buyurtmalar, qarz eslatmasi, to'lov muddati, kechki hisobot, oylik yakun — **cron-job.org sozlanishini kutmoqda** |
| **Ko'rinish** | Kunduzgi va tungi rejim |

## 3. SIZGA QOLGAN ISHLAR — shoshilinch

| # | Nima | Muddat | Nega |
|---|---|---|---|
| 1 | **Render'da bazani pullik tarifga o'tkazish** (jalyuzi-db) | **2026-11-13 gacha** | Bepul baza shu kuni O'CHADI — hamma ma'lumot yo'qoladi |
| 2 | **cron-job.org ni sozlash** (9 ta avtomat ish) | iloji boricha tez | Hozir kunlik zaxira OLINMAYAPTI, eslatmalar va ogohlantirishlar ketmayapti |
| 3 | Eski saytni (jalyuzi-erp) to'xtatish | qulay paytda | Keraksiz, pul yoki chalkashlik keltiradi |

⚠️ 2-band bo'yicha: cron sozlanmaguncha baza zaxirasi faqat Render'ning o'zida turadi.
Pullik tarifga o'tishning yana bir sababi shu — pullik bazada Render o'zi ham kunlik
nusxa saqlaydi.

## 4. Sizdan QAROR kerak bo'lgan savollar

Bular dasturchi hal qila olmaydi — bu biznes qoidasi. Javob berilsa, darhol qilinadi.

| # | Savol | Hozir qanday |
|---|---|---|
| 1 | **Karnizni kasr metrda sotish** (masalan 2.5 m) kerakmi? | Faqat butun metrda sotiladi |
| 2 | **Bir mijoz ikki marta yozilib qolsa — birlashtirish** kerakmi? | Birlashtirib bo'lmaydi (qarz tarixi o'zgarmas jurnalda) |
| 3 | **Bonus yoki keshbek** — kimga, qanchadan, qachon? | Yo'q |
| 4 | **SMS yuborish** — Eskiz yoki Playmobile bilan shartnoma bormi? | Faqat Telegram. Telegrami yo'q mijozga eslatma bormaydi |
| 5 | **Naqshli mato** bormi? (kesish yo'nalishi muhim bo'lsa) | Kesish yo'nalishi turda belgilanadi |
| 6 | **Eski kirimlarda summa farqi** (P-46) — tuzatuvchi yozuv qilinsinmi? | Tegilmagan |
| 7 | Sotuv va Moliya hisobotlarida «oldingi davr»ni ham **o'tgan oyning shu kunigacha** deb solishtirish kerakmi? | Panellarda shunday, hisobotlarda — to'liq o'tgan oy bilan |
| 8 | Usta stavkasi **dollarda** ham bo'lishi kerakmi? | Faqat so'mda |
| 9 | Ustama ogohlantirish chegarasi **30%** to'g'rimi? | 30% |
| 10 | USB **termoprinterga to'g'ridan-to'g'ri** chop etish kerakmi? | Brauzer orqali chop etiladi |

## 5. Mening fikrim va tavsiyalarim

### Loyiha haqida umumiy fikr

Tizimning asosi mustahkam. Pul qayerda saqlanmaydi — har safar harakatlar jurnalidan
qayta hisoblanadi, shuning uchun raqamlar «suzib» ketmaydi. Jurnallarni o'chirib yoki
o'zgartirib bo'lmaydi (bazaning o'zi to'sadi), xato faqat teskari yozuv bilan tuzatiladi.
So'm va dollar hech qayerda aralashmaydi. Sotuvchi tannarxni ko'rmaydi.

**Eng katta xavf hozir texnik emas, tashkiliy:** bepul baza va sozlanmagan zaxira.
Bitta muvaffaqiyatsiz kun hamma ma'lumotni yo'qotishi mumkin. 3-bo'limdagi 1- va 2-band
boshqa hamma narsadan muhimroq.

### Tavsiya qilinadigan qo'shimchalar (muhimligi bo'yicha)

**1-daraja — ishonchlilik (pul sarflanmaydi yoki juda kam)**

1. **Sayt kuzatuvi** — UptimeRobot (bepul) har 5 daqiqada saytni tekshiradi, yiqilsa
   Telegramga xabar beradi. 10 daqiqalik ish, men tayyorlab beraman.
2. **Zaxiraning 2-qatlami** — Telegram kanaldan tashqari ikkinchi joyga (masalan
   Cloudflare R2 yoki Backblaze — oyiga deyarli tekin). TZ §17 da talab qilingan.
3. **Zaxiradan tiklashni sinash** — oyda bir marta zaxira faylini sinov bazasiga
   tiklab ko'rish (buyruq tayyor: `db:zaxira-tekshir`).

**2-daraja — biznesga to'g'ridan-to'g'ri foyda**

4. **Zamer va o'rnatish jadvali** — zamerchi va montajchi qaysi kuni, qaysi manzilga
   boradi; kalendar ko'rinishi; mijozga Telegram orqali «ertaga soat 10 da boramiz»
   xabari. Jalyuzi biznesida bu eng ko'p chalkashlik bo'ladigan joy, hozir tizimda yo'q
   (faqat zamer o'lchami yoziladi).
5. **Tijorat taklifi (KP)** — buyurtma qilinmagan, faqat narx so'ragan mijozga chiroyli
   PDF taklif; keyinchalik bir bosishda buyurtmaga aylanadi. Qaysi taklif sotuvga
   aylangani hisobotda ko'rinadi.
6. **Mijozga buyurtma holati** — Telegram botda mijoz o'z buyurtmasi qayerdaligini
   (ishlab chiqarishda / tayyor / o'rnatildi) o'zi ko'radi. Sotuvchiga qo'ng'iroq kamayadi.
7. **Jo'natma** — filiallararo bir nechta buyurtmani bitta jo'natma qilib yuborish va
   bir bosishda qabul qilish (hozir har pozitsiya alohida qabul qilinadi).

**3-daraja — keyinroq**

8. Telefon uchun ilova ko'rinishi (PWA) — sotuvchi va omborchi telefondan qulay ishlaydi.
9. Omborchi kesimida inventarizatsiya farqlari hisoboti (TZ 15.1).
10. SMS — 4-savolga javob bo'lsa.

---

# B-QISM — KEYINGI SESSIYA UCHUN (texnik)

## 6. Loyiha va muhit

| Nima | Qiymat |
|---|---|
| Papka | `C:\Users\tilav\Desktop\jalyuzi erp\jalyuzi-erp` |
| GitHub | `tilavivazizbek-collab/jalyuzi-erp`, branch **`bosqich-0-poydevor`** (push → Render avtomat deploy) |
| Stek | Next.js 15 App Router, postgres.js (tagged SQL), decimal.js, Vitest, Docker (`node:22-alpine3.24`, `postgresql18-client`) |
| Ishchi sayt | Render `jalyuzi-erp-1`, servis `srv-db7qc0q5b2lc738sire0` |
| Ishchi baza | Render `jalyuzi-db` `dpg-db7qu2rncjis73f9hjr0-a`, PostgreSQL 18, Frankfurt, **Free — 2026-11-13 da o'chadi** |
| Eski servis | `jalyuzi-erp` `srv-da7jchbm6pss73fultvg` — **TEGILMAYDI**, egasi o'zi to'xtatadi |
| Admin | telefon 998948802545 — **parol o'zgartirilmaydi** |

⚠️ **Kalitlar va parollar bu faylda YO'Q va bo'lmasligi kerak.** Render API kaliti va
bazaning tashqi URL'i egasining deploy yo'riqnomasida (suhbatga joylanadi). Ularni
ekranga chiqarma, kodga va gitga yozma.

### Lokal muhit (egasining kompyuteri)

- PostgreSQL 16 portativ: `C:\Users\tilav\pgsql16` (qayta yoqilganda to'xtaydi).
  Ishga tushirish: `pg_ctl.exe -D C:\Users\tilav\pgsql16\data -l ...\server.log start`, keyin `pg_isready` kut.
- Bazalar: `jalyuzi` (lokal ishchi), `jalyuzi_sinov` (testlar), `jalyuzi_ekran` (vaqtinchalik,
  `TEMPLATE jalyuzi` — ekran tekshiruvi uchun, ishdan keyin o'chiriladi).
- Lokal login ma'lumotlari — Claude xotirasida (gitda emas).
- Git Bash `/yo'l` argumentini Windows yo'liga aylantiradi — oldidagi `/` siz yoz.

### Tekshiruv buyruqlari

```
npm run typecheck · npm run lint · npm test                        # bazasiz, ~1 400 test
DATABASE_URL=postgres://jalyuzi:jalyuzi@localhost:5432/jalyuzi \
TEST_DATABASE_URL=postgres://jalyuzi:jalyuzi@localhost:5432/jalyuzi_sinov \
  npm run test:baza                                               # 92 fayl, ~870 test, ~10 daqiqa
BRAUZER_URL=http://localhost:3001 TEST_DATABASE_URL=<sinov> npm run test:brauzer
                                                                  # sayt sinov bazasi bilan oldindan yoqilgan bo'lsin
npm run build    # AUTH_SECRET, CRON_SECRET, BACKUP_CHANNEL_ID, TZ=Asia/Tashkent soxta qiymat bilan
```

Ekran tekshiruvi: Playwright (`playwright-core`, `channel: 'chrome'`) — scratchpad'dagi skriptlar.

## 7. Deploy tartibi (egasi yo'riqnomasi bo'yicha)

1. `git status` — commit qilinmagan narsa deploy qilinmaydi.
2. typecheck, lint, test, test:baza, build — **qizil bo'lsa TO'XTA**.
3. `/api/salomatlik` → `{"dastur":true,"baza":true}`.
4. `lib/db/migratsiya/*.sql` soni ↔ `drizzle.__drizzle_migrations` soni. Yangi bo'lsa:
   `DATABASE_URL=<tashqi> npx drizzle-kit migrate`. **Ma'lumot o'chiradigan migratsiya → avval egasidan so'ra.**
5. `git push origin bosqich-0-poydevor` (bo'lmasa Render API `POST /v1/services/<id>/deploys`).
6. Render API `GET .../deploys?limit=1` — commit va status `live` ni kut.
7. Yangi ruxsat kodi qo'shilgan bo'lsa: `DATABASE_URL=<tashqi> TZ=Asia/Tashkent npx tsx --env-file=.env lib/db/ruxsat-buyruq.ts`.
8. Yakuniy: `/api/salomatlik` 200 baza:true · `/kirish` 200 · `/mijoz` → 307 `/kirish`.
9. Egasiga 3 qator: nima deploy bo'ldi, sayt ishlayaptimi, unga nima qolgan.

Render muhit o'zgaruvchilari: `PUT` butun ro'yxatni ALMASHTIRADI — avval `GET`, keyin to'liq ro'yxat.
Xizmat yoki bazani o'chirish, to'xtatish, tarifini o'zgartirish — **faqat egasi aytsa**.

## 8. Qat'iy qoidalar (buzilmaydi)

- Egasining ishchi bazasiga faqat deploy tartibi orqali yoziladi (migratsiya, db:ruxsat). `.env` o'zgartirilmaydi.
- Testlar ishchi bazaga tegmaydi — faqat `jalyuzi_sinov` / vaqtinchalik nusxa.
- Harakat jadvallarida (`mijoz_harakat`, `xodim_harakat`, … ) DELETE/UPDATE yo'q — triggerlar to'sadi.
  Testlar shuni hisobga oladi: qat'iy id, mutlaq COUNT yo'q, qayta ishga tushganda ham o'tishi shart.
- Balans saqlanmaydi — jurnal yig'indisidan hisoblanadi. So'm va dollar alohida (1.3).
- Sotuvchi tannarx va foydani ko'rmaydi (`tannarxniKoradimi`).
- `any`, `@ts-ignore`, `eslint-disable` yo'q. Bitta mantiq — bitta joyda (umumiy SQL fragmentlar).
- Ekranlarda `dark:` emas — `light-dark()` tokenlari.
- Har qadamdan keyin commit; xabar oxirida `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Yangi kutubxona versiyasi kamida 2 hafta oldin chiqqan bo'lsin (masalan playwright-core 1.63.0 qat'iy).
- Egasi bilan o'zbekcha, qisqa; u dasturchi emas — texnik savol berma, soha ekspertizasini o'zing taklif qil.

## 9. Ochiq texnik ishlar

| Nima | Holat | Qayerda |
|---|---|---|
| cron-job.org — 9 yo'l: `zaxira` 03:00, `band-muddati` 04:00, `kam-qoldiq` 08:00, `muddat-nazorat` 09:00, `yetkazib-muddat` 09:00, `qarz-eslatma` 10:00, `kun-eslatma` 20:00 (har 15 daq.), `kechki-hisobot`, `oylik-yakun` (oyning 1-kuni 08:00). Sarlavha `x-cron-secret` | egasi sozlaydi (yoki ruxsat bersa — yordam) | `app/api/cron/*`, `lib/kirish/cron.ts` |
| Zaxira 2-qatlam (tashqi saqlash, 30 kunlik aylanish) | yo'q | QAMROV §17 qatori |
| T-16 karniz kasr metr — `buyurtma_pozitsiya.soni` integer | egasi qarori | QARZLAR T-16 |
| T-10 jo'natma | yozilmagan | QARZLAR T-10 |
| T-07 inventarizatsiya — omborchi kesimi hisoboti | ro'yxat bor, kesim hisoboti tekshirilsin | QARZLAR T-07 |
| T-02 `docker compose up` | Docker yo'q, tekshirilmagan | QARZLAR T-02 |
| T-03 14 ta qaror LOYIHA.md ga ko'chirilmagan | egasi tasdig'i | `docs/QARORLAR-KOD.md` |
| «Hozir kesiladi» yorlig'i (materialni o'zi sotishda ishlab chiqarishni chetlab o'tish) | keyingi qadam | QAMROV, «Materialni o'zi sotish» |
| Sotuv/Moliya hisobotida oldingi davr = shu kungacha | egasi qarori (A-qism 7-savol) | `oldingiShuKungacha` — `lib/domain/hisobot/davr.ts` |

## 10. Oxirgi sessiyalarda qilingan (2026-10-10 … 10-18)

- Hisobotlar auditi: moliya (USD xarajat o'z sanasidagi kurs bilan), ishlab chiqarish hisoboti (11.8), narx dinamikasi (11.9.1).
- Excel eksport — barcha 6 hisobot, ikki varaq (Yig'ma + Xom ma'lumot); o'z xlsx yozuvchimiz (`lib/domain/xlsx.ts`, kutubxonasiz).
- Dashboard: «Diqqat talab qiladi» va «Oylik trend».
- Sahifa panellari (TZ 11.11) — `app/(panel)/modul-panel.tsx` + har modulda `panel.ts`; «bu oy» `oldingiShuKungacha` bilan.
- Mijozlar: «o'rtacha to'lov muddati» — davrda yopilgan nasiya buyurtmalar (`yopilganNasiyaKunlari`, naqd sanalmaydi).
- 0067 indeks migratsiyasi; `hisobot.ishlab.kor` ruxsati.
- Brauzer testlari (T-01 yopildi): `test/brauzer/kirish.test.ts`.
- Yangi Render loyihasi (2026-10-14) — eski baza 10-03 da tushgan edi.

## 11. Keyingi sessiya nimadan boshlaydi

1. Egasidan javob kelganmi — A-qism 3- va 4-bo'limlar (pullik baza, cron, savollar).
2. Javob bo'lmasa — avtonom davom: A-qism 5-bo'limdagi 1-darajali tavsiyalar
   (sayt kuzatuvi yo'riqnomasi, zaxira 2-qatlami), keyin T-07 tekshiruvi, «Hozir kesiladi».
3. 2-darajali katta modullar (zamer/o'rnatish jadvali, tijorat taklifi) — avval egasiga
   qisqa taklif, roziligidan keyin quriladi.
4. Har ishdan keyin: testlar → commit → deploy tartibi → egasiga 3 qator.
   `docs/QAMROV.md` va shu fayl yangilanadi.
