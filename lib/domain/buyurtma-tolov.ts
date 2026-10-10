/**
 * lib/domain/buyurtma-tolov.ts — buyurtma to'landimi (TZ 3.12 · 8.14).
 * Buyurtmalar auditi 2026-10-10.
 *
 * ⚠️ IKKI MANBA, BITTA QOIDA:
 *    · mijozli buyurtma — mijoz jurnalining FIFO taqsimotidan
 *      (`qarzniTaqsimla`): kartochkadan to'langan qarz ham eng eski
 *      buyurtmani yopadi. Ilgari faqat SHU buyurtmaga bog'langan kassa
 *      yozuvi sanalardi va qarzini to'liq uzgan mijozning buyurtmalari
 *      «To'lanmagan» bo'lib turardi.
 *    · mijozsiz buyurtma (o'tkinchi xaridor) — jurnal yo'q, faqat
 *      buyurtmaga bog'langan kassa yozuvlari (storno qilinganlarisiz).
 *
 * ⚠️ BAZAGA TEGMAYDI. Pul — `numeric` matn, `Decimal` bilan.
 */

import Decimal from 'decimal.js';
import type { QarzBandi } from './qarz-taqsimot';

export type TolovDarajasi = 'TOLANDI' | 'QISMAN' | 'TOLANMAGAN';

export interface BuyurtmaTolovi {
  readonly tolangan: string;
  readonly qolgan: string;
  readonly daraja: TolovDarajasi;
}

/**
 * @param jami   faol pozitsiyalar summasi (bekor va rad etilganlarsiz)
 * @param band   mijozli buyurtmaning taqsimot bandi; `undefined` — mijozli,
 *               lekin bandi yo'q (qarzi nolga tushgan / to'liq storno)
 * @param kassa  mijozsiz buyurtmaga bog'langan kassa to'lovlari yig'indisi
 */
export function buyurtmaTolovi(k: {
  readonly jami: string;
  readonly mijozlimi: boolean;
  readonly band?: QarzBandi;
  readonly kassa: string;
}): BuyurtmaTolovi {
  const jami = new Decimal(k.jami);
  let tolangan: Decimal;
  let qolgan: Decimal;
  if (k.mijozlimi) {
    if (k.band === undefined) {
      // Jurnalda ochiq qarz bandi yo'q — buyurtma bo'yicha qarz yo'q
      tolangan = jami;
      qolgan = new Decimal(0);
    } else {
      tolangan = new Decimal(k.band.tolangan);
      qolgan = new Decimal(k.band.qolgan);
    }
  } else {
    tolangan = Decimal.max(new Decimal(k.kassa), 0);
    qolgan = Decimal.max(jami.minus(tolangan), 0);
  }
  const daraja: TolovDarajasi = qolgan.lte(0)
    ? 'TOLANDI'
    : tolangan.gt(0)
      ? 'QISMAN'
      : 'TOLANMAGAN';
  return { tolangan: tolangan.toFixed(2), qolgan: qolgan.toFixed(2), daraja };
}
