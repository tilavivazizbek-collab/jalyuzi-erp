/**
 * lib/domain/yetkazib-qarz.ts — yetkazib beruvchiga qarzimizning muddati.
 * Yetkazib beruvchilar auditi 2026-10-07.
 *
 * ⚠️ Taqsimot — `qarzniTaqsimla(qatorlar, 'XARID')` (mijoz bilan BITTA
 *    FIFO qoidasi). Bu yerda faqat MUDDAT: har kirimning o'z
 *    `tolov_muddati` bor (yetkazib beruvchi kartochkasidan keladi, 9.3).
 *
 * ⚠️ Ilgari «eng yaqin muddat» TO'LANGAN kirimlardan ham olinardi —
 *    bir marta kechikkan hujjat kartochkani abadiy qizil qilib qo'yardi.
 *    Kartochkadan qilingan to'lov esa hech qaysi hujjatni yopmasdi.
 *
 * ⚠️ BAZAGA TEGMAYDI. Sana — `YYYY-MM-DD` matn (Toshkent kuni).
 */

import Decimal from 'decimal.js';
import type { QarzBandi } from './qarz-taqsimot';
import type { Valyuta } from './pul';
import { toshkentKuni } from './sana';

export interface MuddatXulosasi {
  /** Muddati o'tgan ochiq qarz, valyuta bo'yicha */
  readonly muddatOtgan: Readonly<Record<Valyuta, string>>;
  readonly muddatOtganSoni: number;
  /** Ochiq hujjatlardagi eng yaqin (yoki eng eski o'tgan) muddat */
  readonly yaqinMuddat: string | null;
}

export function muddatXulosasi(
  bandlar: readonly QarzBandi[],
  muddatlar: ReadonlyMap<number, string | null>,
  bugun: string,
): MuddatXulosasi {
  const otgan: Record<Valyuta, Decimal> = { SOM: new Decimal(0), USD: new Decimal(0) };
  let soni = 0;
  let yaqin: string | null = null;
  for (const b of bandlar) {
    if (!new Decimal(b.qolgan).gt(0) || b.buyurtmaId === null) continue;
    const m = muddatlar.get(b.buyurtmaId) ?? null;
    if (m === null) continue;
    if (yaqin === null || m < yaqin) yaqin = m;
    if (m < bugun) {
      otgan[b.valyuta] = otgan[b.valyuta].plus(b.qolgan);
      soni += 1;
    }
  }
  return {
    muddatOtgan: { SOM: otgan.SOM.toFixed(2), USD: otgan.USD.toFixed(2) },
    muddatOtganSoni: soni,
    yaqinMuddat: yaqin,
  };
}

export interface TolovIntizomimiz {
  /** Yopilgan hujjatlar: kirimdan to'liq to'langungacha o'rtacha kun */
  readonly ortachaKun: number | null;
  readonly engUzunKun: number | null;
  readonly tolanganSoni: number;
  /** Yopilgan hujjatlardan muddatidan KEYIN to'langani */
  readonly kechikibTolangan: number;
}

/**
 * Biz qanday to'laymiz — yetkazib beruvchi keyingi shartlarni shunga
 * qarab beradi (muntazam kechiksak — oldindan to'lov talab qiladi).
 */
export function tolovIntizomimiz(
  bandlar: readonly QarzBandi[],
  muddatlar: ReadonlyMap<number, string | null>,
): TolovIntizomimiz {
  const kunlar: number[] = [];
  let kech = 0;
  for (const b of bandlar) {
    if (b.buyurtmaId === null || b.yopildi === null) continue;
    kunlar.push(Math.max(0, Math.round((b.yopildi.getTime() - b.sana.getTime()) / 86_400_000)));
    const m = muddatlar.get(b.buyurtmaId) ?? null;
    // ⚠️ Toshkent kuni — UTC bilan yarim tunda bir kun siljirdi
    if (m !== null && toshkentKuni(b.yopildi) > m) kech += 1;
  }
  return {
    ortachaKun:
      kunlar.length === 0 ? null : Math.round(kunlar.reduce((y, k) => y + k, 0) / kunlar.length),
    engUzunKun: kunlar.length === 0 ? null : Math.max(...kunlar),
    tolanganSoni: kunlar.length,
    kechikibTolangan: kech,
  };
}
