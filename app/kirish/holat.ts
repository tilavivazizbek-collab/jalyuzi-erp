/**
 * Kirish formasi holati.
 *
 * `'use server'` faylidan ALOHIDA: Next.js qoidasi bo'yicha u faqat async
 * funksiya eksport qila oladi, konstanta eksport qilinsa qurish yiqiladi.
 */

export interface KirishHolati {
  readonly xato: string | null;
  readonly telefon: string;
}

export const BOSHLANGICH_HOLAT: KirishHolati = { xato: null, telefon: '' };
