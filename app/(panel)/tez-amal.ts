'use server';

/**
 * app/(panel)/tez-amal.ts — «shu yerda yangi qo'shish» server amallari.
 *
 * ⚠️ Bu fayl FAQAT ruxsat tekshiradi va natijani formaga tushunarli
 *    ko'rinishda qaytaradi. Mantiq `lib/amal/tez-qosh.ts` da (§5.1).
 *
 * ⚠️ Ruxsat SHU YERDA tekshiriladi (§9.4). Brauzerdagi tugmaning
 *    yashirilgani himoya emas — server amali to'g'ridan-to'g'ri
 *    chaqirilishi mumkin.
 */

import { revalidatePath } from 'next/cache';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { guruhTezYarat, mijozTezYarat, yetkazibTezYarat } from '@/lib/amal/tez-qosh';
import { biznesXatosimi } from '@/lib/xato';

export type TezNatija = { id: number; nom: string } | { xato: string };

async function bajar(
  ish: () => Promise<{ id: number; nom: string }>,
  yol: string,
  zaxiraXato: string,
): Promise<TezNatija> {
  try {
    const n = await ish();
    revalidatePath(yol);
    return n;
  } catch (x) {
    return { xato: biznesXatosimi(x) ? x.message : zaxiraXato };
  }
}

export async function guruhTezQosh(nom: string): Promise<TezNatija> {
  const f = await ruxsatTalab('material.ozgartir');
  return bajar(() => guruhTezYarat(nom, f.xodimId), '/material', "Guruh qo'shilmadi");
}

export async function yetkazibTezQosh(nom: string): Promise<TezNatija> {
  const f = await ruxsatTalab('yetkazib.yarat');
  return bajar(() => yetkazibTezYarat(nom, f.xodimId), '/yetkazib', "Qo'shilmadi");
}

export async function mijozTezQosh(nom: string): Promise<TezNatija> {
  const f = await ruxsatTalab('mijoz.yarat');
  return bajar(() => mijozTezYarat(nom, f.xodimId), '/mijoz', "Qo'shilmadi");
}
