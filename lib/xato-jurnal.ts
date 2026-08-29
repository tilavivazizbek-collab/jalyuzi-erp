/**
 * lib/xato-jurnal.ts — kutilmagan xatoni bazaga yozish.
 *
 * ⚠️ NEGA KERAK
 *
 *    2026-08-29: mijozni o'chirish har safar SQL xatosi bilan
 *    yiqilardi (`buyurtma.holat` — bunday ustun yo'q). Ekranda
 *    esa faqat «O'chirib bo'lmadi» degan qisqa yozuv chiqardi.
 *    Xato hech qayerda qolmadi va u ikki hafta sezilmasligi
 *    mumkin edi.
 *
 *    Sahifa yiqilsa `instrumentation.ts` yozadi. Lekin amal
 *    ichida USHLANGAN xato u yergacha yetib bormaydi — shuning
 *    uchun uni qo'lda yozamiz.
 *
 * ⚠️ Bu funksiya HECH QACHON xato otmaydi: jurnalga yozib
 *    bo'lmagani asosiy ishni to'xtatmasligi kerak.
 */

import { ulanishOl } from '@/lib/db';

export async function kutilmaganXatoniYoz(xato: unknown, yol: string): Promise<void> {
  try {
    const x = xato as { message?: unknown; stack?: unknown };
    const xabar = typeof x.message === 'string' ? x.message : String(xato);
    const stek = typeof x.stack === 'string' ? x.stack : null;

    await ulanishOl()`
      INSERT INTO xato_jurnal (digest, yol, xabar, stek)
      VALUES (NULL, ${yol}, ${xabar.slice(0, 4000)},
              ${stek === null ? null : stek.slice(0, 8000)})`;
  } catch {
    // jimgina — asosiy xato baribir foydalanuvchiga qaytadi
  }
}
