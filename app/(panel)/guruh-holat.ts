/** `'use server'` faylidan alohida — u faqat async funksiya eksport qiladi. */

import type { YaratilganYozuv } from './modal-holat';

export interface GuruhHolati {
  readonly xato: string | null;
  readonly yaratildi?: YaratilganYozuv | null;
}

export const BOSH_GURUH_HOLATI: GuruhHolati = { xato: null, yaratildi: null };
