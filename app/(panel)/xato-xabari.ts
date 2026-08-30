/**
 * app/(panel)/xato-xabari.ts — amal xatosini xabarga aylantiradi.
 *
 * ⚠️ NEGA KERAK (2026-08-30)
 *
 *    Har amalda bir xil naqsh bor edi:
 *      `biznesXatosimi(x) ? x.message : 'Saqlashda xato yuz berdi'`
 *
 *    Biznes xatosi tushunarli («qarzi bor»), qolgani esa
 *    DASTUR XATOSI: u ekranda umumiy jumla bo'lib ko'rinadi va
 *    HECH QAYERDA QOLMAYDI. Egasi «xato chiqdi» deydi, sabab
 *    esa yo'qoladi.
 *
 *    Aynan shu sababdan mijoz saqlanmagani ikki marta izlandi.
 *
 * ⚠️ Endi kutilmagan xato `xato_jurnal` ga yoziladi va
 *    `npm run db:xato` bilan ko'rinadi.
 */

import { biznesXatosimi } from '@/lib/xato';
import { kutilmaganXatoniYoz } from '@/lib/xato-jurnal';

export async function xatoXabari(
  x: unknown,
  /** Qayerda bo'lgani — jurnalda shu ko'rinadi */
  yol: string,
  standart: string,
): Promise<string> {
  if (biznesXatosimi(x)) return x.message;

  await kutilmaganXatoniYoz(x, yol);
  return `${standart} — dasturchiga xabar berildi`;
}
