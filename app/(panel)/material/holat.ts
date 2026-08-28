/** Forma holati — 'use server' faylidan alohida (u faqat async funksiya eksport qiladi). */

import { FORMA_XATO_XABARI, maydonXatolari, type MaydonXatolari } from '../forma-yordamchi';
import type { YaratilganYozuv } from '../modal-holat';

export interface FormaHolati {
  readonly xato: string | null;
  readonly maydonXatolari: MaydonXatolari;
  /** Modalda yaratilgan yozuv — sahifada har doim yo'q */
  readonly yaratildi?: YaratilganYozuv | null;
}

export const BOSH_HOLAT: FormaHolati = { xato: null, maydonXatolari: {} };

export function xatolarniYig(
  xatolar: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[],
): FormaHolati {
  return { xato: FORMA_XATO_XABARI, maydonXatolari: maydonXatolari(xatolar) };
}
