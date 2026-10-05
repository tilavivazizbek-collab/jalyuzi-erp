/**
 * app/(panel)/mijoz/qarz-malumot.ts — TZ 6.7 · 6.8 · 6.9 · 2.2-invariant
 *
 * ⚠️ Qarz HECH QAYERDA saqlanmaydi — `mijoz_harakat` ning `SUM()` idan
 *    chiqadi. So'm va dollar ALOHIDA (1.3-band).
 */

import { ulanishOl } from '@/lib/db';
import type { JurnalQatori } from '@/lib/domain/qarz-taqsimot';

export interface MijozQarzi {
  readonly som: string;
  readonly dollar: string;
  readonly harakatlar: readonly {
    readonly id: number;
    readonly sana: Date;
    readonly turi: string;
    readonly summa: string;
    readonly valyuta: string;
    readonly izoh: string | null;
    readonly xodimIsmi: string;
  }[];
}

export const HARAKAT_NOMI: Record<string, string> = {
  SOTUV: 'Sotuv',
  TOLOV: "To'lov",
  QAYTARISH: 'Qaytarish',
  AVANS: 'Avans',
  UMIDSIZ_QARZ: 'Umidsiz qarz',
  BOSHLANGICH: "Boshlang'ich qoldiq",
};

export async function mijozQarzi(mijozId: number, chegara = 50): Promise<MijozQarzi> {
  const sql = ulanishOl();

  const b = await sql<{ som: string | null; dollar: string | null }[]>`
    SELECT SUM(summa) FILTER (WHERE valyuta = 'SOM')::text AS som,
           SUM(summa) FILTER (WHERE valyuta = 'USD')::text AS dollar
    FROM mijoz_harakat WHERE mijoz_id = ${mijozId}`;

  const h = await sql<
    {
      id: number;
      sana: Date;
      turi: string;
      summa: string;
      valyuta: string;
      izoh: string | null;
      xodim_ismi: string;
    }[]
  >`
    SELECT m.id, m.sana, m.turi, m.summa, m.valyuta, m.izoh, x.ism AS xodim_ismi
    FROM mijoz_harakat m
    JOIN xodim x ON x.id = m.xodim_id
    WHERE m.mijoz_id = ${mijozId}
    ORDER BY m.sana DESC, m.id DESC
    LIMIT ${chegara}`;

  return {
    som: b[0]?.som ?? '0',
    dollar: b[0]?.dollar ?? '0',
    harakatlar: h.map((r) => ({
      id: r.id,
      sana: r.sana,
      turi: r.turi,
      summa: r.summa,
      valyuta: r.valyuta,
      izoh: r.izoh,
      xodimIsmi: r.xodim_ismi,
    })),
  };
}

/**
 * Mijoz qarz jurnali — `qarzniTaqsimla()` uchun (egasi auditi 2026-10-06).
 *
 * ⚠️ `buyurtmaId` SHU YERDA aniqlanadi: sotuv, tahrir va storno
 *    `buyurtma` manbasi bilan, buyurtmaga to'lov `buyurtma_tolov`
 *    bilan, qaytarish esa POZITSIYA bilan yoziladi. Kartochkadan
 *    to'lov, avans, umidsiz qarz — hech qaysi buyurtmaga bog'lanmaydi.
 */
export async function mijozJurnali(mijozId: number): Promise<JurnalQatori[]> {
  const q = await ulanishOl()<
    { id: number; sana: Date; turi: string; summa: string; valyuta: string; buyurtma_id: number | null }[]
  >`
    SELECT h.id, h.sana, h.turi, h.summa::text AS summa, h.valyuta,
           CASE
             WHEN h.manba_turi IN ('buyurtma', 'buyurtma_tolov') THEN h.manba_id
             WHEN h.manba_turi = 'qaytarish' THEN
               (SELECT bp.buyurtma_id FROM buyurtma_pozitsiya bp WHERE bp.id = h.manba_id)
           END AS buyurtma_id
    FROM mijoz_harakat h
    WHERE h.mijoz_id = ${mijozId}
    ORDER BY h.sana, h.id`;

  return q.map((r) => ({
    id: r.id,
    sana: r.sana,
    turi: r.turi,
    summa: r.summa,
    valyuta: r.valyuta === 'USD' ? 'USD' : 'SOM',
    buyurtmaId: r.buyurtma_id,
  }));
}
