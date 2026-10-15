/**
 * lib/domain/hisobot/narx-dinamika.ts — TZ 9.8 · 11.9.1. 2026-10-15
 *
 * «Ko'k mato: 1 872 000 → 1 950 000 → 2 100 000, 8 oyda +12.2%»
 *
 * ⚠️ FAQAT SOLISHTIRSA BO'LADIGAN NARXLAR. Kirim narxi bir safar RULONGA,
 *    boshqa safar METRGA, yana bir safar dollarda kiritilishi mumkin.
 *    2026-10-15 gacha 9.8 ularni to'g'ridan-to'g'ri solishtirardi: rulon
 *    narxidan keyin metr narxi kelsa «−98%» chiqardi. Endi har nuqtada
 *    `kalit` (asos + valyuta) bor; kalitlar har xil bo'lsa foiz YO'Q.
 */

import Decimal from 'decimal.js';

export interface NarxNuqtasi {
  /** YYYY-MM-DD */
  readonly sana: string;
  readonly narx: string;
  /** Narx nimaga nisbatan va qaysi valyutada — masalan «METR:SOM» */
  readonly kalit: string;
}

export interface NarxOzgarishi {
  /** Birinchidan oxirgisigacha, foizda, bir kasr bilan; solishtirib bo'lmasa `null` */
  readonly foiz: number | null;
  /** Necha oy ichida (kamida 1) */
  readonly oylar: number | null;
}

const OY_MS = 30 * 86_400_000;

/** Nuqtalar ESKIDAN YANGIGA tartiblangan bo'lishi kerak. */
export function narxOzgarishi(nuqtalar: readonly NarxNuqtasi[]): NarxOzgarishi {
  const birinchi = nuqtalar[0];
  const oxirgi = nuqtalar[nuqtalar.length - 1];
  if (birinchi === undefined || oxirgi === undefined || nuqtalar.length < 2) return { foiz: null, oylar: null };
  if (nuqtalar.some((n) => n.kalit !== birinchi.kalit)) return { foiz: null, oylar: null };

  const eski = new Decimal(birinchi.narx);
  if (eski.isZero()) return { foiz: null, oylar: null };

  const foiz = new Decimal(oxirgi.narx).minus(eski).div(eski).times(100).toDecimalPlaces(1).toNumber();
  const oylar = Math.max(1, Math.round((Date.parse(oxirgi.sana) - Date.parse(birinchi.sana)) / OY_MS));
  return { foiz, oylar };
}
