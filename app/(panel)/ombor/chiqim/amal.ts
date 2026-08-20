'use server';

/**
 * app/(panel)/ombor/chiqim/amal.ts — TZ 7.10 · 7.12 · QISM 1 §9.4, §11
 *
 * Uchta amal, uchtasi ham ruxsatni SERVER tomonda tekshiradi (§20.2):
 * tugmani yashirish himoya emas.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { hisobdanChiqar, chiqarishniBekorQil } from '@/lib/amal/hisobdan';
import { kirimniStorno } from '@/lib/amal/kirim';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { chiqimSxema, chiqimBekorSxema, stornoSxema } from '@/lib/sxema/chiqim';
import { chiqimBolagi, harakatFilialda, kirimTafsiloti } from '../malumot';
import {
  matnMaydon,
  maydonXatolari,
  FORMA_XATO_XABARI,
} from '../../forma-yordamchi';
import { biznesXatosimi } from '@/lib/xato';
import { BOSH_HOLAT, type ChiqimHolati } from './holat';

export async function hisobdanChiqarAmali(
  _oldingi: ChiqimHolati,
  forma: FormData,
): Promise<ChiqimHolati> {
  const f = await ruxsatTalab('ombor.chiqim');

  const tekshiruv = chiqimSxema.safeParse({
    bolakId: matnMaydon(forma, 'bolakId'),
    sabab: matnMaydon(forma, 'sabab'),
    izoh: matnMaydon(forma, 'izoh'),
    davoQilinadimi: matnMaydon(forma, 'davoQilinadimi') === 'ha',
  });

  if (!tekshiruv.success) {
    return {
      xato: FORMA_XATO_XABARI,
      maydonlar: maydonXatolari(tekshiruv.error.issues),
    };
  }

  const d = tekshiruv.data;

  // Q-25 — o'z filiali omboridan tashqarisiga tegib bo'lmaydi.
  const bolak = await chiqimBolagi(d.bolakId, f.filialId);
  if (bolak === null) {
    return { xato: "Bo'lak topilmadi", maydonlar: {} };
  }

  try {
    await hisobdanChiqar(
      ulanishOl(),
      {
        bolakId: d.bolakId,
        sabab: d.sabab,
        izoh: d.izoh ?? null,
        // TZ 7.10 — defekt keyin topilsa qaysi kirimdan ekani yoziladi
        kirimId: d.sabab === 'YETKAZIB_BERUVCHI_DEFEKTI' ? bolak.kirimId : null,
        davoQilinadimi: d.sabab === 'YETKAZIB_BERUVCHI_DEFEKTI' && d.davoQilinadimi,
      },
      f.xodimId,
    );
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Hisobdan chiqarishda xato yuz berdi',
      maydonlar: {},
    };
  }

  revalidatePath('/ombor');
  revalidatePath(`/ombor/${String(bolak.materialId)}`);
  redirect(`/ombor/${String(bolak.materialId)}`);
}

/**
 * TZ 7.10 — bekor qilish TESKARI YOZUV bilan bo'ladi, eski yozuv
 * o'chirilmaydi (§6.5). Qoldiq manfiyga tushsa ham bloklanmaydi
 * (2.5-invariant).
 */
export async function chiqimBekorAmali(
  _oldingi: ChiqimHolati,
  forma: FormData,
): Promise<ChiqimHolati> {
  const f = await ruxsatTalab('ombor.chiqim');

  const tekshiruv = chiqimBekorSxema.safeParse({
    harakatId: matnMaydon(forma, 'harakatId'),
    izoh: matnMaydon(forma, 'izoh'),
  });
  if (!tekshiruv.success) {
    return {
      xato: FORMA_XATO_XABARI,
      maydonlar: maydonXatolari(tekshiruv.error.issues),
    };
  }

  // Q-25 — boshqa filial yozuvi bekor qilinmasin
  const harakat = await harakatFilialda(tekshiruv.data.harakatId, f.filialId);
  if (harakat === null) {
    return { xato: 'Ombor yozuvi topilmadi', maydonlar: {} };
  }

  try {
    await chiqarishniBekorQil(
      ulanishOl(),
      tekshiruv.data.harakatId,
      tekshiruv.data.izoh,
      f.xodimId,
    );
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Bekor qilishda xato yuz berdi',
      maydonlar: {},
    };
  }

  revalidatePath('/ombor');
  revalidatePath(`/ombor/${String(harakat.materialId)}`);
  return BOSH_HOLAT;
}

/** TZ 7.12 — kirim hujjatini storno qilish. */
export async function kirimStornoAmali(
  _oldingi: ChiqimHolati,
  forma: FormData,
): Promise<ChiqimHolati> {
  const f = await ruxsatTalab('ombor.storno');

  const tekshiruv = stornoSxema.safeParse({
    kirimId: matnMaydon(forma, 'kirimId'),
    sabab: matnMaydon(forma, 'sabab'),
  });
  if (!tekshiruv.success) {
    return {
      xato: FORMA_XATO_XABARI,
      maydonlar: maydonXatolari(tekshiruv.error.issues),
    };
  }

  // Q-25 — boshqa filial hujjati storno qilinmasin
  const hujjat = await kirimTafsiloti(tekshiruv.data.kirimId, f.filialId);
  if (hujjat === null) {
    return { xato: 'Kirim hujjati topilmadi', maydonlar: {} };
  }

  try {
    await kirimniStorno(ulanishOl(), tekshiruv.data.kirimId, tekshiruv.data.sabab, f.xodimId);
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Storno qilishda xato yuz berdi',
      maydonlar: {},
    };
  }

  revalidatePath('/ombor');
  revalidatePath('/ombor/kirim');
  revalidatePath(`/ombor/kirim/${String(tekshiruv.data.kirimId)}`);
  return BOSH_HOLAT;
}
