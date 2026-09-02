'use server';

/**
 * app/(panel)/yetkazib/tolov-amal.ts — TZ 9 · 12.6
 *
 * Yetkazib beruvchiga alohida to'lov — kirimdan keyin.
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { yetkazibTolovi } from '@/lib/amal/yetkazib-tolov';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { matnMaydon } from '../forma-yordamchi';
import { xatoXabari } from '../xato-xabari';
import type { YetkazibTolovHolati } from './tolov-holat';

export async function yetkazibTolovAmali(
  yetkazibBeruvchiId: number,
  _oldingi: YetkazibTolovHolati,
  forma: FormData,
): Promise<YetkazibTolovHolati> {
  /** ⚠️ Kassadan pul chiqadi — kassa ruxsati kerak (§9.4) */
  const f = await ruxsatTalab('kassa.tolov');

  const summa = matnMaydon(forma, 'summa');
  const kassaId = Number(matnMaydon(forma, 'kassaId'));
  const valyuta = matnMaydon(forma, 'valyuta') === 'USD' ? 'USD' : 'SOM';
  const kurs = matnMaydon(forma, 'kurs');

  if (!Number.isSafeInteger(kassaId) || kassaId <= 0) {
    return { xato: 'Kassani tanlang', saqlandi: false };
  }

  try {
    await yetkazibTolovi(
      ulanishOl(),
      {
        yetkazibBeruvchiId,
        filialId: f.filialId,
        kassaId,
        summa,
        valyuta,
        /** 9.6 — dollarli to'lovda kurs QOTADI */
        kursSnapshot: valyuta === 'USD' && kurs !== '' ? kurs : null,
        izoh: matnMaydon(forma, 'izoh') === '' ? null : matnMaydon(forma, 'izoh'),
        kirimId: null,
      },
      f.xodimId,
    );
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'yetkazib/tolov-amal', "To'lovni yozib bo'lmadi"),
      saqlandi: false,
    };
  }

  revalidatePath(`/yetkazib/${String(yetkazibBeruvchiId)}`);
  revalidatePath('/kassa');
  return { xato: null, saqlandi: true };
}
