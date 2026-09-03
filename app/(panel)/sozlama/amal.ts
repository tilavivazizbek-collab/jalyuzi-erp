'use server';

/**
 * app/(panel)/sozlama/amal.ts — TZ 14.3 · QISM 1 §9.4
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { biznesXatosimi } from '@/lib/xato';
import { kutilmaganXatoniYoz } from '@/lib/xato-jurnal';
import { KORXONA_KALITLARI, sozlamalarniSaqla } from '@/lib/amal/sozlama';
import { kirimniQaytar, maydonlarniOqi } from '../forma-yordamchi';
import { xatoXabari } from '../xato-xabari';
import type { SozlamaHolati } from './holat';

export async function sozlamaAmali(
  oldingi: SozlamaHolati,
  forma: FormData,
): Promise<SozlamaHolati> {
  /** ⚠️ Chekdagi rekvizit — faqat sozlamani o'zgartira oladigan odam */
  const f = await ruxsatTalab('sozlama.ozgartir');

  const kiritilgan = maydonlarniOqi(forma, [...KORXONA_KALITLARI]);

  try {
    await sozlamalarniSaqla(ulanishOl(), kiritilgan, f.xodimId, f.filialId);
  } catch (x) {
    if (!biznesXatosimi(x)) await kutilmaganXatoniYoz(x, 'sozlama');
    return kirimniQaytar<SozlamaHolati>(
      {
        xato: await xatoXabari(x, 'sozlama/amal', "Sozlamani saqlab bo'lmadi"),
        saqlandi: false,
      },
      oldingi,
      kiritilgan,
    );
  }

  /**
   * ⚠️ Rekvizit chekda ko'rinadi — chek sahifasi ham yangilanadi.
   *    Aks holda egasi telefonni tuzatib, chekda eskisini ko'rardi.
   */
  revalidatePath('/sozlama');
  revalidatePath('/buyurtma', 'layout');

  return { xato: null, saqlandi: true };
}
