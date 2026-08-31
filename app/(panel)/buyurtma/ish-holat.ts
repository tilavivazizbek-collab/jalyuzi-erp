/**
 * Forma holati — `ish-amal.ts` dan ALOHIDA.
 *
 * ⚠️ `'use server'` fayli faqat async funksiya eksport qiladi
 *    (test: `test/sxema/use-server.test.ts`).
 */

export interface IshHolati {
  readonly xato: string | null;
}

export const BOSH_ISH_HOLATI: IshHolati = { xato: null };
