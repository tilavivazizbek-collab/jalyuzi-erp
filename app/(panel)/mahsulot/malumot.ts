/**
 * Konstruktor ekranlari uchun umumiy so'rovlar.
 *
 * Bir necha sahifa bir xil ma'lumotni o'qiydi — so'rov bitta joyda turadi.
 */

import { ulanishOl } from '@/lib/db';
import type { GuruhMalumoti } from './kalkulyator';
import type { MaterialTanlovi } from './forma';
import type { SarflashBirligi } from '@/lib/domain/birlik';

interface GuruhQatori {
  readonly id: number;
  readonly nom: string;
  readonly sarflash_birligi: string | null;
  readonly namuna_narx: string | null;
  readonly namuna_nom: string | null;
}

/**
 * Almashtirish guruhlari va ularning NAMUNA materiali.
 *
 * Test kalkulyatori (4.8) sarflash birligini bilishi kerak: natija kv.m mi,
 * sm mi, dona mi — bu materialga bog'liq (AUDIT B-01). Guruh ichidagi
 * materiallar bir-birini almashtiradi, ya'ni birligi bir xil bo'lishi kerak.
 */
export async function guruhlarniOl(): Promise<GuruhMalumoti[]> {
  const qatorlar = await ulanishOl()<GuruhQatori[]>`
    SELECT g.id, g.nom,
           n.sarflash_birligi, n.sotuv_narx AS namuna_narx, n.nom AS namuna_nom
    FROM almashtirish_guruh g
    LEFT JOIN LATERAL (
      SELECT m.sarflash_birligi, m.sotuv_narx, m.nom
      FROM material m
      WHERE m.almashtirish_guruh_id = g.id AND m.faol = true
      ORDER BY (m.sotuv_narx IS NULL), m.nom
      LIMIT 1
    ) n ON true
    WHERE g.faol = true
    ORDER BY g.nom`;

  return qatorlar.map((g) => ({
    id: g.id,
    nom: g.nom,
    sarflashBirligi: (g.sarflash_birligi ?? 'KV_M') as SarflashBirligi,
    namunaNarx: g.namuna_narx,
    namunaNom: g.namuna_nom,
  }));
}

/** Aksessuar komplektiga qo'shiladigan materiallar (4.6). */
export async function materiallarniOl(): Promise<MaterialTanlovi[]> {
  return ulanishOl()<MaterialTanlovi[]>`
    SELECT id, nom FROM material WHERE faol = true ORDER BY nom`;
}

// ─── Tur ro'yxati ekrani (TZ 4) ───────────────────────────────────────────

/**
 * ⚠️ NEGA BU YERDA
 *
 *    So'rov ilgari `page.tsx` ichida yozilgan edi va HECH QANDAY
 *    test uni ko'rmasdi. 2026-08-29 da o'sha so'rovda `WHERE`
 *    `GROUP BY` dan KEYIN qolib ketdi — Postgres «syntax error at
 *    or near WHERE» dedi va butun sahifa ochilmay qoldi.
 *
 *    `tsc` buni ko'rmaydi: SQL — shunchaki matn. Endi so'rov shu
 *    yerda va `test/integratsiya/ekran-sorovlari.test.ts` uni
 *    haqiqiy bazada chaqiradi.
 */
export interface TurQatori {
  readonly id: number;
  readonly nom: string;
  readonly xizmat_haqi: string | null;
  readonly oynada_korinadi: boolean;
  readonly botda_korinadi: boolean;
  readonly faol: boolean;
  readonly slot_soni: number;
  readonly guruhsiz_slot: number;
  readonly aksessuar_soni: number;
}

export async function turlarRoyxati(ochirilganlar: boolean): Promise<readonly TurQatori[]> {
  return await ulanishOl()<TurQatori[]>`
    SELECT t.id, t.nom, t.xizmat_haqi, t.oynada_korinadi, t.botda_korinadi, t.faol,
           COUNT(s.id) FILTER (WHERE s.faol)::int AS slot_soni,
           COUNT(s.id) FILTER (WHERE s.faol AND s.almashtirish_guruh_id IS NULL)::int
             AS guruhsiz_slot,
           (SELECT COUNT(*)::int FROM mahsulot_aksessuar a
            WHERE a.mahsulot_tur_id = t.id AND a.faol) AS aksessuar_soni
    FROM mahsulot_tur t
    LEFT JOIN mahsulot_slot s ON s.mahsulot_tur_id = t.id
    -- ⚠️ WHERE «GROUP BY» dan OLDIN turadi
    WHERE t.faol = ${!ochirilganlar}
    GROUP BY t.id
    ORDER BY t.tartib, t.nom`;
}

export async function turOchirilganSoni(): Promise<number> {
  const q = await ulanishOl()<
    { n: number }[]
  >`SELECT COUNT(*)::int AS n FROM mahsulot_tur WHERE faol = false`;
  return q[0]?.n ?? 0;
}
