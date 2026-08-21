'use server';

/**
 * app/(panel)/buyurtma/amal.ts — TZ 8.4 · QISM 1 §9.4 · Q-25
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { pozitsiyaniTasdiqla } from '@/lib/amal/buyurtma';
import { ishniQaytaribOl, pozitsiyaniBekorQil } from '@/lib/amal/ish';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { matnMaydon } from '../forma-yordamchi';
import { biznesXatosimi } from '@/lib/xato';
import type { AmalHolati, TasdiqHolati } from './holat';

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

/** O'z filialidagi pozitsiyani topadi — Q-25. */
async function ozFilialidami(pozitsiyaId: number, filialId: number): Promise<boolean> {
  const q = await ulanishOl()<{ n: number }[]>`
    SELECT COUNT(*)::int AS n
    FROM buyurtma_pozitsiya p
    JOIN buyurtma b ON b.id = p.buyurtma_id
    WHERE p.id = ${pozitsiyaId}
      AND (b.sotgan_filial_id = ${filialId} OR b.ishlab_chiqaruvchi_filial_id = ${filialId})`;
  return (q[0]?.n ?? 0) > 0;
}

/**
 * TZ 8.8 — pozitsiyani bekor qilish.
 *
 * Band bo'shaydi va material omborga qaytadi (Q-06). Ish boshlangach
 * tugma ko'rinmaydi, lekin tekshiruv SERVERDA ham bor (§9.4).
 */
export async function bekorAmali(
  _oldingi: AmalHolati,
  forma: FormData,
): Promise<AmalHolati> {
  const f = await ruxsatTalab('buyurtma.bekor');

  const pozitsiyaId = Number(matnMaydon(forma, 'pozitsiyaId'));
  const sabab = matnMaydon(forma, 'sabab');

  if (!Number.isSafeInteger(pozitsiyaId) || pozitsiyaId <= 0) {
    return { xato: 'Pozitsiya tanlanmagan', bajarildi: false };
  }
  if (!(await ozFilialidami(pozitsiyaId, f.filialId))) {
    return { xato: 'Buyurtma pozitsiyasi topilmadi', bajarildi: false };
  }

  try {
    await pozitsiyaniBekorQil(ulanishOl(), pozitsiyaId, sabab, f.xodimId);
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Bekor qilishda xato yuz berdi',
      bajarildi: false,
    };
  }

  revalidatePath('/buyurtma');
  revalidatePath('/ombor');
  return { xato: null, bajarildi: true };
}

/**
 * TZ 8.6 — admin ishni ustadan qaytarib oladi.
 *
 * ⚠️ Stavkani ADMIN QO'LDA kiritadi: usta ishning bir qismini bajargan
 *    bo'lishi mumkin. Sabab majburiy.
 */
export async function qaytaribOlishAmali(
  _oldingi: AmalHolati,
  forma: FormData,
): Promise<AmalHolati> {
  const f = await ruxsatTalab('buyurtma.tahrirla');

  const pozitsiyaId = Number(matnMaydon(forma, 'pozitsiyaId'));
  const stavka = matnMaydon(forma, 'stavka');
  const sabab = matnMaydon(forma, 'sabab');

  if (!Number.isSafeInteger(pozitsiyaId) || pozitsiyaId <= 0) {
    return { xato: 'Pozitsiya tanlanmagan', bajarildi: false };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(stavka.trim())) {
    return { xato: "To'lanadigan stavkani kiriting", bajarildi: false };
  }
  if (!(await ozFilialidami(pozitsiyaId, f.filialId))) {
    return { xato: 'Buyurtma pozitsiyasi topilmadi', bajarildi: false };
  }

  try {
    await ishniQaytaribOl(ulanishOl(), pozitsiyaId, stavka.trim(), sabab, f.xodimId);
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Qaytarib olishda xato yuz berdi',
      bajarildi: false,
    };
  }

  revalidatePath('/buyurtma');
  return { xato: null, bajarildi: true };
}
