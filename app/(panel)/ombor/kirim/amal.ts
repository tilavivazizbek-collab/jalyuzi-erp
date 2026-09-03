'use server';

/**
 * app/(panel)/ombor/kirim/amal.ts — TZ 7.9 · QISM 1 §9.4, §11
 */

import { xatoXabari } from '../../xato-xabari';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { kirimYarat, type KirimKirimi } from '@/lib/amal/kirim';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { kirimSxema } from '@/lib/sxema/kirim';
import { matnMaydon } from '../../forma-yordamchi';
import type { KirimHolati } from './holat';

function jsonOqi(forma: FormData, nom: string): unknown {
  const matn = matnMaydon(forma, nom);
  if (matn === '') return [];
  try {
    return JSON.parse(matn);
  } catch {
    return [];
  }
}

export async function kirimYaratAmali(
  _oldingi: KirimHolati,
  forma: FormData,
): Promise<KirimHolati> {
  const f = await ruxsatTalab('ombor.kirim.yarat');

  const xom = {
    raqam: matnMaydon(forma, 'raqam'),
    sana: matnMaydon(forma, 'sana'),
    yetkazibBeruvchiId: matnMaydon(forma, 'yetkazibBeruvchiId'),
    valyuta: matnMaydon(forma, 'valyuta'),
    kursSnapshot: matnMaydon(forma, 'kursSnapshot'),
    transportSumma: matnMaydon(forma, 'transportSumma'),
    bojxonaSumma: matnMaydon(forma, 'bojxonaSumma'),
    tolovMuddati: matnMaydon(forma, 'tolovMuddati'),
    qatorlar: jsonOqi(forma, 'qatorlar'),
    /** TZ 12.6 — mol kelganda darhol to'langan summa */
    tolovSumma: matnMaydon(forma, 'tolovSumma'),
    tolovKassaId: matnMaydon(forma, 'tolovKassaId'),
  };

  const tekshiruv = kirimSxema.safeParse(xom);
  if (!tekshiruv.success) {
    const birinchi = tekshiruv.error.issues[0];
    const joy = birinchi?.path.map((p) => String(p)).join('.') ?? '';
    return {
      xato: joy === '' ? (birinchi?.message ?? 'Formada xato') : `${joy}: ${birinchi?.message ?? ''}`,
      ogohlantirishlar: [],
      saqlandi: false,
    };
  }

  const d = tekshiruv.data;
  const kirim: KirimKirimi = {
    raqam: d.raqam,
    sana: d.sana,
    filialId: f.filialId,
    yetkazibBeruvchiId: d.yetkazibBeruvchiId,
    valyuta: d.valyuta,
    kursSnapshot: d.kursSnapshot ?? null,
    transportSumma: d.transportSumma ?? '0',
    bojxonaSumma: d.bojxonaSumma ?? '0',
    tolovMuddati: d.tolovMuddati ?? null,
    tolovSumma: d.tolovSumma,
    tolovKassaId: d.tolovKassaId,
    qatorlar: d.qatorlar.map((q) => ({
      materialId: q.materialId,
      miqdorKirim: Number(q.miqdorKirim),
      narxBirlik: q.narxBirlik,
      /** ⚠️ `METR` — narx uzunlik metriga berilgan (7.9) */
      narxAsosi: q.narxAsosi,
      defektMiqdor: q.defektMiqdor === undefined ? 0 : Number(q.defektMiqdor),
      defektTuri: q.defektTuri ?? null,
      bolaklar: q.bolaklar.map((b) => ({ eniM: Number(b.eniM), boyiM: Number(b.boyiM) })),
    })),
  };

  let natija;
  try {
    natija = await kirimYarat(ulanishOl(), kirim, f.xodimId);
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'ombor/kirim/amal', 'Saqlashda xato yuz berdi'),
      ogohlantirishlar: [],
      saqlandi: false,
    };
  }

  revalidatePath('/ombor');

  // TZ 7.9 — ustama past bo'lsa hujjat SAQLANADI, lekin ogohlantirish
  // ko'rsatiladi. Bloklamaydi: mol allaqachon kelgan.
  if (natija.ogohlantirishlar.length > 0) {
    return {
      xato: null,
      saqlandi: true,
      ogohlantirishlar: natija.ogohlantirishlar.map((o) => ({
        materialNomi: o.materialNomi,
        ustamaFoiz: o.ustamaFoiz,
        turNomi: o.turNomi,
        chegara: o.chegara,
      })),
    };
  }

  redirect('/ombor');
}
