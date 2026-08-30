/** Forma holati — 'use server' faylidan alohida (u faqat async funksiya eksport qiladi). */

import {
  FORMA_XATO_XABARI,
  maydonXatolari,
  type MaydonXatolari,
  type QaytarilganKirim,
} from '../forma-yordamchi';
import type { YaratilganYozuv } from '../modal-holat';

export interface FormaHolati extends QaytarilganKirim {
  readonly xato: string | null;
  readonly maydonXatolari: MaydonXatolari;
  /** Modalda yaratilgan yozuv — sahifada har doim yo'q */
  readonly yaratildi?: YaratilganYozuv | null;
  /**
   * «Omborda hozir bor» bo'limining xatolari.
   *
   * ⚠️ Alohida turadi: uning maydonlari material sxemasida yo'q
   *    va nomlari to'qnashib ketishi mumkin edi («izoh»).
   */
  readonly zahiraXatolari?: MaydonXatolari;
}

export const BOSH_HOLAT: FormaHolati = { xato: null, maydonXatolari: {} };

export function xatolarniYig(
  xatolar: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[],
): FormaHolati {
  return { xato: FORMA_XATO_XABARI, maydonXatolari: maydonXatolari(xatolar) };
}
