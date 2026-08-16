/**
 * lib/domain/pul.ts — QISM 1 §3 · 1.3-invariant
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │ `Som` va `Dollar` — YOPIQ turlar. Ular `Decimal` dan meros olmaydi.   │
 * │ Shuning uchun `somSumma.plus(dollarSumma)` degan yozuv umuman         │
 * │ mavjud emas — bunday metod turda yo'q. Har amal shu fayldagi          │
 * │ funksiya orqali bajariladi va valyuta kompilyatorda tekshiriladi.     │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * ⚠️ QISM 1 §3.1 dagi namuna (`type Som = Decimal & { brand }`) 1.3-invariantni
 * himoya QILMAYDI: `Dollar` ham `Decimal` bo'lgani uchun `plus()` uni bemalol
 * qabul qiladi va TypeScript xato bermaydi. Shu sabab bu yerda yopiq tur
 * ishlatilgan. Batafsil izoh: docs/QARORLAR-KOD.md, P-01.
 *
 * Saqlash:  bazada NUMERIC(14,2) · koddan chiqqanda string (`pulMatn`)
 * Hisoblash: decimal.js, ROUND_HALF_UP
 */

import Decimal from 'decimal.js';
import { BiznesXato } from '@/lib/xato';

/**
 * Loyihaning o'z Decimal nusxasi. Global `Decimal` sozlamasi o'zgartirilmaydi —
 * aks holda boshqa kutubxona uni almashtirib qo'yishi mumkin.
 */
const D = Decimal.clone({
  precision: 34,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9e15,
  toExpPos: 9e15,
});

export type Valyuta = 'SOM' | 'USD';

/** Bazadagi NUMERIC(14,2) — pul har doim ikki kasr xonasi bilan saqlanadi. */
export const PUL_KASR_XONASI = 2;

/** Yaxlitlash qadamlari — QISM 1 §3.3 */
export const QADAM_NARX = 100;
export const QADAM_KASSA = 1000;

// Bu ikki simvol EKSPORT QILINMAYDI. Modul tashqarisidagi kod ichki
// Decimal qiymatga nom orqali yeta olmaydi — faqat quyidagi funksiyalar orqali.
const BREND: unique symbol = Symbol('pul.valyuta');
const QIYMAT: unique symbol = Symbol('pul.qiymat');

export interface Som {
  readonly [BREND]: 'SOM';
  readonly [QIYMAT]: Decimal;
}

export interface Dollar {
  readonly [BREND]: 'USD';
  readonly [QIYMAT]: Decimal;
}

export type Pul = Som | Dollar;

// ─── Ichki yordamchilar ───────────────────────────────────────────────────

function ichki(p: Pul): Decimal {
  return p[QIYMAT];
}

function yasaSom(d: Decimal): Som {
  const p: Som = { [BREND]: 'SOM', [QIYMAT]: d };
  return Object.freeze(p);
}

function yasaDollar(d: Decimal): Dollar {
  const p: Dollar = { [BREND]: 'USD', [QIYMAT]: d };
  return Object.freeze(p);
}

/** Namunadagi valyutani saqlab yangi qiymat yasaydi. Valyuta almashmaydi. */
function bir<P extends Pul>(namuna: P, d: Decimal): P {
  const yangi: Pul = namuna[BREND] === 'SOM' ? yasaSom(d) : yasaDollar(d);
  return yangi as P;
}

function songaOgir(xom: string | number, kod: 'PUL_NOTOGRI' | 'KURS_NOTOGRI'): Decimal {
  // decimal.js son bo'lmagan matnda o'zining `DecimalError` ini otadi. U
  // foydalanuvchiga ko'rsatilmaydi — bazadan yoki API dan buzuq qiymat kelsa
  // ham xabar tushunarli bo'lishi kerak (§12.1).
  let d: Decimal;
  try {
    d = new D(xom);
  } catch {
    throw new BiznesXato(kod, `qiymat: ${String(xom)}`);
  }
  if (!d.isFinite()) {
    throw new BiznesXato(kod, `qiymat: ${String(xom)}`);
  }
  return d;
}

// ─── Yaratish ─────────────────────────────────────────────────────────────

/** So'm summasi. Bazadan kelgan `string` ni ham, kodda yozilgan sonni ham qabul qiladi. */
export function som(qiymat: string | number): Som {
  return yasaSom(songaOgir(qiymat, 'PUL_NOTOGRI'));
}

/** Dollar summasi. */
export function dollar(qiymat: string | number): Dollar {
  return yasaDollar(songaOgir(qiymat, 'PUL_NOTOGRI'));
}

export const nolSom = (): Som => som(0);
export const nolDollar = (): Dollar => dollar(0);

// ─── Amallar ──────────────────────────────────────────────────────────────
//
// `NoInfer<P>` ikkinchi parametrdan tur chiqarishni to'xtatadi: P faqat
// birinchi argumentdan aniqlanadi. Shuning uchun `qosh(som(1), dollar(2))`
// kompilyatsiyada xato beradi — 1.3-invariant shu yerda ushlanadi.

export function qosh<P extends Pul>(a: P, b: NoInfer<P>): P {
  return bir(a, ichki(a).plus(ichki(b)));
}

export function ayir<P extends Pul>(a: P, b: NoInfer<P>): P {
  return bir(a, ichki(a).minus(ichki(b)));
}

/** Pulni sonli koeffitsientga ko'paytiradi (miqdor, foiz, dona). */
export function kopaytir<P extends Pul>(a: P, koeffitsient: string | number): P {
  return bir(a, ichki(a).times(songaOgir(koeffitsient, 'PUL_NOTOGRI')));
}

export function bol<P extends Pul>(a: P, boluvchi: string | number): P {
  const b = songaOgir(boluvchi, 'PUL_NOTOGRI');
  if (b.isZero()) {
    throw new BiznesXato('NOLGA_BOLINDI', 'pulni nolga bo\'lish');
  }
  return bir(a, ichki(a).div(b));
}

export function manfiy<P extends Pul>(a: P): P {
  return bir(a, ichki(a).negated());
}

/** Bir xil valyutadagi summalar yig'indisi. Bo'sh ro'yxatda `dastlabki` qaytadi. */
export function yigindi<P extends Pul>(dastlabki: P, qatordagilar: readonly NoInfer<P>[]): P {
  let jami = ichki(dastlabki);
  for (const q of qatordagilar) {
    jami = jami.plus(ichki(q));
  }
  return bir(dastlabki, jami);
}

/**
 * Ikki summaning nisbati — sof son (foiz hisoblari uchun, 11.7.5).
 * Valyuta bir xil bo'lishi shart, natijada valyuta yo'q.
 */
export function nisbat<P extends Pul>(a: P, b: NoInfer<P>): Decimal {
  const bul = ichki(b);
  if (bul.isZero()) {
    throw new BiznesXato('NOLGA_BOLINDI', 'nisbat maxraji nol');
  }
  return ichki(a).div(bul);
}

// ─── Taqqoslash ───────────────────────────────────────────────────────────

export function taqqosla<P extends Pul>(a: P, b: NoInfer<P>): -1 | 0 | 1 {
  return ichki(a).comparedTo(ichki(b)) as -1 | 0 | 1;
}

export function teng<P extends Pul>(a: P, b: NoInfer<P>): boolean {
  return ichki(a).equals(ichki(b));
}

export function kattami<P extends Pul>(a: P, b: NoInfer<P>): boolean {
  return ichki(a).greaterThan(ichki(b));
}

export function kichikmi<P extends Pul>(a: P, b: NoInfer<P>): boolean {
  return ichki(a).lessThan(ichki(b));
}

export const nolmi = (a: Pul): boolean => ichki(a).isZero();
export const musbatmi = (a: Pul): boolean => ichki(a).greaterThan(0);
export const manfiymi = (a: Pul): boolean => ichki(a).isNegative() && !ichki(a).isZero();

// ─── Yaxlitlash — QISM 1 §3.3 ─────────────────────────────────────────────

/** Berilgan qadamgacha yaxlitlaydi (100 so'm, 1000 so'm). ROUND_HALF_UP. */
export function yaxlitla(a: Som, qadam: number): Som {
  if (!Number.isInteger(qadam) || qadam <= 0) {
    throw new BiznesXato('YAXLITLASH_NOTOGRI', `qadam: ${String(qadam)}`);
  }
  const q = new D(qadam);
  return bir(a, ichki(a).div(q).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).times(q));
}

/** Narx yaxlitlash — 100 so'm (6.3 offsetdan keyin, 13.5 bot narxi). */
export const yaxlitlaNarx = (a: Som): Som => yaxlitla(a, QADAM_NARX);

/** Kassa to'lovi yaxlitlash — 1 000 so'm (12.19). */
export const yaxlitlaKassa = (a: Som): Som => yaxlitla(a, QADAM_KASSA);

/** Dollar — 0.01 gacha. */
export const yaxlitlaDollar = (a: Dollar): Dollar =>
  bir(a, ichki(a).toDecimalPlaces(PUL_KASR_XONASI, Decimal.ROUND_HALF_UP));

// ─── Valyuta konversiyasi — QISM 1 §3.2 ───────────────────────────────────

export interface Kurs {
  readonly qiymat: Decimal;
  readonly sana: Date;
  /** `SNAPSHOT` — buyurtmaga qotib qolgan kurs (2.3-invariant), `JORIY` — bugungi. */
  readonly manba: 'JORIY' | 'SNAPSHOT';
}

export function kurs(qiymat: string | number, sana: Date, manba: Kurs['manba']): Kurs {
  const d = songaOgir(qiymat, 'KURS_NOTOGRI');
  if (d.lessThanOrEqualTo(0)) {
    throw new BiznesXato('KURS_NOTOGRI', `kurs musbat bo'lishi kerak: ${String(qiymat)}`);
  }
  return Object.freeze({ qiymat: d, sana, manba });
}

/**
 * Dollarni so'mga o'giradi. Yagona konversiya funksiyasi.
 *
 * Kurs **parametr sifatida** keladi — funksiya ichida sozlamadan o'qilmaydi.
 * Aks holda eski buyurtma bugungi kurs bilan qayta hisoblanib, 2.3-invariant
 * buziladi.
 */
export function ogir(summa: Dollar, k: Kurs): Som {
  const natija = ichki(summa).times(k.qiymat).toDecimalPlaces(PUL_KASR_XONASI, Decimal.ROUND_HALF_UP);
  return som(natija.toFixed(PUL_KASR_XONASI));
}

// ─── Kurs farqi — TZ 9.6 ──────────────────────────────────────────────────

/**
 * TZ 9.6 — «Kurs tushsa bu DAROMAD bo'ladi. U alohida moddaga yoziladi,
 * xarajat moddasiga musbat qiymat qo'yilmaydi.»
 *
 * Ikkitasi ataylab ajratilgan: bitta moddaga yig'ilsa bir-birini yeb qo'yadi
 * va yil davomida qancha yo'qotilgani ko'rinmay qoladi.
 */
export type KursFarqiTuri = 'XARAJAT' | 'DAROMAD' | 'YOQ';

export interface KursFarqi {
  readonly turi: KursFarqiTuri;
  /** Har doim musbat. Yo'nalishni `turi` bildiradi. */
  readonly summa: Som;
  /** Kirim kunidagi kursda qotgan tannarx — o'zgarmaydi (2.3-invariant) */
  readonly qotganTannarx: Som;
  /** To'lov kunida kassadan chiqqan summa */
  readonly tolovSummasi: Som;
}

/**
 * Dollardagi qarz to'langanda kurs farqini hisoblaydi.
 *
 * Tannarxga TEGMAYDI: mahsulot allaqachon o'sha narxda sotilgan, o'tgan
 * oyning hisoboti o'zgarmasligi kerak (2.3-invariant).
 */
export function kursFarqi(qarz: Dollar, kirimKursi: Kurs, tolovKursi: Kurs): KursFarqi {
  const qotganTannarx = ogir(qarz, kirimKursi);
  const tolovSummasi = ogir(qarz, tolovKursi);
  const farq = ayir(tolovSummasi, qotganTannarx);

  if (nolmi(farq)) {
    return { turi: 'YOQ', summa: nolSom(), qotganTannarx, tolovSummasi };
  }

  // Kurs ko'tarilgan → ko'proq to'landi → xarajat
  return musbatmi(farq)
    ? { turi: 'XARAJAT', summa: farq, qotganTannarx, tolovSummasi }
    : { turi: 'DAROMAD', summa: manfiy(farq), qotganTannarx, tolovSummasi };
}

// ─── Chiqarish ────────────────────────────────────────────────────────────

export const valyutasi = (p: Pul): Valyuta => p[BREND];

/** Bazaga va API ga beriladigan ko'rinish — har doim `string`, ikki kasr xonasi. */
export const pulMatn = (p: Pul): string => ichki(p).toFixed(PUL_KASR_XONASI);

/**
 * Minglik ajratgichi — QISM 1 §19 formati `1 234 567.89` (oddiy probel, U+0020).
 *
 * Bu belgi ATAYLAB konstanta: ko'rinishi bir xil bo'lgan uzilmas probel
 * (U+00A0) bilan adashtirish oson va xato ko'z bilan topilmaydi.
 */
export const MINGLIK_AJRATGICH = ' ';

/** Manfiy belgisi — matematik minus (U+2212), defis emas. */
export const MANFIY_BELGI = '−';

/**
 * Interfeys uchun ko'rinish — QISM 1 §19 formati: `1 234 567.89`.
 * So'mda kasr qismi `.00` bo'lsa ko'rsatilmaydi.
 */
export function pulKorsat(p: Pul): string {
  const d = ichki(p);
  const qismlar = d.abs().toFixed(PUL_KASR_XONASI).split('.');
  const butun = (qismlar[0] ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, MINGLIK_AJRATGICH);
  const kasr = qismlar[1] ?? '00';
  const kasrKerak = p[BREND] === 'USD' || kasr !== '00';
  const natija = kasrKerak ? `${butun}.${kasr}` : butun;
  return d.isNegative() && !d.isZero() ? `${MANFIY_BELGI}${natija}` : natija;
}
