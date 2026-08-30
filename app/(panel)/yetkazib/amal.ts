'use server';

/** app/(panel)/yetkazib/amal.ts — TZ 9 · QISM 1 §9.4, §11 */

import { xatoXabari } from '../xato-xabari';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { yetkazibTahrirla, yetkazibYarat } from '@/lib/amal/yetkazib';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { yetkazibSxema } from '@/lib/sxema/yetkazib';
import { kirimniQaytar, maydonlarniOqi } from '../forma-yordamchi';
import { xatolarniYig, type FormaHolati } from './holat';
import type { YaratilganYozuv } from '../modal-holat';

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

/**
 * ⚠️ Yaratish mantig'i BITTA joyda (§2.2) — sahifa ham, modal ham
 *    shuni chaqiradi. Nusxa ko'chirilsa tekshiruvlardan biri
 *    unutilib qolardi.
 */
async function yaratIchki(
  oldingi: FormaHolati,
  forma: FormData,
): Promise<FormaHolati | { readonly saqlandi: YaratilganYozuv }> {
  const f = await ruxsatTalab('yetkazib.yarat');

  /** ⚠️ React 19 formani o'zi tozalaydi — xom qiymatlar saqlanadi */
  const kirim = formadanOqi(forma);

  const tekshiruv = yetkazibSxema.safeParse(kirim);
  if (!tekshiruv.success) {
    return kirimniQaytar(xatolarniYig(tekshiruv.error.issues), oldingi, kirim);
  }

  let id: number;
  try {
    id = await yetkazibYarat(ulanishOl(), tekshiruv.data, f.xodimId);
  } catch (x) {
    return kirimniQaytar<FormaHolati>(
      {
        xato: await xatoXabari(x, 'yetkazib/amal', 'Saqlashda xato yuz berdi'),
        maydonXatolari: {},
      },
      oldingi,
      kirim,
    );
  }

  revalidatePath('/yetkazib');
  return { saqlandi: { id, nom: tekshiruv.data.nom } };
}

/** O'z sahifasi — saqlangach ro'yxatga qaytadi. */
export async function yetkazibYaratAmali(
  oldingi: FormaHolati,
  forma: FormData,
): Promise<FormaHolati> {
  const n = await yaratIchki(oldingi, forma);
  if ('saqlandi' in n) redirect('/yetkazib');
  return n;
}

/**
 * Modal oyna — yo'naltirmaydi.
 *
 * ⚠️ `redirect()` xato otish orqali ishlaydi. Modalda chaqirilsa
 *    butun sahifa almashib ketardi va omborchi yarim yozilgan
 *    kirim hujjatini yo'qotardi.
 */
export async function yetkazibModalYaratAmali(
  oldingi: FormaHolati,
  forma: FormData,
): Promise<FormaHolati> {
  const n = await yaratIchki(oldingi, forma);
  if ('saqlandi' in n) {
    return { xato: null, maydonXatolari: {}, yaratildi: n.saqlandi };
  }
  return n;
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
      xato: await xatoXabari(x, 'yetkazib/amal', 'Saqlashda xato yuz berdi'),
      maydonXatolari: {},
    };
  }

  revalidatePath('/yetkazib');
  redirect('/yetkazib');
}
