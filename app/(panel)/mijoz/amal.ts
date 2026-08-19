'use server';

/**
 * app/(panel)/mijoz/amal.ts — TZ 6 · QISM 1 §9.4, §11
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { mijozTahrirla, mijozYarat } from '@/lib/amal/mijoz';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { mijozSxema } from '@/lib/sxema/mijoz';
import { telefonKorsat } from '@/lib/domain/telefon';
import { biznesXatosimi } from '@/lib/xato';
import { matnMaydon, xatolarniYig, type MijozHolati } from './holat';

const MAYDONLAR = [
  'ism',
  'telefon',
  'manzil',
  'eslatma',
  'offsetTuri',
  'offsetQiymat',
  'qarzLimiti',
  'shaxsTuri',
  'tashkilotNomi',
  'inn',
  'yuridikManzil',
  'bankNomi',
  'hisobRaqam',
  'mfo',
  'shartnomaRaqam',
  'ndsStavka',
];

function formadanOqi(forma: FormData): Record<string, string> {
  const natija: Record<string, string> = {};
  for (const m of MAYDONLAR) natija[m] = matnMaydon(forma, m);
  return natija;
}

export async function mijozYaratAmali(
  _oldingi: MijozHolati,
  forma: FormData,
): Promise<MijozHolati> {
  const f = await ruxsatTalab('mijoz.yarat');

  const tekshiruv = mijozSxema.safeParse(formadanOqi(forma));
  if (!tekshiruv.success) return xatolarniYig(tekshiruv.error.issues);

  let natija;
  try {
    natija = await mijozYarat(ulanishOl(), tekshiruv.data, f.xodimId);
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Saqlashda xato yuz berdi',
      maydonXatolari: {},
      dublikat: null,
    };
  }

  if (natija.holat === 'DUBLIKAT') {
    const m = natija.dublikat.mavjud;
    return {
      xato: null,
      maydonXatolari: {},
      dublikat:
        m === null
          ? null
          : {
              id: m.id,
              ism: m.ism,
              telefon: m.telefon === '' ? '—' : telefonKorsat(m.telefon),
              sabab: natija.dublikat.sabab ?? 'ISM',
            },
    };
  }

  revalidatePath('/mijoz');
  redirect('/mijoz');
}

export async function mijozTahrirlaAmali(
  mijozId: number,
  _oldingi: MijozHolati,
  forma: FormData,
): Promise<MijozHolati> {
  const f = await ruxsatTalab('mijoz.ozgartir');

  const tekshiruv = mijozSxema.safeParse(formadanOqi(forma));
  if (!tekshiruv.success) return xatolarniYig(tekshiruv.error.issues);

  let natija;
  try {
    natija = await mijozTahrirla(ulanishOl(), mijozId, tekshiruv.data, f.xodimId);
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Saqlashda xato yuz berdi',
      maydonXatolari: {},
      dublikat: null,
    };
  }

  if (natija.holat === 'DUBLIKAT') {
    const m = natija.dublikat.mavjud;
    return {
      xato: null,
      maydonXatolari: {},
      dublikat:
        m === null
          ? null
          : {
              id: m.id,
              ism: m.ism,
              telefon: m.telefon === '' ? '—' : telefonKorsat(m.telefon),
              sabab: natija.dublikat.sabab ?? 'ISM',
            },
    };
  }

  revalidatePath('/mijoz');
  redirect('/mijoz');
}
