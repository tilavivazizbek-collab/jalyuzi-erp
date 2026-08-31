'use server';

/**
 * app/(panel)/buyurtma/ish-amal.ts — TZ 8.5 · 7.6 · 13.8
 *
 * ⚠️ NEGA KERAK
 *
 *    «Ishni oldim» va «Tugatdim» faqat TELEGRAM BOTDA yozilgan
 *    edi, bot esa hali ishga tushirilmagan. Natijada buyurtma
 *    tasdiqlangandan keyin QOTIB QOLARDI: pozitsiya hech qachon
 *    TAYYOR bo'lmasdi, «Topshirish» tugmasi chiqmasdi va pul
 *    olib bo'lmasdi (2026-08-30, egasi aytdi).
 *
 * ⚠️ MANTIQ TAKRORLANMAYDI (§2.2): bu yerda faqat forma o'qiladi,
 *    ish esa `lib/amal/ish.ts` da — bot ham o'sha funksiyalarni
 *    chaqiradi.
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { ishniOl, tugatdim } from '@/lib/amal/ish';
import { pozitsiyaStavkasi } from '@/lib/amal/stavka';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { matnMaydon } from '../forma-yordamchi';
import { xatoXabari } from '../xato-xabari';
import type { IshHolati } from './ish-holat';

/**
 * TZ 8.5 — ishni olish.
 *
 * ⚠️ 10.12 — stavka topilmasa ish BARIBIR olinadi, haq 0 bo'ladi.
 *    Ish to'xtab qolgandan ko'ra haqni keyin to'g'rilash yengil.
 */
export async function ishniBoshlaAmali(
  pozitsiyaId: number,
  _oldingi: IshHolati,
  forma: FormData,
): Promise<IshHolati> {
  const f = await ruxsatTalab('ish.ol');

  /**
   * ⚠️ Usta TANLANADI: veb-da ishni ko'pincha admin yozadi
   *    («usta keldi, ishni oldi»), botda esa ustaning o'zi
   *    bosadi. Bo'sh qolsa — o'zi oladi.
   */
  const tanlangan = Number(matnMaydon(forma, 'ustaId'));
  const ustaId = Number.isSafeInteger(tanlangan) && tanlangan > 0 ? tanlangan : f.xodimId;

  const sql = ulanishOl();

  try {
    const stavka = await pozitsiyaStavkasi(sql, pozitsiyaId, ustaId);
    await ishniOl(sql, pozitsiyaId, ustaId, stavka.qiymat, stavka.birlik);
  } catch (x) {
    return { xato: await xatoXabari(x, 'buyurtma/ish-amal', "Ishni boshlab bo'lmadi") };
  }

  revalidatePath('/buyurtma');
  return { xato: null };
}

/**
 * TZ 7.6 · 13.8 — «Tugatdim».
 *
 * ⚠️ Usta QOLGAN BO'LAK o'lchamini o'zi kiritadi: kesim hech
 *    qachon qog'ozdagidek chiqmaydi, egrilik 5–10 sm bo'ladi.
 *    Tizim taxmin qilsa, ombordagi qoldiq haqiqatdan uzoqlashardi.
 */
export async function tugatdimAmali(
  pozitsiyaId: number,
  _oldingi: IshHolati,
  forma: FormData,
): Promise<IshHolati> {
  const f = await ruxsatTalab('ish.tugat');

  const eni = Number(matnMaydon(forma, 'qoldiqEni'));
  const boyi = Number(matnMaydon(forma, 'qoldiqBoyi'));

  if (!Number.isFinite(eni) || !Number.isFinite(boyi) || eni < 0 || boyi < 0) {
    return { xato: "Qolgan bo'lak o'lchami noto'g'ri" };
  }

  const sql = ulanishOl();

  try {
    /**
     * Chegaralar MATERIALDAN olinadi (5.5) — qoldiq yaroqsizmi
     * yoki ostatka bo'lib qoladimi, shu hal qiladi.
     */
    const ch = await sql<
      { yaroqsiz: string | null; kam: string | null }[]
    >`
      SELECT m.yaroqsiz_chegara_m::text AS yaroqsiz,
             m.kam_ishlatiladigan_m::text AS kam
      FROM band bd
      JOIN bolak bo ON bo.id = bd.bolak_id
      JOIN material m ON m.id = bo.material_id
      WHERE bd.buyurtma_pozitsiya_id = ${pozitsiyaId} AND bd.holat = 'FAOL'
      LIMIT 1`;

    const chegaralar = {
      yaroqsizM: ch[0]?.yaroqsiz === undefined || ch[0].yaroqsiz === null
        ? null
        : Number(ch[0].yaroqsiz),
      kamIshlatiladiganM:
        ch[0]?.kam === undefined || ch[0].kam === null ? null : Number(ch[0].kam),
    };

    await tugatdim(
      sql,
      {
        pozitsiyaId,
        manba: matnMaydon(forma, 'manba') === 'RULON' ? 'RULON' : 'OSTATKA',
        qoldiq: {
          eniM: eni,
          boyiM: boyi,
          /** Belgilanmasa qoldiq chiqindiga ketadi (7.5) */
          saqlansinmi: matnMaydon(forma, 'saqlansinmi') === 'ha',
        },
        /** Ogohlantirish ekranda ko'rsatilgan va odam davom etgan */
        ogohTasdiqlandi: true,
        izoh: matnMaydon(forma, 'izoh') === '' ? null : matnMaydon(forma, 'izoh'),
      },
      chegaralar,
      f.xodimId,
    );
  } catch (x) {
    return { xato: await xatoXabari(x, 'buyurtma/ish-amal', "Ishni tugatib bo'lmadi") };
  }

  revalidatePath('/buyurtma');
  revalidatePath('/ombor');
  return { xato: null };
}
