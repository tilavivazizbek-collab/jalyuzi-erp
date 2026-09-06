/**
 * lib/domain/mijoz.ts — TZ 6 · Q-26 · 2.1 · 2.2-invariant
 *
 * Mijoz qoidalari. Bazaga tegmaydi (QISM 1 §5.1).
 *
 * Q-26 — mijoz va uning QARZI **umumiy**, filialga bog'lanmagan:
 * «aks holda bir filialda qarzdor, boshqasida toza» (20.3).
 */

import {
  dollar,
  kattami,
  nolmi,
  ogir,
  qosh,
  som,
  type Dollar,
  type Kurs,
  type Som,
} from '@/lib/domain/pul';
import type { Offset } from '@/lib/domain/narx';
import { telefonTeng } from '@/lib/domain/telefon';

export const MIJOZ_TURLARI = ['ODDIY', 'B2B'] as const;
export type MijozTuri = (typeof MIJOZ_TURLARI)[number];

// ─── 6.4 · Qarz limiti ────────────────────────────────────────────────────

/**
 * Mijoz qarzi IKKI valyutada alohida turadi (6.4).
 * Balans manfiy — qarz, musbat — avans (6.7).
 */
export interface Qarz {
  readonly som: Som;
  readonly dollar: Dollar;
}

export interface LimitHolati {
  /** Ikkala valyuta so'mga keltirilgan yig'indi */
  readonly jamiSomda: Som;
  readonly limit: Som | null;
  readonly oshganmi: boolean;
}

/**
 * TZ 6.4 — «Limit DOIM so'mda belgilanadi. Limitni tekshirishda dollar qarzi
 * JORIY kursda so'mga o'girilib qo'shiladi.»
 *
 * ```
 * 5 000 000 + (150 × 12 650) = 6 897 500
 * limit: 6 500 000  →  limitdan oshgan
 * ```
 *
 * ⚠️ Ma'lum oqibat (TZ da ochiq yozilgan): kurs o'zgarganda bu son ham
 * o'zgaradi va mijoz hech narsa olmasdan «limitdan oshgan» ro'yxatiga
 * tushishi mumkin. Bu ONGLI qabul qilingan xavf.
 */
export function limitHolati(qarz: Qarz, limit: Som | null, joriyKurs: Kurs): LimitHolati {
  const jamiSomda = qosh(qarz.som, ogir(qarz.dollar, joriyKurs));
  return {
    jamiSomda,
    limit,
    oshganmi: limit === null ? false : kattami(jamiSomda, limit),
  };
}

/**
 * TZ 6.4 — «Limitdan oshsa sotuvchi mustaqil qaror qabul qiladi,
 * tizim BLOKLAMAYDI.» Faqat ogohlantirish chiqadi.
 */
export const limitBloklaydimi = (): boolean => false;

/** TZ 3.10 — «Mahsulot qarzga berilayotgan bo'lsa mijoz tanlash majburiy.» */
export function mijozMajburiymi(toliqTolandimi: boolean): boolean {
  return !toliqTolandimi;
}

// ─── 6.5 · Dublikat nazorati ──────────────────────────────────────────────

export interface MavjudMijoz {
  readonly id: number;
  readonly ism: string;
  readonly telefon: string;
}

export type DublikatSababi = 'TELEFON' | 'ISM';

export interface DublikatNatijasi {
  readonly dublikatmi: boolean;
  readonly sabab: DublikatSababi | null;
  readonly mavjud: MavjudMijoz | null;
}

const ismNormalla = (ism: string): string => ism.trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * TZ 6.5 — «Bir xil telefon YOKI bir xil ism kiritilsa saqlanmaydi.»
 * Ogohlantirish oynasi chiqadi va uch yo'l taklif qilinadi.
 *
 * Telefon avval tekshiriladi — u ishonchliroq belgi.
 */
export function dublikatTekshir(
  ism: string,
  telefon: string,
  mavjudlar: readonly MavjudMijoz[],
  ozId: number | null = null,
): DublikatNatijasi {
  const i = ismNormalla(ism);

  for (const m of mavjudlar) {
    if (m.id === ozId) continue;
    // Taqqoslash `lib/domain/telefon.ts` da — u bilan bazaga yoziladigan
    // ko'rinish bitta joyda turadi (§2.2). Ikki xil normallashtirish
    // bo'lsa dublikat sirg'alib o'tib ketardi.
    if (telefonTeng(m.telefon, telefon)) {
      return { dublikatmi: true, sabab: 'TELEFON', mavjud: m };
    }
  }

  for (const m of mavjudlar) {
    if (m.id === ozId) continue;
    if (ismNormalla(m.ism) === i) {
      return { dublikatmi: true, sabab: 'ISM', mavjud: m };
    }
  }

  return { dublikatmi: false, sabab: null, mavjud: null };
}

// ─── 6.6 · Holati ─────────────────────────────────────────────────────────

export interface HolatTekshiruvi {
  readonly qarz: Qarz;
  readonly buyurtmaBormi: boolean;
  readonly tolovBormi: boolean;
}

/** 2.1-invariant — harakati bo'lmagan mijoz butunlay o'chiriladi (6.6). */
export function ochirilsinmi(t: HolatTekshiruvi): boolean {
  return !t.buyurtmaBormi && !t.tolovBormi;
}

/**
 * TZ 6.6 — «Qarzi 0 dan farq qilsa nofaol qilish BLOKLANADI.»
 * Aks holda qarz ro'yxatdan g'oyib bo'ladi.
 */
export function nofaolQilinsinmi(qarz: Qarz): boolean {
  return nolmi(qarz.som) && nolmi(qarz.dollar);
}

// ─── 6.10 · Umidsiz qarz ──────────────────────────────────────────────────

export type QaytganTolovTuri = 'BALANSGA' | 'BOSHQA_KIRIM';

/**
 * TZ 6.10 — «Mijoz keyin kelib to'lasa, pul kassaga "boshqa kirim" sifatida
 * kiritiladi. Mijoz kartochkasida "hisobdan chiqarilgan qarz qaytdi" deb
 * ko'rinadi, lekin BALANSIGA QO'SHILMAYDI — qarz allaqachon yopilgan.»
 *
 * Balansga qo'shilsa mijoz avansda ko'rinib qolardi.
 */
export function qaytganTolovQayerga(hisobdanChiqarilganmi: boolean): QaytganTolovTuri {
  return hisobdanChiqarilganmi ? 'BOSHQA_KIRIM' : 'BALANSGA';
}

// ─── 6.9 · Qarzni to'lash ─────────────────────────────────────────────────

export interface OchiqBuyurtma {
  readonly id: number;
  readonly sana: Date;
  readonly qoldiq: Som;
}

/**
 * TZ 6.9 — «Standart holatda ENG ESKI buyurtmadan yopiladi.
 * Sotuvchi boshqasini tanlashi yoki umumiy balansdan yopishi mumkin.»
 */
export function yopishNavbati(buyurtmalar: readonly OchiqBuyurtma[]): OchiqBuyurtma[] {
  return [...buyurtmalar]
    .filter((b) => !nolmi(b.qoldiq))
    .sort((a, b) => a.sana.getTime() - b.sana.getTime() || a.id - b.id);
}

/**
 * TZ 6.9 — «Bitta operatsiyada bitta valyuta. Mijozda so'm ham, dollar ham
 * qarz bo'lsa — ikkita alohida yozuv.»
 */
export function bittaValyutamiTekshir(valyutalar: readonly string[]): boolean {
  return new Set(valyutalar).size <= 1;
}

// ─── 6.11 · Telegram ID ───────────────────────────────────────────────────

/**
 * TZ 6.11 — «Bo'sh bo'lsa ro'yxatda belgi chiqadi (qo'ng'iroq qiling) —
 * bunday mijozga bildirishnoma yuborib bo'lmaydi.»
 */
export const xabarYuborilsinmi = (telegramId: number | null): boolean => telegramId !== null;

// ─── 6.3 · Mijoz offseti ──────────────────────────────────────────────────

/**
 * TZ 6.3 — mijoz kartochkasidagi offsetni narx turiga o'giradi.
 *
 * ⚠️ Bu yerda turgani bejiz emas: offsetni sotuv ekrani ham, bot ham
 *    qo'llaydi (13.5). Ikki joyda yozilsa mijoz saytda bir narx,
 *    botda boshqa narx ko'rardi (§2.2).
 *
 * ⚠️ `USD` offseti JORIY kursda so'mga o'giriladi.
 *
 *    Kurs PARAMETR bo'lib keladi (§3.2) — funksiya uni o'zi
 *    izlamaydi. Kurs berilmasa offset qo'llanmaydi va `null`
 *    qaytadi: jimgina noto'g'ri narx chiqarishdan ko'ra
 *    ko'rinadigan cheklov yaxshi.
 *
 *    ⚠️ 2026-09-05 gacha USD offseti kurs berilgan-berilmaganidan
 *       qat'i nazar TASHLAB YUBORILARDI. Mijoz kartochkasida
 *       «−10 $» turar, forma «joriy kurs ishlatiladi» deb va'da
 *       qilar, mijoz esa standart narxda olardi — hech qanday
 *       ogohlantirishsiz.
 */
export function mijozOffseti(
  m: OffsetManbasi | null,
  joriyKurs: Kurs | null = null,
): Offset | null {
  if (m === null || m.offsetTuri === null || m.offsetQiymat === null) return null;
  if (m.offsetTuri === 'FOIZ') return { turi: 'FOIZ', foiz: Number(m.offsetQiymat) };
  if (m.offsetTuri === 'SOM') return { turi: 'SOM', summa: som(m.offsetQiymat) };
  if (m.offsetTuri === 'USD') {
    if (joriyKurs === null) return null; // kurs yo'q — offset qo'llanmaydi
    return { turi: 'SOM', summa: ogir(dollar(m.offsetQiymat), joriyKurs) };
  }
  return null;
}

/**
 * TZ 6.3 — mijozga AMALDA qo'llanadigan chegirma.
 *
 * ⚠️ SHAXSIY CHEGIRMA GURUHNIKIDAN USTUN.
 *
 *    «Ulgurji −10%» guruhidagi mijozga alohida −15% qo'yilgan
 *    bo'lsa, unga 15% ishlaydi. Aniqrog'i yutadi: guruh — umumiy
 *    qoida, kartochkadagi yozuv esa aynan shu mijoz uchun
 *    ataylab qo'yilgan istisno.
 *
 * ⚠️ IKKITASI QO'SHILMAYDI. −10% guruh va −15% shaxsiy −25%
 *    bermaydi. Qo'shilsa, guruh foizini o'zgartirgan odam
 *    o'nlab mijozning narxini bilmasdan siljitgan bo'lardi.
 *
 * ⚠️ Bu qoida bir joyda turishi shart: sotuv ekrani ham, bot ham
 *    (13.5) shu funksiyani chaqiradi. Ikki joyda yozilsa mijoz
 *    saytda bir narx, botda boshqa narx ko'rardi (§2.2).
 */
export function amaldagiOffset(
  mijoz: OffsetManbasi | null,
  guruh: OffsetManbasi | null,
  joriyKurs: Kurs | null = null,
): Offset | null {
  /**
   * ⚠️ Shaxsiy offset BOR bo'lsa, u QO'LLAB BO'LMASA HAM guruhnikiga
   *    o'tilmaydi (6.3 — «shaxsiy ustun»).
   *
   *    Ilgari `??` ishlatilardi: kurssiz «−10 $» shaxsiy chegirmasi
   *    jimgina guruhning «−5 000 so'm» iga aylanib ketardi. Mijoz
   *    na kartochkasidagi chegirmani, na to'liq narxni olardi —
   *    uchinchi, hech kim kutmagan raqamni olardi.
   */
  return offsetBormi(mijoz)
    ? mijozOffseti(mijoz, joriyKurs)
    : mijozOffseti(guruh, joriyKurs);
}

/** Kartochkada offset yozilganmi — qo'llanishidan qat'i nazar */
function offsetBormi(m: OffsetManbasi | null): boolean {
  return m !== null && m.offsetTuri !== null && m.offsetQiymat !== null;
}

/**
 * Offset bor, lekin QO'LLANMAYDI — sotuvchiga aytish uchun.
 *
 * ⚠️ TZ 6.3 izohi «sotuvchiga ochiq aytiladi» der edi, lekin buni
 *    aytadigan hech narsa yo'q edi. Endi ekran shu funksiyaga
 *    qarab ogohlantirish ko'rsatadi.
 */
export function offsetQollanmadimi(
  mijoz: OffsetManbasi | null,
  guruh: OffsetManbasi | null,
  joriyKurs: Kurs | null,
): boolean {
  const usdmi = (m: OffsetManbasi | null): boolean =>
    offsetBormi(m) && m?.offsetTuri === 'USD';

  if (joriyKurs !== null) return false;
  // Mijozniki ustun: uniki USD bo'lsa guruhnikiga o'tilmaydi
  return usdmi(mijoz) || (!offsetBormi(mijoz) && usdmi(guruh));
}

export interface OffsetManbasi {
  readonly offsetTuri: string | null;
  readonly offsetQiymat: string | null;
}
