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

export interface XodimQiymatlari {
  readonly ism: string;
  readonly telefon: string;
  readonly filialId: string;
  readonly ishgaKirdi: string;
  /** TZ 6.4 — chegirma chegarasi, foizda. Bo'sh — chegara yo'q */
  readonly chegirmaLimitFoiz: string;
  readonly rolIdlar: readonly number[];
}

/**
 * ⚠️ `forma.tsx` da EMAS — u `'use client'`. Server sahifasi u yerdan
 *    olgan qiymat obyekt emas, mijoz havolasi bo'lib keladi: uni
 *    `{ ...BOSH_XODIM }` qilib yoysa `rolIdlar` yo'qoladi va forma
 *    «reading 'join'» bilan yiqiladi (2026-10-04, «Yangi xodim»).
 */
export const BOSH_XODIM: XodimQiymatlari = {
  ism: '',
  telefon: '',
  chegirmaLimitFoiz: '',
  filialId: '',
  ishgaKirdi: '',
  rolIdlar: [],
};

export function xodimXatolariniYig(
  xatolar: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[],
): XodimHolati {
  return { xato: FORMA_XATO_XABARI, maydonXatolari: maydonXatolari(xatolar) };
}
