/** `'use server'` faylidan alohida — u faqat async funksiya eksport qila oladi. */

import type { MaydonXatolari } from '../../forma-yordamchi';

export interface ChiqimHolati {
  readonly xato: string | null;
  readonly maydonlar: MaydonXatolari;
}

export const BOSH_HOLAT: ChiqimHolati = { xato: null, maydonlar: {} };
