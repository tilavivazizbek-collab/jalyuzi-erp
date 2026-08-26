# JOYLASHTIRISH — Render

Saytni va botni internetga chiqarish tartibi.

⚠️ Bu **10-bosqichning bir qismini oldinga surish**. Maqsad —
tizimni haqiqiy tezlikda sinab ko'rish. Yakuniy joylashtirish
egasining o'z serverida bo'ladi.

---

## Nega kerak

Hozir sayt noutbukda, baza Amerikada. Har sahifa 10–20 so'rov
yuboradi va **har biri okeanni kesib o'tadi**.

```
Hozir:   Brauzer ──1 ms── Noutbuk ══20 × 200 ms══ Baza (Ogayo)   ≈ 4 000 ms
Keyin:   Brauzer ══90 ms══ Render (Frankfurt) ──20 × 1 ms── Baza ≈   120 ms
```

Brauzer **bitta** so'rov yuboradi. Server o'z ichida 20 so'rovni
bajaradi — lekin ular bir xonada.

---

## ⚠️ Eng muhim qoida: mintaqa mos kelishi shart

| Render | Neon | Natija |
|---|---|---|
| Frankfurt | **Frankfurt** | ~120 ms — to'g'ri |
| Ogayo | Ogayo | ~270 ms — ishlaydi |
| Frankfurt | Ogayo | ~4 000 ms — **foyda yo'q** |

Frankfurt tanlandi: O'zbekistondan ~90 ms, Ogayodan ~250 ms.

---

## 1-qadam · Yangi baza (Frankfurt)

1. [neon.tech](https://neon.tech) ga kiring
2. **New Project** → mintaqa: **Europe (Frankfurt)**
3. Nom: `jalyuzi-ish`
4. Ulanish satrini nusxa oling (`postgres://...`)

⚠️ **Ikkita alohida baza tavsiya etiladi:**

| Baza | Kim ishlatadi |
|---|---|
| `jalyuzi-ish` (Frankfurt) | Sayt, bot, siz |
| `jalyuzi-sinov` (istalgan) | Faqat `npm run test:baza` |

Sabab: testlar har yurishda yangi material, filial va mijoz
yozadi. Bitta bazada ishlansa bir haftada 300 dan ortiq keraksiz
yozuv to'planadi — bir marta shunday bo'lgan edi.

---

## 2-qadam · Bazani tayyorlash

Loqal kompyuterda, `.env` dagi `DATABASE_URL` ni yangisiga
almashtirib:

```powershell
npm run db:migrate
npm run db:urug
```

Birinchisi jadvallarni quradi, ikkinchisi bosh filial va
adminni yaratadi.

---

## 3-qadam · Kodni GitHub ga qo'yish

Render kodni GitHub dan oladi.

```bash
git remote add origin <sizning-repo>
git push -u origin bosqich-0-poydevor
```

⚠️ `.env` git ga **tushmaydi** — `.gitignore` da. Sirlar 4-qadamda
Render ichida kiritiladi.

---

## 4-qadam · Renderga ulash

1. [render.com](https://render.com) → **New** → **Blueprint**
2. GitHub omborini tanlang
3. Render `render.yaml` ni o'zi topadi va **ikkita xizmat** taklif
   qiladi:
   - `jalyuzi-erp` — sayt
   - `jalyuzi-bot` — Telegram bot
4. Har biriga muhit o'zgaruvchilarini kiriting:

| O'zgaruvchi | Qiymat |
|---|---|
| `DATABASE_URL` | Neon Frankfurt ulanish satri |
| `AUTH_SECRET` | 32 belgidan uzun. Yasash: `openssl rand -base64 32` |
| `TELEGRAM_BOT_TOKEN` | @BotFather bergan token |
| `TELEGRAM_ADMIN_CHAT_ID` | Admin Telegram raqami |
| `CRON_SECRET` | 16 belgidan uzun tasodifiy matn |
| `BACKUP_CHANNEL_ID` | Zaxira kanali raqami (hozircha `0`) |

⚠️ `AUTH_SECRET` ni **almashtirmang**: o'zgartirilsa hamma
foydalanuvchi tizimdan chiqib ketadi.

5. **Apply** bosing

---

## 5-qadam · Tekshirish

| Nima | Qanday |
|---|---|
| Sayt ochiladimi | `https://jalyuzi-erp.onrender.com/kirish` |
| Kirish ishlaydimi | Admin telefoni va paroli bilan |
| Bot javob beradimi | Telegramda `/start` |
| Tezlik | Sahifa 1 soniyadan tez ochilishi kerak |

---

## ⚠️ Bepul tarifdagi tuzoq

Render bepul tarifda **15 daqiqa tegilmasa uxlaydi**. Uyg'onishi
**30–60 soniya**.

Ertalab birinchi sotuvchi bir daqiqa kutadi. Haqiqiy ishlatish
uchun `starter` tarifi kerak — **$7/oy** har xizmat uchun.

`render.yaml` da `plan: starter` yozilgan. Bepul sinab ko'rmoqchi
bo'lsangiz `plan: free` qiling, lekin yuqoridagini bilib turing.

---

## Nima o'zgarmaydi

- **Platformaga bog'lanmaslik** (QISM 1 §2.3) saqlanadi: Render
  oddiy Docker konteynerini yuritadi, hech qanday maxsus xizmatiga
  bog'lanmaymiz
- `docker compose up` loqal to'liq ishlayveradi
- Ertaga o'z serveringizga ko'chirilsa **ayni tasvirlar** ishlaydi

---

## Keyingi qadam — o'z serveringiz

Render — oraliq yechim. 10-bosqichda:

- Baza egasining serveriga ko'chadi
- Zaxira nusxa jadvali qo'yiladi (QISM 1 §17)
- Domen ulanadi

O'shanda sahifa **~0.1 soniyada** ochiladi va oylik to'lov
qolmaydi.
