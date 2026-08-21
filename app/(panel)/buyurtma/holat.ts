/** `'use server'` faylidan alohida — u faqat async funksiya eksport qila oladi. */

export interface TasdiqHolati {
  readonly xato: string | null;
  /** TZ 8.12 — tasdiqlangach material topilmasa */
  readonly materialgaKutmoqda: boolean;
}

export const BOSH_HOLAT: TasdiqHolati = { xato: null, materialgaKutmoqda: false };

export interface AmalHolati {
  readonly xato: string | null;
  readonly bajarildi: boolean;
}

export const BOSH_AMAL: AmalHolati = { xato: null, bajarildi: false };
