'use server';

/**
 * app/(panel)/buyurtma/qayta-kesish-amal.ts — TZ 8.17 · QISM 1 §9.4
 *
 * ⚠️ 8.17.2 — qarorni ADMIN qabul qiladi. Ruxsat serverda tekshiriladi
 *    va so'rov o'z filialidami — u ham (Q-25).
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { qaytaKesishHal } from '@/lib/amal/qayta-kesish';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { matnMaydon } from '../forma-yordamchi';
import { biznesXatosimi } from '@/lib/xato';
import type { AmalHolati } from './holat';

export async function qaytaKesishHalAmali(
  _oldingi: AmalHolati,
  forma: FormData,
): Promise<AmalHolati> {
  const f = await ruxsatTalab('buyurtma.brak');

  const sorovId = Number(matnMaydon(forma, 'sorovId'));
  const tasdiqlansinmi = matnMaydon(forma, 'qaror') === 'TASDIQ';
  const ushlanma = matnMaydon(forma, 'ushlanma').trim();
  const haqSaqlandi = matnMaydon(forma, 'haqSaqlandi') === 'ha';
  const izoh = matnMaydon(forma, 'izoh').trim();

  if (!Number.isSafeInteger(sorovId) || sorovId <= 0) {
    return { xato: "So'rov tanlanmagan", bajarildi: false };
  }
  if (ushlanma !== '' && !/^\d+(\.\d{1,2})?$/.test(ushlanma)) {
    return { xato: "Ushlanma summasi noto'g'ri", bajarildi: false };
  }

  // Q-25 — so'rov shu filialning ishlab chiqarish oqimidami
  const sql = ulanishOl();
  const tegishli = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n
    FROM qayta_kesish qk
    JOIN buyurtma_pozitsiya p ON p.id = qk.buyurtma_pozitsiya_id
    JOIN buyurtma b ON b.id = p.buyurtma_id
    WHERE qk.id = ${sorovId} AND b.ishlab_chiqaruvchi_filial_id = ${f.filialId}`;

  if ((tegishli[0]?.n ?? 0) === 0) {
    return { xato: "Qayta kesish so'rovi topilmadi", bajarildi: false };
  }

  try {
    await qaytaKesishHal(
      sql,
      {
        sorovId,
        tasdiqlansinmi,
        ushlanmaSumma: ushlanma === '' ? '0' : ushlanma,
        haqSaqlandi,
        izoh: izoh === '' ? null : izoh,
      },
      f.xodimId,
    );
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Qarorni saqlashda xato yuz berdi',
      bajarildi: false,
    };
  }

  revalidatePath('/buyurtma');
  revalidatePath('/buyurtma/qayta-kesish');
  revalidatePath('/ombor');
  return { xato: null, bajarildi: true };
}
