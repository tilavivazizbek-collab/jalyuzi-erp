/**
 * lib/amal/tolov-holati.ts — buyurtma to'landimi (TZ 3.12 · 8.9 · 8.14).
 * Buyurtmalar auditi 2026-10-10 / 11.
 *
 * ⚠️ BITTA JOY: buyurtmalar ro'yxati, kartochka, CHEK va KVITANSIYA shu
 *    yerdan oladi. Mijozli buyurtma — mijoz jurnalining FIFO taqsimotidan
 *    (mijoz kartochkasi bilan bitta qoida), mijozsiz — faqat buyurtmaga
 *    bog'langan kassa to'lovlaridan. Qoida: `lib/domain/buyurtma-tolov.ts`.
 *
 * ⚠️ Ilgari chek va kvitansiya «To'langan» ni faqat bog'langan to'lovdan
 *    olardi: mijoz kartochkadan qarzini uzgan bo'lsa ham chekda qarz turardi.
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { qarzniTaqsimla, type JurnalQatori, type QarzBandi } from '@/lib/domain/qarz-taqsimot';
import { buyurtmaTolovi, type BuyurtmaTolovi } from '@/lib/domain/buyurtma-tolov';

/**
 * Bir nechta mijozning jurnali — BITTA so'rovda (buyurtmalar ro'yxati
 * har qatorning to'lov holatini taqsimotdan oladi, 2026-10-10).
 */
export async function mijozlarJurnali(
  ulanish: postgres.Sql,
  mijozIdlar: readonly number[],
): Promise<Map<number, JurnalQatori[]>> {
  const natija = new Map<number, JurnalQatori[]>();
  if (mijozIdlar.length === 0) return natija;
  const q = await ulanish<
    {
      mijoz_id: number;
      id: number;
      sana: Date;
      turi: string;
      summa: string;
      valyuta: string;
      buyurtma_id: number | null;
    }[]
  >`
    SELECT h.mijoz_id, h.id, h.sana, h.turi, h.summa::text AS summa, h.valyuta,
           CASE
             WHEN h.manba_turi IN ('buyurtma', 'buyurtma_tolov') THEN h.manba_id
             WHEN h.manba_turi = 'qaytarish' THEN
               (SELECT bp.buyurtma_id FROM buyurtma_pozitsiya bp WHERE bp.id = h.manba_id)
           END AS buyurtma_id
    FROM mijoz_harakat h
    WHERE h.mijoz_id = ANY(${mijozIdlar as number[]})
    ORDER BY h.sana, h.id`;

  for (const r of q) {
    const j = natija.get(r.mijoz_id) ?? [];
    j.push({
      id: r.id,
      sana: r.sana,
      turi: r.turi,
      summa: r.summa,
      valyuta: r.valyuta === 'USD' ? 'USD' : 'SOM',
      buyurtmaId: r.buyurtma_id,
    });
    natija.set(r.mijoz_id, j);
  }
  return natija;
}

export interface TolovSorovi {
  readonly id: number;
  readonly mijozId: number | null;
  /** Faol pozitsiyalar summasi */
  readonly jami: string;
}

export async function buyurtmaTolovlari(
  ulanish: postgres.Sql,
  qatorlar: readonly TolovSorovi[],
): Promise<Map<number, BuyurtmaTolovi>> {
  const mijozIdlar = [...new Set(qatorlar.flatMap((q) => (q.mijozId === null ? [] : [q.mijozId])))];
  const mijozsizIdlar = qatorlar.filter((q) => q.mijozId === null).map((q) => q.id);

  const [jurnallar, kassa] = await Promise.all([
    mijozlarJurnali(ulanish, mijozIdlar),
    mijozsizIdlar.length === 0
      ? Promise.resolve([] as { id: number; summa: string }[])
      : ulanish<{ id: number; summa: string }[]>`
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
