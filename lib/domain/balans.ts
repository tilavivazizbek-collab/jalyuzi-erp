/**
 * lib/domain/balans.ts — TZ 10.4 · 10.5 · 12.1 · 2.2-invariant · AUDIT Z-12
 *
 * Balans va kassa qoldig'ining sof mantiqi. Bazaga TEGMAYDI (§5.1).
 *
 * ⚠️ 2.2-invariant — balans HECH QAYERDA saqlanmaydi. Bu fayl
 *    harakatlar RO'YXATIDAN balansni hisoblaydi; kim ro'yxatni
 *    keltirishi `lib/amal/` ning ishi.
 *
 * ⚠️ 1.3-band — so'm va dollar HECH QACHON bitta summaga qo'shilmaydi.
 *    Shuning uchun balans har valyuta uchun ALOHIDA chiqadi.
 */

import {
  ayir,
  bol,
  dollar,
  kopaytir,
  manfiymi,
  nolDollar,
  nolmi,
  nolSom,
  pulMatn,
  qosh,
  som,
  type Dollar,
  type Som,
  type Valyuta,
} from './pul';
import { BiznesXato } from '@/lib/xato';

// ─── 10.4 · Xodim balansi ─────────────────────────────────────────────────

/**
 * AUDIT Z-12 — «balans = hisoblangan − olingan − ushlangan».
 *
 * Ishorani jadvaldagi `summa` ustuni olib yuradi:
 *   + hisoblandi (HAQ, QOLDA_TUZATISH musbat)
 *   − olindi (TOLOV, AVANS, USHLANMA, JARIMA, HAQ_BEKOR)
 *
 * Shuning uchun balans oddiy yig'indi. Ishorani qo'yish `lib/amal/`
 * ning ishi va u yerda bir joyda turadi.
 */
export interface XodimHarakati {
  readonly turi: string;
  readonly summa: string;
  readonly valyuta: Valyuta;
}

export interface Balans {
  readonly som: Som;
  /** Dollar ALOHIDA tur — 1.3-band bo'yicha so'mga qo'shilmaydi */
  readonly dollar: Dollar;
}

export function xodimBalansi(harakatlar: readonly XodimHarakati[]): Balans {
  let s = nolSom();
  let d = nolDollar();

  for (const h of harakatlar) {
    if (h.valyuta === 'SOM') {
      s = qosh(s, som(h.summa));
    } else {
      d = qosh(d, dollar(h.summa));
    }
  }

  return { som: s, dollar: d };
}

/**
 * TZ 10.4 — «Manfiy balans MUMKIN va BLOKLANMAYDI. Xodim ishlaganidan
 * ko'p olsa (avans) yoki brak ushlansa balans manfiyga tushadi.»
 */
export function manfiyBalansmi(b: Balans): boolean {
  return manfiymi(b.som) || manfiymi(b.dollar);
}

/**
 * TZ 10.4 — «Balansi 0 dan farq qiladigan xodimni NOFAOL QILIB
 * BO'LMAYDI. Ishdan bo'shagan xodimda manfiy balans qolsa — admin uni
 * hisobdan chiqaradi, sabab majburiy, xarajatga tushadi.»
 */
export function nofaolQilinadimi(b: Balans): boolean {
  return nolmi(b.som) && nolmi(b.dollar);
}

// ─── 10.5 · Valyuta konversiyasi to'lovda ─────────────────────────────────

/**
 * TZ 10.5 — «Balans 85 $. To'lov 660 000 so'm, kurs 13 200.
 * 660 000 ÷ 13 200 = 50 $ balansdan yechiladi. Qoladi 35 $.»
 *
 * ⚠️ «Alohida "kurs farqi" moddasi YURITILMAYDI» — to'lov balans
 *    valyutasiga o'giriladi va shu bilan tugaydi.
 */
export function tolovniBalansValyutasiga(
  tolovSumma: string,
  tolovValyutasi: Valyuta,
  balansValyutasi: Valyuta,
  kurs: string | null,
): string {
  if (tolovValyutasi === balansValyutasi) return tolovSumma;

  if (kurs === null || Number(kurs) <= 0) {
    throw new BiznesXato('KURS_KERAK', 'balans valyutasi boshqa');
  }

  // §3.1 — pul JS `number` bilan bo'linmaydi
  return tolovValyutasi === 'SOM'
    ? pulMatn(bol(som(tolovSumma), kurs)) // so'm → dollar
    : pulMatn(kopaytir(dollar(tolovSumma), kurs)); // dollar → so'm
}

// ─── 12.1 · Xarajat va kassa ──────────────────────────────────────────────

export type XarajatModdasi =
  | 'ISH_HAQI'
  | 'TRANSPORT_BOJXONA'
  | 'OMBOR_BRAKI'
  | 'ISHLAB_CHIQARISH_BRAKI'
  | 'CHIQINDI'
  | 'KURS_FARQI'
  | 'YETKAZIB_BERUVCHI_DEFEKTI'
  | 'UMIDSIZ_QARZ'
  | 'BANK_KOMISSIYASI'
  | 'OPERATSION'
  | 'INVENTARIZATSIYA_FARQI'
  | 'YAXLITLASH'
  | 'XODIM_BALANSI_HISOBDAN'
  | 'FILIALLARARO_TRANSPORT'
  | 'BOSHQA';

/**
 * TZ 12.1 — «Pul CHIQMAYDI, lekin XARAJAT bo'ladi.»
 *
 * Bu moddalar `xarajat` jadvaliga `kassa_yozuv_id = NULL` bilan tushadi.
 */
const PULSIZ_XARAJAT: readonly XarajatModdasi[] = [
  'OMBOR_BRAKI',
  'CHIQINDI',
  'ISHLAB_CHIQARISH_BRAKI',
  'UMIDSIZ_QARZ',
  'ISH_HAQI', // hisoblangan haq — to'lov ALOHIDA hodisa
  'YETKAZIB_BERUVCHI_DEFEKTI',
  'KURS_FARQI',
  'INVENTARIZATSIYA_FARQI',
  'YAXLITLASH',
  'XODIM_BALANSI_HISOBDAN',
];

export function pulChiqmaydimi(modda: XarajatModdasi): boolean {
  return PULSIZ_XARAJAT.includes(modda);
}

/**
 * TZ 12.1 — «Pul CHIQADI, lekin XARAJAT EMAS.»
 *
 * Bu kodlar `xarajat` jadvaliga UMUMAN tushmaydi:
 *   C1, C2  yetkazib beruvchiga to'lov — mol allaqachon tannarxga kirgan
 *   C4, C5  ish haqi to'lovi — haq allaqachon «Tugatdim» da xarajat bo'lgan
 *   C8      egasi pul oldi
 *   C9      adminga topshiriq — kassalar orasidagi ko'chish
 */
const XARAJAT_EMAS: readonly string[] = ['C1', 'C2', 'C4', 'C5', 'C8', 'C9'];

export function xarajatgaTushadimi(kassaKodi: string): boolean {
  return !XARAJAT_EMAS.includes(kassaKodi);
}

// ─── 12.17 · Kun yopish ───────────────────────────────────────────────────

export interface KunHisobi {
  readonly boshlangich: Som;
  readonly kirim: Som;
  readonly chiqim: Som;
  readonly hisoblangan: Som;
}

/**
 * TZ 12.17 · K-09 — kun yopish hisobi.
 *
 *   850 000 + 4 200 000 − 1 850 000 = 3 200 000
 *
 * ⚠️ `chiqim` MUSBAT son bo'lib keladi (kassa yozuvidagi manfiy
 *    summalarning absolyut yig'indisi). Ishorani ikki joyda o'ylash
 *    xatoga olib keladi.
 */
export function kunHisobi(
  boshlangich: Som,
  kirim: Som,
  chiqim: Som,
): KunHisobi {
  return {
    boshlangich,
    kirim,
    chiqim,
    hisoblangan: ayir(qosh(boshlangich, kirim), chiqim),
  };
}

/**
 * TZ 12.17 — sanalgan va hisoblangan farqi.
 *
 * Musbat — kassada ortiqcha, manfiy — yetishmaydi.
 */
export function kunFarqi(hisoblangan: Som, sanaldi: Som): Som {
  return ayir(sanaldi, hisoblangan);
}
