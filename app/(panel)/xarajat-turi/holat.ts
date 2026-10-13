/** `'use server'` faylidan alohida — u faqat async funksiya eksport qiladi. */

import type { YaratilganYozuv } from '../modal-holat';

export interface XarajatTuriHolati {
  readonly xato: string | null;
  readonly yaratildi?: YaratilganYozuv | null;
}

export const BOSH_XARAJAT_TURI_HOLATI: XarajatTuriHolati = { xato: null, yaratildi: null };
