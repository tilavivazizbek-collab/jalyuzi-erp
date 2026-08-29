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
import { kirimniQaytar, maydonlarniOqi } from '../forma-yordamchi';
import { xatolarniYig, type MijozHolati } from './holat';

const MAYDONLAR = [
  'ism',
  'telefon',
  'manzil',
  'eslatma',
  'mijozGuruhId',
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

const formadanOqi = (forma: FormData): Record<string, string> =>
  maydonlarniOqi(forma, MAYDONLAR);

/**
 * ⚠️ Yaratish mantig'i BITTA joyda (§2.2). Ikki chaqiruvchi bor:
 *      · o'z sahifasi  — saqlagach ro'yxatga yo'naltiradi
 *      · modal oyna    — yo'naltirmaydi, yangi mijoz raqamini
 *                        qaytaradi, chunki u darhol tanlanishi kerak
 *
 *    Nusxa ko'chirilsa ikki joyda ikki xil tekshiruv bo'lib
 *    qolardi va biri unutilardi.
 */
async function mijozYaratIchki(
  oldingi: MijozHolati,
  forma: FormData,
): Promise<MijozHolati | { readonly saqlandi: { readonly id: number; readonly ism: string } }> {
  const f = await ruxsatTalab('mijoz.yarat');

  /**
   * ⚠️ Xom qiymatlar SAQLANADI — React 19 formani amaldan keyin
   *    o'zi tozalaydi va xato bo'lganda odam yozgani yo'qolardi.
   */
  const kirim = formadanOqi(forma);

  const tekshiruv = mijozSxema.safeParse(kirim);
  if (!tekshiruv.success) {
    return kirimniQaytar(xatolarniYig(tekshiruv.error.issues), oldingi, kirim);
  }

  let natija;
  try {
    natija = await mijozYarat(ulanishOl(), tekshiruv.data, f.xodimId);
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Saqlashda xato yuz berdi',
      maydonXatolari: {},
      dublikat: null,
      yaratildi: null,
    };
  }

  if (natija.holat === 'DUBLIKAT') {
    const m = natija.dublikat.mavjud;
    return kirimniQaytar<MijozHolati>(
      {
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
        yaratildi: null,
      },
      oldingi,
      kirim,
    );
  }

  revalidatePath('/mijoz');
  return { saqlandi: { id: natija.id, ism: tekshiruv.data.ism } };
}

/** O'z sahifasi — saqlangach ro'yxatga qaytadi. */
export async function mijozYaratAmali(
  oldingi: MijozHolati,
  forma: FormData,
): Promise<MijozHolati> {
  const n = await mijozYaratIchki(oldingi, forma);
  if ('saqlandi' in n) redirect('/mijoz');
  return n;
}

/**
 * Modal oyna — yo'naltirmaydi.
 *
 * ⚠️ `redirect()` xato otish orqali ishlaydi. Uni modalda
 *    chaqirsak butun sahifa almashib ketardi va sotuvchi yarim
 *    yozilgan buyurtmasini yo'qotardi.
 */
export async function mijozModalYaratAmali(
  oldingi: MijozHolati,
  forma: FormData,
): Promise<MijozHolati> {
  const n = await mijozYaratIchki(oldingi, forma);
  if ('saqlandi' in n) {
    return { xato: null, maydonXatolari: {}, dublikat: null, yaratildi: n.saqlandi };
  }
  return n;
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
      yaratildi: null,
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
      yaratildi: null,
    };
  }

  revalidatePath('/mijoz');
  redirect('/mijoz');
}
