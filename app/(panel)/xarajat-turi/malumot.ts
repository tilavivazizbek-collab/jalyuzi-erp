/** Xarajat turlari ro'yxati — 0066, 2026-10-13. */

import { ulanishOl } from '@/lib/db';
import { oyBoshi } from '@/lib/domain/reja';
import { toshkentKuni } from '@/lib/domain/sana';

export interface XarajatTuriQatori {
  readonly id: number;
  readonly nom: string;
  /** Hamma vaqt — nechta xarajat yozilgan */
  readonly soni: number;
  /** Joriy oy, so'mda (storno juftlari nolga chiqadi) */
  readonly shuOy: string;
}

export async function xarajatTuriRoyxati(): Promise<XarajatTuriQatori[]> {
  const oy = oyBoshi(toshkentKuni());
  return ulanishOl()<XarajatTuriQatori[]>`
    SELECT t.id, t.nom,
           COUNT(x.id)::int AS soni,
           COALESCE(SUM(x.summa) FILTER (WHERE x.valyuta = 'SOM' AND x.sana >= ${oy}::date), 0)
             ::numeric(14,2)::text AS "shuOy"
    FROM xarajat_turi t
    LEFT JOIN xarajat x ON x.xarajat_turi_id = t.id
    WHERE t.faol
    GROUP BY t.id
    ORDER BY t.nom`;
}
