/**
 * lib/domain/kesish.ts — TZ 7.3 · 7.4 · 7.5 · 7.6 · Q-02 · Q-05 · Q-06
 *
 * Bo'lak tanlash va kesish. Tizimning eng nozik joyi.
 *
 * ⚠️ NEGA MAYDON YETARLI EMAS (7.4)
 *
 * «Bo'lakning maydoni 5.00 kv.m, kerak bo'lgani 2.94. Maydon bo'yicha
 *  "yetadi" chiqadi, lekin eni 1.00 m — undan 210 sm parda kesib bo'lmaydi.»
 *
 * Shuning uchun bu yerda hech qayerda kv.m bilan taqqoslash yo'q —
 * faqat `eni × bo'yi`.
 */

import Decimal from 'decimal.js';
import { BiznesXato } from '@/lib/xato';
import { kvM, m, type KvadratMetr, type Metr } from '@/lib/domain/birlik';

/** TZ 7.6, 4-qadam — «Bag'rikenglik 1 sm» */
export const BAGRIKENGLIK_M = 0.01;

/** TZ 7.5 — chegaralar bo'sh qolsa sozlamadagi standart (14.4) */
export const STANDART_YAROQSIZ_M = 0.5;
export const STANDART_KAM_ISHLATILADIGAN_M = 1.0;

export type BolakTuri = 'RULON' | 'OSTATKA';
export type Manba = 'OSTATKA' | 'RULON';

export interface Bolak {
  readonly id: number;
  readonly kod: string;
  readonly turi: BolakTuri;
  readonly eniM: number;
  readonly boyiM: number;
  /** Qisman ochilgan rulon — tartibda ostatkadan keyin, yangi rulondan oldin */
  readonly qismanOchilgan: boolean;
}

export interface Olcham {
  readonly eniM: number;
  readonly boyiM: number;
}

// ─── 7.5 · Uch daraja ─────────────────────────────────────────────────────

export type Daraja = 'YAROQSIZ' | 'KAM_ISHLATILADIGAN' | 'YAROQLI';

export interface Chegaralar {
  readonly yaroqsizM: number | null;
  readonly kamIshlatiladiganM: number | null;
}

/**
 * TZ 7.5 — daraja **ENI** bo'yicha aniqlanadi, maydon bo'yicha emas.
 *
 * «Maydon emas, aynan eni. `0.20 × 6` bo'lak 1.2 kv.m bo'lsa ham hech
 *  narsaga yaramaydi.»
 */
export function daraja(eniM: number, chegaralar: Chegaralar): Daraja {
  const yaroqsiz = chegaralar.yaroqsizM ?? STANDART_YAROQSIZ_M;
  const kam = chegaralar.kamIshlatiladiganM ?? STANDART_KAM_ISHLATILADIGAN_M;

  if (eniM < yaroqsiz) return 'YAROQSIZ';
  if (eniM < kam) return 'KAM_ISHLATILADIGAN';
  return 'YAROQLI';
}

// ─── 7.6 · Bo'lak sig'adimi ───────────────────────────────────────────────

/**
 * TZ 7.6, 1–4 qadamlar:
 *   1. Eni tekshiriladi
 *   2. Bo'yi tekshiriladi
 *   3. BURISH YO'Q — eni eniga, bo'yi bo'yiga
 *   4. Bag'rikenglik 1 sm
 *
 * «`0.90 × 1.40` bo'lakka `90.2 × 140` sig'adi, `91.5 × 140` sig'maydi.»
 */
export function sigadimi(bolak: Bolak, kerak: Olcham): boolean {
  return (
    kerak.eniM <= bolak.eniM + BAGRIKENGLIK_M && kerak.boyiM <= bolak.boyiM + BAGRIKENGLIK_M
  );
}

/**
 * Kesimdan keyin qoladigan chiqindi maydoni.
 *
 * Kesim doim to'liq kenglikda bo'ladi (7.4: «bo'lak doim to'rtburchak,
 * usta doim to'liq kenglikda kesadi»), shuning uchun yo'qotish —
 * kesilgan tasmaning ortiqcha eni.
 */
export function chiqindiMaydoni(bolak: Bolak, kerak: Olcham): number {
  const ortiqchaEni = Math.max(0, bolak.eniM - kerak.eniM);
  return ortiqchaEni * kerak.boyiM;
}

// ─── 7.6 · Algoritm: bo'lakni topish ──────────────────────────────────────

/** TZ 7.6, 5-qadam — tartib: avval qoldiq kesma, keyin qisman ochilgan rulon, keyin yangi. */
function tartibVazni(b: Bolak): number {
  if (b.turi === 'OSTATKA') return 0;
  return b.qismanOchilgan ? 1 : 2;
}

export interface TanlovNatijasi {
  readonly bolak: Bolak;
  readonly manba: Manba;
  readonly chiqindi: number;
}

/**
 * TZ 7.6 algoritmi.
 *
 * 5. Tartib: ostatka → qisman ochilgan rulon → yangi rulon
 * 6. Bir necha mos variant bo'lsa — ENG KAM CHIQINDI qoldiradigani
 *
 * «Buyurtma eni 140 sm, omborda 2 m va 3 m enli rulon bor. 2 m dan
 *  kesiladi (60 sm qoladi), 3 m dan emas (160 sm keraksiz maydalanadi).»
 *
 * 7. Hech qaysisiga sig'masa — `null`, pozitsiya «Materialga kutmoqda»ga tushadi.
 */
export function bolakTanla(
  bolaklar: readonly Bolak[],
  kerak: Olcham,
): TanlovNatijasi | null {
  const mos = bolaklar.filter((b) => sigadimi(b, kerak));
  if (mos.length === 0) return null;

  const eng = mos.reduce((a, b) => {
    const at = tartibVazni(a);
    const bt = tartibVazni(b);
    if (at !== bt) return at < bt ? a : b;

    const ac = chiqindiMaydoni(a, kerak);
    const bc = chiqindiMaydoni(b, kerak);
    if (Math.abs(ac - bc) > 1e-9) return ac < bc ? a : b;

    // Barobar bo'lsa — barqaror tanlov uchun eskisi (kichik id)
    return a.id <= b.id ? a : b;
  });

  return {
    bolak: eng,
    manba: eng.turi === 'OSTATKA' ? 'OSTATKA' : 'RULON',
    chiqindi: chiqindiMaydoni(eng, kerak),
  };
}

/**
 * TZ 7.6 — «Ostatka bor turib rulon tanlansa — ogohlantirish.»
 *
 * Bloklamaydi: bo'lak iflos yoki yirtiq bo'lishi mumkin. Lekin qaror
 * ongli bo'ladi va 11.7.7 hisobotiga tushadi.
 */
export function ostatkaBorRulonTanlandi(
  bolaklar: readonly Bolak[],
  kerak: Olcham,
  tanlanganManba: Manba,
): Bolak | null {
  if (tanlanganManba !== 'RULON') return null;
  return bolaklar.find((b) => b.turi === 'OSTATKA' && sigadimi(b, kerak)) ?? null;
}

// ─── 7.6 · Kesim natijasi: uch qator ──────────────────────────────────────

export interface KesimQatori {
  readonly turi: 'KESIM' | 'OSTATKA' | 'CHIQINDI';
  readonly kvM: KvadratMetr;
  readonly eniM: Metr | null;
  readonly boyiM: Metr | null;
}

export interface KesimNatijasi {
  readonly qatorlar: readonly KesimQatori[];
  /** Mahsulotga ketgan qism */
  readonly mahsulotgaKvM: KvadratMetr;
  /** Qolgan bo'lak saqlanadimi yoki chiqindiga ketadimi */
  readonly qoldiqDarajasi: Daraja;
}

export interface Qoldiq {
  readonly eniM: number;
  readonly boyiM: number;
  /** Usta tuzatishi mumkin (7.6) — chiqindiga chiqarsa `false` */
  readonly saqlansinmi: boolean;
}

/**
 * TZ 7.6 — «Har kesim ombor tarixiga UCH QATOR bo'lib yoziladi.»
 *
 * ```
 * Ostatkadan chiqdi  −3.60 kv.m    (1.80 × 2.00)
 * Qoldiq kesma       +1.20 kv.m    (0.60 × 2.00)
 * Chiqindi            0.00 kv.m
 * Mahsulotga ketdi    2.40 kv.m
 * ```
 *
 * Yig'indi NOL bo'lishi shart — QISM 3 §12 dagi 1-tekshiruv invarianti:
 * chiqqan = qolgan + chiqindi + mahsulotga ketgan.
 */
export function kesimQatorlari(
  manbaBolak: Bolak,
  qoldiq: Qoldiq,
  chegaralar: Chegaralar,
): KesimNatijasi {
  const chiqdi = manbaBolak.eniM * manbaBolak.boyiM;
  const qoldiqKvM = qoldiq.eniM * qoldiq.boyiM;

  if (qoldiqKvM > chiqdi + 1e-9) {
    throw new BiznesXato(
      'KESIM_NOTOGRI',
      "qolgan bo'lak manbadan katta bo'lishi mumkin emas",
    );
  }

  const qoldiqDarajasi = daraja(qoldiq.eniM, chegaralar);
  // Yaroqsiz qoldiq chiqindiga ketadi (7.5), lekin usta buni o'zgartira oladi
  const ostatkaBoladi = qoldiq.saqlansinmi && qoldiqDarajasi !== 'YAROQSIZ';

  const ostatkaKvM = ostatkaBoladi ? qoldiqKvM : 0;
  const chiqindiKvM = ostatkaBoladi ? 0 : qoldiqKvM;
  const mahsulotga = chiqdi - qoldiqKvM;

  return {
    qatorlar: [
      { turi: 'KESIM', kvM: kvM(chiqdi), eniM: m(manbaBolak.eniM), boyiM: m(manbaBolak.boyiM) },
      {
        turi: 'OSTATKA',
        kvM: kvM(ostatkaKvM),
        eniM: ostatkaBoladi ? m(qoldiq.eniM) : null,
        boyiM: ostatkaBoladi ? m(qoldiq.boyiM) : null,
      },
      { turi: 'CHIQINDI', kvM: kvM(chiqindiKvM), eniM: null, boyiM: null },
    ],
    mahsulotgaKvM: kvM(mahsulotga),
    qoldiqDarajasi,
  };
}

/**
 * QISM 3 §12, 1-tekshiruv invarianti — «Har kesimning uch qatori yig'indisi 0».
 *
 * Chiqqan = ostatka + chiqindi + mahsulotga ketgan.
 */
export function kesimBalansi(n: KesimNatijasi): boolean {
  const chiqdi = n.qatorlar.find((q) => q.turi === 'KESIM')?.kvM ?? 0;
  const ostatka = n.qatorlar.find((q) => q.turi === 'OSTATKA')?.kvM ?? 0;
  const chiqindi = n.qatorlar.find((q) => q.turi === 'CHIQINDI')?.kvM ?? 0;
  return Math.abs(chiqdi - (ostatka + chiqindi + n.mahsulotgaKvM)) < 1e-6;
}

// ─── 7.4 · Rulondan kesish ────────────────────────────────────────────────

/**
 * TZ 7.4 — «Rulonning ENI hech qachon o'zgarmaydi. Kesilganda faqat
 * BO'YI kamayadi.»
 *
 * Rulondan tasma ochiladi: `eni × tasmaBoyi`. Rulonda `boyi − tasmaBoyi`
 * qoladi, tasmadan esa kerakli bo'lak kesiladi.
 */
export function rulondanTasma(rulon: Bolak, kerak: Olcham): {
  readonly tasma: Bolak;
  readonly rulonYangiBoyi: number;
} {
  if (rulon.turi !== 'RULON') {
    throw new BiznesXato('KESIM_NOTOGRI', 'bu bo\'lak rulon emas');
  }
  if (kerak.boyiM > rulon.boyiM + BAGRIKENGLIK_M) {
    throw new BiznesXato('KESIM_NOTOGRI', "rulon bo'yi yetmaydi");
  }

  const tasmaBoyi = Math.min(kerak.boyiM, rulon.boyiM);
  return {
    tasma: { ...rulon, turi: 'OSTATKA', boyiM: tasmaBoyi },
    rulonYangiBoyi: Number((rulon.boyiM - tasmaBoyi).toFixed(2)),
  };
}

// ─── 7.6, 0-qadam · Birlashtirib kesish (Q-13) ────────────────────────────

/**
 * TZ 7.6, 0-qadam — «Bitta buyurtmadagi bir xil matoli pozitsiyalar birga
 * hisoblanadi.»
 *
 * «Uchta 210 × 140 alohida kesilsa — uchta mayda bo'lak. Birga kesilsa —
 *  4.20 m tasma bir yo'la ochiladi va yonda bitta uzun bo'lak qoladi.»
 *
 * ⚠️ Q-13 — bu FAQAT HISOB-KITOB TAVSIYASI. Band va ombor hisobi har
 * pozitsiyaga ALOHIDA qo'yiladi.
 */
export function birlashtirishTavsiyasi(olchamlar: readonly Olcham[]): Olcham | null {
  if (olchamlar.length < 2) return null;

  const birinchi = olchamlar[0];
  if (birinchi === undefined) return null;

  // Faqat bir xil bo'yidagilarni birlashtirsa bo'ladi — tasma bir yo'la ochiladi
  if (!olchamlar.every((o) => Math.abs(o.boyiM - birinchi.boyiM) < 1e-9)) return null;

  const jamiEni = olchamlar.reduce((y, o) => y + o.eniM, 0);
  return { eniM: Number(jamiEni.toFixed(2)), boyiM: birinchi.boyiM };
}

// ─── P-24 · Maydondan kesim to'rtburchagi ─────────────────────────────────

/**
 * TZ 3.5 · 7.6 — slot formulasi MAYDON beradi, band qilish esa
 * `eni × bo'yi` TO'RTBURCHAGINI talab qiladi (Q-05).
 *
 * ⚠️ Butun mahsulot enini ishlatish XATO: Dikke'da (180 × 220,
 *    CHET = 30) 30 smlik chet uchun 180 smlik bo'lak band qilinib,
 *    qolgan ikki slotga material yetmay qolardi (P-24).
 *
 * TZ 3.5 dagi barcha formulalar `X × BO'YI` ko'rinishida — mato
 * rulondan bo'yi bo'ylab tortiladi, faqat eni bo'linadi. Shuning
 * uchun eni maydonni bo'yiga bo'lishdan chiqadi.
 */
export function kesimOlchami(hisoblanganKvM: string | number, boyiSm: number): Olcham {
  if (boyiSm <= 0) {
    throw new BiznesXato('KESIM_NOTOGRI', "bo'yi noldan katta bo'lsin");
  }
  const boyiM = new Decimal(boyiSm).div(100);
  const eniM = new Decimal(hisoblanganKvM).div(boyiM);
  if (eniM.lessThanOrEqualTo(0)) {
    throw new BiznesXato('KESIM_NOTOGRI', "kesim eni noldan katta bo'lsin");
  }
  return {
    eniM: eniM.toDecimalPlaces(2).toNumber(),
    boyiM: boyiM.toDecimalPlaces(2).toNumber(),
  };
}
