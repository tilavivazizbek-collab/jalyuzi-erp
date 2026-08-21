/**
 * app/(panel)/mijoz/qarz-malumot.ts — TZ 6.7 · 6.8 · 6.9 · 2.2-invariant
 *
 * ⚠️ Qarz HECH QAYERDA saqlanmaydi — `mijoz_harakat` ning `SUM()` idan
 *    chiqadi. So'm va dollar ALOHIDA (1.3-band).
 */

import { ulanishOl } from '@/lib/db';

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
