'use server';

/**
 * app/(panel)/kassa/yarat-amal.ts — TZ 12.2 · QISM 1 §9.4
 *
 * ⚠️ Ruxsat SHU YERDA tekshiriladi — interfeysda tugmani yashirish
 *    yetarli emas.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { kassaYarat } from '@/lib/amal/kassa';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { kassaYaratSxema } from '@/lib/sxema/kassa-yarat';
import { biznesXatosimi } from '@/lib/xato';
import { maydonlarniOqi } from '../forma-yordamchi';
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
  forma: FormData,
): Promise<KassaYaratHolati | { readonly saqlandi: YaratilganYozuv }> {
  const f = await ruxsatTalab('kassa.yarat');

  const tekshiruv = kassaYaratSxema.safeParse(maydonlarniOqi(forma, MAYDONLAR));
  if (!tekshiruv.success) return kassaXatolariniYig(tekshiruv.error.issues);

  let natija;
  try {
    natija = await kassaYarat(ulanishOl(), tekshiruv.data, f.xodimId);
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Saqlashda xato yuz berdi',
      maydonXatolari: {},
      yaratildi: null,
    };
  }

  revalidatePath('/kassa');
  return { saqlandi: natija };
}

/** O'z sahifasi — saqlangach kassa ro'yxatiga qaytadi. */
export async function kassaYaratAmali(
  _oldingi: KassaYaratHolati,
  forma: FormData,
): Promise<KassaYaratHolati> {
  const n = await yaratIchki(forma);
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
  _oldingi: KassaYaratHolati,
  forma: FormData,
): Promise<KassaYaratHolati> {
  const n = await yaratIchki(forma);
  if ('saqlandi' in n) {
    return { xato: null, maydonXatolari: {}, yaratildi: n.saqlandi };
  }
  return n;
}
