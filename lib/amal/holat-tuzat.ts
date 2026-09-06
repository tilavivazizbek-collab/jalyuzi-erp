/**
 * lib/amal/holat-tuzat.ts — TZ 8.2 · 8.3 · 2.4-invariant
 *
 * POZITSIYA HOLATINI QO'LDA TO'G'RILASH — faqat admin.
 *
 * ⚠️ BU ODATDAGI YO'L EMAS
 *
 *    Holat o'z-o'zidan o'zgaradi: usta ishni olganda, tugatganda,
 *    mahsulot topshirilganda. Har o'tish o'z ishini ham bajaradi —
 *    mato ombordan yechiladi, ustaga haq yoziladi, mijozga xabar
 *    ketadi.
 *
 *    Bu funksiya faqat QOTIB QOLGAN holat uchun: masalan mahsulot
 *    mijozga berilgan, lekin tizimda «tayyor» bo'lib turibdi.
 *
 * ⚠️ IKKI O'TISH TAQIQLANGAN — sababi quyida, `TAQIQLANGAN` da.
 *
 * ⚠️ Egasining qarori (2026-09-05): «haqiqiy qadamlar + sababli
 *    tuzatish». Sabab MAJBURIY va audit jurnaliga tushadi (2.4).
 */

import type postgres from 'postgres';
import { bandniBoshatTx } from './band';
import {
  POZITSIYA_HOLATLARI,
  yopiqmi,
  type PozitsiyaHolati,
} from '@/lib/domain/buyurtma';
import { BiznesXato } from '@/lib/xato';

export interface HolatTuzatishNatijasi {
  readonly buyurtmaRaqam: string;
  readonly tartib: number;
  readonly eskiHolat: string;
  readonly yangiHolat: string;
  /** Bo'shatilgan band soni — mato omborga qaytdi */
  readonly boshatilganBand: number;
}

/**
 * ⚠️ NEGA BU IKKI O'TISH TAQIQLANGAN
 *
 * Qolgan o'tishlarda holat shunchaki YORLIQ — uni to'g'rilash hech
 * nimani buzmaydi. Bu ikkisi esa boshqacha: ular ODATDA yon ta'sir
 * bilan birga keladi va yon ta'sirni keyin tiklab bo'lmaydi.
 *
 *   ISHLAB_CHIQARILMOQDA — usta biriktirilishi va stavka qotishi
 *     kerak (10.10). Qo'lda qo'yilsa pozitsiya ustasiz qoladi va
 *     «Tugatdim» ishlamaydi.
 *
 *   TAYYOR / TAYYOR_YOLDA — mato ombordan YECHILISHI, kesim uch
 *     qatori yozilishi va ustaga haq hisoblanishi kerak (7.6, 10.10).
 *     Qo'lda qo'yilsa: ombor qoldig'i haqiqatdan ko'p ko'rinadi,
 *     tannarx yozilmaydi, ustaga haq to'lanmaydi — va buni oylar
 *     o'tib sezish deyarli imkonsiz.
 *
 * Bu holatlarga o'tish uchun HAQIQIY yo'l bor: «Ishga oldim» va
 * «Tugatdim». Shuning uchun bu yerda rad etiladi.
 */
const TAQIQLANGAN: readonly PozitsiyaHolati[] = [
  'ISHLAB_CHIQARILMOQDA',
  'TAYYOR',
  'TAYYOR_YOLDA',
];

/** Ekran shu ro'yxatni ko'rsatadi — qoida bir joyda (§2.2). */
export function tuzatishMumkinmi(h: PozitsiyaHolati): boolean {
  return !TAQIQLANGAN.includes(h);
}

export async function pozitsiyaHolatiniTuzat(
  ulanish: postgres.Sql,
  kirim: {
    readonly pozitsiyaId: number;
    readonly yangiHolat: string;
    readonly sabab: string;
  },
  xodimId: number,
): Promise<HolatTuzatishNatijasi> {
  const sabab = kirim.sabab.trim();
  if (sabab === '') {
    throw new BiznesXato('ISH_SABAB_KERAK', 'holatni to’g’rilash sababi');
  }

  if (!POZITSIYA_HOLATLARI.includes(kirim.yangiHolat as PozitsiyaHolati)) {
    throw new BiznesXato('POZITSIYA_OTISH_MUMKIN_EMAS', kirim.yangiHolat);
  }

  const yangi = kirim.yangiHolat as PozitsiyaHolati;

  if (!tuzatishMumkinmi(yangi)) {
    throw new BiznesXato('HOLAT_QOLDA_QOYILMAYDI', yangi);
  }

  return ulanish.begin(async (tx) => {
    const q = await tx<
      {
        id: number;
        holat: string;
        tartib: number;
        raqam: string;
        filial_id: number;
      }[]
    >`
      SELECT p.id, p.holat, p.tartib, b.raqam,
             b.ishlab_chiqaruvchi_filial_id AS filial_id
      FROM buyurtma_pozitsiya p
      JOIN buyurtma b ON b.id = p.buyurtma_id
      WHERE p.id = ${kirim.pozitsiyaId}
      FOR UPDATE OF p`;

    const p = q[0];
    if (p === undefined) {
      throw new BiznesXato('POZITSIYA_TOPILMADI', String(kirim.pozitsiyaId));
    }

    if (p.holat === yangi) {
      throw new BiznesXato('POZITSIYA_OTISH_MUMKIN_EMAS', `allaqachon ${yangi}`);
    }

    /**
     * ⚠️ YOPIQ HOLATGA o'tilsa band BO'SHATILADI.
     *
     *    Aks holda mato pozitsiyaga biriktirilgan holda qolib
     *    ketardi: omborda «band» bo'lib turadi, lekin uni hech kim
     *    ishlatmaydi (2.1 — yarim yechilgan holat bo'lmaydi).
     */
    const boshatilgan = yopiqmi(yangi)
      ? await bandniBoshatTx(tx, p.id, 'BEKOR', xodimId, `Holat to’g’rilandi: ${sabab}`)
      : 0;

    await tx`
      UPDATE buyurtma_pozitsiya
      SET holat = ${yangi}, ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${kirim.pozitsiyaId}`;

    /**
     * TZ 2.4 — ALOHIDA amal nomi bilan tushadi.
     *
     * ⚠️ `HOLAT_QOLDA_TUZATILDI` — odatdagi o'tishdan farq qiladi va
     *    hisobotda ajratib olinadi. «Bu pozitsiya nega to'satdan
     *    topshirilgan bo'lib qoldi?» degan savolga javob shu yerda.
     */
    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${p.filial_id}, 'HOLAT_QOLDA_TUZATILDI',
              'buyurtma_pozitsiya', ${kirim.pozitsiyaId},
              ${tx.json({ holat: p.holat })},
              ${tx.json({ holat: yangi, band_boshatildi: boshatilgan })},
              ${sabab})`;

    return {
      buyurtmaRaqam: p.raqam,
      tartib: p.tartib,
      eskiHolat: p.holat,
      yangiHolat: yangi,
      boshatilganBand: boshatilgan,
    };
  });
}
