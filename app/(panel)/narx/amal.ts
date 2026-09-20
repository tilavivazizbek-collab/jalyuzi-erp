'use server';

/**
 * app/(panel)/narx/amal.ts — «Narxlar va turlar» · TZ 3.8 · QISM 1 §9.4
 *
 * Narx jadvali dinamik: bosqich va qo'shimcha qatorlari qo'shiladi va
 * o'chiriladi. Ular formaga JSON bo'lib keladi — `mahsulot/amal.ts`
 * dagi kabi, chunki qatorlar tartibi ham muhim.
 */

import { revalidatePath } from 'next/cache';
import { xatoXabari } from '../xato-xabari';
import { ulanishOl } from '@/lib/db';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { narxGuruhTezYarat, turNarxiniSaqla } from '@/lib/amal/narx-qoida';
import { turNarxiSxema } from '@/lib/sxema/narx-qoida';
import type { GuruhHolati } from '../guruh-holat';
import type { NarxHolati } from './holat';

function xom(forma: FormData, nom: string): string {
  const q = forma.get(nom);
  return typeof q === 'string' ? q : '';
}

function jsonOqi(forma: FormData, nom: string): unknown {
  const matn = xom(forma, nom);
  if (matn === '') return [];
  try {
    return JSON.parse(matn);
  } catch {
    return [];
  }
}

/** Tanlangan turning butun narx sozlamasini saqlaydi. */
export async function narxSaqlaAmali(
  _oldingi: NarxHolati,
  forma: FormData,
): Promise<NarxHolati> {
  const f = await ruxsatTalab('narx.standart.ozgartir');

  const tekshiruv = turNarxiSxema.safeParse({
    mahsulotTurId: Number(xom(forma, 'mahsulotTurId')),
    qoidalar: jsonOqi(forma, 'qoidalar'),
    qoshimchalar: jsonOqi(forma, 'qoshimchalar'),
  });

  if (!tekshiruv.success) {
    return {
      xato: 'Formada xato bor',
      saqlandi: false,
      nuqsonlar: tekshiruv.error.issues.map((x) => {
        const joy = x.path.map((p) => String(p)).join('.');
        return joy === '' ? x.message : `${joy}: ${x.message}`;
      }),
    };
  }

  try {
    const natija = await ulanishOl().begin(async (tx) =>
      turNarxiniSaqla(tx, tekshiruv.data, f.xodimId),
    );

    if (natija.holat === 'NUQSON') {
      return {
        xato: 'Saqlanmadi — quyidagilarni tuzating',
        nuqsonlar: natija.xabarlar,
        saqlandi: false,
      };
    }
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'narx/amal', 'Saqlashda xato yuz berdi'),
      nuqsonlar: [],
      saqlandi: false,
    };
  }

  revalidatePath('/narx');
  revalidatePath('/sotuv');
  return { xato: null, nuqsonlar: [], saqlandi: true };
}

/**
 * Yangi mato darajasi — dropdown yonidagi «+» dan.
 *
 * ⚠️ QAMROV §1 talabi: har dropdownda qo'shish bo'lsin. Egasi buni
 *    2026-08-28 da uch marta aytishga majbur bo'lgan.
 */
export async function narxGuruhYaratAmali(
  _oldingi: GuruhHolati,
  forma: FormData,
): Promise<GuruhHolati> {
  const f = await ruxsatTalab('narx.standart.ozgartir');

  const nom = forma.get('nom');
  if (typeof nom !== 'string') return { xato: 'Nom kiritilmagan', yaratildi: null };

  try {
    const y = await narxGuruhTezYarat(ulanishOl(), nom, f.xodimId);
    revalidatePath('/narx');
    revalidatePath('/material');
    return { xato: null, yaratildi: { id: y.id, nom: y.nom } };
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'narx/amal', "Daraja qo'shilmadi"),
      yaratildi: null,
    };
  }
}
