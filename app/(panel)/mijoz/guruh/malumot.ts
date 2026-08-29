/**
 * app/(panel)/mijoz/guruh/malumot.ts — TZ 6.3
 */

import { ulanishOl } from '@/lib/db';

export interface MijozGuruhQatori {
  readonly id: number;
  readonly nom: string;
  readonly offsetTuri: string | null;
  readonly offsetQiymat: string | null;
  readonly izoh: string | null;
  readonly faol: boolean;
  /** Nechta mijoz shu guruhda — o'chirishdan oldin ko'rinib tursin */
  readonly mijozSoni: number;
}

export async function mijozGuruhRoyxati(
  ochirilganlar: boolean,
): Promise<readonly MijozGuruhQatori[]> {
  const q = await ulanishOl()<
    {
      id: number;
      nom: string;
      offset_turi: string | null;
      offset_qiymat: string | null;
      izoh: string | null;
      faol: boolean;
      mijoz_soni: number;
    }[]
  >`
    SELECT g.id, g.nom, g.offset_turi, g.offset_qiymat, g.izoh, g.faol,
           (SELECT COUNT(*)::int FROM mijoz m
             WHERE m.mijoz_guruh_id = g.id AND m.faol = true) AS mijoz_soni
    FROM mijoz_guruh g
    WHERE g.faol = ${!ochirilganlar}
    ORDER BY g.nom`;

  return q.map((g) => ({
    id: g.id,
    nom: g.nom,
    offsetTuri: g.offset_turi,
    offsetQiymat: g.offset_qiymat,
    izoh: g.izoh,
    faol: g.faol,
    mijozSoni: g.mijoz_soni,
  }));
}

export async function mijozGuruhOchirilganSoni(): Promise<number> {
  const q = await ulanishOl()<
    { n: number }[]
  >`SELECT COUNT(*)::int AS n FROM mijoz_guruh WHERE faol = false`;
  return q[0]?.n ?? 0;
}

export interface GuruhTanlovi {
  readonly id: number;
  readonly nom: string;
}

/** Mijoz formasidagi tanlov — faqat faol guruhlar */
export async function guruhTanlovlari(): Promise<readonly GuruhTanlovi[]> {
  return await ulanishOl()<GuruhTanlovi[]>`
    SELECT id, nom FROM mijoz_guruh WHERE faol = true ORDER BY nom`;
}
