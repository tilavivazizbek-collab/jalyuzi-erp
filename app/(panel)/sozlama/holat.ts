/**
 * Forma holati — `amal.ts` dan ALOHIDA.
 *
 * ⚠️ `'use server'` fayli FAQAT async funksiya eksport qila oladi
 *    (kurs ekranida shu xato sahifani yiqitgan edi).
 */

import type { KiritilganQiymatlar, QaytarilganKirim } from '../forma-yordamchi';

export interface SozlamaHolati extends QaytarilganKirim {
  readonly xato: string | null;
  readonly saqlandi: boolean;
  readonly kiritilgan?: KiritilganQiymatlar | null;
}

export const BOSH_SOZLAMA_HOLATI: SozlamaHolati = { xato: null, saqlandi: false };
