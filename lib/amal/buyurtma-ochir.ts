/**
 * lib/amal/buyurtma-ochir.ts — TZ 8.8 · 8.15 · 2.1-invariant
 *
 * BUTUN BUYURTMANI O'CHIRISH.
 *
 * ⚠️ «O'CHIRISH» NIMA DEGANI
 *
 *    Bazadan `DELETE` QILINMAYDI (§3). Buyurtmaning hamma
 *    pozitsiyasi `BEKOR` holatiga o'tadi, band qilingan material
 *    bo'shaydi va buyurtma ro'yxatdan yo'qoladi — «Bekor
 *    qilingan» filtrida ko'rinib turadi.
 *
 *    Sabab oddiy: buyurtma raqami chekda, botda, mijoz
 *    yozishmasida qolgan bo'lishi mumkin. Yozuv yo'q bo'lsa,
 *    keyin «B-2026-000184 nima bo'ldi?» degan savolga javob
 *    topilmasdi (2.3-invariant).
 *
 * ⚠️ UCHTA TO'SIQ BOR — ular pulni himoya qiladi:
 *
 *    1. To'lov qilingan — avval qaytarish kerak. Aks holda
 *       kassada egasiz pul qolardi.
 *    2. Topshirilgan pozitsiya bor — mahsulot mijozda. Uni
 *       «bekor qilindi» deb yozish yolg'on bo'lardi; to'g'ri
 *       yo'l — qaytarish (8.10).
 *    3. Ishlab chiqarishga kirgan pozitsiya bor — mato
 *       kesilgan bo'lishi mumkin (8.8). Avval ustadan qaytarib
 *       olinadi (8.6), keyin o'chiriladi.
 *
 *    Har uchalasi SABABNI aytadi, quruq «bo'lmadi» demaydi.
 */

import type postgres from 'postgres';
import { BiznesXato } from '@/lib/xato';
import { bekorQilinadimi, yopiqmi, type PozitsiyaHolati } from '@/lib/domain/buyurtma';
import { bandniBoshatTx } from './band';

export interface OchirishNatijasi {
  /** Nechta pozitsiya bekor qilindi */
  readonly bekorQilindi: number;
  /** Bo'shatilgan band yozuvlari soni */
  readonly boshatilganBand: number;
}

interface PozitsiyaQatori {
  readonly id: number;
  readonly holat: string;
}

/**
 * Buyurtmani to'liq bekor qiladi.
 *
 * ⚠️ HAMMASI BITTA TRANZAKSIYADA (2.1-invariant): yarim bekor
 *    qilingan buyurtma — eng yomon holat. Bir pozitsiya bo'shab,
 *    ikkinchisi band bo'lib qolsa, ombor qoldig'i noto'g'ri
 *    ko'rinardi va uni faqat qo'lda topib bo'lardi.
 */
export async function buyurtmaniOchir(
  ulanish: postgres.Sql,
  buyurtmaId: number,
  sabab: string,
  filialId: number,
  xodimId: number,
): Promise<OchirishNatijasi> {
  if (sabab.trim() === '') {
    throw new BiznesXato('BUYURTMA_SABAB_KERAK', "o'chirish sababi majburiy");
  }

  return ulanish.begin(async (tx) => {
    const bosh = await tx<{ id: number; raqam: string; sotgan_filial_id: number }[]>`
      SELECT id, raqam, sotgan_filial_id FROM buyurtma
      WHERE id = ${buyurtmaId}
      FOR UPDATE`;

    const b = bosh[0];
    if (b === undefined) {
      throw new BiznesXato('BUYURTMA_TOPILMADI', String(buyurtmaId));
    }

    /** §9.4 — o'z filialining buyurtmasi (20.4) */
    if (b.sotgan_filial_id !== filialId) {
      throw new BiznesXato('BUYURTMA_TOPILMADI', String(buyurtmaId));
    }

    /**
     * ⚠️ 1-to'siq: TO'LOV.
     *
     *    Kassa yozuvi ham, mijoz hisobidagi avans ham tekshiriladi:
     *    pul naqd kelmasdan, mijozning avansidan yechilgan bo'lishi
     *    ham mumkin.
     */
    const tolov = await tx<{ summa: string }[]>`
      SELECT COALESCE(SUM(summa), 0)::text AS summa
      FROM kassa_yozuv
      WHERE manba_turi = 'buyurtma' AND manba_id = ${buyurtmaId} AND summa > 0`;

    if (Number(tolov[0]?.summa ?? '0') > 0) {
      throw new BiznesXato(
        'BUYURTMA_TOLANGAN',
        `bu buyurtma bo'yicha ${tolov[0]?.summa ?? '0'} to'langan — ` +
          `avval pulni qaytaring, keyin buyurtma o'chiriladi`,
      );
    }

    const pozitsiyalar = await tx<PozitsiyaQatori[]>`
      SELECT id, holat FROM buyurtma_pozitsiya
      WHERE buyurtma_id = ${buyurtmaId}
      ORDER BY tartib
      FOR UPDATE`;

    /** ⚠️ 2-to'siq: mahsulot mijozda */
    const topshirilgan = pozitsiyalar.filter((p) => p.holat === 'TOPSHIRILDI').length;
    if (topshirilgan > 0) {
      throw new BiznesXato(
        'BUYURTMA_TOPSHIRILGAN',
        `${String(topshirilgan)} ta pozitsiya mijozga topshirilgan — ` +
          `buyurtma o'chirilmaydi, qaytarish rasmiylashtiriladi (8.10)`,
      );
    }

    /**
     * ⚠️ 3-to'siq: ishlab chiqarishga kirgan.
     *
     *    `bekorQilinadimi` domainda (§2.2) — bir xil qoida bitta
     *    joyda. Yopiq holatdagilar (allaqachon bekor, rad etilgan)
     *    to'smaydi: ular ustidan ish qilinmaydi.
     */
    const ochiq = pozitsiyalar.filter((p) => !yopiqmi(p.holat as PozitsiyaHolati));
    const qamalgan = ochiq.filter((p) => !bekorQilinadimi(p.holat as PozitsiyaHolati));

    if (qamalgan.length > 0) {
      throw new BiznesXato(
        'BUYURTMA_ISHDA',
        `${String(qamalgan.length)} ta pozitsiya ishlab chiqarishga kirgan — ` +
          `avval ustadan qaytarib oling (8.6), keyin o'chiring`,
      );
    }

    let boshatilgan = 0;
    for (const p of ochiq) {
      boshatilgan += await bandniBoshatTx(tx, p.id, 'BEKOR', xodimId, sabab.trim());

      await tx`
        UPDATE buyurtma_pozitsiya
        SET holat = 'BEKOR', ozgartirildi = now(), ozgartirdi_id = ${xodimId}
        WHERE id = ${p.id}`;
    }

    /**
     * ⚠️ Audit yozuvi BUYURTMA darajasida, pozitsiyalar
     *    darajasida emas: bu bitta qaror edi, uni bitta qator
     *    bilan ko'rsatish kerak. Aks holda jurnalda o'nta
     *    «BEKOR» qatori paydo bo'lib, sabab yo'qolardi.
     */
    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${b.sotgan_filial_id}, 'BEKOR', 'buyurtma', ${buyurtmaId},
              ${tx.json({ pozitsiyalar: pozitsiyalar.map((p) => p.holat) })},
              ${tx.json({
                holat: 'BEKOR',
                bekor_qilindi: ochiq.length,
                boshatilgan_band: boshatilgan,
              })},
              ${sabab.trim()})`;

    return { bekorQilindi: ochiq.length, boshatilganBand: boshatilgan };
  });
}
