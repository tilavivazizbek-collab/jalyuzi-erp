/**
 * lib/domain/xarid-kerak.ts — «qachon buyurtma berish kerak».
 * Ombor auditi 2026-10-07, 8-band.
 *
 * ⚠️ «QOLDIQ KAM» YETARLI EMAS. Mato yetkazib beruvchidan 10 kunda
 *    keladi va 8 kunlik qoldiq bo'lsa — bugun buyurtma bermasa, 2 kun
 *    sex to'xtaydi. Shuning uchun savol: «qoldiq yetkazib berish
 *    muddatiga + zaxira kunlariga yetadimi?» (buyurtma nuqtasi, ROP).
 *
 * ⚠️ Yetkazib berish muddati egasidan SO'RALMAYDI — o'tgan xarid
 *    buyurtmalaridan o'lchanadi (buyurtma sanasi → birinchi kirim).
 *    Tarix yo'q bo'lsa standart ishlatiladi va ekranda shunday deyiladi.
 */

import Decimal from 'decimal.js';
import { CHEGARA_OMBOR, type Bashorat } from './hisobot/bashorat';

/** Tarix bo'lmasa — ikki hafta (ombor ogohlantirish chegarasi bilan bir xil) */
export const STANDART_YETKAZISH_KUNI = CHEGARA_OMBOR.ogohlantirish;

/** Kechikish yoki kutilmagan katta buyurtma uchun ustiga qo'yiladigan zaxira */
export const ZAXIRA_KUNI = CHEGARA_OMBOR.xavf;

export interface YetkazishMuddati {
  readonly kun: number;
  readonly manba: 'TARIX' | 'STANDART';
}

/**
 * O'tgan buyurtmalardagi kutish kunlaridan muddat.
 *
 * ⚠️ MEDIANA, o'rtacha emas: bitta 60 kunlik bojxona hodisasi
 *    o'rtachani buzib, har materialni «shoshilinch» qilib qo'yardi.
 *    Juft sonda — kattarog'i (ehtiyot tomonga).
 */
export function yetkazishMuddati(kunlar: readonly number[]): YetkazishMuddati {
  const toza = kunlar.filter((k) => Number.isFinite(k) && k >= 0).sort((a, b) => a - b);
  if (toza.length === 0) return { kun: STANDART_YETKAZISH_KUNI, manba: 'STANDART' };
  const kun = toza[Math.floor(toza.length / 2)] ?? STANDART_YETKAZISH_KUNI;
  return { kun, manba: 'TARIX' };
}

export type XaridSababi = 'TUGAGAN' | 'KAM' | 'TEZ_TUGAYDI';

export const XARID_SABABI_NOMI: Readonly<Record<XaridSababi, string>> = {
  TUGAGAN: 'Tugagan',
  KAM: 'Chegaradan kam',
  TEZ_TUGAYDI: 'Kelguncha tugaydi',
};

/**
 * Buyurtma kerakmi va nega. `null` — kerak emas.
 *
 * ⚠️ Yo'lda (ochiq xarid buyurtmasida) mol bo'lsa — bu yerda HAL
 *    QILINMAYDI, sabab baribir qaytariladi. Ekran uni «yo'lda» deb
 *    ko'rsatadi: miqdor turli birlikda (rulon va kv.m), avtomatik
 *    ayirib bo'lmaydi — omborchi o'zi ko'radi.
 *
 * ⚠️ Harakatsiz material (`NOMALUM`) faqat chegara bo'yicha belgilanadi:
 *    sarf yo'q bo'lsa «tez tugaydi» deyishga asos yo'q.
 */
export function xaridSababi(k: {
  readonly tugagan: boolean;
  readonly kamQoldiq: boolean;
  readonly bashorat: Bashorat | null;
  readonly yetkazishKuni: number;
}): XaridSababi | null {
  if (k.tugagan) return 'TUGAGAN';
  if (k.kamQoldiq) return 'KAM';
  const b = k.bashorat;
  if (b === null || b.kunlar === null) return null;
  if (b.holati === 'TUGAGAN') return 'TUGAGAN';
  return b.kunlar <= k.yetkazishKuni + ZAXIRA_KUNI ? 'TEZ_TUGAYDI' : null;
}

/** Qaysi biri birinchi: tugagan → kam → tez tugaydi; ichida — kam kun qolgani */
export function sababTartibi(s: XaridSababi): number {
  return s === 'TUGAGAN' ? 0 : s === 'KAM' ? 1 : 2;
}

/**
 * Tavsiyani BUYURTMA BIRLIGIGA o'giradi (rulon, shtanga, quti) — yuqoriga.
 *
 * ⚠️ Sarf kv.m yoki metrda hisoblanadi, buyurtma esa rulon / shtangada
 *    beriladi. Ilgari «~58 kv.m» deyilardi va omborchi necha rulon
 *    ekanini o'zi hisoblardi (2026-10-10 o'z-o'zini tekshiruv).
 *
 * ⚠️ Rulonda koeffitsient ishlatilmaydi (u 1) — odatdagi eni × bo'yi.
 *    O'lcham yozilmagan bo'lsa `null`: taxmin uydirilmaydi.
 */
export function kirimBirligida(
  sarf: string,
  m: {
    readonly hisobTuri: string;
    readonly koeffitsient: string;
    readonly standartEniM: string | null;
    readonly odatdagiBoyiM: string | null;
  },
): number | null {
  const s = new Decimal(sarf);
  if (s.lte(0)) return 0;
  if (m.hisobTuri === 'RULON' || m.hisobTuri === 'KV_M') {
    if (m.standartEniM === null || m.odatdagiBoyiM === null) return null;
    const bir = new Decimal(m.standartEniM).times(m.odatdagiBoyiM);
    return bir.gt(0) ? s.div(bir).ceil().toNumber() : null;
  }
  const k = new Decimal(m.koeffitsient);
  return k.gt(0) ? s.div(k).ceil().toNumber() : null;
}
