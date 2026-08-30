'use server';

/**
 * app/(panel)/mahsulot/amal.ts — TZ 4 · QISM 1 §9.4, §11
 *
 * Forma dinamik: slot, parametr va aksessuar qatorlari qo'shiladi va
 * o'chiriladi. Ular formaga JSON bo'lib keladi — indeksli maydon nomlari
 * (`slot.0.nom`) o'rniga bitta maydon, chunki qatorlar tartibi ham muhim.
 */

import { xatoXabari } from '../xato-xabari';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { mahsulotTuriTahrirla, mahsulotTuriYarat } from '@/lib/amal/konstruktor';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { mahsulotTurSxema } from '@/lib/sxema/konstruktor';
import type { KonstruktorHolati } from './holat';
import { rasmniOqi } from '@/lib/domain/rasm';

function xom(forma: FormData, nom: string): string {
  const q = forma.get(nom);
  return typeof q === 'string' ? q : '';
}

function formadanOqi(forma: FormData): unknown {
  const jsonOqi = (nom: string): unknown => {
    const matn = xom(forma, nom);
    if (matn === '') return [];
    try {
      return JSON.parse(matn);
    } catch {
      return [];
    }
  };

  return {
    nom: xom(forma, 'nom'),
    xizmatHaqi: xom(forma, 'xizmatHaqi'),
    tartib: xom(forma, 'tartib'),
    oynadaKorinadi: forma.get('oynadaKorinadi') !== null,
    botdaKorinadi: forma.get('botdaKorinadi') !== null,
    slotlar: jsonOqi('slotlar'),
    parametrlar: jsonOqi('parametrlar'),
    aksessuarlar: jsonOqi('aksessuarlar'),
  };
}

function sxemaXatolari(
  xatolar: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[],
): KonstruktorHolati {
  return {
    xato: 'Formada xato bor',
    nuqsonlar: xatolar.map((x) => {
      const joy = x.path.map((p) => String(p)).join('.');
      return joy === '' ? x.message : `${joy}: ${x.message}`;
    }),
  };
}

export async function mahsulotYaratAmali(
  _oldingi: KonstruktorHolati,
  forma: FormData,
): Promise<KonstruktorHolati> {
  const f = await ruxsatTalab('mahsulot.yarat');

  const tekshiruv = mahsulotTurSxema.safeParse(formadanOqi(forma));
  if (!tekshiruv.success) return sxemaXatolari(tekshiruv.error.issues);

  let natija;
  try {
    natija = await mahsulotTuriYarat(
      ulanishOl(),
      tekshiruv.data,
      f.xodimId,
      rasmniOqi(xom(forma, 'rasm')),
    );
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'mahsulot/amal', 'Saqlashda xato yuz berdi'),
      nuqsonlar: [],
    };
  }

  if (natija.holat === 'NUQSON') {
    return { xato: 'Saqlanmadi — quyidagilarni tuzating', nuqsonlar: natija.xabarlar };
  }

  revalidatePath('/mahsulot');
  redirect('/mahsulot');
}

export async function mahsulotTahrirlaAmali(
  turId: number,
  _oldingi: KonstruktorHolati,
  forma: FormData,
): Promise<KonstruktorHolati> {
  const f = await ruxsatTalab('mahsulot.ozgartir');

  const tekshiruv = mahsulotTurSxema.safeParse(formadanOqi(forma));
  if (!tekshiruv.success) return sxemaXatolari(tekshiruv.error.issues);

  let natija;
  try {
    natija = await mahsulotTuriTahrirla(
      ulanishOl(),
      turId,
      tekshiruv.data,
      f.xodimId,
      f.filialId,
      rasmniOqi(xom(forma, 'rasm')),
    );
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'mahsulot/amal', 'Saqlashda xato yuz berdi'),
      nuqsonlar: [],
    };
  }

  if (natija.holat === 'NUQSON') {
    return { xato: 'Saqlanmadi — quyidagilarni tuzating', nuqsonlar: natija.xabarlar };
  }

  revalidatePath('/mahsulot');
  redirect('/mahsulot');
}
