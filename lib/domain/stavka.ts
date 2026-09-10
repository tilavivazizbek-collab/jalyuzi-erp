/**
 * lib/domain/stavka.ts — TZ 10.8 · 10.9 · 10.12 · 20.11.3 · 2.3-invariant
 *
 * Usta stavkasi. Bazaga TEGMAYDI (§5.1).
 *
 * ⚠️ TZ 10.9 — ustunlik: `xodim` > `filial` > `standart`. Bu naqsh
 *    butun tizimda takrorlanadi (ustama chegarasi 5.4, to'lov muddati
 *    9.3) — shuning uchun tanlash mantiqi shu yerda BIR JOYDA turadi.
 */

import Decimal from 'decimal.js';
import { kopaytir, nolSom, som, type Som } from './pul';
import { BiznesXato } from '@/lib/xato';

/**
 * TZ 10.8 — uch xil hisoblash usuli, uchta birlik:
 *
 *   DONA     qat'iy summa, o'lchamdan qat'i nazar
 *   KV_M     kvadrat metrga
 *   BOSQICH  jadval — maydonga qarab qat'iy summa tanlanadi
 *
 * ⚠️ BOSQICH bir necha QATORdan iborat: har qatorda o'z
 *    `chegaraKvM` si bor. Qolgan ikkisi doim bitta qator.
 */
export type StavkaBirligi = 'KV_M' | 'DONA' | 'BOSQICH';

export const STAVKA_BIRLIKLARI = ['DONA', 'KV_M', 'BOSQICH'] as const;

export interface StavkaQatori {
  readonly id: number;
  readonly mahsulotTurId: number;
  /** NULL = barcha filialga */
  readonly filialId: number | null;
  /** NULL = barcha xodimga (10.9) */
  readonly xodimId: number | null;
  readonly qiymat: string;
  readonly birlik: StavkaBirligi;
  /** Faqat BOSQICH da — yuqori chegara, NULL = cheksiz */
  readonly chegaraKvM: number | null;
  readonly amalQiladiDan: string;
}

/** Aniqlik darajasi: xodim (2) > filial (1) > standart (0) — TZ 10.9. */
function daraja(q: StavkaQatori): number {
  return (q.xodimId === null ? 0 : 2) + (q.filialId === null ? 0 : 1);
}

/**
 * TZ 10.9 — eng ANIQ mos keladigan stavka GURUHI.
 *
 * ⚠️ NEGA GURUH, BITTA QATOR EMAS
 *
 *    Bosqichli stavka (10.8) — bir necha qator: «1 kv.m gacha
 *    1 $, 1–1.5 → 2 $, undan yuqori → 3 $». Ular
 *    (tur, filial, xodim, amal_qiladi_dan) bo'yicha BIR guruh.
 *
 *    Guruhni tanlash 10.9 qoidasi, guruh ichidan qatorni tanlash
 *    esa 10.8 qoidasi — ikki xil savol, ketma-ket javob beriladi.
 *
 * ⚠️ 2.3-invariant — `sana` parametr bo'lib keladi: «Stavka keyin
 *    ko'tarilsa yoki tushirilsa, ESKI ISHLAR O'ZGARMAYDI. O'tgan
 *    oyning ish haqi bugun qayta hisoblanmaydi.»
 */
export function stavkaGuruhi(
  qatorlar: readonly StavkaQatori[],
  mahsulotTurId: number,
  filialId: number,
  xodimId: number,
  sana: string,
): readonly StavkaQatori[] {
  const mos = qatorlar.filter(
    (q) =>
      q.mahsulotTurId === mahsulotTurId &&
      q.amalQiladiDan <= sana &&
      (q.filialId === null || q.filialId === filialId) &&
      (q.xodimId === null || q.xodimId === xodimId),
  );

  const eng = mos.reduce<StavkaQatori | null>((u, q) => {
    if (u === null) return q;
    const a = daraja(q);
    const b = daraja(u);
    if (a !== b) return a > b ? q : u;
    // Bir xil darajada — kechroq boshlangani (2.3: o'sha sanadagi holat)
    if (q.amalQiladiDan !== u.amalQiladiDan) {
      return q.amalQiladiDan > u.amalQiladiDan ? q : u;
    }
    /**
     * ⚠️ Oxirgi ajratuvchi — `id`. Bir xil kunga bir xil qamrovda
     *    ikkita QAT'IY stavka yozilib qolsa, qaysi biri ishlashi
     *    TASODIFGA qolmasin: keyin kiritilgani (katta `id`) yutadi.
     *    Bosqichli guruhda esa qatorlar hammasi kerak — ular
     *    quyida `chegaraKvM` bo'yicha ajratiladi.
     */
    return q.id > u.id ? q : u;
  }, null);

  if (eng === null) return [];

  const guruh = mos.filter(
    (q) => daraja(q) === daraja(eng) && q.amalQiladiDan === eng.amalQiladiDan,
  );

  // Bosqichli bo'lmasa guruh — bitta qator
  if (eng.birlik !== 'BOSQICH') return [eng];

  return guruh.filter((q) => q.birlik === 'BOSQICH');
}

/**
 * TZ 10.9 + 10.8 — shu ish uchun AMALDAGI stavka qatori.
 *
 * ⚠️ `maydonKvM` MAJBURIY: bosqichli stavkada u bo'lmasa qaysi
 *    bosqich ishlashini bilib bo'lmaydi. Qat'iy va kv.metrli
 *    stavkada u e'tiborga olinmaydi — lekin chaqiruvchi uni
 *    baribir biladi, shuning uchun ixtiyoriy qilinmadi: unutilsa
 *    jimgina eng arzon bosqich tanlanib qolardi.
 */
export function stavkaTanla(
  qatorlar: readonly StavkaQatori[],
  mahsulotTurId: number,
  filialId: number,
  xodimId: number,
  sana: string,
  maydonKvM: number,
): StavkaQatori | null {
  const guruh = stavkaGuruhi(qatorlar, mahsulotTurId, filialId, xodimId, sana);
  const birinchi = guruh[0];
  if (birinchi === undefined) return null;
  if (birinchi.birlik !== 'BOSQICH') return birinchi;
  return bosqichniTop(guruh, maydonKvM);
}

// ─── 10.8 · Bosqichli jadval ──────────────────────────────────────────────

export interface Bosqich {
  /** Yuqori chegara (shu qiymat DAXL bo'ladi), null = cheksiz */
  readonly chegaraKvM: number | null;
  readonly qiymat: string;
}

/**
 * TZ 10.8 — «Chegaraga AYNAN TENG qiymat QUYI bosqichga kiradi.»
 *
 *   1.00 kv.m → 1 $      1.01 kv.m → 2 $
 *   1.50 kv.m → 2 $      1.51 kv.m → 3 $
 *
 * ⚠️ «Eng quyi bosqich MINIMAL HAQ vazifasini bajaradi» — 0.3 kv.m lik
 *    kichkina parda ham ish talab qiladi, shuning uchun kichik maydon
 *    birinchi bosqichga tushadi va nol bo'lmaydi.
 */
export function bosqichniTop<T extends Bosqich>(
  bosqichlar: readonly T[],
  maydonKvM: number,
): T {
  if (bosqichlar.length === 0) {
    throw new BiznesXato('STAVKA_YOQ', "bosqichlar ro'yxati bo'sh");
  }

  const tartibli = [...bosqichlar].sort((a, b) => {
    if (a.chegaraKvM === null) return 1;
    if (b.chegaraKvM === null) return -1;
    return a.chegaraKvM - b.chegaraKvM;
  });

  for (const b of tartibli) {
    // `<=` — chegaraga teng qiymat QUYI bosqichda
    if (b.chegaraKvM === null || maydonKvM <= b.chegaraKvM) return b;
  }

  const oxirgi = tartibli[tartibli.length - 1];
  if (oxirgi === undefined) throw new BiznesXato('STAVKA_YOQ');
  return oxirgi;
}

/**
 * `Bosqich` — `StavkaQatori` ning bosqich uchun kerakli qismi.
 * Shu sababli `StavkaQatori` to'g'ridan-to'g'ri `bosqichniTop` ga
 * beriladi va nusxa tuzilma yasalmaydi (§2.2).
 */

// ─── 10.10 · Haq hisoblash ────────────────────────────────────────────────

/**
 * TZ 10.8 — uch xil hisoblash usuli:
 *
 * | Usul | Misol |
 * |---|---|
 * | Qat'iy summa | Zashitka 15 000 so'm, o'lchamdan qat'i nazar |
 * | Kv.metrga | Plisse 18 000 × 3.2 = 57 600 |
 * | Bosqichli | Dikke — jadval bo'yicha |
 *
 * Qat'iy va bosqichli — `DONA` birligi; kv.metrga — `KV_M`.
 *
 * ⚠️ SONI HISOBGA OLINADI.
 *
 *    Bitta pozitsiyada bir nechta BIR XIL parda bo'lishi mumkin
 *    (3.4). Usta ularning hammasini tikadi.
 *
 *    2026-09-05 gacha `soni` umuman ishlatilmasdi: uchta parda
 *    sotilsa mijozdan uchtasining puli olinar, ustaga esa
 *    bittasining haqi to'lanardi. `maydonKvM` ham BITTA
 *    buyumniki — shuning uchun ko'paytirish ikkala usulda ham
 *    kerak.
 */
export function haqHisobla(
  qiymat: string,
  birlik: StavkaBirligi,
  maydonKvM: number,
  soni = 1,
): Som {
  const n = new Decimal(soni);
  if (n.lessThan(1)) throw new BiznesXato('OLCHOV_NOTOGRI', `soni ${String(soni)}`);

  /**
   * ⚠️ BOSQICH — QAT'IY summa. Bosqich allaqachon maydonga
   *    qarab TANLANGAN (`bosqichniTop`), uning qiymati bitta
   *    buyum uchun to'liq haq. Uni yana maydonga ko'paytirish
   *    haqni ikki marta hisoblash bo'lardi.
   */
  if (birlik === 'DONA' || birlik === 'BOSQICH') {
    return kopaytir(som(qiymat), n.toString());
  }
  return kopaytir(som(qiymat), n.times(maydonKvM).toString());
}

/**
 * TZ 10.12 — «Stavkasi belgilanmagan mahsulot turi... Pozitsiya
 * BARIBIR navbatga tushadi va usta uni oladi — ishlab chiqarish
 * TO'XTAMAYDI. Bajarilganda haq 0 hisoblanadi va adminga bildirishnoma
 * ketadi.»
 *
 * Shuning uchun bu funksiya XATO TASHLAMAYDI: nol qaytaradi va
 * «ogohlantirilsinmi» bayrog'ini beradi.
 */
export interface HaqNatijasi {
  readonly haq: Som;
  /** 10.12 — adminga bildirishnoma kerakmi */
  readonly stavkaYoq: boolean;
}

export function pozitsiyaHaqi(
  stavka: StavkaQatori | null,
  maydonKvM: number,
  soni = 1,
): HaqNatijasi {
  if (stavka === null) {
    return { haq: nolSom(), stavkaYoq: true };
  }
  return {
    haq: haqHisobla(stavka.qiymat, stavka.birlik, maydonKvM, soni),
    stavkaYoq: false,
  };
}

// ─── 10.8 · Jadvalni SAQLASHDAN OLDIN tekshirish ────────────────────

/**
 * Bosqichli jadval TO'G'RI tuzilganini tekshiradi.
 *
 * ⚠️ NEGA SAQLASHDA, HISOBLASHDA EMAS
 *
 *    `bosqichniTop()` har qanday ro'yxatdan bittasini tanlaydi —
 *    u jadval mantiqan to'g'rimi, deb so'ramaydi. Xato jadval
 *    saqlanib ketsa, u OYLAR DAVOMIDA jimgina noto'g'ri haq
 *    hisoblab turardi va buni faqat usta shikoyat qilganda bilib
 *    qolinardi.
 *
 *    Shuning uchun tekshiruv kiritish paytida, odam ekran
 *    oldida turganda bo'ladi.
 */
export function bosqichlarniTekshir(bosqichlar: readonly Bosqich[]): void {
  if (bosqichlar.length < 2) {
    throw new BiznesXato(
      'BOSQICH_NOTOGRI',
      "bosqichli jadvalda kamida ikkita qator bo'lishi kerak — bitta qator qat'iy summa bilan bir xil",
    );
  }

  /**
   * ⚠️ Cheksiz bosqich MAJBURIY. Bo'lmasa eng katta parda
   *    jadvaldan tashqarida qolardi va `bosqichniTop` eng
   *    yuqoridagisini berardi — ya'ni ARZONROQ. Usta eng og'ir
   *    ish uchun kam haq olardi.
   */
  const cheksiz = bosqichlar.filter((b) => b.chegaraKvM === null);
  if (cheksiz.length !== 1) {
    throw new BiznesXato(
      'BOSQICH_NOTOGRI',
      cheksiz.length === 0
        ? "oxirgi bosqichning yuqori chegarasi bo'sh qoldirilishi kerak — undan katta o'lchamlar uchun"
        : "yuqori chegarasi bo'sh qator faqat bitta bo'ladi",
    );
  }

  const chegaralar = bosqichlar
    .map((b) => b.chegaraKvM)
    .filter((x): x is number => x !== null);

  if (new Set(chegaralar).size !== chegaralar.length) {
    throw new BiznesXato('BOSQICH_NOTOGRI', 'bir xil chegara ikki marta yozilgan');
  }

  for (const b of bosqichlar) {
    const q = new Decimal(b.qiymat);
    if (!q.isFinite() || q.isNegative()) {
      throw new BiznesXato('BOSQICH_NOTOGRI', `qiymat noto'g'ri: ${b.qiymat}`);
    }
    if (b.chegaraKvM !== null && b.chegaraKvM <= 0) {
      throw new BiznesXato(
        'BOSQICH_NOTOGRI',
        `chegara musbat bo'lishi kerak: ${String(b.chegaraKvM)}`,
      );
    }
  }
}
