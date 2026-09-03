'use server';

/**
 * TZ 8.9 — chek chop etilgani jurnalga yoziladi.
 *
 * ⚠️ Sahifani OCHISH chop etish emas: sotuvchi ko'rib yopishi
 *    mumkin. Jurnalga faqat «Chop etish» bosilganda yoziladi.
 */

import { ulanishOl } from '@/lib/db';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { chekChopEtildi, chekChopEtilganmi } from '@/lib/amal/chek';
import { kutilmaganXatoniYoz } from '@/lib/xato-jurnal';
import { biznesXatosimi } from '@/lib/xato';

export async function chopEtishniYoz(buyurtmaId: number): Promise<void> {
  const f = await ruxsatTalab('buyurtma.kor');

  try {
    const sql = ulanishOl();
    const oldin = await chekChopEtilganmi(sql, buyurtmaId);
    await chekChopEtildi(sql, buyurtmaId, f.xodimId, f.filialId, oldin);
  } catch (x) {
    /**
     * ⚠️ Jurnal yozilmasa ham CHEK CHIQADI. Chop etishni to'xtatib
     *    qo'yish mijozni chetsiz qoldiradi; yozuv esa keyin
     *    `npm run db:xato` da ko'rinadi.
     */
    if (!biznesXatosimi(x)) await kutilmaganXatoniYoz(x, 'chek/chop');
  }
}
