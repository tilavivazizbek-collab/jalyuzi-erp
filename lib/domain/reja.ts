/**
 * lib/domain/reja.ts — TZ 21 · Rejalar. Sof hisob (bazaga tegmaydi). 2026-10-13
 *
 * ⚠️ PUL Decimal bilan. Foiz — bir xona kasr bilan matn («87.4»).
 * ⚠️ EC-REJ-01 / EC-REJ-06: reja yo'q yoki 0 — bajarilish HISOBLANMAYDI
 *    (`null`), «reja yo'q» bilan bir xil.
 * ⚠️ EC-REJ-05: 200% — ogohlantirish yo'q, yaxshi natija (yashil).
 */

import Decimal from 'decimal.js';
import { pulMatn, som } from '@/lib/domain/pul';
import { foyda, foydaUlushi } from '@/lib/domain/filial-hisob';

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
    // Taxmin — butun so'mgacha (tiyin bu yerda soxta aniqlik, pul prognozi kabi)
    kutilgan: kutilgan.toDecimalPlaces(0).toFixed(2),
    farq: new Decimal(k.fakt).minus(kutilgan).toDecimalPlaces(0).toFixed(2),
    prognoz: prognoz.toDecimalPlaces(0).toFixed(2),
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

// ─── TZ 21.5 · Fakt ───────────────────────────────────────────────────────

export interface FaktQatori {
  /** TOPSHIRILDI — o'sha oyga tushum; QAYTARILDI — o'sha oyda ayiriladi (21.5.1) */
  readonly turi: 'TOPSHIRILDI' | 'QAYTARILDI';
  readonly sotuvchiId: number;
  readonly sotganFilialId: number;
  readonly ishlabFilialId: number;
  /** So'mda; QAYTARILDI da manfiy (qaytarilgan summa, ushlanma — tushum bo'lib qoladi) */
  readonly tushum: string;
  readonly tannarx: string;
  readonly ishHaqi: string;
}

export interface RejaFakti {
  readonly korxona: { readonly tushum: string; readonly foyda: string };
  /** filial id → tushum (SOTGAN filial bo'yicha, 21.5) va taqsimlangan foyda (20.17) */
  readonly filiallar: ReadonlyMap<number, { readonly tushum: string; readonly foyda: string }>;
  /** `${filialId}|${xodimId}` → tushum (EC-REJ-03: sotgan filialida) */
  readonly sotuvchilar: ReadonlyMap<string, string>;
}

/**
 * TZ 21.5 — fakt. Korxona = hamma qator (taqsimotsiz), filial foydasi —
 * 20.17 qoidasi (`foydaUlushi`: bitta filial — 100%, ikki filial — 50/50).
 * ⚠️ Qaytarishda xarajat qaytmaydi (material ishlatilgan) — faqat tushum
 *    kamayadi, foyda ham shuncha kamayadi va xuddi shunday bo'linadi.
 */
export function rejaFaktiniYigish(qatorlar: readonly FaktQatori[]): RejaFakti {
  let tushum = new Decimal(0);
  let foydaJami = new Decimal(0);
  const filiallar = new Map<number, { tushum: Decimal; foyda: Decimal }>();
  const sotuvchilar = new Map<string, Decimal>();
  const fl = (id: number) => {
    const x = filiallar.get(id) ?? { tushum: new Decimal(0), foyda: new Decimal(0) };
    filiallar.set(id, x);
    return x;
  };

  for (const q of qatorlar) {
    const n = { tushum: som(q.tushum), tannarx: som(q.tannarx), ishHaqi: som(q.ishHaqi) };
    const bitta = q.sotganFilialId === q.ishlabFilialId;
    tushum = tushum.plus(q.tushum);
    foydaJami = foydaJami.plus(pulMatn(foyda(n)));

    const s = fl(q.sotganFilialId);
    s.tushum = s.tushum.plus(q.tushum);
    const ulush = pulMatn(foydaUlushi(n, bitta));
    s.foyda = s.foyda.plus(ulush);
    if (!bitta) {
      const i = fl(q.ishlabFilialId);
      i.foyda = i.foyda.plus(ulush);
    }

    const k = `${String(q.sotganFilialId)}|${String(q.sotuvchiId)}`;
    sotuvchilar.set(k, (sotuvchilar.get(k) ?? new Decimal(0)).plus(q.tushum));
  }

  return {
    korxona: { tushum: tushum.toFixed(2), foyda: foydaJami.toFixed(2) },
    filiallar: new Map([...filiallar].map(([id, x]) => [id, { tushum: x.tushum.toFixed(2), foyda: x.foyda.toFixed(2) }])),
    sotuvchilar: new Map([...sotuvchilar].map(([k, x]) => [k, x.toFixed(2)])),
  };
}

const OYLAR = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

/** `2026-08-01` → «Avgust 2026» */
export function oyNomi(oy: string): string {
  return `${OYLAR[Number(oy.slice(5, 7)) - 1] ?? ''} ${oy.slice(0, 4)}`;
}
