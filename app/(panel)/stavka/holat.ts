import type { MaydonXatolari, QaytarilganKirim } from '../forma-yordamchi';

export interface StavkaHolati extends QaytarilganKirim {
  readonly xato: string | null;
  readonly maydonlar: MaydonXatolari;
  readonly saqlandi: boolean;
}

export const BOSH_STAVKA_HOLATI: StavkaHolati = {
  xato: null,
  maydonlar: {},
  saqlandi: false,
};
