'use server';

/**
 * app/(panel)/material/narx-amal.ts — TZ 20.9 · Q-28
 *
 * Filial narx istisnosi. Ruxsat SERVER tomonda tekshiriladi (§9.4).
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ulanishOl } from '@/lib/db';
import { filialNarxiBelgila } from '@/lib/amal/filial-narx';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { matnMaydon } from '../forma-yordamchi';
import { biznesXatosimi } from '@/lib/xato';
import type { NarxHolati } from './narx-holat';

const sxema = z.object({
  materialId: z.coerce.number().int().positive(),
  filialId: z.coerce.number().int().positive(),
  /** Bo'sh — istisnoni olib tashlash (20.9.1) */
  narx: z
    .string()
    .trim()
    .regex(/^(\d{1,12}(\.\d{1,2})?)?$/, "Narx noto'g'ri"),
});

export async function filialNarxiAmali(
  _oldingi: NarxHolati,
  forma: FormData,
): Promise<NarxHolati> {
  const f = await ruxsatTalab('narx.filial.ozgartir');

  const tekshiruv = sxema.safeParse({
    materialId: matnMaydon(forma, 'materialId'),
    filialId: matnMaydon(forma, 'filialId'),
    narx: matnMaydon(forma, 'narx'),
  });

  if (!tekshiruv.success) {
    return { xato: "Narx noto'g'ri", bajarildi: false };
  }

  try {
    await filialNarxiBelgila(
      ulanishOl(),
      {
        materialId: tekshiruv.data.materialId,
        filialId: tekshiruv.data.filialId,
        // Bo'sh matn — istisno YO'Q, standart ishlaydi
        narx: tekshiruv.data.narx === '' ? null : tekshiruv.data.narx,
      },
      f.xodimId,
    );
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Narx saqlanmadi',
      bajarildi: false,
    };
  }

  revalidatePath(`/material/${String(tekshiruv.data.materialId)}`);
  revalidatePath('/sotuv');
  return { xato: null, bajarildi: true };
}
