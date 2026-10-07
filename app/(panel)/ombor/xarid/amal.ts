'use server';

/**
 * Xarid buyurtmasi — server amallari (0063). Ombor auditi 2026-10-07.
 *
 * ⚠️ RUXSAT: buyurtma — kirim qiladigan odamning ishi
 *    (`ombor.kirim.yarat`: omborchi, admin). Ko'rish — `ombor.qoldiq.kor`.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { xaridniYop, xaridYarat } from '@/lib/amal/xarid';
import { xaridSxema } from '@/lib/sxema/xarid';
import { xatoXabari } from '../../xato-xabari';
import { matnMaydon } from '../../forma-yordamchi';

export interface XaridFormaHolati {
  readonly xato: string | null;
}

function jsonOqi(forma: FormData, nom: string): unknown {
  try {
    return JSON.parse(matnMaydon(forma, nom) || '[]');
  } catch {
    return [];
  }
}

export async function xaridYaratAmali(
  _oldingi: XaridFormaHolati,
  forma: FormData,
): Promise<XaridFormaHolati> {
  const f = await ruxsatTalab('ombor.kirim.yarat');
  const t = xaridSxema.safeParse({
    yetkazibBeruvchiId: matnMaydon(forma, 'yetkazibBeruvchiId'),
    sana: matnMaydon(forma, 'sana'),
    kutilganSana: matnMaydon(forma, 'kutilganSana'),
    valyuta: matnMaydon(forma, 'valyuta'),
    izoh: matnMaydon(forma, 'izoh'),
    qatorlar: jsonOqi(forma, 'qatorlar'),
  });
  if (!t.success) {
    const b = t.error.issues[0];
    const joy = b?.path.map((p) => String(p)).join('.') ?? '';
    return { xato: joy === '' ? (b?.message ?? 'Formada xato') : `${joy}: ${b?.message ?? ''}` };
  }

  let id: number;
  try {
    ({ id } = await xaridYarat(ulanishOl(), { ...t.data, filialId: f.filialId }, f.xodimId));
  } catch (x) {
    return { xato: await xatoXabari(x, 'ombor/xarid', "Buyurtmani saqlab bo'lmadi") };
  }
  revalidatePath('/ombor', 'layout');
  redirect(`/ombor/xarid/${String(id)}`);
}

export interface YopishHolati {
  readonly xato: string | null;
  readonly saqlandi: boolean;
}

export async function xaridYopAmali(_o: YopishHolati, forma: FormData): Promise<YopishHolati> {
  const f = await ruxsatTalab('ombor.kirim.yarat');
  const qaror = matnMaydon(forma, 'qaror') === 'BEKOR' ? 'BEKOR' : 'YOPILDI';
  try {
    await xaridniYop(
      ulanishOl(),
      {
        id: Number(matnMaydon(forma, 'xaridId')),
        filialId: f.filialId,
        qaror,
        sabab: matnMaydon(forma, 'sabab'),
      },
      f.xodimId,
    );
  } catch (x) {
    return { xato: await xatoXabari(x, 'ombor/xarid', "Buyurtmani yopib bo'lmadi"), saqlandi: false };
  }
  revalidatePath('/ombor', 'layout');
  return { xato: null, saqlandi: true };
}
