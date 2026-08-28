'use server';

/**
 * app/(panel)/tez-amal.ts — modal oynadan guruh qo'shish.
 *
 * ⚠️ Ilgari bu yerda to'rtta «tez qo'shish» amali bor edi: ular
 *    ro'yxat ostidagi tor qatorchadan faqat NOMNI olib yozuv
 *    yaratardi. Endi hamma joyda modal oyna va TO'LIQ kartochka
 *    ishlaydi, shuning uchun ular o'chirildi — ishlatilmaydigan
 *    server amali baribir tashqaridan chaqirilishi mumkin edi.
 *
 *    Guruh qoldi, chunki unda bitta maydon bor va uning alohida
 *    sahifasi yo'q.
 *
 * ⚠️ Ruxsat SHU YERDA tekshiriladi (§9.4).
 */

import { revalidatePath } from 'next/cache';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { guruhTezYarat } from '@/lib/amal/tez-qosh';
import { biznesXatosimi } from '@/lib/xato';
import type { GuruhHolati } from './guruh-holat';

export async function guruhModalYaratAmali(
  _oldingi: GuruhHolati,
  forma: FormData,
): Promise<GuruhHolati> {
  const f = await ruxsatTalab('material.ozgartir');

  const nom = forma.get('nom');
  if (typeof nom !== 'string') return { xato: 'Nom kiritilmagan', yaratildi: null };

  try {
    const y = await guruhTezYarat(nom, f.xodimId);
    revalidatePath('/material');
    return { xato: null, yaratildi: { id: y.id, nom: y.nom } };
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : "Guruh qo'shilmadi",
      yaratildi: null,
    };
  }
}
