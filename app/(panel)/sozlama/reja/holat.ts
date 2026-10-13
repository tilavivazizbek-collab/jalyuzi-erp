/**
 * Rejalar formasi holati — `amal.ts` dan ALOHIDA (`'use server'` fayli
 * faqat async funksiya eksport qila oladi).
 */

export interface RejaHolati {
  readonly xato: string | null;
  readonly xabar: string | null;
  /** Har yuborishda oshadi — React 19 maydonlarni tozalagach `defaultValue` qayta qo'llansin */
  readonly urinish: number;
}

export const BOSH_REJA_HOLATI: RejaHolati = { xato: null, xabar: null, urinish: 0 };
