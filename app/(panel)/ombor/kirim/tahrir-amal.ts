'use server';

/**
 * app/(panel)/ombor/kirim/tahrir-amal.ts — TZ 9.11
 *
 * ⚠️ MANTIQ `lib/amal/kirim-tahrir.ts` da (§2.2).
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { kirimniTahrirla } from '@/lib/amal/kirim-tahrir';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { matnMaydon } from '../../forma-yordamchi';
import { xatoXabari } from '../../xato-xabari';
import type { KirimTahrirHolati } from './tahrir-holat';

const PUL = /^\d+(\.\d{1,2})?$/;

export async function kirimTahrirAmali(
  kirimId: number,
  _oldingi: KirimTahrirHolati,
  forma: FormData,
): Promise<KirimTahrirHolati> {
  const f = await ruxsatTalab('ombor.kirim.yarat');

  const transport = matnMaydon(forma, 'transport').trim() || '0';
  const bojxona = matnMaydon(forma, 'bojxona').trim() || '0';

  if (!PUL.test(transport) || !PUL.test(bojxona)) {
    return { xato: "Summa noto'g'ri — masalan 250000", xabar: null };
  }

  try {
    const n = await kirimniTahrirla(
      ulanishOl(),
      {
        kirimId,
        transportSumma: transport,
        bojxonaSumma: bojxona,
        izoh: matnMaydon(forma, 'izoh').trim() || null,
      },
      f.xodimId,
    );

    revalidatePath('/ombor');

    return {
      xato: null,
      xabar:
        `${n.raqam}: tannarx qayta hisoblandi. ` +
        `${String(n.yangilanganBolak)} ta bo'lak yangilandi` +
        (n.tegilmagan > 0
          ? `, ${String(n.tegilmagan)} tasiga tegilmadi — ular allaqachon ishlatilgan (2.3)`
          : ''),
    };
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'ombor/kirim/tahrir', "Tannarxni qayta hisoblab bo'lmadi"),
      xabar: null,
    };
  }
}
