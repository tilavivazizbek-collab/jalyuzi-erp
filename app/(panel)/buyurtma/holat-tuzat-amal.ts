'use server';

/**
 * app/(panel)/buyurtma/holat-tuzat-amal.ts — TZ 8.3 · 2.4
 *
 * Pozitsiya holatini qo'lda to'g'rilash.
 *
 * ⚠️ MANTIQ TAKRORLANMAYDI (§2.2): bu yerda faqat forma o'qiladi,
 *    ish esa `lib/amal/holat-tuzat.ts` da.
 *
 * ⚠️ Ruxsat SHU YERDA tekshiriladi (§9.4): server amali
 *    to'g'ridan-to'g'ri chaqirilishi mumkin.
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { pozitsiyaHolatiniTuzat } from '@/lib/amal/holat-tuzat';
import { HOLAT_NOMI, type PozitsiyaHolati } from '@/lib/domain/buyurtma';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { matnMaydon } from '../forma-yordamchi';
import { xatoXabari } from '../xato-xabari';
import { BOSH_HOLAT_TUZATISH, type HolatTuzatishHolati } from './holat-tuzat-holat';

export async function holatTuzatishAmali(
  pozitsiyaId: number,
  _oldingi: HolatTuzatishHolati,
  forma: FormData,
): Promise<HolatTuzatishHolati> {
  const f = await ruxsatTalab('buyurtma.holat.tuzat');

  const yangiHolat = matnMaydon(forma, 'yangiHolat');
  const sabab = matnMaydon(forma, 'sabab');

  if (yangiHolat === '') {
    return { ...BOSH_HOLAT_TUZATISH, xato: 'Yangi holat tanlanmagan' };
  }
  if (sabab === '') {
    return {
      ...BOSH_HOLAT_TUZATISH,
      xato: 'Sabab yozilishi shart — keyin izlab topiladi (2.4)',
    };
  }

  try {
    const n = await pozitsiyaHolatiniTuzat(
      ulanishOl(),
      { pozitsiyaId, yangiHolat, sabab },
      f.xodimId,
    );

    const nomi = (h: string): string => HOLAT_NOMI[h as PozitsiyaHolati] ?? h;

    const qismlar = [
      `${n.buyurtmaRaqam} · ${String(n.tartib)}-pozitsiya: ` +
        `${nomi(n.eskiHolat)} → ${nomi(n.yangiHolat)}`,
    ];
    if (n.boshatilganBand > 0) {
      qismlar.push(`${String(n.boshatilganBand)} bo'lak omborga qaytdi`);
    }

    revalidatePath('/buyurtma');
    revalidatePath(`/buyurtma/${String(pozitsiyaId)}`);

    return { xato: null, bajarildi: true, xulosa: `${qismlar.join(' · ')}.` };
  } catch (x) {
    return {
      ...BOSH_HOLAT_TUZATISH,
      xato: await xatoXabari(x, 'buyurtma/holat-tuzat-amal', "Holat o'zgartirilmadi"),
    };
  }
}
