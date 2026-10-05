/**
 * lib/domain/qarz-taqsimot.ts — TZ 6.7 · 6.8 · 11.6 · 2.2-invariant
 *
 * Mijoz qarz jurnalini (`mijoz_harakat`) BUYURTMALARGA taqsimlaydi:
 * qaysi buyurtma to'langan, qaysi biri qancha qoldi, qachon yopildi.
 *
 * ⚠️ NEGA KERAK (egasi auditi 2026-10-06)
 *
 *    Kartochkadan «Qarzni to'lash» bilan kelgan pul kassaga MIJOZ
 *    nomiga yoziladi — hech qaysi buyurtmaga bog'lanmaydi. Ekranlar
 *    esa «to'landimi» ni faqat buyurtmaga bog'langan kassa yozuvidan
 *    sanardi: qarzini to'liq uzgan mijozning buyurtmalari «To'lanmagan»
 *    bo'lib qolar, to'lov intizomi va «eng eski qarz» yolg'on chiqardi.
 *
 * ⚠️ QOIDA — buxgalteriyadagi odatiy FIFO:
 *
 *    1. Buyurtmaga qilingan to'lov va qaytarish — AVVAL o'sha buyurtmaga
 *    2. Bog'lanmagan pul (kartochkadan to'lov, avans, umidsiz qarz) va
 *       buyurtmadan ortib qolgani — ENG ESKI ochiq qarzga
 *    3. Taqsimlanmay qolgani — AVANS (mijozning oldindan bergan puli)
 *
 * ⚠️ VALYUTALAR ALOHIDA (1.3). Dollarli buyurtmani so'mli to'lov yopmaydi.
 *
 * ⚠️ BAZAGA TEGMAYDI — jurnal qatorlarini parametr sifatida oladi.
 *    Natija saqlanmaydi: har safar jurnaldan qayta hisoblanadi
 *    (2.2-invariant — balans saqlanmaydi).
 */

import Decimal from 'decimal.js';
import type { Valyuta } from './pul';

/** Jurnalning bitta qatori — `mijoz_harakat` dan */
export interface JurnalQatori {
  readonly id: number;
  readonly sana: Date;
  readonly turi: string;
  /** `+` qarz oshdi, `−` kamaydi. MATN — NUMERIC dan */
  readonly summa: string;
  readonly valyuta: Valyuta;
  /**
   * Qator qaysi buyurtmaga tegishli. `SOTUV` (buyurtma, storno, tahrir),
   * buyurtmaga qilingan `TOLOV`, pozitsiya `QAYTARISH` i — bog'langan.
   * Kartochkadan to'lov, avans, umidsiz qarz, boshlang'ich — `null`.
   */
  readonly buyurtmaId: number | null;
}

/** Qarz bandi — bitta buyurtma yoki bog'lanmagan qarz (boshlang'ich) */
export interface QarzBandi {
  /** `b:12` — buyurtma, `h:34` — jurnal qatori */
  readonly kalit: string;
  readonly buyurtmaId: number | null;
  readonly turi: string;
  /** Qarz paydo bo'lgan sana */
  readonly sana: Date;
  readonly valyuta: Valyuta;
  readonly summa: string;
  readonly tolangan: string;
  readonly qolgan: string;
  /** To'liq yopilgan sana. Ochiq bo'lsa `null` */
  readonly yopildi: Date | null;
}

export interface QarzTaqsimoti {
  readonly bandlar: readonly QarzBandi[];
  /** Taqsimlanmay qolgan pul — mijozning avansi, valyuta bo'yicha */
  readonly avans: Readonly<Record<Valyuta, string>>;
  /** Ochiq qoldiq minus avans — `SUM(summa)` ga AYNAN teng bo'ladi */
  readonly qarz: Readonly<Record<Valyuta, string>>;
}

interface Kredit {
  sana: Date;
  qoldiq: Decimal;
}

interface IchkiBand {
  kalit: string;
  buyurtmaId: number | null;
  turi: string;
  sana: Date;
  valyuta: Valyuta;
  summa: Decimal;
  qolgan: Decimal;
  yopildi: Date | null;
}

const kech = (a: Date, b: Date): Date => (a.getTime() >= b.getTime() ? a : b);
const tartib = (a: { sana: Date }, b: { sana: Date }): number =>
  a.sana.getTime() - b.sana.getTime();

/** Bandga kreditni qo'llaydi; yopilsa sanasini yozadi */
function qolla(band: IchkiBand, kredit: Kredit): void {
  if (band.qolgan.lessThanOrEqualTo(0) || kredit.qoldiq.lessThanOrEqualTo(0)) return;
  const olinadi = Decimal.min(band.qolgan, kredit.qoldiq);
  band.qolgan = band.qolgan.minus(olinadi);
  kredit.qoldiq = kredit.qoldiq.minus(olinadi);
  if (band.qolgan.isZero()) band.yopildi = kech(kredit.sana, band.sana);
}

function valyutaUchun(
  qatorlar: readonly JurnalQatori[],
  valyuta: Valyuta,
): { bandlar: IchkiBand[]; avans: Decimal } {
  const buyurtmalar = new Map<number, JurnalQatori[]>();
  const bogsiz: JurnalQatori[] = [];

  for (const q of qatorlar) {
    if (q.valyuta !== valyuta) continue;
    if (q.buyurtmaId === null) {
      bogsiz.push(q);
    } else {
      const r = buyurtmalar.get(q.buyurtmaId) ?? [];
      r.push(q);
      buyurtmalar.set(q.buyurtmaId, r);
    }
  }

  const bandlar: IchkiBand[] = [];
  /** Bog'lanmagan kreditlar + buyurtmadan ortgan pul — FIFO navbati */
  const umumiy: Kredit[] = [];

  for (const [buyurtmaId, rs] of buyurtmalar) {
    rs.sort(tartib);
    /**
     * ⚠️ `SOTUV` qatorlari (yaratish, tahrir, storno) — buyurtma qarzi.
     *    Boshqalari (to'lov, qaytarish) — shu buyurtmaga kredit.
     */
    const sotuv = rs.filter((r) => r.turi === 'SOTUV');
    const summa = sotuv.reduce((y, r) => y.plus(r.summa), new Decimal(0));
    const sana = sotuv[0]?.sana ?? rs[0]?.sana ?? new Date(0);
    const band: IchkiBand = {
      kalit: `b:${String(buyurtmaId)}`,
      buyurtmaId,
      turi: 'SOTUV',
      sana,
      valyuta,
      summa: Decimal.max(summa, 0),
      qolgan: Decimal.max(summa, 0),
      yopildi: null,
    };

    for (const r of rs) {
      if (r.turi === 'SOTUV') continue;
      const s = new Decimal(r.summa);
      if (s.lessThan(0)) {
        const k: Kredit = { sana: r.sana, qoldiq: s.negated() };
        qolla(band, k);
        // ⚠️ Buyurtmadan ortib qolgani — boshqa qarzga yoki avansga
        if (k.qoldiq.greaterThan(0)) umumiy.push(k);
      } else if (s.greaterThan(0)) {
        // Buyurtmaga bog'langan musbat qator (kam uchraydi) — qarzga qo'shiladi
        band.summa = band.summa.plus(s);
        band.qolgan = band.qolgan.plus(s);
      }
    }

    /**
     * ⚠️ Storno qilingan yoki nolga tushgan buyurtma — qarz bandi emas.
     *    Unga kelgan to'lov esa (yuqorida) umumiy navbatga o'tgan.
     */
    if (band.summa.greaterThan(0)) {
      if (band.qolgan.isZero() && band.yopildi === null) band.yopildi = band.sana;
      bandlar.push(band);
    }
  }

  for (const q of bogsiz) {
    const s = new Decimal(q.summa);
    if (s.greaterThan(0)) {
      bandlar.push({
        kalit: `h:${String(q.id)}`,
        buyurtmaId: null,
        turi: q.turi,
        sana: q.sana,
        valyuta,
        summa: s,
        qolgan: s,
        yopildi: null,
      });
    } else if (s.lessThan(0)) {
      umumiy.push({ sana: q.sana, qoldiq: s.negated() });
    }
  }

  bandlar.sort(tartib);
  umumiy.sort(tartib);

  for (const k of umumiy) {
    for (const b of bandlar) {
      if (k.qoldiq.lessThanOrEqualTo(0)) break;
      qolla(b, k);
    }
  }

  const avans = umumiy.reduce((y, k) => y.plus(k.qoldiq), new Decimal(0));
  return { bandlar, avans };
}

export function qarzniTaqsimla(qatorlar: readonly JurnalQatori[]): QarzTaqsimoti {
  const som = valyutaUchun(qatorlar, 'SOM');
  const usd = valyutaUchun(qatorlar, 'USD');

  const ochiq = (bs: readonly IchkiBand[]): Decimal =>
    bs.reduce((y, b) => y.plus(b.qolgan), new Decimal(0));

  const bandlar = [...som.bandlar, ...usd.bandlar].sort(tartib).map(
    (b): QarzBandi => ({
      kalit: b.kalit,
      buyurtmaId: b.buyurtmaId,
      turi: b.turi,
      sana: b.sana,
      valyuta: b.valyuta,
      summa: b.summa.toFixed(2),
      tolangan: b.summa.minus(b.qolgan).toFixed(2),
      qolgan: b.qolgan.toFixed(2),
      yopildi: b.yopildi,
    }),
  );

  return {
    bandlar,
    avans: { SOM: som.avans.toFixed(2), USD: usd.avans.toFixed(2) },
    qarz: {
      SOM: ochiq(som.bandlar).minus(som.avans).toFixed(2),
      USD: ochiq(usd.bandlar).minus(usd.avans).toFixed(2),
    },
  };
}

// ─── Qarz yoshi (debitorlik qarishi) ──────────────────────────────────────

/** Odatiy buxgalteriya oraliqlari, kunda */
export const YOSH_ORALIQLARI = ['0-30', '31-60', '61-90', '90+'] as const;
export type YoshOraligi = (typeof YOSH_ORALIQLARI)[number];

const MS_KUN = 86_400_000;

/** Ikki sana orasidagi to'liq kunlar */
export function kunFarqi(dan: Date, gacha: Date): number {
  return Math.floor((gacha.getTime() - dan.getTime()) / MS_KUN);
}

export function yoshOraligi(kun: number): YoshOraligi {
  if (kun <= 30) return '0-30';
  if (kun <= 60) return '31-60';
  if (kun <= 90) return '61-90';
  return '90+';
}

export type QarzYoshi = Readonly<Record<YoshOraligi, string>>;

/**
 * Ochiq qarzni yoshi bo'yicha guruhlaydi — bitta valyuta uchun.
 *
 * ⚠️ Yosh qarz PAYDO BO'LGAN kundan sanaladi (buyurtma sanasi).
 *    Muddat o'tgani alohida — `muddatOtganQarz`.
 */
export function qarzYoshi(
  bandlar: readonly QarzBandi[],
  valyuta: Valyuta,
  bugun: Date,
): QarzYoshi {
  const y: Record<YoshOraligi, Decimal> = {
    '0-30': new Decimal(0),
    '31-60': new Decimal(0),
    '61-90': new Decimal(0),
    '90+': new Decimal(0),
  };
  for (const b of bandlar) {
    if (b.valyuta !== valyuta) continue;
    const q = new Decimal(b.qolgan);
    if (q.lessThanOrEqualTo(0)) continue;
    const o = yoshOraligi(kunFarqi(b.sana, bugun));
    y[o] = y[o].plus(q);
  }
  return {
    '0-30': y['0-30'].toFixed(2),
    '31-60': y['31-60'].toFixed(2),
    '61-90': y['61-90'].toFixed(2),
    '90+': y['90+'].toFixed(2),
  };
}

/**
 * To'lov muddati o'tgan ochiq qarz — bitta valyuta uchun.
 *
 * ⚠️ `muddatKun = null` — mijozga muddat qo'yilmagan: hech narsa
 *    «muddati o'tgan» emas (bo'sh katak = tekshiruv yo'q, CLAUDE.md §14a).
 */
export function muddatOtganQarz(
  bandlar: readonly QarzBandi[],
  valyuta: Valyuta,
  muddatKun: number | null,
  bugun: Date,
): { summa: string; engEskiKun: number | null } {
  if (muddatKun === null) return { summa: '0.00', engEskiKun: null };
  let summa = new Decimal(0);
  let eng: number | null = null;
  for (const b of bandlar) {
    if (b.valyuta !== valyuta) continue;
    const q = new Decimal(b.qolgan);
    if (q.lessThanOrEqualTo(0)) continue;
    const otdi = kunFarqi(b.sana, bugun) - muddatKun;
    if (otdi > 0) {
      summa = summa.plus(q);
      eng = eng === null ? otdi : Math.max(eng, otdi);
    }
  }
  return { summa: summa.toFixed(2), engEskiKun: eng };
}

// ─── To'lov intizomi ──────────────────────────────────────────────────────

export interface TolovIntizomi {
  /** Yopilgan buyurtmalar bo'yicha o'rtacha kun */
  readonly ortachaKun: number | null;
  readonly engUzunKun: number | null;
  readonly tolanganSoni: number;
  /** Eng eski OCHIQ buyurtma necha kunlik */
  readonly ochiqQarzKun: number | null;
}

/**
 * ⚠️ Faqat BUYURTMA bandlari — boshlang'ich qoldiqda «qachon sotilgan»
 *    degan ma'no yo'q, u o'rtachani buzardi.
 */
export function tolovIntizomi(bandlar: readonly QarzBandi[], bugun: Date): TolovIntizomi {
  const kunlar: number[] = [];
  let ochiq: number | null = null;
  for (const b of bandlar) {
    if (b.buyurtmaId === null) continue;
    if (b.yopildi !== null) {
      kunlar.push(Math.max(0, kunFarqi(b.sana, b.yopildi)));
    } else {
      const k = kunFarqi(b.sana, bugun);
      ochiq = ochiq === null ? k : Math.max(ochiq, k);
    }
  }
  return {
    ortachaKun:
      kunlar.length === 0
        ? null
        : Math.round(kunlar.reduce((y, k) => y + k, 0) / kunlar.length),
    engUzunKun: kunlar.length === 0 ? null : Math.max(...kunlar),
    tolanganSoni: kunlar.length,
    ochiqQarzKun: ochiq,
  };
}
