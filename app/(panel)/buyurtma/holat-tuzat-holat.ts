/**
 * Forma holati — `holat-tuzat-amal.ts` dan ALOHIDA.
 *
 * ⚠️ `'use server'` fayli faqat async funksiya eksport qiladi
 *    (test: `test/sxema/use-server.test.ts`).
 */

export interface HolatTuzatishHolati {
  readonly xato: string | null;
  readonly bajarildi: boolean;
  /** Natija sotuvchiga aytiladi: nima nimaga o'zgardi */
  readonly xulosa: string | null;
}

export const BOSH_HOLAT_TUZATISH: HolatTuzatishHolati = {
  xato: null,
  bajarildi: false,
  xulosa: null,
};
