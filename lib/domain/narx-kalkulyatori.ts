/**
 * lib/domain/narx-kalkulyatori.ts — TZ 5.4 · 9.6 · 1.3-invariant
 *
 * ⚠️ NEGA BU FAYL BOR
 *
 * Material kartochkasida narx $ da ham, so'mda ham ko'rinishi kerak:
 * egasi «bu mato 12 dollar» deb o'ylaydi, kassir esa so'mda ishlaydi.
 *
 * ⚠️ LEKIN BAZAGA FAQAT BITTASI YOZILADI. Ikkalasini saqlash —
 *    1.3-invariantni buzish: bugun kurs 12 800, uch oydan keyin
 *    13 500, va bazadagi ikki raqam bir-biriga to'g'ri kelmay
 *    qoladi. Hisobot qaysi birini olishi noaniq bo'lardi.
 *
 *    Shuning uchun bu yerdagi o'girish — EKRAN UCHUN. Saqlanadigan
 *    raqam — foydalanuvchi tanlagan valyutadagi biri.
 */

import { Decimal } from 'decimal.js';
import { PUL_KASR_XONASI } from './pul';

/** Ekranda ko'rsatiladigan hamroh qiymat. Bo'sh yoki noto'g'ri kirish — `''`. */
export function hamrohQiymat(
  qiymat: string,
  kursMatn: string,
  yonalish: 'USD_DAN_SOMGA' | 'SOM_DAN_USDGA',
): string {
  const q = qiymat.trim();
  const k = kursMatn.trim();
  if (q === '' || k === '') return '';

  let son: Decimal;
  let kurs: Decimal;
  try {
    son = new Decimal(q);
    kurs = new Decimal(k);
  } catch {
    return '';
  }

  if (!son.isFinite() || !kurs.isFinite()) return '';
  if (son.lessThan(0) || kurs.lessThanOrEqualTo(0)) return '';

  const natija =
    yonalish === 'USD_DAN_SOMGA' ? son.times(kurs) : son.dividedBy(kurs);

  /**
   * ⚠️ So'm — butun tiyingacha (2 xona). Dollar ham 2 xona:
   *    «12.3456 $» deb ko'rsatish egasini chalg'itadi, u bunday
   *    aniqlikda o'ylamaydi.
   */
  return natija.toDecimalPlaces(PUL_KASR_XONASI, Decimal.ROUND_HALF_UP).toFixed(
    PUL_KASR_XONASI,
  );
}

/**
 * TZ 5.4 — «Ustama = (sotuv narxi − tannarx) ÷ tannarx».
 *
 * ⚠️ Ikkala narx BIR VALYUTADA bo'lishi shart (1.3-invariant).
 *    Har xil bo'lsa `null` — noto'g'ri foiz ko'rsatgandan ko'ra
 *    hech narsa ko'rsatmagan yaxshi.
 *
 * ⚠️ Bu yerdagi tannarx — KUTILAYOTGAN narx. Haqiqiy ustama
 *    kirim hujjatidan hisoblanadi (7.8). Bu faqat kartochkada
 *    «taxminan qancha» degan javob.
 */
export function ustamaFoizi(
  kelishNarx: string,
  kelishValyuta: string,
  sotuvNarx: string,
  sotuvValyuta: string,
): number | null {
  if (kelishValyuta !== sotuvValyuta) return null;

  const kelish = kelishNarx.trim();
  const sotuv = sotuvNarx.trim();
  if (kelish === '' || sotuv === '') return null;

  let t: Decimal;
  let s: Decimal;
  try {
    t = new Decimal(kelish);
    s = new Decimal(sotuv);
  } catch {
    return null;
  }

  // Nolga bo'linish — tannarx 0 bo'lsa ustama ma'nosiz
  if (!t.isFinite() || !s.isFinite() || t.lessThanOrEqualTo(0)) return null;

  return s.minus(t).dividedBy(t).times(100).toDecimalPlaces(1).toNumber();
}

// ─── Narx jufti: $ va so'm bir vaqtda ─────────────────────────────────────

export interface NarxJufti {
  readonly dollar: string;
  readonly som: string;
}

/** Qaysi katak tahrirlandi. */
export type NarxManbasi = 'DOLLAR' | 'SOM' | 'KURS';

/**
 * Ikkala katakning yangi holati.
 *
 * ⚠️ `yaxlitlangan` — «so'm narxini qo'lda yaxlitlab oldim» degani.
 *
 *    Misol: 50 $ × 11 900 = 595 000. Egasi 600 000 ga yaxlitlamoqchi.
 *    Agar bog'liqlik saqlansa, 600 000 yozilishi bilan $ 50.42 ga
 *    o'zgarib ketardi va egasi «men 50 dollar deb yozgan edim-ku»
 *    deb hayron qolardi.
 *
 *    Shuning uchun yaxlitlash yoqilganda IKKALA katak ham qotadi:
 *    so'm — egasi yozgan raqam, $ — u qayerdan kelgani.
 *
 * ⚠️ Yaxlitlangan narx SO'MDA saqlanadi. Aks holda kurs o'zgarganda
 *    600 000 jimgina 605 000 bo'lib ketardi — egasi esa uni ataylab
 *    qotirgan edi.
 */
export function narxJuftiniYangila(
  joriy: NarxJufti,
  manba: NarxManbasi,
  qiymat: string,
  kurs: string,
  yaxlitlangan: boolean,
): NarxJufti {
  if (manba === 'DOLLAR') {
    if (yaxlitlangan) return { dollar: qiymat, som: joriy.som };
    return { dollar: qiymat, som: hamrohQiymat(qiymat, kurs, 'USD_DAN_SOMGA') };
  }

  if (manba === 'SOM') {
    if (yaxlitlangan) return { dollar: joriy.dollar, som: qiymat };
    return { dollar: hamrohQiymat(qiymat, kurs, 'SOM_DAN_USDGA'), som: qiymat };
  }

  /**
   * Kurs o'zgardi.
   *
   * ⚠️ Yaxlitlangan bo'lsa hech narsa qayta hisoblanmaydi: so'm narxi
   *    egasi qotirgan raqam, uni kurs o'zgartirmaydi.
   */
  if (yaxlitlangan) return joriy;
  return { dollar: joriy.dollar, som: hamrohQiymat(joriy.dollar, qiymat, 'USD_DAN_SOMGA') };
}

/**
 * Bazaga qaysi raqam va qaysi valyuta yoziladi.
 *
 * ⚠️ Faqat BITTASI saqlanadi (1.3-invariant). Ikkinchisi — ekranda
 *    ko'rish uchun.
 */
export function saqlanadiganNarx(
  jufti: NarxJufti,
  valyuta: string,
  yaxlitlangan: boolean,
): { readonly narx: string; readonly valyuta: string } {
  // Yaxlitlangan narx doim so'mda qotadi
  if (yaxlitlangan) return { narx: jufti.som, valyuta: 'SOM' };
  if (valyuta === 'USD') return { narx: jufti.dollar, valyuta: 'USD' };
  return { narx: jufti.som, valyuta: 'SOM' };
}
