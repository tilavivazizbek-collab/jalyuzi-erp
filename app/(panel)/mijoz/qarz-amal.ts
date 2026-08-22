'use server';

/**
 * app/(panel)/mijoz/qarz-amal.ts — TZ 6.9 · QISM 1 §9.4
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { qarzniTola } from '@/lib/amal/tolov';
import { umidsizQarz } from '@/lib/amal/ayirboshlash';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { matnMaydon } from '../forma-yordamchi';
import { biznesXatosimi } from '@/lib/xato';
import type { QarzHolati, UmidsizHolati } from './holat';

/** Pul summasi shakli — brauzerdan kelgan qiymatga ishonilmaydi. */
const PUL_SHAKLI = /^\d+(\.\d{1,2})?$/;

export async function qarzTolashAmali(
  _oldingi: QarzHolati,
  forma: FormData,
): Promise<QarzHolati> {
  const f = await ruxsatTalab('kassa.tolov');

  const mijozId = Number(matnMaydon(forma, 'mijozId'));
  const kassaId = Number(matnMaydon(forma, 'kassaId'));
  const summa = matnMaydon(forma, 'summa').trim();
  const valyuta = matnMaydon(forma, 'valyuta') === 'USD' ? 'USD' : 'SOM';
  const izoh = matnMaydon(forma, 'izoh').trim();

  if (!Number.isSafeInteger(mijozId) || mijozId <= 0) {
    return { xato: 'Mijoz tanlanmagan', qolganQarz: null, bajarildi: false };
  }
  if (!Number.isSafeInteger(kassaId) || kassaId <= 0) {
    return { xato: 'Kassa tanlanmagan', qolganQarz: null, bajarildi: false };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(summa) || Number(summa) <= 0) {
    return { xato: "Summani kiriting", qolganQarz: null, bajarildi: false };
  }

  try {
    const n = await qarzniTola(
      ulanishOl(),
      { mijozId, kassaId, summa, valyuta, izoh: izoh === '' ? null : izoh },
      f.filialId,
      f.xodimId,
    );

    revalidatePath(`/mijoz/${String(mijozId)}`);
    revalidatePath('/kassa');
    return { xato: null, qolganQarz: n.qolganQarz, bajarildi: true };
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : "To'lovni saqlashda xato yuz berdi",
      qolganQarz: null,
      bajarildi: false,
    };
  }
}

/**
 * TZ 6.10 — admin qarzni hisobdan chiqaradi.
 *
 * ⚠️ Sabab MAJBURIY, audit jurnaliga tushadi. Kassaga tegilmaydi —
 *    pul kelmagan, lekin bu haqiqiy xarajat (12.1).
 */
export async function umidsizQarzAmali(
  _oldingi: UmidsizHolati,
  forma: FormData,
): Promise<UmidsizHolati> {
  // 6.10 — «ADMIN qarzni hisobdan chiqara oladi»
  const f = await ruxsatTalab('kassa.storno');

  const mijozId = Number(matnMaydon(forma, 'mijozId'));
  const summa = matnMaydon(forma, 'summa').trim();
  const valyuta = matnMaydon(forma, 'valyuta') === 'USD' ? 'USD' : 'SOM';
  const sabab = matnMaydon(forma, 'sabab');

  if (!Number.isSafeInteger(mijozId) || mijozId <= 0) {
    return { xato: 'Mijoz tanlanmagan', bajarildi: false };
  }
  if (!PUL_SHAKLI.test(summa) || Number(summa) <= 0) {
    return { xato: 'Summani kiriting', bajarildi: false };
  }

  try {
    await umidsizQarz(
      ulanishOl(),
      { mijozId, summa, valyuta, sabab },
      f.filialId,
      f.xodimId,
    );
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Hisobdan chiqarishda xato yuz berdi',
      bajarildi: false,
    };
  }

  revalidatePath(`/mijoz/${String(mijozId)}`);
  return { xato: null, bajarildi: true };
}
