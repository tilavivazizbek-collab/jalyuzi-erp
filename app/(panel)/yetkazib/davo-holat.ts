/**
 * Forma holati — `davo-amal.ts` dan ALOHIDA.
 *
 * ⚠️ `'use server'` fayli faqat async funksiya eksport qiladi
 *    (test: `test/sxema/use-server.test.ts`).
 */

export interface DavoHolati {
  readonly xato: string | null;
  readonly bajarildi: boolean;
  /** Nima bo'lganini sotuvchiga aytadi — qarz kamaydimi yoki xarajat */
  readonly xabar: string | null;
}

export const BOSH_DAVO: DavoHolati = { xato: null, bajarildi: false, xabar: null };
