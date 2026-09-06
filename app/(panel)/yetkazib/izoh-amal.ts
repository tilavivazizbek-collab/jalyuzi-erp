'use server';

/**
 * app/(panel)/yetkazib/izoh-amal.ts — TZ 9.7
 *
 * ⚠️ Izoh O'CHIRILMAYDI, faqat qo'shiladi (2.1-invariant): kim nima
 *    deganini keyin inkor qilib bo'lmasin.
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { matnMaydon } from '../forma-yordamchi';
import { xatoXabari } from '../xato-xabari';
import type { IzohHolati } from './izoh-holat';

export async function izohQoshAmali(
  yetkazibBeruvchiId: number,
  _oldingi: IzohHolati,
  forma: FormData,
): Promise<IzohHolati> {
  const f = await ruxsatTalab('yetkazib.ozgartir');

  const matn = matnMaydon(forma, 'matn').trim();
  if (matn === '') return { xato: 'Izoh bo‘sh', qoshildi: false };
  if (matn.length > 2000) return { xato: 'Izoh juda uzun', qoshildi: false };

  try {
    await ulanishOl()`
      INSERT INTO yetkazib_beruvchi_izoh (yetkazib_beruvchi_id, matn, yaratdi_id)
      VALUES (${yetkazibBeruvchiId}, ${matn}, ${f.xodimId})`;

    revalidatePath('/yetkazib');
    return { xato: null, qoshildi: true };
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'yetkazib/izoh-amal', 'Izohni saqlab bo‘lmadi'),
      qoshildi: false,
    };
  }
}
