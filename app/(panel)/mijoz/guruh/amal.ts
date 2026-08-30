'use server';

/**
 * app/(panel)/mijoz/guruh/amal.ts — TZ 6.3 · QISM 1 §9.4
 *
 * ⚠️ Yaratish mantig'i BITTA joyda (§2.2): sahifa ham, mijoz
 *    formasidagi modal ham shu funksiyani chaqiradi.
 */

import { xatoXabari } from '../../xato-xabari';
import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { mijozGuruhTahrirla, mijozGuruhYarat } from '@/lib/amal/mijoz-guruh';
import { mijozGuruhSxema } from '@/lib/sxema/mijoz-guruh';
import { kirimniQaytar, maydonlarniOqi } from '../../forma-yordamchi';
import { GURUH_MAYDONLARI, xatolarniYig, type GuruhFormaHolati } from './holat';

function yangila(): void {
  revalidatePath('/mijoz/guruh');
  /** ⚠️ Mijoz ro'yxatida guruh nomi ko'rinadi */
  revalidatePath('/mijoz');
}

export async function guruhYaratAmali(
  oldingi: GuruhFormaHolati,
  forma: FormData,
): Promise<GuruhFormaHolati> {
  const f = await ruxsatTalab('mijoz.ozgartir');
  const kirim = maydonlarniOqi(forma, GURUH_MAYDONLARI);

  const tekshiruv = mijozGuruhSxema.safeParse(kirim);
  if (!tekshiruv.success) {
    return kirimniQaytar(xatolarniYig(tekshiruv.error.issues), oldingi, kirim);
  }

  try {
    const y = await mijozGuruhYarat(ulanishOl(), tekshiruv.data, f.xodimId);
    yangila();
    return { xato: null, maydonXatolari: {}, yaratildi: y };
  } catch (x) {
    return kirimniQaytar<GuruhFormaHolati>(
      {
        xato: await xatoXabari(x, 'mijoz/guruh/amal', "Guruhni saqlab bo'lmadi"),
        maydonXatolari: {},
      },
      oldingi,
      kirim,
    );
  }
}

/**
 * Tahrirlash.
 *
 * ⚠️ `id` — birinchi parametr sifatida `bind` orqali beriladi:
 *    yashirin maydonda kelsa, uni brauzerdan o'zgartirib boshqa
 *    guruhni tahrirlash mumkin bo'lardi.
 */
export async function guruhTahrirlaAmali(
  guruhId: number,
  oldingi: GuruhFormaHolati,
  forma: FormData,
): Promise<GuruhFormaHolati> {
  const f = await ruxsatTalab('mijoz.ozgartir');
  const kirim = maydonlarniOqi(forma, GURUH_MAYDONLARI);

  const tekshiruv = mijozGuruhSxema.safeParse(kirim);
  if (!tekshiruv.success) {
    return kirimniQaytar(xatolarniYig(tekshiruv.error.issues), oldingi, kirim);
  }

  try {
    const y = await mijozGuruhTahrirla(ulanishOl(), guruhId, tekshiruv.data, f.xodimId);
    yangila();
    return { xato: null, maydonXatolari: {}, yaratildi: y };
  } catch (x) {
    return kirimniQaytar<GuruhFormaHolati>(
      {
        xato: await xatoXabari(x, 'mijoz/guruh/amal', "Guruhni saqlab bo'lmadi"),
        maydonXatolari: {},
      },
      oldingi,
      kirim,
    );
  }
}
