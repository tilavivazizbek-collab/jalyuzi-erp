/**
 * `.env` ni test jarayoniga yuklaydi.
 *
 * Node ning `--env-file` bayrog'i vitest orqali o'tmaydi, `dotenv` esa
 * shu bitta ish uchun qo'shiladigan kutubxona bo'lardi. Fayl oddiy
 * `KALIT=qiymat` ko'rinishida — o'zimiz o'qiymiz.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ulanishYarat } from '@/lib/db/ulanish';

const yol = fileURLToPath(new URL('../../.env', import.meta.url));

try {
  const matn = readFileSync(yol, 'utf8');

  for (const xomQator of matn.split(/\r?\n/)) {
    const qator = xomQator.trim();
    if (qator === '' || qator.startsWith('#')) continue;

    const tenglik = qator.indexOf('=');
    if (tenglik <= 0) continue;

    const kalit = qator.slice(0, tenglik).trim();
    let qiymat = qator.slice(tenglik + 1).trim();

    // Qo'shtirnoq ichida yozilgan bo'lsa olib tashlanadi
    if (
      (qiymat.startsWith('"') && qiymat.endsWith('"')) ||
      (qiymat.startsWith("'") && qiymat.endsWith("'"))
    ) {
      qiymat = qiymat.slice(1, -1);
    }

    // Tashqaridan berilgan qiymat ustun turadi (CI da shunday bo'ladi)
    process.env[kalit] ??= qiymat;
  }
} catch {
  // `.env` yo'q bo'lsa jim o'tiladi — testning o'zi tushunarli xato beradi
}

/**
 * ⚠️ EKRAN FUNKSIYALARI HAM SINOV BAZASIGA QARAYDI.
 *
 *    `app/**\/malumot.ts` dagi so'rovlar ulanishni `ulanishOl()` dan
 *    oladi, u esa `DATABASE_URL` ni o'qiydi. Ya'ni `ekran-sorovlari`
 *    testi shu paytgacha EGASINING ISHLAYDIGAN bazasini o'qib kelgan
 *    (2026-09-03 da aniqlandi).
 *
 *    O'qish edi, zarar yo'q — lekin test kodning O'ZI bilan emas,
 *    ishlab chiqarish sxemasi bilan solishtirilardi: yangi
 *    migratsiya qo'llanmagan bo'lsa test qizil chiqardi va sababi
 *    ko'rinmasdi.
 *
 *    Endi test jarayonida `DATABASE_URL` sinov bazasiga qaratiladi.
 *    Asli `ISH_DATABASE_URL` da saqlanadi — `yordamchi.ts` dagi
 *    «ikkalasi bir xil bo'lmasin» himoyasi o'shani tekshiradi.
 */
{
  const ish = process.env['DATABASE_URL'];
  const sinov = process.env['TEST_DATABASE_URL'];

  if (sinov !== undefined && sinov !== '' && ish !== sinov) {
    if (ish !== undefined) process.env['ISH_DATABASE_URL'] = ish;
    process.env['DATABASE_URL'] = sinov;
  }
}

/**
 * ⚠️ EKRAN SO'ROVLARINING ULANISHI HAM UZLUKSIZ BO'LADI.
 *
 *    `ulanishOl()` standart sozlama bilan ishlaydi: bo'sh ulanish
 *    20 soniyada yopiladi va qayta ochilganda YANA DNS so'raladi.
 *    Masofadagi baza bilan uzoq yurishda bu yuzlab marta takrorlanadi
 *    va DNS bir necha soniya javob bermasa test qizil bo'ladi
 *    (2026-09-05: bitta yurishda 41 ta `ENOTFOUND`, koddagi xato yo'q).
 *
 *    Shuning uchun hovuz SHU YERDA, uzluksiz sozlama bilan yasaladi —
 *    `ulanishOl()` uni tayyor holda topadi.
 *
 * ⚠️ Faqat sinovda: ishlab chiqarishda bo'sh ulanishni ushlab turish
 *    kerak emas va zararli ham (baza tomonda o'rin egallaydi).
 */
{
  const sinov = process.env['TEST_DATABASE_URL'];

  if (sinov !== undefined && sinov !== '') {
    const g = globalThis as typeof globalThis & {
      __jalyuziUlanish?: ReturnType<typeof ulanishYarat>;
    };
    g.__jalyuziUlanish ??= ulanishYarat(sinov, {
      max: 3,
      idleTimeout: 0,
      connectTimeout: 60,
    });
  }
}
