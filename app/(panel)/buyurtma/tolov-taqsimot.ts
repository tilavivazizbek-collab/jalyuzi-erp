/**
 * Buyurtmalarning to'lov holati — ro'yxat va kartochka uchun BITTA joy.
 * Buyurtmalar auditi 2026-10-10.
 *
 * ⚠️ Mijozli buyurtma — mijoz jurnalining FIFO taqsimotidan (mijoz
 *    kartochkasi bilan bir xil). Mijozsiz — faqat buyurtmaga bog'langan
 *    kassa to'lovlari. Qoida: `lib/domain/buyurtma-tolov.ts`.
 */

import Decimal from 'decimal.js';
import { ulanishOl } from '@/lib/db';
import { qarzniTaqsimla, type QarzBandi } from '@/lib/domain/qarz-taqsimot';
import { buyurtmaTolovi, type BuyurtmaTolovi } from '@/lib/domain/buyurtma-tolov';
import { mijozlarJurnali } from '../mijoz/qarz-malumot';

export interface TolovSorovi {
  readonly id: number;
  readonly mijozId: number | null;
  /** Faol pozitsiyalar summasi */
  readonly jami: string;
}

export async function buyurtmaTolovlari(
  qatorlar: readonly TolovSorovi[],
): Promise<Map<number, BuyurtmaTolovi>> {
  const mijozIdlar = [...new Set(qatorlar.flatMap((q) => (q.mijozId === null ? [] : [q.mijozId])))];
  const mijozsizIdlar = qatorlar.filter((q) => q.mijozId === null).map((q) => q.id);

  const [jurnallar, kassa] = await Promise.all([
    mijozlarJurnali(mijozIdlar),
    mijozsizIdlar.length === 0
      ? Promise.resolve([] as { id: number; summa: string }[])
      : ulanishOl()<{ id: number; summa: string }[]>`
          SELECT y.manba_id AS id, SUM(y.summa)::text AS summa
          FROM kassa_yozuv y
          WHERE y.manba_turi = 'buyurtma' AND y.manba_id = ANY(${mijozsizIdlar})
            -- storno qilingan to'lov sanalmaydi
            AND NOT EXISTS (SELECT 1 FROM kassa_yozuv s WHERE s.storno_id = y.id)
          GROUP BY y.manba_id`,
  ]);

  const bandlar = new Map<number, QarzBandi>();
  for (const jurnal of jurnallar.values()) {
    for (const b of qarzniTaqsimla(jurnal).bandlar) {
      if (b.buyurtmaId !== null) bandlar.set(b.buyurtmaId, b);
    }
  }
  const kassaXarita = new Map(kassa.map((k) => [k.id, k.summa]));

  return new Map(
    qatorlar.map((q) => [
      q.id,
      buyurtmaTolovi({
        jami: new Decimal(q.jami).toFixed(2),
        mijozlimi: q.mijozId !== null,
        band: bandlar.get(q.id),
        kassa: kassaXarita.get(q.id) ?? '0',
      }),
    ]),
  );
}
