'use server';

/**
 * app/(panel)/ombor/inventarizatsiya/amal.ts — TZ 15.1 · 7.10 · QISM 1 §9.4
 *
 * Ruxsat SERVER tomonda tekshiriladi (§20.2) va har amal O'Z FILIALI
 * ichida qoladi (Q-25).
 */

import { xatoXabari } from '../../xato-xabari';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { varaqaOch, varaqaYakunla } from '@/lib/amal/inventarizatsiya';
import { boshlangichQoldiq } from '@/lib/amal/boshlangich';
import { rulonKvMTannarxi } from '@/lib/domain/boshlangich-narx';
import { som } from '@/lib/domain/pul';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import {
  boshlangichSxema,
  varaqaOchSxema,
  varaqaYakunlaSxema,
} from '@/lib/sxema/chiqim';
import { varaqaTafsiloti } from '../malumot';
import { matnMaydon, maydonXatolari, FORMA_XATO_XABARI } from '../../forma-yordamchi';
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
      xato: await xatoXabari(x, 'ombor/inventarizatsiya/amal', 'Varaqa ochilmadi'),
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
      xato: await xatoXabari(x, 'ombor/inventarizatsiya/amal', 'Yakunlashda xato yuz berdi'),
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

  /**
   * NARX ASOSI — 2026-09-23.
   *
   * ⚠️ Ilgari bu forma to'g'ridan-to'g'ri «1 kv.m tannarxi» ni
   *    so'rardi: egasi «metriga 78 000» deb bilgan raqamni o'zi
   *    kalkulyator bilan kv.m ga o'girishi kerak edi. Material
   *    kartochkasidagi zahira bo'limi esa buni O'ZI qilardi —
   *    ya'ni ikki yo'l ikki xil ishlardi va biri xato berardi.
   *
   * ⚠️ Endi ikkalasi ham `rulonKvMTannarxi()` dan o'tadi
   *    (CLAUDE.md §3 «bir mantiq — bir joyda»).
   *
   * ⚠️ Asos berilmasa `KV_M` — eski xulq, ya'ni yozilgan raqam
   *    to'g'ridan-to'g'ri tannarx deb qabul qilinadi. Bu eski
   *    havolalar va botni buzmaydi.
   */
  const narxAsosi = matnMaydon(forma, 'narxAsosi');
  const xomBolaklar = jsonOqi(forma, 'bolaklar');

  const tannarxMatn = ((): string => {
    const xom = matnMaydon(forma, 'tannarxBirlik');
    if (narxAsosi === '' || narxAsosi === 'KV_M') return xom;
    if (!Array.isArray(xomBolaklar) || xomBolaklar.length === 0) return xom;

    try {
      return rulonKvMTannarxi(
        narxAsosi === 'BIRLIK' ? 'BIRLIK' : 'METR',
        som(xom),
        (xomBolaklar as { eniM: number; boyiM: number }[]).map((b) => ({
          eniM: b.eniM,
          boyiM: b.boyiM,
        })),
      );
    } catch {
      /** Xato bo'lsa xom qiymat ketadi — sxema uni tushunarli rad etadi */
      return xom;
    }
  })();

  const tekshiruv = boshlangichSxema.safeParse({
    materialId: matnMaydon(forma, 'materialId'),
    bolaklar: xomBolaklar,
    miqdor: miqdorMatn === '' ? null : Number(miqdorMatn),
    tannarxBirlik: tannarxMatn,
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
      xato: await xatoXabari(x, 'ombor/inventarizatsiya/amal', "Boshlang'ich qoldiq kiritilmadi"),
      maydonlar: {},
      manfiyQoldiq: [],
    };
  }

  revalidatePath('/ombor');
  revalidatePath(`/ombor/${String(d.materialId)}`);
  redirect(`/ombor/${String(d.materialId)}`);
}
