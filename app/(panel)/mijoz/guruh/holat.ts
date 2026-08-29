/** Mijoz guruhi formasining holati — `'use server'` faylidan alohida. */

import {
  FORMA_XATO_XABARI,
  maydonXatolari,
  type MaydonXatolari,
  type QaytarilganKirim,
} from '../../forma-yordamchi';
import type { YaratilganYozuv } from '../../modal-holat';

export interface GuruhFormaHolati extends QaytarilganKirim {
  readonly xato: string | null;
  readonly maydonXatolari: MaydonXatolari;
  /** Modalda yaratilgan yozuv — sahifada har doim yo'q */
  readonly yaratildi?: YaratilganYozuv | null;
}

export const BOSH_HOLAT: GuruhFormaHolati = { xato: null, maydonXatolari: {} };

/** Forma qaysi maydonlarni yuboradi — Zod sxemasi bilan mos */
export const GURUH_MAYDONLARI = ['nom', 'offsetTuri', 'offsetQiymat', 'izoh'];

export function xatolarniYig(
  xatolar: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[],
): GuruhFormaHolati {
  return { xato: FORMA_XATO_XABARI, maydonXatolari: maydonXatolari(xatolar) };
}
