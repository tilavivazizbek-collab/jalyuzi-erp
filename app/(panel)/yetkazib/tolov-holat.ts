/**
 * Forma holati — `tolov-amal.ts` dan ALOHIDA.
 *
 * ⚠️ `'use server'` fayli faqat async funksiya eksport qiladi.
 */

export interface YetkazibTolovHolati {
  readonly xato: string | null;
  readonly saqlandi: boolean;
}

export const BOSH_TOLOV_HOLATI: YetkazibTolovHolati = { xato: null, saqlandi: false };
