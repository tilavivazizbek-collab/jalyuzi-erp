/** `'use server'` faylidan alohida — u faqat async funksiya eksport qila oladi. */

export interface KassaAmalHolati {
  readonly xato: string | null;
  readonly bajarildi: boolean;
}

export const BOSH_HOLAT: KassaAmalHolati = { xato: null, bajarildi: false };

export interface KunHolatiForma {
  readonly xato: string | null;
  readonly farq: string | null;
  readonly yopildi: boolean;
}

export const BOSH_KUN: KunHolatiForma = { xato: null, farq: null, yopildi: false };

export interface IshHaqiHolati {
  readonly xato: string | null;
  /** TZ 10.5 — balansdan qancha yechildi (valyuta boshqa bo'lsa) */
  readonly balansdan: string | null;
  readonly bajarildi: boolean;
}

export const BOSH_ISH_HAQI: IshHaqiHolati = {
  xato: null,
  balansdan: null,
  bajarildi: false,
};

export interface AyirboshlashHolati {
  readonly xato: string | null;
  /** Kassaga haqiqatda kirgan summa (komissiyadan keyin) */
  readonly kirgan: string | null;
  readonly bajarildi: boolean;
}

export const BOSH_AYIRBOSHLASH: AyirboshlashHolati = {
  xato: null,
  kirgan: null,
  bajarildi: false,
};
