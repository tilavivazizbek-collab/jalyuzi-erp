'use server';

/**
 * app/(panel)/filial/amal.ts — TZ 22.6.3 · 22.3.3
 *
 * Filiallararo hisob amallari. Ruxsat SERVER tomonda tekshiriladi.
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { filialQarzTolovi } from '@/lib/amal/filial-hisob';
import { qoldaTuzatish } from '@/lib/amal/filial-harakat';
import { filialOzgartir, filialYarat, type FilialKirimi } from '@/lib/amal/filial';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { filialTolovSxema, qoldaTuzatishSxema } from '@/lib/sxema/kochirish';
import { filialSxema } from '@/lib/sxema/filial';
import { redirect } from 'next/navigation';
import { matnMaydon, maydonXatolari, FORMA_XATO_XABARI } from '../forma-yordamchi';
import { biznesXatosimi } from '@/lib/xato';
import type { FilialHolati } from './holat';

/** TZ 22.6.3 — qarz to'lovi: C12 chiqim + K11 kirim + TOLOV yozuvi. */
export async function filialTolovAmali(
  _oldingi: FilialHolati,
  forma: FormData,
): Promise<FilialHolati> {
  const f = await ruxsatTalab('filial.tolov');

  const tekshiruv = filialTolovSxema.safeParse({
    kimdanKassaId: matnMaydon(forma, 'kimdanKassaId'),
    kimgaKassaId: matnMaydon(forma, 'kimgaKassaId'),
    summa: matnMaydon(forma, 'summa'),
    izoh: matnMaydon(forma, 'izoh'),
  });

  if (!tekshiruv.success) {
    return {
      xato: FORMA_XATO_XABARI,
      maydonlar: maydonXatolari(tekshiruv.error.issues),
      bajarildi: false,
    };
  }

  try {
    await filialQarzTolovi(ulanishOl(), tekshiruv.data, f.xodimId);
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : "To'lov o'tmadi",
      maydonlar: {},
      bajarildi: false,
    };
  }

  revalidatePath('/filial/hisob');
  revalidatePath('/kassa');
  return { xato: null, maydonlar: {}, bajarildi: true };
}

/**
 * TZ 22.3.3 · EC-FQ-10 — zararni teng bo'lish kerak bo'lsa admin qo'lda
 * tuzatish yozadi. Sabab majburiy, audit jurnaliga tushadi.
 */
export async function qoldaTuzatishAmali(
  _oldingi: FilialHolati,
  forma: FormData,
): Promise<FilialHolati> {
  const f = await ruxsatTalab('filial.tuzatish');

  const tekshiruv = qoldaTuzatishSxema.safeParse({
    kimdanFilialId: matnMaydon(forma, 'kimdanFilialId'),
    kimgaFilialId: matnMaydon(forma, 'kimgaFilialId'),
    summa: matnMaydon(forma, 'summa'),
    sabab: matnMaydon(forma, 'sabab'),
  });

  if (!tekshiruv.success) {
    return {
      xato: FORMA_XATO_XABARI,
      maydonlar: maydonXatolari(tekshiruv.error.issues),
      bajarildi: false,
    };
  }

  try {
    await qoldaTuzatish(ulanishOl(), tekshiruv.data, f.xodimId);
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Tuzatish yozilmadi',
      maydonlar: {},
      bajarildi: false,
    };
  }

  revalidatePath('/filial/hisob');
  return { xato: null, maydonlar: {}, bajarildi: true };
}

// ─── TZ 20.2 · Filial boshqaruvi ──────────────────────────────────────────

/** Bo'sh tanlov — `null`. Zod `nullable` shu bilan ishlaydi. */
function ixtiyoriyId(forma: FormData, nom: string): number | null {
  const q = matnMaydon(forma, nom).trim();
  return q === '' ? null : Number(q);
}

function kirimniOqi(forma: FormData): unknown {
  return {
    nom: matnMaydon(forma, 'nom'),
    manzil: matnMaydon(forma, 'manzil'),
    telefon: matnMaydon(forma, 'telefon'),
    sotadi: matnMaydon(forma, 'sotadi'),
    ishlabChiqaradi: matnMaydon(forma, 'ishlabChiqaradi'),
    standartIshlabChiqaruvchiId: ixtiyoriyId(forma, 'standartIshlabChiqaruvchiId'),
    kassaYopilishSoati: matnMaydon(forma, 'kassaYopilishSoati'),
    faol: matnMaydon(forma, 'faol'),
  };
}

const bosh = (matn: string): string | null => (matn.trim() === '' ? null : matn.trim());

/** TZ 20.2 — yangi filial ochish. */
export async function filialYaratAmali(
  _oldingi: FilialHolati,
  forma: FormData,
): Promise<FilialHolati> {
  const f = await ruxsatTalab('filial.yarat');

  const tekshiruv = filialSxema.safeParse(kirimniOqi(forma));
  if (!tekshiruv.success) {
    return {
      xato: FORMA_XATO_XABARI,
      maydonlar: maydonXatolari(tekshiruv.error.issues),
      bajarildi: false,
    };
  }

  const kirim: FilialKirimi = {
    nom: tekshiruv.data.nom,
    manzil: bosh(tekshiruv.data.manzil ?? ''),
    telefon: bosh(tekshiruv.data.telefon ?? ''),
    sotadi: tekshiruv.data.sotadi,
    ishlabChiqaradi: tekshiruv.data.ishlabChiqaradi,
    standartIshlabChiqaruvchiId: tekshiruv.data.standartIshlabChiqaruvchiId,
    kassaYopilishSoati: tekshiruv.data.kassaYopilishSoati,
    faol: tekshiruv.data.faol,
  };

  let filialId: number;
  try {
    const n = await filialYarat(ulanishOl(), kirim, f.xodimId);
    filialId = n.filialId;
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Filial saqlanmadi',
      maydonlar: {},
      bajarildi: false,
    };
  }

  revalidatePath('/filial');
  redirect(`/filial/${String(filialId)}`);
}

/** TZ 20.2 — filialni tahrirlash. */
export async function filialOzgartirAmali(
  _oldingi: FilialHolati,
  forma: FormData,
): Promise<FilialHolati> {
  const f = await ruxsatTalab('filial.ozgartir');

  const filialId = Number(matnMaydon(forma, 'filialId'));
  if (!Number.isSafeInteger(filialId) || filialId <= 0) {
    return { xato: 'Filial tanlanmagan', maydonlar: {}, bajarildi: false };
  }

  const tekshiruv = filialSxema.safeParse(kirimniOqi(forma));
  if (!tekshiruv.success) {
    return {
      xato: FORMA_XATO_XABARI,
      maydonlar: maydonXatolari(tekshiruv.error.issues),
      bajarildi: false,
    };
  }

  try {
    await filialOzgartir(
      ulanishOl(),
      filialId,
      {
        nom: tekshiruv.data.nom,
        manzil: bosh(tekshiruv.data.manzil ?? ''),
        telefon: bosh(tekshiruv.data.telefon ?? ''),
        sotadi: tekshiruv.data.sotadi,
        ishlabChiqaradi: tekshiruv.data.ishlabChiqaradi,
        standartIshlabChiqaruvchiId: tekshiruv.data.standartIshlabChiqaruvchiId,
        kassaYopilishSoati: tekshiruv.data.kassaYopilishSoati,
        faol: tekshiruv.data.faol,
      },
      f.xodimId,
    );
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : "Filial o'zgartirilmadi",
      maydonlar: {},
      bajarildi: false,
    };
  }

  revalidatePath('/filial');
  revalidatePath(`/filial/${String(filialId)}`);
  return { xato: null, maydonlar: {}, bajarildi: true };
}
