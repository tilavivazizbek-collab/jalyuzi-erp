'use server';

/**
 * Saqlash joyi — server amallari (0062). Ombor auditi 2026-10-07.
 *
 * ⚠️ RUXSAT: joyni boshqarish va bo'lakni joyga qo'yish — kirim
 *    qiladigan odam (`ombor.kirim.yarat`: omborchi, admin). Ko'rish —
 *    `ombor.qoldiq.kor`.
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { bolakJoyiniOzgartir, joyNofaol, joyQosh } from '@/lib/amal/ombor-joy';
import { xatoXabari } from '../xato-xabari';
import { matnMaydon } from '../forma-yordamchi';

export interface JoyHolati {
  readonly xato: string | null;
  readonly xabar: string | null;
  /** Har muvaffaqiyatda oshadi — forma `key` bilan tozalanadi */
  readonly saqlandi: number;
}

const yangila = (): void => {
  revalidatePath('/ombor', 'layout');
};

export async function joyQoshAmali(oldingi: JoyHolati, forma: FormData): Promise<JoyHolati> {
  const f = await ruxsatTalab('ombor.kirim.yarat');
  try {
    await joyQosh(
      ulanishOl(),
      { filialId: f.filialId, nom: matnMaydon(forma, 'nom'), izoh: matnMaydon(forma, 'izoh') },
      f.xodimId,
    );
  } catch (x) {
    return { ...oldingi, xato: await xatoXabari(x, 'ombor/joy', "Joyni saqlab bo'lmadi"), xabar: null };
  }
  yangila();
  return { xato: null, xabar: 'Joy qo‘shildi', saqlandi: oldingi.saqlandi + 1 };
}

export async function joyNofaolAmali(oldingi: JoyHolati, forma: FormData): Promise<JoyHolati> {
  const f = await ruxsatTalab('ombor.kirim.yarat');
  const id = Number(matnMaydon(forma, 'joyId'));
  try {
    await joyNofaol(ulanishOl(), id, f.filialId, f.xodimId);
  } catch (x) {
    return { ...oldingi, xato: await xatoXabari(x, 'ombor/joy', "Joyni o'chirib bo'lmadi"), xabar: null };
  }
  yangila();
  return { xato: null, xabar: 'Joy o‘chirildi', saqlandi: oldingi.saqlandi + 1 };
}

/**
 * Bo'lak(lar)ni joyga qo'yish. Forma `bolakId` ni bir yoki bir necha
 * marta yuboradi (bitta bo'lak sahifasi yoki kirimdagi belgilanganlar).
 * `joyId` bo'sh — joyni olib tashlash.
 */
export async function bolakJoyiAmali(oldingi: JoyHolati, forma: FormData): Promise<JoyHolati> {
  const f = await ruxsatTalab('ombor.kirim.yarat');
  const idlar = forma
    .getAll('bolakId')
    .map((x) => Number(x))
    .filter((n) => Number.isSafeInteger(n) && n > 0);
  if (idlar.length === 0) {
    return { ...oldingi, xato: 'Bo‘lak tanlanmagan', xabar: null };
  }
  const joyXom = matnMaydon(forma, 'joyId');
  const joyId = joyXom === '' ? null : Number(joyXom);
  try {
    const n = await bolakJoyiniOzgartir(
      ulanishOl(),
      { bolakIdlar: idlar, joyId: joyId !== null && Number.isSafeInteger(joyId) ? joyId : null, filialId: f.filialId },
      f.xodimId,
    );
    yangila();
    return {
      xato: null,
      xabar: joyId === null ? `${String(n)} ta bo‘lak joyidan olindi` : `${String(n)} ta bo‘lak joyga qo‘yildi`,
      saqlandi: oldingi.saqlandi + 1,
    };
  } catch (x) {
    return { ...oldingi, xato: await xatoXabari(x, 'ombor/joy', "Joyni saqlab bo'lmadi"), xabar: null };
  }
}
