/**
 * lib/domain/birlik.ts — QISM 1 §4 · 5.3-invariant · Q-01, Q-05
 *
 * ⚠️ TIZIM 2026-09-20 DA BUTUNLAY METRGA O'TDI
 *
 *    Ilgari: buyurtma smda, bo'lak metrda, mato kv.m da.
 *    Endi:   HAMMASI metrda (maydon — kv.m).
 *
 *    Egasi: «butun tizim metr tizimiga o'tsin, smni to'liq olib
 *    tashla, ba'zi joylarda 100 ga o'tgansan».
 *
 *    U haq edi. Har `÷100` — kelajakdagi xato: `kesimOlchami`,
 *    `olchovi`, `qatorSummasi` — har biri o'z joyida bo'lardi va
 *    bittasi unutilsa raqam 100 yoki 10 000 barobar adashardi.
 *    Endi konversiya UMUMAN YO'Q.
 *
 * ⚠️ `Santimetr` turi ATAYLAB O'CHIRILDI, nomi o'zgartirilmadi.
 *    Agar u qolganda, ma'nosi o'zgargan holda eski kod jimgina
 *    ishlayverardi. O'chirilgani uchun TypeScript har bir joyni
 *    ko'rsatdi — taxmin qilinmadi.
 *
 * Saqlash qoidalari:
 *   Buyurtma o'lchami (eni, bo'yi)   NUMERIC(8,2)     metr
 *   Bo'lak o'lchami                   NUMERIC(8,2)     metr
 *   Chiziqli material sarflashi       NUMERIC(10,2)    metr  ← Q-01
 *   Mato sarflashi                    NUMERIC(10,4)    kv.m
 *   Kam qoldiq chegarasi              NUMERIC(6,2)     metr  ← Q-10
 *   Aksessuar                         INTEGER          dona
 *
 * Kv.m HECH QACHON kiritilmaydi — `eni × bo'yi` dan hisoblanadi (Q-05).
 */

import { BiznesXato } from '@/lib/xato';

declare const OLCHOV: unique symbol;

export type Metr = number & { readonly [OLCHOV]: 'M' };
export type KvadratMetr = number & { readonly [OLCHOV]: 'KV_M' };
export type Dona = number & { readonly [OLCHOV]: 'DONA' };

/**
 * Materialning sarflash birligi — TZ 5.3, §4.3.
 *
 * ⚠️ `SM` o'rniga `M`: chiziqli material endi METRDA sarflanadi.
 *    Narx ham 1 metr uchun edi (Q-01), ya'ni endi ular bir xil
 *    birlikda va `÷100` kerak emas.
 */
export type SarflashBirligi = 'M' | 'KV_M' | 'DONA';

/** Bazadagi kasr xonalari — §4.2 jadvali. */
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

export const m = (v: number): Metr => xonagaKeltir(tekshir(v, 'metr'), KASR_METR) as Metr;

export const kvM = (v: number): KvadratMetr =>
  xonagaKeltir(tekshir(v, 'kvadrat metr'), KASR_KV_M) as KvadratMetr;

export function dona(v: number): Dona {
  const n = tekshir(v, 'dona');
  if (!Number.isInteger(n)) {
    throw new BiznesXato('OLCHOV_NOTOGRI', `dona butun bo'lishi kerak: ${String(v)}`);
  }
  return n as Dona;
}

// ─── Maydon ───────────────────────────────────────────────────────────────

/**
 * Q-05 — maydon `eni × bo'yi` dan chiqadi, hech qachon kiritilmaydi.
 *
 * ⚠️ Ilgari `maydonKvSm` ham bor edi va u KV.SM qaytarardi: formula
 *    smda ishlagani uchun. Endi u kerak emas — formula ham metrda.
 */
export const maydon = (eni: Metr, boyi: Metr): KvadratMetr => kvM(eni * boyi);

// ─── Arifmetika ───────────────────────────────────────────────────────────

export const metrQosh = (a: Metr, b: Metr): Metr => m(a + b);
export const metrAyir = (a: Metr, b: Metr): Metr => m(a - b);
export const kvMQosh = (a: KvadratMetr, b: KvadratMetr): KvadratMetr => kvM(a + b);

export const kvMYigindi = (qatordagilar: readonly KvadratMetr[]): KvadratMetr =>
  qatordagilar.reduce<KvadratMetr>((y, x) => kvMQosh(y, x), kvM(0));

// ─── Matn ─────────────────────────────────────────────────────────────────

export const metrMatn = (v: Metr): string => v.toFixed(KASR_METR);
export const kvMMatn = (v: KvadratMetr): string => v.toFixed(KASR_KV_M);

export const metrKorsat = (v: Metr): string => `${v.toFixed(KASR_METR)} m`;
export const kvMKorsat = (v: KvadratMetr): string => `${v.toFixed(KASR_KV_M)} kv.m`;
/** ⚠️ «m» bir marta, oxirida: «3.00 × 28.00 m» — omborchi shunday o'qiydi */
export const bolakKorsat = (eni: Metr, boyi: Metr): string =>
  `${metrMatn(eni)} × ${metrKorsat(boyi)}`;
