/**
 * Nazorat — odatdan tashqari amallar ma'lumoti. 2026-10-12.
 *
 * ⚠️ Manba uchta: audit jurnali (ko'pi), kassa kuni (yopishdagi farq),
 *    kassa yozuvi (tungi vaqt) va kirim (orqa sana). Guruhlash —
 *    `lib/domain/hisobot/nazorat.ts`.
 * ⚠️ FAQAT O'QIYDI.
 */

import { ulanishOl } from '@/lib/db';
import type { Davr } from '@/lib/domain/hisobot/davr';
import { kassaKodNomi } from '@/lib/domain/kassa-kod';
import type { NazoratHodisasi, NazoratTuri } from '@/lib/domain/hisobot/nazorat';
import { VAQT_ZONASI } from '@/lib/domain/sana';

/** Hujjat sanasidan necha kun keyin kiritilsa «orqa sana» */
const ORQA_SANA_KUN = 3;

/** audit_jurnal (amal, obyekt_turi) → nazorat turi */
function auditTuri(amal: string, obyektTuri: string): NazoratTuri | null {
  if (amal === 'STORNO') return obyektTuri === 'kassa_yozuv' ? 'KASSA_STORNO' : obyektTuri === 'ombor_harakat' ? 'OMBOR_STORNO' : null;
  if (amal === 'OMBORDAN_CHIQARILDI') return 'OMBOR_STORNO';
  if (amal === 'KUN_QAYTA_OCHILDI') return 'KUN_QAYTA_OCHILDI';
  if (amal === 'BEKOR' && obyektTuri === 'buyurtma') return 'BUYURTMA_BEKOR';
  if (amal === 'NARX_QOLDA') return 'NARX_QOLDA';
  if (amal === 'CHEGIRMA_LIMITIDAN_OSHDI') return 'CHEGIRMA_LIMITDAN';
  if (amal === 'HOLAT_QOLDA_TUZATILDI') return 'HOLAT_QOLDA';
  if (amal === 'UMIDSIZ_QARZ') return 'UMIDSIZ_QARZ';
  if (amal === 'RUXSAT_OZGARDI' || amal === 'SOZLAMA_OZGARDI' || amal === 'PAROL_OZGARTIRILDI') return 'RUXSAT_SOZLAMA';
  if (amal === 'KIRISH_BLOKLANDI') return 'KIRISH_BLOKLANDI';
  return null;
}

const AUDIT_AMALLARI = [
  'STORNO',
  'OMBORDAN_CHIQARILDI',
  'KUN_QAYTA_OCHILDI',
  'BEKOR',
  'NARX_QOLDA',
  'CHEGIRMA_LIMITIDAN_OSHDI',
  'HOLAT_QOLDA_TUZATILDI',
  'UMIDSIZ_QARZ',
  'RUXSAT_OZGARDI',
  'SOZLAMA_OZGARDI',
  'PAROL_OZGARTIRILDI',
  'KIRISH_BLOKLANDI',
];

const AMAL_NOMI: Readonly<Record<string, string>> = {
  RUXSAT_OZGARDI: 'Ruxsat',
  SOZLAMA_OZGARDI: 'Sozlama',
  PAROL_OZGARTIRILDI: 'Parol',
};

export async function nazoratHodisalari(filialId: number, davr: Davr): Promise<NazoratHodisasi[]> {
  const sql = ulanishOl();
  const [jurnal, kunlar, tungi, kirimlar] = await Promise.all([
    sql<
      {
        sana: Date;
        xodim_id: number;
        xodim: string;
        amal: string;
        obyekt_turi: string;
        obyekt_id: number;
        izoh: string | null;
        summa: string | null;
        buyurtma_id: number | null;
        bolak_id: number | null;
      }[]
    >`
      SELECT a.sana, a.xodim_id, x.ism AS xodim, a.amal, a.obyekt_turi, a.obyekt_id, a.izoh,
             CASE
               WHEN a.amal = 'STORNO' AND a.obyekt_turi = 'kassa_yozuv'
                 THEN (SELECT y.summa FROM kassa_yozuv y WHERE y.id = a.obyekt_id AND y.valyuta = 'SOM')
               WHEN a.amal = 'UMIDSIZ_QARZ' AND a.yangi_qiymat ->> 'valyuta' = 'SOM'
                 THEN (a.yangi_qiymat ->> 'summa')::numeric
               -- Bekor qilingan buyurtmaga kelib tushgan pul (qaytarilgani ayirilmaydi)
               WHEN a.amal = 'BEKOR' AND a.obyekt_turi = 'buyurtma'
                 THEN (SELECT SUM(y.summa) FROM kassa_yozuv y
                       WHERE y.manba_turi = 'buyurtma' AND y.manba_id = a.obyekt_id
                         AND y.summa > 0 AND y.valyuta = 'SOM')
               -- Jadval narxidan farq (ikkalasi ham ma'lum bo'lsa)
               WHEN a.amal = 'NARX_QOLDA'
                 THEN (a.yangi_qiymat ->> 'narx')::numeric - (a.eski_qiymat ->> 'narx')::numeric
             END::numeric(14,2)::text AS summa,
             CASE a.obyekt_turi
               WHEN 'buyurtma' THEN a.obyekt_id
               WHEN 'buyurtma_pozitsiya' THEN (SELECT p.buyurtma_id FROM buyurtma_pozitsiya p WHERE p.id = a.obyekt_id)
             END AS buyurtma_id,
             CASE a.obyekt_turi
               WHEN 'bolak' THEN a.obyekt_id
               WHEN 'ombor_harakat' THEN (SELECT oh.bolak_id FROM ombor_harakat oh WHERE oh.id = a.obyekt_id)
             END AS bolak_id
      FROM audit_jurnal a
      JOIN xodim x ON x.id = a.xodim_id
      WHERE a.sana >= ${davr.boshi} AND a.sana < ${davr.oxiri}
        AND a.amal = ANY(${AUDIT_AMALLARI})
        -- ⚠️ Kirish bloki filialsiz yoziladi — xodimning filiali olinadi
        AND COALESCE(a.filial_id, x.filial_id) = ${filialId}`,
    sql<{ sana: Date; xodim_id: number; xodim: string; kassa: string; kun: string; farq: string }[]>`
      SELECT kk.yopildi AS sana, kk.yopdi_id AS xodim_id, x.ism AS xodim, k.nom AS kassa,
             kk.sana::text AS kun, kk.farq::text AS farq
      FROM kassa_kun kk
      JOIN kassa k ON k.id = kk.kassa_id
      JOIN xodim x ON x.id = kk.yopdi_id
      WHERE k.filial_id = ${filialId} AND k.valyuta = 'SOM'
        AND kk.yopildi >= ${davr.boshi} AND kk.yopildi < ${davr.oxiri}
        AND kk.farq IS NOT NULL AND kk.farq <> 0`,
    sql<{ sana: Date; xodim_id: number; xodim: string; kod: string; summa: string; valyuta: string; izoh: string | null }[]>`
      SELECT y.sana, y.xodim_id, x.ism AS xodim, y.kod, y.summa::text, y.valyuta, y.izoh
      FROM kassa_yozuv y
      JOIN kassa k ON k.id = y.kassa_id
      JOIN xodim x ON x.id = y.xodim_id
      WHERE k.filial_id = ${filialId}
        AND y.sana >= ${davr.boshi} AND y.sana < ${davr.oxiri}
        -- Kun yopish farqi tizim yozuvi — kassir kiritmaydi
        AND y.manba_turi <> 'kassa_kun'
        AND (EXTRACT(HOUR FROM y.sana AT TIME ZONE ${VAQT_ZONASI}) >= 22
             OR EXTRACT(HOUR FROM y.sana AT TIME ZONE ${VAQT_ZONASI}) < 7)`,
    sql<{ id: number; sana: Date; xodim_id: number; xodim: string; raqam: string; hujjat: string; kiritildi: string }[]>`
      SELECT k.id, k.yaratildi AS sana, k.yaratdi_id AS xodim_id, x.ism AS xodim, k.raqam,
             k.sana::text AS hujjat, (k.yaratildi AT TIME ZONE ${VAQT_ZONASI})::date::text AS kiritildi
      FROM kirim k
      JOIN xodim x ON x.id = k.yaratdi_id
      WHERE k.filial_id = ${filialId}
        AND k.yaratildi >= ${davr.boshi} AND k.yaratildi < ${davr.oxiri}
        AND (k.yaratildi AT TIME ZONE ${VAQT_ZONASI})::date - k.sana > ${ORQA_SANA_KUN}`,
  ]);

  const natija: NazoratHodisasi[] = [];
  for (const a of jurnal) {
    const turi = auditTuri(a.amal, a.obyekt_turi);
    if (turi === null) continue;
    const havola =
      a.buyurtma_id !== null
        ? `/buyurtma/${String(a.buyurtma_id)}`
        : a.bolak_id !== null
          ? `/ombor/bolak/${String(a.bolak_id)}`
          : a.obyekt_turi === 'mijoz'
            ? `/mijoz/${String(a.obyekt_id)}`
            : a.obyekt_turi === 'xodim'
              ? `/xodim/${String(a.obyekt_id)}`
              : a.obyekt_turi === 'kassa_yozuv'
                ? '/kassa'
                : a.obyekt_turi === 'kassa_kun'
                  ? '/kassa/kun'
                  : null;
    const oldi = AMAL_NOMI[a.amal];
    natija.push({
      turi,
      sana: a.sana,
      xodimId: a.xodim_id,
      xodim: a.xodim,
      tavsif: [oldi, a.izoh].filter((x) => x !== undefined && x !== null && x !== '').join(' — '),
      summa: a.summa,
      havola,
    });
  }
  for (const k of kunlar) {
    natija.push({
      turi: 'KUN_FARQI',
      sana: k.sana,
      xodimId: k.xodim_id,
      xodim: k.xodim,
      tavsif: `${k.kassa} · ${k.kun}`,
      summa: k.farq,
      havola: '/kassa/kun',
    });
  }
  for (const y of tungi) {
    natija.push({
      turi: 'TUNGI_KASSA',
      sana: y.sana,
      xodimId: y.xodim_id,
      xodim: y.xodim,
      tavsif: [kassaKodNomi(y.kod), y.valyuta === 'SOM' ? null : `${y.summa} ${y.valyuta}`, y.izoh]
        .filter((x) => x !== null && x !== '')
        .join(' — '),
      summa: y.valyuta === 'SOM' ? y.summa : null,
      havola: '/kassa',
    });
  }
  for (const k of kirimlar) {
    natija.push({
      turi: 'ORQA_SANA_KIRIM',
      sana: k.sana,
      xodimId: k.xodim_id,
      xodim: k.xodim,
      tavsif: `${k.raqam}: hujjat ${k.hujjat}, kiritildi ${k.kiritildi}`,
      summa: null,
      havola: `/ombor/kirim/${String(k.id)}`,
    });
  }
  return natija;
}
