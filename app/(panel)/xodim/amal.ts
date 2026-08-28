'use server';

/**
 * app/(panel)/xodim/amal.ts — TZ 10.2 · QISM 1 §9.4
 *
 * ⚠️ Parol HECH QAYERGA logga tushmaydi va holatga qaytarilmaydi
 *    (§8). Shuning uchun xato bo'lganda qaytariladigan qiymatlar
 *    ichidan u OLIB TASHLANADI.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { xodimTahrirla, xodimYarat } from '@/lib/amal/xodim';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { xodimSxema } from '@/lib/sxema/xodim';
import { biznesXatosimi } from '@/lib/xato';
import { kirimniQaytar, maydonlarniOqi } from '../forma-yordamchi';
import { xodimXatolariniYig, type XodimHolati } from './holat';

const MAYDONLAR = ['ism', 'telefon', 'filialId', 'rolIdlar', 'parol', 'ishgaKirdi'];

/**
 * ⚠️ Parol qaytarilmaydi. Forma uni qayta ko'rsatmasligi kerak —
 *    ekranda ochiq parol turishi xavfli.
 */
function parolsiz(kirim: Record<string, string>): Record<string, string> {
  const qolgani: Record<string, string> = {};
  for (const [k, v] of Object.entries(kirim)) {
    if (k !== 'parol') qolgani[k] = v;
  }
  return qolgani;
}

export async function xodimYaratAmali(
  oldingi: XodimHolati,
  forma: FormData,
): Promise<XodimHolati> {
  const f = await ruxsatTalab('xodim.yarat');

  const kirim = maydonlarniOqi(forma, MAYDONLAR);

  const tekshiruv = xodimSxema.safeParse(kirim);
  if (!tekshiruv.success) {
    return kirimniQaytar(
      xodimXatolariniYig(tekshiruv.error.issues),
      oldingi,
      parolsiz(kirim),
    );
  }

  try {
    await xodimYarat(ulanishOl(), tekshiruv.data, f.xodimId);
  } catch (x) {
    return kirimniQaytar<XodimHolati>(
      {
        xato: biznesXatosimi(x) ? x.message : 'Saqlashda xato yuz berdi',
        maydonXatolari: {},
      },
      oldingi,
      parolsiz(kirim),
    );
  }

  revalidatePath('/xodim');
  redirect('/xodim');
}

export async function xodimTahrirlaAmali(
  xodimId: number,
  oldingi: XodimHolati,
  forma: FormData,
): Promise<XodimHolati> {
  const f = await ruxsatTalab('xodim.ozgartir');

  const kirim = maydonlarniOqi(forma, MAYDONLAR);

  const tekshiruv = xodimSxema.safeParse(kirim);
  if (!tekshiruv.success) {
    return kirimniQaytar(
      xodimXatolariniYig(tekshiruv.error.issues),
      oldingi,
      parolsiz(kirim),
    );
  }

  try {
    await xodimTahrirla(ulanishOl(), xodimId, tekshiruv.data, f.xodimId);
  } catch (x) {
    return kirimniQaytar<XodimHolati>(
      {
        xato: biznesXatosimi(x) ? x.message : 'Saqlashda xato yuz berdi',
        maydonXatolari: {},
      },
      oldingi,
      parolsiz(kirim),
    );
  }

  revalidatePath('/xodim');
  redirect('/xodim');
}
