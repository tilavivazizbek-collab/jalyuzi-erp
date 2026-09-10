/**
 * lib/sxema/umumiy.ts — forma sxemalarining umumiy qismlari.
 *
 * ⚠️ NEGA BU FAYL BOR
 *
 *    Forma HAR DOIM matn yuboradi va to'ldirilmagan maydondan
 *    BO'SH SATR keladi. Ekranda umuman chizilmagan maydondan ham
 *    bo'sh satr keladi — server `matnMaydon` bilan har maydonni
 *    o'qiydi.
 *
 *    Zod ning `.default()` esa faqat `undefined` da ishlaydi.
 *    Ya'ni `z.enum([...]).default('SOM')` bo'sh satrni QABUL
 *    QILMAYDI va tekshiruv yiqiladi.
 *
 * ⚠️ 2026-09-10 — bu xato jonli chiqdi.
 *
 *    Mijoz formasidagi `shaxsTuri` maydoni ekranda yo'q edi
 *    (u mijoz turidan hisoblanadi). Natijada MIJOZ QO'SHIB
 *    BO'LMASDI: ekranda «Formada xato bor — qizil maydonlarni
 *    tekshiring» turar, qizil maydon esa yo'q edi.
 *
 *    Egasi buni o'zi topdi. Xuddi shunday tuzoq yana sakkiz
 *    maydonda bor edi — ular faqat formalari yashirin maydon
 *    yuborgani uchun portlamayotgan edi. Bu tasodifiy himoya,
 *    shuning uchun qoida bitta joyga chiqarildi.
 */

import { z } from 'zod';

/**
 * Ro'yxatdan tanlanadigan maydon — BO'SH SATR standart qiymatga
 * aylanadi.
 *
 * ```
 * shaxsTuri: royxat(SHAXS_TURLARI, 'JISMONIY')
 *   ''          → 'JISMONIY'
 *   'YURIDIK'   → 'YURIDIK'
 *   'BOSHQA'    → RAD ETILADI
 * ```
 *
 * ⚠️ Noma'lum qiymat baribir RAD ETILADI — bu tekshiruvni
 *    yumshatish emas, faqat «yuborilmagan» va «noto'g'ri» ni
 *    ajratish.
 */
export function royxat<const T extends readonly [string, ...string[]]>(
  qiymatlar: T,
  standart: T[number],
) {
  return z
    .string()
    .trim()
    .transform((x) => (x === '' ? standart : x))
    .pipe(z.enum(qiymatlar))
    .default(standart);
}

/**
 * To'ldirilmasa `undefined` bo'ladigan matn maydoni.
 *
 * ⚠️ Bo'sh satr bazaga YOZILMAYDI: `''` va `NULL` ikki xil narsa,
 *    aralashsa «telefon bormi?» degan savolga javob noaniq
 *    bo'lardi.
 */
export const bosMatn = z
  .string()
  .trim()
  .transform((x) => (x === '' ? undefined : x))
  .optional();
