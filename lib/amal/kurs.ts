/**
 * lib/amal/kurs.ts — TZ 14.5 · AUDIT U-13 · QISM 1 §3.2
 *
 * Joriy kurs `kurs_tarix` jadvalidan o'qiladi.
 *
 * ⚠️ QISM 1 §3.2 — «Konversiya faqat `ogir(summa, kurs)`, kurs
 *    **parametr** sifatida.» Shuning uchun bu funksiya kursni faqat
 *    O'QIYDI; hisob-kitobni domain qatlami bajaradi.
 *
 * ⚠️ 2.3-invariant — yozuvga tushgan kurs SNAPSHOT bo'ladi. Ertaga
 *    kurs o'zgarsa kechagi yozuv o'zgarmaydi.
 */

import type postgres from 'postgres';
import { BiznesXato } from '@/lib/xato';

type Soruvchi = postgres.Sql | postgres.TransactionSql;

/**
 * Eng oxirgi belgilangan kurs.
 *
 * `null` — kurs hech qachon kiritilmagan. Chaqiruvchi o'zi hal qiladi:
 * so'mli amal uchun bu muammo emas, dollarli amal uchun xato.
 */
export async function joriyKurs(soruvchi: Soruvchi): Promise<string | null> {
  const q = await soruvchi<{ qiymat: string }[]>`
    SELECT qiymat::text FROM kurs_tarix ORDER BY sana DESC LIMIT 1`;
  return q[0]?.qiymat ?? null;
}

/**
 * Dollarli yozuv uchun kurs — MAJBURIY.
 *
 * `filial_harakat` da baza darajasida cheklov bor:
 * `valyuta <> 'USD' OR kurs_snapshot IS NOT NULL`. Kurs kiritilmagan
 * bo'lsa dollarli amal bazaga yetib borgach yiqilardi va sabab
 * tushunarsiz bo'lardi. Shuning uchun xato SHU YERDA, aniq gap bilan
 * beriladi.
 *
 * So'mli yozuvda kurs kerak emas — `null` qaytadi.
 */
export async function yozuvKursi(
  soruvchi: Soruvchi,
  valyuta: 'SOM' | 'USD',
): Promise<string | null> {
  if (valyuta !== 'USD') return null;

  const kurs = await joriyKurs(soruvchi);
  if (kurs === null) {
    throw new BiznesXato('KURS_NOTOGRI', 'kurs hali belgilanmagan (14.5)');
  }
  return kurs;
}
