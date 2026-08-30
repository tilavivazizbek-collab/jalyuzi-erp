'use server';

/**
 * app/(panel)/kassa/yarat-amal.ts — TZ 12.2 · QISM 1 §9.4
 *
 * ⚠️ Ruxsat SHU YERDA tekshiriladi — interfeysda tugmani yashirish
 *    yetarli emas.
 */

import { xatoXabari } from '../xato-xabari';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { kassaYarat } from '@/lib/amal/kassa';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { kassaYaratSxema } from '@/lib/sxema/kassa-yarat';
import { kirimniQaytar, maydonlarniOqi } from '../forma-yordamchi';
import { kassaXatolariniYig, type KassaYaratHolati } from './yarat-holat';
import type { YaratilganYozuv } from '../modal-holat';

const MAYDONLAR = [
  'nom',
  'filialId',
  'xodimId',
  'turi',
  'valyuta',
  'boshlangichQoldiq',
];

/** ⚠️ Yaratish mantig'i BITTA joyda (§2.2) — sahifa ham, modal ham shuni chaqiradi. */
async function yaratIchki(
  oldingi: KassaYaratHolati,
  forma: FormData,
): Promise<KassaYaratHolati | { readonly saqlandi: YaratilganYozuv }> {
  const f = await ruxsatTalab('kassa.yarat');

  /** ⚠️ React 19 formani o'zi tozalaydi — xom qiymatlar saqlanadi */
  const kirim = maydonlarniOqi(forma, MAYDONLAR);

  const tekshiruv = kassaYaratSxema.safeParse(kirim);
  if (!tekshiruv.success) {
    return kirimniQaytar(kassaXatolariniYig(tekshiruv.error.issues), oldingi, kirim);
  }

  let natija;
  try {
    natija = await kassaYarat(ulanishOl(), tekshiruv.data, f.xodimId);
  } catch (x) {
    return kirimniQaytar<KassaYaratHolati>(
      {
        xato: await xatoXabari(x, 'kassa/yarat-amal', 'Saqlashda xato yuz berdi'),
        maydonXatolari: {},
        yaratildi: null,
      },
      oldingi,
      kirim,
    );
  }

  revalidatePath('/kassa');
  return { saqlandi: natija };
}

/** O'z sahifasi — saqlangach kassa ro'yxatiga qaytadi. */
export async function kassaYaratAmali(
  oldingi: KassaYaratHolati,
  forma: FormData,
): Promise<KassaYaratHolati> {
  const n = await yaratIchki(oldingi, forma);
  if ('saqlandi' in n) redirect('/kassa');
  return n;
}

/**
 * Modal oyna — yo'naltirmaydi.
 *
 * ⚠️ `redirect()` modalda chaqirilsa butun sahifa almashib ketardi
 *    va yarim yozilgan to'lov yo'qolardi.
 */
export async function kassaModalYaratAmali(
  oldingi: KassaYaratHolati,
  forma: FormData,
): Promise<KassaYaratHolati> {
  const n = await yaratIchki(oldingi, forma);
  if ('saqlandi' in n) {
    return { xato: null, maydonXatolari: {}, yaratildi: n.saqlandi };
  }
  return n;
}
