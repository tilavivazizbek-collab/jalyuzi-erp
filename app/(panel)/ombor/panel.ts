/**
 * TZ 11.11 — Ombor sahifasi paneli. 2026-10-17
 *
 *   Holat : qoldiq qiymati · ostatkalar soni va qiymati · sotilmagan tayyor mahsulot
 *   Davr  : kirim summasi · sarflangan tannarx · chiqindi va brak
 *   Diqqat: kam qolgan · tugagan · ustamasi chegaradan past · 6 oy qimirlamagan
 *
 * ⚠️ PUL FAQAT TANNARXNI KO'RADIGANGA (11.10): bu yerdagi summalar tannarx.
 *    Ruxsat yo'q bo'lsa soni ko'rinadi, summa yo'q.
 * ⚠️ Manbalar: omborQiymati, muzlaganPulHisoboti (11.7.6), holatSanoqlari
 *    (ombor ro'yxati filtri bilan bir), ustamaHisoboti, chiqindiVaBrak; kirim
 *    va sarf — ombor jurnalidan (sarf = KESIM − qaytgan OSTATKA, 11.7 dagi kabi).
 */

import Decimal from 'decimal.js';
import { ulanishOl } from '@/lib/db';
import { davrYasa, oldingiShuKungacha, type Davr } from '@/lib/domain/hisobot/davr';
import { pulKorsat, pulMatn, som } from '@/lib/domain/pul';
import { VAQT_ZONASI } from '@/lib/domain/sana';
import type { PanelBandi } from '../modul-panel';
import { chiqindiVaBrak, muzlaganPulHisoboti, omborQiymati, ustamaHisoboti } from '../hisobot/malumot';
import { filialQoldigi } from './malumot';
import { holatSanoqlari } from './qoldiq-filtr';

async function jurnalSummalari(filialId: number, d: Davr): Promise<{ kirim: string; sarf: string; hujjat: number }> {
  const sql = ulanishOl();
  const [j, k] = await Promise.all([
    sql<{ kirim: string | null; sarf: string | null }[]>`
      SELECT SUM(oh.tannarx_summa) FILTER (WHERE oh.turi = 'KIRIM')::numeric(14,2)::text AS kirim,
             (-SUM(oh.tannarx_summa) FILTER (WHERE oh.turi IN ('KESIM','OSTATKA')))::numeric(14,2)::text AS sarf
      FROM ombor_harakat oh
      WHERE oh.filial_id = ${filialId} AND oh.sana >= ${d.boshi} AND oh.sana < ${d.oxiri}`,
    sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM kirim
      -- Hujjat SANASI bo'yicha (orqa sanali kirim o'z oyiga tushadi), Toshkent kuni
      WHERE filial_id = ${filialId} AND holat = 'FAOL'
        AND sana >= (${d.boshi}::timestamptz AT TIME ZONE ${VAQT_ZONASI})::date
        AND sana < (${d.oxiri}::timestamptz AT TIME ZONE ${VAQT_ZONASI})::date`,
  ]);
  return { kirim: j[0]?.kirim ?? '0', sarf: j[0]?.sarf ?? '0', hujjat: k[0]?.n ?? 0 };
}

export async function omborPaneli(
  filialId: number,
  /** 11.10 — tannarxniKoradimi(f) */
  pul: boolean,
): Promise<{ holat: PanelBandi[]; davr: PanelBandi[]; diqqat: PanelBandi[] }> {
  const davr = davrYasa('OY', new Date());
  const oldin = oldingiShuKungacha(davr);
  const [qiymat, muzlagan, sanoq, ustama, chiqindi, joriy, otgan] = await Promise.all([
    omborQiymati(filialId),
    muzlaganPulHisoboti(filialId),
    filialQoldigi(filialId).then(holatSanoqlari),
    ustamaHisoboti(filialId),
    chiqindiVaBrak(filialId, davr),
    jurnalSummalari(filialId, davr),
    jurnalSummalari(filialId, oldin),
  ]);
  const so = (x: string): string => pulKorsat(som(x));
  const chiqindiJami = chiqindi.reduce((y, c) => y.plus(c.qiymat), new Decimal(0)).toFixed(2);
  const oldinMatn = "o'tgan oyning shu kunigacha";

  return {
    holat: [
      ...(pul ? [{ nom: 'Qoldiq qiymati', qiymat: so(qiymat), izoh: 'tannarx bo‘yicha', havola: '/hisobot/ombor' }] : []),
      {
        nom: 'Ostatkalar',
        qiymat: `${String(muzlagan.ostatkalar.soni)} ta`,
        izoh: pul ? so(pulMatn(muzlagan.ostatkalar.qiymat)) : null,
        havola: '/hisobot/ombor',
      },
      {
        nom: 'Sotilmagan tayyor mahsulot',
        qiymat: `${String(muzlagan.tayyorMahsulot.soni)} ta`,
        izoh: pul ? so(pulMatn(muzlagan.tayyorMahsulot.qiymat)) : null,
        havola: '/hisobot/ombor',
      },
    ],
    davr: pul
      ? [
          {
            nom: 'Kirim',
            qiymat: so(joriy.kirim),
            izoh: `${String(joriy.hujjat)} hujjat · ${oldinMatn}: ${so(otgan.kirim)}`,
            havola: '/ombor/kirim',
          },
          { nom: 'Sarflangan tannarx', qiymat: so(joriy.sarf), izoh: `${oldinMatn}: ${so(otgan.sarf)}` },
          { nom: 'Chiqindi va brak', qiymat: so(chiqindiJami), izoh: 'tannarx bo‘yicha', havola: '/hisobot/ombor' },
        ]
      : [{ nom: 'Kirim hujjatlari', qiymat: String(joriy.hujjat), izoh: `${oldinMatn}: ${String(otgan.hujjat)}`, havola: '/ombor/kirim' }],
    diqqat: [
      { nom: 'Kam qolgan', qiymat: String(sanoq.kam), havola: '/ombor?holat=kam', ton: sanoq.kam > 0 ? 'ogoh' : null },
      { nom: 'Tugagan', qiymat: String(sanoq.tugagan), havola: '/ombor?holat=tugagan', ton: sanoq.tugagan > 0 ? 'xavf' : null },
      ...(pul
        ? [
            {
              nom: 'Ustamasi chegaradan past',
              qiymat: String(ustama.pastSoni),
              havola: '/hisobot/ombor',
              ton: ustama.pastSoni > 0 ? ('ogoh' as const) : null,
            },
          ]
        : []),
      {
        nom: '6 oy qimirlamagan',
        qiymat: String(muzlagan.qimirlamagan.soni),
        izoh: pul && muzlagan.qimirlamagan.soni > 0 ? so(pulMatn(muzlagan.qimirlamagan.qiymat)) : null,
        havola: '/hisobot/ombor',
        ton: muzlagan.qimirlamagan.soni > 0 ? 'ogoh' : null,
      },
    ],
  };
}
