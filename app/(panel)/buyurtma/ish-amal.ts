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
import { ishniOl, tugatdim, type KesimKirimi } from '@/lib/amal/ish';
import { pozitsiyaStavkasi } from '@/lib/amal/stavka';
import type { Olcham } from '@/lib/domain/kesish';
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
 *
 * ⚠️ HAR MATO uchun alohida qator keladi (2026-09-03 tuzatishi).
 *    Rollo — old va orqa mato, Dikke — uchta: har biri o'z
 *    bo'lagidan kesiladi va o'z qoldig'ini beradi. Ilgari faqat
 *    birinchisi yechilar, qolganlari omborda band bo'lib qolardi.
 */
export async function tugatdimAmali(
  pozitsiyaId: number,
  _oldingi: IshHolati,
  forma: FormData,
): Promise<IshHolati> {
  const f = await ruxsatTalab('ish.tugat');

  const xom = ((): unknown => {
    const matn = matnMaydon(forma, 'kesimlar');
    if (matn === '') return null;
    try {
      return JSON.parse(matn);
    } catch {
      return null;
    }
  })();

  if (!Array.isArray(xom) || xom.length === 0) {
    return { xato: "Qolgan bo'lak o'lchamini kiriting" };
  }

  /**
   * ⚠️ Brauzerdan kelgan JSON — har maydon TEKSHIRILADI (§9.4).
   *
   * ⚠️ IKKI QOLDIQ keladi (7.4): rulonning davomi va yon kesma.
   *    Ekran ularni `kesimRejasi()` bilan hisoblab ko'rsatadi, usta
   *    esa tasdiqlaydi yoki tuzatadi. Bo'sh qoldirilgani — «bunday
   *    bo'lak qolmadi» degani.
   */
  interface XomKesim {
    readonly bandId?: unknown;
    readonly manba?: unknown;
    readonly manbaEni?: unknown;
    readonly manbaBoyi?: unknown;
    readonly kesmaEni?: unknown;
    readonly kesmaBoyi?: unknown;
    readonly saqlansinmi?: unknown;
  }

  const kesimlar: KesimKirimi[] = [];

  /** Bo'sh yoki nol o'lcham — bunday bo'lak qolmagan */
  const olcham = (e: unknown, b: unknown): Olcham | null | 'XATO' => {
    const eni = Number(e ?? 0);
    const boyi = Number(b ?? 0);
    if (!Number.isFinite(eni) || !Number.isFinite(boyi) || eni < 0 || boyi < 0) {
      return 'XATO';
    }
    return eni > 0 && boyi > 0 ? { eniM: eni, boyiM: boyi } : null;
  };

  for (const x of xom as XomKesim[]) {
    const bandId = Number(x.bandId);

    if (!Number.isSafeInteger(bandId) || bandId <= 0) {
      return { xato: "Qaysi mato ekani aniqlanmadi — sahifani yangilang" };
    }

    const manbaQoldiq = olcham(x.manbaEni, x.manbaBoyi);
    const kesma = olcham(x.kesmaEni, x.kesmaBoyi);
    if (manbaQoldiq === 'XATO' || kesma === 'XATO') {
      return { xato: "Qolgan bo'lak o'lchami noto'g'ri" };
    }

    kesimlar.push({
      bandId,
      manba: x.manba === 'RULON' ? 'RULON' : 'OSTATKA',
      qoldiqlar: {
        manbaQoldiq,
        kesma,
        /** Belgilanmasa yon kesma chiqindiga ketadi (7.5) */
        kesmaSaqlansinmi: x.saqlansinmi === true,
      },
    });
  }

  try {
    /**
     * ⚠️ Chegaralar endi `tugatdim` ichida, HAR MATERIALDAN
     *    alohida o'qiladi (5.5). Ilgari shu yerda bitta so'rov
     *    `LIMIT 1` bilan olinar va bir materialning chegarasi
     *    boshqa matoga ham qo'llanardi.
     */
    await tugatdim(
      ulanishOl(),
      {
        pozitsiyaId,
        kesimlar,
        /** Ogohlantirish ekranda ko'rsatilgan va odam davom etgan */
        ogohTasdiqlandi: true,
        izoh: matnMaydon(forma, 'izoh') === '' ? null : matnMaydon(forma, 'izoh'),
      },
      f.xodimId,
    );
  } catch (x) {
    return { xato: await xatoXabari(x, 'buyurtma/ish-amal', "Ishni tugatib bo'lmadi") };
  }

  revalidatePath('/buyurtma');
  revalidatePath('/ombor');
  return { xato: null };
}
