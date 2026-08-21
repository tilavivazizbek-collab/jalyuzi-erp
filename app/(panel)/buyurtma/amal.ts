'use server';

/**
 * app/(panel)/buyurtma/amal.ts — TZ 8.4 · QISM 1 §9.4 · Q-25
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { pozitsiyaniTasdiqla } from '@/lib/amal/buyurtma';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { matnMaydon } from '../forma-yordamchi';
import { biznesXatosimi } from '@/lib/xato';
import type { TasdiqHolati } from './holat';

export async function tasdiqlashAmali(
  _oldingi: TasdiqHolati,
  forma: FormData,
): Promise<TasdiqHolati> {
  const f = await ruxsatTalab('buyurtma.tasdiqla');

  const pozitsiyaId = Number(matnMaydon(forma, 'pozitsiyaId'));
  if (!Number.isSafeInteger(pozitsiyaId) || pozitsiyaId <= 0) {
    return { xato: 'Pozitsiya tanlanmagan', materialgaKutmoqda: false };
  }

  // Q-25 — boshqa filial buyurtmasini tasdiqlab bo'lmaydi
  const sql = ulanishOl();
  const tegishli = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n
    FROM buyurtma_pozitsiya p
    JOIN buyurtma b ON b.id = p.buyurtma_id
    WHERE p.id = ${pozitsiyaId} AND b.sotgan_filial_id = ${f.filialId}`;

  if ((tegishli[0]?.n ?? 0) === 0) {
    return { xato: 'Buyurtma pozitsiyasi topilmadi', materialgaKutmoqda: false };
  }

  try {
    const n = await pozitsiyaniTasdiqla(sql, pozitsiyaId, f.xodimId);

    revalidatePath('/buyurtma');
    revalidatePath('/ombor');

    return {
      xato: null,
      materialgaKutmoqda: n.holat === 'MATERIALGA_KUTMOQDA',
    };
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Tasdiqlashda xato yuz berdi',
      materialgaKutmoqda: false,
    };
  }
}
