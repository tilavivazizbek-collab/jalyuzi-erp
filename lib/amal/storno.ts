/**
 * lib/amal/storno.ts — TZ 8.8 · 2.1 · 2.2-invariant · TZ 2.4
 *
 * Buyurtma STORNOSI — sotuvchining xatosini tuzatish.
 *
 * ⚠️ BEKOR QILISH BILAN ARALASHTIRILMAYDI
 *
 *    TZ 8.8: «Bekor qilish — REAL BIZNES HOLATI (mijoz fikridan
 *    qaytdi). Storno — XATO: buyurtma umuman bo'lmagan, sotuvchi
 *    noto'g'ri kiritgan. Faqat admin qiladi va HISOBOTDA ALOHIDA
 *    ko'rinadi.»
 *
 *    Farq hisobotda muhim: bekor qilingan buyurtma «mijoz voz
 *    kechdi» degan biznes ma'lumot, storno esa shunchaki xato yozuv.
 *    Ikkalasi bir qopga solinsa «nega bekorlar ko'p?» degan savolga
 *    javob topilmaydi.
 *
 * ⚠️ STORNO PULNI O'ZI QAYTARMAYDI. To'lov qilingan buyurtma
 *    stornolanmaydi: avval kassa yozuvi storno qilinadi (12.15), keyin
 *    buyurtma. Aks holda pul qayerga ketgani ikki xil joyda ikki xil
 *    ko'rinardi.
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { bandniBoshatTx } from './band';
import { bekorQilinadimi, type PozitsiyaHolati } from '@/lib/domain/buyurtma';
import { BiznesXato } from '@/lib/xato';

export interface StornoNatijasi {
  readonly buyurtmaRaqam: string;
  readonly bekorQilinganPozitsiya: number;
  readonly boshatilganBand: number;
  /** Mijoz qarzidan qaytarilgan summa */
  readonly qarzdanQaytdi: string;
}

/**
 * TZ 8.8 — buyurtmani storno qiladi.
 *
 * Bitta tranzaksiyada: hamma pozitsiya bekor bo'ladi, band bo'shaydi,
 * mijoz qarzi qaytariladi, buyurtmaga storno belgisi qo'yiladi va
 * audit yoziladi (2.1-invariant).
 */
export async function buyurtmaniStorno(
  ulanish: postgres.Sql,
  buyurtmaId: number,
  sabab: string,
  xodimId: number,
): Promise<StornoNatijasi> {
  if (sabab.trim() === '') {
    throw new BiznesXato('BUYURTMA_SABAB_KERAK', String(buyurtmaId));
  }

  return ulanish.begin(async (tx) => {
    const q = await tx<
      {
        id: number;
        raqam: string;
        mijoz_id: number | null;
        sotgan_filial_id: number;
        valyuta: string;
        kurs_snapshot: string | null;
        storno_sana: Date | null;
      }[]
    >`
      SELECT id, raqam, mijoz_id, sotgan_filial_id, valyuta,
             kurs_snapshot::text, storno_sana
      FROM buyurtma WHERE id = ${buyurtmaId} FOR UPDATE`;

    const b = q[0];
    if (b === undefined) throw new BiznesXato('BUYURTMA_TOPILMADI', String(buyurtmaId));

    if (b.storno_sana !== null) {
      throw new BiznesXato('BUYURTMA_STORNO_QILINGAN', b.raqam);
    }

    /**
     * ⚠️ 1-TO'SIQ: pul olingan bo'lsa storno YO'Q.
     *
     *    «Buyurtma umuman bo'lmagan» deyish uchun pul ham bo'lmasligi
     *    kerak. Avval kassa yozuvi storno qilinadi (12.15) — u o'z
     *    izini qoldiradi va kassa qoldig'i to'g'ri bo'lib qoladi.
     */
    const tolov = await tx<{ summa: string | null }[]>`
      SELECT SUM(summa)::text AS summa FROM kassa_yozuv
      WHERE manba_turi = 'buyurtma' AND manba_id = ${buyurtmaId} AND summa > 0`;

    if (new Decimal(tolov[0]?.summa ?? 0).greaterThan(0)) {
      throw new BiznesXato('BUYURTMA_TOLANGAN', b.raqam);
    }

    const pozitsiyalar = await tx<{ id: number; holat: string }[]>`
      SELECT id, holat FROM buyurtma_pozitsiya
      WHERE buyurtma_id = ${buyurtmaId}
      FOR UPDATE`;

    /**
     * ⚠️ 2-TO'SIQ: ish boshlangan bo'lsa storno YO'Q.
     *
     *    Mato kesilgan bo'lsa buyurtma «bo'lmagan» emas — u bo'lgan
     *    va zarar keltirgan. Bunday holatda bekor qilish yoki rad
     *    etish ishlatiladi (8.8).
     */
    const ochiq = pozitsiyalar.filter((p) => p.holat !== 'BEKOR');
    const qamalgan = ochiq.filter(
      (p) => !bekorQilinadimi(p.holat as PozitsiyaHolati),
    );

    if (qamalgan.length > 0) {
      throw new BiznesXato('BUYURTMA_ISHDA', b.raqam);
    }

    let boshatilgan = 0;
    for (const p of ochiq) {
      boshatilgan += await bandniBoshatTx(tx, p.id, 'BEKOR', xodimId, sabab.trim());
    }

    /**
     * ⚠️ Pozitsiyalar `BEKOR` bo'ladi — YANGI HOLAT QO'SHILMAYDI.
     *
     *    Shunda tushum, foyda va ombor hisobotlarining hammasi
     *    o'z-o'zidan to'g'ri ishlaydi: ular allaqachon `BEKOR` ni
     *    chiqarib tashlaydi. Storno esa buyurtmadagi BELGI bilan
     *    ajratiladi.
     */
    await tx`
      UPDATE buyurtma_pozitsiya
      SET holat = 'BEKOR', ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE buyurtma_id = ${buyurtmaId} AND holat <> 'BEKOR'`;

    /**
     * TZ 6.8 — qarz QAYTARILADI.
     *
     * ⚠️ Eski `SOTUV` qatori o'zgartirilmaydi (2.2-invariant) —
     *    teskari qator yoziladi. Yig'indi nolga tushadi va mijoz
     *    varaqasida «sotuv bor edi, storno qilindi» ko'rinib turadi.
     */
    const qarz = await tx<{ summa: string | null }[]>`
      SELECT SUM(summa)::text AS summa FROM mijoz_harakat
      WHERE manba_turi = 'buyurtma' AND manba_id = ${buyurtmaId} AND turi = 'SOTUV'`;

    const qaytdi = new Decimal(qarz[0]?.summa ?? 0);

    if (b.mijoz_id !== null && !qaytdi.isZero()) {
      await tx`
        INSERT INTO mijoz_harakat (mijoz_id, filial_id, turi, summa, valyuta,
                                   kurs_snapshot, manba_turi, manba_id, izoh,
                                   xodim_id)
        VALUES (${b.mijoz_id}, ${b.sotgan_filial_id}, 'SOTUV',
                ${qaytdi.negated().toFixed(2)}, ${b.valyuta}, ${b.kurs_snapshot},
                'buyurtma', ${buyurtmaId},
                ${`Buyurtma ${b.raqam} STORNO — ${sabab.trim()}`}, ${xodimId})`;
    }

    await tx`
      UPDATE buyurtma
      SET storno_sabab = ${sabab.trim()}, storno_sana = now(),
          storno_xodim_id = ${xodimId},
          ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${buyurtmaId}`;

    // TZ 2.4 — storno audit jurnaliga ALOHIDA amal bo'lib tushadi
    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                yangi_qiymat, izoh)
      VALUES (${xodimId}, ${b.sotgan_filial_id}, 'STORNO', 'buyurtma',
              ${buyurtmaId},
              ${tx.json({
                raqam: b.raqam,
                pozitsiya: ochiq.length,
                band_boshatildi: boshatilgan,
                qarzdan_qaytdi: qaytdi.toFixed(2),
              })},
              ${sabab.trim()})`;

    return {
      buyurtmaRaqam: b.raqam,
      bekorQilinganPozitsiya: ochiq.length,
      boshatilganBand: boshatilgan,
      qarzdanQaytdi: qaytdi.toFixed(2),
    };
  });
}
