/** Forma holati — `tahrir-amal.ts` dan ALOHIDA (`use-server.test.ts`). */

export interface KirimTahrirHolati {
  readonly xato: string | null;
  readonly xabar: string | null;
}

export const BOSH_KIRIM_TAHRIR: KirimTahrirHolati = { xato: null, xabar: null };
