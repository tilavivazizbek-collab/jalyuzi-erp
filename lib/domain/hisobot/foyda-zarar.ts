/**
 * lib/domain/hisobot/foyda-zarar.ts — TZ 11.4.1 · 11.4.4 · 11.4.7
 * Hisobotlar auditi 2026-10-11.
 *
 * «Tushum − tannarx − xarajatlar. Davr bo'yicha, o'tgan davr bilan
 *  taqqoslab.» Kurs farqi «xarajat va daromad ALOHIDA qatorlarda —
 *  yig'ib ko'rsatilmaydi» (11.4.7).
 *
 * ⚠️ Ilgari bu hisobot UMUMAN yo'q edi: operatsion xarajat, brak, umidsiz
 *    qarz, kassa farqi bazaga yozilardi, lekin sof foydani hech qayerda
 *    ko'rib bo'lmasdi.
 *
 * ⚠️ BAZAGA TEGMAYDI. Pul — `numeric` matn, Decimal bilan.
 */

import Decimal from 'decimal.js';

/** Xarajat moddalari nomi — BITTA joy (ilgari faqat kassa formasida, 4 tasi) */
export const XARAJAT_MODDA_NOMI: Readonly<Record<string, string>> = {
  ISH_HAQI: 'Ish haqi',
  TRANSPORT_BOJXONA: 'Transport va bojxona',
  OMBOR_BRAKI: 'Ombor braki',
  ISHLAB_CHIQARISH_BRAKI: 'Ishlab chiqarish braki',
  CHIQINDI: 'Chiqindi',
  KURS_FARQI: 'Kurs farqi',
  YETKAZIB_BERUVCHI_DEFEKTI: 'Yetkazib beruvchi defekti',
  UMIDSIZ_QARZ: 'Umidsiz qarz',
  BANK_KOMISSIYASI: 'Bank komissiyasi',
  OPERATSION: 'Operatsion (ijara, kommunal…)',
  INVENTARIZATSIYA_FARQI: 'Inventarizatsiya farqi',
  YAXLITLASH: 'Yaxlitlash',
  XODIM_BALANSI_HISOBDAN: 'Xodim qarzi hisobdan chiqarildi',
  FILIALLARARO_TRANSPORT: 'Filiallararo transport',
  BOSHQA: 'Boshqa',
  KASSA_FARQI: 'Kassa farqi (kun yopish)',
};

export function xarajatModdaNomi(modda: string): string {
  return XARAJAT_MODDA_NOMI[modda] ?? modda;
}

export interface FoydaZararKirimi {
  /** Faol, qaytarilmagan pozitsiyalar tushumi (so'mda) */
  readonly tushum: string;
  /** Sotilgan pozitsiyalar materiali (qaytarilganlari ham — material sarflangan) */
  readonly material: string;
  /** Shu pozitsiyalarga hisoblangan usta haqi (11.4.1 — hisoblangan paytda) */
  readonly ishHaqi: string;
  /** Davrdagi boshqa xarajatlar, modda bo'yicha (kurs farqi va pozitsiya ish haqisiz) */
  readonly xarajatlar: readonly { readonly modda: string; readonly summa: string }[];
  /** Kurs farqi: musbat yozuvlar — zarar, manfiy — daromad (9.6) */
  readonly kursZarar: string;
  readonly kursDaromad: string;
}

export interface FoydaZarar {
  readonly tushum: string;
  readonly tannarx: string;
  readonly material: string;
  readonly ishHaqi: string;
  readonly yalpiFoyda: string;
  readonly xarajatlar: readonly { readonly modda: string; readonly nom: string; readonly summa: string }[];
  readonly xarajatJami: string;
  readonly kursZarar: string;
  readonly kursDaromad: string;
  readonly sofFoyda: string;
  /** Sof foyda / tushum, %; tushum 0 bo'lsa `null` */
  readonly rentabellik: number | null;
}

const d = (x: string): Decimal => new Decimal(x);

export function foydaZarar(k: FoydaZararKirimi): FoydaZarar {
  const tushum = d(k.tushum);
  const tannarx = d(k.material).plus(k.ishHaqi);
  const yalpi = tushum.minus(tannarx);
  const xarajatlar = k.xarajatlar
    .filter((x) => !d(x.summa).isZero())
    .map((x) => ({ modda: x.modda, nom: xarajatModdaNomi(x.modda), summa: d(x.summa).toFixed(2) }))
    .sort((a, b) => d(b.summa).comparedTo(d(a.summa)));
  const xarajatJami = xarajatlar.reduce((y, x) => y.plus(x.summa), new Decimal(0));
  const sof = yalpi.minus(xarajatJami).minus(k.kursZarar).plus(k.kursDaromad);
  return {
    tushum: tushum.toFixed(2),
    tannarx: tannarx.toFixed(2),
    material: d(k.material).toFixed(2),
    ishHaqi: d(k.ishHaqi).toFixed(2),
    yalpiFoyda: yalpi.toFixed(2),
    xarajatlar,
    xarajatJami: xarajatJami.toFixed(2),
    kursZarar: d(k.kursZarar).toFixed(2),
    kursDaromad: d(k.kursDaromad).toFixed(2),
    sofFoyda: sof.toFixed(2),
    rentabellik: tushum.isZero() ? null : sof.div(tushum).times(100).toDecimalPlaces(1).toNumber(),
  };
}

/** O'zgarish foizi; oldingi nol bo'lsa `null` (cheksiz o'sish ma'nosiz) */
export function ozgarishFoizi(joriy: string, oldingi: string): number | null {
  const o = d(oldingi);
  if (o.isZero()) return null;
  return d(joriy).minus(o).div(o.abs()).times(100).toDecimalPlaces(1).toNumber();
}
