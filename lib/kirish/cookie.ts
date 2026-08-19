/**
 * lib/kirish/cookie.ts — QISM 1 §8, §16
 *
 * Sessiya tokeni cookie da yuriladi.
 *
 * `httpOnly` — JavaScript o'qiy olmaydi, ya'ni sayt ichiga tushgan begona
 * skript tokenni o'g'irlay olmaydi.
 * `sameSite: lax` — boshqa saytdan yuborilgan so'rovga cookie qo'shilmaydi (CSRF).
 * `secure` — HTTPS majburiy (§16), loqal ishlab chiqishda o'chiriladi.
 *
 * ⚠️ COOKIE FAQAT SERVER AMALIDA YOZILADI (QARORLAR-KOD P-14).
 *
 * Next.js sahifa chizilayotganda cookie o'zgartirishni taqiqlaydi. Shuning
 * uchun `qoy` va `ochir` faqat `'use server'` amallaridan chaqiriladi:
 * kirish va chiqish. Sahifa chizilayotganda faqat `ol` ishlatiladi.
 */

import { cookies } from 'next/headers';

export const SESSIYA_COOKIE = 'jalyuzi_sessiya';

/**
 * Cookie umri sessiyanikidan UZUN.
 *
 * Haqiqiy muddat bazada turadi (§8 — «JWT emas, bazadagi sessiya jadvali»).
 * Cookie faqat tokenni tashiydi; bazada sessiya tugagan yoki bekor qilingan
 * bo'lsa token baribir ishlamaydi.
 *
 * Shu sabab muddatni har so'rovda cookie ga qayta yozish shart emas —
 * uzayish bazada bo'ladi (P-11). Bu §8 ning «har so'rovda uzayadi»
 * talabini buzmaydi: faol xodimning sessiyasi hech qachon tugamaydi,
 * 30 kun ishlamagani esa qaytadan kiradi.
 */
const COOKIE_UMRI_SONIYA = 400 * 86_400; // brauzerlar qabul qiladigan eng uzun muddat

interface Sozlama {
  readonly httpOnly: true;
  readonly secure: boolean;
  readonly sameSite: 'lax';
  readonly path: string;
  readonly maxAge: number;
}

function sozlama(maxAge: number): Sozlama {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  };
}

/** Sahifa chizilayotganda ham xavfsiz — faqat o'qiydi. */
export async function sessiyaCookieOl(): Promise<string | null> {
  const saqlagich = await cookies();
  return saqlagich.get(SESSIYA_COOKIE)?.value ?? null;
}

/** ⚠️ Faqat server amalidan (`'use server'`) chaqiriladi. */
export async function sessiyaCookieQoy(token: string): Promise<void> {
  const saqlagich = await cookies();
  saqlagich.set(SESSIYA_COOKIE, token, sozlama(COOKIE_UMRI_SONIYA));
}

/** ⚠️ Faqat server amalidan (`'use server'`) chaqiriladi. */
export async function sessiyaCookieOchir(): Promise<void> {
  const saqlagich = await cookies();
  saqlagich.set(SESSIYA_COOKIE, '', sozlama(0));
}
