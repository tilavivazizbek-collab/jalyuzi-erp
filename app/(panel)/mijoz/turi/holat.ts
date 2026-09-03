/**
 * Forma holati — `amal.ts` dan ALOHIDA
 * (`'use server'` faqat async funksiya eksport qiladi).
 */

import type { MaydonXatolari } from '../../forma-yordamchi';
import type { YaratilganYozuv } from '../../modal-holat';

export interface TurHolati {
  readonly xato: string | null;
  readonly maydonlar: MaydonXatolari;
  readonly yaratildi?: YaratilganYozuv | null;
}

export const BOSH_TUR_HOLATI: TurHolati = { xato: null, maydonlar: {} };
