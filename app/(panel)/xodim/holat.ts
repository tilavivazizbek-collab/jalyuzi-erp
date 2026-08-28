/** `'use server'` faylidan alohida — u faqat async funksiya eksport qiladi. */

import {
  FORMA_XATO_XABARI,
  maydonXatolari,
  type MaydonXatolari,
  type QaytarilganKirim,
} from '../forma-yordamchi';

export interface XodimHolati extends QaytarilganKirim {
  readonly xato: string | null;
  readonly maydonXatolari: MaydonXatolari;
}

export const BOSH_XODIM_HOLATI: XodimHolati = { xato: null, maydonXatolari: {} };

export function xodimXatolariniYig(
  xatolar: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[],
): XodimHolati {
  return { xato: FORMA_XATO_XABARI, maydonXatolari: maydonXatolari(xatolar) };
}
