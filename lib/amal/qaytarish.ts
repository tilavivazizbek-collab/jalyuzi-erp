/**
 * lib/amal/qaytarish.ts — TZ 8.10 · 8.8 · 11.4.1 · 12.6 · 2.1-invariant
 *
 * Mijozga qaytarish — POZITSIYA DARAJASIDA.
 *
 * ⚠️ TZ 8.10 — «Qaytariladigan summani SOTUVCHI O'ZI kiritadi. Tizim
 *    pozitsiya narxini taklif qiladi, sotuvchi mijoz bilan kelishib
 *    o'zgartiradi.»
 *
 *    «Ulush hisobi, foiz taqsimoti QILINMAYDI. Mijoz pulni pozitsiyaga
 *     bo'lib bermaydi — u shunchaki "800 ming beray" deydi.»
 *
 *    Shuning uchun bu yerda hech qanday proporsional hisob yo'q.
 *
 * ⚠️ «CHEGARA YO'Q — sotuvchi 0 ham kirita oladi.» Lekin izoh MAJBURIY
 *    va amal audit jurnalida qoladi.
 *
 * ⚠️ Ombor qoldig'iga TEGILMAYDI — mato allaqachon kesilgan (7.13).
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { kassaYozuviQoshTx } from './kassa';
import { kunYopiqmi } from './kun-yopish';
import { otishniTekshir, type PozitsiyaHolati } from '@/lib/domain/buyurtma';
import { tayyorMahsulotQarziniQaytarTx } from './filial-harakat';
import { BiznesXato } from '@/lib/xato';

/** TZ 8.10 — ortiqcha pul qayerga ketadi. */
export type OrtiqchaYol = 'NAQD' | 'AVANS';

export interface QaytarishKirimi {
  readonly pozitsiyaId: number;
  /** Sotuvchi kelishgan summa — 0 ham bo'lishi mumkin (8.10) */
  readonly summa: string;
  /** Naqd berilsa MAJBURIY */
  readonly kassaId: number | null;
  /**
   * TZ 8.10 — «Qaytariladigan summa qarzdan ko'p bo'lsa — ortiqchasi
   * uchun SOTUVCHI TANLAYDI: kassadan naqd berish yoki avans bo'lib
   * qolish.»
   */
  readonly ortiqchaYoli: OrtiqchaYol;
  /** TZ 8.10 — izoh MAJBURIY */
  readonly izoh: string;
}

export interface QaytarishNatijasi {
  readonly pozitsiyaNarxi: string;
  readonly qaytarildi: string;
  /** TZ 8.10 — «qaytarishdan ushlab qolindi» (11.4.1) */
  readonly ushlabQolindi: string;
  /** Qarzdan chegirilgan qism */
  readonly qarzdan: string;
  /** Kassadan naqd berilgan qism */
  readonly naqd: string;
  /** Mijoz avansiga o'tgan qism */
  readonly avans: string;
  readonly kassaYozuvId: number | null;
}

/**
 * TZ 8.10 — pozitsiyani qaytaradi.
 *
 * Pul taqsimoti: «avval mijoz QARZIDAN chegiriladi», qolgani sotuvchi
 * tanlagan yo'l bilan.
 */
export async function pozitsiyaniQaytar(
  ulanish: postgres.Sql,
  kirim: QaytarishKirimi,
  xodimId: number,
): Promise<QaytarishNatijasi> {
  if (kirim.izoh.trim() === '') {
    throw new BiznesXato('QAYTARISH_IZOH_KERAK', String(kirim.pozitsiyaId));
  }
  if (Number(kirim.summa) < 0) {
    throw new BiznesXato('TOLOV_MANFIY', String(kirim.pozitsiyaId));
  }

  return ulanish.begin(async (tx) => {
    const q = await tx<
      {
        id: number;
        holat: string;
        narx_snapshot: string;
        chegirma_summa: string | null;
        buyurtma_id: number;
        mijoz_id: number | null;
        sotgan_filial_id: number;
        valyuta: string;
        kurs_snapshot: string | null;
      }[]
    >`
      SELECT p.id, p.holat, p.narx_snapshot, p.chegirma_summa, p.buyurtma_id,
             b.mijoz_id, b.sotgan_filial_id, b.valyuta, b.kurs_snapshot
      FROM buyurtma_pozitsiya p
      JOIN buyurtma b ON b.id = p.buyurtma_id
      WHERE p.id = ${kirim.pozitsiyaId}
      FOR UPDATE OF p`;

    const p = q[0];
    if (p === undefined) {
      throw new BiznesXato('POZITSIYA_TOPILMADI', String(kirim.pozitsiyaId));
    }

    // TZ 8.10 — «Yopiq statusdan chiqish YO'Q. Qaytarilgan pozitsiya
    // qayta qaytarilmaydi, xato bo'lsa storno.»
    otishniTekshir(p.holat as PozitsiyaHolati, 'QAYTARILGAN');

    const valyuta = p.valyuta as 'SOM' | 'USD';
    const narx = new Decimal(p.narx_snapshot).minus(p.chegirma_summa ?? 0);
    const qaytariladi = new Decimal(kirim.summa);

    // 2.2-invariant — qarz jurnaldan chiqadi
    const qarzQatori = await tx<{ qarz: string | null }[]>`
      SELECT SUM(summa)::text AS qarz FROM mijoz_harakat
      WHERE mijoz_id = ${p.mijoz_id} AND valyuta = ${valyuta}`;

    const joriyQarz = new Decimal(qarzQatori[0]?.qarz ?? 0);

    /**
     * TZ 8.10 — «avval mijoz QARZIDAN chegiriladi».
     *
     * ⚠️ Mijozsiz buyurtmada qarz yo'q — «hammasi kassadan naqd».
     */
    const qarzdan =
      p.mijoz_id === null
        ? new Decimal(0)
        : Decimal.min(qaytariladi, Decimal.max(joriyQarz, 0));

    const qolgan = qaytariladi.minus(qarzdan);

    // Mijozsiz buyurtmada tanlov yo'q — naqd
    const naqdmi = p.mijoz_id === null || kirim.ortiqchaYoli === 'NAQD';
    const naqd = naqdmi ? qolgan : new Decimal(0);
    const avans = naqdmi ? new Decimal(0) : qolgan;

    let kassaYozuvId: number | null = null;

    if (naqd.greaterThan(0)) {
      if (kirim.kassaId === null) {
        throw new BiznesXato('KASSA_TOPILMADI', 'naqd qaytarish uchun kassa kerak');
      }

      const bugun = new Date().toISOString().slice(0, 10);
      if (await kunYopiqmi(tx, kirim.kassaId, bugun)) {
        throw new BiznesXato('KUN_YOPILGAN', bugun);
      }

      kassaYozuvId = await kassaYozuviQoshTx(
        tx,
        {
          kassaId: kirim.kassaId,
          kod: 'C6',
          summa: naqd.negated().toFixed(2),
          valyuta,
          manbaTuri: 'qaytarish',
          manbaId: kirim.pozitsiyaId,
          qator: 1,
          izoh: kirim.izoh.trim(),
        },
        xodimId,
      );
    }

    /**
     * Mijozning qarz harakati.
     *
     * ⚠️ Ishora: qaytarish qarzni KAMAYTIRADI (manfiy), avans esa
     *    qarzni MANFIYGA tushiradi — ikkalasi ham bir xil ishorada
     *    yoziladi va `SUM()` o'zi to'g'ri chiqadi (2.2-invariant).
     */
    if (p.mijoz_id !== null && qaytariladi.greaterThan(0)) {
      await tx`
        INSERT INTO mijoz_harakat (mijoz_id, filial_id, turi, summa, valyuta,
                                   kurs_snapshot, manba_turi, manba_id, izoh,
                                   xodim_id)
        VALUES (${p.mijoz_id}, ${p.sotgan_filial_id}, 'QAYTARISH',
                ${qaytariladi.negated().toFixed(2)}, ${valyuta}, ${p.kurs_snapshot},
                'qaytarish', ${kirim.pozitsiyaId}, ${kirim.izoh.trim()}, ${xodimId})`;
    }

    /**
     * TZ 8.10 — «Farq (pozitsiya narxi − qaytarilgan summa) KASSADA
     * QOLADI va hisobotda "qaytarishdan ushlab qolindi" deb alohida
     * chiqadi (11.4.1).»
     *
     * ⚠️ Bu XARAJAT EMAS — pul kassada qoldi. U hisobot uchun `xarajat`
     *    jadvaliga MANFIY yoziladi: xarajatni kamaytiradi, alohida
     *    daromad emas (8.17.6 dagi ushlanma bilan bir xil naqsh).
     */
    const ushlab = narx.minus(qaytariladi);
    if (ushlab.greaterThan(0)) {
      await tx`
        INSERT INTO xarajat (sana, filial_id, modda, summa, valyuta,
                             kassa_yozuv_id, manba_turi, manba_id, izoh, xodim_id)
        VALUES (current_date, ${p.sotgan_filial_id}, 'BOSHQA',
                ${ushlab.negated().toFixed(2)}, ${valyuta}, NULL,
                'qaytarish', ${kirim.pozitsiyaId},
                ${'Qaytarishdan ushlab qolindi (8.10)'}, ${xodimId})`;
    }

    /**
     * TZ 22.3.4 · EC-FQ-01 — filiallararo qarz TESKARI yoziladi.
     * Ushlab qolingan summa ham 50/50 bo'linadi (20.17.1).
     */
    await tayyorMahsulotQarziniQaytarTx(
      tx,
      kirim.pozitsiyaId,
      ushlab.greaterThan(0) ? ushlab.toFixed(2) : '0',
      xodimId,
    );

    await tx`
      UPDATE buyurtma_pozitsiya
      SET holat = 'QAYTARILGAN', ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${kirim.pozitsiyaId}`;

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${p.sotgan_filial_id}, 'QAYTARISH',
              'buyurtma_pozitsiya', ${kirim.pozitsiyaId},
              ${tx.json({ holat: p.holat, narx: narx.toFixed(2) })},
              ${tx.json({
                holat: 'QAYTARILGAN',
                qaytarildi: qaytariladi.toFixed(2),
                ushlab_qolindi: ushlab.toFixed(2),
                qarzdan: qarzdan.toFixed(2),
                naqd: naqd.toFixed(2),
                avans: avans.toFixed(2),
              })},
              ${kirim.izoh.trim()})`;

    return {
      pozitsiyaNarxi: narx.toFixed(2),
      qaytarildi: qaytariladi.toFixed(2),
      ushlabQolindi: ushlab.greaterThan(0) ? ushlab.toFixed(2) : '0.00',
      qarzdan: qarzdan.toFixed(2),
      naqd: naqd.toFixed(2),
      avans: avans.toFixed(2),
      kassaYozuvId,
    };
  });
}
