/** `'use server'` faylidan alohida — u faqat async funksiya eksport qila oladi. */

import type { MaydonXatolari } from '../forma-yordamchi';

export interface FilialHolati {
  readonly xato: string | null;
  readonly maydonlar: MaydonXatolari;
  readonly bajarildi: boolean;
}

export const BOSH_FILIAL: FilialHolati = {
  xato: null,
  maydonlar: {},
  bajarildi: false,
};
