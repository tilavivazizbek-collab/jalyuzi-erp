/**
 * lib/kirish/joriy.ts — QISM 1 §9.4
 *
 * «Faqat interfeysda yashirish yetarli emas — server tomonda ham majburiy.»
 *
 * Har himoyalangan sahifa va har server amali shu yerdan boshlanadi.
 */

import { redirect } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { sessiyaCookieOl } from '@/lib/kirish/cookie';
import { sessiyaniTekshir } from '@/lib/amal/kirish';
import { ruxsatTekshir, type Foydalanuvchi, type Nishon } from '@/lib/ruxsat/tekshir';
import type { RuxsatKod } from '@/lib/ruxsat/kodlar';
import { BiznesXato } from '@/lib/xato';

export const KIRISH_YOLI = '/kirish';

/**
 * Joriy foydalanuvchi yoki `null`.
 *
 * ⚠️ COOKIE GA TEGMAYDI (QARORLAR-KOD P-14). Bu funksiya sahifa
 * chizilayotganda chaqiriladi, Next.js esa o'sha payt cookie yozishni
 * taqiqlaydi. Yaroqsiz cookie shunchaki e'tiborsiz qoldiriladi —
 * u zararsiz, chunki haqiqat bazada.
 *
 * Sessiya muddati bazada suriladi (P-11) — bu baza yozuvi, cookie emas.
 */
export async function joriyFoydalanuvchi(): Promise<Foydalanuvchi | null> {
  const token = await sessiyaCookieOl();
  if (token === null || token === '') return null;

  const natija = await sessiyaniTekshir(ulanishOl(), token);
  return natija?.foydalanuvchi ?? null;
}

/** Kirmagan bo'lsa kirish sahifasiga yuboradi. */
export async function kirganBolishiShart(): Promise<Foydalanuvchi> {
  const f = await joriyFoydalanuvchi();
  if (f === null) redirect(KIRISH_YOLI);
  return f;
}

/**
 * Ruxsatni SERVER tomonda talab qiladi (§9.4).
 *
 * ```ts
 * export async function kassaChiqim(input) {
 *   await ruxsatTalab('kassa.chiqim');
 *   ...
 * }
 * ```
 */
export async function ruxsatTalab(kod: RuxsatKod, nishon: Nishon = {}): Promise<Foydalanuvchi> {
  const f = await kirganBolishiShart();
  const natija = ruxsatTekshir(f, kod, nishon);
  if (!natija.ruxsat) {
    throw new BiznesXato('RUXSAT_YOQ', kod);
  }
  return f;
}
