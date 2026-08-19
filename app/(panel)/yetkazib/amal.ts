'use server';

/** app/(panel)/yetkazib/amal.ts — TZ 9 · QISM 1 §9.4, §11 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { yetkazibTahrirla, yetkazibYarat } from '@/lib/amal/yetkazib';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { yetkazibSxema } from '@/lib/sxema/yetkazib';
import { biznesXatosimi } from '@/lib/xato';
import { maydonlarniOqi } from '../forma-yordamchi';
import { xatolarniYig, type FormaHolati } from './holat';

const MAYDONLAR = [
  'nom',
  'nimaYetkazadi',
  'kontaktShaxs',
  'telefon',
  'qoshimchaTelefon',
  'manzil',
  'bankNomi',
  'hisobRaqam',
  'inn',
  'mfo',
  'tolovMuddatiKun',
  'valyuta',
  'eslatma',
];

const formadanOqi = (forma: FormData): Record<string, string> =>
  maydonlarniOqi(forma, MAYDONLAR);

export async function yetkazibYaratAmali(
  _oldingi: FormaHolati,
  forma: FormData,
): Promise<FormaHolati> {
  const f = await ruxsatTalab('yetkazib.yarat');

  const tekshiruv = yetkazibSxema.safeParse(formadanOqi(forma));
  if (!tekshiruv.success) return xatolarniYig(tekshiruv.error.issues);

  try {
    await yetkazibYarat(ulanishOl(), tekshiruv.data, f.xodimId);
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Saqlashda xato yuz berdi',
      maydonXatolari: {},
    };
  }

  revalidatePath('/yetkazib');
  redirect('/yetkazib');
}

export async function yetkazibTahrirlaAmali(
  yetkazibId: number,
  _oldingi: FormaHolati,
  forma: FormData,
): Promise<FormaHolati> {
  const f = await ruxsatTalab('yetkazib.ozgartir');

  const tekshiruv = yetkazibSxema.safeParse(formadanOqi(forma));
  if (!tekshiruv.success) return xatolarniYig(tekshiruv.error.issues);

  try {
    await yetkazibTahrirla(ulanishOl(), yetkazibId, tekshiruv.data, f.xodimId);
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Saqlashda xato yuz berdi',
      maydonXatolari: {},
    };
  }

  revalidatePath('/yetkazib');
  redirect('/yetkazib');
}
