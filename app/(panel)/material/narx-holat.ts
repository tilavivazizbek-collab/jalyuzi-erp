/** `'use server'` faylidan alohida — u faqat async funksiya eksport qila oladi. */

export interface NarxHolati {
  readonly xato: string | null;
  readonly bajarildi: boolean;
}

export const BOSH_NARX: NarxHolati = { xato: null, bajarildi: false };
