'use server';

/**
 * app/(panel)/kassa/amal.ts — TZ 12.7 · 12.15 · QISM 1 §9.4 · Q-25
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { kassaStorno, topshiriqniQabulQil } from '@/lib/amal/kassa';
import { kunniQaytaOch, kunniYop } from '@/lib/amal/kun-yopish';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { matnMaydon } from '../forma-yordamchi';
import { biznesXatosimi } from '@/lib/xato';
import type { KassaAmalHolati, KunHolatiForma } from './holat';

/** TZ 12.15 — storno, sabab MAJBURIY. */
export async function stornoAmali(
  _oldingi: KassaAmalHolati,
  forma: FormData,
): Promise<KassaAmalHolati> {
  const f = await ruxsatTalab('kassa.storno');

  const yozuvId = Number(matnMaydon(forma, 'yozuvId'));
  const sabab = matnMaydon(forma, 'sabab');

  if (!Number.isSafeInteger(yozuvId) || yozuvId <= 0) {
    return { xato: 'Yozuv tanlanmagan', bajarildi: false };
  }

  // Q-25 — boshqa filial kassasiga tegib bo'lmaydi
  const sql = ulanishOl();
  const tegishli = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM kassa_yozuv y
    JOIN kassa k ON k.id = y.kassa_id
    WHERE y.id = ${yozuvId} AND k.filial_id = ${f.filialId}`;

  if ((tegishli[0]?.n ?? 0) === 0) {
    return { xato: 'Kassa yozuvi topilmadi', bajarildi: false };
  }

  try {
    await kassaStorno(sql, yozuvId, sabab, f.xodimId);
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Storno qilishda xato yuz berdi',
      bajarildi: false,
    };
  }

  revalidatePath('/kassa');
  return { xato: null, bajarildi: true };
}

/**
 * TZ 12.7 — admin topshiriqni qabul qiladi.
 *
 * ⚠️ TZ 12.4 — pul AYNAN SHU PAYTDA ko'chadi, jo'natilganda emas.
 */
export async function topshiriqQabulAmali(
  _oldingi: KassaAmalHolati,
  forma: FormData,
): Promise<KassaAmalHolati> {
  const f = await ruxsatTalab('kassa.barcha.kor');

  const topshiriqId = Number(matnMaydon(forma, 'topshiriqId'));
  if (!Number.isSafeInteger(topshiriqId) || topshiriqId <= 0) {
    return { xato: 'Topshiriq tanlanmagan', bajarildi: false };
  }

  const sql = ulanishOl();
  const tegishli = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM topshiriq t
    JOIN kassa k ON k.id = t.kimga_kassa_id
    WHERE t.id = ${topshiriqId} AND k.filial_id = ${f.filialId}`;

  if ((tegishli[0]?.n ?? 0) === 0) {
    return { xato: 'Topshiriq topilmadi', bajarildi: false };
  }

  try {
    await topshiriqniQabulQil(sql, topshiriqId, f.xodimId);
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Qabul qilishda xato yuz berdi',
      bajarildi: false,
    };
  }

  revalidatePath('/kassa');
  return { xato: null, bajarildi: true };
}

/**
 * TZ 12.14 · Q-25 — kassaga tegish huquqi.
 *
 * «Sotuvchi FAQAT O'Z KASSASINI ko'radi.» Shuning uchun o'z kassasi
 * bo'lmagan kassani yopish uchun `kassa.barcha.kor` ruxsati kerak.
 */
async function kassagaRuxsatmi(
  kassaId: number,
  filialId: number,
  xodimId: number,
  barchaniKoradi: boolean,
): Promise<boolean> {
  const q = await ulanishOl()<{ xodim_id: number | null }[]>`
    SELECT xodim_id FROM kassa
    WHERE id = ${kassaId} AND filial_id = ${filialId} AND faol = true`;

  const k = q[0];
  if (k === undefined) return false;
  return barchaniKoradi || k.xodim_id === xodimId;
}

/**
 * TZ 12.17 — kunni yopish.
 *
 * ⚠️ Farq bo'lsa izoh MAJBURIY, lekin yopish BLOKLANMAYDI — «sotuvchini
 *    uyiga qo'ymay turib bo'lmaydi».
 */
export async function kunniYopAmali(
  _oldingi: KunHolatiForma,
  forma: FormData,
): Promise<KunHolatiForma> {
  const f = await ruxsatTalab('kassa.oz.kor');

  const kassaId = Number(matnMaydon(forma, 'kassaId'));
  const sana = matnMaydon(forma, 'sana');
  const sanaldi = matnMaydon(forma, 'sanaldi').trim();
  const izoh = matnMaydon(forma, 'izoh').trim();

  if (!Number.isSafeInteger(kassaId) || kassaId <= 0) {
    return { xato: 'Kassa tanlanmagan', farq: null, yopildi: false };
  }
  if (!/^-?\d+(\.\d{1,2})?$/.test(sanaldi)) {
    return { xato: "Sanalgan summani kiriting", farq: null, yopildi: false };
  }

  const barchaniKoradi = ruxsatBormi(f, 'kassa.barcha.kor');
  if (!(await kassagaRuxsatmi(kassaId, f.filialId, f.xodimId, barchaniKoradi))) {
    return { xato: 'Kassa topilmadi', farq: null, yopildi: false };
  }

  try {
    const n = await kunniYop(
      ulanishOl(),
      { kassaId, sana, sanaldi, izoh: izoh === '' ? null : izoh },
      f.xodimId,
    );

    revalidatePath('/kassa');
    return { xato: null, farq: n.farq, yopildi: true };
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Kunni yopishda xato yuz berdi',
      farq: null,
      yopildi: false,
    };
  }
}

/** TZ 12.17 — admin kunni qayta ochadi, sabab MAJBURIY. */
export async function kunniQaytaOchAmali(
  _oldingi: KassaAmalHolati,
  forma: FormData,
): Promise<KassaAmalHolati> {
  const f = await ruxsatTalab('kassa.storno');

  const kunId = Number(matnMaydon(forma, 'kunId'));
  const sabab = matnMaydon(forma, 'sabab');

  if (!Number.isSafeInteger(kunId) || kunId <= 0) {
    return { xato: 'Kun tanlanmagan', bajarildi: false };
  }

  const sql = ulanishOl();
  const tegishli = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM kassa_kun k
    JOIN kassa ks ON ks.id = k.kassa_id
    WHERE k.id = ${kunId} AND ks.filial_id = ${f.filialId}`;

  if ((tegishli[0]?.n ?? 0) === 0) {
    return { xato: 'Kun yozuvi topilmadi', bajarildi: false };
  }

  try {
    await kunniQaytaOch(sql, kunId, sabab, f.xodimId);
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Qayta ochishda xato yuz berdi',
      bajarildi: false,
    };
  }

  revalidatePath('/kassa');
  return { xato: null, bajarildi: true };
}
