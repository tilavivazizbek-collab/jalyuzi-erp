/**
 * lib/domain/hisobot/bashorat.ts — HISOBOTLAR-ISH §9 (birinchi naqsh)
 *
 * To'rt bo'limda bir xil savol takrorlanadi:
 *
 *   Ombor        — material qachon tugaydi (11.7.3 dan keyingi qadam)
 *   Mijozlar     — kelgusi oyda qancha to'lov kutilmoqda
 *   Buyurtmalar  — yangi buyurtma qachon tayyor bo'ladi
 *   Ta'minot     — keyingi xarid qachon kerak
 *
 * Hammasining mantig'i bitta: **o'tgan davrdagi tezlik → qolgan zaxira ÷
 * tezlik → necha kun qoldi**. Shuning uchun mexanizm shu yerda bir marta
 * yoziladi, har bo'limda qaytadan emas ("bir mantiq — bir joyda").
 *
 * ⚠️ BU BASHORAT EMAS, EKSTRAPOLYATSIYA. Mavsumiylikni ham, kutilayotgan
 * buyurtmani ham bilmaydi. Shuning uchun natijada `ishonch` maydoni bor va
 * interfeysda «taxminan» so'zi bilan ko'rsatiladi — aks holda foydalanuvchi
 * uni va'da deb tushunadi.
 */

import Decimal from 'decimal.js';
import { BiznesXato } from '@/lib/xato';

/** Tezlik qanchalik ishonchli — nechta kun kuzatilganiga qarab. */
export type Ishonch = 'YOQ' | 'PAST' | 'ORTA' | 'YAXSHI';

/** Kuzatuv davri shundan qisqa bo'lsa, tezlik tasodifiy chiqadi. */
export const ISHONCH_PAST_KUN = 14;
export const ISHONCH_ORTA_KUN = 45;

export interface Tezlik {
  /** Bir kunda o'rtacha qancha sarflanadi — birlik chaqiruvchida (metr, kv.m, dona, so'm) */
  readonly kunlik: Decimal;
  /** Necha kunlik kuzatuvdan olindi */
  readonly kunlar: number;
  readonly ishonch: Ishonch;
}

export function ishonchDarajasi(kunlar: number, harakatBormi: boolean): Ishonch {
  if (!harakatBormi || kunlar <= 0) return 'YOQ';
  if (kunlar < ISHONCH_PAST_KUN) return 'PAST';
  if (kunlar < ISHONCH_ORTA_KUN) return 'ORTA';
  return 'YAXSHI';
}

/**
 * O'rtacha kunlik tezlik.
 *
 * `jamiSarf` — davr ichida sarflangan miqdor, `kunlar` — davr uzunligi
 * (`davr.kunlarSoni`). Ikkalasi ham chaqiruvchidan keladi: bu funksiya
 * bazaga ham, kalendarga ham tegmaydi.
 */
export function ortachaTezlik(jamiSarf: Decimal | number | string, kunlar: number): Tezlik {
  if (!Number.isFinite(kunlar) || kunlar <= 0) {
    throw new BiznesXato('BASHORAT_NOTOGRI', `davr kunlari: ${String(kunlar)}`);
  }
  const sarf = new Decimal(jamiSarf);
  if (sarf.isNegative()) {
    throw new BiznesXato('BASHORAT_NOTOGRI', `sarf manfiy: ${sarf.toString()}`);
  }
  const kunlik = sarf.div(kunlar);
  return {
    kunlik,
    kunlar,
    ishonch: ishonchDarajasi(kunlar, sarf.greaterThan(0)),
  };
}

export type BashoratHolati = 'NOMALUM' | 'XAVF' | 'OGOHLANTIRISH' | 'YETARLI' | 'TUGAGAN';

export interface Bashorat {
  /**
   * Necha kunga yetadi. `null` — hisoblab bo'lmaydi (harakat yo'q).
   *
   * ⚠️ `null` «hech qachon tugamaydi» degani EMAS. Harakat yo'qligi ko'pincha
   * teskarisini bildiradi: material o'lik yotibdi (11.7.6 — muzlab qolgan pul).
   */
  readonly kunlar: number | null;
  /** Taxminiy tugash sanasi — `kunlar` null bo'lsa null */
  readonly sana: Date | null;
  readonly holati: BashoratHolati;
  readonly ishonch: Ishonch;
}

export interface BashoratChegarasi {
  /** Shundan kam qolsa — qizil */
  readonly xavf: number;
  /** Shundan kam qolsa — sariq */
  readonly ogohlantirish: number;
}

/** Ombor uchun standart: bir hafta ichida tugasa qizil, ikki haftada sariq. */
export const CHEGARA_OMBOR: BashoratChegarasi = { xavf: 7, ogohlantirish: 14 };

/**
 * Joriy zaxira joriy tezlikda necha kunga yetadi.
 *
 * Yaxlitlash PASTGA: 6.9 kun → 6 kun. Ustama tomonga yaxlitlash xavfni
 * kamaytirib ko'rsatadi va material kutilmaganda tugaydi.
 */
export function qanchaKunQoldi(
  qoldiq: Decimal | number | string,
  tezlik: Tezlik,
  bugun: Date,
  chegara: BashoratChegarasi = CHEGARA_OMBOR,
): Bashorat {
  const zaxira = new Decimal(qoldiq);

  if (zaxira.lessThanOrEqualTo(0)) {
    return { kunlar: 0, sana: bugun, holati: 'TUGAGAN', ishonch: tezlik.ishonch };
  }
  if (tezlik.kunlik.lessThanOrEqualTo(0)) {
    return { kunlar: null, sana: null, holati: 'NOMALUM', ishonch: 'YOQ' };
  }

  const kunlar = zaxira.div(tezlik.kunlik).floor().toNumber();
  const sana = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate() + kunlar);

  const holati: BashoratHolati =
    kunlar <= chegara.xavf ? 'XAVF' : kunlar <= chegara.ogohlantirish ? 'OGOHLANTIRISH' : 'YETARLI';

  return { kunlar, sana, holati, ishonch: tezlik.ishonch };
}

/**
 * Teskari savol: berilgan kunga yetishi uchun qancha kerak (xarid ro'yxati,
 * 15.3 va HISOBOTLAR-ISH §6.1 №19).
 *
 * Natija manfiy chiqmaydi — zaxira yetarli bo'lsa 0.
 */
export function qanchaKerak(
  qoldiq: Decimal | number | string,
  tezlik: Tezlik,
  kunlarGa: number,
): Decimal {
  if (!Number.isFinite(kunlarGa) || kunlarGa < 0) {
    throw new BiznesXato('BASHORAT_NOTOGRI', `kunlar: ${String(kunlarGa)}`);
  }
  const kerak = tezlik.kunlik.times(kunlarGa).minus(new Decimal(qoldiq));
  return kerak.isNegative() ? new Decimal(0) : kerak;
}

/**
 * Aylanish koeffitsienti (HISOBOTLAR-ISH §3.1 №16) — davr sarfi o'rtacha
 * qoldiqqa nisbatan. Yiliga necha marta aylangani.
 *
 * `null` — o'rtacha qoldiq nol (material umuman bo'lmagan), bo'linma yo'q.
 */
export function aylanish(
  davrSarfi: Decimal | number | string,
  ortachaQoldiq: Decimal | number | string,
): Decimal | null {
  const qoldiq = new Decimal(ortachaQoldiq);
  if (qoldiq.lessThanOrEqualTo(0)) return null;
  return new Decimal(davrSarfi).div(qoldiq);
}
