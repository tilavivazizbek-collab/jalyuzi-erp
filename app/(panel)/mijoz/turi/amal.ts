'use server';

/**
 * app/(panel)/mijoz/turi/amal.ts — TZ 6.2 · 14.9 · QISM 1 §9.4
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { mijozTuriTahrirla, mijozTuriYarat } from '@/lib/amal/mijoz-turi';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { mijozTuriSxema } from '@/lib/sxema/mijoz-turi';
import { matnMaydon, maydonXatolari, FORMA_XATO_XABARI } from '../../forma-yordamchi';
import { xatoXabari } from '../../xato-xabari';
import type { TurHolati } from './holat';

const formadanOqi = (forma: FormData) => ({
  nom: matnMaydon(forma, 'nom'),
  soliqKerak: matnMaydon(forma, 'soliqKerak'),
  tartib: matnMaydon(forma, 'tartib'),
});

/**
 * ⚠️ Narx darajasi — pulga tegadi, shuning uchun `mijoz.ozgartir`
 *    ruxsati talab qilinadi (§9.4).
 */
export async function turYaratAmali(
  _oldingi: TurHolati,
  forma: FormData,
): Promise<TurHolati> {
  const f = await ruxsatTalab('mijoz.ozgartir');

  const tekshiruv = mijozTuriSxema.safeParse(formadanOqi(forma));
  if (!tekshiruv.success) {
    return {
      xato: FORMA_XATO_XABARI,
      maydonlar: maydonXatolari(tekshiruv.error.issues),
    };
  }

  let yaratildi: { id: number; nom: string };
  try {
    yaratildi = await mijozTuriYarat(ulanishOl(), tekshiruv.data, f.xodimId);
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'mijoz/turi/amal', "Turni saqlab bo'lmadi"),
      maydonlar: {},
    };
  }

  /** Tur qo'shilsa material formasida YANGI NARX MAYDONI paydo bo'ladi */
  revalidatePath('/mijoz/turi');
  revalidatePath('/mijoz');
  revalidatePath('/material');

  return { xato: null, maydonlar: {}, yaratildi };
}

export async function turTahrirlaAmali(
  turId: number,
  _oldingi: TurHolati,
  forma: FormData,
): Promise<TurHolati> {
  const f = await ruxsatTalab('mijoz.ozgartir');

  const tekshiruv = mijozTuriSxema.safeParse(formadanOqi(forma));
  if (!tekshiruv.success) {
    return {
      xato: FORMA_XATO_XABARI,
      maydonlar: maydonXatolari(tekshiruv.error.issues),
    };
  }

  try {
    await mijozTuriTahrirla(ulanishOl(), turId, tekshiruv.data, f.xodimId);
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'mijoz/turi/amal', "Turni saqlab bo'lmadi"),
      maydonlar: {},
    };
  }

  revalidatePath('/mijoz/turi');
  revalidatePath('/mijoz');
  revalidatePath('/material');
  return { xato: null, maydonlar: {} };
}
