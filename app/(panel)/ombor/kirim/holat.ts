/** `'use server'` faylidan alohida — u faqat async funksiya eksport qila oladi. */

export interface UstamaOgohi {
  readonly materialNomi: string;
  readonly ustamaFoiz: number;
  readonly chegara: number;
}

export interface KirimHolati {
  readonly xato: string | null;
  /** TZ 7.9 — ustama chegaradan past, lekin hujjat saqlangan */
  readonly ogohlantirishlar: readonly UstamaOgohi[];
  readonly saqlandi: boolean;
}

export const BOSH_HOLAT: KirimHolati = {
  xato: null,
  ogohlantirishlar: [],
  saqlandi: false,
};
