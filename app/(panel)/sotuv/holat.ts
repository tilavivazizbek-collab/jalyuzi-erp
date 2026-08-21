/** `'use server'` faylidan alohida — u faqat async funksiya eksport qila oladi. */

import type { MaydonXatolari } from '../forma-yordamchi';

export interface SotuvHolati {
  readonly xato: string | null;
  readonly maydonlar: MaydonXatolari;
  /** Q-03 · TZ 8.12 — materialga kutayotgan pozitsiyalar */
  readonly materialgaKutmoqda: readonly number[];
  readonly buyurtmaRaqam: string | null;
}

export const BOSH_HOLAT: SotuvHolati = {
  xato: null,
  maydonlar: {},
  materialgaKutmoqda: [],
  buyurtmaRaqam: null,
};
