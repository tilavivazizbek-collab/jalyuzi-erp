/**
 * lib/domain/mijoz.ts — TZ 6 · Q-26 · 2.1 · 2.2-invariant
 *
 * Mijoz qoidalari. Bazaga tegmaydi (QISM 1 §5.1).
 *
 * Q-26 — mijoz va uning QARZI **umumiy**, filialga bog'lanmagan:
 * «aks holda bir filialda qarzdor, boshqasida toza» (20.3).
 */

import {
  kattami,
  nolmi,
  ogir,
  qosh,
  type Dollar,
  type Kurs,
  type Som,
} from '@/lib/domain/pul';
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
