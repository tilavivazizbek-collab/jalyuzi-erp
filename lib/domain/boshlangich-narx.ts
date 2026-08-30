/**
 * lib/domain/boshlangich-narx.ts — TZ 7.10 · P-20
 *
 * Boshlang'ich qoldiqning TANNARXI.
 *
 * ⚠️ NEGA KERAK
 *
 *    Ombordagi bo'lak tannarxi SARFLASH BIRLIGI uchun saqlanadi:
 *    matoda 1 kv.m, mexanizmda 1 dona. Egasi esa boshqacha
 *    o'ylaydi — u «metriga 5 $ edi» yoki «kv.m i 5 $ edi» deydi.
 *
 *    Bu modul o'shani tannarxga aylantiradi. Aks holda egasi
 *    kalkulyator bilan o'zi bo'lardi va har xato butun foyda
 *    hisobotiga o'tib ketardi.
 *
 * ⚠️ Natija — TO'RT XONALI matn. Bo'lak tannarxi bazada
 *    `NUMERIC(14,4)`: 1 kv.m ning narxi ikki xonaga yaxlitlansa,
 *    yuzlab kv.m da farq sezilarli bo'lib ketardi.
 *
 * ⚠️ Bazaga TEGMAYDI (§5.1).
 */

import { BiznesXato } from '@/lib/xato';
import Decimal from 'decimal.js';
import { pulMatn, type Som } from './pul';
import { qatorQiymati, type NarxAsosi } from './tannarx';

export interface RulonOlchami {
  readonly eniM: number;
  readonly boyiM: number;
}

/**
 * Rulonlar uchun 1 kv.m tannarxi.
 *
 * ⚠️ O'RTACHA chiqadi va bu ATAYLAB shunday.
 *
 *    `METR` narxida ensiz rulonning kv.m i qimmatroq, kengi
 *    arzonroq turadi. Bo'lakka bittadan tannarx yozish uchun
 *    `boshlangichQoldiq` ga har bo'lak uchun alohida narx
 *    kerak bo'lardi.
 *
 *    Boshlang'ich qoldiq — TIZIMGA O'TISH raqami, egasining
 *    baholashi. Muhimi JAMI QIYMAT to'g'ri bo'lishi: o'rtacha
 *    tannarx uni aynan saqlaydi.
 */
export function rulonKvMTannarxi(
  asos: NarxAsosi,
  narx: Som,
  bolaklar: readonly RulonOlchami[],
): string {
  if (bolaklar.length === 0) {
    throw new BiznesXato('TANNARX_NOTOGRI', 'rulon kiritilmagan');
  }

  const jamiKvM = bolaklar.reduce((y, b) => y + b.eniM * b.boyiM, 0);
  if (!Number.isFinite(jamiKvM) || jamiKvM <= 0) {
    throw new BiznesXato('TANNARX_NOTOGRI', "rulon eni va bo'yi kiritilishi kerak");
  }

  /** §2.2 — qiymat kirimdagi bilan BITTA funksiyadan chiqadi */
  const jamiQiymat = qatorQiymati({
    id: 0,
    miqdor: bolaklar.length,
    narxBirlik: narx,
    defektMiqdor: 0,
    narxAsosi: asos,
    jamiBoyiM: bolaklar.reduce((y, b) => y + b.boyiM, 0),
    jamiKvM,
  });

  /**
   * ⚠️ Avval JAMI QIYMAT so'mgacha yaxlitlanadi (u haqiqiy pul),
   *    keyin kv.m ga bo'linadi va to'rt xona qoldiriladi — xuddi
   *    kirimdagidek (`lib/amal/kirim.ts`).
   */
  return new Decimal(pulMatn(jamiQiymat)).div(jamiKvM).toFixed(4);
}
