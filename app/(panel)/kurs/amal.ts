'use server';

/**
 * app/(panel)/kurs/amal.ts — TZ 14.5 · QISM 1 §9.4
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { kursniBelgila } from '@/lib/amal/kurs-belgila';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { biznesXatosimi } from '@/lib/xato';
import { kutilmaganXatoniYoz } from '@/lib/xato-jurnal';
import { matnMaydon } from '../forma-yordamchi';

export interface KursHolati {
  readonly xato: string | null;
  readonly saqlandi: boolean;
}

export const BOSH_KURS_HOLATI: KursHolati = { xato: null, saqlandi: false };

export async function kursAmali(
  _oldingi: KursHolati,
  forma: FormData,
): Promise<KursHolati> {
  /** ⚠️ Kurs pulga tegadi — faqat sozlamani o'zgartira oladigan odam */
  const f = await ruxsatTalab('sozlama.ozgartir');

  try {
    await kursniBelgila(ulanishOl(), matnMaydon(forma, 'qiymat'), f.xodimId);
  } catch (x) {
    if (!biznesXatosimi(x)) await kutilmaganXatoniYoz(x, 'kurs');
    return {
      xato: biznesXatosimi(x) ? x.message : "Kursni saqlab bo'lmadi",
      saqlandi: false,
    };
  }

  /**
   * ⚠️ Kurs KO'P joyda ko'rinadi — hammasi yangilanadi. Aks holda
   *    egasi kursni belgilab, mahsulot ekranida eskisini ko'rardi.
   */
  revalidatePath('/kurs');
  revalidatePath('/material');
  revalidatePath('/mahsulot');
  revalidatePath('/ombor/kirim');
  revalidatePath('/buyurtma/yangi');

  return { xato: null, saqlandi: true };
}
