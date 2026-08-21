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

export type StavkaBirligi = 'KV_M' | 'DONA';

export interface StavkaQatori {
  readonly id: number;
  readonly mahsulotTurId: number;
  /** NULL = barcha filialga */
  readonly filialId: number | null;
  /** NULL = barcha xodimga (10.9) */
  readonly xodimId: number | null;
  readonly qiymat: string;
  readonly birlik: StavkaBirligi;
  readonly amalQiladiDan: string;
}

/**
 * TZ 10.9 — eng ANIQ mos keladigan stavka tanlanadi.
 *
 * ⚠️ 2.3-invariant — `sana` parametr bo'lib keladi: «Stavka keyin
 *    ko'tarilsa yoki tushirilsa, ESKI ISHLAR O'ZGARMAYDI. O'tgan
 *    oyning ish haqi bugun qayta hisoblanmaydi.»
 */
export function stavkaTanla(
  qatorlar: readonly StavkaQatori[],
  mahsulotTurId: number,
  filialId: number,
  xodimId: number,
  sana: string,
): StavkaQatori | null {
  const mos = qatorlar.filter(
    (q) =>
      q.mahsulotTurId === mahsulotTurId &&
      q.amalQiladiDan <= sana &&
      (q.filialId === null || q.filialId === filialId) &&
      (q.xodimId === null || q.xodimId === xodimId),
  );

  if (mos.length === 0) return null;

  /** Aniqlik darajasi: xodim (2) > filial (1) > standart (0). */
  const daraja = (q: StavkaQatori): number =>
    (q.xodimId === null ? 0 : 2) + (q.filialId === null ? 0 : 1);

  return mos.reduce((eng, q) => {
    const a = daraja(q);
    const b = daraja(eng);
    if (a !== b) return a > b ? q : eng;
    // Bir xil darajada — kechroq boshlangani (2.3: o'sha sanadagi holat)
    return q.amalQiladiDan > eng.amalQiladiDan ? q : eng;
  });
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
export function bosqichniTop(bosqichlar: readonly Bosqich[], maydonKvM: number): Bosqich {
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
 */
export function haqHisobla(
  qiymat: string,
  birlik: StavkaBirligi,
  maydonKvM: number,
): Som {
  if (birlik === 'DONA') return som(qiymat);
  return kopaytir(som(qiymat), new Decimal(maydonKvM).toString());
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
): HaqNatijasi {
  if (stavka === null) {
    return { haq: nolSom(), stavkaYoq: true };
  }
  return { haq: haqHisobla(stavka.qiymat, stavka.birlik, maydonKvM), stavkaYoq: false };
}
