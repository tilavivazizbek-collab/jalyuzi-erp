/**
 * instrumentation.ts — serverdagi xatolarni yozib boradi.
 *
 * ⚠️ NEGA KERAK
 *
 *    Ishlab chiqarishda Next.js xato MATNINI yashiradi va faqat
 *    `digest` raqamini ko'rsatadi. Egasi menga «xato chiqdi,
 *    raqami 2143683442» deydi — men esa u raqamdan hech narsa
 *    bilmayman.
 *
 *    2026-08-29: bitta xato shu sababdan ikki kun izlandi. Endi
 *    har xato `xato_jurnal` jadvaliga digest bilan yoziladi va
 *    `npm run db:xato` bilan o'qiladi.
 *
 * ⚠️ Bu yerda XATO OTILMAYDI. Jurnalga yozib bo'lmasa (masalan
 *    baza o'chgan) — jimgina o'tib ketadi. Xatoni yozishga
 *    urinish paytida yiqilish eng yomon holat bo'lardi.
 */

import type { Instrumentation } from 'next';

export const onRequestError: Instrumentation.onRequestError = async (
  xato,
  sorov,
) => {
  /**
   * ⚠️ Faqat Node muhitida. Edge da `postgres` kutubxonasi
   *    ishlamaydi (QISM 1 §2.3 — platformaga bog'lanmaymiz,
   *    lekin Edge runtime baza ulanishini ko'tarmaydi).
   */
  if (process.env['NEXT_RUNTIME'] !== 'nodejs') return;

  try {
    const x = xato as { message?: unknown; stack?: unknown; digest?: unknown };

    const xabar = typeof x.message === 'string' ? x.message : String(xato);
    const stek = typeof x.stack === 'string' ? x.stack : null;
    const digest = typeof x.digest === 'string' ? x.digest : null;

    const { ulanishOl } = await import('@/lib/db');

    await ulanishOl()`
      INSERT INTO xato_jurnal (digest, yol, xabar, stek)
      VALUES (${digest}, ${sorov.path}, ${xabar.slice(0, 4000)},
              ${stek === null ? null : stek.slice(0, 8000)})`;
  } catch {
    // Jurnalga yozib bo'lmadi — asosiy xato baribir foydalanuvchiga ketadi
  }
};
