'use server';

/**
 * app/(panel)/ombor/inventarizatsiya/amal.ts — TZ 15.1 · 7.10 · QISM 1 §9.4
 *
 * Ruxsat SERVER tomonda tekshiriladi (§20.2) va har amal O'Z FILIALI
 * ichida qoladi (Q-25).
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { varaqaOch, varaqaYakunla } from '@/lib/amal/inventarizatsiya';
import { boshlangichQoldiq } from '@/lib/amal/boshlangich';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import {
  boshlangichSxema,
  varaqaOchSxema,
  varaqaYakunlaSxema,
} from '@/lib/sxema/chiqim';
import { varaqaTafsiloti } from '../malumot';
import { matnMaydon, maydonXatolari, FORMA_XATO_XABARI } from '../../forma-yordamchi';
import { biznesXatosimi } from '@/lib/xato';
import type { InvHolati } from './holat';

function jsonOqi(forma: FormData, nom: string): unknown {
  const matn = matnMaydon(forma, nom);
  if (matn === '') return [];
  try {
    return JSON.parse(matn);
  } catch {
    return [];
  }
}

/** TZ 15.1 — varaqa ochish (to'liq yoki qisman). */
export async function varaqaOchAmali(
  _oldingi: InvHolati,
  forma: FormData,
): Promise<InvHolati> {
  const f = await ruxsatTalab('ombor.inventarizatsiya');

  const tekshiruv = varaqaOchSxema.safeParse({
    sana: matnMaydon(forma, 'sana'),
    materialIdlar: jsonOqi(forma, 'materialIdlar'),
    izoh: matnMaydon(forma, 'izoh'),
  });

  if (!tekshiruv.success) {
    return {
      xato: FORMA_XATO_XABARI,
      maydonlar: maydonXatolari(tekshiruv.error.issues),
      manfiyQoldiq: [],
    };
  }

  let varaqaId: number;
  try {
    const n = await varaqaOch(
      ulanishOl(),
      {
        sana: tekshiruv.data.sana,
        filialId: f.filialId,
        materialIdlar: tekshiruv.data.materialIdlar,
        izoh: tekshiruv.data.izoh,
      },
      f.xodimId,
    );
    varaqaId = n.varaqaId;
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Varaqa ochilmadi',
      maydonlar: {},
      manfiyQoldiq: [],
    };
  }

  revalidatePath('/ombor/inventarizatsiya');
  redirect(`/ombor/inventarizatsiya/${String(varaqaId)}`);
}

/**
 * TZ 15.1 — varaqani yakunlash.
 *
 * ⚠️ Farq chiqqan qatorda sabab MAJBURIY — tekshiruv `lib/domain/` da,
 *    shu yerda takrorlanmaydi (§2.2). Xato butun varaqani rad etadi
 *    (2.1-invariant).
 */
export async function varaqaYakunlaAmali(
  _oldingi: InvHolati,
  forma: FormData,
): Promise<InvHolati> {
  const f = await ruxsatTalab('ombor.inventarizatsiya');

  const tekshiruv = varaqaYakunlaSxema.safeParse({
    varaqaId: matnMaydon(forma, 'varaqaId'),
    qatorlar: jsonOqi(forma, 'qatorlar'),
  });

  if (!tekshiruv.success) {
    return {
      xato: FORMA_XATO_XABARI,
      maydonlar: maydonXatolari(tekshiruv.error.issues),
      manfiyQoldiq: [],
    };
  }

  // Q-25 — boshqa filial varaqasiga tegib bo'lmaydi
  const varaqa = await varaqaTafsiloti(tekshiruv.data.varaqaId, f.filialId);
  if (varaqa === null) {
    return { xato: 'Inventarizatsiya topilmadi', maydonlar: {}, manfiyQoldiq: [] };
  }

  try {
    const n = await varaqaYakunla(
      ulanishOl(),
      tekshiruv.data.varaqaId,
      tekshiruv.data.qatorlar,
      f.xodimId,
    );

    revalidatePath('/ombor');
    revalidatePath('/ombor/inventarizatsiya');
    revalidatePath(`/ombor/inventarizatsiya/${String(tekshiruv.data.varaqaId)}`);

    return { xato: null, maydonlar: {}, manfiyQoldiq: n.manfiyQoldiq };
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Yakunlashda xato yuz berdi',
      maydonlar: {},
      manfiyQoldiq: [],
    };
  }
}

/** TZ 7.10 — boshlang'ich qoldiq (tizimga o'tish). */
export async function boshlangichAmali(
  _oldingi: InvHolati,
  forma: FormData,
): Promise<InvHolati> {
  const f = await ruxsatTalab('ombor.boshlangich');

  const miqdorMatn = matnMaydon(forma, 'miqdor');

  const tekshiruv = boshlangichSxema.safeParse({
    materialId: matnMaydon(forma, 'materialId'),
    bolaklar: jsonOqi(forma, 'bolaklar'),
    miqdor: miqdorMatn === '' ? null : Number(miqdorMatn),
    tannarxBirlik: matnMaydon(forma, 'tannarxBirlik'),
    izoh: matnMaydon(forma, 'izoh'),
  });

  if (!tekshiruv.success) {
    return {
      xato: FORMA_XATO_XABARI,
      maydonlar: maydonXatolari(tekshiruv.error.issues),
      manfiyQoldiq: [],
    };
  }

  const d = tekshiruv.data;

  try {
    await boshlangichQoldiq(
      ulanishOl(),
      {
        materialId: d.materialId,
        filialId: f.filialId,
        bolaklar: d.bolaklar,
        miqdor: d.miqdor,
        tannarxBirlik: d.tannarxBirlik,
        izoh: d.izoh,
      },
      f.xodimId,
    );
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Boshlang\'ich qoldiq kiritilmadi',
      maydonlar: {},
      manfiyQoldiq: [],
    };
  }

  revalidatePath('/ombor');
  revalidatePath(`/ombor/${String(d.materialId)}`);
  redirect(`/ombor/${String(d.materialId)}`);
}
