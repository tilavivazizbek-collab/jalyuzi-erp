/** `'use server'` faylidan alohida — u faqat async funksiya eksport qila oladi. */

import type { MaydonXatolari } from '../../forma-yordamchi';

export interface InvHolati {
  readonly xato: string | null;
  readonly maydonlar: MaydonXatolari;
  /** 2.5-invariant — qoldiq manfiyga tushgan bo'laklar */
  readonly manfiyQoldiq: readonly string[];
}

export const BOSH_HOLAT: InvHolati = { xato: null, maydonlar: {}, manfiyQoldiq: [] };
