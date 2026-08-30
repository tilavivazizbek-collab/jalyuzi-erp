'use server';

/**
 * app/(panel)/buyurtma/tolov-amal.ts — TZ 3.12 · QISM 1 §9.4 · Q-25
 */

import { xatoXabari } from '../xato-xabari';
import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { buyurtmaTolovi, type TolovQatori } from '@/lib/amal/tolov';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { matnMaydon } from '../forma-yordamchi';
import type { TolovFormaHolati } from './holat';

function jsonOqi(forma: FormData, nom: string): unknown {
  const matn = matnMaydon(forma, nom);
  if (matn === '') return [];
  try {
    return JSON.parse(matn);
  } catch {
    return [];
  }
}

/**
 * ⚠️ Brauzerdan kelgan JSON — turlar TEKSHIRILADI, ishonilmaydi.
 *    `unknown` ni to'g'ridan-to'g'ri `String()` ga berish `[object
 *    Object]` beradi va u tekshiruvdan o'tib ketishi mumkin edi.
 */
interface XomQator {
  readonly kassaId?: unknown;
  readonly summa?: unknown;
  readonly valyuta?: unknown;
}

export async function tolovAmali(
  _oldingi: TolovFormaHolati,
  forma: FormData,
): Promise<TolovFormaHolati> {
  const f = await ruxsatTalab('kassa.tolov');

  const buyurtmaId = Number(matnMaydon(forma, 'buyurtmaId'));
  if (!Number.isSafeInteger(buyurtmaId) || buyurtmaId <= 0) {
    return { xato: 'Buyurtma tanlanmagan', qarz: null, bajarildi: false };
  }

  const xom = jsonOqi(forma, 'qatorlar');
  if (!Array.isArray(xom) || xom.length === 0) {
    return { xato: "To'lov summasini kiriting", qarz: null, bajarildi: false };
  }

  const qatorlar: TolovQatori[] = [];
  for (const x of xom as XomQator[]) {
    const kassaId = Number(x.kassaId);
    const summa = typeof x.summa === 'string' ? x.summa : '';
    const valyuta = x.valyuta === 'USD' ? 'USD' : 'SOM';

    if (!Number.isSafeInteger(kassaId) || kassaId <= 0) {
      return { xato: 'Kassa tanlanmagan', qarz: null, bajarildi: false };
    }
    if (!/^\d+(\.\d{1,2})?$/.test(summa) || Number(summa) <= 0) {
      return { xato: "To'lov summasi noto'g'ri", qarz: null, bajarildi: false };
    }
    qatorlar.push({ kassaId, summa, valyuta });
  }

  // Q-25 — boshqa filial buyurtmasiga to'lov qabul qilib bo'lmaydi
  const sql = ulanishOl();
  const tegishli = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM buyurtma
    WHERE id = ${buyurtmaId} AND sotgan_filial_id = ${f.filialId}`;

  if ((tegishli[0]?.n ?? 0) === 0) {
    return { xato: 'Buyurtma topilmadi', qarz: null, bajarildi: false };
  }

  try {
    const n = await buyurtmaTolovi(
      sql,
      { buyurtmaId, qatorlar, izoh: matnMaydon(forma, 'izoh').trim() || null },
      f.xodimId,
      // K2 — topshirishda yoki keyin qabul qilingan to'lov (12.5)
      'K2',
    );

    revalidatePath('/buyurtma');
    revalidatePath('/kassa');
    return { xato: null, qarz: n.yangiQarz, bajarildi: true };
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'buyurtma/tolov-amal', "To'lovni saqlashda xato yuz berdi"),
      qarz: null,
      bajarildi: false,
    };
  }
}
