/** `'use server'` faylidan alohida — u faqat async funksiya eksport qila oladi. */

export interface NarxHolati {
  readonly xato: string | null;
  /** Har biri tushunarli jumla: «0.5–1 kv.m oralig'iga narx qo'yilmagan» */
  readonly nuqsonlar: readonly string[];
  readonly saqlandi: boolean;
}

export const BOSH_HOLAT: NarxHolati = { xato: null, nuqsonlar: [], saqlandi: false };
