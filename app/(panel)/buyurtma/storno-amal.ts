'use server';

/**
 * app/(panel)/buyurtma/storno-amal.ts — TZ 8.8
 *
 * Buyurtma STORNOSI — sotuvchining xato yozuvini bekor qilish.
 *
 * ⚠️ BEKOR QILISH BILAN ARALASHTIRILMAYDI. Bekor — real biznes
 *    holati (mijoz fikridan qaytdi), storno — xato: buyurtma umuman
 *    bo'lmagan. Shuning uchun ruxsat ham alohida va FAQAT ADMINDA.
 *
 * ⚠️ MANTIQ TAKRORLANMAYDI (§2.2): bu yerda faqat forma o'qiladi,
 *    ish esa `lib/amal/storno.ts` da.
 *
 * ⚠️ Ruxsat SHU YERDA tekshiriladi (§9.4): server amali
 *    to'g'ridan-to'g'ri chaqirilishi mumkin.
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { buyurtmaniStorno } from '@/lib/amal/storno';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { pulKorsat, som } from '@/lib/domain/pul';
import { matnMaydon } from '../forma-yordamchi';
import { xatoXabari } from '../xato-xabari';
import { BOSH_STORNO, type StornoHolati } from './storno-holat';

export async function stornoAmali(
  buyurtmaId: number,
  _oldingi: StornoHolati,
  forma: FormData,
): Promise<StornoHolati> {
  const f = await ruxsatTalab('buyurtma.storno');

  const sabab = matnMaydon(forma, 'sabab');
  if (sabab === '') {
    return { ...BOSH_STORNO, xato: 'Sabab yozilishi shart — keyin izlab topiladi (2.4)' };
  }

  try {
    const n = await buyurtmaniStorno(ulanishOl(), buyurtmaId, sabab, f.xodimId);

    const qismlar = [`${n.buyurtmaRaqam} storno qilindi`];
    qismlar.push(`${String(n.bekorQilinganPozitsiya)} pozitsiya bekor bo'ldi`);
    if (n.boshatilganBand > 0) {
      qismlar.push(`${String(n.boshatilganBand)} bo'lak omborga qaytdi`);
    }
    if (n.qarzdanQaytdi !== '0.00') {
      qismlar.push(`mijoz qarzidan ${pulKorsat(som(n.qarzdanQaytdi))} so'm ayirildi`);
    }

    revalidatePath(`/buyurtma/${String(buyurtmaId)}`);
    revalidatePath('/buyurtma');

    return { xato: null, bajarildi: true, xulosa: `${qismlar.join(' · ')}.` };
  } catch (x) {
    return {
      ...BOSH_STORNO,
      xato: await xatoXabari(x, 'buyurtma/storno-amal', 'Storno qilinmadi'),
    };
  }
}
