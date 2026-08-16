/**
 * lib/domain/birlik.ts — QISM 1 §4 · 5.3-invariant · Q-01, Q-05
 *
 * Uzunlik va maydon turlari bir-biriga almashtirib bo'lmaydigan qilib
 * belgilangan. `smToM` / `mToSm` dan boshqa yo'l bilan birlik o'zgarmaydi.
 *
 * Saqlash qoidalari (§4.2):
 *   Buyurtma o'lchami (eni, bo'yi)   INTEGER          sm
 *   Bo'lak o'lchami                   NUMERIC(8,2)     metr
 *   Chiziqli material sarflashi       NUMERIC(10,2)    sm   ← Q-01
 *   Mato sarflashi                    NUMERIC(10,4)    kv.m
 *   Kam qoldiq chegarasi              NUMERIC(6,2)     metr ← Q-10
 *   Aksessuar                         INTEGER          dona
 *
 * Kv.m HECH QACHON kiritilmaydi — `eni × bo'yi` dan hisoblanadi (Q-05).
 */

import { BiznesXato } from '@/lib/xato';

declare const OLCHOV: unique symbol;

export type Santimetr = number & { readonly [OLCHOV]: 'SM' };
export type Metr = number & { readonly [OLCHOV]: 'M' };
export type KvadratMetr = number & { readonly [OLCHOV]: 'KV_M' };
export type Dona = number & { readonly [OLCHOV]: 'DONA' };

/** Materialning sarflash birligi — TZ 5.3, §4.3 */
export type SarflashBirligi = 'SM' | 'KV_M' | 'DONA';

/** Bazadagi kasr xonalari — §4.2 jadvali. */
export const KASR_SM = 2;
export const KASR_METR = 2;
export const KASR_KV_M = 4;

function tekshir(qiymat: number, nima: string): number {
  if (!Number.isFinite(qiymat)) {
    throw new BiznesXato('OLCHOV_NOTOGRI', `${nima}: ${String(qiymat)}`);
  }
  if (qiymat < 0) {
    throw new BiznesXato('OLCHOV_NOTOGRI', `${nima} manfiy bo'la olmaydi: ${String(qiymat)}`);
  }
  return qiymat;
}

function xonagaKeltir(qiymat: number, xona: number): number {
  // Ikkilik kasrni bazadagi aniqlikka moslaydi: 4.199999… → 4.2
  return Number(qiymat.toFixed(xona));
}

// ─── Yaratish ─────────────────────────────────────────────────────────────

export const sm = (v: number): Santimetr =>
  xonagaKeltir(tekshir(v, 'santimetr'), KASR_SM) as Santimetr;

export const m = (v: number): Metr => xonagaKeltir(tekshir(v, 'metr'), KASR_METR) as Metr;

export const kvM = (v: number): KvadratMetr =>
  xonagaKeltir(tekshir(v, 'kvadrat metr'), KASR_KV_M) as KvadratMetr;

export function dona(v: number): Dona {
  tekshir(v, 'dona');
  if (!Number.isInteger(v)) {
    throw new BiznesXato('OLCHOV_NOTOGRI', `dona butun son bo'lishi kerak: ${String(v)}`);
  }
  return v as Dona;
}

// ─── O'girish ─────────────────────────────────────────────────────────────

/** 420 sm → 4.20 m. Chiziqli material narxi 1 metr uchun (Q-01). */
export const smToM = (v: Santimetr): Metr => m(v / 100);

/** 4.20 m → 420 sm. */
export const mToSm = (v: Metr): Santimetr => sm(v * 100);

/** Kvadrat santimetrni kvadrat metrga (formula natijasi uchun, §4.3). */
export const kvSmToKvM = (kvSm: number): KvadratMetr => kvM(tekshir(kvSm, 'kv.sm') / 10_000);

/**
 * Bo'lak maydoni — Q-05: qoldiq har doim `eni × bo'yi` metrda saqlanadi,
 * kv.m faqat shu yerdan chiqadigan hisoblangan qiymat.
 */
export const maydon = (eni: Metr, boyi: Metr): KvadratMetr => kvM(eni * boyi);

/** Buyurtma o'lchamidan maydon — formulaga `MAYDON` kv.sm da beriladi (§4.3). */
export const maydonKvSm = (eni: Santimetr, boyi: Santimetr): number => eni * boyi;

// ─── Sonli amallar (birlik saqlanadi) ─────────────────────────────────────

export const smQosh = (a: Santimetr, b: Santimetr): Santimetr => sm(a + b);
export const smAyir = (a: Santimetr, b: Santimetr): Santimetr => sm(a - b);
export const metrQosh = (a: Metr, b: Metr): Metr => m(a + b);
export const metrAyir = (a: Metr, b: Metr): Metr => m(a - b);
export const kvMQosh = (a: KvadratMetr, b: KvadratMetr): KvadratMetr => kvM(a + b);

export const kvMYigindi = (qatordagilar: readonly KvadratMetr[]): KvadratMetr =>
  kvM(qatordagilar.reduce<number>((jami, q) => jami + q, 0));

// ─── Chiqarish ────────────────────────────────────────────────────────────

/** Bazaga beriladigan ko'rinish — NUMERIC ustunlar uchun `string`. */
export const smMatn = (v: Santimetr): string => v.toFixed(KASR_SM);
export const metrMatn = (v: Metr): string => v.toFixed(KASR_METR);
export const kvMMatn = (v: KvadratMetr): string => v.toFixed(KASR_KV_M);

/** Chiziqli material smda saqlanadi, lekin foydalanuvchiga metrda ko'rsatiladi (§4.2). */
export const smKorsat = (v: Santimetr): string => `${smToM(v).toFixed(KASR_METR)} m`;
export const metrKorsat = (v: Metr): string => `${v.toFixed(KASR_METR)} m`;
export const kvMKorsat = (v: KvadratMetr): string => `${v.toFixed(KASR_KV_M)} kv.m`;
export const bolakKorsat = (eni: Metr, boyi: Metr): string =>
  `${eni.toFixed(KASR_METR)} × ${boyi.toFixed(KASR_METR)} m`;
