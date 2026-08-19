/** `'use server'` faylidan alohida — u faqat async funksiya eksport qila oladi. */

export interface KonstruktorHolati {
  readonly xato: string | null;
  /** TZ 4.5 — nuqsonlar ro'yxati, har biri tushunarli jumla */
  readonly nuqsonlar: readonly string[];
}

export const BOSH_HOLAT: KonstruktorHolati = { xato: null, nuqsonlar: [] };
