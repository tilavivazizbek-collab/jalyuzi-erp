/** `'use server'` faylidan alohida — u faqat async funksiya eksport qila oladi. */

export interface KassaAmalHolati {
  readonly xato: string | null;
  readonly bajarildi: boolean;
}

export const BOSH_HOLAT: KassaAmalHolati = { xato: null, bajarildi: false };

export interface KunHolatiForma {
  readonly xato: string | null;
  readonly farq: string | null;
  readonly yopildi: boolean;
}

export const BOSH_KUN: KunHolatiForma = { xato: null, farq: null, yopildi: false };
