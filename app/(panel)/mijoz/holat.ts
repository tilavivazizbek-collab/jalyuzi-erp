/** `'use server'` faylidan alohida — u faqat async funksiya eksport qila oladi. */

import { FORMA_XATO_XABARI, maydonXatolari, type MaydonXatolari } from '../forma-yordamchi';

export interface DublikatMalumoti {
  readonly id: number;
  readonly ism: string;
  readonly telefon: string;
  readonly sabab: 'TELEFON' | 'ISM';
}

export interface MijozHolati {
  readonly xato: string | null;
  readonly maydonXatolari: MaydonXatolari;
  /** TZ 6.5 — mavjud mijoz ko'rsatiladi va uch yo'l taklif qilinadi */
  readonly dublikat: DublikatMalumoti | null;
}

export const BOSH_HOLAT: MijozHolati = { xato: null, maydonXatolari: {}, dublikat: null };

export function xatolarniYig(
  xatolar: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[],
): MijozHolati {
  return { xato: FORMA_XATO_XABARI, maydonXatolari: maydonXatolari(xatolar), dublikat: null };
}

export interface QarzHolati {
  readonly xato: string | null;
  readonly qolganQarz: string | null;
  readonly bajarildi: boolean;
}

export const BOSH_QARZ: QarzHolati = {
  xato: null,
  qolganQarz: null,
  bajarildi: false,
};

export interface UmidsizHolati {
  readonly xato: string | null;
  readonly bajarildi: boolean;
}

export const BOSH_UMIDSIZ: UmidsizHolati = { xato: null, bajarildi: false };
