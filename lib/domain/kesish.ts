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

// ─── 1-TOPILMA tuzatish (2026-09-17) · Kesish yo'nalishi ──────────────────

/**
 * Mato slotining kesish sozlamasi — AUDIT 1-topilma tuzatishi.
 *
 * Ilgari `MAYDON × K` ko'paytiruvchisi doim ENIGA tushardi: 180×220 ×2 →
 * 3.6 × 2.2 keng rulon izlanar, real rulonlar (2.0–3.0 m) sig'masdi.
 * Endi slot egasi quyidagi bilan belgilaydi:
 *
 *   `ENIGA`   → K eni oshiradi (3.6 × 2.2) — keng rulon kerak
 *   `BO'YIGA` → K bo'yi oshiradi (1.8 × 4.4) — rulon eni yetadi,
 *               mato bo'y bo'ylab ikki marta kesiladi (ikki qavat,
 *               rapportli naqsh).
 *
 * Koeffitsient kiritilmasa yoki 1 bo'lsa — xulq ilgarigidek.
 */
export type KesishYonalishi = 'ENIGA' | "BO'YIGA";

export interface KesishSozlamasi {
  /** «2 marta» — musbat son; bo'sh/1 = oddiy sarf */
  readonly koeffitsient?: number | null;
  /** Qaysi tomonga; bo'sh = `ENIGA` (ilgarigi xulq) */
  readonly yonalish?: KesishYonalishi | null;
  /**
   * Pozitsiyadagi buyum SONI — T-12 tuzatishi (2026-09-20).
   * Jami sarf shu songa bo'linadi, band qilish esa `soni` marta
   * takrorlanadi.
   */
  readonly soni?: number | null;
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

/**
 * Kesma buyurtmaga AYNAN mos tushdimi.
 *
 * Bunday kesma butunlay ishlatiladi: yon parcha ham, chiqindi ham
 * qolmaydi. Shuning uchun u eng birinchi navbatda turadi.
 */
export function aniqMosmi(b: Bolak, kerak: Olcham): boolean {
  /**
   * ⚠️ `1e-9` — o'nlik kasrning ikkilik xatosi uchun.
   *    `1.51 - 1.50` JavaScriptda 0.010000000000000009 chiqadi va
   *    toza `<=` taqqoslash 1 sm bag'rikenglikni RAD ETARDI.
   */
  const teng = (a: number, b2: number): boolean =>
    Math.abs(a - b2) <= BAGRIKENGLIK_M + 1e-9;

  return b.turi === 'OSTATKA' && teng(b.eniM, kerak.eniM) && teng(b.boyiM, kerak.boyiM);
}

/**
 * TZ 7.6, 5-qadam — tanlov navbati.
 *
 * ⚠️ EGASINING QARORI (2026-09-05) — TZ dan bir qadam farq qiladi.
 *
 *    TZ: «qoldiq kesma → qisman ochilgan rulon → yangi rulon».
 *    Egasi: «avval ochiq rulon tugatilsin».
 *
 *    Birlashtirildi: AYNAN mos kesma baribir birinchi bo'ladi —
 *    u butunlay ishlatiladi va ortidan hech narsa qolmaydi. Aynan
 *    mos kesma bo'lmasa, ochilgan rulon tugatiladi; shundan keyin
 *    boshqa kesmalar; eng oxirida yangi rulon ochiladi.
 *
 *    Sabab: ochilgan rulon omborda «yarim» turgan mol — u qancha
 *    uzoq tursa, shuncha ko'p ishlatilmay qoladi.
 */
function tartibVazni(b: Bolak, kerak: Olcham): number {
  if (aniqMosmi(b, kerak)) return 0;
  if (b.turi === 'RULON' && b.qismanOchilgan) return 1;
  if (b.turi === 'OSTATKA') return 2;
  return 3;
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
    const at = tartibVazni(a, kerak);
    const bt = tartibVazni(b, kerak);
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
 *
 * ⚠️ Ogohlantirish faqat YANGI rulon ochilganda beriladi.
 *
 *    OCHILGAN rulon tanlangani — bu endi xato emas, balki qoidaning
 *    o'zi (yuqoridagi `tartibVazni` ga qara). Ilgari ogohlantirish
 *    manba turiga qarardi va ochilgan rulon tanlangan har safar
 *    behuda chiqib turardi.
 */
export function ostatkaBorRulonTanlandi(
  bolaklar: readonly Bolak[],
  kerak: Olcham,
  tanlangan: Bolak,
): Bolak | null {
  if (tanlangan.turi !== 'RULON' || tanlangan.qismanOchilgan) return null;
  return bolaklar.find((b) => b.turi === 'OSTATKA' && sigadimi(b, kerak)) ?? null;
}

// ─── 7.6 · Kesim natijasi: uch qator ──────────────────────────────────────

export interface KesimQatori {
  readonly turi: 'KESIM' | 'OSTATKA' | 'CHIQINDI';
  readonly kvM: KvadratMetr;
  readonly eniM: Metr | null;
  readonly boyiM: Metr | null;
}

/**
 * Kesimdan keyin tug'iladigan bo'lak.
 *
 * ⚠️ IKKITA bo'ladi, bitta emas. TZ 7.4 misoli: 3 × 35 rulondan
 *    1.5 × 5 parda kesilsa — rulon 3 × 30 bo'lib QOLADI va yonidan
 *    1.5 × 5 kesma ortadi.
 */
export interface YangiBolak {
  readonly rol: 'MANBA_QOLDIQ' | 'KESMA';
  readonly eniM: Metr;
  readonly boyiM: Metr;
  readonly kvM: KvadratMetr;
  /** TZ 7.4 — rulondan qolgan qism RULON bo'lib qoladi, kesma esa OSTATKA */
  readonly rulonmi: boolean;
}

export interface KesimNatijasi {
  readonly qatorlar: readonly KesimQatori[];
  /** Mahsulotga ketgan qism */
  readonly mahsulotgaKvM: KvadratMetr;
  /** Qolgan bo'lak saqlanadimi yoki chiqindiga ketadimi */
  readonly qoldiqDarajasi: Daraja;
  /** Omborda yaratilishi kerak bo'lgan bo'laklar — 0, 1 yoki 2 ta */
  readonly yangiBolaklar: readonly YangiBolak[];
}

/**
 * TZ 7.4 — kesim geometriyasi.
 *
 * «Rulonning ENI hech qachon o'zgarmaydi. Kesilganda faqat BO'YI
 *  kamayadi.»
 *
 * Usta rulondan buyurtma BO'YICHA tasma ochadi, so'ng tasmadan
 * kerakli ENI ni kesadi:
 *
 * ```
 * 3.00 × 35.00 rulon, buyurtma 1.50 × 5.00
 *   ├─ rulon qoladi   3.00 × 30.00   (eni o'sha, bo'yi 35 − 5)
 *   ├─ kesma ortadi   1.50 ×  5.00   (eni 3 − 1.5, bo'yi buyurtmaniki)
 *   └─ mahsulotga     1.50 ×  5.00 = 7.50 kv.m
 * ```
 *
 * Yig'indi manbaning maydoniga TENG:
 * `eni×(boyi−t) + (eni−kEni)×t + kEni×t = eni×boyi`.
 *
 * ⚠️ Bu funksiya ustaga TAKLIF beradi. Mato qiyshiq kesilsa usta
 *    raqamni o'zgartiradi (7.6 — «egrilik uchun 5–10 sm oddiy»).
 */
export function kesimRejasi(
  manba: Bolak,
  kerak: Olcham,
): {
  readonly manbaQoldiq: Olcham | null;
  readonly kesma: Olcham | null;
  readonly mahsulotKvM: number;
} {
  // Rulonda yetarli bo'yi bo'lmasa butunlay ochiladi (bag'rikenglik 1 sm)
  const tasmaBoyi = Math.min(kerak.boyiM, manba.boyiM);
  const qolganBoyi = Number((manba.boyiM - tasmaBoyi).toFixed(2));
  const kesmaEni = Number((manba.eniM - kerak.eniM).toFixed(2));

  return {
    manbaQoldiq: qolganBoyi > 0 ? { eniM: manba.eniM, boyiM: qolganBoyi } : null,
    kesma: kesmaEni > 0 ? { eniM: kesmaEni, boyiM: tasmaBoyi } : null,
    mahsulotKvM: Number((Math.min(kerak.eniM, manba.eniM) * tasmaBoyi).toFixed(4)),
  };
}

export interface Qoldiqlar {
  /** Manbadan qolgan asosiy qism — rulon bo'lsa rulonning o'zi (7.4) */
  readonly manbaQoldiq: Olcham | null;
  /** Tasmadan ortgan yon parcha */
  readonly kesma: Olcham | null;
  /** Usta tuzatishi mumkin (7.6) — chiqindiga chiqarsa `false` */
  readonly kesmaSaqlansinmi: boolean;
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
  qoldiqlar: Qoldiqlar,
  chegaralar: Chegaralar,
): KesimNatijasi {
  const chiqdi = manbaBolak.eniM * manbaBolak.boyiM;
  const maydon = (o: Olcham | null): number => (o === null ? 0 : o.eniM * o.boyiM);

  const manbaKvM = maydon(qoldiqlar.manbaQoldiq);
  const kesmaKvM = maydon(qoldiqlar.kesma);

  if (manbaKvM + kesmaKvM > chiqdi + 1e-9) {
    throw new BiznesXato(
      'KESIM_NOTOGRI',
      "qolgan bo'lak manbadan katta bo'lishi mumkin emas",
    );
  }

  /**
   * ⚠️ Daraja FAQAT KESMAGA qo'llanadi.
   *
   *    TZ 7.4 bo'yicha manbadan qolgan qismning ENISI o'zgarmaydi,
   *    daraja esa (7.5) aynan eni bo'yicha aniqlanadi. Demak omborda
   *    turgan bo'lak kesimdan keyin ham o'sha darajada qoladi —
   *    uni qayta tekshirish ma'nosiz.
   *
   *    Yon parcha esa yangi, tor eni bilan tug'iladi: mana u
   *    yaroqsiz bo'lib chiqishi mumkin.
   */
  const qoldiqDarajasi: Daraja =
    qoldiqlar.kesma === null ? 'YAROQLI' : daraja(qoldiqlar.kesma.eniM, chegaralar);

  // Yaroqsiz kesma chiqindiga ketadi (7.5) — usta buni bekor qila olmaydi
  const kesmaSaqlanadi =
    qoldiqlar.kesma !== null && qoldiqlar.kesmaSaqlansinmi && qoldiqDarajasi !== 'YAROQSIZ';

  const yangiBolaklar: YangiBolak[] = [];
  const q = qoldiqlar.manbaQoldiq;
  if (q !== null) {
    yangiBolaklar.push({
      rol: 'MANBA_QOLDIQ',
      eniM: m(q.eniM),
      boyiM: m(q.boyiM),
      kvM: kvM(manbaKvM),
      // TZ 7.4 — rulonning davomi RULON bo'lib qoladi
      rulonmi: manbaBolak.turi === 'RULON',
    });
  }
  const k = qoldiqlar.kesma;
  if (kesmaSaqlanadi && k !== null) {
    yangiBolaklar.push({
      rol: 'KESMA',
      eniM: m(k.eniM),
      boyiM: m(k.boyiM),
      kvM: kvM(kesmaKvM),
      rulonmi: false,
    });
  }

  const ostatkaKvM = manbaKvM + (kesmaSaqlanadi ? kesmaKvM : 0);
  const chiqindiKvM = kesmaSaqlanadi ? 0 : kesmaKvM;
  const mahsulotga = chiqdi - manbaKvM - kesmaKvM;

  /**
   * Jurnal qatori bitta o'lchamni ko'rsatadi. Ikkita bo'lak tug'ilsa
   * o'lcham `null` — aniq o'lchamlar `yangiBolaklar` da, har biri
   * o'z kodi bilan ombor tarixiga alohida tushadi.
   */
  const yagona = yangiBolaklar.length === 1 ? yangiBolaklar[0] : undefined;

  return {
    qatorlar: [
      { turi: 'KESIM', kvM: kvM(chiqdi), eniM: m(manbaBolak.eniM), boyiM: m(manbaBolak.boyiM) },
      {
        turi: 'OSTATKA',
        kvM: kvM(ostatkaKvM),
        eniM: yagona?.eniM ?? null,
        boyiM: yagona?.boyiM ?? null,
      },
      { turi: 'CHIQINDI', kvM: kvM(chiqindiKvM), eniM: null, boyiM: null },
    ],
    mahsulotgaKvM: kvM(mahsulotga),
    qoldiqDarajasi,
    yangiBolaklar,
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
export function kesimOlchami(
  hisoblanganKvM: string | number,
  boyiSm: number,
  kesish?: KesishSozlamasi,
): Olcham {
  if (boyiSm <= 0) {
    throw new BiznesXato('KESIM_NOTOGRI', "bo'yi noldan katta bo'lsin");
  }
  const boyiM0 = new Decimal(boyiSm).div(100);
  const K = kesish?.koeffitsient ?? 1;
  const yo = kesish?.yonalish ?? 'ENIGA';
  if (!Number.isFinite(K) || K <= 0) {
    throw new BiznesXato('KESIM_NOTOGRI', 'koeffitsient musbat bo\'lsin');
  }

  /**
   * T-12 — jami sarfdan BIR BUYUM ulushi (2026-09-20).
   *
   * ⚠️ `hisoblanganKvM` JAMI maydon: uchta parda bo'lsa uchalasi
   *    qo'shilgan. Kesim to'rtburchagi esa BITTA buyum uchun bo'lishi
   *    kerak — usta uchta alohida parda kesadi, bitta 5.4 metrlik
   *    bo'lak emas (bunday rulon dunyoda yo'q).
   *
   *    `soni` berilmasa 1 — avvalgi xulq to'liq saqlanadi.
   */
  const soni = kesish?.soni ?? 1;
  if (!Number.isInteger(soni) || soni < 1) {
    throw new BiznesXato('KESIM_NOTOGRI', "soni musbat butun bo'lsin");
  }
  const birBuyum = new Decimal(hisoblanganKvM).div(soni);

  /**
   * `hisoblanganKvM` — JAMI maydon (formula × koeffitsient).
   *
   * ENIGA:   boy = buyurtma bo'yi, en = jami ÷ boy   (K enga tushadi)
   * BO'YIGA: boy = buyurtma bo'yi × K, en = jami ÷ boy
   *          = (asos ÷ boy) — en O'ZGARMAYDI (K bo'yiga tushadi)
   */
  const boyiM = yo === "BO'YIGA" ? boyiM0.times(K) : boyiM0;
  const eniM = birBuyum.div(boyiM);
  if (eniM.lessThanOrEqualTo(0)) {
    throw new BiznesXato('KESIM_NOTOGRI', "kesim eni noldan katta bo'lsin");
  }
  return {
    /**
     * AUDIT 4·5·7-topilmalar — eni va bo'yi YUQORIGA yaxlitlanadi
     * (ROUND_CEIL), HALF_UP emas. Ilgari 2.10449 → 2.10 PASTGA tushar,
     * ombor kamomad qilar va jismonan sig'maydigan bo'lak "sig'adi"
     * deb qabul qilinardi. Endi kesim to'rtburchagi hech qachon formula
     * talabidan TOR emas — kamomad bo'lishi mumkin emas.
     */
    eniM: eniM.toDecimalPlaces(2, Decimal.ROUND_CEIL).toNumber(),
    boyiM: boyiM.toDecimalPlaces(2, Decimal.ROUND_CEIL).toNumber(),
  };
}
