/**
 * Forma holati — `amal.ts` dan ALOHIDA.
 *
 * ⚠️ `'use server'` fayli FAQAT async funksiya eksport qila oladi.
 *    2026-08-30: `BOSH_KURS_HOLATI` obyekti amal.ts da qolib
 *    ketgan edi va sahifa ishlab chiqarishda yiqildi:
 *    «A "use server" file can only export async functions».
 *
 *    `npm run build` buni KO'RMADI — xato faqat sahifa
 *    ochilganda chiqdi.
 */

export interface KursHolati {
  readonly xato: string | null;
  readonly saqlandi: boolean;
}

export const BOSH_KURS_HOLATI: KursHolati = { xato: null, saqlandi: false };
