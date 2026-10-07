/**
 * lib/domain/xarid.ts — xarid buyurtmasi holati (0063).
 * Ombor auditi 2026-10-07, 7-band.
 *
 * ⚠️ HOLAT IKKI QISMDAN: bazada faqat egasining QARORI saqlanadi
 *    (`OCHIQ` / `YOPILDI` / `BEKOR`). «Qancha keldi» esa har safar
 *    kirimlardan hisoblanadi — shu yerda. Kirim storno bo'lsa
 *    buyurtma o'zi «kutilmoqda»ga qaytadi.
 *
 * ⚠️ Miqdor — kirim birligida (rulon, shtanga). Son `numeric` matn
 *    bo'lib keladi: `Decimal` bilan solishtiriladi, `number` emas.
 */

import Decimal from 'decimal.js';

export type XaridQarori = 'OCHIQ' | 'YOPILDI' | 'BEKOR';

/** Ekranda ko'rinadigan holat */
export type XaridHolati = 'KUTILMOQDA' | 'QISMAN' | 'TOLIQ' | 'YOPILDI' | 'BEKOR';

export const XARID_HOLAT_NOMI: Readonly<Record<XaridHolati, string>> = {
  KUTILMOQDA: 'Kutilmoqda',
  QISMAN: 'Qisman keldi',
  TOLIQ: 'To‘liq keldi',
  YOPILDI: 'Yopilgan',
  BEKOR: 'Bekor qilingan',
};

export interface XaridQatorMiqdori {
  /** Buyurtma qilingan */
  readonly miqdor: string;
  /** FAOL kirimlarda kelgan (shu buyurtma, shu material) */
  readonly kelgan: string;
}

export interface QatorHolati {
  /** Hali kelishi kerak; ortiqcha kelgan bo'lsa — 0 */
  readonly qolgan: string;
  /** Buyurtmadan ortiq kelgan; bo'lmasa — 0 */
  readonly ortiqcha: string;
}

const matn = (d: Decimal): string => d.toFixed(2);

export function qatorHolati(q: XaridQatorMiqdori): QatorHolati {
  const farq = new Decimal(q.miqdor).minus(new Decimal(q.kelgan));
  return {
    qolgan: matn(Decimal.max(farq, 0)),
    ortiqcha: matn(Decimal.max(farq.negated(), 0)),
  };
}

/**
 * Buyurtma holati.
 *
 * ⚠️ Egasining qarori ustun: yopilgan buyurtma kam kelgan bo'lsa ham
 *    «Yopilgan» — qolgani endi kutilmaydi. Ochiq buyurtmada esa holat
 *    faqat kelgan miqdordan chiqadi.
 */
export function xaridHolati(
  qaror: XaridQarori,
  qatorlar: readonly XaridQatorMiqdori[],
): XaridHolati {
  if (qaror === 'BEKOR') return 'BEKOR';
  if (qaror === 'YOPILDI') return 'YOPILDI';
  const hechNarsaKelmadi = qatorlar.every((q) => new Decimal(q.kelgan).lte(0));
  if (hechNarsaKelmadi) return 'KUTILMOQDA';
  const hammasiKeldi = qatorlar.every((q) => new Decimal(qatorHolati(q).qolgan).lte(0));
  return hammasiKeldi ? 'TOLIQ' : 'QISMAN';
}

/** Mol hali kutilyaptimi — «yo'lda» hisoblanadimi */
export function kutilyaptimi(h: XaridHolati): boolean {
  return h === 'KUTILMOQDA' || h === 'QISMAN';
}

/**
 * Kechikkanmi: va'da qilingan kun o'tdi, mol esa to'liq kelmadi.
 *
 * ⚠️ Sana — `YYYY-MM-DD` matn (Toshkent kuni). Shu ko'rinishda matn
 *    solishtirish sana solishtirish bilan bir xil.
 */
export function kechikkanmi(h: XaridHolati, kutilganSana: string | null, bugun: string): boolean {
  return kutilyaptimi(h) && kutilganSana !== null && kutilganSana < bugun;
}

export type XaridNarxAsosi = 'BIRLIK' | 'METR' | 'KV_M';

/**
 * Buyurtma qatorining TAXMINIY summasi.
 *
 * ⚠️ Rulon metrga (`METR`) yoki kv.m ga (`KV_M`) narxlansa, haqiqiy
 *    summa rulonlar kelib o'lchanganda ma'lum bo'ladi (7.9). Buyurtmada
 *    kartochkadagi odatdagi o'lcham bilan TAXMIN qilinadi; o'lcham
 *    yozilmagan bo'lsa — `null` (summa aytilmaydi, uydirilmaydi).
 */
export function xaridQatorSummasi(q: {
  readonly narx: string | null;
  readonly miqdor: string;
  readonly asosi: XaridNarxAsosi;
  readonly odatdagiBoyiM: string | null;
  readonly odatdagiEniM: string | null;
}): string | null {
  if (q.narx === null) return null;
  const asos = new Decimal(q.narx).times(q.miqdor);
  if (q.asosi === 'BIRLIK') return asos.toFixed(2);
  if (q.odatdagiBoyiM === null || !new Decimal(q.odatdagiBoyiM).gt(0)) return null;
  const metr = asos.times(q.odatdagiBoyiM);
  if (q.asosi === 'METR') return metr.toFixed(2);
  if (q.odatdagiEniM === null || !new Decimal(q.odatdagiEniM).gt(0)) return null;
  return metr.times(q.odatdagiEniM).toFixed(2);
}

/** Narx yonidagi birlik: «so'm/metr», «$/rulon» */
export function narxBirligiMatni(asosi: XaridNarxAsosi, valyuta: string, kirimBirligi: string): string {
  const v = valyuta === 'USD' ? '$' : "so'm";
  return `${v}/${asosi === 'METR' ? 'metr' : asosi === 'KV_M' ? 'kv.m' : kirimBirligi}`;
}

// ─── Yetkazib beruvchi ishonchliligi — audit 2026-10-07 ───────────────────

export interface BuyurtmaTarixi {
  readonly sana: string;
  readonly kutilganSana: string | null;
  /** Shu buyurtma bo'yicha birinchi FAOL kirim sanasi */
  readonly birinchiKirim: string | null;
  readonly holat: XaridHolati;
}

export interface Ishonchlilik {
  /** Bekor qilinmagan buyurtmalar */
  readonly buyurtmaSoni: number;
  /** Buyurtmadan birinchi kirimgacha o'rtacha kun */
  readonly ortachaKun: number | null;
  /** Va'da sanasi bor va mol kelganlardan — o'z vaqtida kelgani, % */
  readonly vaqtidaFoiz: number | null;
  readonly vaqtidaAsos: number;
  /** Yakunlanganlardan to'liq kelgani, % (yopilgani — kam kelgan) */
  readonly toliqFoiz: number | null;
  readonly toliqAsos: number;
  /** Hozir kechikayotgan ochiq buyurtmalar */
  readonly kechikayotgan: number;
}

const kunlarOrasi = (dan: string, gacha: string): number =>
  Math.round((Date.parse(`${gacha}T00:00:00Z`) - Date.parse(`${dan}T00:00:00Z`)) / 86_400_000);

/**
 * ⚠️ Foiz faqat ASOSI bor joyda: bitta buyurtmadan «100% vaqtida» degan
 *    xulosa chiqarilmaydi — ekran asos sonini ham ko'rsatadi.
 */
export function ishonchlilik(b: readonly BuyurtmaTarixi[], bugun: string): Ishonchlilik {
  const faol = b.filter((x) => x.holat !== 'BEKOR');
  const kelgan = faol.filter((x) => x.birinchiKirim !== null);
  const kunlar = kelgan.map((x) => kunlarOrasi(x.sana, x.birinchiKirim ?? x.sana));
  const vaqtAsos = kelgan.filter((x) => x.kutilganSana !== null);
  const vaqtida = vaqtAsos.filter((x) => (x.birinchiKirim ?? '') <= (x.kutilganSana ?? '')).length;
  // Yakunlangan: to'liq kelgan yoki yopilgan (mol kelgan bo'lsa)
  const yakun = kelgan.filter((x) => x.holat === 'TOLIQ' || x.holat === 'YOPILDI');
  const toliq = yakun.filter((x) => x.holat === 'TOLIQ').length;
  const foiz = (n: number, d: number): number | null => (d === 0 ? null : Math.round((n / d) * 100));
  return {
    buyurtmaSoni: faol.length,
    ortachaKun:
      kunlar.length === 0 ? null : Math.round(kunlar.reduce((y, k) => y + k, 0) / kunlar.length),
    vaqtidaFoiz: foiz(vaqtida, vaqtAsos.length),
    vaqtidaAsos: vaqtAsos.length,
    toliqFoiz: foiz(toliq, yakun.length),
    toliqAsos: yakun.length,
    kechikayotgan: faol.filter((x) => kechikkanmi(x.holat, x.kutilganSana, bugun)).length,
  };
}
