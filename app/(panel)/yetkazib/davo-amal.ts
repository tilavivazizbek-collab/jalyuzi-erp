'use server';

/**
 * app/(panel)/yetkazib/davo-amal.ts — TZ 9.9
 *
 * ⚠️ MANTIQ TAKRORLANMAYDI (§2.2): ish `lib/amal/davo.ts` da.
 *
 * ⚠️ Ruxsat SHU YERDA tekshiriladi (§9.4). Da'vo qarzga yoki
 *    xarajatga tegadi, shuning uchun kirim ruxsati talab qilinadi.
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { davoniHalQil, type DavoQarori } from '@/lib/amal/davo';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { matnMaydon } from '../forma-yordamchi';
import { xatoXabari } from '../xato-xabari';
import type { DavoHolati } from './davo-holat';

export async function davoAmali(
  kirimQatorId: number,
  _oldingi: DavoHolati,
  forma: FormData,
): Promise<DavoHolati> {
  const f = await ruxsatTalab('ombor.kirim.yarat');

  const xom = matnMaydon(forma, 'qaror');
  if (xom !== 'QABUL' && xom !== 'OZIMIZGA') {
    return { xato: 'Qaror tanlanmagan', bajarildi: false, xabar: null };
  }
  const qaror: DavoQarori = xom;

  try {
    const n = await davoniHalQil(
      ulanishOl(),
      { kirimQatorId, qaror, izoh: matnMaydon(forma, 'izoh').trim() || null },
      f.xodimId,
    );

    revalidatePath('/yetkazib');
    revalidatePath('/ombor/kirim');

    return {
      xato: null,
      bajarildi: true,
      xabar:
        n.qaror === 'QABUL'
          ? `Qarzdan ${n.summa} ${n.valyuta === 'USD' ? '$' : "so'm"} chegirildi`
          : `Zarar o'zimizga olindi: ${n.summa} so'm xarajatga tushdi`,
    };
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'yetkazib/davo-amal', "Da'voni hal qilib bo'lmadi"),
      bajarildi: false,
      xabar: null,
    };
  }
}
