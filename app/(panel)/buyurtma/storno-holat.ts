/**
 * Forma holati — `storno-amal.ts` dan ALOHIDA.
 *
 * ⚠️ `'use server'` fayli faqat async funksiya eksport qiladi
 *    (test: `test/sxema/use-server.test.ts`).
 */

export interface StornoHolati {
  readonly xato: string | null;
  readonly bajarildi: boolean;
  /** Sotuvchiga natija ko'rsatiladi: nechta pozitsiya, qancha qarz qaytdi */
  readonly xulosa: string | null;
}

export const BOSH_STORNO: StornoHolati = {
  xato: null,
  bajarildi: false,
  xulosa: null,
};
