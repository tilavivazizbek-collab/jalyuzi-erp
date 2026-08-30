'use server';

/**
 * app/(panel)/kassa/ish-haqi-amal.ts — TZ 10.15 · QISM 1 §9.4 · Q-25
 */

import { xatoXabari } from '../xato-xabari';
import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { ishHaqiTola } from '@/lib/amal/tolov';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { matnMaydon } from '../forma-yordamchi';
import type { IshHaqiHolati } from './holat';

export async function ishHaqiAmali(
  _oldingi: IshHaqiHolati,
  forma: FormData,
): Promise<IshHaqiHolati> {
  const f = await ruxsatTalab('kassa.ish.haqi');

  const xodimId = Number(matnMaydon(forma, 'xodimId'));
  const kassaId = Number(matnMaydon(forma, 'kassaId'));
  const summa = matnMaydon(forma, 'summa').trim();
  const valyuta = matnMaydon(forma, 'valyuta') === 'USD' ? 'USD' : 'SOM';
  const balansValyutasi =
    matnMaydon(forma, 'balansValyutasi') === 'USD' ? 'USD' : 'SOM';
  const kurs = matnMaydon(forma, 'kurs').trim();
  const avansmi = matnMaydon(forma, 'avansmi') === 'ha';
  const izoh = matnMaydon(forma, 'izoh').trim();

  if (!Number.isSafeInteger(xodimId) || xodimId <= 0) {
    return { xato: 'Xodim tanlanmagan', balansdan: null, bajarildi: false };
  }
  if (!Number.isSafeInteger(kassaId) || kassaId <= 0) {
    return { xato: 'Kassa tanlanmagan', balansdan: null, bajarildi: false };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(summa) || Number(summa) <= 0) {
    return { xato: 'Summani kiriting', balansdan: null, bajarildi: false };
  }

  // Q-25 — boshqa filial xodimiga to'lov qilib bo'lmaydi
  const sql = ulanishOl();
  const tegishli = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM xodim
    WHERE id = ${xodimId} AND filial_id = ${f.filialId}`;

  if ((tegishli[0]?.n ?? 0) === 0) {
    return { xato: 'Xodim topilmadi', balansdan: null, bajarildi: false };
  }

  try {
    const n = await ishHaqiTola(
      sql,
      {
        xodimId,
        kassaId,
        summa,
        valyuta,
        balansValyutasi,
        kurs: kurs === '' ? null : kurs,
        avansmi,
        izoh: izoh === '' ? null : izoh,
      },
      f.filialId,
      f.xodimId,
    );

    revalidatePath('/kassa');
    revalidatePath(`/kassa/xodim/${String(xodimId)}`);
    return { xato: null, balansdan: n.balansdanYechildi, bajarildi: true };
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'kassa/ish-haqi-amal', "To'lovni saqlashda xato yuz berdi"),
      balansdan: null,
      bajarildi: false,
    };
  }
}
