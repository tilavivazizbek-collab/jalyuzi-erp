'use server';

/**
 * app/(panel)/material/amal.ts — TZ 5 · QISM 1 §9.4, §11
 *
 * Har amal SERVER tomonda ruxsat tekshiradi (§9.4) — interfeysda tugmani
 * yashirish yetarli emas.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { materialTahrirla, materialYarat } from '@/lib/amal/material';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { materialSxema } from '@/lib/sxema/material';
import { biznesXatosimi } from '@/lib/xato';
import { maydonlarniOqi } from '../forma-yordamchi';
import { xatolarniYig, type FormaHolati } from './holat';
import { MATERIAL_MAYDONLARI } from './maydonlar';

const MAYDONLAR = MATERIAL_MAYDONLARI;

const formadanOqi = (forma: FormData): Record<string, string> =>
  maydonlarniOqi(forma, MAYDONLAR);

export async function materialYaratAmali(
  _oldingi: FormaHolati,
  forma: FormData,
): Promise<FormaHolati> {
  const f = await ruxsatTalab('material.yarat');

  const tekshiruv = materialSxema.safeParse(formadanOqi(forma));
  if (!tekshiruv.success) {
    return xatolarniYig(tekshiruv.error.issues);
  }

  try {
    await materialYarat(ulanishOl(), tekshiruv.data, f.xodimId);
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Saqlashda xato yuz berdi',
      maydonXatolari: {},
    };
  }

  revalidatePath('/material');
  redirect('/material');
}

export async function materialTahrirlaAmali(
  materialId: number,
  _oldingi: FormaHolati,
  forma: FormData,
): Promise<FormaHolati> {
  const f = await ruxsatTalab('material.ozgartir');

  const tekshiruv = materialSxema.safeParse(formadanOqi(forma));
  if (!tekshiruv.success) {
    return xatolarniYig(tekshiruv.error.issues);
  }

  let natija;
  try {
    natija = await materialTahrirla(
      ulanishOl(),
      materialId,
      tekshiruv.data,
      f.xodimId,
      f.filialId,
    );
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Saqlashda xato yuz berdi',
      maydonXatolari: {},
    };
  }

  // TZ 5.3 — qoldiq bor ekan birlik o'zgartirilmaydi, sabab ko'rsatiladi
  if (natija.holat === 'BIRLIK_OZGARMAYDI') {
    return {
      xato:
        `Omborda ${String(natija.qoldiq)} ta bo'lak bor — hisob turi va birliklarni ` +
        "o'zgartirib bo'lmaydi. Qoldiq boshqa birlikda yozilgan va raqam ma'nosini yo'qotadi.",
      maydonXatolari: {},
    };
  }

  revalidatePath('/material');
  redirect('/material');
}
