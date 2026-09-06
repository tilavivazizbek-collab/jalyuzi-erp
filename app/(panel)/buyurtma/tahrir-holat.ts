/**
 * Forma holati — `tahrir-amal.ts` dan ALOHIDA.
 *
 * ⚠️ `'use server'` fayli faqat async funksiya eksport qiladi
 *    (test: `test/sxema/use-server.test.ts`).
 */

export interface TahrirHolati {
  readonly xato: string | null;
  readonly bajarildi: boolean;
  /** Q-03 — band qayta qo'yilganda material topilmasa */
  readonly materialgaKutmoqda: boolean;
  /** Mijoz qarziga yozilgan farq — sotuvchiga ko'rsatiladi */
  readonly qarzFarqi: string | null;
}

export const BOSH_TAHRIR: TahrirHolati = {
  xato: null,
  bajarildi: false,
  materialgaKutmoqda: false,
  qarzFarqi: null,
};
