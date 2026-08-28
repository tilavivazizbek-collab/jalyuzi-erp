/** `'use server'` faylidan alohida — u faqat async funksiya eksport qiladi. */

import {
  FORMA_XATO_XABARI,
  maydonXatolari,
  type MaydonXatolari,
  type QaytarilganKirim,
} from '../forma-yordamchi';
import type { YaratilganYozuv } from '../modal-holat';

export interface KassaYaratHolati extends QaytarilganKirim {
  readonly xato: string | null;
  readonly maydonXatolari: MaydonXatolari;
  /** Modalda yaratilgan kassa — sahifada har doim yo'q */
  readonly yaratildi?: YaratilganYozuv | null;
}

export const BOSH_KASSA_HOLATI: KassaYaratHolati = {
  xato: null,
  maydonXatolari: {},
  yaratildi: null,
};

export function kassaXatolariniYig(
  xatolar: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[],
): KassaYaratHolati {
  return {
    xato: FORMA_XATO_XABARI,
    maydonXatolari: maydonXatolari(xatolar),
    yaratildi: null,
  };
}
