'use server';

/**
 * app/(panel)/stavka/amal.ts — TZ 10.8 · 10.9 · QISM 1 §9.4
 *
 * ⚠️ Ruxsat SERVERDA tekshiriladi. Stavka to'g'ridan-to'g'ri
 *    ustaning cho'ntagiga tegadi — tugmani yashirish himoya emas.
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { stavkaniBelgila, stavkaniOchir } from '@/lib/amal/stavka-belgila';
import { stavkaSxema, STAVKA_MAYDONLARI } from '@/lib/sxema/stavka';
import { biznesXatosimi } from '@/lib/xato';
import { kutilmaganXatoniYoz } from '@/lib/xato-jurnal';
import {
  formaXatoXabari,
  kirimniQaytar,
  maydonlarniOqi,
  maydonXatolari,
} from '../forma-yordamchi';
import { xatoXabari } from '../xato-xabari';
import { BOSH_STAVKA_HOLATI, type StavkaHolati } from './holat';

export async function stavkaAmali(
  oldingi: StavkaHolati,
  forma: FormData,
): Promise<StavkaHolati> {
  const f = await ruxsatTalab('sozlama.ozgartir');

  const xom = maydonlarniOqi(forma, STAVKA_MAYDONLARI);
  const natija = stavkaSxema.safeParse(xom);

  if (!natija.success) {
    const maydonlar = maydonXatolari(natija.error.issues);
    return kirimniQaytar(
      { ...BOSH_STAVKA_HOLATI, xato: formaXatoXabari(maydonlar), maydonlar },
      oldingi,
      xom,
    );
  }

  const v = natija.data;

  try {
    await stavkaniBelgila(
      ulanishOl(),
      {
        mahsulotTurId: v.mahsulotTurId,
        filialId: v.filialId,
        xodimId: v.xodimId,
        birlik: v.birlik,
        qiymat: v.qiymat,
        bosqichlar: v.bosqichlar,
        amalQiladiDan: v.amalQiladiDan,
      },
      f.xodimId,
    );
  } catch (x) {
    if (!biznesXatosimi(x)) await kutilmaganXatoniYoz(x, 'stavka');
    return kirimniQaytar(
      {
        ...BOSH_STAVKA_HOLATI,
        xato: await xatoXabari(x, 'stavka/amal', "Stavkani saqlab bo'lmadi"),
      },
      oldingi,
      xom,
    );
  }

  revalidatePath('/stavka');
  return { ...BOSH_STAVKA_HOLATI, saqlandi: true };
}

/**
 * Stavka guruhini kuchdan qoldiradi.
 *
 * ⚠️ Hisoblangan haqqa TEGMAYDI (2.3) — faqat bundan keyingi
 *    ishlarga qo'llanmaydi.
 */
export async function stavkaniOchirAmali(kirim: {
  mahsulotTurId: number;
  filialId: number | null;
  xodimId: number | null;
  amalQiladiDan: string;
}): Promise<{ xato: string | null }> {
  const f = await ruxsatTalab('sozlama.ozgartir');

  try {
    await stavkaniOchir(ulanishOl(), kirim, f.xodimId);
  } catch (x) {
    if (!biznesXatosimi(x)) await kutilmaganXatoniYoz(x, 'stavka');
    return { xato: await xatoXabari(x, 'stavka/ochir', "Stavkani o'chirib bo'lmadi") };
  }

  revalidatePath('/stavka');
  return { xato: null };
}
