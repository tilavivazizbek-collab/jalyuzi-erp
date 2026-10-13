/**
 * lib/domain/reja.ts — TZ 21 · Rejalar. Sof hisob (bazaga tegmaydi). 2026-10-13
 *
 * ⚠️ PUL Decimal bilan. Foiz — bir xona kasr bilan matn («87.4»).
 * ⚠️ EC-REJ-01 / EC-REJ-06: reja yo'q yoki 0 — bajarilish HISOBLANMAYDI
 *    (`null`), «reja yo'q» bilan bir xil.
 * ⚠️ EC-REJ-05: 200% — ogohlantirish yo'q, yaxshi natija (yashil).
 */

import Decimal from 'decimal.js';

export const REJA_TURLARI = ['KORXONA', 'FILIAL', 'SOTUVCHI'] as const;
export type RejaTuri = (typeof REJA_TURLARI)[number];

/** TZ 21.10 · 14.4 — standart chegaralar */
export const BAJARILISH_PAST = 80;
export const BAJARILISH_YAXSHI = 95;

export type BajarilishRangi = 'QIZIL' | 'SARIQ' | 'YASHIL';

const rejaBormi = (reja: string | null): reja is string => reja !== null && new Decimal(reja).gt(0);

/** `2026-08-17` → `2026-08-01` */
export function oyBoshi(sana: string): string {
  return `${sana.slice(0, 7)}-01`;
}

/** Oydagi kunlar soni (`2026-02-01` → 28) */
export function oyKunlari(oy: string): number {
  const y = Number(oy.slice(0, 4));
  const m = Number(oy.slice(5, 7));
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Keyingi / oldingi oy boshi */
export function oyQosh(oy: string, n: number): string {
  const d = new Date(Date.UTC(Number(oy.slice(0, 4)), Number(oy.slice(5, 7)) - 1 + n, 1));
  return d.toISOString().slice(0, 10);
}

/** Bajarilish foizi; reja yo'q yoki 0 — `null` */
export function bajarilish(reja: string | null, fakt: string): string | null {
  if (!rejaBormi(reja)) return null;
  return new Decimal(fakt).div(reja).times(100).toDecimalPlaces(1).toFixed(1);
}

/** 21.6.1 — 🔴 < 80% · 🟡 80–95% · 🟢 ≥ 95% */
export function bajarilishRangi(
  foiz: string | null,
  past: number = BAJARILISH_PAST,
  yaxshi: number = BAJARILISH_YAXSHI,
): BajarilishRangi | null {
  if (foiz === null) return null;
  const f = new Decimal(foiz);
  if (f.gte(yaxshi)) return 'YASHIL';
  if (f.gte(past)) return 'SARIQ';
  return 'QIZIL';
}

export interface Surat {
  /** Oyning necha kuni o'tdi (bugun ham kiradi) */
  readonly otganKun: number;
  readonly oyKuni: number;
  /** O'tgan qism, foizda («48.4») */
  readonly otganFoiz: string;
  /** Shu kungacha teng taqsimlanganda bo'lishi kerak edi */
  readonly kutilgan: string;
  /** fakt − kutilgan: manfiy — orqada */
  readonly farq: string;
  /** Shu sur'atda oy oxirida */
  readonly prognoz: string;
  readonly prognozFoiz: string;
}

/**
 * TZ 21.6.2 — oy ichida sur'at. `bugun` oy ichida bo'lishi kerak;
 * oy tugagan bo'lsa — butun oy o'tgan hisoblanadi.
 * Reja yo'q bo'lsa — `null` (EC-REJ-01).
 */
export function surat(k: {
  readonly reja: string | null;
  readonly fakt: string;
  readonly oy: string;
  readonly bugun: string;
}): Surat | null {
  if (!rejaBormi(k.reja)) return null;
  const oyKuni = oyKunlari(k.oy);
  const otganKun =
    k.bugun < k.oy ? 0 : k.bugun >= oyQosh(k.oy, 1) ? oyKuni : Number(k.bugun.slice(8, 10));
  if (otganKun === 0) return null;

  const ulush = new Decimal(otganKun).div(oyKuni);
  const kutilgan = new Decimal(k.reja).times(ulush);
  const prognoz = new Decimal(k.fakt).div(ulush);
  return {
    otganKun,
    oyKuni,
    otganFoiz: ulush.times(100).toDecimalPlaces(1).toFixed(1),
    kutilgan: kutilgan.toDecimalPlaces(2).toFixed(2),
    farq: new Decimal(k.fakt).minus(kutilgan).toDecimalPlaces(2).toFixed(2),
    prognoz: prognoz.toDecimalPlaces(2).toFixed(2),
    prognozFoiz: prognoz.div(k.reja).times(100).toDecimalPlaces(1).toFixed(1),
  };
}

/**
 * TZ 21.3.1 — qismlar yig'indisi umumiyga teng bo'lishi SHART EMAS,
 * faqat ko'rsatiladi. Umumiy reja yo'q bo'lsa — solishtirilmaydi.
 */
export function yigindiTekshir(
  umumiy: string | null,
  qismlar: readonly (string | null)[],
): { readonly yigindi: string; readonly teng: boolean | null } {
  const yigindi = qismlar.reduce((a: Decimal, q) => a.plus(q ?? 0), new Decimal(0));
  return {
    yigindi: yigindi.toFixed(2),
    teng: umumiy === null ? null : yigindi.eq(umumiy),
  };
}

/** TZ 21.3.2 — «O'tgan oydan nusxa [+10 %]»: butun so'mgacha yaxlitlanadi */
export function foizQosh(summa: string | null, foiz: string): string | null {
  if (summa === null) return null;
  return new Decimal(summa)
    .times(new Decimal(100).plus(foiz).div(100))
    .toDecimalPlaces(0)
    .toFixed(2);
}

/**
 * Forma kiritishi → so'm summasi. «180 000 000», «180,000,000» — bir xil.
 * Bo'sh — `null` (reja yo'q); noto'g'ri — `undefined`.
 */
export function rejaSummasiniOqi(xom: string): string | null | undefined {
  const s = xom.replace(/[\s  ,]/g, '');
  if (s === '') return null;
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(s)) return undefined;
  return new Decimal(s).toFixed(2);
}

/** Forma maydoni kaliti: `KORXONA|0|0`, `FILIAL|5|0`, `SOTUVCHI|5|17` */
export function rejaKaliti(turi: RejaTuri, filialId: number | null, xodimId: number | null): string {
  return `${turi}|${String(filialId ?? 0)}|${String(xodimId ?? 0)}`;
}
